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

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  console.error('[Error] DATABASE_URL environment variable is required.');
  process.exit(1);
}
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
