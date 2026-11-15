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

async function migrate() {
  console.log('[Neon Migration] Connecting to Neon Database...');
  const sql = neon(DATABASE_URL);

  console.log('[Neon Migration] Creating websites table...');
  await sql`
    CREATE TABLE IF NOT EXISTS websites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT 'production',
      verification_token TEXT NOT NULL,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_websites_user ON websites (user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_websites_origin ON websites (origin);`;

  console.log('[Neon Migration] Creating journeys table...');
  await sql`
    CREATE TABLE IF NOT EXISTS journeys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      starting_url TEXT NOT NULL,
      steps JSONB NOT NULL DEFAULT '[]'::jsonb,
      criticality TEXT NOT NULL DEFAULT 'high',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_journeys_website ON journeys (website_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys (user_id);`;

  console.log('[Neon Migration] Migration finished successfully!');
}

migrate().catch((err) => {
  console.error('[Neon Migration] Error running migration:', err);
  process.exit(1);
});
