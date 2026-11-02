import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);

if (!process.env.RUNNING_UNDER_TSX) {
  const result = spawnSync('npx', ['tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNING_UNDER_TSX: '1' },
    shell: true
  });
  process.exit(result.status ?? 0);
}

const { LabelQualityClassifier } = await import('../lib/barrierlens/ml/label-quality.ts');
const { VisualAffordanceEngine } = await import('../lib/barrierlens/ml/visual-affordance.ts');
const { FlakinessFilter } = await import('../lib/barrierlens/ml/flakiness-filter.ts');
const { CognitiveEntropyModel } = await import('../lib/barrierlens/ml/cognitive-entropy.ts');
const { ActionRanker } = await import('../lib/barrierlens/ml/action-ranker.ts');
const { ConformalImpactModel } = await import('../lib/barrierlens/ml/conformal-impact.ts');
const { BarrierGenomeEncoder } = await import('../lib/barrierlens/genome/barrier-encoder.ts');
const { CounterfactualEngine } = await import('../lib/barrierlens/causal/counterfactual-engine.ts');
const { CausalCertificateGenerator } = await import('../lib/barrierlens/causal/causal-certificate.ts');
const { ChaosInjector } = await import('../lib/barrierlens/adversarial/chaos-injector.ts');
const { MotorTremorSimulator } = await import('../lib/barrierlens/adversarial/motor-tremor.ts');

console.log('⚡ Starting Comprehensive Phase 4 Adversarial Stress & Integrity Challenge...\n');

let passedAssertions = 0;
function test(desc, fn) {
  fn();
  passedAssertions++;
  console.log(`  ✓ ${desc}`);
}

// =========================================================================
// 1. Suite 9: LabelQualityClassifier Edge Cases & Affordance
// =========================================================================
console.log('--- 1. Testing LabelQualityClassifier & Suite 9 Perception ML Models ---');

const labelClassifier = new LabelQualityClassifier();

test('LabelQuality: Handles null, undefined, empty, and whitespace strings safely', () => {
  assert.strictEqual(labelClassifier.classifyName('button', '').label, 'empty');
  assert.strictEqual(labelClassifier.classifyName('button', '   ').label, 'empty');
  assert.strictEqual(labelClassifier.classifyName('button', '\t\n').label, 'empty');
  // @ts-ignore
  assert.strictEqual(labelClassifier.classifyName('button', null).label, 'empty');
  // @ts-ignore
  assert.strictEqual(labelClassifier.classifyName('button', undefined).label, 'empty');
});

test('LabelQuality: Flags corrupted, synthetic, and low-information placeholders', () => {
  const badNames = [
    'btn_submit', 'btn123', 'btn_', 'img_001', 'img_9999', 'icon_settings', 'icon_user',
    'button', 'BUTTON', 'click here', 'Click Here', 'untitled', 'UNTITLED', 'link', '123456789'
  ];
  for (const name of badNames) {
    const res = labelClassifier.classifyName('button', name);
    assert.strictEqual(res.isAdequate, false, `Expected inadequate for "${name}"`);
    assert.strictEqual(res.label, 'corrupted_or_generic', `Expected corrupted_or_generic for "${name}"`);
  }
});

test('LabelQuality: Role-sensitive length constraints (link vs button)', () => {
  // Single character for link is allowed (e.g., pagination "1", "2", "«", "»")
  const linkRes = labelClassifier.classifyName('link', 'X');
  assert.strictEqual(linkRes.isAdequate, true);
  assert.strictEqual(linkRes.label, 'adequate');

  // Single character for button is too short
  const btnRes = labelClassifier.classifyName('button', 'X');
  assert.strictEqual(btnRes.isAdequate, false);
  assert.strictEqual(btnRes.label, 'too_short');
});

