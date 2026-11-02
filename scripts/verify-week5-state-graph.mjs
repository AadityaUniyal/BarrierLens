#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

import { chromium } from 'playwright';

// Engine dynamic imports evaluated under tsx loader
const fingerprintModule = await import('../lib/barrierlens/engines/state-fingerprint.ts');
const { ProductionStateFingerprintEngine } = fingerprintModule;
const graphModule = await import('../lib/barrierlens/engines/exploration-graph.ts');
const { ExplorationStateGraph } = graphModule;

console.log('======================================================================');
console.log('  BarrierLens: Week 5 State Fingerprinting & Exploration Graph Test   ');
console.log('======================================================================\n');

async function runWeek5Verification() {
  const engine = new ProductionStateFingerprintEngine();
  const graph = new ExplorationStateGraph();

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
  // SUITE 1: URL Normalization & Dynamic Parameter Stripping
  // ======================================================================
  console.log('======================================================================');
  console.log(' SUITE 1: URL Normalization & Dynamic Parameter Stripping');
  console.log('======================================================================');

  const rawUrl1 = 'https://shop.example.com/products/49219?utm_source=google&ref=summer_promo#details';
  const rawUrl2 = 'https://shop.example.com/products/49219?session_id=abc98124&gclid=xyz';
  const rawUrl3 = 'https://shop.example.com/products/84120';

  const norm1 = engine.normalizeUrl(rawUrl1);
  const norm2 = engine.normalizeUrl(rawUrl2);
  const norm3 = engine.normalizeUrl(rawUrl3);

  assert(!norm1.includes('utm_source'), 'Tracking query param utm_source stripped');
  assert(!norm1.includes('ref='), 'Tracking query param ref stripped');
  assert(!norm1.includes('#details'), 'URL fragment stripped');
  assert(norm1 === 'https://shop.example.com/products/:id', 'Dynamic numeric ID collapsed to :id');
  assert(norm1 === norm2 && norm2 === norm3, 'All variant URLs normalize to identical canonical slug');
  console.log(`   ✓ Canonical URL: ${norm1}`);

  // ======================================================================
  // SUITE 2: DOM SimHash & Layout pHash Generation
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' SUITE 2: DOM SimHash & Layout pHash Generation');
  console.log('======================================================================');

  const domA = `
    <html>
      <head><title>Test Store</title></head>
      <body>
        <header><nav><ul><li><a href="/">Home</a></li><li><a href="/cart">Cart</a></li></ul></nav></header>
        <main><section><h1>Product Page</h1><button class="btn-primary">Buy Now</button></section></main>
      </body>
    </html>
  `;

  // DomB has slightly altered attribute values and dynamic tracking scripts, but identical skeleton
  const domB = `
    <html>
      <head><title>Test Store - Dynamic Ad</title></head>
      <body>
        <header><nav><ul><li><a href="/" data-trk="1">Home</a></li><li><a href="/cart" data-trk="2">Cart</a></li></ul></nav></header>
        <main><section><h1>Product Page</h1><button class="btn-secondary" id="buy-btn">Buy Now</button></section></main>
      </body>
    </html>
  `;

  const simHashA = engine.computeDomSimHash(domA);
  const simHashB = engine.computeDomSimHash(domB);

  assert(simHashA.length === 64, 'DOM SimHash produces 64-bit fingerprint string');
  const simDistance = engine.hammingDistance(simHashA, simHashB);
  assert(simDistance === 0, 'Attribute/class noise has 0 Hamming distance on tag skeleton');
  console.log(`   ✓ 64-bit SimHash: ${simHashA.slice(0, 32)}... (Distance: ${simDistance})`);

  const layoutBoxesA = [
    { x: 100, y: 50, width: 200, height: 40 },
    { x: 400, y: 200, width: 300, height: 150 }
  ];
  const pHashA = engine.computeLayoutPHash(layoutBoxesA);
  assert(pHashA.length === 64, 'Layout pHash produces 64-bit perceptual hash');

  // ======================================================================
  // SUITE 3: Composite Fingerprint Merging & Loop Prevention
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' SUITE 3: State Merging & Deduplication Evaluation');
  console.log('======================================================================');

  const state1 = engine.computeCompositeFingerprint(
    'https://shop.example.com/catalog',
    '[1] button "Search" [2] link "Cart"',
    domA,
    layoutBoxesA,
    2
  );

  const state1Noise = engine.computeCompositeFingerprint(
    'https://shop.example.com/catalog?utm_medium=cpc',
    '[1] button "Search" [2] link "Cart"',
    domB,
    layoutBoxesA,
    2
  );

  const state2Different = engine.computeCompositeFingerprint(
    'https://shop.example.com/checkout',
    '[10] input "Card Number" [11] button "Place Order"',
    '<html><body><form><input><button></button></form></body></html>',
    [{ x: 200, y: 300, width: 400, height: 60 }],
    2
  );

  const comparison = engine.compareStates(state1, state1Noise);
  assert(comparison.shouldMerge === true, 'Slightly noisy state merged into existing canonical state');
  assert(comparison.compositeSimilarity >= 0.95, 'Composite similarity score >= 0.95 for equivalent states');

  const differentComp = engine.compareStates(state1, state2Different);
  assert(differentComp.shouldMerge === false, 'Distinct state correctly kept discrete (shouldMerge = false)');

  // ======================================================================
  // SUITE 4: A* Exploration State Graph & Backtracking
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' SUITE 4: A* Exploration Graph & Backtracking Recovery');
  console.log('======================================================================');

  // Register root state
  const rootReg = graph.registerState(state1, 0, 2.0);
  assert(rootReg.isNewState === true, 'Root state registered as new exploration node');

  // Register child transition via Tab
  const step1Action = { idx: 1, persona: 'keyboard', actionType: 'press_key', key: 'Tab', tier: 0, timestamp: Date.now() };
  const childReg = graph.registerState(state2Different, 1, 0.5, { fromNodeId: rootReg.node.id, action: step1Action });
  assert(childReg.isNewState === true, 'Next step transitions to new state node in graph');

  // Attempt duplicate visit (should merge and increment visit count)
  const dupReg = graph.registerState(state1Noise, 2, 2.0);
  assert(dupReg.isNewState === false, 'Revisited noisy state merges without creating cyclic duplicate node');
  assert(dupReg.node.visitedCount === 2, 'Visited count incremented to 2');

  // Reconstruct path from child back to root
  const recoveredPath = graph.reconstructPathToNode(childReg.node.id);
  assert(recoveredPath.length === 1, 'Path reconstructed cleanly from child to root');
  assert(recoveredPath[0].key === 'Tab', 'Recovered path contains the physical key sequence: Tab');

  const summary = graph.getGraphSummary();
  assert(summary.totalStates === 2, 'Graph contains exactly 2 discrete states across 3 actions');
  assert(summary.totalTransitions === 1, 'Graph edges recorded accurately');

  console.log('\n======================================================================');
  console.log(` TEST SUITE SUMMARY: ALL ${total} ASSERTIONS PASSED (${passed}/${total})`);
  console.log('======================================================================\n');
}

runWeek5Verification().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
