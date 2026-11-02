#!/usr/bin/env node

/**
 * BarrierLens Adversarial Challenger Stress Harness (Week 2 / M5 Gate)
 * 
 * Deeply stress-tests:
 * 1. Focus loss detection algorithm (body fallback after DOM removals, action steps, null/documentElement, and immunity)
 * 2. Unreachable control detection against CDP AX-tree interactive nodes (including selector prefix mismatches)
 * 3. Shortest reproducible key sequence BFS certificates (minimality, branching diamond graphs, multi-cycle SCCs, self-loops)
 * 4. FocusMapView UI data presets, Kendall Tau math edge cases, and SVG geometry safety
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import FocusGraphEngine
const engineModule = await import('../lib/barrierlens/engines/focus-graph.ts');
const FocusGraphEngine = engineModule.FocusGraphEngine || engineModule.default?.FocusGraphEngine || engineModule.default;

const RESULTS = {
  passed: 0,
  failed: 0,
  flaws: []
};

function assert(condition, description, detail = '') {
  if (condition) {
    RESULTS.passed++;
    console.log(`  [PASS] ${description} ${detail ? `(${detail})` : ''}`);
  } else {
    RESULTS.failed++;
    const msg = `[CHALLENGE FAIL] ${description} ${detail ? `(${detail})` : ''}`;
    console.error(`  ${msg}`);
    RESULTS.flaws.push(msg);
  }
}

console.log('======================================================================');
console.log(' ADVERSARIAL STRESS TEST: FOCUS GRAPH ENGINE & DETECTION ALGORITHMS');
console.log('======================================================================\n');

// ---------------------------------------------------------------------
// TEST SUITE 1: FOCUS LOSS DETECTION ALGORITHM STRESS-TEST
// ---------------------------------------------------------------------
console.log('--- SUITE 1: Focus Loss Detection Algorithm Stress-Test ---');

const engine1 = new FocusGraphEngine();

// 1.1 Action step dropping focus to body
const loss1 = engine1.detectFocusLoss({
  beforeActiveElement: '#cart-item-delete-btn',
  afterActiveElement: 'body',
  triggerKey: 'Enter',
  actionDescription: 'DOM node unmounted on Enter'
});
assert(loss1 !== null && loss1.detected === true, '1.1 Detects focus loss when element falls back to body');
assert(loss1?.proofExplanation.includes('WCAG 2.4.3'), '1.1 Documents WCAG 2.4.3 Focus Order violation in proof explanation');

// 1.2 Active element drops to empty string or 'none'
const loss2 = engine1.detectFocusLoss({
  beforeActiveElement: '#modal-trigger',
  afterActiveElement: '',
  triggerKey: 'Click'
});
assert(loss2 !== null && loss2.elementAfter === 'body', '1.2 Detects focus loss when afterActiveElement is empty string');

const loss3 = engine1.detectFocusLoss({
  beforeActiveElement: '#submit-btn',
  afterActiveElement: 'none',
  triggerKey: 'Tab'
});
assert(loss3 !== null && loss3.elementAfter === 'none', '1.3 Detects focus loss when afterActiveElement is none');

// 1.4 Immunity: Normal focus transition between two elements
const normalTransition = engine1.detectFocusLoss({
  beforeActiveElement: '#input-first-name',
  afterActiveElement: '#input-last-name',
  triggerKey: 'Tab'
});
assert(normalTransition === null, '1.4 Immunity: Normal focus transition between two elements yields null');

// 1.5 Immunity: Focus already on body before action
const bodyToBody = engine1.detectFocusLoss({
  beforeActiveElement: 'body',
  afterActiveElement: 'body',
  triggerKey: 'Tab'
});
assert(bodyToBody === null, '1.5 Immunity: Initial body focus transitioning to body yields null');

// 1.6 Missing beforeActiveElement yields null
const emptyBefore = engine1.detectFocusLoss({
  beforeActiveElement: undefined,
  afterActiveElement: 'body'
});
assert(emptyBefore === null, '1.6 Immunity: Undefined beforeActiveElement yields null');

console.log('\n--- SUITE 2: Unreachable Control Detection & AX-Tree Cross-Check ---');

const engine2 = new FocusGraphEngine();

// Add simulated traversed nodes with id '#grid-btn-1', '#grid-btn-2'
engine2.addNode({
  id: '#grid-btn-1',
  selector: '#grid-btn-1',
  tagName: 'BUTTON',
  role: 'button',
  accessibleName: 'Button 1',
  tabIndex: 5,
  box: { x: 10, y: 10, width: 100, height: 40 },
  isModal: false,
  isInert: false
});

engine2.addNode({
  id: '#grid-btn-2',
  selector: '#grid-btn-2',
  tagName: 'BUTTON',
  role: 'button',
  accessibleName: 'Button 2',
  tabIndex: 1,
  box: { x: 120, y: 10, width: 100, height: 40 },
  isModal: false,
  isInert: false
});

// Construct mock CDP AX-tree nodes as produced by cdp-ax-extractor.mjs:
// Notice: deriveSelectorFromDOMNode produces 'button#grid-btn-1', NOT '#grid-btn-1'
const axNodesSimulated = [
  {
    nodeId: 'ax-1',
    backendDOMNodeId: 101,
    role: 'button',
    name: 'Button 1',
    focusable: true,
    selector: 'button#grid-btn-1',
    domNode: { localName: 'button', attributes: { id: 'grid-btn-1' } }
  },
  {
    nodeId: 'ax-2',
    backendDOMNodeId: 102,
    role: 'button',
    name: 'Button 2',
    focusable: true,
    selector: 'button#grid-btn-2',
    domNode: { localName: 'button', attributes: { id: 'grid-btn-2' } }
  },
  {
    nodeId: 'ax-3',
    backendDOMNodeId: 103,
    role: 'button',
    name: 'Export Data',
    focusable: false,
    selector: 'button#orphaned-export-btn',
    domNode: { localName: 'button', attributes: { id: 'orphaned-export-btn', tabindex: '-1' } },
    properties: { tabIndex: -1 }
  },
  {
    nodeId: 'ax-4',
    backendDOMNodeId: 104,
    role: 'heading',
    name: 'Header Title',
    focusable: false,
    selector: 'h1',
    domNode: { localName: 'h1' }
  },
  {
    nodeId: 'ax-5',
    backendDOMNodeId: 105,
    role: 'button',
    name: 'Disabled Action',
    disabled: true,
    focusable: false,
    selector: 'button#disabled-btn',
    domNode: { localName: 'button', attributes: { id: 'disabled-btn', disabled: '' } }
  }
];

const unreachableRes = engine2.findUnreachableControls(axNodesSimulated);

console.log(`  Reported unreachable count: ${unreachableRes.unreachableNodes.length}`);
for (const u of unreachableRes.findings) {
  console.log(`    - ${u.selector} (reason: ${u.reason})`);
}

// Check 2.1: Heading should NOT be considered interactive
const headingInUnreachable = unreachableRes.findings.some(f => f.role === 'heading');
assert(!headingInUnreachable, '2.1 Non-interactive heading (h1) is NOT flagged as unreachable control');

// Check 2.2: Disabled button should NOT be considered interactive
const disabledInUnreachable = unreachableRes.findings.some(f => f.accessibleName === 'Disabled Action');
assert(!disabledInUnreachable, '2.2 Disabled button is excluded from interactive set');

// Check 2.3: Truly unreachable control '#orphaned-export-btn' is detected
const orphanedDetected = unreachableRes.findings.some(f => f.selector.includes('orphaned-export-btn'));
assert(orphanedDetected, '2.3 Truly unreachable control (#orphaned-export-btn) is detected');

// Check 2.4: CHALLENGE CRITICAL FLAW: Are traversed nodes '#grid-btn-1' and '#grid-btn-2' flagged as unreachable?
const btn1FalsePositive = unreachableRes.findings.some(f => f.selector.includes('grid-btn-1'));
const btn2FalsePositive = unreachableRes.findings.some(f => f.selector.includes('grid-btn-2'));

if (btn1FalsePositive || btn2FalsePositive) {
  console.error('  [CRITICAL FLAW DETECTED IN UNREACHABLE CONTROLS MATCHING]');
  console.error('  Traversed nodes #grid-btn-1 and #grid-btn-2 were falsely flagged as unreachable!');
  console.error('  Root Cause: FocusNode.selector is "#grid-btn-1" while CDPAXNode.selector is "button#grid-btn-1".');
  console.error('  String matching fails because tagName prefix "button" is present in AX selector but not FocusNode.');
}
assert(!btn1FalsePositive && !btn2FalsePositive, '2.4 Traversed interactive controls must NOT be flagged as unreachable (Selector prefix mismatch check)');

console.log('\n--- SUITE 3: Shortest Reproducible Key Sequence BFS Certificates ---');

const engine3 = new FocusGraphEngine();

// Construct a directed graph with multiple paths to test BFS minimality:
// Start at Node A.
// Path 1 (length 3): A -> B -> C -> Trap1
// Path 2 (length 2): A -> D -> Trap1
// Trap SCC: Trap1 <-> Trap2 (cycle length 2: Trap1 -> Trap2 -> Trap1)
// Longer cycle in Trap SCC: Trap1 -> Trap3 -> Trap4 -> Trap1 (cycle length 3)

engine3.addNode({ id: 'A', selector: '#A', tagName: 'BUTTON', role: 'button', accessibleName: 'A', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3.addNode({ id: 'B', selector: '#B', tagName: 'BUTTON', role: 'button', accessibleName: 'B', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3.addNode({ id: 'C', selector: '#C', tagName: 'BUTTON', role: 'button', accessibleName: 'C', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3.addNode({ id: 'D', selector: '#D', tagName: 'BUTTON', role: 'button', accessibleName: 'D', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3.addNode({ id: 'Trap1', selector: '#Trap1', tagName: 'INPUT', role: 'textbox', accessibleName: 'Trap1', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3.addNode({ id: 'Trap2', selector: '#Trap2', tagName: 'BUTTON', role: 'button', accessibleName: 'Trap2', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3.addNode({ id: 'Trap3', selector: '#Trap3', tagName: 'BUTTON', role: 'button', accessibleName: 'Trap3', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3.addNode({ id: 'Trap4', selector: '#Trap4', tagName: 'BUTTON', role: 'button', accessibleName: 'Trap4', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });

// Path 1 (3 steps)
engine3.addEdge('A', 'B', 'Tab');
engine3.addEdge('B', 'C', 'Tab');
engine3.addEdge('C', 'Trap1', 'Tab');

// Path 2 (2 steps: shortest)
engine3.addEdge('A', 'D', 'ArrowRight');
engine3.addEdge('D', 'Trap1', 'Tab');

// Trap SCC Cycle 1 (length 2: shortest)
engine3.addEdge('Trap1', 'Trap2', 'Tab');
engine3.addEdge('Trap2', 'Trap1', 'Shift+Tab');

// Trap SCC Cycle 2 (length 3: longer)
engine3.addEdge('Trap1', 'Trap3', 'ArrowDown');
engine3.addEdge('Trap3', 'Trap4', 'Tab');
engine3.addEdge('Trap4', 'Trap1', 'Tab');

const trapCert3 = engine3.findKeyboardTraps();
assert(trapCert3 !== null && trapCert3.detected === true, '3.1 Trap detected in multi-path graph');

console.log(`  Entry Node ID: ${trapCert3?.entryNodeId}`);
console.log(`  Reproducing Sequence: [${trapCert3?.reproducingKeySequence.join(' -> ')}] (Length: ${trapCert3?.reproducingKeySequence.length})`);
console.log(`  Cycle Transitions:`, trapCert3?.cycleTransitions);

// BFS Entry Path Verification:
// Start node is A. Shortest path to Trap1 is A -> D -> Trap1 (2 steps: ArrowRight, Tab).
// BFS must pick the 2-step path [ArrowRight, Tab], NOT the 3-step path [Tab, Tab, Tab].
const entrySubsequence = trapCert3?.reproducingKeySequence.slice(0, 2);
assert(
  entrySubsequence?.[0] === 'ArrowRight' && entrySubsequence?.[1] === 'Tab',
  '3.2 BFS finds strictly minimal entry path length (2 steps via ArrowRight -> Tab instead of 3 steps via B -> C)',
  `Actual entry: [${entrySubsequence?.join(', ')}]`
);

// BFS Cycle Verification:
// Shortest cycle from Trap1 back to Trap1 is Trap1 -> Trap2 -> Trap1 (2 steps: Tab -> Shift+Tab).
const cycleSubsequence = trapCert3?.reproducingKeySequence.slice(2);
assert(
  cycleSubsequence?.length === 2 && cycleSubsequence[0] === 'Tab' && cycleSubsequence[1] === 'Shift+Tab',
  '3.3 BFS finds strictly minimal cycle length (2 steps instead of 3 steps)',
  `Actual cycle: [${cycleSubsequence?.join(', ')}]`
);

// 3.4 Single-Node Self-Loop Trap
const engine3SelfLoop = new FocusGraphEngine();
engine3SelfLoop.addNode({ id: 'X', selector: '#X', tagName: 'BUTTON', role: 'button', accessibleName: 'X', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3SelfLoop.addNode({ id: 'TrapSingle', selector: '#TrapSingle', tagName: 'INPUT', role: 'textbox', accessibleName: 'TrapSingle', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false });
engine3SelfLoop.addEdge('X', 'TrapSingle', 'Tab');
engine3SelfLoop.addEdge('TrapSingle', 'TrapSingle', 'Tab');

const trapCertSingle = engine3SelfLoop.findKeyboardTraps();
assert(trapCertSingle !== null && trapCertSingle.detected === true, '3.4 Single-node self-loop trap detected');
assert(trapCertSingle?.reproducingKeySequence.includes('Tab'), '3.4 Self-loop certificate contains Tab reproducing sequence');
assert(trapCertSingle?.cycleTransitions.some(t => t.from === 'TrapSingle' && t.to === 'TrapSingle'), '3.4 Self-loop recorded in cycleTransitions');

console.log('\n--- SUITE 4: Kendall Tau Metric Edge Cases & Visual Order Sort ---');

const engine4 = new FocusGraphEngine();

// 4.1 Empty & Single node lists
const tauEmpty = engine4.calculateKendallTau([]);
assert(tauEmpty.tau === 1.0 && tauEmpty.isAcceptable === true, '4.1 Empty list returns tau = 1.0 without throwing');

const tauSingle = engine4.calculateKendallTau([
  { id: 'solo', selector: '#solo', tagName: 'BUTTON', role: 'button', accessibleName: 'Solo', tabIndex: 0, box: { x: 0, y: 0, width: 10, height: 10 }, isModal: false, isInert: false }
]);
assert(tauSingle.tau === 1.0 && tauSingle.isAcceptable === true, '4.2 Single node list returns tau = 1.0 without throwing');

// 4.3 Perfect Visual Match (tau = 1.0)
const perfectNodes = [
  { id: 'n1', selector: '#n1', tagName: 'BUTTON', role: 'button', accessibleName: '1', tabIndex: 0, box: { x: 10, y: 10, width: 50, height: 30 }, isModal: false, isInert: false },
  { id: 'n2', selector: '#n2', tagName: 'BUTTON', role: 'button', accessibleName: '2', tabIndex: 0, box: { x: 80, y: 10, width: 50, height: 30 }, isModal: false, isInert: false },
  { id: 'n3', selector: '#n3', tagName: 'BUTTON', role: 'button', accessibleName: '3', tabIndex: 0, box: { x: 10, y: 60, width: 50, height: 30 }, isModal: false, isInert: false },
  { id: 'n4', selector: '#n4', tagName: 'BUTTON', role: 'button', accessibleName: '4', tabIndex: 0, box: { x: 80, y: 60, width: 50, height: 30 }, isModal: false, isInert: false }
];
const tauPerfect = engine4.calculateKendallTau(perfectNodes);
assert(tauPerfect.tau === 1.0 && tauPerfect.isAcceptable === true, '4.3 Perfectly ordered grid returns tau = 1.0');

// 4.4 Completely Inverted Order (tau = -1.0)
const reversedNodes = [...perfectNodes].reverse();
const tauReversed = engine4.calculateKendallTau(reversedNodes);
assert(tauReversed.tau === -1.0 && tauReversed.isAcceptable === false, '4.4 Completely reversed focus order returns tau = -1.0');

// 4.5 Row Grouping Vertical Tolerance (elements within 15px vertically considered same row)
const rowNodes = [
  { id: 'r1', selector: '#r1', tagName: 'BUTTON', role: 'button', accessibleName: 'R1', tabIndex: 0, box: { x: 10, y: 10, width: 50, height: 30 }, isModal: false, isInert: false },
  { id: 'r2', selector: '#r2', tagName: 'BUTTON', role: 'button', accessibleName: 'R2', tabIndex: 0, box: { x: 80, y: 14, width: 50, height: 30 }, isModal: false, isInert: false }, // y delta = 4px <= tolerance
  { id: 'r3', selector: '#r3', tagName: 'BUTTON', role: 'button', accessibleName: 'R3', tabIndex: 0, box: { x: 150, y: 9, width: 50, height: 30 }, isModal: false, isInert: false }  // y delta = 1px <= tolerance
];
const tauRow = engine4.calculateKendallTau(rowNodes);
assert(tauRow.visualOrder[0] === 'r1' && tauRow.visualOrder[1] === 'r2' && tauRow.visualOrder[2] === 'r3',
  '4.5 Visual reading sort respects row vertical tolerance and sorts horizontally across row'
);

console.log('\n======================================================================');
console.log(` SUMMARY: ${RESULTS.passed} Checks Passed, ${RESULTS.failed} Flaws/Failed`);
console.log('======================================================================\n');

if (RESULTS.flaws.length > 0) {
  console.log('Identified Flaws / Critical Challenges:');
  RESULTS.flaws.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
}

process.exit(RESULTS.failed > 0 ? 1 : 0);
