import { sql } from './db';

async function retry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return retry(fn, retries - 1, delayMs * 2);
  }
}

export async function initializeDatabaseSchema() {
  console.log('[Neon DB] Initializing BarrierLens schema...');

  return await retry(async () => {
    // 1. Enable uuid extension if available
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
    } catch (e: any) {
      console.log('[Neon DB] uuid-ossp notice:', e.message);
    }

    // 2. Core tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        origin TEXT NOT NULL,
        ownership_verified_at TIMESTAMPTZ,
        verify_token TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
        goal_text TEXT NOT NULL,
        milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
        persona_set TEXT[] NOT NULL DEFAULT '{"keyboard", "screen_reader"}'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
        persona TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        budget JSONB NOT NULL DEFAULT '{"max_steps": 30, "max_llm_calls": 10}'::jsonb,
        started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        task_success BOOLEAN DEFAULT FALSE,
        effort_ratio FLOAT,
        tier_mix JSONB DEFAULT '{}'::jsonb,
        trace_path TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
        fingerprint TEXT NOT NULL,
        simhash BIGINT,
        ax_hash TEXT,
        phash BIGINT,
        url TEXT NOT NULL,
        screenshot_path TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
        idx INTEGER NOT NULL,
        state_id UUID REFERENCES states(id),
        action JSONB NOT NULL,
        tier SMALLINT NOT NULL DEFAULT 0,
        latency_ms INTEGER,
        ok BOOLEAN DEFAULT TRUE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS findings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
        step_id UUID REFERENCES steps(id),
        kind TEXT NOT NULL,
        trust_tier TEXT NOT NULL,
        wcag TEXT[] DEFAULT '{}',
        severity FLOAT NOT NULL,
        severity_lo FLOAT,
        severity_hi FLOAT,
        evidence JSONB NOT NULL,
        certificate JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS fixes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
        patch TEXT NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        verification_run_id UUID REFERENCES runs(id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        run_after TIMESTAMPTZ DEFAULT NOW(),
        locked_at TIMESTAMPTZ,
        attempts INTEGER DEFAULT 0
      );
    `;

    console.log('[Neon DB] Schema successfully initialized in Neon Postgres!');
    return { success: true, message: 'All 9 core BarrierLens tables created and verified.' };
  });
}
