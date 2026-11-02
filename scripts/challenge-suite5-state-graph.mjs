#!/usr/bin/env node

/**
 * Empirical Stress-Test & Adversarial Challenge Suite: Suite 5
 * (State Identity, Composite Fingerprinting & Exploration Graph Engine)
 *
 * Focus areas:
 * 1. Dynamic query param normalization (tracking, case sensitivity, ordering, malformed URLs)
 * 2. Numeric ID slug collapsing (single/multi-segment, extensions, boundary numbers, UUIDs)
 * 3. DOM SimHash 64-bit collision resistance (structural invariants, sensitivity, collisions, pathological inputs)
 * 4. Layout pHash sensitivity (spatial density, boundary clamping, zero-area, uniform vs skewed)
 * 5. Hamming soft-merging thresholds & composite similarity scoring (boundary tests, AX match shortcuts)
 * 6. A* exploration graph loop prevention (cycles, parent pointer integrity, priority queue, deep backtracking)
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);

// Transparently invoke under tsx loader if executed directly with `node`
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
console.log('  CHALLENGE SUITE 5: EMPIRICAL STRESS-TEST & ADVERSARIAL HARNESS     ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function runTest(suiteName, testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] [${suiteName}] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] [${suiteName}] ${testName}`);
    console.error(`         Detail: ${err.message}`);
    failedTests++;
    findings.push({
      suite: suiteName,
      test: testName,
      error: err.message,
      stack: err.stack
    });
  }
}

const engine = new ProductionStateFingerprintEngine();

// ======================================================================
// 1. DYNAMIC QUERY PARAM NORMALIZATION
// ======================================================================
console.log('--- 1. Dynamic Query Param Normalization Stress-Tests ---');

runTest('URL_NORM', '1.1 Standard tracking parameters are completely stripped', () => {
  const trackingParams = ['utm_source=fb', 'utm_medium=cpc', 'utm_campaign=winter', 'utm_term=shoes', 'utm_content=v1', 'ref=affiliate', 'gclid=123', 'fbclid=456', 'session_id=s999'];
  const testUrl = `https://example.com/shop?${trackingParams.join('&')}&color=blue`;
  const normalized = engine.normalizeUrl(testUrl);
  
  for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid', 'fbclid', 'session_id']) {
    assert(!normalized.includes(p), `Expected ${p} to be removed`);
  }
  assert(normalized.includes('color=blue'), 'Functional query parameter "color=blue" must be preserved');
});

runTest('URL_NORM', '1.2 Hash fragments stripped across all URL structures', () => {
  const urlWithHash = 'https://example.com/checkout?step=2#payment-section';
  const norm = engine.normalizeUrl(urlWithHash);
  assert(!norm.includes('#payment-section'), 'Fragment must be stripped');
  assert(norm.includes('step=2'), 'Step parameter preserved');
});

runTest('URL_NORM', '1.3 Empty URL and malformed URLs fall back gracefully without throw', () => {
  assert.strictEqual(engine.normalizeUrl(''), '');
  assert.strictEqual(engine.normalizeUrl('invalid-url-string'), 'invalid-url-string');
  assert.strictEqual(engine.normalizeUrl('javascript:void(0)'), 'javascript:void(0)');
  assert.strictEqual(engine.normalizeUrl('/relative/path/123'), '/relative/path/123');
});

runTest('URL_NORM', '1.4 Reordered functional query parameters comparison', () => {
  // Check behavior when functional params are reordered
  const urlA = 'https://example.com/products?color=red&size=large';
  const urlB = 'https://example.com/products?size=large&color=red';
  const normA = engine.normalizeUrl(urlA);
  const normB = engine.normalizeUrl(urlB);
  
  // Note: Standard URLSearchParams maintains insertion order. Does normalizeUrl sort them?
  console.log(`         [OBSERVATION] Param reordering equality: ${normA === normB}`);
  // We document whether query order matters for fingerprint
});

runTest('URL_NORM', '1.5 Case sensitivity in tracking parameters', () => {
  const urlUpper = 'https://example.com/store?UTM_SOURCE=google&color=red';
  const normUpper = engine.normalizeUrl(urlUpper);
  console.log(`         [OBSERVATION] Uppercase UTM param preserved or stripped: norm="${normUpper}"`);
  // URLSearchParams.delete is case-sensitive, so UTM_SOURCE remains unless handled
});

// ======================================================================
// 2. NUMERIC ID SLUG COLLAPSING
// ======================================================================
console.log('\n--- 2. Numeric ID Slug Collapsing Stress-Tests ---');

runTest('SLUG_NORM', '2.1 Single numeric slug collapsed to :id', () => {
  const norm = engine.normalizeUrl('https://example.com/products/49219');
  assert.strictEqual(norm, 'https://example.com/products/:id');
});

runTest('SLUG_NORM', '2.2 Multiple sequential and nested numeric slugs collapsed', () => {
  const norm = engine.normalizeUrl('https://example.com/orgs/101/users/42/orders/99999/items/3');
  assert.strictEqual(norm, 'https://example.com/orgs/:id/users/:id/orders/:id/items/:id');
});

runTest('SLUG_NORM', '2.3 Root-level numeric slug collapsed', () => {
  const norm = engine.normalizeUrl('https://example.com/12345');
  assert.strictEqual(norm, 'https://example.com/:id');
});

runTest('SLUG_NORM', '2.4 Versioned API slugs /v1, /v2 are NOT falsely collapsed', () => {
  const norm = engine.normalizeUrl('https://example.com/api/v2/items/888');
  assert.strictEqual(norm, 'https://example.com/api/v2/items/:id', 'API version /v2/ must be preserved');
});

runTest('SLUG_NORM', '2.5 Numeric slugs with file extensions behavior', () => {
  const urlWithExt = 'https://example.com/images/12345.png';
  const norm = engine.normalizeUrl(urlWithExt);
  console.log(`         [OBSERVATION] Slug with extension norm: "${norm}"`);
  assert(norm.includes('12345.png'), 'File extension prevents false collapsing to :id.png');
});

runTest('SLUG_NORM', '2.6 Zero and boundary numeric IDs collapsed', () => {
  const normZero = engine.normalizeUrl('https://example.com/items/0');
  assert.strictEqual(normZero, 'https://example.com/items/:id');
  
  const normMultiZero = engine.normalizeUrl('https://example.com/items/0000');
  assert.strictEqual(normMultiZero, 'https://example.com/items/:id');
});

// ======================================================================
// 3. DOM SIMHASH 64-BIT COLLISION RESISTANCE
// ======================================================================
console.log('\n--- 3. DOM SimHash 64-bit Collision Resistance Stress-Tests ---');

runTest('SIMHASH', '3.1 SimHash produces strictly 64 binary digits [01]{64}', () => {
  const html = '<div><header><nav><a href="/">Home</a></nav></header><main><button>OK</button></main></div>';
  const hash = engine.computeDomSimHash(html);
  assert.strictEqual(hash.length, 64);
  assert(/^[01]{64}$/.test(hash), 'Hash must only consist of binary 0 and 1 characters');
});

runTest('SIMHASH', '3.2 Empty or tagless DOM returns exactly 64 zeroes', () => {
  assert.strictEqual(engine.computeDomSimHash(''), '0'.repeat(64));
  assert.strictEqual(engine.computeDomSimHash('   Just plain text without HTML tags   '), '0'.repeat(64));
});

runTest('SIMHASH', '3.3 Heavy attribute & dynamic script noise maintains 0 Hamming distance', () => {
  const baseDom = `
    <html><body>
      <div id="app">
        <header><nav><ul><li><a href="/home">Home</a></li><li><a href="/settings">Settings</a></li></ul></nav></header>
        <section><article><h2>Welcome</h2><button type="submit">Save</button></article></section>
      </div>
    </body></html>
  `;
  
  const noisyDom = `
    <html lang="en" data-reactroot=""><body class="theme-dark bg-slate-900" style="margin: 0; padding: 0;">
      <div id="app" data-hydrate="true" data-v="3.2.1" class="container mx-auto px-4">
        <header role="banner" class="flex items-center"><nav role="navigation" aria-label="Main"><ul class="nav-list"><li class="nav-item"><a href="/home?session=xyz" class="active">Home</a></li><li class="nav-item"><a href="/settings?cache=false" data-track="1">Settings</a></li></ul></nav></header>
        <section class="content-section" aria-labelledby="h2"><article class="prose"><h2 id="h2">Different Title Text In Inner Text</h2><button type="submit" class="btn btn-primary" onclick="alert(1)">Completely Different Button Label</button></article></section>
      </div>
    </body></html>
  `;
  
  const hashBase = engine.computeDomSimHash(baseDom);
  const hashNoisy = engine.computeDomSimHash(noisyDom);
  const dist = engine.hammingDistance(hashBase, hashNoisy);
  assert.strictEqual(dist, 0, `Expected 0 Hamming distance under pure attribute/text noise, got ${dist}`);
});

runTest('SIMHASH', '3.4 Collision Resistance: Disjoint web page structures produce Hamming distance > 6', () => {
  // Page 1: E-commerce shopping cart
  const cartPage = `
    <div>
      <header><nav><a href="/">Home</a><a href="/cart">Cart</a></nav></header>
      <main>
        <section>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody><tr><td>Product A</td><td><input type="number"/></td><td>$20</td></tr></tbody>
          </table>
          <form><input type="text"/><button type="submit">Apply Coupon</button></form>
          <div><span>Subtotal</span><span>$20</span><button>Proceed to Checkout</button></div>
        </section>
      </main>
    </div>
  `;

  // Page 2: User profile / settings form
  const profilePage = `
    <div>
      <header><nav><a href="/profile">Profile</a><a href="/logout">Logout</a></nav></header>
      <main>
        <form>
          <fieldset>
            <legend>Personal Info</legend>
            <label>Name</label><input type="text"/>
            <label>Email</label><input type="email"/>
            <label>Bio</label><textarea></textarea>
            <label>Notifications</label><input type="checkbox"/>
          </fieldset>
          <button type="submit">Update Profile</button>
        </form>
      </main>
      <footer><p>Privacy Policy</p></footer>
    </div>
  `;

  const hashCart = engine.computeDomSimHash(cartPage);
  const hashProfile = engine.computeDomSimHash(profilePage);
  const dist = engine.hammingDistance(hashCart, hashProfile);
  
  console.log(`         [EMPIRICAL OBSERVATION] Cart vs Profile SimHash Hamming Distance: ${dist} (Threshold: 6)`);
  assert(dist > 6, `Distinct pages must NOT collide within soft-merge threshold (6). Actual distance: ${dist}`);
});

runTest('SIMHASH', '3.5 Tag case insensitivity (UPPERCASE vs lowercase HTML)', () => {
  const domLower = '<div><header><nav><a href="/">Link</a><button>Btn</button></nav></header></div>';
  const domUpper = '<DIV><HEADER><NAV><A HREF="/">Link</A><BUTTON>Btn</BUTTON></NAV></HEADER></DIV>';
  const hashLower = engine.computeDomSimHash(domLower);
  const hashUpper = engine.computeDomSimHash(domUpper);
  const dist = engine.hammingDistance(hashLower, hashUpper);
  assert.strictEqual(dist, 0, `SimHash must be case-insensitive to HTML tag names. Distance: ${dist}`);
});

runTest('SIMHASH', '3.6 Pathological large DOM scaling (1,000 tags execution time & bit balance)', () => {
  const tags = [];
  const tagTypes = ['div', 'span', 'p', 'li', 'a', 'button', 'input', 'section', 'article', 'aside'];
  for (let i = 0; i < 1000; i++) {
    const t = tagTypes[i % tagTypes.length];
    tags.push(`<${t} class="item-${i}">item</${t}>`);
  }
  const largeDom = `<div>${tags.join('')}</div>`;
  
  const start = performance.now();
  const hash = engine.computeDomSimHash(largeDom);
  const elapsed = performance.now() - start;
  
  assert.strictEqual(hash.length, 64);
  const ones = hash.split('').filter(b => b === '1').length;
  console.log(`         [PERFORMANCE] 1,000 DOM tags processed in ${elapsed.toFixed(2)}ms; Bit balance: ${ones} ones / ${64 - ones} zeroes`);
  assert(elapsed < 100, `SimHash computation should take <100ms, took ${elapsed.toFixed(2)}ms`);
  assert(ones >= 15 && ones <= 49, `Bit balance should be reasonably distributed across 64 bits (got ${ones} ones)`);
});

// ======================================================================
// 4. LAYOUT pHASH SENSITIVITY
// ======================================================================
console.log('\n--- 4. Layout pHash Sensitivity Stress-Tests ---');

runTest('PHASH', '4.1 Layout pHash produces 64-bit binary string', () => {
  const boxes = [{ x: 100, y: 100, width: 200, height: 50 }];
  const phash = engine.computeLayoutPHash(boxes);
  assert.strictEqual(phash.length, 64);
  assert(/^[01]{64}$/.test(phash));
});

runTest('PHASH', '4.2 Empty or undefined layoutBoxes returns 64 zeroes', () => {
  assert.strictEqual(engine.computeLayoutPHash([]), '0'.repeat(64));
  assert.strictEqual(engine.computeLayoutPHash(null), '0'.repeat(64));
});

runTest('PHASH', '4.3 Out-of-bounds layout coordinates safely clamp to 8x8 viewport grid', () => {
  // Elements positioned negative or far outside standard 1280x800
  const outOfBoundsBoxes = [
    { x: -500, y: -200, width: 100, height: 100 },
    { x: 3000, y: 2500, width: 200, height: 100 }
  ];
  const phash = engine.computeLayoutPHash(outOfBoundsBoxes);
  assert.strictEqual(phash.length, 64);
  assert(/^[01]{64}$/.test(phash), 'Must clamp safely without producing NaN or throwing');
});

runTest('PHASH', '4.4 Spatial differentiation: Top-Left dominant vs Bottom-Right dominant', () => {
  // Top-left layout: hero banner and nav in cells (0,0) to (2,2)
  const topLeftBoxes = [
    { x: 50, y: 50, width: 400, height: 150 },
    { x: 100, y: 80, width: 200, height: 50 },
    { x: 50, y: 120, width: 300, height: 60 }
  ];

  // Bottom-right layout: footer and floating widgets in cells (5,5) to (7,7)
  const bottomRightBoxes = [
    { x: 1000, y: 650, width: 250, height: 120 },
    { x: 1100, y: 700, width: 150, height: 80 },
    { x: 950, y: 600, width: 300, height: 100 }
  ];

  const pHashTL = engine.computeLayoutPHash(topLeftBoxes);
  const pHashBR = engine.computeLayoutPHash(bottomRightBoxes);
  const dist = engine.hammingDistance(pHashTL, pHashBR);

  console.log(`         [EMPIRICAL OBSERVATION] Top-Left vs Bottom-Right pHash Hamming Distance: ${dist}`);
  assert(dist > 0, 'Spatially opposite layouts must have distinct pHash fingerprints');
});

runTest('PHASH', '4.5 Layout shift invariance under small element jitter (< 20px within same grid cell)', () => {
  // Box at (100, 100): cell col = floor(100/1280 * 8) = 0, row = floor(100/800 * 8) = 1
  const boxOriginal = [{ x: 100, y: 100, width: 150, height: 40 }];
  // Box shifted slightly to (110, 105): still in col 0, row 1
  const boxJittered = [{ x: 110, y: 105, width: 150, height: 40 }];

  const hashOrig = engine.computeLayoutPHash(boxOriginal);
  const hashJitter = engine.computeLayoutPHash(boxJittered);
  const dist = engine.hammingDistance(hashOrig, hashJitter);

  assert.strictEqual(dist, 0, 'Micro-jitter within the same grid cell must maintain 0 pHash distance');
});

// ======================================================================
// 5. HAMMING SOFT-MERGING THRESHOLDS & EQUIVALENCE COMPARATOR
// ======================================================================
console.log('\n--- 5. Hamming Soft-Merging Thresholds & Equivalence Stress-Tests ---');

runTest('MERGE', '5.1 SimHash threshold boundary: distance <= 6 merges, distance >= 7 keeps discrete', () => {
  const baseFingerprint = {
    hash: 'hash-base',
    urlNormalized: 'https://example.com/page',
    domSimhash: '0'.repeat(64),
    axTreeHash: 'ax-hash-different-1',
    phash: '0'.repeat(64),
    interactiveCount: 5,
    timestamp: Date.now()
  };

  // State with exactly 6 bits difference in domSimhash, 0 in phash, same URL
  const stateDist6 = {
    ...baseFingerprint,
    hash: 'hash-dist6',
    domSimhash: '1'.repeat(6) + '0'.repeat(58),
    axTreeHash: 'ax-hash-different-2'
  };

  // State with 7 bits difference in domSimhash
  const stateDist7 = {
    ...baseFingerprint,
    hash: 'hash-dist7',
    domSimhash: '1'.repeat(7) + '0'.repeat(57),
    axTreeHash: 'ax-hash-different-3'
  };

  const comp6 = engine.compareStates(baseFingerprint, stateDist6);
  assert.strictEqual(comp6.domHammingDistance, 6);
  assert.strictEqual(comp6.shouldMerge, true, 'Distance of exactly 6 bits on SimHash MUST merge (threshold is 6)');

  const comp7 = engine.compareStates(baseFingerprint, stateDist7);
  assert.strictEqual(comp7.domHammingDistance, 7);
  assert.strictEqual(comp7.shouldMerge, false, 'Distance of 7 bits on SimHash MUST NOT merge');
});

runTest('MERGE', '5.2 pHash threshold boundary: distance <= 10 merges, distance >= 11 keeps discrete', () => {
  const baseFingerprint = {
    hash: 'hash-base',
    urlNormalized: 'https://example.com/page',
    domSimhash: '0'.repeat(64),
    axTreeHash: 'ax-hash-different-1',
    phash: '0'.repeat(64),
    interactiveCount: 5,
    timestamp: Date.now()
  };

  // State with 0 dom distance, but exactly 10 bits difference in phash
  const statePhash10 = {
    ...baseFingerprint,
    hash: 'hash-phash10',
    phash: '1'.repeat(10) + '0'.repeat(54),
    axTreeHash: 'ax-hash-different-2'
  };

  // State with 11 bits difference in phash
  const statePhash11 = {
    ...baseFingerprint,
    hash: 'hash-phash11',
    phash: '1'.repeat(11) + '0'.repeat(53),
    axTreeHash: 'ax-hash-different-3'
  };

  const comp10 = engine.compareStates(baseFingerprint, statePhash10);
  assert.strictEqual(comp10.phashHammingDistance, 10);
  assert.strictEqual(comp10.shouldMerge, true, 'Distance of exactly 10 bits on pHash MUST merge (threshold is 10)');

  const comp11 = engine.compareStates(baseFingerprint, statePhash11);
  assert.strictEqual(comp11.phashHammingDistance, 11);
  assert.strictEqual(comp11.shouldMerge, false, 'Distance of 11 bits on pHash MUST NOT merge');
});

runTest('MERGE', '5.3 AX Tree exact match guarantees merge on identical URL regardless of visual noise', () => {
  const stateA = {
    hash: 'hash-a',
    urlNormalized: 'https://example.com/app',
    domSimhash: '0'.repeat(64),
    axTreeHash: 'ax-identical-12345',
    phash: '0'.repeat(64),
    interactiveCount: 3,
    timestamp: Date.now()
  };

  // State B has identical URL and identical AX Tree, but wild visual CSS differences (distance > 30)
  const stateB = {
    hash: 'hash-b',
    urlNormalized: 'https://example.com/app',
    domSimhash: '1'.repeat(30) + '0'.repeat(34),
    axTreeHash: 'ax-identical-12345',
    phash: '1'.repeat(40) + '0'.repeat(24),
    interactiveCount: 3,
    timestamp: Date.now()
  };

  const comp = engine.compareStates(stateA, stateB);
  assert.strictEqual(comp.axTreeMatch, true);
  assert.strictEqual(comp.shouldMerge, true, 'Identical AX Tree on same URL MUST merge (assistive state is identical)');
});

runTest('MERGE', '5.4 URL mismatch prevents merge even if DOM and Layout are 100% identical', () => {
  const pageA = {
    hash: 'hash-pageA',
    urlNormalized: 'https://example.com/home',
    domSimhash: '0101'.repeat(16),
    axTreeHash: 'ax-identical',
    phash: '1010'.repeat(16),
    interactiveCount: 4,
    timestamp: Date.now()
  };

  const pageB = {
    hash: 'hash-pageB',
    urlNormalized: 'https://example.com/dashboard',
    domSimhash: '0101'.repeat(16),
    axTreeHash: 'ax-identical',
    phash: '1010'.repeat(16),
    interactiveCount: 4,
    timestamp: Date.now()
  };

  const comp = engine.compareStates(pageA, pageB);
  assert.strictEqual(comp.urlMatch, false);
  assert.strictEqual(comp.shouldMerge, false, 'Different normalized URLs MUST NOT merge even with identical DOM/AX');
  assert(comp.compositeSimilarity < 0.8, 'Similarity score without URL match must be < 0.8');
});

runTest('MERGE', '5.5 Composite similarity score mathematical bounds [0.0, 1.0]', () => {
  const identicalState = {
    hash: 'hash-id',
    urlNormalized: 'https://example.com/test',
    domSimhash: '0'.repeat(64),
    axTreeHash: 'ax-match',
    phash: '0'.repeat(64),
    interactiveCount: 1,
    timestamp: Date.now()
  };

  const completelyDisjointState = {
    hash: 'hash-disjoint',
    urlNormalized: 'https://other.com/nowhere',
    domSimhash: '1'.repeat(64),
    axTreeHash: 'ax-disjoint',
    phash: '1'.repeat(64),
    interactiveCount: 10,
    timestamp: Date.now()
  };

  const selfComp = engine.compareStates(identicalState, identicalState);
  assert.strictEqual(selfComp.compositeSimilarity, 1.0, 'Identical state must yield 1.00 similarity');

  const disjointComp = engine.compareStates(identicalState, completelyDisjointState);
  assert.strictEqual(disjointComp.compositeSimilarity, 0.0, 'Disjoint state must yield 0.00 similarity');
});

// ======================================================================
// 6. A* EXPLORATION GRAPH LOOP PREVENTION & TRAVERSAL
// ======================================================================
console.log('\n--- 6. A* Exploration Graph Loop Prevention Stress-Tests ---');

runTest('GRAPH', '6.1 Circular navigation loop (A -> B -> A) does NOT duplicate nodes', () => {
  const graph = new ExplorationStateGraph();

  const fpA = engine.computeCompositeFingerprint('https://app.com/page1', 'ax-page1', '<div>Page 1</div>');
  const fpB = engine.computeCompositeFingerprint('https://app.com/page2', 'ax-page2', '<div>Page 2</div>');

  // Step 1: Register Root A
  const nodeA1 = graph.registerState(fpA, 0, 2.0);
  assert.strictEqual(nodeA1.isNewState, true);
  assert.strictEqual(nodeA1.node.visitedCount, 1);

  // Step 2: Transition A -> B via Tab
  const actionTab = { idx: 1, persona: 'keyboard', actionType: 'press_key', key: 'Tab', tier: 0, timestamp: Date.now() };
  const nodeB = graph.registerState(fpB, 1, 1.0, { fromNodeId: nodeA1.node.id, action: actionTab });
  assert.strictEqual(nodeB.isNewState, true);
  assert.strictEqual(nodeB.node.visitedCount, 1);

  // Step 3: Transition B -> A via Shift+Tab (Revisiting A)
  const actionShiftTab = { idx: 2, persona: 'keyboard', actionType: 'press_key', key: 'Shift+Tab', tier: 0, timestamp: Date.now() };
  const nodeA2 = graph.registerState(fpA, 2, 2.0, { fromNodeId: nodeB.node.id, action: actionShiftTab });
  
  assert.strictEqual(nodeA2.isNewState, false, 'Revisiting state A MUST NOT create a new state node');
  assert.strictEqual(nodeA2.node.id, nodeA1.node.id, 'Returned node ID must match original state A');
  assert.strictEqual(nodeA2.node.visitedCount, 2, 'Visited count on state A must increment to 2');

  const summary = graph.getGraphSummary();
  assert.strictEqual(summary.totalStates, 2, 'Graph must contain exactly 2 discrete states despite cyclic loop');
});

runTest('GRAPH', '6.2 Backtracking path reconstruction avoids infinite cycles in parentStep', () => {
  const graph = new ExplorationStateGraph();
  const fpRoot = engine.computeCompositeFingerprint(
    'https://app.com/home',
    'ax-home',
    '<header><nav><a href="/">Home</a></nav></header><main><section><h1>Home</h1></section></main>'
  );
  const fpModal = engine.computeCompositeFingerprint(
    'https://app.com/checkout',
    'ax-checkout',
    '<main><form><fieldset><legend>Payment</legend><input type="text"/><button type="submit">Pay</button></fieldset></form></main>',
    [{ x: 200, y: 150, width: 880, height: 500 }],
    2
  );

  const root = graph.registerState(fpRoot, 0, 3.0);
  assert.strictEqual(root.isNewState, true);

  const actionOpen = { idx: 1, persona: 'keyboard', actionType: 'press_key', key: 'Enter', tier: 0, timestamp: Date.now() };
  const modal = graph.registerState(fpModal, 1, 1.0, { fromNodeId: root.node.id, action: actionOpen });
  assert.strictEqual(modal.isNewState, true, 'Discrete state should be registered as new node');

  // Reconstruct path from modal to root
  const path = graph.reconstructPathToNode(modal.node.id);
  assert.strictEqual(path.length, 1);
  assert.strictEqual(path[0].key, 'Enter');

  // Root node path reconstruction returns empty array
  const rootPath = graph.reconstructPathToNode(root.node.id);
  assert.strictEqual(rootPath.length, 0, 'Root node path must be empty (0 steps needed to reach root)');
});

// ======================================================================
// 7. ADVERSARIAL ATTACK SCENARIOS & ARCHITECTURAL STRESS
// ======================================================================
console.log('\n--- 7. Adversarial Attack Scenarios & Architectural Stress ---');

runTest('ADVERSARIAL', '7.1 Tab/Disclosure on Same URL: Different AX-tree with identical tag skeleton triggers False Merge', () => {
  // Scenario: An accessible tab panel or disclosure widget on the same URL
  // Tab 1 active vs Tab 2 active. The DOM tag structure is identical (<div class="tabpanel"><p>text</p></div>)
  // The layout box is identical ({ x: 100, y: 200, width: 500, height: 300 })
  // But the AX tree is completely different: Tab 1 (Home) vs Tab 2 (Profile)
  const fpTab1 = engine.computeCompositeFingerprint(
    'https://app.com/settings',
    '[tab 1 selected] [panel 1 "Account Preferences"] [button "Save"]',
    '<div class="container"><nav><ul><li><button>Tab 1</button></li><li><button>Tab 2</button></li></ul></nav><div class="panel"><p>Account</p><button>Save</button></div></div>',
    [{ x: 100, y: 200, width: 500, height: 300 }]
  );

  const fpTab2 = engine.computeCompositeFingerprint(
    'https://app.com/settings',
    '[tab 2 selected] [panel 2 "Security Settings"] [input "Password"] [button "Change"]',
    '<div class="container"><nav><ul><li><button>Tab 1</button></li><li><button>Tab 2</button></li></ul></nav><div class="panel"><p>Security</p><button>Change</button></div></div>',
    [{ x: 100, y: 200, width: 500, height: 300 }]
  );

  const comparison = engine.compareStates(fpTab1, fpTab2);
  console.log(`         [ADVERSARIAL FINDING] Same-URL Tab State Transition:`);
  console.log(`           - AX Tree Match: ${comparison.axTreeMatch} (axTreeHash: ${fpTab1.axTreeHash.slice(0, 8)} vs ${fpTab2.axTreeHash.slice(0, 8)})`);
  console.log(`           - DOM SimHash Distance: ${comparison.domHammingDistance}`);
  console.log(`           - pHash Distance: ${comparison.phashHammingDistance}`);
  console.log(`           - Composite Similarity: ${comparison.compositeSimilarity}`);
  console.log(`           - shouldMerge: ${comparison.shouldMerge}`);

  // In an accessibility auditor, Tab 1 and Tab 2 are distinct states.
  // But because domHammingDistance <= 6 and phashHammingDistance <= 10, shouldMerge is TRUE!
  // This demonstrates the AX-Tree Blind Spot when URL matches.
  assert(comparison.compositeSimilarity < 0.8, 'Composite similarity reflects difference in AX tree');
  if (comparison.shouldMerge) {
    console.log('         ⚠️ [VULNERABILITY CONFIRMED] Engine falsely soft-merges distinct accessibility states when tag skeleton matches!');
  }
});

runTest('ADVERSARIAL', '7.2 Case-Insensitive Tracking Param Leakage', () => {
  const urlLower = 'https://shop.com/item?utm_source=fb&cat=books';
  const urlUpper = 'https://shop.com/item?UTM_SOURCE=fb&cat=books';
  const normLower = engine.normalizeUrl(urlLower);
  const normUpper = engine.normalizeUrl(urlUpper);

  console.log(`         [ADVERSARIAL FINDING] Case sensitivity tracking leakage:`);
  console.log(`           - Lowercase norm: ${normLower}`);
  console.log(`           - Uppercase norm: ${normUpper}`);
  console.log(`           - Equality: ${normLower === normUpper}`);

  // URLSearchParams is case sensitive, so UTM_SOURCE causes state fragmentation
  if (normLower !== normUpper) {
    console.log('         ⚠️ [FINDING CONFIRMED] Uppercase UTM parameters evade stripping, leading to duplicate state nodes');
  }
});

runTest('ADVERSARIAL', '7.3 Query Parameter Order State Fragmentation', () => {
  const urlA = 'https://shop.com/products?color=red&size=large';
  const urlB = 'https://shop.com/products?size=large&color=red';
  const normA = engine.normalizeUrl(urlA);
  const normB = engine.normalizeUrl(urlB);

  console.log(`         [ADVERSARIAL FINDING] Query param reordering:`);
  console.log(`           - URL A norm: ${normA}`);
  console.log(`           - URL B norm: ${normB}`);
  console.log(`           - Identical: ${normA === normB}`);

  if (normA !== normB) {
    console.log('         ⚠️ [FINDING CONFIRMED] Unsorted query parameters create duplicate state identities for identical pages');
  }
});

runTest('ADVERSARIAL', '7.4 Layout pHash Diagonal Translation Distance', () => {
  // Single element moving diagonally across the screen from top-left (0,0) to bottom-right (7,7)
  const boxTopLeft = [{ x: 50, y: 50, width: 80, height: 30 }];
  const boxBottomRight = [{ x: 1200, y: 750, width: 80, height: 30 }];

  const hashTL = engine.computeLayoutPHash(boxTopLeft);
  const hashBR = engine.computeLayoutPHash(boxBottomRight);
  const dist = engine.hammingDistance(hashTL, hashBR);

  console.log(`         [ADVERSARIAL FINDING] Single element moving from (50,50) to (1200,750):`);
  console.log(`           - pHash Hamming Distance: ${dist} (Threshold: 10)`);
  console.log(`           - Would merge on visual distance alone: ${dist <= 10}`);

  // A single box occupying 1 cell out of 64 creates only 2 bit flips when moved!
  assert(dist === 2, `Moving a single isolated element across the screen produces exactly 2 bit flips (got ${dist})`);
});


runTest('GRAPH', '6.3 A* Best-First Frontier Queue prioritizes lowest f(n) = g(n) + h(n)', () => {
  const graph = new ExplorationStateGraph();

  // Root
  const fpRoot = engine.computeCompositeFingerprint('https://app.com/root', 'ax-root');
  graph.registerState(fpRoot, 0, 10.0); // f = 10.0

  // Candidate 1: g = 2, h = 5 -> f = 7.0
  const fp1 = engine.computeCompositeFingerprint('https://app.com/c1', 'ax-c1');
  graph.registerState(fp1, 2, 5.0);

  // Candidate 2: g = 3, h = 1 -> f = 4.0 (Optimal candidate!)
  const fp2 = engine.computeCompositeFingerprint('https://app.com/c2', 'ax-c2');
  graph.registerState(fp2, 3, 1.0);

  // Candidate 3: g = 1, h = 8 -> f = 9.0
  const fp3 = engine.computeCompositeFingerprint('https://app.com/c3', 'ax-c3');
  graph.registerState(fp3, 1, 8.0);

  // When popping best states from frontier:
  // Expected order of popping: Candidate 2 (f=4.0), then Candidate 1 (f=7.0), then Candidate 3 (f=9.0), then Root (f=10.0)
  const firstPop = graph.popBestState();
  assert.strictEqual(firstPop.id, fp2.hash, `First popped state must be Candidate 2 with lowest f(n)=4.0 (got f=${firstPop.priority})`);

  const secondPop = graph.popBestState();
  assert.strictEqual(secondPop.id, fp1.hash, `Second popped state must be Candidate 1 with f(n)=7.0 (got f=${secondPop.priority})`);

  const thirdPop = graph.popBestState();
  assert.strictEqual(thirdPop.id, fp3.hash, `Third popped state must be Candidate 3 with f(n)=9.0 (got f=${thirdPop.priority})`);

  const fourthPop = graph.popBestState();
  assert.strictEqual(fourthPop.id, fpRoot.hash, `Fourth popped state must be Root with f(n)=10.0`);

  const emptyPop = graph.popBestState();
  assert.strictEqual(emptyPop, null, 'Frontier exhausted must return null');
});

runTest('GRAPH', '6.4 Deep exploration chain (50 sequential steps) reconstructs full path accurately', () => {
  const graph = new ExplorationStateGraph();
  const fp0 = engine.computeCompositeFingerprint('https://app.com/step0', 'ax-0');
  const root = graph.registerState(fp0, 0, 50.0);

  let prevNodeId = root.node.id;
  for (let i = 1; i <= 50; i++) {
    const fp = engine.computeCompositeFingerprint(`https://app.com/step${i}`, `ax-${i}`);
    const action = { idx: i, persona: 'keyboard', actionType: 'press_key', key: 'Tab', tier: 0, timestamp: Date.now() };
    const reg = graph.registerState(fp, i, 50.0 - i, { fromNodeId: prevNodeId, action });
    prevNodeId = reg.node.id;
  }

  const fullPath = graph.reconstructPathToNode(prevNodeId);
  assert.strictEqual(fullPath.length, 50, `Path reconstruction must return exactly 50 action steps, got ${fullPath.length}`);
  assert.strictEqual(fullPath[0].idx, 1);
  assert.strictEqual(fullPath[49].idx, 50);

  const summary = graph.getGraphSummary();
  assert.strictEqual(summary.totalStates, 51);
  assert.strictEqual(summary.maxDepth, 50);
});

// ======================================================================
// SUMMARY & VERDICT
// ======================================================================
console.log('\n======================================================================');
console.log(` CHALLENGE SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (failedTests > 0) {
  console.log(` FAILURES: ${failedTests}`);
  for (const f of findings) {
    console.error(`   - [${f.suite}] ${f.test}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log(' ALL EMPIRICAL STRESS & ADVERSARIAL CHALLENGES PASSED (0 FAILURES)');
  console.log('======================================================================\n');
  process.exit(0);
}
