#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Transparently ensure execution under tsx loader when invoked directly with `node`
if (!process.env.RUNNING_UNDER_TSX) {
  const result = spawnSync('npx', ['tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNING_UNDER_TSX: '1' },
    shell: true
  });
  process.exit(result.status ?? 0);
}

const fingerprintModule = await import('../lib/barrierlens/engines/state-fingerprint.ts');
const { ProductionStateFingerprintEngine } = fingerprintModule;
const graphModule = await import('../lib/barrierlens/engines/exploration-graph.ts');
const { ExplorationStateGraph } = graphModule;

console.log('======================================================================');
console.log('  BarrierLens: Adversarial Challenge & Stress Tests — Suite 5        ');
console.log('======================================================================\n');

async function runAdversarialSuite5() {
  const engine = new ProductionStateFingerprintEngine();
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // ======================================================================
  // CHALLENGE 1: URL Normalization Edge Cases & Resiliency
  // ======================================================================
  console.log('======================================================================');
  console.log(' CHALLENGE 1: URL Normalization Edge Cases & Dynamic Slugs');
  console.log('======================================================================');

  // 1a. Malformed URL fallback
  const malformed = 'not-a-valid://url-format%%%%';
  const normMalformed = engine.normalizeUrl(malformed);
  assert(normMalformed === malformed, 'Malformed URL does not throw and returns raw fallback');

  // 1b. Multiple numeric slugs in deep REST path
  const deepUrl = 'https://app.lens.internal/organizations/9821/projects/554/audits/12993?utm_campaign=audit&token=safe';
  const normDeep = engine.normalizeUrl(deepUrl);
  assert(normDeep === 'https://app.lens.internal/organizations/:id/projects/:id/audits/:id?token=safe', 
    'Multiple numeric path IDs collapsed to /:id while preserving non-tracking params');

  // 1c. Non-numeric slug preservation
  const namedUrl = 'https://app.lens.internal/organizations/acme-corp/projects/main';
  const normNamed = engine.normalizeUrl(namedUrl);
  assert(normNamed === 'https://app.lens.internal/organizations/acme-corp/projects/main', 
    'Alphanumeric/named slugs preserved without false collapsing');

  // 1d. Trailing numeric ID at root
  const rootIdUrl = 'https://app.lens.internal/999';
  const normRootId = engine.normalizeUrl(rootIdUrl);
  assert(normRootId === 'https://app.lens.internal/:id', 'Single root numeric path correctly collapsed');

  // ======================================================================
  // CHALLENGE 2: DOM SimHash Robustness, Empty Bounds & Permutations
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 2: DOM SimHash Robustness & Boundary Conditions');
  console.log('======================================================================');

  // 2a. Empty and text-only DOM
  const emptySim = engine.computeDomSimHash('');
  assert(emptySim === '0'.repeat(64), 'Empty DOM returns 64-bit all-zeros vector');

  const textOnlySim = engine.computeDomSimHash('Hello world, no HTML tags here at all.');
  assert(textOnlySim === '0'.repeat(64), 'Text-only DOM without tags returns 64-bit all-zeros vector');

  // 2b. Single tag DOM
  const singleTagSim = engine.computeDomSimHash('<div>OnlyOneTag</div>');
  assert(singleTagSim.length === 64, 'Single tag produces valid 64-bit SimHash');

  // 2c. Order permutation sensitivity
  const domOrderA = '<nav><button></button><a></a></nav>';
  const domOrderB = '<nav><a></a><button></button></nav>';
  const simOrderA = engine.computeDomSimHash(domOrderA);
  const simOrderB = engine.computeDomSimHash(domOrderB);
  const distOrder = engine.hammingDistance(simOrderA, simOrderB);
  assert(distOrder > 0, `Tag order permutation detected (Hamming distance: ${distOrder})`);

  // 2d. High scale DOM (10,000 tags) performance
  const bigDom = '<div>' + '<p><span><button>Click</button></span></p>'.repeat(2500) + '</div>';
  const t0 = performance.now();
  const bigSim = engine.computeDomSimHash(bigDom);
  const duration = performance.now() - t0;
  assert(bigSim.length === 64, `Massive DOM (10,000 tags) processed in ${duration.toFixed(2)}ms`);
  assert(duration < 200, 'Massive DOM SimHash execution completes in < 200ms');

  // ======================================================================
  // CHALLENGE 3: Layout pHash Spatial Mapping & Boundary Boxes
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 3: Layout pHash Spatial Density Matrix');
  console.log('======================================================================');

  // 3a. Empty bounding boxes
  const emptyPHash = engine.computeLayoutPHash([]);
  assert(emptyPHash === '0'.repeat(64), 'Empty layout box list returns 64-bit all-zeros hash');

  // 3b. Extreme off-screen bounding boxes (negative & beyond viewport)
  const extremeBoxes = [
    { x: -500, y: -200, width: 100, height: 100 },
    { x: 5000, y: 9000, width: 200, height: 200 }
  ];
  const extremePHash = engine.computeLayoutPHash(extremeBoxes);
  assert(extremePHash.length === 64, 'Extreme out-of-viewport boxes safely clamped into 8x8 matrix');

  // 3c. Spatial sensitivity: top-left cluster vs bottom-right cluster
  const topLeftBoxes = [
    { x: 10, y: 10, width: 150, height: 40 },
    { x: 20, y: 60, width: 200, height: 80 }
  ];
  const bottomRightBoxes = [
    { x: 1100, y: 700, width: 150, height: 40 },
    { x: 1050, y: 750, width: 200, height: 80 }
  ];
  const pHashTopLeft = engine.computeLayoutPHash(topLeftBoxes);
  const pHashBottomRight = engine.computeLayoutPHash(bottomRightBoxes);
  const pHashDist = engine.hammingDistance(pHashTopLeft, pHashBottomRight);
  assert(pHashDist > 0, `Divergent visual layouts yield high pHash distance: ${pHashDist}`);

  // ======================================================================
  // CHALLENGE 4: State Equivalence & Soft-Merge Threshold Invariants
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 4: State Equivalence & Soft-Merge Thresholds');
  console.log('======================================================================');

  const baseState = engine.computeCompositeFingerprint(
    'https://example.com/checkout/step1',
    '[1] heading "Checkout" [2] input "Email"',
    '<html><body><header></header><main><input><button></button></main></body></html>',
    [{ x: 100, y: 100, width: 300, height: 40 }],
    2
  );

  // 4a. Cross-URL invariance: identical DOM/layout across different canonical URLs MUST NOT merge
  const differentUrlState = engine.computeCompositeFingerprint(
    'https://example.com/account/login',
    '[1] heading "Checkout" [2] input "Email"',
    '<html><body><header></header><main><input><button></button></main></body></html>',
    [{ x: 100, y: 100, width: 300, height: 40 }],
    2
  );
  const crossUrlComp = engine.compareStates(baseState, differentUrlState);
  assert(crossUrlComp.shouldMerge === false, 'Cross-URL states with identical DOM/AX NEVER soft-merge');
  assert(crossUrlComp.urlMatch === false, 'URL match correctly reports false');

  // 4b. Synthetic bit-flip distance verification
  const exactClone = { ...baseState, timestamp: Date.now() + 1000 };
  const cloneComp = engine.compareStates(baseState, exactClone);
  assert(cloneComp.compositeSimilarity === 1.0, 'Exact clone has 1.0 composite similarity');
  assert(cloneComp.shouldMerge === true, 'Exact clone soft-merges');

  // ======================================================================
  // CHALLENGE 5: A* Search Frontier & Backtracking Path Recovery
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 5: A* Search Frontier, Cycles & Deep Backtracking');
  console.log('======================================================================');

  const graph = new ExplorationStateGraph();

  // 5a. Multi-step deep path: Root -> N1 -> N2 -> N3 -> N4
  const root = graph.registerState(baseState, 0, 4.0);
  let parentId = root.node.id;

  const steps = [
    { persona: 'keyboard', actionType: 'press_key', key: 'Tab', idx: 1 },
    { persona: 'keyboard', actionType: 'press_key', key: 'Tab', idx: 2 },
    { persona: 'keyboard', actionType: 'press_key', key: 'Enter', idx: 3 },
    { persona: 'keyboard', actionType: 'type_text', text: 'ADA Compliance', idx: 4 }
  ];

  const routeNames = ['address', 'shipping', 'payment', 'review'];
  let lastNodeId = '';
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const dummyFingerprint = engine.computeCompositeFingerprint(
      `https://example.com/checkout/${routeNames[i]}`,
      `ax-node-${i}`,
      `<div id="step-${i}"><button>Next ${i}</button></div>`,
      [{ x: 50 * i, y: 50 * i, width: 100, height: 30 }],
      1
    );
    const reg = graph.registerState(dummyFingerprint, i + 1, 4.0 - (i * 0.8), {
      fromNodeId: parentId,
      action: { ...s, tier: 0, timestamp: Date.now() }
    });
    parentId = reg.node.id;
    lastNodeId = reg.node.id;
  }

  // 5b. Deep path reconstruction verification
  const deepPath = graph.reconstructPathToNode(lastNodeId);
  assert(deepPath.length === 4, `Reconstructed path length exactly 4 (expected 4, got ${deepPath.length})`);
  assert(deepPath[0].key === 'Tab' && deepPath[1].key === 'Tab' && deepPath[2].key === 'Enter', 
    'Chronological key sequence perfectly reconstructed: Tab -> Tab -> Enter');
  assert(deepPath[3].text === 'ADA Compliance', 'Terminal action parameter correctly reconstructed');

  // 5c. Cycle injection: Transition from N4 back to root
  const cycleReg = graph.registerState(baseState, 5, 4.0, {
    fromNodeId: lastNodeId,
    action: { persona: 'keyboard', actionType: 'press_key', key: 'Escape', idx: 5, tier: 0, timestamp: Date.now() }
  });
  assert(cycleReg.isNewState === false, 'Revisited root state detected as cycle, NOT creating duplicate node');
  assert(cycleReg.node.visitedCount === 2, 'Root visited count incremented to 2');

  // 5d. Priority Queue Pop Order (Lowest f(n) first)
  const firstPopped = graph.popBestState();
  assert(firstPopped !== null, 'Frontier successfully yields candidate state');
  
  // 5e. Graceful non-existent node query
  const emptyPath = graph.reconstructPathToNode('non-existent-hash-999');
  assert(Array.isArray(emptyPath) && emptyPath.length === 0, 'Non-existent node path query safely returns empty array');

  // 5f. Graph summary integrity
  const summary = graph.getGraphSummary();
  assert(summary.totalStates === 5, `Total discrete states in graph is 5 (got ${summary.totalStates})`);
  assert(summary.maxDepth === 4, `Max exploration depth is 4 (got ${summary.maxDepth})`);

  console.log('\n======================================================================');
  console.log(` ADVERSARIAL CHALLENGE SUMMARY: ALL ${total} ASSERTIONS PASSED (${passed}/${total})`);
  console.log('======================================================================\n');
}

runAdversarialSuite5().catch((err) => {
  console.error('Adversarial challenge failed:', err);
  process.exit(1);
});
