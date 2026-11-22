/**
 * Tier 2 E2E Boundary & Corner Suite: AI Engine Boundaries
 * 
 * Tests boundary conditions across the autonomous verification engine:
 * Disconnected focus graphs, massive circular focus graphs (1,000 nodes),
 * Kendall's Tau correlation extremes, and deep CDP AX-tree boundaries.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import * as fgModule from '../../../lib/barrierlens/engines/focus-graph';
import * as cdpModule from '../../../lib/barrierlens/cdp/cdp-ax-extractor';
import { FocusNode } from '../../../lib/barrierlens/types';

const FocusGraphEngine = (fgModule as any).FocusGraphEngine || (fgModule as any).default?.FocusGraphEngine;
const isInteractiveNode = (cdpModule as any).isInteractiveNode || (cdpModule as any).default?.isInteractiveNode;
const deriveSelectorFromDOMNode = (cdpModule as any).deriveSelectorFromDOMNode || (cdpModule as any).default?.deriveSelectorFromDOMNode;

function createDummyFocusNode(id: string, box: { x: number; y: number; width: number; height: number }, isModal = false): FocusNode {
  return {
    id,
    selector: `#${id}`,
    tagName: 'BUTTON',
    role: 'button',
    accessibleName: `Button ${id}`,
    tabIndex: 0,
    box,
    isModal,
    isInert: false,
    isVirtualDescendant: false
  };
}

describe('Tier 2: AI Engine Boundaries', () => {

  describe('Disconnected Focus Graphs & Island Topologies', () => {
    it('should handle completely disconnected focus graphs with zero ingress and egress edges', () => {
      const engine = new FocusGraphEngine();

      // Add 10 isolated focus nodes with zero edges
      for (let i = 0; i < 10; i++) {
        engine.addNode(createDummyFocusNode(`isolated_${i}`, { x: i * 20, y: 10, width: 80, height: 30 }));
      }

      assert.equal(engine.getNodes().length, 10);
      assert.equal(engine.getEdges().length, 0);

      // Tarjan SCC evaluation must complete without infinite loop or exception
      const trapResult = engine.findKeyboardTraps();
      assert.equal(trapResult, null, 'Disconnected graph without cycles must not flag false positive trap');
    });

    it('should detect keyboard traps in multi-island graphs with isolated cyclic components', () => {
      const engine = new FocusGraphEngine();

      // Island A: 3-node directed cycle with no exit edge
      const n1 = createDummyFocusNode('island_a1', { x: 10, y: 10, width: 80, height: 30 });
      const n2 = createDummyFocusNode('island_a2', { x: 100, y: 10, width: 80, height: 30 });
      const n3 = createDummyFocusNode('island_a3', { x: 190, y: 10, width: 80, height: 30 });

      // Island B: Completely isolated node
      const n4 = createDummyFocusNode('island_b_isolated', { x: 10, y: 100, width: 80, height: 30 });

      engine.addNode(n1);
      engine.addNode(n2);
      engine.addNode(n3);
      engine.addNode(n4);

      // Connect cycle in Island A
      engine.addEdge('island_a1', 'island_a2', 'Tab');
      engine.addEdge('island_a2', 'island_a3', 'Tab');
      engine.addEdge('island_a3', 'island_a1', 'Tab');

      const trap = engine.findKeyboardTraps();
      assert.ok(trap !== null, 'Trap certificate must be issued for Island A sink cycle');
      assert.equal(trap.detected, true);
      assert.equal(trap.trapType, 'sink_scc');
      assert.equal(trap.componentNodeIds.length, 3);
      assert.ok(trap.componentNodeIds.includes('island_a1'));
      assert.ok(trap.componentNodeIds.includes('island_a2'));
      assert.ok(trap.componentNodeIds.includes('island_a3'));
    });

    it('should detect single-node self-loop trap (|C| = 1) with self-directed edge', () => {
      const engine = new FocusGraphEngine();

      const selfTrap = createDummyFocusNode('trapped_btn', { x: 10, y: 10, width: 80, height: 30 });
      const normalBtn = createDummyFocusNode('normal_btn', { x: 100, y: 10, width: 80, height: 30 });

      engine.addNode(selfTrap);
      engine.addNode(normalBtn);

      // Self-loop on trapped_btn with no exit
      engine.addEdge('trapped_btn', 'trapped_btn', 'Tab');

      const trap = engine.findKeyboardTraps();
      assert.ok(trap !== null, 'Single-node self loop must be detected as sink SCC');
      assert.equal(trap.detected, true);
      assert.deepEqual(trap.componentNodeIds, ['trapped_btn']);
    });
  });

  describe('Massive Circular Focus Graphs (1,000 Nodes Stress)', () => {
    it('should process a massive 1,000-node circular focus graph within 500ms without stack overflow', () => {
      const engine = new FocusGraphEngine();
      const NODE_COUNT = 1000;

      // 1. Generate 1,000 nodes in single SCC
      for (let i = 0; i < NODE_COUNT; i++) {
        engine.addNode(createDummyFocusNode(`node_${i}`, { x: (i % 20) * 50, y: Math.floor(i / 20) * 30, width: 40, height: 25 }));
      }

      // 2. Add an outside node so totalNodes > scc.length
      engine.addNode(createDummyFocusNode('outside_node', { x: 0, y: 2000, width: 100, height: 40 }));

      // 3. Connect 1,000 nodes into a massive directed loop: 0 -> 1 -> 2 -> ... -> 999 -> 0
      for (let i = 0; i < NODE_COUNT - 1; i++) {
        engine.addEdge(`node_${i}`, `node_${i + 1}`, 'Tab');
      }
      engine.addEdge(`node_${NODE_COUNT - 1}`, 'node_0', 'Tab');

      assert.equal(engine.getNodes().length, 1001);
      assert.equal(engine.getEdges().length, 1000);

      // 4. Time Tarjan SCC solver execution
      const startTime = performance.now();
      const trap = engine.findKeyboardTraps();
      const elapsed = performance.now() - startTime;

      assert.ok(elapsed < 500, `Tarjan solver on 1,000 nodes must complete in < 500ms (took ${elapsed}ms)`);
      assert.ok(trap !== null, 'Must detect 1,000-node sink cycle');
      assert.equal(trap.detected, true);
      assert.equal(trap.componentNodeIds.length, 1000, 'SCC must contain all 1,000 cyclic nodes');
    });
  });

  describe('Kendall\'s Tau Rank Correlation Extremes', () => {
    it('should compute Kendall Tau = 1.0 for identical sequential and visual reading order', () => {
      const engine = new FocusGraphEngine();

      // Top-to-bottom, left-to-right order
      const nodes: FocusNode[] = [
        createDummyFocusNode('b1', { x: 10, y: 10, width: 80, height: 30 }),
        createDummyFocusNode('b2', { x: 100, y: 10, width: 80, height: 30 }),
        createDummyFocusNode('b3', { x: 10, y: 50, width: 80, height: 30 }),
        createDummyFocusNode('b4', { x: 100, y: 50, width: 80, height: 30 }),
      ];

      for (const n of nodes) engine.addNode(n);

      const metric = engine.calculateKendallTau(nodes);
      assert.equal(metric.tau, 1.0, 'Identical orders must yield tau = 1.0');
      assert.equal(metric.inversionCount, 0);
      assert.equal(metric.isAcceptable, true);
    });

    it('should compute Kendall Tau = -1.0 for completely reversed focus order', () => {
      const engine = new FocusGraphEngine();

      // Visual reading order: top to bottom (row 1 to row 4)
      const visualNodes = [
        createDummyFocusNode('row1', { x: 10, y: 10, width: 100, height: 30 }),
        createDummyFocusNode('row2', { x: 10, y: 60, width: 100, height: 30 }),
        createDummyFocusNode('row3', { x: 10, y: 110, width: 100, height: 30 }),
        createDummyFocusNode('row4', { x: 10, y: 160, width: 100, height: 30 }),
      ];

      // Tab traversal sequence in exact opposite order: row4, row3, row2, row1
      const reversedFocusOrder = [...visualNodes].reverse();

      const metric = engine.calculateKendallTau(reversedFocusOrder);
      assert.equal(metric.tau, -1.0, 'Completely reversed order must yield tau = -1.0');
      assert.equal(metric.isAcceptable, false);
      assert.equal(metric.inversionCount, 6, '4 items reversed has 6 inversions (4*3/2)');
    });

    it('should handle Kendall Tau boundary conditions for empty array and single-node list', () => {
      const engine = new FocusGraphEngine();

      // 1. Empty list
      const emptyMetric = engine.calculateKendallTau([]);
      assert.equal(emptyMetric.tau, 1.0);
      assert.equal(emptyMetric.totalPairs, 0);
      assert.equal(emptyMetric.inversionCount, 0);
      assert.equal(emptyMetric.isAcceptable, true);

      // 2. Single element list
      const singleNode = [createDummyFocusNode('solo', { x: 10, y: 10, width: 50, height: 30 })];
      const singleMetric = engine.calculateKendallTau(singleNode);
      assert.equal(singleMetric.tau, 1.0);
      assert.equal(singleMetric.totalPairs, 0);
      assert.equal(singleMetric.isAcceptable, true);
    });

    it('should apply row tolerance delta_y_tol for elements on the same visual baseline', () => {
      const engine = new FocusGraphEngine();

      // Two buttons on same row with slight 3px vertical offset (within delta_y_tol <= 15)
      const bLeft = createDummyFocusNode('btn_left', { x: 20, y: 40, width: 80, height: 30 });
      const bRight = createDummyFocusNode('btn_right', { x: 120, y: 43, width: 80, height: 30 });

      // Focus order: Left -> Right
      const metric = engine.calculateKendallTau([bLeft, bRight]);
      assert.equal(metric.tau, 1.0, 'Buttons on same visual row must sort by X coordinate');
      assert.equal(metric.inversionCount, 0);
    });

    it('should safely process Kendall Tau nodes with zero or negative bounding box dimensions', () => {
      const engine = new FocusGraphEngine();

      const zeroBoxNode1 = createDummyFocusNode('zero1', { x: -10, y: 0, width: 0, height: 0 });
      const zeroBoxNode2 = createDummyFocusNode('zero2', { x: 20, y: 0, width: 0, height: 0 });

      const metric = engine.calculateKendallTau([zeroBoxNode1, zeroBoxNode2]);
      assert.ok(!Number.isNaN(metric.tau), 'Tau calculation must never return NaN');
      assert.equal(metric.tau, 1.0);
    });
  });

  describe('CDP AX Tree Boundaries & Shadow DOM Piercing', () => {
    it('should handle empty CDP AX tree in unreachable controls detection', () => {
      const engine = new FocusGraphEngine();
      const result = engine.findUnreachableControls([]);

      assert.deepEqual(result.unreachableNodes, []);
      assert.deepEqual(result.findings, []);
      assert.equal(result.certificate, null);
    });

    it('should pierce deep 50-level nested CDP AX tree hierarchy to discover unreachable controls', () => {
      const engine = new FocusGraphEngine();

      // Build 50-level deep nesting of generic container AX nodes
      const axNodes: any[] = [];
      let currentParentId: string | undefined = undefined;

      for (let level = 0; level < 50; level++) {
        const nodeId = `ax_container_level_${level}`;
        axNodes.push({
          nodeId,
          role: 'generic',
          disabled: false,
          focusable: false,
          focused: false,
          parentId: currentParentId
        });
        currentParentId = nodeId;
      }

      // Append leaf interactive button at depth 50
      const leafInteractiveNode = {
        nodeId: 'ax_deep_leaf_btn',
        backendDOMNodeId: 9999,
        role: 'button',
        name: 'Deep Shadow Action',
        disabled: false,
        focusable: true,
        focused: false,
        parentId: currentParentId,
        selector: 'deep-host >>> button#shadow-action'
      };
      axNodes.push(leafInteractiveNode);

      // Engine has not visited this control
      const unreachable = engine.findUnreachableControls(axNodes);
      assert.equal(unreachable.unreachableNodes.length, 1);
      assert.equal(unreachable.unreachableNodes[0].nodeId, 'ax_deep_leaf_btn');
      assert.ok(unreachable.certificate !== null);
      assert.equal(unreachable.certificate.detected, true);
      assert.equal(unreachable.certificate.trapType, 'unreachable_control');
    });

    it('should accurately classify nodes in isInteractiveNode across boundary states', () => {
      // Ignored nodes
      assert.equal(isInteractiveNode({ nodeId: '1', role: 'button', ignored: true, disabled: false, focusable: true, focused: false }), false);

      // Generic / Doc nodes
      assert.equal(isInteractiveNode({ nodeId: '2', role: 'none', disabled: false, focusable: false, focused: false }), false);
      assert.equal(isInteractiveNode({ nodeId: '3', role: 'generic', disabled: false, focusable: false, focused: false }), false);
      assert.equal(isInteractiveNode({ nodeId: '4', role: 'rootwebarea', disabled: false, focusable: false, focused: false }), false);

      // Interactive controls
      assert.equal(isInteractiveNode({ nodeId: '5', role: 'button', disabled: false, focusable: true, focused: false }), true);
      assert.equal(isInteractiveNode({ nodeId: '6', role: 'checkbox', disabled: false, focusable: true, focused: false }), true);
      assert.equal(isInteractiveNode({ nodeId: '7', role: 'searchbox', disabled: false, focusable: true, focused: false }), true);

      // Focusable custom element
      assert.equal(isInteractiveNode({ nodeId: '8', role: 'custom-widget', disabled: false, focusable: true, focused: false }), true);

      // Non-element nodeType
      assert.equal(isInteractiveNode({
        nodeId: '9',
        role: 'button',
        disabled: false,
        focusable: true,
        focused: false,
        domNode: { nodeType: 3 } as any // Text node
      }), false);
    });

    it('should generate valid CSS selectors in deriveSelectorFromDOMNode on non-standard IDs and attributes', () => {
      // Standard alphanumeric ID
      const standard = deriveSelectorFromDOMNode({
        nodeType: 1,
        localName: 'button',
        attributes: ['id', 'submit-btn']
      });
      assert.equal(standard, 'button#submit-btn');

      // ID with spaces / special characters
      const specialId = deriveSelectorFromDOMNode({
        nodeType: 1,
        localName: 'div',
        attributes: ['id', 'user input container [0]']
      });
      assert.equal(specialId, 'div[id="user input container [0]"]');

      // Element with aria-label
      const ariaLabeled = deriveSelectorFromDOMNode({
        nodeType: 1,
        localName: 'a',
        attributes: ['aria-label', 'Next Page']
      });
      assert.equal(ariaLabeled, 'a[aria-label="Next Page"]');

      // Document root
      const doc = deriveSelectorFromDOMNode({
        nodeType: 9,
        nodeName: '#document'
      });
      assert.equal(doc, 'html');
    });

    it('should detect Focus Loss when activeElement falls back to document.body', () => {
      const engine = new FocusGraphEngine();

      // Focus dropped to body
      const loss = engine.detectFocusLoss({
        beforeActiveElement: 'button#open-modal',
        afterActiveElement: 'body',
        triggerKey: 'Escape',
        actionDescription: 'Dismiss modal dialog'
      });

      assert.ok(loss !== null);
      assert.equal(loss.detected, true);
      assert.equal(loss.elementBefore, 'button#open-modal');
      assert.equal(loss.elementAfter, 'body');
      assert.ok(loss.proofExplanation.includes('WCAG 2.4.3'));

      // Normal focus transition to another element (not body)
      const normal = engine.detectFocusLoss({
        beforeActiveElement: 'button#one',
        afterActiveElement: 'button#two'
      });
      assert.equal(normal, null, 'Normal focus transition must not flag focus loss');
    });
  });

});