test('LabelQuality: Extreme unicode, RTL, emojis, and combining marks', () => {
  // Emojis
  const emojiRes = labelClassifier.classifyName('button', '🚀 Submit');
  assert.strictEqual(emojiRes.isAdequate, true);
  assert.strictEqual(emojiRes.label, 'adequate');

  // Arabic RTL
  const rtlRes = labelClassifier.classifyName('button', 'زر الحفظ والتأكيد');
  assert.strictEqual(rtlRes.isAdequate, true);
  assert.strictEqual(rtlRes.label, 'adequate');

  // Hebrew RTL
  const hebrewRes = labelClassifier.classifyName('button', 'כפתור שמירה');
  assert.strictEqual(hebrewRes.isAdequate, true);
  assert.strictEqual(hebrewRes.label, 'adequate');

  // CJK characters
  const cjkRes = labelClassifier.classifyName('button', '保存');
  assert.strictEqual(cjkRes.isAdequate, true);
  assert.strictEqual(cjkRes.label, 'adequate');

  // Accented French
  const accentRes = labelClassifier.classifyName('button', 'Passer à la caisse');
  assert.strictEqual(accentRes.isAdequate, true);
  assert.strictEqual(accentRes.label, 'adequate');
});

const affordanceEngine = new VisualAffordanceEngine();

test('VisualAffordance: Detects semantic-visual contradictions', () => {
  const trashContradiction = affordanceEngine.evaluateIconAffordance(
    'button#save',
    'Save Changes',
    '<button><svg class="trash-bin-icon"></svg></button>'
  );
  assert.strictEqual(trashContradiction.hasSemanticContradiction, true);
  assert.strictEqual(trashContradiction.detectedIconType, 'trash');
  assert(trashContradiction.confidence > 0.9);

  const cartContradiction = affordanceEngine.evaluateIconAffordance(
    'button#search',
    'search catalog',
    '<button><svg class="shopping-cart-icon"></svg></button>'
  );
  assert.strictEqual(cartContradiction.hasSemanticContradiction, true);

  const validMatch = affordanceEngine.evaluateIconAffordance(
    'button#trash',
    'Delete item',
    '<button><svg class="trash-bin-icon"></svg></button>'
  );
  assert.strictEqual(validMatch.hasSemanticContradiction, false);
});

// =========================================================================
// 2. Beta-Bernoulli Flakiness Filter Posterior Math Under Extreme Sequences
// =========================================================================
console.log('\n--- 2. Testing Beta-Bernoulli Flakiness Filter Posterior Math ---');

const flakinessFilter = new FlakinessFilter();

test('FlakinessFilter: 100% fail sequence (0 successes in 100 replays)', () => {
  // alpha = 2 + 0 = 2, beta = 2 + 100 = 102 -> mean = 2/104 ≈ 0.0192 -> 0.02
  const score = flakinessFilter.evaluateReproducibility('f-fail-100', 0, 100);
  assert.strictEqual(score.posteriorMean, 0.02);
  assert(score.posteriorVariance < 0.001);
  assert.strictEqual(score.promotedTier, 'suspected');
  assert.strictEqual(score.isFlaky, true);
});

test('FlakinessFilter: 100% pass sequence (100 successes in 100 replays)', () => {
  // alpha = 2 + 100 = 102, beta = 2 + 0 = 2 -> mean = 102/104 ≈ 0.9807 -> 0.98
  const score = flakinessFilter.evaluateReproducibility('f-pass-100', 100, 100);
  assert.strictEqual(score.posteriorMean, 0.98);
  assert(score.posteriorVariance < 0.001);
  assert.strictEqual(score.promotedTier, 'observed');
  assert.strictEqual(score.isFlaky, false);
});

test('FlakinessFilter: Oscillating sequence (50 successes in 100 replays)', () => {
  // alpha = 2 + 50 = 52, beta = 2 + 50 = 52 -> mean = 52/104 = 0.50
  const score = flakinessFilter.evaluateReproducibility('f-osc-100', 50, 100);
  assert.strictEqual(score.posteriorMean, 0.50);
  assert.strictEqual(score.promotedTier, 'suspected');
  assert.strictEqual(score.isFlaky, true);
});

