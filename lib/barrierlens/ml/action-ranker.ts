import { SerializedAXNode } from '../cdp/ax-serializer';

export interface ActionRankScore {
  bestNode: SerializedAXNode | null;
  recommendedAction: 'press_key' | 'type_text';
  key: string;
  confidence: number;
  isHighConfidence: boolean;
  featureWeights: {
    semanticMatch: number;
    focusOrderWeight: number;
    rolePriority: number;
  };
  reasoning: string;
}

/**
 * M3 Distilled Action Ranker (Tier 1 Inference)
 * Predicts the next interactive element directly from features, bypassing LLM API calls on routine steps.
 */
export class ActionRanker {
  private rolePriorities: Record<string, number> = {
    input: 0.9,
    button: 0.85,
    a: 0.7,
    select: 0.8,
    textarea: 0.85,
  };

  rankNextAction(
    goal: string,
    nodes: SerializedAXNode[],
    currentFocusSelector: string,
    history: string[]
  ): ActionRankScore {
    if (nodes.length === 0) {
      return {
        bestNode: null,
        recommendedAction: 'press_key',
        key: 'Tab',
        confidence: 0.4,
        isHighConfidence: false,
        featureWeights: { semanticMatch: 0, focusOrderWeight: 0, rolePriority: 0 },
        reasoning: 'No interactive nodes available, default Tab.'
      };
    }

    const goalWords = goal.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestScore = -1;
    let bestCandidate: SerializedAXNode | null = null;
    let bestWeights = { semanticMatch: 0, focusOrderWeight: 0, rolePriority: 0 };

    for (const node of nodes) {
      if (node.disabled) continue;

      // 1. Role priority feature
      const roleWeight = this.rolePriorities[node.role.toLowerCase()] || 0.5;

      // 2. Semantic matching feature
      const nameWords = (node.name || '').toLowerCase().split(/\s+/);
      const matches = goalWords.filter(w => nameWords.some(nw => nw.includes(w)));
      const semanticMatch = goalWords.length > 0 ? matches.length / goalWords.length : 0;

      // 3. Focus distance feature (prefer advancing forward in natural order)
      const currentIndex = nodes.findIndex(n => n.selector === currentFocusSelector);
      const nodeIndex = nodes.findIndex(n => n.selector === node.selector);
      const distance = nodeIndex >= currentIndex ? (nodeIndex - currentIndex) : (nodes.length + nodeIndex - currentIndex);
      const focusOrderWeight = Math.max(0.1, 1.0 - (distance / (nodes.length * 1.5)));

      // Composite Rank Score: w1*semantic + w2*role + w3*focusDistance
      const score = (semanticMatch * 0.5) + (roleWeight * 0.3) + (focusOrderWeight * 0.2);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = node;
        bestWeights = {
          semanticMatch: Math.round(semanticMatch * 100) / 100,
          rolePriority: roleWeight,
          focusOrderWeight: Math.round(focusOrderWeight * 100) / 100
        };
      }
    }

    const roundedConfidence = Math.round(bestScore * 100) / 100;
    const isHighConfidence = roundedConfidence >= 0.78;

    const isCurrentTarget = bestCandidate?.selector === currentFocusSelector;
    let recommendedAction: ActionRankScore['recommendedAction'] = 'press_key';
    let key = 'Tab';

    if (isCurrentTarget) {
      if (bestCandidate?.role === 'input' && !bestCandidate.value) {
        recommendedAction = 'type_text';
        key = 'Enter';
      } else {
        key = 'Enter';
      }
    }

    return {
      bestNode: bestCandidate,
      recommendedAction,
      key,
      confidence: roundedConfidence,
      isHighConfidence,
      featureWeights: bestWeights,
      reasoning: isHighConfidence
        ? `M3 Learned Ranker selected <${bestCandidate?.role} "${bestCandidate?.name}"> with high confidence (${roundedConfidence}). Advancing with ${key}.`
        : `M3 Ranker confidence (${roundedConfidence}) below threshold (0.78). Escalating to LLM Router.`
    };
  }
}
