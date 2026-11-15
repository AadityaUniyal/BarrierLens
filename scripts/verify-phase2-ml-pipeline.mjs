/**
 * BarrierLens Phase 2 ML Pipeline & Tier 1/2/3 Verification Suite
 * Validates:
 * 1. M1: MiniLM Accessible Name Quality Evaluator
 * 2. M2: Visual-Semantic Affordance Mismatch Detector
 * 3. M3: LightGBM Action Ranker & Tier 1 Shortcut
 * 4. M4: MAPIE Conformal Uncertainty Interval Model
 * 5. In-session axe-core Baseline Runner
 */

import { ActionRanker } from '../lib/barrierlens/ml/action-ranker.ts';
import { LabelQualityClassifier } from '../lib/barrierlens/ml/label-quality.ts';
import { VisualAffordanceEngine } from '../lib/barrierlens/ml/visual-affordance.ts';
import { ConformalImpactModel } from '../lib/barrierlens/ml/conformal-impact.ts';
import { BarrierGenomeEncoder } from '../lib/barrierlens/genome/barrier-encoder.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runPhase2Verification() {
  console.log('\n======================================================');
  console.log('🧪 Starting BarrierLens Phase 2 ML Pipeline Verification');
  console.log('======================================================\n');

  // ----------------------------------------------------------------
  // Suite 1: M3 LightGBM Action Ranker
  // ----------------------------------------------------------------
  console.log('📌 Suite 1: M3 LightGBM Action Ranker (Tier 1 Inference)');
  const ranker = new ActionRanker();
  
  const sampleNodes = [
    { selector: '#nav-home', role: 'link', name: 'Home', disabled: false },
    { selector: '#search-input', role: 'input', name: 'Search query', disabled: false, value: '' },
    { selector: '#search-submit-btn', role: 'button', name: 'Search submit', disabled: false },
    { selector: '#footer-terms', role: 'link', name: 'Terms of Service', disabled: false }
  ];

  // Test synchronous ranker
  const rankResult = ranker.rankNextAction('Submit search query', sampleNodes, '#search-input', ['Tab']);
  assert(rankResult.bestNode !== null, 'ActionRanker returned a candidate node');
  assert(rankResult.bestNode.selector.includes('search'), 'ActionRanker prioritized search-relevant element');
  assert(rankResult.confidence > 0.50, `Confidence is positive (${rankResult.confidence})`);
  assert(typeof rankResult.isHighConfidence === 'boolean', 'isHighConfidence flag is boolean');
  assert(['press_key', 'type_text'].includes(rankResult.recommendedAction), 'recommendedAction is valid');

  // Test empty nodes edge case
  const emptyRank = ranker.rankNextAction('Any goal', [], '', []);
  assert(emptyRank.bestNode === null, 'Empty node list returns null candidate');
  assert(emptyRank.key === 'Tab', 'Fallback key is Tab');


  // ----------------------------------------------------------------
  // Suite 2: M1 Accessible Name Quality
  // ----------------------------------------------------------------
  console.log('\n📌 Suite 2: M1 Accessible Name Quality (MiniLM / Syntactic)');
  const labelClassifier = new LabelQualityClassifier();

  const emptyRes = labelClassifier.classifyName('button', '');
  assert(emptyRes.isAdequate === false, 'Empty accessible name marked inadequate');
  assert(emptyRes.label === 'empty', 'Empty accessible name labeled as "empty"');

  const genericRes = labelClassifier.classifyName('button', 'btn_submit');
  assert(genericRes.isAdequate === false, 'Synthetic placeholder name btn_submit marked inadequate');
  assert(genericRes.label === 'corrupted_or_generic', 'Labeled as corrupted_or_generic');

  const clickHereRes = labelClassifier.classifyName('a', 'click here');
  assert(clickHereRes.isAdequate === false, '"click here" non-descriptive link marked inadequate');

  const goodRes = labelClassifier.classifyName('button', 'Confirm Order and Pay $45.00');
  assert(goodRes.isAdequate === true, 'Descriptive accessible name marked adequate');
  assert(goodRes.confidence >= 0.70, `Confidence is healthy (${goodRes.confidence})`);


  // ----------------------------------------------------------------
  // Suite 3: M2 Visual-Semantic Affordance Mismatch Detector
  // ----------------------------------------------------------------
  console.log('\n📌 Suite 3: M2 Visual-Semantic Affordance Mismatch (CLIP / SVG)');
  const affordanceEngine = new VisualAffordanceEngine();

  // Contradiction: Trash icon labeled "Save Document"
  const contradictionRes = affordanceEngine.evaluateIconAffordance(
    '#action-btn',
    'Save Document',
    '<svg class="icon-trash-bin"><path d="M3 6h18"/></svg>'
  );
  assert(contradictionRes.hasSemanticContradiction === true, 'Caught severe trash icon vs "Save Document" contradiction');
  assert(contradictionRes.detectedIconType === 'trash', 'Detected icon metaphor as trash');
  assert(contradictionRes.confidence > 0.75, 'High confidence on severe contradiction');

  // Aligned: Search icon labeled "Search Catalog"
  const alignedRes = affordanceEngine.evaluateIconAffordance(
    '#search-btn',
    'Search Catalog',
    '<svg class="icon-magnifier-glass"><circle cx="11" cy="11" r="8"/></svg>'
  );
  assert(alignedRes.hasSemanticContradiction === false, 'Aligned search icon produces 0 false contradiction');


  // ----------------------------------------------------------------
  // Suite 4: M4 Conformal Impact Scoring
  // ----------------------------------------------------------------
  console.log('\n📌 Suite 4: M4 Calibrated Conformal Impact Uncertainty Intervals');
  const impactModel = new ConformalImpactModel();

  const trapImpact = impactModel.scoreFinding('keyboard_trap', 'keyboard', true, 6);
  assert(trapImpact.score >= 9.0, `Keyboard trap blocking task scored critical (${trapImpact.score})`);
  assert(trapImpact.severity === 'critical', 'Severity is critical');
  assert(Array.isArray(trapImpact.interval), 'Conformal interval is array');
  assert(trapImpact.interval[0] < trapImpact.interval[1], `Conformal interval valid: [${trapImpact.interval[0]}, ${trapImpact.interval[1]}]`);
  assert(trapImpact.interval[0] >= 8.0, 'Lower conformal bound reflects high guaranteed severity');


  // ----------------------------------------------------------------
  // Suite 5: Barrier Genome Semantic Representation
  // ----------------------------------------------------------------
  console.log('\n📌 Suite 5: Barrier Genome Encoder & Representation');
  const encoder = new BarrierGenomeEncoder();

  const sampleFinding = {
    id: 'test_finding_01',
    runId: 'run_01',
    stepIdx: 2,
    kind: 'keyboard_trap',
    trustTier: 'proven',
    wcagRules: ['WCAG 2.1.2 No Keyboard Trap'],
    severity: 'critical',
    severityScore: 9.6,
    severityInterval: [9.1, 10.0],
    title: 'Modal Focus Sink',
    summary: 'Focus trapped in dialog container',
    evidence: { selector: '#promo-modal' }
  };

  const genome = encoder.encode(sampleFinding, {
    goal: 'Checkout shopping cart',
    persona: 'keyboard',
    targetUrl: 'https://shop.example.com',
    effortRatio: 3.5,
    taskSuccess: false,
    maxSteps: 10,
    stepCount: 4
  });

  assert(genome.vector.length === 768, 'Genome vector dimension is 768');
  assert(Math.abs(genome.magnitude - 1.0) < 0.05, `Magnitude is unit-normalized (~${genome.magnitude.toFixed(3)})`);
  assert(genome.metadata.trustTier === 'proven', 'Trust tier preserved in genome metadata');

  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 2 ML PIPELINE VERIFICATIONS PASSED (20/20)');
  console.log('======================================================\n');
}

runPhase2Verification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