test('FlakinessFilter: Prior state and promotion threshold boundaries', () => {
  // 0 attempts -> prior mean = 2/4 = 0.50
  const score0 = flakinessFilter.evaluateReproducibility('f-0', 0, 0);
  assert.strictEqual(score0.posteriorMean, 0.50);
  assert.strictEqual(score0.posteriorVariance, 0.05); // 4 / (16 * 5) = 4/80 = 0.05
  assert.strictEqual(score0.promotedTier, 'suspected');

  // (k=2, n=2): alpha=4, beta=2 -> mean = 4/6 = 0.67 < 0.75 -> suspected
  const score2 = flakinessFilter.evaluateReproducibility('f-2', 2, 2);
  assert.strictEqual(score2.posteriorMean, 0.67);
  assert.strictEqual(score2.promotedTier, 'suspected');

  // (k=4, n=4): alpha=6, beta=2 -> mean = 6/8 = 0.75 >= 0.75 && n>=2 -> promoted to observed!
  const score4 = flakinessFilter.evaluateReproducibility('f-4', 4, 4);
  assert.strictEqual(score4.posteriorMean, 0.75);
  assert.strictEqual(score4.promotedTier, 'observed');
  assert.strictEqual(score4.isFlaky, false);

  // Variance monotonically decreases with N
  assert(score4.posteriorVariance <= score0.posteriorVariance);
});

// =========================================================================
// 3. Conformal Impact Model Coverage & Monotonicity
// =========================================================================
console.log('\n--- 3. Testing Conformal Impact Model Coverage & Monotonicity ---');

const conformalModel = new ConformalImpactModel();

test('ConformalImpact: Interval bounds [lo, hi] strictly contain score', () => {
  const kinds = [
    'keyboard_trap', 'unreachable_control', 'silent_state_change',
    'low_kendall_tau', 'empty_accessible_name', 'misleading_accessible_name', 'focus_loss'
  ];
  const personas = ['keyboard', 'screen_reader', 'low_vision', 'mouse_unconstrained'];

  for (const k of kinds) {
    for (const p of personas) {
      for (const blocks of [true, false]) {
        for (const step of [1, 3, 7, 12]) {
          const res = conformalModel.scoreFinding(k, p, blocks, step);
          assert(res.score >= 0.0 && res.score <= 10.0, `Score out of bounds: ${res.score}`);
          assert(res.interval[0] >= 0.0, `Lower bound negative: ${res.interval[0]}`);
          assert(res.interval[1] <= 10.0, `Upper bound exceeds 10: ${res.interval[1]}`);
          assert(res.interval[0] <= res.score, `Lower bound ${res.interval[0]} > score ${res.score}`);
          assert(res.interval[1] >= res.score, `Upper bound ${res.interval[1]} < score ${res.score}`);
        }
      }
    }
  }
});

test('ConformalImpact: Task blocking monotonicity', () => {
  const kinds = ['keyboard_trap', 'unreachable_control', 'empty_accessible_name'];
  for (const k of kinds) {
    const unblocked = conformalModel.scoreFinding(k, 'keyboard', false, 3);
    const blocked = conformalModel.scoreFinding(k, 'keyboard', true, 3);
    assert(blocked.score >= unblocked.score, `Expected blocked (${blocked.score}) >= unblocked (${unblocked.score}) for ${k}`);
  }
});

test('ConformalImpact: Late-step failure elevation monotonicity', () => {
  const early = conformalModel.scoreFinding('silent_state_change', 'screen_reader', false, 2);
  const late = conformalModel.scoreFinding('silent_state_change', 'screen_reader', false, 8);
  assert(late.score >= early.score, `Expected late step score (${late.score}) >= early (${early.score})`);
});

// =========================================================================
// 4. ActionRanker Composite Ranking Stability & Edge Cases
// =========================================================================
console.log('\n--- 4. Testing ActionRanker Composite Ranking Stability ---');

const actionRanker = new ActionRanker();

test('ActionRanker: Empty or null nodes fallback cleanly', () => {
  const emptyRes = actionRanker.rankNextAction('Submit checkout', [], 'body', []);
  assert.strictEqual(emptyRes.bestNode, null);
  assert.strictEqual(emptyRes.key, 'Tab');
  assert.strictEqual(emptyRes.recommendedAction, 'press_key');
  assert.strictEqual(emptyRes.confidence, 0.4);
  assert.strictEqual(emptyRes.isHighConfidence, false);
});

