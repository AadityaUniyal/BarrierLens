import postgres from 'postgres';
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
const sql = postgres(directUrl, { ssl: 'require', prepare: false });

async function fixStoragePolicies() {
  console.log('Adding storage RLS policies for audit-artifacts...');

  // 1. SELECT policy
  try {
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access audit-artifacts'
        ) THEN
          CREATE POLICY "Public Access audit-artifacts"
          ON storage.objects FOR SELECT
          TO public
          USING (bucket_id = 'audit-artifacts');
        END IF;
      END $$;
    `);
    console.log('✅ SELECT policy configured');
  } catch (e) {
    console.warn('Notice on SELECT policy:', e.message);
  }

  // 2. INSERT policy
  try {
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Upload audit-artifacts'
        ) THEN
          CREATE POLICY "Public Upload audit-artifacts"
          ON storage.objects FOR INSERT
          TO public
          WITH CHECK (bucket_id = 'audit-artifacts');
        END IF;
      END $$;
    `);
    console.log('✅ INSERT policy configured');
  } catch (e) {
    console.warn('Notice on INSERT policy:', e.message);
  }

  // 3. UPDATE policy
  try {
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Update audit-artifacts'
        ) THEN
          CREATE POLICY "Public Update audit-artifacts"
          ON storage.objects FOR UPDATE
          TO public
          USING (bucket_id = 'audit-artifacts');
        END IF;
      END $$;
    `);
    console.log('✅ UPDATE policy configured');
  } catch (e) {
    console.warn('Notice on UPDATE policy:', e.message);
  }

  console.log('Storage policies applied successfully.');
  process.exit(0);
}

fixStoragePolicies().catch(err => {
  console.error('Failed to configure storage policies:', err);
  process.exit(1);
});
