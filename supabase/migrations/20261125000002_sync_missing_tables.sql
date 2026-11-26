-- ==============================================================================
-- BarrierLens - Schema Sync Migration (002)
-- Resolves missing tables and column drift between API routes and 001_supabase_schema.sql
-- ==============================================================================

-- 1. Missing Triage Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_finding_id ON reviews (finding_id);

-- 2. Missing State Graph Edges Table
CREATE TABLE IF NOT EXISTS edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  action JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edges_run_id ON edges (run_id);

-- 3. Missing Benchmark & Drift Tables
CREATE TABLE IF NOT EXISTS benchmark_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  injected_barriers JSONB NOT NULL DEFAULT '[]'::jsonb,
  goal_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES benchmark_cases(id) ON DELETE CASCADE,
  system_variant TEXT NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drift_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID,
  kind TEXT NOT NULL,
  score FLOAT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Persistent PoA-DAG Merkle Ledger Table
CREATE TABLE IF NOT EXISTS poa_ledger_blocks (
  epoch_id INTEGER PRIMARY KEY,
  run_id TEXT,
  block_hash TEXT NOT NULL UNIQUE,
  parent_block_hash TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  target_url TEXT NOT NULL,
  persona TEXT NOT NULL,
  compliance_state TEXT NOT NULL,
  leaf_count INTEGER NOT NULL DEFAULT 0,
  leaves JSONB NOT NULL DEFAULT '[]'::jsonb,
  statutory_signatures JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poa_ledger_run_id ON poa_ledger_blocks (run_id);

-- 5. Fix api_keys column drift (align 001 prefix/revoked_at with key_prefix/rate_limit_per_min)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix TEXT;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rate_limit_per_min INTEGER DEFAULT 120;
UPDATE api_keys SET key_prefix = prefix WHERE key_prefix IS NULL AND prefix IS NOT NULL;

-- 6. Fix webhooks column drift (align 001 with last_status/last_dispatched_at)
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS last_status INTEGER;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS last_dispatched_at TIMESTAMPTZ;

-- 7. Fix BetterAuth plugin columns (organization & passkey)
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "activeOrganizationId" TEXT;
ALTER TABLE "passkey" ADD COLUMN IF NOT EXISTS "aaguid" TEXT;
ALTER TABLE "invitation" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- 8. Ensure pgvector RPC exists
CREATE OR REPLACE FUNCTION match_barrier_genomes (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.70,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id text,
  finding_id text,
  finding_kind text,
  domain text,
  target_url text,
  persona text,
  similarity float,
  context jsonb,
  wcag_rules jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    bg.id,
    bg.finding_id,
    bg.finding_kind,
    bg.domain,
    bg.target_url,
    bg.persona,
    1 - (COALESCE(bg.embedding, bg.vector) <=> query_embedding) AS similarity,
    bg.context,
    bg.wcag_rules
  FROM barrier_genomes bg
  WHERE COALESCE(bg.embedding, bg.vector) IS NOT NULL
    AND 1 - (COALESCE(bg.embedding, bg.vector) <=> query_embedding) >= match_threshold
  ORDER BY COALESCE(bg.embedding, bg.vector) <=> query_embedding ASC
  LIMIT match_count;
$$;
