/**
 * Verification test for Autonomous GitHub PR Self-Healing Bot
 */
import { GitHubPREngine } from '../lib/barrierlens/bot/github-pr-engine.ts';
import { GitPatchGenerator } from '../lib/barrierlens/repair/git-patch-generator.ts';

async function runVerification() {
  console.log('======================================================================');
  console.log('🐙 VERIFYING AUTONOMOUS GITHUB PR SELF-HEALING BOT');
  console.log('======================================================================\n');

  const botEngine = new GitHubPREngine();
  const patchGen = new GitPatchGenerator();
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

  const sampleRun = {
    id: 'run-bot-demo-12345678',
    targetUrl: 'https://barrierlens.ai/demo',
    goal: 'Test keyboard trap remediation',
    persona: 'KEYBOARD',
    status: 'completed',
    startedAt: new Date(Date.now() - 45000).toISOString(),
    finishedAt: new Date().toISOString(),
    taskSuccess: false,
    effortRatio: 2.8,
    kendallTau: {
      tau: 0.58,
      focusOrder: ['#b2', '#b1'],
      visualOrder: ['#b1', '#b2'],
      inversionCount: 2,
      totalPairs: 4,
      concordantCount: 2,
      discordantCount: 2,
      isAcceptable: false,
      explanation: 'Disoriented reading flow'
    },
    tierMix: { tier0Rules: 2, tier1Ranker: 2, tier2Groq: 1, tier3Gemini: 0 },
    steps: [],
    findings: []
  };

  const sampleFindings = [
    {
      id: 'f-trap-01',
      runId: sampleRun.id,
      stepIdx: 2,
      kind: 'keyboard_trap',
      trustTier: 'proven',
      wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
      severity: 'critical',
      severityScore: 9.8,
      severityInterval: [9.2, 10.0],
      title: 'Cyclic Tarjan Keyboard Focus Trap',
      summary: 'Focus cannot escape dialog without Escape handler',
      evidence: { selector: '#modal-trap' }
    },
    {
      id: 'f-accname-02',
      runId: sampleRun.id,
      stepIdx: 1,
      kind: 'empty_accessible_name',
      trustTier: 'proven',
      wcagRules: ['WCAG 4.1.2 Name, Role, Value (Level A)'],
      severity: 'high',
      severityScore: 7.5,
      severityInterval: [6.8, 8.2],
      title: 'Missing accessible label on icon button',
      summary: 'Button contains empty SVG without aria-label',
      evidence: { selector: 'button.close-btn' }
    }
  ];

  // 1. Structured Patch Bundle
  const patchBundle = patchGen.createStructuredPatchBundle(sampleFindings);
  assert(patchBundle.patches.length === 2, `Created structured patch bundle with 2 AST fixes`);
  assert(patchBundle.combinedPatch.includes('diff --git'), `Combined patch contains unified diff syntax`);

  // 2. PR Body Generation
  const prBody = botEngine.generatePRBody(sampleRun, sampleFindings, patchBundle);
  assert(prBody.includes('Remediation Summary') && prBody.includes('Applied Counterfactual AST Patches'),
    `Generated executive PR body with metric summary table`);
  assert(prBody.includes('Cyclic Tarjan Keyboard Focus Trap'),
    `PR body lists verified findings with severity`);
  assert(prBody.includes('npm run audit:live'),
    `PR body includes local reproduction instructions`);

  // 3. GitHub Check Run Annotations
  const annotations = botEngine.generateCheckAnnotations(sampleFindings);
  assert(annotations.length === 2, `Generated 2 Check Run annotations`);
  assert(annotations[0].annotation_level === 'failure', `Critical finding marked as failure annotation level`);
  assert(annotations[1].annotation_level === 'warning', `High finding marked as warning annotation level`);

  // 4. Autonomous PR Simulation
  const prResult = await botEngine.createSelfHealingPR({
    owner: 'test-org',
    repo: 'test-repo',
    baseBranch: 'main',
    run: sampleRun,
    findings: sampleFindings,
    patchBundle
  });

  assert(prResult.status === 'simulated', `PR engine returns simulated status in test mode without PAT`);
  assert(prResult.branchName.startsWith('barrierlens/fix-a11y-'), `Branch name adheres to convention: ${prResult.branchName}`);
  assert(prResult.commitsCreated === 2, `Tracked 2 patches staged for commit`);

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
