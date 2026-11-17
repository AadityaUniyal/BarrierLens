import { sql } from '../lib/neon/db.ts';

async function main() {
  console.log('[API Test] Testing Neon DB query endpoints...');

  // 1. Fetch runs
  const runs = await sql`
    SELECT id, persona, status, task_success, effort_ratio, target_url, goal_text
    FROM runs
    ORDER BY COALESCE(started_at, created_at) DESC
    LIMIT 5;
  `;
  console.log(`[API Test] Retrieved ${runs.length} runs from Neon:`);
  for (const r of runs) {
    console.log(` - Run: ${r.id}, Target: ${r.target_url}, Goal: ${r.goal_text}`);
  }

  // 2. Fetch findings
  const findings = await sql`
    SELECT id, run_id, kind, severity, severity_lo, severity_hi, wcag
    FROM findings
    ORDER BY created_at DESC
    LIMIT 5;
  `;
  console.log(`\n[API Test] Retrieved ${findings.length} findings from Neon:`);
  for (const f of findings) {
    console.log(` - Finding: ${f.id}, Kind: ${f.kind}, Severity: [${f.severity_lo} - ${f.severity_hi}]`);
  }

  // 3. Test single run fetch
  if (runs.length > 0) {
    const testRunId = runs[0].id;
    console.log(`\n[API Test] Fetching single run ${testRunId}...`);
    const [singleRun] = await sql`SELECT id, payload FROM runs WHERE id = ${testRunId}`;
    console.log(` - Found run ${singleRun.id}, Has payload: ${Boolean(singleRun.payload)}`);
  }

  console.log('\n✅ ALL NEON API QUERY PATTERNS VALIDATED!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
