import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gcTZU8Fekq0V@ep-ancient-dew-b4x5v2sp-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrateFixes() {
  console.log('[Neon Fixes Index] Connecting to Neon Database...');
  const sql = neon(DATABASE_URL);

  try {
    console.log('[Neon Fixes Index] Creating unique index on fixes(finding_id)...');
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_fixes_finding_id ON fixes (finding_id);`;
    console.log('[Neon Fixes Index] Index created successfully!');
  } catch (err) {
    console.warn('[Neon Fixes Index] Notice on unique index:', err.message);
  }
}

migrateFixes().catch(console.error);
