async function main() {
  console.log('[Test] Testing Longitudinal Analytics Trends API...');

  const { GET } = await import('../app/api/analytics/trends/route.ts');

  // 1. Test overall trends
  const req = new Request('https://barrierlens.ai/api/analytics/trends');
  const res = await GET(req);
  const data = await res.json();

  console.log('\n--- Analytics Summary ---');
  console.log('Total Audits:', data.summary.totalAudits);
  console.log('Success Rate:', data.summary.successRate);
  console.log('Average Effort Ratio:', data.summary.averageEffortRatio);
  console.log('Total Barrier Genomes:', data.summary.totalBarrierGenomes);
  console.log('Mean Time to Remediation:', data.summary.meanTimeToRemediation);

  console.log('\n--- WCAG Compliance Matrix ---');
  console.log(data.wcagComplianceMatrix);

  console.log('\n--- Findings Breakdown ---');
  for (const f of data.findingsBreakdown) {
    console.log(` - ${f.kind}: Count ${f.count}, Proven: ${f.provenCount}, Avg Severity: ${f.avgSeverity}`);
  }

  if (!data.summary.totalAudits || !data.findingsBreakdown.length) {
    throw new Error('Analytics trends response missing required metrics');
  }

  console.log('\n✅ LONGITUDINAL ANALYTICS API TESTS PASSED!');
}

main().catch(err => {
  console.error('❌ Analytics test failed:', err);
  process.exit(1);
});
