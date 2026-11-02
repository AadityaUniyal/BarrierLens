import assert from 'node:assert/strict';
import { BarrierGenomeEncoder } from '../lib/barrierlens/genome/barrier-encoder.ts';
import { GenomeStore } from '../lib/barrierlens/genome/genome-store.ts';
import { CrossSiteTransfer } from '../lib/barrierlens/genome/cross-site-transfer.ts';
import { CounterfactualEngine } from '../lib/barrierlens/causal/counterfactual-engine.ts';
import { CausalCertificateGenerator } from '../lib/barrierlens/causal/causal-certificate.ts';
import { ChaosInjector } from '../lib/barrierlens/adversarial/chaos-injector.ts';
import { MotorTremorSimulator } from '../lib/barrierlens/adversarial/motor-tremor.ts';

console.log('🧪 Starting Verification Suite: BarrierLens Novel Differentiators...\n');

let totalAssertions = 0;
function check(condition, message) {
  assert(condition, message);
  totalAssertions++;
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  // =========================================================================
  // SUITE 1: Barrier Genome System (768-dim Vector Embeddings)
  // =========================================================================
  console.log('📌 Suite 1: Barrier Genome Encoder & Vector Space');
  const encoder = new BarrierGenomeEncoder();

  const findingA = {
    id: 'finding-trap-modal',
    runId: 'run-1',
    stepIdx: 4,
    kind: 'keyboard_trap',
    trustTier: 'proven',
    wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
    severity: 'critical',
    severityScore: 9.5,
    severityInterval: [8.8, 10.0],
    title: 'Deterministic Keyboard Trap in Checkout Modal',
    summary: 'Focus cycles endlessly within input controls; Escape key is prevented.',
    evidence: {
      selector: '#checkout-modal',
      role: 'dialog',
      focusMoved: false
    }
  };

  const contextA = {
    goal: 'Purchase item with keyboard only',
    persona: 'keyboard',
    targetUrl: 'https://shop.alpha.com/cart',
    effortRatio: 3.2,
    taskSuccess: false,
    maxSteps: 15,
    stepCount: 8
  };

  const genomeA = encoder.encode(findingA, contextA);

  check(genomeA.vector.length === 768, 'Vector dimension is exactly 768');
  check(genomeA.magnitude >= 0.95 && genomeA.magnitude <= 1.05, 'Vector magnitude is normalized close to 1.0');
  
  // Self-similarity
  const selfSim = encoder.similarity(genomeA, genomeA);
  check(selfSim >= 0.99, `Self-similarity is unity (~${selfSim})`);

  // Distinct finding
  const findingB = {
    id: 'finding-contrast-footer',
    runId: 'run-2',
    stepIdx: 1,
    kind: 'color_contrast_violation',
    trustTier: 'proven',
    wcagRules: ['WCAG 1.4.3 Contrast (Minimum)'],
    severity: 'medium',
    severityScore: 5.2,
    severityInterval: [4.5, 6.0],
    title: 'Low Text Contrast on Footer Terms',
    summary: 'Contrast ratio 2.1:1 fails required 4.5:1 threshold.',
    evidence: {
      selector: 'footer a.terms',
      role: 'link'
    }
  };

  const genomeB = encoder.encode(findingB, { ...contextA, goal: 'Read terms of service' });
  const diffSim = encoder.similarity(genomeA, genomeB);
  check(diffSim < 0.70, `Dissimilar barriers have low cosine similarity (${diffSim} < 0.70)`);

  // Test Genome Store
  const store = new GenomeStore();
  await store.store(genomeA);
  await store.store(genomeB);

  // Store a third variant of the keyboard trap from another domain
  const findingA2 = {
    ...findingA,
    id: 'finding-trap-modal-store2',
    title: 'Deterministic Focus Trap in Dialog',
    evidence: { selector: '#dialog-modal', role: 'dialog' }
  };
  const genomeA2 = encoder.encode(findingA2, { ...contextA, targetUrl: 'https://shop.beta.com/cart' });
  await store.store(genomeA2);

  const similarGenomes = await store.findSimilar(genomeA, 5, 0.70);
  check(similarGenomes.length >= 1, `GenomeStore retrieved similar vectors (found ${similarGenomes.length})`);

  // Test Cross-Site Transfer Predictions
  const transfer = new CrossSiteTransfer();
  const predictions = await transfer.predictBarriers(
    'https://beta.org',
    '<div class="modal"><div class="overlay"><h2>Subscribe</h2><button class="icon-close"><svg></svg></button></div></div>'
  );
  check(predictions.length >= 1, `CrossSiteTransfer generated zero-shot barrier predictions (count = ${predictions.length})`);
  check(predictions.some(p => p.predictedKind === 'empty_accessible_name' || p.predictedKind === 'keyboard_trap'),
    'Predictor correctly flagged modal / icon button accessibility hazards');

  console.log('\n');

  // =========================================================================
  // SUITE 2: Causal Counterfactual Engine & Cryptographic Proofs
  // =========================================================================
  console.log('📌 Suite 2: Causal Counterfactual Engine & Cryptographic Certificates');
  const causalEngine = new CounterfactualEngine();

  const domSnapshot = {
    selector: '#trap-modal',
    outerHTML: '<div id="trap-modal" class="modal-box"><h3>Sign In</h3><button>Submit</button></div>',
    parentChain: [{ selector: '#app-root', tag: 'div' }],
    focusable: true,
    tabIndex: 0
  };

  const causalResult = await causalEngine.generateCounterfactuals(findingA, domSnapshot);
  check(causalResult.causalGraph.nodes.length >= 1, 'Constructed SCM causal graph nodes');
  check(causalResult.interventions.length >= 1, `Generated do-calculus intervention candidates (count = ${causalResult.interventions.length})`);
  check(causalResult.patches.length >= 1, `Synthesized candidate counterfactual patches (count = ${causalResult.patches.length})`);
  check(causalResult.bestPatch.invasiveness <= 2, `Minimal invasiveness patch prioritized (level = ${causalResult.bestPatch.invasiveness})`);

  // Generate Causal Certificate
  const certGenerator = new CausalCertificateGenerator();
  const mockVerification = {
    patchId: causalResult.bestPatch.id,
    verified: true,
    barrierEliminated: true,
    regressionCount: 0,
    regressionFindings: [],
    replaySteps: 2,
    replaySuccess: true,
    timestamp: new Date().toISOString(),
    proofHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    explanation: 'Barrier eliminated with 0 regressions in Playwright sandbox.'
  };

  const cert = certGenerator.generateCertificate(findingA, causalResult, mockVerification);
  check(cert.signatureHash.length === 64, `Causal certificate signed with SHA-256 signature (hash: ${cert.signatureHash.slice(0, 16)}...)`);
  check(cert.verification.barrierEliminated === true, 'Certificate confirms barrier eliminated');
  check(cert.verification.regressionFree === true, 'Certificate confirms 0 regressions');

  console.log('\n');

  // =========================================================================
  // SUITE 3: Adversarial Accessibility Stress Testing (AAST)
  // =========================================================================
  console.log('📌 Suite 3: Adversarial Accessibility Stress Testing (AAST)');
  const chaosInjector = new ChaosInjector();
  const conditions = chaosInjector.getAvailableConditions();
  check(conditions.length >= 15, `ChaosInjector provides comprehensive stress catalog (${conditions.length} conditions available)`);
  check(conditions.some(c => c.id === 'viewport_320'), 'Includes 320px mobile viewport reflow stressor');
  check(conditions.some(c => c.id === 'forced_colors'), 'Includes Windows High Contrast Mode forced colors stressor');
  check(conditions.some(c => c.id === 'slow_3g'), 'Includes slow 3G network throttle stressor');

  // Motor Tremor Simulation Check
  const tremorSim = new MotorTremorSimulator();
  check(typeof tremorSim.pressKeyWithTremor === 'function', 'MotorTremorSimulator has pressKeyWithTremor');
  check(typeof tremorSim.simulateInteraction === 'function', 'MotorTremorSimulator has simulateInteraction');

  console.log('\n======================================================');
  console.log(`🎉 ALL ${totalAssertions} NOVEL DIFFERENTIATOR VERIFICATIONS PASSED!`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ Verification Failed:', err);
  process.exit(1);
});
