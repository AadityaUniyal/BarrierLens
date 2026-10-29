import { FocusNode, FocusEdge, TrapCertificate, KendallTauMetric } from '../types';

export class FocusGraphEngine {
  private nodes: Map<string, FocusNode> = new Map();
  private adjacency: Map<string, string[]> = new Map();
  private reverseAdjacency: Map<string, string[]> = new Map();
  private edges: FocusEdge[] = [];

  /**
   * Register or retrieve a focus node
   */
  addNode(node: FocusNode): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.adjacency.set(node.id, []);
      this.reverseAdjacency.set(node.id, []);
    }
  }

  /**
   * Add a directed key navigation transition (e.g. Tab from A -> B)
   */
  addEdge(fromId: string, toId: string, key: FocusEdge['key']): void {
    this.edges.push({ fromId, toId, key, timestamp: performance.now() });

    if (!this.adjacency.has(fromId)) this.adjacency.set(fromId, []);
    if (!this.reverseAdjacency.has(toId)) this.reverseAdjacency.set(toId, []);

    if (!this.adjacency.get(fromId)!.includes(toId)) {
      this.adjacency.get(fromId)!.push(toId);
    }
    if (!this.reverseAdjacency.get(toId)!.includes(fromId)) {
      this.reverseAdjacency.get(toId)!.push(toId);
    }
  }

  /**
   * Tarjan's Strongly Connected Components (SCC) algorithm.
   * Finds all strongly connected components in the directed focus graph.
   * If a non-trivial SCC has NO outgoing edges to the rest of the page (and is not an intentional closed modal),
   * it mathematically proves a KEYBOARD TRAP.
   */
  findKeyboardTraps(keyHistory: string[] = []): TrapCertificate | null {
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

    // Check for sink SCCs (trapped components)
    // A sink SCC has internal cycle transitions but NO transition reaching any node outside the SCC
    for (const scc of sccs) {
      if (scc.length >= 2 && scc.length < this.nodes.size) {
        const sccSet = new Set(scc);
        let hasOutgoingEdge = false;

        for (const nodeId of scc) {
          const neighbors = this.adjacency.get(nodeId) || [];
          for (const target of neighbors) {
            if (!sccSet.has(target)) {
              hasOutgoingEdge = true;
              break;
            }
          }
          if (hasOutgoingEdge) break;
        }

        // If no outgoing edge exists, this is a mathematically proven keyboard trap!
        if (!hasOutgoingEdge) {
          const sampleKeySeq = keyHistory.length > 0 ? keyHistory.slice(-8) : ['Tab', 'Tab', 'Tab', 'Shift+Tab'];
          return {
            detected: true,
            trapType: 'sink_scc',
            componentNodeIds: scc,
            keySequence: sampleKeySeq,
            proofExplanation: `Tarjan SCC sink detected with ${scc.length} trapped nodes. Focus cycles infinitely through [${scc.slice(0, 3).join(', ')}...] with no key transition escaping back to the document root.`,
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    return null;
  }

  /**
   * Computes Kendall's Tau (tau) Rank Correlation between:
   * 1. The sequential keyboard focus order (Tab traversal index)
   * 2. The 2D visual layout reading order (top-to-bottom, left-to-right bounding box sort)
   * 
   * A low tau (< 0.6) proves a confusing, disorienting focus order.
   */
  calculateKendallTau(nodesInFocusOrder: FocusNode[]): KendallTauMetric {
    if (nodesInFocusOrder.length < 2) {
      return {
        tau: 1.0,
        focusOrder: nodesInFocusOrder.map(n => n.id),
        visualOrder: nodesInFocusOrder.map(n => n.id),
        inversionCount: 0,
        totalPairs: 0,
        isAcceptable: true,
        explanation: 'Insufficient nodes to evaluate Kendall Tau'
      };
    }

    const focusOrder = nodesInFocusOrder.map(n => n.id);

    // Sort by 2D visual position: y-coord primary, x-coord secondary (reading order)
    const visualOrderNodes = [...nodesInFocusOrder].sort((a, b) => {
      const yDelta = a.box.y - b.box.y;
      if (Math.abs(yDelta) > 15) {
        return yDelta;
      }
      return a.box.x - b.box.x;
    });

    const visualOrder = visualOrderNodes.map(n => n.id);

    // Map each node to its rank in the visual order
    const visualRankMap = new Map<string, number>();
    visualOrder.forEach((id, rank) => visualRankMap.set(id, rank));

    // Count concordant and discordant pairs
    const visualRanks = focusOrder.map(id => visualRankMap.get(id) ?? 0);
    const n = visualRanks.length;
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (visualRanks[i] < visualRanks[j]) {
          concordant++;
        } else if (visualRanks[i] > visualRanks[j]) {
          discordant++;
        }
      }
    }

    const totalPairs = (n * (n - 1)) / 2;
    const tau = totalPairs > 0 ? (concordant - discordant) / totalPairs : 1.0;
    const roundedTau = Math.round(tau * 100) / 100;
    const isAcceptable = roundedTau >= 0.6;

    return {
      tau: roundedTau,
      focusOrder,
      visualOrder,
      inversionCount: discordant,
      totalPairs,
      isAcceptable,
      explanation: isAcceptable
        ? `Focus sequence matches visual reading layout (Kendall Tau = ${roundedTau}).`
        : `Disorienting focus sequence detected (Kendall Tau = ${roundedTau} < 0.60 threshold). Tabbing jumps across ${discordant} spatial layout inversions.`
    };
  }
}
