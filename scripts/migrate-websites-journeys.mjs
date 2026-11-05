import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gcTZU8Fekq0V@ep-ancient-dew-b4x5v2sp-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
