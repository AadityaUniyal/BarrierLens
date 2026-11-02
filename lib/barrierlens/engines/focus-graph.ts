import { Page } from 'playwright';
import {
  FocusNode,
  FocusEdge,
  TrapCertificate,
  KendallTauMetric,
  TraversalOptions,
  UnreachableControlFinding,
  FocusLossFinding
} from '../types';
import { CDPAXNode } from '../cdp/cdp-ax-extractor';

export interface TrapFindingOptions {
  keyHistory?: string[];
  page?: Page;
}

export class FocusGraphEngine {
  private nodes: Map<string, FocusNode> = new Map();
  private adjacency: Map<string, string[]> = new Map();
  private reverseAdjacency: Map<string, string[]> = new Map();
  private edges: FocusEdge[] = [];
  private focusOrderList: FocusNode[] = [];
  private focusLossEvents: FocusLossFinding[] = [];

  /**
   * Register or retrieve a focus node
   */
  addNode(node: FocusNode): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.focusOrderList.push(node);
      if (!this.adjacency.has(node.id)) {
        this.adjacency.set(node.id, []);
      }
      if (!this.reverseAdjacency.has(node.id)) {
        this.reverseAdjacency.set(node.id, []);
      }
    } else {
      // Update existing node properties (e.g. bounding box or modal state)
      const existing = this.nodes.get(node.id)!;
      this.nodes.set(node.id, { ...existing, ...node });
    }
  }

  /**
   * Retrieve node by ID
   */
  getNode(id: string): FocusNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all registered nodes
   */
  getNodes(): FocusNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all registered edges
   */
  getEdges(): FocusEdge[] {
    return [...this.edges];
  }

  /**
   * Get focus nodes in order of first discovery
   */
  getFocusOrder(): FocusNode[] {
    return [...this.focusOrderList];
  }

  /**
   * Clear all internal graph structures
   */
  clear(): void {
    this.nodes.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();
    this.edges = [];
    this.focusOrderList = [];
    this.focusLossEvents = [];
  }

  /**
   * Add a directed key navigation transition (e.g. Tab from A -> B)
   * Fixes reverseAdjacency registration bug: registers fromId in reverseAdjacency of toId.
   */
  addEdge(
    fromId: string,
    toId: string,
    key: FocusEdge['key'],
    options?: {
      latencyMs?: number;
      isDefaultPrevented?: boolean;
      modifiers?: ('Shift' | 'Control' | 'Alt')[];
    }
  ): void {
    const edge: FocusEdge = {
      fromId,
      toId,
      key,
      modifiers: options?.modifiers,
      timestamp: performance.now(),
      latencyMs: options?.latencyMs,
      isDefaultPrevented: options?.isDefaultPrevented
    };
    this.edges.push(edge);

    if (!this.adjacency.has(fromId)) this.adjacency.set(fromId, []);
    if (!this.reverseAdjacency.has(toId)) this.reverseAdjacency.set(toId, []);

    if (!this.adjacency.get(fromId)!.includes(toId)) {
      this.adjacency.get(fromId)!.push(toId);
    }
    // Fixed bug: push fromId into reverseAdjacency of toId (previously pushed toId)
    if (!this.reverseAdjacency.get(toId)!.includes(fromId)) {
      this.reverseAdjacency.get(toId)!.push(fromId);
    }
  }

  /**
   * Extracts snapshot of document.activeElement and handles virtual active descendants.
   */
  private async getActiveElementSnapshot(page: Page): Promise<FocusNode & { isBody: boolean }> {
    return await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el === document.documentElement) {
        return {
          isBody: true,
          id: 'body',
          selector: 'body',
          tagName: 'BODY',
          role: 'generic',
          accessibleName: '',
          tabIndex: -1,
          box: { x: 0, y: 0, width: 0, height: 0 },
          isModal: false,
          isInert: false,
          isVirtualDescendant: false
        };
      }

      const getSelector = (target: Element): string => {
        if (target.id) return `#${target.id}`;
        const nameAttr = target.getAttribute('name');
        if (nameAttr) return `${target.tagName.toLowerCase()}[name="${nameAttr}"]`;
        const testId = target.getAttribute('data-testid');
        if (testId) return `[data-testid="${testId}"]`;

        const path: string[] = [];
        let curr: Element | null = target;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          if (curr.id) {
            path.unshift(`#${curr.id}`);
            break;
          }
          let sel = curr.tagName.toLowerCase();
          const parent = curr.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === curr!.tagName);
            if (siblings.length > 1) {
              const idx = siblings.indexOf(curr) + 1;
              sel += `:nth-of-type(${idx})`;
            }
          }
          path.unshift(sel);
          curr = curr.parentElement;
        }
        return path.join(' > ') || target.tagName.toLowerCase();
      };

      const rect = el.getBoundingClientRect();
      const box = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

      const modalContainer = el.closest('dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"]');
      const isModal = !!modalContainer;
      const isInert = !!el.closest('[inert], [aria-hidden="true"]');

      const role = el.getAttribute('role') || el.tagName.toLowerCase();
      const accessibleName =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        (el.innerText ? el.innerText.trim().slice(0, 60) : '') ||
        el.getAttribute('value') ||
        '';

      const tabIndex = typeof el.tabIndex === 'number' ? el.tabIndex : 0;
      const selector = getSelector(el);
      const id = el.id ? `#${el.id}` : selector;

      let isVirtualDescendant = false;
      let virtualId = id;
      let virtualSelector = selector;
      let virtualRole = role;
      let virtualName = accessibleName;
      let virtualBox = box;
      let parentCompositeRole: string | undefined = undefined;
      let parentCompositeSelector: string | undefined = undefined;

      // Check aria-activedescendant on container
      const activeDescId = el.getAttribute('aria-activedescendant');
      if (activeDescId) {
        const descEl = document.getElementById(activeDescId);
        if (descEl) {
          isVirtualDescendant = true;
          virtualId = `${id}#${activeDescId}`;
          virtualSelector = `#${activeDescId}`;
          virtualRole = descEl.getAttribute('role') || descEl.tagName.toLowerCase();
          virtualName =
            descEl.getAttribute('aria-label') ||
            (descEl.innerText ? descEl.innerText.trim().slice(0, 60) : '') ||
            '';
          const dRect = descEl.getBoundingClientRect();
          virtualBox = {
            x: Math.round(dRect.x),
            y: Math.round(dRect.y),
            width: Math.round(dRect.width),
            height: Math.round(dRect.height)
          };
          parentCompositeRole = role;
          parentCompositeSelector = selector;
        }
      }

      // Check if item is child of a composite widget
      const compositeParent = el.closest(
        '[role="tablist"], [role="menu"], [role="menubar"], [role="radiogroup"], [role="grid"], [role="tree"], [role="treegrid"]'
      );
      if (compositeParent && compositeParent !== el) {
        parentCompositeRole = compositeParent.getAttribute('role') || undefined;
        parentCompositeSelector = getSelector(compositeParent);
      }

      return {
        isBody: false,
        id: isVirtualDescendant ? virtualId : id,
        selector: isVirtualDescendant ? virtualSelector : selector,
        tagName: el.tagName,
        role: isVirtualDescendant ? virtualRole : role,
        accessibleName: isVirtualDescendant ? virtualName : accessibleName,
        tabIndex,
        box: isVirtualDescendant ? virtualBox : box,
        isModal,
        isInert,
        isVirtualDescendant,
        parentCompositeRole,
        parentCompositeSelector
      };
    });
  }

  /**
   * Empirical focus graph traversal:
   * Dispatches physical Tab, Shift+Tab, and arrow keys when composite widgets are detected.
   * Records activeElement transitions and detects focus loss events.
   */
  async traversePage(
    page: Page,
    options?: TraversalOptions
  ): Promise<{ nodes: FocusNode[]; edges: FocusEdge[]; focusLossEvents: FocusLossFinding[] }> {
    const maxSteps = options?.maxSteps ?? 50;
    const stepDelayMs = options?.stepDelayMs ?? 50;
    const exploreComposite = options?.exploreCompositeWidgets ?? true;
    const probeShiftTab = options?.probeShiftTab ?? true;
    const detectLoss = options?.detectLoss ?? true;

    // Reset initial focus if body is active or blur
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
    });

    let currentSnapshot = await this.getActiveElementSnapshot(page);
    if (!currentSnapshot.isBody) {
      this.addNode(currentSnapshot);
    }

    // Step 1: Forward Tab traversal
    const visitedTransitions = new Set<string>();
    let consecutiveRepeats = 0;

    for (let step = 0; step < maxSteps; step++) {
      const beforeSnapshot = currentSnapshot;
      const startTime = performance.now();

      await page.keyboard.press('Tab');
      if (stepDelayMs > 0) {
        await page.waitForTimeout(stepDelayMs);
      }

      const latencyMs = Math.round(performance.now() - startTime);
      currentSnapshot = await this.getActiveElementSnapshot(page);

      // Focus Loss Detection during Tab navigation
      if (detectLoss && !beforeSnapshot.isBody && currentSnapshot.isBody) {
        await page.waitForTimeout(100);
        const recheck = await this.getActiveElementSnapshot(page);
        if (recheck.isBody) {
          const lossFinding = this.detectFocusLoss({
            beforeActiveElement: beforeSnapshot.id,
            afterActiveElement: 'body',
            triggerKey: 'Tab',
            actionDescription: `Forward Tab from ${beforeSnapshot.id} dropped focus to document.body`
          });
          if (lossFinding) {
            this.focusLossEvents.push(lossFinding);
          }
        }
      }

      if (!currentSnapshot.isBody) {
        this.addNode(currentSnapshot);
      }

      if (!beforeSnapshot.isBody && !currentSnapshot.isBody) {
        this.addEdge(beforeSnapshot.id, currentSnapshot.id, 'Tab', { latencyMs });
        const transitionKey = `${beforeSnapshot.id}->Tab->${currentSnapshot.id}`;
        if (visitedTransitions.has(transitionKey)) {
          consecutiveRepeats++;
          if (consecutiveRepeats >= 3) {
            // Reached stable cycle
            break;
          }
        } else {
          visitedTransitions.add(transitionKey);
          consecutiveRepeats = 0;
        }
      }

      // Step 2: Composite widget exploration via Arrow keys
      if (exploreComposite && !currentSnapshot.isBody) {
        const compositeRole = currentSnapshot.parentCompositeRole || currentSnapshot.role;
        const isComposite = [
          'tablist', 'tab',
          'menu', 'menubar', 'menuitem',
          'radiogroup', 'radio',
          'grid', 'gridcell',
          'tree', 'treeitem'
        ].includes(compositeRole.toLowerCase());

        if (isComposite) {
          const arrowKeys: FocusEdge['key'][] =
            compositeRole === 'tablist' || compositeRole === 'tab' || compositeRole === 'menubar'
              ? ['ArrowRight', 'ArrowLeft']
              : compositeRole === 'menu' || compositeRole === 'menuitem'
              ? ['ArrowDown', 'ArrowUp']
              : compositeRole === 'radiogroup' || compositeRole === 'radio'
              ? ['ArrowDown', 'ArrowRight']
              : ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];

          for (const arrowKey of arrowKeys) {
            const compositeBefore = currentSnapshot;
            const arrowStart = performance.now();
            await page.keyboard.press(arrowKey);
            if (stepDelayMs > 0) {
              await page.waitForTimeout(stepDelayMs);
            }
            const arrowLatency = Math.round(performance.now() - arrowStart);
            const compositeAfter = await this.getActiveElementSnapshot(page);

            if (!compositeAfter.isBody) {
              this.addNode(compositeAfter);
              if (compositeBefore.id !== compositeAfter.id) {
                this.addEdge(compositeBefore.id, compositeAfter.id, arrowKey, { latencyMs: arrowLatency });
              }
            }
            currentSnapshot = compositeAfter;
          }
        }
      }
    }

    // Step 3: Shift+Tab probing for backward transitions
    if (probeShiftTab && this.nodes.size > 0) {
      const shiftTabSteps = Math.min(this.nodes.size, 10);
      for (let s = 0; s < shiftTabSteps; s++) {
        const beforeSnapshot = currentSnapshot;
        const shiftStart = performance.now();

        await page.keyboard.press('Shift+Tab');
        if (stepDelayMs > 0) {
          await page.waitForTimeout(stepDelayMs);
        }

        const shiftLatency = Math.round(performance.now() - shiftStart);
        currentSnapshot = await this.getActiveElementSnapshot(page);

        if (!currentSnapshot.isBody) {
          this.addNode(currentSnapshot);
        }

        if (!beforeSnapshot.isBody && !currentSnapshot.isBody) {
          this.addEdge(beforeSnapshot.id, currentSnapshot.id, 'Shift+Tab', { latencyMs: shiftLatency });
        }
      }
    }

    return {
      nodes: this.getNodes(),
      edges: this.getEdges(),
      focusLossEvents: [...this.focusLossEvents]
    };
  }

  /**
   * Tarjan's Strongly Connected Components (SCC) algorithm.
   * Finds all strongly connected components in the directed focus graph.
   * Identifies terminal sink SCCs with no outgoing navigation edges to the rest of the page.
   * Correctly handles 1-node self-loop traps as well as multi-node cycle traps.
   */
  findKeyboardTraps(keyHistory?: string[]): TrapCertificate | null;
  findKeyboardTraps(options: { keyHistory?: string[]; page: Page }): Promise<TrapCertificate | null>;
  findKeyboardTraps(options: { keyHistory?: string[]; page?: undefined }): TrapCertificate | null;
  findKeyboardTraps(
    options?: string[] | TrapFindingOptions
  ): TrapCertificate | null | Promise<TrapCertificate | null> {
    const history = Array.isArray(options) ? options : options?.keyHistory || [];
    const page = !Array.isArray(options) ? options?.page : undefined;

    if (page) {
      return this.findKeyboardTrapsAsync({ keyHistory: history, page });
    }

    return this.evaluateTrapsInternal(history);
  }

  /**
   * Asynchronous trap evaluation with physical Escape key probe against active page.
   */
  async findKeyboardTrapsLive(page: Page, options?: { keyHistory?: string[] }): Promise<TrapCertificate | null> {
    return this.findKeyboardTrapsAsync({ page, keyHistory: options?.keyHistory });
  }

  private async findKeyboardTrapsAsync(options: { keyHistory?: string[]; page: Page }): Promise<TrapCertificate | null> {
    const baseTrap = this.evaluateTrapsInternal(options.keyHistory || []);
    if (!baseTrap) return null;

    // Execute intentional modal check & physical Escape probe
    const trappedNodes = baseTrap.componentNodeIds.map(id => this.nodes.get(id)).filter(Boolean) as FocusNode[];
    const isInsideModal = trappedNodes.some(n => n.isModal);

    if (isInsideModal) {
      const escapeTest = await this.verifyModalEscape(options.page);
      if (escapeTest.escaped) {
        // Legitimate intentional accessible modal: Escape dismisses and returns focus!
        return null;
      }

      if (escapeTest.result === 'focus_lost_to_body') {
        return this.generateTrapCertificate(
          baseTrap.componentNodeIds,
          'focus_loss',
          true,
          'focus_lost_to_body'
        );
      }

      // Modal remains open or prevents Escape: Confirmed modal deadlock!
      return this.generateTrapCertificate(
        baseTrap.componentNodeIds,
        'modal_deadlock',
        true,
        'ignored'
      );
    }

    return baseTrap;
  }

  private evaluateTrapsInternal(keyHistory: string[]): TrapCertificate | null {
    let index = 0;
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const sccs: string[][] = [];

    const strongConnect = (u: string) => {
      indices.set(u, index);
      lowlink.set(u, index);
      index++;
      stack.push(u);
      onStack.add(u);

      const neighbors = this.adjacency.get(u) || [];
      for (const v of neighbors) {
        if (!indices.has(v)) {
          strongConnect(v);
          lowlink.set(u, Math.min(lowlink.get(u)!, lowlink.get(v)!));
        } else if (onStack.has(v)) {
          lowlink.set(u, Math.min(lowlink.get(u)!, indices.get(v)!));
        }
      }

      if (lowlink.get(u) === indices.get(u)) {
        const scc: string[] = [];
        let w = '';
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== u);
        sccs.push(scc);
      }
    };

    for (const nodeId of this.nodes.keys()) {
      if (!indices.has(nodeId)) {
        strongConnect(nodeId);
      }
    }

    const totalNodes = this.nodes.size;

    for (const scc of sccs) {
      const sccSet = new Set(scc);

      // Check for navigation exit edges (Tab / Shift+Tab) escaping the SCC
      let hasExitEdge = false;
      for (const nodeId of scc) {
        const neighbors = this.adjacency.get(nodeId) || [];
        for (const target of neighbors) {
          if (!sccSet.has(target)) {
            hasExitEdge = true;
            break;
          }
        }
        if (hasExitEdge) break;
      }

      // Case 1: Multi-node cycle trap (scc.length >= 2) with zero exit edges
      if (scc.length >= 2 && !hasExitEdge) {
        // If scc contains all nodes in the document, verify if it's an isolated modal or full-page wrap
        if (scc.length === totalNodes) {
          const allModal = scc.every(id => this.nodes.get(id)?.isModal);
          if (!allModal) {
            // Whole page standard tabbing wrap is NOT a trap
            continue;
          }
        }

        const isModal = scc.some(id => this.nodes.get(id)?.isModal);
        const trapType = isModal ? 'modal_deadlock' : 'sink_scc';
        return this.generateTrapCertificate(scc, trapType, false, undefined, keyHistory);
      }

      // Case 2: Single-node self-loop trap (|C| = 1) with self-loop and no exit
      if (scc.length === 1 && totalNodes > 1 && !hasExitEdge) {
        const singleNodeId = scc[0];
        const selfLoops = this.edges.filter(
          e => e.fromId === singleNodeId && e.toId === singleNodeId && (e.key === 'Tab' || e.key === 'Shift+Tab')
        );
        if (selfLoops.length > 0) {
          const isModal = this.nodes.get(singleNodeId)?.isModal ?? false;
          const trapType = isModal ? 'modal_deadlock' : 'sink_scc';
          return this.generateTrapCertificate(scc, trapType, false, undefined, keyHistory);
        }
      }
    }

    return null;
  }

  /**
   * Intentional Modal Escape Key Probe:
   * Dispatches physical 'Escape' key and evaluates modal closure and focus restoration.
   */
  async verifyModalEscape(
    page: Page,
    modalSelector?: string
  ): Promise<{
    escaped: boolean;
    result: 'escaped_to_trigger' | 'ignored' | 'focus_lost_to_body';
    activeElementAfter: string;
  }> {
    const beforeActive = await this.getActiveElementSnapshot(page);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);

    const afterActive = await this.getActiveElementSnapshot(page);

    // Verify modal visibility
    const isModalStillVisible = await page.evaluate((selector) => {
      const modal = selector
        ? document.querySelector(selector)
        : document.querySelector('dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"]');
      if (!modal) return false;
      const style = window.getComputedStyle(modal);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }, modalSelector);

    if (!isModalStillVisible && !afterActive.isBody && afterActive.id !== beforeActive.id) {
      return {
        escaped: true,
        result: 'escaped_to_trigger',
        activeElementAfter: afterActive.id
      };
    }

    if (!isModalStillVisible && afterActive.isBody) {
      return {
        escaped: false,
        result: 'focus_lost_to_body',
        activeElementAfter: 'body'
      };
    }

    return {
      escaped: false,
      result: 'ignored',
      activeElementAfter: afterActive.id
    };
  }

  /**
   * BFS Shortest Path Trap Certificate Generator:
   * Finds the shortest reproducible key sequence entering the trap and completing the cycle.
   */
  generateTrapCertificate(
    scc: string[],
    trapType: 'sink_scc' | 'modal_deadlock' | 'focus_loss' | 'unreachable_control' = 'sink_scc',
    testedEscape: boolean = false,
    escapeResult?: string,
    keyHistory?: string[]
  ): TrapCertificate {
    const sccSet = new Set(scc);
    const startNode = this.focusOrderList[0]?.id || Array.from(this.nodes.keys())[0] || scc[0];

    // BFS 1: Find shortest entry sequence from startNode to any node in SCC
    let entryNodeId = scc[0];
    let entryKeySequence: string[] = [];

    if (sccSet.has(startNode)) {
      entryNodeId = startNode;
      entryKeySequence = [];
    } else {
      interface BFSQueueItem {
        nodeId: string;
        path: string[];
      }
      const queue: BFSQueueItem[] = [{ nodeId: startNode, path: [] }];
      const visited = new Set<string>([startNode]);
      let foundEntry = false;

      while (queue.length > 0 && !foundEntry) {
        const { nodeId, path } = queue.shift()!;
        const outgoing = this.edges.filter(e => e.fromId === nodeId);

        for (const edge of outgoing) {
          const nextId = edge.toId;
          const nextPath = [...path, edge.key];

          if (sccSet.has(nextId)) {
            entryNodeId = nextId;
            entryKeySequence = nextPath;
            foundEntry = true;
            break;
          }

          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push({ nodeId: nextId, path: nextPath });
          }
        }
      }
    }

    // BFS 2: Find cycle sequence within SCC starting from entryNodeId
    let cycleKeySequence: string[] = [];
    const cycleTransitions: Array<{ from: string; key: string; to: string }> = [];

    if (scc.length === 1) {
      const selfLoop = this.edges.find(e => e.fromId === entryNodeId && e.toId === entryNodeId);
      const key = selfLoop ? selfLoop.key : 'Tab';
      cycleKeySequence = [key];
      cycleTransitions.push({ from: entryNodeId, key, to: entryNodeId });
    } else {
      interface CycleItem {
        nodeId: string;
        path: string[];
        transitions: Array<{ from: string; key: string; to: string }>;
      }
      const cycleQueue: CycleItem[] = [];
      const outgoingFromEntry = this.edges.filter(e => e.fromId === entryNodeId && sccSet.has(e.toId));

      for (const edge of outgoingFromEntry) {
        cycleQueue.push({
          nodeId: edge.toId,
          path: [edge.key],
          transitions: [{ from: edge.fromId, key: edge.key, to: edge.toId }]
        });
      }

      let cycleFound = false;
      const visitedInCycle = new Set<string>();

      while (cycleQueue.length > 0 && !cycleFound) {
        const item = cycleQueue.shift()!;
        if (item.nodeId === entryNodeId) {
          cycleKeySequence = item.path;
          cycleTransitions.push(...item.transitions);
          cycleFound = true;
          break;
        }

        const nextEdges = this.edges.filter(e => e.fromId === item.nodeId && sccSet.has(e.toId));
        for (const edge of nextEdges) {
          const transKey = `${edge.fromId}->${edge.key}->${edge.toId}`;
          if (!visitedInCycle.has(transKey)) {
            visitedInCycle.add(transKey);
            cycleQueue.push({
              nodeId: edge.toId,
              path: [...item.path, edge.key],
              transitions: [...item.transitions, { from: edge.fromId, key: edge.key, to: edge.toId }]
            });
          }
        }
      }
    }

    const reproducingKeySequence =
      entryKeySequence.length > 0 || cycleKeySequence.length > 0
        ? [...entryKeySequence, ...cycleKeySequence]
        : keyHistory && keyHistory.length > 0
        ? keyHistory.slice(-6)
        : ['Tab', 'Tab', 'Tab'];

    let explanation = '';
    if (trapType === 'modal_deadlock') {
      explanation = `Modal deadlock detected in dialog containing [${scc.slice(0, 3).join(', ')}]. Physical Escape key probe returned '${escapeResult || 'ignored'}' with no keyboard exit to parent document.`;
    } else if (trapType === 'focus_loss') {
      explanation = `Focus loss detected: keyboard interaction dropped focus to document.body with no immediate active element recovery.`;
    } else if (trapType === 'unreachable_control') {
      explanation = `Interactive controls in the accessibility tree were unreachable during empirical keyboard traversal.`;
    } else {
      explanation = `Tarjan SCC sink detected with ${scc.length} trapped nodes. Shortest key sequence [${reproducingKeySequence.join(' -> ')}] enters component. Focus cycles indefinitely through [${scc.slice(0, 3).join(', ')}] with zero outgoing transitions to the rest of the document.`;
    }

    return {
      detected: true,
      trapType,
      componentNodeIds: scc,
      entryNodeId,
      reproducingKeySequence,
      keySequence: reproducingKeySequence,
      cycleNodes: scc,
      cycleTransitions,
      testedEscape,
      escapeResult,
      proofExplanation: explanation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Unreachable Controls Detection:
   * Compares interactive CDP AX-tree nodes against visited focus nodes (U = I_AX \ V_reached).
   */
  findUnreachableControls(axNodes: CDPAXNode[]): {
    unreachableNodes: CDPAXNode[];
    findings: UnreachableControlFinding[];
    certificate: TrapCertificate | null;
  } {
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'textbox', 'checkbox', 'radio',
      'combobox', 'listbox', 'menuitem', 'tab', 'slider',
      'switch', 'searchbox', 'spinbutton', 'treeitem', 'gridcell'
    ]);

    const interactiveAX = axNodes.filter(n => {
      if (n.disabled || n.ignored) return false;
      const role = (n.role || '').toLowerCase();
      return n.focusable || INTERACTIVE_ROLES.has(role);
    });

    const reachedNodeIds = new Set(this.nodes.keys());
    const reachedSelectors = new Set(Array.from(this.nodes.values()).map(n => n.selector));
    const reachedBackendIds = new Set(
      Array.from(this.nodes.values())
        .map(n => n.backendDOMNodeId)
        .filter((id): id is number => typeof id === 'number')
    );

    const unreachableNodes: CDPAXNode[] = [];
    const findings: UnreachableControlFinding[] = [];

    for (const axNode of interactiveAX) {
      const axIdMatch = axNode.domNode?.attributes?.id ? `#${axNode.domNode.attributes.id}` : undefined;
      const strippedSelector = axNode.selector ? axNode.selector.replace(/^[a-zA-Z0-9_-]+#/, '#') : undefined;

      const idMatch =
        reachedNodeIds.has(axNode.nodeId) ||
        (axNode.selector && reachedNodeIds.has(axNode.selector)) ||
        (axIdMatch && reachedNodeIds.has(axIdMatch)) ||
        (strippedSelector && reachedNodeIds.has(strippedSelector));

      const selectorMatch =
        (axNode.selector && reachedSelectors.has(axNode.selector)) ||
        (axIdMatch && reachedSelectors.has(axIdMatch)) ||
        (strippedSelector && reachedSelectors.has(strippedSelector));

      const backendMatch =
        typeof axNode.backendDOMNodeId === 'number' && reachedBackendIds.has(axNode.backendDOMNodeId);

      if (!idMatch && !selectorMatch && !backendMatch) {
        unreachableNodes.push(axNode);

        const isNegativeTabIndex =
          axNode.domNode?.attributes?.tabindex === '-1' ||
          axNode.properties?.tabIndex === -1;

        const reason = isNegativeTabIndex
          ? 'negative_tabindex'
          : this.edges.length > 0 && this.evaluateTrapsInternal([]) !== null
          ? 'blocked_by_trap'
          : 'not_in_tab_order';

        findings.push({
          nodeId: axNode.nodeId,
          backendDOMNodeId: axNode.backendDOMNodeId,
          role: axNode.role,
          accessibleName: axNode.name || '',
          selector: axNode.selector || axNode.domNode?.localName || axNode.nodeId,
          reason
        });
      }
    }

    let certificate: TrapCertificate | null = null;
    if (unreachableNodes.length > 0) {
      const unreachedIds = unreachableNodes.map(n => n.selector || n.nodeId);
      certificate = {
        detected: true,
        trapType: 'unreachable_control',
        componentNodeIds: unreachedIds,
        entryNodeId: this.focusOrderList[0]?.id || 'start',
        reproducingKeySequence: ['Tab', 'Tab'],
        keySequence: ['Tab', 'Tab'],
        cycleNodes: [],
        cycleTransitions: [],
        testedEscape: false,
        unreachableNodeCount: unreachableNodes.length,
        unreachableNodeIds: unreachedIds,
        proofExplanation: `Found ${unreachableNodes.length} interactive accessibility tree node(s) absent from all empirical keyboard focus walks. Controls cannot be reached by keyboard-only users.`,
        timestamp: new Date().toISOString()
      };
    }

    return { unreachableNodes, findings, certificate };
  }

  /**
   * Focus Loss Detection:
   * Detects when activeElement falls back to document.body after an action.
   */
  detectFocusLoss(options: {
    beforeActiveElement?: string;
    afterActiveElement?: string;
    triggerKey?: string;
    actionDescription?: string;
  }): FocusLossFinding | null {
    const before = options.beforeActiveElement || '';
    const after = options.afterActiveElement || '';

    if (before && before !== 'body' && (after === 'body' || after === 'none' || after === '')) {
      const finding: FocusLossFinding = {
        detected: true,
        elementBefore: before,
        elementAfter: after || 'body',
        triggerKey: options.triggerKey,
        actionDescription: options.actionDescription || `Action from ${before} dropped focus to document.body`,
        timestamp: new Date().toISOString(),
        proofExplanation: `Focus Loss Violation (WCAG 2.4.3): Keyboard focus dropped from "${before}" to <body>. Users are disoriented and forced to re-traverse the entire document.`
      };
      return finding;
    }

    return null;
  }

  /**
   * Computes Kendall's Tau (tau) Rank Correlation between:
   * 1. The sequential keyboard focus order (empirical Tab traversal index)
   * 2. The 2D visual layout reading order (top-to-bottom, left-to-right bounding box sort)
   * 
   * Uses row grouping tolerance: delta_y_tol = min(15, 0.5 * min(ha, hb))
   * Computes Kendall's tau-b with tie handling.
   * Flags tau < 0.60 as disorienting focus order.
   */
  calculateKendallTau(nodesInFocusOrder?: FocusNode[]): KendallTauMetric {
    const list = nodesInFocusOrder || this.focusOrderList;

    if (list.length < 2) {
      return {
        tau: 1.0,
        focusOrder: list.map(n => n.id),
        visualOrder: list.map(n => n.id),
        inversionCount: 0,
        totalPairs: 0,
        concordantCount: 0,
        discordantCount: 0,
        concordantPairs: 0,
        discordantPairs: 0,
        isAcceptable: true,
        explanation: 'Insufficient nodes to evaluate Kendall Tau'
      };
    }

    const focusOrder = list.map(n => n.id);

    // 2D Visual Reading Order sort with row tolerance
    const visualOrderNodes = [...list].sort((a, b) => {
      const minHeight = Math.min(a.box.height || 20, b.box.height || 20);
      const yTol = Math.min(15, 0.5 * minHeight);
      const yDelta = a.box.y - b.box.y;
      if (Math.abs(yDelta) > yTol) {
        return yDelta;
      }
      return a.box.x - b.box.x;
    });

    const visualOrder = visualOrderNodes.map(n => n.id);

    // Map each node to its rank
    const visualRankMap = new Map<string, number>();
    visualOrder.forEach((id, rank) => visualRankMap.set(id, rank));

    const visualRanks = focusOrder.map(id => visualRankMap.get(id) ?? 0);
    const n = visualRanks.length;
    let concordant = 0;
    let discordant = 0;
    let tiedVisual = 0;
    let tiedTab = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = visualRanks[i] - visualRanks[j];
        const dy = i - j; // Focus traversal indices
        const prod = dx * dy;

        if (prod > 0) {
          concordant++;
        } else if (prod < 0) {
          discordant++;
        } else {
          if (dx === 0 && dy !== 0) tiedVisual++;
          if (dy === 0 && dx !== 0) tiedTab++;
        }
      }
    }

    const totalPairs = (n * (n - 1)) / 2;
    const denominator = Math.sqrt((concordant + discordant + tiedVisual) * (concordant + discordant + tiedTab));
    const tau = denominator > 0 ? (concordant - discordant) / denominator : 1.0;
    const roundedTau = Math.round(tau * 100) / 100;
    const isAcceptable = roundedTau >= 0.6;

    return {
      tau: roundedTau,
      focusOrder,
      visualOrder,
      inversionCount: discordant,
      totalPairs,
      concordantCount: concordant,
      discordantCount: discordant,
      concordantPairs: concordant,
      discordantPairs: discordant,
      isAcceptable,
      explanation: isAcceptable
        ? `Focus sequence matches visual reading layout (Kendall Tau = ${roundedTau}).`
        : `Disorienting focus sequence detected (Kendall Tau = ${roundedTau} < 0.60 threshold). Tabbing jumps across ${discordant} spatial layout inversions.`
    };
  }
}
