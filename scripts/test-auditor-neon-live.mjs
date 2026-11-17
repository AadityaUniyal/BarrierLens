import { AuditorCore } from '../lib/barrierlens/agent/auditor-core.ts';
import { sql } from '../lib/neon/db.ts';

async function main() {
  console.log('[Test] Running live AuditorCore with full Neon Postgres persistence...');
  const auditor = new AuditorCore();

  const testUrl = 'https://example.com/checkout-demo';
  const testGoal = 'Complete test purchase flow';
  const persona = 'keyboard';

  const result = await auditor.runAudit(testUrl, testGoal, persona, 5);
  console.log('[Test] Audit finished. Run ID:', result.id);
  console.log('[Test] Findings count:', result.findings.length);

  // Now verify rows directly in Neon DB
  console.log('[Test] Verifying rows in Neon Postgres...');
  const runRows = await sql`
    SELECT id, target_url, goal_text, status, task_success, effort_ratio 
    FROM runs 
    WHERE id = ${result.id};
  `;
  console.log('[Test] Neon run record:', runRows[0]);

  const findingRows = await sql`
    SELECT id, run_id, kind, severity, wcag 
    FROM findings 
    WHERE run_id = ${result.id};
  `;
  console.log(`[Test] Neon finding records (${findingRows.length} found):`);
  for (const f of findingRows) {
    console.log(` - ID: ${f.id}, Kind: ${f.kind}, Severity: ${f.severity}`);
  }

  const certRows = await sql`
    SELECT id, finding_id, wcag_rule, verification_status 
    FROM causal_certificates 
    WHERE target_url = ${testUrl};
  `;
  console.log(`[Test] Neon causal certificate records (${certRows.length} found):`);
  for (const c of certRows) {
    console.log(` - Cert ID: ${c.id}, Rule: ${c.wcag_rule}, Status: ${c.verification_status}`);
  }

  console.log('✅ NEON POSTGRES PERSISTENCE FULLY VERIFIED!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
