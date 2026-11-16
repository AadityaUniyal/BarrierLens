/**
 * Verification test for Official VPAT 2.5 Legal Defense Vault
 */
import { VPATGenerator } from '../lib/barrierlens/compliance/vpat-generator.ts';

async function runVerification() {
  console.log('======================================================================');
  console.log('🏛️  VERIFYING OFFICIAL VPAT 2.5 LEGAL DEFENSE VAULT');
  console.log('======================================================================\n');

  const vpatGen = new VPATGenerator();
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  // 1. Clean compliant run test
  const cleanRun = {
    id: 'test-run-clean',
    targetUrl: 'https://example.com/clean',
    goal: 'Navigate site',
    persona: 'KEYBOARD',
    status: 'completed',
    startedAt: new Date(Date.now() - 30000).toISOString(),
    finishedAt: new Date().toISOString(),
    taskSuccess: true,
    effortRatio: 1.1,
    tierMix: { tier0Rules: 3, tier1Ranker: 1, tier2Groq: 0, tier3Gemini: 0 },
    steps: [],
    findings: []
  };

  const cleanBundle = vpatGen.generateVPATBundle(cleanRun, []);
  assert(cleanBundle.conformanceSummary.overallStatus === 'Compliant',
    `Clean run status is marked Compliant: ${cleanBundle.conformanceSummary.overallStatus}`);
  assert(cleanBundle.conformanceSummary.supportsCount === cleanBundle.conformanceSummary.totalCriteria,
    `All criteria evaluated to Supports (${cleanBundle.conformanceSummary.supportsCount}/${cleanBundle.conformanceSummary.totalCriteria})`);
  assert(cleanBundle.cryptographicSignature.length === 64,
    `Generated 64-char SHA-256 cryptographic signature: ${cleanBundle.cryptographicSignature.slice(0, 16)}...`);

  // 2. Trapped run test with critical keyboard trap and contrast barriers
  const trappedRun = {
    id: 'test-run-trapped',
    targetUrl: 'https://example.com/checkout',
    goal: 'Complete checkout flow',
    persona: 'KEYBOARD',
    status: 'completed',
    startedAt: new Date(Date.now() - 60000).toISOString(),
    finishedAt: new Date().toISOString(),
    taskSuccess: false,
    effortRatio: 3.5,
    kendallTau: {
      tau: 0.42,
      focusOrder: ['#btn-2', '#btn-1'],
      visualOrder: ['#btn-1', '#btn-2'],
      inversionCount: 6,
      totalPairs: 12,
      concordantCount: 6,
      discordantCount: 6,
      isAcceptable: false,
      explanation: 'Focus traversal diverges from visual order'
    },
    tierMix: { tier0Rules: 2, tier1Ranker: 2, tier2Groq: 1, tier3Gemini: 0 },
    steps: [],
    findings: []
  };

  const findings = [
    {
      id: 'f-trap-1',
      runId: 'test-run-trapped',
      stepIdx: 3,
      kind: 'keyboard_trap',
      trustTier: 'proven',
      wcagRules: ['WCAG 2.1.2 No Keyboard Trap'],
      severity: 'critical',
      severityScore: 9.9,
      severityInterval: [9.5, 10.0],
      title: 'Tarjan SCC Modal Keyboard Focus Trap',
      summary: 'Focus cannot escape dialog modal overlay',
      evidence: { selector: '#payment-dialog' }
    },
    {
      id: 'f-contrast-1',
      runId: 'test-run-trapped',
      stepIdx: 1,
      kind: 'color_contrast_violation',
      trustTier: 'proven',
      wcagRules: ['WCAG 1.4.3 Contrast (Minimum)'],
      severity: 'high',
      severityScore: 7.2,
      severityInterval: [6.8, 7.6],
      title: 'Insufficient text color contrast ratio',
      summary: 'Contrast is 2.8:1 below required 4.5:1',
      evidence: { selector: 'button.checkout-btn' }
    }
  ];

  const trappedBundle = vpatGen.generateVPATBundle(trappedRun, findings);

  assert(trappedBundle.conformanceSummary.overallStatus === 'Critical Legal Exposure',
    `Run with critical barriers marked Critical Legal Exposure: ${trappedBundle.conformanceSummary.overallStatus}`);
  assert(trappedBundle.conformanceSummary.doesNotSupportCount >= 1,
    `Correctly flagged Does Not Support for keyboard trap (${trappedBundle.conformanceSummary.doesNotSupportCount} clauses)`);

  const trapEntry = trappedBundle.tableEntries.find(e => e.clauseId.includes('2.1.2'));
  assert(trapEntry?.conformance === 'Does Not Support',
    `WCAG 2.1.2 / Section 508 / EN 301 549 clause conformance is Does Not Support`);
  assert(trapEntry?.remarks.includes('payment-dialog'),
    `Trap clause remarks cite specific element selector: ${trapEntry?.remarks}`);

  const focusOrderEntry = trappedBundle.tableEntries.find(e => e.clauseId.includes('2.4.3'));
  assert(focusOrderEntry?.remarks.includes('0.42'),
    `Focus Order clause references measured Kendall Tau correlation: ${focusOrderEntry?.remarks}`);

  // 3. Printable HTML generation
  const htmlOutput = vpatGen.generatePrintableHTML(trappedBundle, trappedRun);
  assert(htmlOutput.includes('Accessibility Conformance Report (VPAT® 2.5)') && htmlOutput.includes('Legal Defense Attestation'),
    `Generated complete legal defense HTML document with attestation block (${htmlOutput.length} bytes)`);

  console.log('\n======================================================================');
  console.log(`Results: ${passed} / ${total} tests passed`);
  console.log('======================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
