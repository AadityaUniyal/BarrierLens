import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

// Auto-load .env.local if DATABASE_URL is not set in environment
if (!process.env.DATABASE_URL) {
  try {
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
  } catch {}
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[Error] DATABASE_URL environment variable is required.');
  process.exit(1);
}

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
