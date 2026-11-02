import { FocusGraphEngine } from '../lib/barrierlens/engines/focus-graph.ts';
import assert from 'node:assert';

console.log('======================================================================');
console.log(' ADVERSARIAL CHALLENGE SUITE: FocusGraphEngine (Tarjan SCC & Kendall Tau)');
console.log('======================================================================');

let passes = 0;
let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passes++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failures++;
  }
}

// ---------------------------------------------------------------------------
// 1. TARJAN'S SCC EXTREME EDGE CASES
// ---------------------------------------------------------------------------

console.log('\n--- 1. Tarjan SCC Stress-Tests ---');

test('1.1 Single-node graph with self-loop should NOT be trapped (totalNodes === 1)', () => {
  const engine = new FocusGraphEngine();
  engine.addNode({
    id: '#single',
    selector: '#single',
    tagName: 'BUTTON',
    role: 'button',
    accessibleName: 'Solo',
    tabIndex: 0,
    box: { x: 0, y: 0, width: 50, height: 20 },
    isModal: false,
    isInert: false
  });
  engine.addEdge('#single', '#single', 'Tab');

  const trap = engine.findKeyboardTraps();
  // On a 1-node page, tabbing naturally stays on the only focusable node (or browser address bar)
  assert.strictEqual(trap, null, 'Single node alone in page should not be reported as a keyboard trap');
});

test('1.2 Single-node self-loop trap when totalNodes > 1', () => {
  const engine = new FocusGraphEngine();
  engine.addNode({
    id: '#normal-input',
    selector: '#normal-input',
    tagName: 'INPUT',
    role: 'textbox',
    accessibleName: 'Search',
    tabIndex: 0,
    box: { x: 0, y: 0, width: 100, height: 30 },
    isModal: false,
    isInert: false
  });
  engine.addNode({
    id: '#trap-widget',
    selector: '#trap-widget',
    tagName: 'DIV',
    role: 'button',
    accessibleName: 'Trapped Button',
    tabIndex: 0,
    box: { x: 0, y: 50, width: 100, height: 30 },
    isModal: false,
    isInert: false
  });

  // normal-input tabs to trap-widget, but trap-widget tabs only to itself!
  engine.addEdge('#normal-input', '#trap-widget', 'Tab');
  engine.addEdge('#trap-widget', '#trap-widget', 'Tab');

  const trap = engine.findKeyboardTraps();
  assert.notStrictEqual(trap, null, 'Should detect 1-node self-loop sink SCC');
  assert.strictEqual(trap.trapType, 'sink_scc');
  assert.deepStrictEqual(trap.componentNodeIds, ['#trap-widget']);
  assert.strictEqual(trap.entryNodeId, '#trap-widget');
  assert.ok(trap.reproducingKeySequence.includes('Tab'));
});

test('1.3 Multi-cycle trap (figure-8 / theta topology: A<->B and B<->C with no exit)', () => {
  const engine = new FocusGraphEngine();
  ['#start', '#node-A', '#node-B', '#node-C'].forEach((id, i) => {
    engine.addNode({
      id,
      selector: id,
      tagName: 'BUTTON',
      role: 'button',
      accessibleName: `Btn ${id}`,
      tabIndex: 0,
      box: { x: 0, y: i * 40, width: 80, height: 30 },
      isModal: false,
      isInert: false
    });
  });

  // Entry path from #start to #node-A
  engine.addEdge('#start', '#node-A', 'Tab');

  // Cycle 1: A <-> B
  engine.addEdge('#node-A', '#node-B', 'Tab');
  engine.addEdge('#node-B', '#node-A', 'Shift+Tab');

  // Cycle 2: B <-> C
  engine.addEdge('#node-B', '#node-C', 'Tab');
  engine.addEdge('#node-C', '#node-B', 'Shift+Tab');

  // No exit out of {A, B, C}
  const trap = engine.findKeyboardTraps();
  assert.notStrictEqual(trap, null, 'Should detect multi-cycle sink SCC');
  assert.strictEqual(trap.componentNodeIds.length, 3);
  assert.ok(trap.componentNodeIds.includes('#node-A'));
  assert.ok(trap.componentNodeIds.includes('#node-B'));
  assert.ok(trap.componentNodeIds.includes('#node-C'));
  assert.strictEqual(trap.entryNodeId, '#node-A');
  // Reproducing key sequence must have entry step Tab plus cycle
  assert.ok(trap.reproducingKeySequence.length >= 2, 'Must have reproducible key sequence');
  assert.ok(trap.cycleTransitions.length >= 1, 'Must record cycle transitions');
});

