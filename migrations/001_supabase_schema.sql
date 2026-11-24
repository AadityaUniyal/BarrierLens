-- ==============================================================================
-- BarrierLens - Complete Supabase PostgreSQL Schema Migration
-- Project: https://myowihtgpdncqelxgjwh.supabase.co
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1.1 AUTH TABLES
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "passkey" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "publicKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "credentialID" TEXT NOT NULL,
  "counter" INTEGER NOT NULL DEFAULT 0,
  "deviceType" TEXT NOT NULL,
  "backedUp" BOOLEAN NOT NULL DEFAULT FALSE,
  "transports" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "logo" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "metadata" TEXT
);

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "inviterId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- 2. ZERO-HARDCODED CONFIGURATION SYSTEM
CREATE TABLE IF NOT EXISTS configuration (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed baseline configuration defaults
INSERT INTO configuration (key, value, category, description) VALUES
  ('theme.brand_color', '"#0055FF"', 'theme', 'Primary brand accent color'),
  ('theme.accent_color', '"#0090FF"', 'theme', 'Secondary accent color'),
  ('audit.max_steps', '30', 'audit', 'Maximum interaction steps per persona'),
  ('audit.max_llm_calls', '15', 'audit', 'Maximum LLM reasoning calls per run'),
  ('audit.kendall_tau_threshold', '0.70', 'audit', 'Reading order Kendall Tau minimum passing score'),
  ('audit.timeout_ms', '30000', 'audit', 'Navigation and audit timeout in milliseconds'),
  ('features.swarm_mode', 'true', 'features', 'Enable multi-agent swarm exploration'),
  ('features.ast_repair', 'true', 'features', 'Enable automated Babel AST code surgery'),
  ('features.github_pr', 'true', 'features', 'Enable automated GitHub PR creation')
ON CONFLICT (key) DO NOTHING;

-- 3. WEBSITES & TARGETS
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

CREATE INDEX IF NOT EXISTS idx_websites_user ON websites (user_id);
CREATE INDEX IF NOT EXISTS idx_websites_origin ON websites (origin);

-- 4. FLOWS & USER JOURNEYS
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  persona_set TEXT[] NOT NULL DEFAULT '{"keyboard", "screen_reader"}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_journeys_website ON journeys (website_id);
CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys (user_id);

-- 5. AUDIT RUNS
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  user_id TEXT,
  target_url TEXT NOT NULL,
  goal_text TEXT,
  persona TEXT NOT NULL DEFAULT 'keyboard',
  status TEXT NOT NULL DEFAULT 'queued',
  budget JSONB NOT NULL DEFAULT '{"max_steps": 30, "max_llm_calls": 10}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  task_success BOOLEAN DEFAULT FALSE,
  effort_ratio FLOAT,
  tier_mix JSONB DEFAULT '{}'::jsonb,
  kendall_tau FLOAT,
  vpat_signature JSONB,
  payload JSONB,
  trace_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_status_started ON runs (status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs (user_id);
CREATE INDEX IF NOT EXISTS idx_runs_target_url ON runs (target_url);

-- 6. INTERACTION STATES & DOM SNAPSHOTS (WITH EMBEDDINGS)
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

CREATE INDEX IF NOT EXISTS idx_states_run_id ON states (run_id);
CREATE INDEX IF NOT EXISTS idx_states_embedding ON states USING hnsw (embedding vector_cosine_ops);

-- 7. INTERACTION STEPS
CREATE TABLE IF NOT EXISTS steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  state_id UUID REFERENCES states(id),
  action JSONB NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  ok BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steps_run_id ON steps (run_id);

-- 8. BARRIER FINDINGS & PROOFS
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

CREATE INDEX IF NOT EXISTS idx_findings_run_id ON findings (run_id);
CREATE INDEX IF NOT EXISTS idx_findings_kind ON findings (kind);

-- 9. AST CODE REMEDIES / FIXES
CREATE TABLE IF NOT EXISTS fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  patch TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verification_run_id UUID REFERENCES runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fixes_finding_id ON fixes (finding_id);

-- 10. BACKGROUND JOBS QUEUE
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  run_after TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_pending ON jobs (status, run_after ASC) WHERE status = 'pending';

-- 11. LLM REASONING TELEMETRY
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

CREATE INDEX IF NOT EXISTS idx_llm_calls_run_id ON llm_calls (run_id);

-- 12. BARRIER GENOME EMBEDDINGS (768-DIMENSIONAL VECTORS)
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
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barrier_genomes_embedding ON barrier_genomes USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_barrier_genomes_kind ON barrier_genomes (finding_kind);

-- 13. CAUSAL CERTIFICATES (MERKLE PROOFS FOR LEGAL & VPAT COMPLIANCE)
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

CREATE INDEX IF NOT EXISTS idx_causal_certs_target ON causal_certificates (target_url, verification_status);

-- 14. AGENT EVENT TRACES (MULTI-AGENT MESH LOGS)
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

CREATE INDEX IF NOT EXISTS idx_agent_event_traces_trace ON agent_event_traces (trace_id);

-- 15. INTEGRATIONS: API KEYS & WEBHOOKS
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{"audit:read", "audit:write"}',
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys (prefix);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{"audit.completed", "barrier.detected"}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks (user_id);
