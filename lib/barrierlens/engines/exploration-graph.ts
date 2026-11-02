import { CompositeFingerprint, ProductionStateFingerprintEngine } from './state-fingerprint';
import { ActionStep } from '../types';

export interface ExplorationNode {
  id: string;
  fingerprint: CompositeFingerprint;
  depth: number;
  costSoFar: number;        // g(n): steps/keystrokes taken from root
  estimatedDistance: number; // h(n): heuristic estimated distance to milestone goal
  priority: number;         // f(n) = g(n) + h(n)
  visitedCount: number;
  parentStep?: {
    fromNodeId: string;
    action: ActionStep;
  };
  childrenNodeIds: string[];
}

export interface ExplorationEdge {
  fromNodeId: string;
  toNodeId: string;
  action: ActionStep;
  timestamp: number;
}

export class ExplorationStateGraph {
  private nodes: Map<string, ExplorationNode> = new Map();
  private edges: ExplorationEdge[] = [];
  private openFrontier: ExplorationNode[] = [];
  private visitedHashes: Set<string> = new Set();
  private fingerprintEngine = new ProductionStateFingerprintEngine();

  /**
   * Register or merge a newly observed page state
   */
  registerState(
    fingerprint: CompositeFingerprint,
    currentStepCost: number,
    heuristicDistance: number = 1.0,
    parentTransition?: { fromNodeId: string; action: ActionStep }
  ): { node: ExplorationNode; isNewState: boolean; mergedWithNodeId?: string } {
    // 1. Check for exact hash match
    if (this.nodes.has(fingerprint.hash)) {
      const existing = this.nodes.get(fingerprint.hash)!;
      existing.visitedCount++;
      return { node: existing, isNewState: false };
    }

    // 2. Check for soft merge via SimHash / pHash distance
    for (const [id, existing] of this.nodes.entries()) {
      const distance = this.fingerprintEngine.compareStates(fingerprint, existing.fingerprint);
      if (distance.shouldMerge) {
        existing.visitedCount++;
        return { node: existing, isNewState: false, mergedWithNodeId: id };
      }
    }

    // 3. Brand new discrete state
    const priority = currentStepCost + heuristicDistance;
    const newNode: ExplorationNode = {
      id: fingerprint.hash,
      fingerprint,
      depth: parentTransition ? (this.nodes.get(parentTransition.fromNodeId)?.depth || 0) + 1 : 0,
      costSoFar: currentStepCost,
      estimatedDistance: heuristicDistance,
      priority,
      visitedCount: 1,
      parentStep: parentTransition,
      childrenNodeIds: []
    };

    this.nodes.set(newNode.id, newNode);
    this.openFrontier.push(newNode);
    this.sortFrontier();

    if (parentTransition) {
      const parent = this.nodes.get(parentTransition.fromNodeId);
      if (parent && !parent.childrenNodeIds.includes(newNode.id)) {
        parent.childrenNodeIds.push(newNode.id);
      }

      this.edges.push({
        fromNodeId: parentTransition.fromNodeId,
        toNodeId: newNode.id,
        action: parentTransition.action,
        timestamp: Date.now()
      });
    }

    return { node: newNode, isNewState: true };
  }

  /**
   * Best-First Search Frontier selection: returns lowest f(n) unvisited state
   */
  popBestState(): ExplorationNode | null {
    while (this.openFrontier.length > 0) {
      const candidate = this.openFrontier.shift()!;
      if (!this.visitedHashes.has(candidate.id)) {
        this.visitedHashes.add(candidate.id);
        return candidate;
      }
    }
    return null;
  }

  /**
   * Backtracking path recovery: reconstructs the shortest key sequence from root to target node
   */
  reconstructPathToNode(nodeId: string): ActionStep[] {
    const path: ActionStep[] = [];
    let curr = this.nodes.get(nodeId);

    while (curr && curr.parentStep) {
      path.unshift(curr.parentStep.action);
      curr = this.nodes.get(curr.parentStep.fromNodeId);
    }

    return path;
  }

  getGraphSummary(): { totalStates: number; totalTransitions: number; frontierSize: number; maxDepth: number } {
    let maxDepth = 0;
    for (const node of this.nodes.values()) {
      if (node.depth > maxDepth) maxDepth = node.depth;
    }

    return {
      totalStates: this.nodes.size,
      totalTransitions: this.edges.length,
      frontierSize: this.openFrontier.length,
      maxDepth
    };
  }

  private sortFrontier() {
    this.openFrontier.sort((a, b) => a.priority - b.priority);
  }
}