test('1.4 Disjoint components: Component 1 has exit to Component 2, Component 2 has no exit', () => {
  const engine = new FocusGraphEngine();
  ['#c1-a', '#c1-b', '#c2-a', '#c2-b'].forEach((id, i) => {
    engine.addNode({
      id,
      selector: id,
      tagName: 'BUTTON',
      role: 'button',
      accessibleName: id,
      tabIndex: 0,
      box: { x: 0, y: i * 40, width: 80, height: 30 },
      isModal: false,
      isInert: false
    });
  });

  // C1: a <-> b, with escape edge from b -> c2-a
  engine.addEdge('#c1-a', '#c1-b', 'Tab');
  engine.addEdge('#c1-b', '#c1-a', 'Shift+Tab');
  engine.addEdge('#c1-b', '#c2-a', 'Tab');

  // C2: c2-a <-> c2-b with NO exit
  engine.addEdge('#c2-a', '#c2-b', 'Tab');
  engine.addEdge('#c2-b', '#c2-a', 'Shift+Tab');

  const trap = engine.findKeyboardTraps();
  assert.notStrictEqual(trap, null, 'Should detect C2 as the true sink SCC');
  assert.deepStrictEqual(trap.componentNodeIds.sort(), ['#c2-a', '#c2-b'].sort());
  assert.strictEqual(trap.entryNodeId, '#c2-a');
});

test('1.5 Complete page natural wrap (A -> B -> C -> A) when no modal is present', () => {
  const engine = new FocusGraphEngine();
  ['#btn-1', '#btn-2', '#btn-3'].forEach((id, i) => {
    engine.addNode({
      id,
      selector: id,
      tagName: 'BUTTON',
      role: 'button',
      accessibleName: id,
      tabIndex: 0,
      box: { x: 0, y: i * 40, width: 80, height: 30 },
      isModal: false,
      isInert: false
    });
  });

  engine.addEdge('#btn-1', '#btn-2', 'Tab');
  engine.addEdge('#btn-2', '#btn-3', 'Tab');
  engine.addEdge('#btn-3', '#btn-1', 'Tab');

  const trap = engine.findKeyboardTraps();
  assert.strictEqual(trap, null, 'Full page standard tabbing wrap should NOT be flagged as a trap');
});

test('1.6 Full modal wrap (all nodes inside modal) SHOULD be flagged as modal_deadlock initially', () => {
  const engine = new FocusGraphEngine();
  ['#modal-btn-1', '#modal-btn-2'].forEach((id, i) => {
    engine.addNode({
      id,
      selector: id,
      tagName: 'BUTTON',
      role: 'button',
      accessibleName: id,
      tabIndex: 0,
      box: { x: 50, y: i * 40, width: 80, height: 30 },
      isModal: true,
      isInert: false
    });
  });

  engine.addEdge('#modal-btn-1', '#modal-btn-2', 'Tab');
  engine.addEdge('#modal-btn-2', '#modal-btn-1', 'Tab');

  const trap = engine.findKeyboardTraps();
  assert.notStrictEqual(trap, null, 'Modal wrap should be flagged as modal_deadlock candidate');
  assert.strictEqual(trap.trapType, 'modal_deadlock');
});

// ---------------------------------------------------------------------------
// 2. KENDALL'S TAU (τ) EXTREME EDGE CASES & NUMERICAL STABILITY
// ---------------------------------------------------------------------------

console.log('\n--- 2. Kendall Tau Stress-Tests ---');

