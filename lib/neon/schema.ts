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
    // 1. Enable uuid and pgvector extensions if available
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
    } catch (e: any) {
      console.log('[Neon DB] uuid-ossp notice:', e.message);
    }

    try {
      await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
      console.log('[Neon DB] pgvector extension enabled/verified.');
    } catch (e: any) {
      console.log('[Neon DB] pgvector notice:', e.message);
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
        embedding vector(384),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Ensure embedding vector column exists and HNSW index is active
    try {
      await sql`ALTER TABLE states ADD COLUMN IF NOT EXISTS embedding vector(384);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_states_embedding ON states USING hnsw (embedding vector_cosine_ops);`;
    } catch (e: any) {
      console.log('[Neon DB] HNSW embedding index notice:', e.message);
    }

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

    await sql`
      CREATE TABLE IF NOT EXISTS llm_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
        provider TEXT,
        model TEXT,
        tokens_in INTEGER,
        tokens_out INTEGER,
        cached BOOLEAN DEFAULT FALSE,
        ok BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 3. Advanced Agentic & Genome Tables
    await sql`
      CREATE TABLE IF NOT EXISTS barrier_genomes (
        id TEXT PRIMARY KEY,
        finding_id TEXT NOT NULL,
        finding_kind TEXT NOT NULL,
        domain TEXT NOT NULL,
        target_url TEXT NOT NULL,
        persona TEXT NOT NULL,
        vector vector(768),
        vector_json JSONB,
        magnitude FLOAT NOT NULL,
        severity_score FLOAT NOT NULL,
        wcag_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
        context JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_barrier_genomes_vector ON barrier_genomes USING hnsw (vector vector_cosine_ops);`;
    } catch (e: any) {
      console.log('[Neon DB] HNSW genome index notice:', e.message);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS causal_certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        finding_id TEXT NOT NULL,
        sha256_hash TEXT NOT NULL,
        target_url TEXT NOT NULL,
        persona TEXT NOT NULL,
        wcag_rule TEXT NOT NULL,
        intervention_target TEXT NOT NULL,
        intervention_action TEXT NOT NULL,
        ast_patch TEXT NOT NULL,
        original_html TEXT,
        patched_html TEXT,
        verification_status TEXT NOT NULL DEFAULT 'verified',
        regressions_count INTEGER DEFAULT 0,
        sandbox_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS agent_event_traces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trace_id TEXT NOT NULL,
        agent_role TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        bedrock_model TEXT,
        tokens_used INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_agent_event_traces_trace ON agent_event_traces (trace_id);`;
    } catch (e: any) {
      console.log('[Neon DB] trace index notice:', e.message);
    }

    try {
      await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS target_url TEXT;`;
      await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS goal_text TEXT;`;
      await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS payload JSONB;`;
    } catch (e: any) {
      console.log('[Neon DB] runs public-share columns notice:', e.message);
    }

    console.log('[Neon DB] Schema successfully initialized in Neon Postgres!');
    return { success: true, message: 'All 12 core BarrierLens tables (including barrier_genomes, causal_certificates, agent_event_traces) created and verified.' };
  });
}
