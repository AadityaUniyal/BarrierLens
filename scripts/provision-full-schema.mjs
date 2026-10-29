import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function enableVectorAndMissingTables() {
  console.log('1. Enabling pgvector extension...');
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('   ✓ pgvector enabled successfully!');
  } catch (err) {
    console.warn('   ! pgvector notice:', err.message);
  }

  console.log('\n2. Creating remaining tables from master blueprint...');

  await sql`
    CREATE TABLE IF NOT EXISTS edges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      action JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS llm_calls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens_in INTEGER DEFAULT 0,
      tokens_out INTEGER DEFAULT 0,
      cached BOOLEAN DEFAULT FALSE,
      ok BOOLEAN DEFAULT TRUE,
      latency_ms INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL,
      label TEXT NOT NULL, -- 'accepted' | 'rejected'
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS benchmark_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      target_url TEXT NOT NULL,
      injected_barriers JSONB NOT NULL DEFAULT '[]'::jsonb,
      goal_text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS benchmark_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES benchmark_cases(id) ON DELETE CASCADE,
      system_variant TEXT NOT NULL, -- 'axe_only' | 'llm_only' | 'barrierlens_full'
      metrics JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS drift_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      flow_id UUID,
      kind TEXT NOT NULL,
      score FLOAT NOT NULL,
      detected_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log('   ✓ All 15 master tables created!');

  console.log('\n3. Creating high-performance indexes...');
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_queue ON jobs (status, run_after) WHERE status = 'pending';`;
    await sql`CREATE INDEX IF NOT EXISTS idx_findings_tier ON findings (run_id, trust_tier);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_steps_run ON steps (run_id, idx);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_states_run ON states (run_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_llm_calls_run ON llm_calls (run_id);`;
    console.log('   ✓ Performance indexes verified!');
  } catch (err) {
    console.warn('   ! Index warning:', err.message);
  }

  // Populate benchmark cases if empty
  const count = await sql`SELECT count(*) FROM benchmark_cases;`;
  if (Number(count[0].count) === 0) {
    console.log('\n4. Seeding standard benchmark cases...');
    await sql`
      INSERT INTO benchmark_cases (name, target_url, goal_text, injected_barriers)
      VALUES 
      (
        'Checkout Modal Deadlock', 
        'http://localhost:3000/benchmark', 
        'Open coupon dialog and dismiss with Escape', 
        '["keyboard_trap", "unreachable_control"]'::jsonb
      ),
      (
        'Newsletter Silent Error', 
        'http://localhost:3000/benchmark', 
        'Submit empty newsletter email field', 
        '["silent_state_change"]'::jsonb
      ),
      (
        'Multi-column Discordance', 
        'http://localhost:3000/benchmark', 
        'Tab across columns 1 to 3', 
        '["low_kendall_tau"]'::jsonb
      );
    `;
    console.log('   ✓ Standard benchmark cases seeded!');
  }
}

enableVectorAndMissingTables();
