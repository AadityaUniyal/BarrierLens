import { AuditorCore } from '../lib/barrierlens/agent/auditor-core.ts';

console.log('====================================================');
console.log('   BARRIERLENS CI/CD REGRESSION CHECK GATE          ');
console.log('====================================================\n');

async function runCI() {
  const targetUrl = process.env.AUDIT_URL || 'http://localhost:3000/benchmark';
  const maxAllowedEffortRatio = Number(process.env.MAX_EFFORT_RATIO) || 2.5;

  console.log(`Auditing target URL: ${targetUrl}`);
  console.log(`Threshold: Maximum allowed Effort Ratio = ${maxAllowedEffortRatio}x\n`);

  const auditor = new AuditorCore();
  const result = await auditor.runAudit(
    targetUrl,
    'Complete primary interactive flow',
    'keyboard',
    8
  );

  console.log('----------------------------------------------------');
  console.log(`Audit Result:`);
  console.log(`  Effort Ratio: ${result.effortRatio}x (Max allowed: ${maxAllowedEffortRatio}x)`);
  console.log(`  Barriers Detected: ${result.findings.length}`);
  console.log('----------------------------------------------------');

  if (result.effortRatio > maxAllowedEffortRatio) {
    console.error(`\n❌ CI GATE FAILED: Effort Ratio ${result.effortRatio}x exceeds threshold ${maxAllowedEffortRatio}x!`);
    console.error('An introduced keyboard trap or navigational barrier blocks users.');
    process.exit(1);
  }

  console.log('\n✓ CI GATE PASSED: Accessibility effort ratio within acceptable bounds.');
  process.exit(0);
}

runCI();