test('2.1 Empty or 1-element list yields tau = 1.0 (trivial concordance)', () => {
  const engine = new FocusGraphEngine();
  const resEmpty = engine.calculateKendallTau([]);
  assert.strictEqual(resEmpty.tau, 1.0);
  assert.strictEqual(resEmpty.isAcceptable, true);

  const resOne = engine.calculateKendallTau([{
    id: '#solo',
    selector: '#solo',
    tagName: 'BUTTON',
    role: 'button',
    accessibleName: 'Solo',
    tabIndex: 0,
    box: { x: 10, y: 10, width: 50, height: 20 },
    isModal: false,
    isInert: false
  }]);
  assert.strictEqual(resOne.tau, 1.0);
  assert.strictEqual(resOne.isAcceptable, true);
});

test('2.2 Perfect visual reading order concordance (tau = 1.00)', () => {
  const engine = new FocusGraphEngine();
  // 3 nodes in standard reading order: (0,0), (100,0), (0,50)
  const nodes = [
    { id: '#n1', selector: '#n1', tagName: 'A', role: 'link', accessibleName: '1', tabIndex: 0, box: { x: 0, y: 0, width: 80, height: 20 }, isModal: false, isInert: false },
    { id: '#n2', selector: '#n2', tagName: 'A', role: 'link', accessibleName: '2', tabIndex: 0, box: { x: 100, y: 0, width: 80, height: 20 }, isModal: false, isInert: false },
    { id: '#n3', selector: '#n3', tagName: 'A', role: 'link', accessibleName: '3', tabIndex: 0, box: { x: 0, y: 50, width: 80, height: 20 }, isModal: false, isInert: false }
  ];
  nodes.forEach(n => engine.addNode(n));

  const metric = engine.calculateKendallTau();
  assert.strictEqual(metric.tau, 1.0);
  assert.strictEqual(metric.concordantCount, 3);
  assert.strictEqual(metric.discordantCount, 0);
  assert.strictEqual(metric.isAcceptable, true);
});

test('2.3 Perfect discordance / completely reversed order (tau = -1.00)', () => {
  const engine = new FocusGraphEngine();
  // Traversal order: n3, then n2, then n1
  const nodes = [
    { id: '#n3', selector: '#n3', tagName: 'A', role: 'link', accessibleName: '3', tabIndex: 0, box: { x: 0, y: 50, width: 80, height: 20 }, isModal: false, isInert: false },
    { id: '#n2', selector: '#n2', tagName: 'A', role: 'link', accessibleName: '2', tabIndex: 0, box: { x: 100, y: 0, width: 80, height: 20 }, isModal: false, isInert: false },
    { id: '#n1', selector: '#n1', tagName: 'A', role: 'link', accessibleName: '1', tabIndex: 0, box: { x: 0, y: 0, width: 80, height: 20 }, isModal: false, isInert: false }
  ];
  nodes.forEach(n => engine.addNode(n));

  const metric = engine.calculateKendallTau();
  assert.strictEqual(metric.tau, -1.0);
  assert.strictEqual(metric.concordantCount, 0);
  assert.strictEqual(metric.discordantCount, 3);
  assert.strictEqual(metric.isAcceptable, false);
});

test('2.4 Vertical row tolerance: elements on the same row with slight y-jitter are grouped horizontally', () => {
  const engine = new FocusGraphEngine();
  // Elements on same visual line: y=10 and y=12 (delta=2 < yTol=10)
  // Left element: x=20, Right element: x=120
  // If focus order visits left then right: should be concordant!
  const n1 = { id: '#left', selector: '#left', tagName: 'BUTTON', role: 'button', accessibleName: 'L', tabIndex: 0, box: { x: 20, y: 10, width: 60, height: 25 }, isModal: false, isInert: false };
  const n2 = { id: '#right', selector: '#right', tagName: 'BUTTON', role: 'button', accessibleName: 'R', tabIndex: 0, box: { x: 120, y: 12, width: 60, height: 25 }, isModal: false, isInert: false };
  engine.addNode(n1);
  engine.addNode(n2);

  const metric = engine.calculateKendallTau();
  assert.strictEqual(metric.tau, 1.0, 'Sub-tolerance vertical jitter must not invert horizontal reading order');
  assert.strictEqual(metric.visualOrder[0], '#left');
  assert.strictEqual(metric.visualOrder[1], '#right');
});

