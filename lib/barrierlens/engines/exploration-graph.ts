import { CompositeFingerprint, ProductionStateFingerprintEngine } from './state-fingerprint';
import { ActionStep } from '../types';

export interface MCTSNode {
  id: string;
  fingerprint: CompositeFingerprint;
  depth: number;
  costSoFar: number;          // Steps taken from root
  visits: number;             // N(s)
  totalReward: number;        // W(s)
  meanValue: number;          // Q(s) = W(s) / N(s)
  parentStep?: {
    fromNodeId: string;
    action: ActionStep;
  };
  childrenNodeIds: string[];
  isTerminal: boolean;
  isSinkCycle: boolean;
}

export interface ExplorationEdge {
  fromNodeId: string;
  toNodeId: string;
  action: ActionStep;
  timestamp: number;
}

/**
 * Monte Carlo Tree Search (MCTS) with Upper Confidence Bound for Trees (UCT)
 * and intelligent reverse-backtracking for autonomous accessibility journey exploration.
 */
export class ExplorationStateGraph {
  private nodes: Map<string, MCTSNode> = new Map();
  private edges: ExplorationEdge[] = [];
  private openFrontier: MCTSNode[] = [];
  private visitedHashes: Set<string> = new Set();
  private fingerprintEngine = new ProductionStateFingerprintEngine();
  private rootNodeId: string | null = null;
  private readonly explorationConstant = Math.SQRT2; // c = 1.414

  /**
   * Register or merge a newly observed page state into the MCTS exploration tree
   */
  registerState(
    fingerprint: CompositeFingerprint,
    currentStepCost: number,
    initialReward: number = 0.5,
    parentTransition?: { fromNodeId: string; action: ActionStep }
  ): { node: MCTSNode; isNewState: boolean; mergedWithNodeId?: string } {
    // 1. Check for exact hash match
    if (this.nodes.has(fingerprint.hash)) {
      const existing = this.nodes.get(fingerprint.hash)!;
      existing.visits++;
      this.backpropagate(existing.id, initialReward);
      return { node: existing, isNewState: false };
    }

    // 2. Check for soft merge via SimHash / pHash distance
    for (const [id, existing] of this.nodes.entries()) {
      const distance = this.fingerprintEngine.compareStates(fingerprint, existing.fingerprint);
      if (distance.shouldMerge) {
        existing.visits++;
        this.backpropagate(id, initialReward);
        return { node: existing, isNewState: false, mergedWithNodeId: id };
      }
    }

    // 3. Brand new discrete state
    const newNode: MCTSNode = {
      id: fingerprint.hash,
      fingerprint,
      depth: parentTransition ? (this.nodes.get(parentTransition.fromNodeId)?.depth || 0) + 1 : 0,
      costSoFar: currentStepCost,
      visits: 1,
      totalReward: initialReward,
      meanValue: initialReward,
      parentStep: parentTransition,
      childrenNodeIds: [],
      isTerminal: false,
      isSinkCycle: false
    };

    if (!this.rootNodeId) {
      this.rootNodeId = newNode.id;
    }

    this.nodes.set(newNode.id, newNode);
    this.openFrontier.push(newNode);

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

      // Backpropagate reward up to the root
      this.backpropagate(parentTransition.fromNodeId, initialReward);
    }