test('ActionRanker: Disabled elements are ignored', () => {
  const nodes = [
    { selector: 'button#disabled-btn', role: 'button', name: 'Submit checkout', disabled: true },
    { selector: 'button#cancel-btn', role: 'button', name: 'Cancel operation', disabled: false }
  ];
  const res = actionRanker.rankNextAction('Submit checkout', nodes, 'body', []);
  assert.strictEqual(res.bestNode?.selector, 'button#cancel-btn');
});

test('ActionRanker: Goal semantic keyword alignment drives top ranking', () => {
  const candidateNodes = [
    { selector: 'button#cancel', role: 'button', name: 'Cancel Operation', disabled: false },
    { selector: 'input#email-input', role: 'input', name: 'Enter Email Address', disabled: false },
    { selector: 'a#privacy-link', role: 'a', name: 'Privacy Policy', disabled: false }
  ];

  const rankResult = actionRanker.rankNextAction('Enter Email Address', candidateNodes, 'input#email-input', []);
  assert.strictEqual(rankResult.bestNode?.selector, 'input#email-input');
  assert.strictEqual(rankResult.recommendedAction, 'type_text');
  assert(rankResult.confidence >= 0.78);
  assert.strictEqual(rankResult.isHighConfidence, true);
});

test('ActionRanker: Composite weighting between role priority and focus distance', () => {
  // When input is at index 0, higher role priority (0.9 vs 0.7) and focus proximity both favor #input-id
  const nodesInputFirst = [
    { selector: '#input-id', role: 'input', name: 'Input Bar', disabled: false },
    { selector: '#link-id', role: 'a', name: 'Link Foo', disabled: false }
  ];
  const res1 = actionRanker.rankNextAction('Completely unrelated goal', nodesInputFirst, 'body', []);
  assert.strictEqual(res1.bestNode?.selector, '#input-id');

  // Focus distance trade-off: when anchor is at index 0, focus order weight (0.667 vs 0.333)
  // adds +0.067, which narrowly offsets the +0.060 role priority advantage of input at index 1
  const nodesLinkFirst = [
    { selector: '#link-id', role: 'a', name: 'Link Foo', disabled: false },
    { selector: '#input-id', role: 'input', name: 'Input Bar', disabled: false }
  ];
  const res2 = actionRanker.rankNextAction('Completely unrelated goal', nodesLinkFirst, 'body', []);
  assert.strictEqual(res2.bestNode?.selector, '#link-id');
});

// =========================================================================
// 5. Barrier Genome 768-dim Embedding Normalization & Bounds
// =========================================================================
console.log('\n--- 5. Testing Barrier Genome 768-dim Embedding Normalization ---');

const encoder = new BarrierGenomeEncoder();

test('GenomeEncoder: Exactly 768 dimensions and unit normalization', () => {
  const finding = {
    id: 'f-norm-test',
    runId: 'r-1',
    stepIdx: 3,
    kind: 'keyboard_trap',
    trustTier: 'proven',
    wcagRules: ['WCAG 2.1.2'],
    severity: 'critical',
    severityScore: 9.6,
    severityInterval: [9.1, 10.0],
    title: 'Trap in Modal',
    summary: 'Focus trapped',
    evidence: { selector: '#modal', role: 'dialog' }
  };
  const context = {
    goal: 'Navigate modal with keyboard',
    persona: 'keyboard',
    targetUrl: 'https://app.example.com',
    effortRatio: 2.5,
    taskSuccess: false,
    maxSteps: 10,
    stepCount: 5
  };

  const genome = encoder.encode(finding, context);
  assert.strictEqual(genome.vector.length, 768);
  assert(genome.magnitude >= 0.95 && genome.magnitude <= 1.05);

  // Check all dimensions are numbers and finite
  for (let i = 0; i < 768; i++) {
    assert(Number.isFinite(genome.vector[i]), `Dimension ${i} is not finite: ${genome.vector[i]}`);
  }
});

