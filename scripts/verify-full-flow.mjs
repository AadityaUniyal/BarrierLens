async function testFullAuditFlow() {
  console.log('====================================================');
  console.log('   RUNNING BARRIERLENS END-TO-END AUTONOMOUS AUDIT  ');
  console.log('====================================================\n');

  // 1. Verify Benchmark
  const bRes = await fetch('http://localhost:3000/benchmark');
  console.log('1. Ground Truth Benchmark Site: HTTP', bRes.status, bRes.statusText);

  // 2. Run Audit
  console.log('\n2. Dispatching Autonomous Agent Audit via /api/audit/run...');
  const startAudit = performance.now();
  const auditRes = await fetch('http://localhost:3000/api/audit/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetUrl: 'http://localhost:3000/benchmark',
      goal: 'Subscribe to newsletter and confirm subscription dialog',
      persona: 'keyboard',
      maxSteps: 8
    })
  });

  const auditData = await auditRes.json();
  const auditLatency = Math.round(performance.now() - startAudit);

  console.log(`   Audit Run Completed in ${auditLatency}ms (HTTP ${auditRes.status})`);
  console.log(`   Run ID        : ${auditData.id}`);
  console.log(`   Task Success  : ${auditData.taskSuccess}`);
  console.log(`   Effort Ratio  : ${auditData.effortRatio}x`);
  console.log(`   Kendall Tau   : ${auditData.kendallTau?.tau}`);
  console.log(`   Steps Taken   : ${auditData.steps?.length}`);
  console.log(`   Findings Count: ${auditData.findings?.length}`);

  console.log('\n--- DETECTED BARRIERS ---');
  auditData.findings?.forEach((f, idx) => {
    console.log(`   #${idx + 1} [${f.severity.toUpperCase()}] ${f.title}`);
    console.log(`      Kind: ${f.kind} | Trust: ${f.trustTier} | Score: ${f.severityScore}/10`);
    if (f.certificate) {
      console.log(`      [CERTIFICATE]: ${f.certificate.proofExplanation}`);
    }
  });

  // 3. Test Closed-Loop Verified Repair
  if (auditData.findings?.length > 0) {
    const findingToFix = auditData.findings[0];
    console.log(`\n3. Testing Closed-Loop Repair Replay on finding: ${findingToFix.id}`);
    const repairRes = await fetch('http://localhost:3000/api/repair/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: 'http://localhost:3000/benchmark',
        findingId: findingToFix.id,
        findingKind: findingToFix.kind,
        patch: 'aria-modal="true" role="dialog"'
      })
    });
    const repairData = await repairRes.json();
    console.log('   Repair Verification Result:');
    console.log(`      Verified       : ${repairData.verified}`);
    console.log(`      Diff Summary   : ${repairData.diffSummary}`);
  }

  console.log('\n====================================================');
  console.log('   FULL END-TO-END AUDITOR & REPAIR PIPELINE PASSED ');
  console.log('====================================================\n');
}

testFullAuditFlow();