    return { node: newNode, isNewState: true };
  }

  /**
   * Calculate Upper Confidence Bound (UCT) score for child selection:
   * UCT(s, a) = Q(s, a) + c * sqrt(ln(N_parent) / N_child)
   */
  calculateUCT(child: MCTSNode, parentVisits: number): number {
    if (child.visits === 0) {
      return Number.POSITIVE_INFINITY; // Always explore unvisited nodes first
    }
    const exploitation = child.meanValue;
    const exploration = this.explorationConstant * Math.sqrt(Math.log(Math.max(1, parentVisits)) / child.visits);
    return exploitation + exploration;
  }

  /**
   * Select best child under MCTS policy
   */
  selectBestChild(parentNodeId: string): MCTSNode | null {
    const parent = this.nodes.get(parentNodeId);
    if (!parent || parent.childrenNodeIds.length === 0) return null;

    let bestChild: MCTSNode | null = null;
    let highestUCT = -Infinity;

    for (const childId of parent.childrenNodeIds) {
      const child = this.nodes.get(childId);
      if (!child || child.isSinkCycle) continue;

      const uct = this.calculateUCT(child, parent.visits);
      if (uct > highestUCT) {
        highestUCT = uct;
        bestChild = child;
      }
    }

    return bestChild;
  }

  /**
   * Backpropagate reward through the ancestor tree to root
   */
  backpropagate(nodeId: string, reward: number) {
    let curr: MCTSNode | undefined = this.nodes.get(nodeId);
    while (curr) {
      curr.visits++;
      curr.totalReward += reward;
      curr.meanValue = curr.totalReward / curr.visits;

      if (curr.parentStep) {
        curr = this.nodes.get(curr.parentStep.fromNodeId);
      } else {
        break;
      }
    }
  }

  /**
   * Mark a node as a sink cycle (e.g., keyboard trap) to prevent future expansion
   */
  markSinkCycle(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.isSinkCycle = true;
      node.meanValue = -1.0;
    }
  }

  /**
   * Compute intelligent backtracking action sequence when agent gets trapped or stagnant.
   * Emits reverse keyboard actions: Shift+Tab or Escape.
   */
  generateBacktrackActions(currentNodeId: string): ActionStep[] {
    const curr = this.nodes.get(currentNodeId);
    if (!curr || !curr.parentStep) {
      return [{
        idx: 0,
        persona: 'keyboard',
        actionType: 'press_key',
        key: 'Escape',
        tier: 0,
        timestamp: Date.now(),
        reasoning: 'MCTS Backtrack: Reached dead-end root. Pressing Escape to dismiss possible active modals.'
      }];
    }

    const parentAction = curr.parentStep.action;
    const backtrackActions: ActionStep[] = [];

    if (parentAction.key === 'Tab') {
      backtrackActions.push({
        idx: 0,
        persona: 'keyboard',
        actionType: 'press_key',
        key: 'Shift+Tab',
        tier: 0,
        timestamp: Date.now(),
        reasoning: 'MCTS Backtrack: Reversing previous forward Tab traversal with Shift+Tab.'
      });
    } else if (parentAction.key === 'Enter' || parentAction.key === 'Space') {
      backtrackActions.push({
        idx: 0,
        persona: 'keyboard',
        actionType: 'press_key',
        key: 'Escape',
        tier: 0,
        timestamp: Date.now(),
        reasoning: 'MCTS Backtrack: Reversing dialog or popup opened by Enter/Space.'
      });
    } else {
      backtrackActions.push({
        idx: 0,
        persona: 'keyboard',
        actionType: 'press_key',
        key: 'Escape',
        tier: 0,
        timestamp: Date.now(),
        reasoning: 'MCTS Backtrack: Discarding stagnant branch state.'
      });
    }

    return backtrackActions;
  }

  /**
   * Reconstruct shortest path from root to any given node
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

  getGraphSummary(): { 
    totalStates: number; 
    totalTransitions: number; 
    maxDepth: number; 
    rootVisits: number;
    highestValue: number;
  } {
    let maxDepth = 0;
    let highestValue = 0;
    for (const node of this.nodes.values()) {
      if (node.depth > maxDepth) maxDepth = node.depth;
      if (node.meanValue > highestValue) highestValue = node.meanValue;
    }

    const root = this.rootNodeId ? this.nodes.get(this.rootNodeId) : null;

    return {
      totalStates: this.nodes.size,
      totalTransitions: this.edges.length,
      maxDepth,
      rootVisits: root ? root.visits : 0,
      highestValue: Math.round(highestValue * 100) / 100
    };
  }
}
