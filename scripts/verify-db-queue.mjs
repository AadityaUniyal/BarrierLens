import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

// 1. Auto-load environment variables from .env.local or .env
if (!process.env.DATABASE_URL) {
  if (fs.existsSync('.env.local')) {
    process.loadEnvFile('.env.local');
  } else if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
}

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not defined in environment, .env, or .env.local.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('===============================================================');
  console.log('  BarrierLens: Automated Neon Postgres Schema & Jobs Queue Verification');
  console.log('===============================================================\n');

  try {
    // -------------------------------------------------------------
    // Step 1: Validate pgvector extension
    // -------------------------------------------------------------
    console.log('[1/5] Validating pgvector extension in Neon Postgres...');
    const extensions = await sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';`;
    if (extensions.length === 0) {
      throw new Error('FAIL: "vector" extension is not installed in database.');
    }
    console.log(`   ✓ Extension active: "${extensions[0].extname}" (v${extensions[0].extversion})`);

    // -------------------------------------------------------------
    // Step 2: Validate all 15 BarrierLens schema tables
    // -------------------------------------------------------------
    console.log('\n[2/5] Validating all 15 BarrierLens schema tables...');
    const expectedTables = [
      'users',
      'sites',
      'flows',
      'runs',
      'states',
      'steps',
      'findings',
      'fixes',
      'jobs',
      'edges',
      'llm_calls',
      'reviews',
      'benchmark_cases',
      'benchmark_results',
      'drift_alerts'
    ];

    const currentTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    const tableSet = new Set(currentTables.map((t) => t.table_name));

    for (const tbl of expectedTables) {
      if (!tableSet.has(tbl)) {
        throw new Error(`FAIL: Expected table "${tbl}" is missing from database schema.`);
      }
      console.log(`   ✓ Table verified: "${tbl}"`);
    }

    // -------------------------------------------------------------
    // Step 3: Validate states.embedding vector(384) & HNSW index
    // -------------------------------------------------------------
    console.log('\n[3/5] Validating states.embedding vector(384) column and HNSW index...');
    const colInfo = await sql`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'states' AND column_name = 'embedding';
    `;

    if (colInfo.length === 0) {
      throw new Error('FAIL: Column "states.embedding" does not exist.');
    }
    if (colInfo[0].udt_name !== 'vector') {
      throw new Error(`FAIL: Column "states.embedding" data type is "${colInfo[0].udt_name}", expected "vector".`);
    }

    const vectorDim = await sql`
      SELECT atttypmod 
      FROM pg_attribute 
      WHERE attrelid = 'states'::regclass AND attname = 'embedding';
    `;
    const dim = Number(vectorDim[0]?.atttypmod);
    if (dim !== 384) {
      throw new Error(`FAIL: Expected vector dimension 384, found ${dim}`);
    }
    console.log(`   ✓ Column verified: states.embedding vector(384)`);

    const indexes = await sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'states' AND indexname = 'idx_states_embedding';
    `;
    if (indexes.length === 0) {
      throw new Error('FAIL: Index "idx_states_embedding" is missing on states table.');
    }
    const idxDef = indexes[0].indexdef;
    if (!idxDef.includes('USING hnsw') || !idxDef.includes('vector_cosine_ops')) {
      throw new Error(`FAIL: Index definition does not match expected HNSW cosine metric: ${idxDef}`);
    }
    console.log(`   ✓ Index verified: ${indexes[0].indexname} -> ${idxDef}`);

    // -------------------------------------------------------------
    // Step 4: Demonstrate Job Enqueue into jobs table
    // -------------------------------------------------------------
    console.log('\n[4/5] Testing Job Enqueue into "jobs" table...');
    const testPayload = {
      task: 'audit_accessibility_flow',
      origin: 'https://barrierlens.ai/demo',
      persona: 'keyboard',
      testMarker: `verify-${Date.now()}`
    };

    const enqueueResult = await sql`
      INSERT INTO jobs (type, payload, status, run_after)
      VALUES ('barrierlens_audit_task', ${JSON.stringify(testPayload)}::jsonb, 'pending', NOW())
      RETURNING id, type, payload, status, attempts, run_after;
    `;

    if (enqueueResult.length === 0) {
      throw new Error('FAIL: Job insertion failed.');
    }
    const enqueuedJob = enqueueResult[0];
    const jobId = enqueuedJob.id;
    console.log(`   ✓ Job enqueued: ID=${jobId}`);
    console.log(`     - status: "${enqueuedJob.status}"`);
    console.log(`     - type: "${enqueuedJob.type}"`);
    console.log(`     - attempts: ${enqueuedJob.attempts}`);

    // -------------------------------------------------------------
    // Step 5: Demonstrate Atomic Job Dequeue with FOR UPDATE SKIP LOCKED
    // -------------------------------------------------------------
    console.log('\n[5/5] Testing Atomic Job Dequeue via "FOR UPDATE SKIP LOCKED"...');
    const dequeueResult = await sql`
      UPDATE jobs 
      SET status = 'running', locked_at = NOW(), attempts = attempts + 1 
      WHERE id = (
        SELECT id FROM jobs 
        WHERE status = 'pending' AND run_after <= NOW() AND id = ${jobId}
        ORDER BY run_after ASC 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
      ) 
      RETURNING id, type, payload, attempts, status, locked_at;
    `;

    if (dequeueResult.length === 0) {
      throw new Error(`FAIL: Atomic dequeue with SKIP LOCKED failed to claim job ${jobId}.`);
    }

    const dequeuedJob = dequeueResult[0];
    console.log(`   ✓ Job atomically dequeued & claimed: ID=${dequeuedJob.id}`);
    console.log(`     - New status: "${dequeuedJob.status}"`);
    console.log(`     - Incremented attempts: ${dequeuedJob.attempts}`);
    console.log(`     - Locked at: ${dequeuedJob.locked_at}`);

    if (dequeuedJob.status !== 'running') {
      throw new Error(`FAIL: Expected status 'running', got '${dequeuedJob.status}'`);
    }
    if (dequeuedJob.attempts !== 1) {
      throw new Error(`FAIL: Expected attempts 1, got ${dequeuedJob.attempts}`);
    }

    // Mark job completed and verify state transition
    const completeResult = await sql`
      UPDATE jobs 
      SET status = 'completed' 
      WHERE id = ${jobId} 
      RETURNING id, status;
    `;

    if (completeResult.length === 0 || completeResult[0].status !== 'completed') {
      throw new Error(`FAIL: Could not transition job to 'completed' status.`);
    }
    console.log(`   ✓ Job marked completed: status="${completeResult[0].status}"`);

    // Cleanup test record
    await sql`DELETE FROM jobs WHERE id = ${jobId};`;
    console.log('   ✓ Test job cleaned up successfully.');

    console.log('\n===============================================================');
    console.log('VERIFICATION PASSED: Neon schema, pgvector HNSW index, and atomic SKIP LOCKED queue verified!');
    console.log('Exit code: 0');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\nVerification failed with error:', err.message);
    process.exit(1);
  }
}

main();