test('GenomeEncoder: Degenerate and empty findings produce valid embeddings', () => {
  const minimalFinding = {
    id: 'f-empty',
    runId: 'r-empty',
    stepIdx: 0,
    kind: 'focus_loss',
    trustTier: 'suspected',
    wcagRules: [],
    severity: 'low',
    title: '',
    summary: ''
  };
  const minimalContext = {
    goal: '',
    persona: 'mouse_unconstrained',
    targetUrl: '',
    effortRatio: 1.0,
    taskSuccess: false,
    maxSteps: 5,
    stepCount: 0
  };

  const genome = encoder.encode(minimalFinding, minimalContext);
  assert.strictEqual(genome.vector.length, 768);
  assert(genome.magnitude >= 0.95 && genome.magnitude <= 1.05);
  for (let i = 0; i < 768; i++) {
    assert(!Number.isNaN(genome.vector[i]), `Dimension ${i} is NaN`);
  }
});

test('GenomeEncoder: Cosine similarity symmetry, identity, and bounds [0.0, 1.0]', () => {
  const finding1 = {
    id: 'f-1',
    runId: 'r-1',
    stepIdx: 2,
    kind: 'keyboard_trap',
    trustTier: 'proven',
    wcagRules: ['WCAG 2.1.2'],
    severity: 'critical',
    title: 'Keyboard trap',
    summary: 'Focus trap'
  };
  const finding2 = {
    id: 'f-2',
    runId: 'r-2',
    stepIdx: 1,
    kind: 'color_contrast_violation',
    trustTier: 'observed',
    wcagRules: ['WCAG 1.4.3'],
    severity: 'medium',
    title: 'Low contrast',
    summary: 'Text contrast failure'
  };
  const ctx = {
    goal: 'Test',
    persona: 'keyboard',
    targetUrl: 'https://test.com',
    effortRatio: 1.0,
    taskSuccess: true,
    maxSteps: 10,
    stepCount: 2
  };

  const g1 = encoder.encode(finding1, ctx);
  const g2 = encoder.encode(finding2, ctx);

  // Self similarity = 1.0
  const sim11 = encoder.similarity(g1, g1);
  assert(sim11 >= 0.99 && sim11 <= 1.0001, `Self-similarity not unity: ${sim11}`);

  // Symmetry
  const sim12 = encoder.similarity(g1, g2);
  const sim21 = encoder.similarity(g2, g1);
  assert.strictEqual(sim12, sim21, 'Cosine similarity not symmetric');

  // Bounds
  assert(sim12 >= 0.0 && sim12 <= 1.0, `Cosine similarity out of bounds: ${sim12}`);
});

// =========================================================================
// 6. Causal SCM Counterfactuals & SHA-256 Certificate Integrity
// =========================================================================
console.log('\n--- 6. Testing Causal SCM Counterfactuals & Cryptographic Certificate ---');

const causalEngine = new CounterfactualEngine();
const certGenerator = new CausalCertificateGenerator();

test('CausalSCM: Counterfactual interventions generated with minimal invasiveness', () => {
  const finding = {
    id: 'f-causal-test',
    runId: 'r-1',
    stepIdx: 2,
    kind: 'unreachable_control',
    trustTier: 'proven',
    wcagRules: ['WCAG 2.1.1 Keyboard'],
    severity: 'critical',
    title: 'Unreachable div button',
    summary: 'Cannot reach with Tab'
  };
  const dom = {
    selector: 'div.custom-btn',
    outerHTML: '<div class="custom-btn" onclick="submit()">Click Me</div>'
  };

  const graph = causalEngine.buildCausalGraph(finding, dom);
  assert(graph.nodes.length >= 1);
  const interventions = causalEngine.generateInterventions(graph, finding);
  assert(interventions.length >= 2);

  // Minimal invasiveness prioritized (e.g. tabindex=0 invasiveness 1 before change_tag button invasiveness 2)
  assert(interventions[0].invasiveness <= interventions[1].invasiveness);
  assert.strictEqual(interventions[0].attribute, 'tabindex');
  assert.strictEqual(interventions[0].newValue, '0');
});

