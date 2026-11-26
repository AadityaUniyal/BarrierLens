-- ==============================================================================
-- BarrierLens - RLS, Security Hardening & Trajectory Schema Sync (003)
-- ==============================================================================

-- 1. Ensure audit_trajectories is tracked in migrations
CREATE TABLE IF NOT EXISTS public.audit_trajectories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  goal TEXT,
  persona TEXT,
  current_url TEXT,
  ax_node_count INTEGER,
  focused_role TEXT,
  focused_name TEXT,
  history_length INTEGER,
  goal_word_overlap DOUBLE PRECISION,
  role_priority DOUBLE PRECISION,
  chosen_action TEXT,
  chosen_selector TEXT,
  tier_used INTEGER,
  llm_confidence DOUBLE PRECISION,
  resulted_in_finding BOOLEAN,
  resulted_in_task_success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security on all public tables
ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barrier_genomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causal_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_event_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."passkey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trajectories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drift_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poa_ledger_blocks ENABLE ROW LEVEL SECURITY;

-- 3. Allow read-only public health check on configuration; deny all other anon access
DROP POLICY IF EXISTS "configuration_public_read" ON public.configuration;
CREATE POLICY "configuration_public_read" ON public.configuration FOR SELECT TO anon, authenticated USING (true);

-- 4. Pin search_path on all public functions to prevent search_path hijacking
ALTER FUNCTION public.claim_next_job(text, integer) SET search_path = public;
ALTER FUNCTION public.get_barrierlens_stats() SET search_path = public;
ALTER FUNCTION public.match_barrier_genomes(vector, double precision, integer) SET search_path = public;
