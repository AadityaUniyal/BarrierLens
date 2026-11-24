import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Auto-load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const directUrl = process.env.DIRECT_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function setup() {
  console.log('====================================================');
  console.log('   BARRIERLENS - ADVANCED SUPABASE INFRASTRUCTURE    ');
  console.log('====================================================\n');

  console.log('Connecting to Supabase PostgreSQL...');
  const sql = postgres(directUrl, { ssl: 'require', prepare: false });

  // 1. SUPABASE REALTIME CONFIGURATION
  console.log('\n--- 1. Configuring Supabase Realtime ---');
  const realtimeTables = ['runs', 'steps', 'findings', 'jobs', 'agent_event_traces', 'websites'];

  for (const table of realtimeTables) {
    try {
      // Set replica identity to full so update events carry full payload
      await sql.unsafe(`ALTER TABLE "${table}" REPLICA IDENTITY FULL;`);
      console.log(`   ⚡ Set REPLICA IDENTITY FULL on '${table}'`);
    } catch (e) {
      console.log(`   Notice on replica identity for '${table}': ${e.message}`);
    }

    try {
      await sql.unsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "${table}";`);
      console.log(`   📡 Added '${table}' to supabase_realtime publication`);
    } catch (e) {
      if (e.message.includes('already in publication')) {
        console.log(`   📡 '${table}' is already in supabase_realtime publication`);
      } else {
        console.log(`   Notice adding '${table}' to publication: ${e.message}`);
      }
    }
  }

  // 2. COMPUTE: STORED PROCEDURES & VECTOR FUNCTIONS
  console.log('\n--- 2. Deploying Stored Procedures & Vector Functions ---');

  // Vector similarity search function
  console.log('   Deploying match_barrier_genomes (pgvector 768D cosine search)...');
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION match_barrier_genomes (
      query_embedding vector(768),
      match_threshold float DEFAULT 0.70,
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id text,
      finding_id text,
      finding_kind text,
      domain text,
      target_url text,
      persona text,
      similarity float,
      context jsonb,
      wcag_rules jsonb
    )
    LANGUAGE plpgsql
    STABLE
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        bg.id,
        bg.finding_id,
        bg.finding_kind,
        bg.domain,
        bg.target_url,
        bg.persona,
        1 - (bg.embedding <=> query_embedding) AS similarity,
        bg.context,
        bg.wcag_rules
      FROM barrier_genomes bg
      WHERE bg.embedding IS NOT NULL
        AND 1 - (bg.embedding <=> query_embedding) > match_threshold
      ORDER BY bg.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  `);
  console.log('   ✅ Stored procedure match_barrier_genomes created!');

  // Atomic queue locking function
  console.log('   Deploying claim_next_job (concurrency-safe queue locker)...');
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION claim_next_job (
      p_worker_id text,
      p_max_attempts int DEFAULT 3
    )
    RETURNS TABLE (
      id uuid,
      type text,
      payload jsonb,
      attempts int
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_job_id uuid;
    BEGIN
      SELECT j.id INTO v_job_id
      FROM jobs j
      WHERE j.status = 'pending'
        AND j.run_after <= NOW()
        AND j.attempts < p_max_attempts
      ORDER BY j.run_after ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1;

      IF v_job_id IS NOT NULL THEN
        UPDATE jobs
        SET
          status = 'locked',
          locked_at = NOW(),
          attempts = attempts + 1,
          updated_at = NOW()
        WHERE jobs.id = v_job_id;

        RETURN QUERY
        SELECT j.id, j.type, j.payload, j.attempts
        FROM jobs j
        WHERE j.id = v_job_id;
      END IF;
    END;
    $$;
  `);
  console.log('   ✅ Stored procedure claim_next_job created!');

  // Realtime System Stats Function
  console.log('   Deploying get_barrierlens_stats...');
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION get_barrierlens_stats()
    RETURNS jsonb
    LANGUAGE plpgsql
    STABLE
    AS $$
    DECLARE
      v_total_audits bigint;
      v_total_findings bigint;
      v_traps_found bigint;
      v_total_websites bigint;
      v_genomes_indexed bigint;
      v_result jsonb;
    BEGIN
      SELECT COUNT(*) INTO v_total_audits FROM runs;
      SELECT COUNT(*) INTO v_total_findings FROM findings;
      SELECT COUNT(*) INTO v_traps_found FROM findings WHERE kind IN ('keyboard_trap', 'focus_trap', 'trap');
      SELECT COUNT(*) INTO v_total_websites FROM websites;
      SELECT COUNT(*) INTO v_genomes_indexed FROM barrier_genomes;

      v_result := jsonb_build_object(
        'totalAudits', v_total_audits,
        'totalFindings', v_total_findings,
        'trapsFound', v_traps_found,
        'totalWebsites', v_total_websites,
        'genomesIndexed', v_genomes_indexed,
        'serverTime', NOW()
      );

      RETURN v_result;
    END;
    $$;
  `);
  console.log('   ✅ Stored procedure get_barrierlens_stats created!');

  // 3. PROVISION SUPABASE STORAGE BUCKET
  console.log('\n--- 3. Provisioning Supabase Storage Bucket ---');
  try {
    const { data: existingBuckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
    if (listErr) {
      console.warn('   Notice listing buckets:', listErr.message);
    }
    const hasArtifactBucket = existingBuckets?.some(b => b.name === 'audit-artifacts');

    if (!hasArtifactBucket) {
      console.log("   Creating 'audit-artifacts' public storage bucket...");
      const { data: created, error: createErr } = await supabaseAdmin.storage.createBucket('audit-artifacts', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/json', 'text/html', 'video/webm', 'application/pdf']
      });
      if (createErr) {
        console.warn('   Notice creating bucket:', createErr.message);
      } else {
        console.log("   ✅ Supabase Storage bucket 'audit-artifacts' created successfully!");
      }
    } else {
      console.log("   ✅ Supabase Storage bucket 'audit-artifacts' already exists and is active.");
    }
  } catch (err) {
    console.warn('   Storage provisioning error:', err.message);
  }

  // 4. VERIFY EVERYTHING
  console.log('\n--- 4. Final System Verification ---');
  const pubList = await sql`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  `;
  console.log('   📡 Active Realtime Publication Tables:');
  for (const row of pubList) {
    console.log(`      - ${row.tablename}`);
  }

  const statsTest = await sql`SELECT get_barrierlens_stats() as stats;`;
  console.log('\n   📊 Stored Procedure Test Result (get_barrierlens_stats):');
  console.log('     ', JSON.stringify(statsTest[0].stats, null, 2));

  await sql.end();
  console.log('\n====================================================');
  console.log('   🎉 SUPABASE REALTIME, COMPUTE & STORAGE COMPLETE! ');
  console.log('====================================================\n');
}

setup().catch((err) => {
  console.error('\n❌ Setup failed:', err);
  process.exit(1);
});