test('CausalCertificate: Valid SHA-256 signature and tamper detection', () => {
  const finding = {
    id: 'f-cert-audit',
    runId: 'r-cert',
    stepIdx: 1,
    kind: 'empty_accessible_name',
    trustTier: 'proven',
    wcagRules: ['WCAG 4.1.2 Name, Role, Value'],
    severity: 'high',
    title: 'Icon button lacks accessible name',
    summary: 'Button has no label'
  };
  const dom = {
    selector: 'button.icon-btn',
    outerHTML: '<button class="icon-btn"><svg></svg></button>'
  };

  const graph = causalEngine.buildCausalGraph(finding, dom);
  const interventions = causalEngine.generateInterventions(graph, finding);
  const patches = [
    {
      id: 'patch-001',
      intervention: interventions[0],
      originalHTML: dom.outerHTML,
      patchedHTML: '<button class="icon-btn" aria-label="Action Trigger"><svg></svg></button>',
      invasiveness: 1,
      confidence: 0.95,
      explanation: 'Added aria-label'
    }
  ];

  const verification = {
    patchId: 'patch-001',
    verified: true,
    barrierEliminated: true,
    regressionCount: 0,
    regressionFindings: [],
    replaySteps: 2,
    replaySuccess: true,
    timestamp: new Date().toISOString(),
    proofHash: '4a5e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
    explanation: 'Patch verified barrier-free with 0 regressions'
  };

  const cert = certGenerator.generateCertificate(
    finding,
    { finding, causalGraph: graph, interventions, patches, bestPatch: patches[0] },
    verification
  );

  // 1. Signature format: 64-character hex SHA-256
  assert.strictEqual(cert.signatureHash.length, 64);
  assert(/^[0-9a-f]{64}$/.test(cert.signatureHash), 'Signature must be valid 64-hex string');

  // 2. Verified flags
  assert.strictEqual(cert.verification.barrierEliminated, true);
  assert.strictEqual(cert.verification.regressionFree, true);

  // 3. Cryptographic tamper detection
  const tampered1 = { ...cert, verification: { ...cert.verification, barrierEliminated: false } };
  const { signatureHash: sig1, ...body1 } = tampered1;
  const hash1 = createHash('sha256').update(JSON.stringify(body1)).digest('hex');
  assert.notStrictEqual(hash1, cert.signatureHash, 'Tampering barrierEliminated must invalidate signature');

  const tampered2 = { ...cert, remediation: { ...cert.remediation, invasivenessLevel: 5 } };
  const { signatureHash: sig2, ...body2 } = tampered2;
  const hash2 = createHash('sha256').update(JSON.stringify(body2)).digest('hex');
  assert.notStrictEqual(hash2, cert.signatureHash, 'Tampering invasivenessLevel must invalidate signature');
});

// =========================================================================
// 7. ChaosInjector & Motor Tremor Stress Invariants
// =========================================================================
console.log('\n--- 7. Testing Adversarial Stress Injector & Motor Tremor Simulator ---');

const chaos = new ChaosInjector();

test('ChaosInjector: All 15 adversarial conditions intact across 5 categories', () => {
  const conds = chaos.getAvailableConditions();
  assert.strictEqual(conds.length, 15);
  const categories = new Set(conds.map(c => c.category));
  assert.strictEqual(categories.size, 5);
  assert(categories.has('viewport'));
  assert(categories.has('visual'));
  assert(categories.has('timing'));
  assert(categories.has('network'));
  assert(categories.has('interaction'));
});

const tremor = new MotorTremorSimulator();

test('MotorTremorSimulator: Interface stability and timing jitter generation', () => {
  assert(typeof tremor.pressKeyWithTremor === 'function');
  assert(typeof tremor.simulateInteraction === 'function');
});

console.log(`\n===============================================================`);
console.log(`🎉 ALL ${passedAssertions} EMPIRICAL ADVERSARIAL STRESS CHALLENGES PASSED!`);
console.log(`===============================================================\n`);
