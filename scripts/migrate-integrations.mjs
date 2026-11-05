import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gcTZU8Fekq0V@ep-ancient-dew-b4x5v2sp-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function migrate() {
  console.log('[Neon DB] Provisioning api_keys and webhooks tables...');
  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      scopes TEXT[] DEFAULT '{"audits:read", "audits:write"}',
      rate_limit_per_min INTEGER DEFAULT 60,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      secret TEXT NOT NULL,
      events TEXT[] DEFAULT '{"audit.completed", "trap.detected", "repair.verified"}',
      active BOOLEAN DEFAULT TRUE,
      last_status INTEGER,
      last_dispatched_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('[Neon DB] Successfully provisioned api_keys and webhooks tables!');
}

migrate().catch(console.error);