test('2.5 Distinct rows (delta y > tolerance) correctly ordered top-to-bottom regardless of x', () => {
  const engine = new FocusGraphEngine();
  // Row 1: x=500, y=10, height=20 (far right)
  // Row 2: x=10, y=60, height=20 (far left)
  // Visual order MUST be Row 1 then Row 2
  const top = { id: '#top-right', selector: '#top-right', tagName: 'BUTTON', role: 'button', accessibleName: 'TR', tabIndex: 0, box: { x: 500, y: 10, width: 60, height: 20 }, isModal: false, isInert: false };
  const bot = { id: '#bot-left', selector: '#bot-left', tagName: 'BUTTON', role: 'button', accessibleName: 'BL', tabIndex: 0, box: { x: 10, y: 60, width: 60, height: 20 }, isModal: false, isInert: false };
  engine.addNode(top);
  engine.addNode(bot);

  const metric = engine.calculateKendallTau();
  assert.strictEqual(metric.tau, 1.0);
  assert.strictEqual(metric.visualOrder[0], '#top-right');
  assert.strictEqual(metric.visualOrder[1], '#bot-left');
});

// ---------------------------------------------------------------------------
// 3. UNREACHABLE CONTROLS & ID/SELECTOR MATCHING EMPIRICAL TEST
// ---------------------------------------------------------------------------

console.log('\n--- 3. Unreachable Controls & Selector Normalization ---');

test('3.1 CDP AX-Tree selector format difference should NOT cause false positive unreachable flags when backendDOMNodeId is present', () => {
  const engine = new FocusGraphEngine();
  
  // Simulated node with backendDOMNodeId:
  engine.addNode({
    id: '#promo-btn',
    selector: '#promo-btn',
    tagName: 'BUTTON',
    role: 'button',
    accessibleName: 'Promo',
    tabIndex: 0,
    box: { x: 10, y: 10, width: 100, height: 30 },
    isModal: false,
    isInert: false,
    backendDOMNodeId: 42
  });

  const cdpInteractiveNode = {
    nodeId: 'ax-101',
    backendDOMNodeId: 42,
    role: 'button',
    name: 'Promo',
    selector: 'button#promo-btn',
    focusable: true
  };

  const result = engine.findUnreachableControls([cdpInteractiveNode]);
  assert.strictEqual(result.unreachableNodes.length, 0, 'Visited node with backendDOMNodeId matching must NOT be marked unreachable');
});

test('3.2 EMPIRICAL FLAW DEMONSTRATION: traversePage creates FocusNode without backendDOMNodeId, causing false positive unreachable controls due to tag#id vs #id mismatch', () => {
  const engine = new FocusGraphEngine();
  
  // Node as created by traversePage (no backendDOMNodeId):
  engine.addNode({
    id: '#grid-btn-1',
    selector: '#grid-btn-1',
    tagName: 'BUTTON',
    role: 'button',
    accessibleName: 'Button 1',
    tabIndex: 0,
    box: { x: 10, y: 10, width: 100, height: 30 },
    isModal: false,
    isInert: false
    // backendDOMNodeId is undefined because getActiveElementSnapshot runs in client DOM!
  });

  // AX Node from extractCDPAXTree (deriveSelectorFromDOMNode produces 'button#grid-btn-1'):
  const cdpInteractiveNode = {
    nodeId: 'ax-201',
    backendDOMNodeId: 999,
    role: 'button',
    name: 'Button 1',
    selector: 'button#grid-btn-1',
    focusable: true
  };

  const result = engine.findUnreachableControls([cdpInteractiveNode]);
  // Normalized selector match prevents visited node from being falsely flagged unreachable
  console.log('      [EMPIRICAL OBSERVATION] Visited node was flagged unreachable:', result.unreachableNodes.length === 1);
  assert.strictEqual(result.unreachableNodes.length, 0, 'Verified fix: normalized selector prevents visited node from being falsely flagged unreachable');
});

console.log(`\nAdversarial Challenge Results: ${passes} Passed, ${failures} Failed`);
if (failures > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
