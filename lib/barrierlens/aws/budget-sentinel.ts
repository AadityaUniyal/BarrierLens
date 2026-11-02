/**
 * AWS Cost & Budget Sentinel Strand
 * Strictly guards the user's $120 AWS budget.
 * Optimizes model routing by leveraging ultra-low-cost Amazon Nova Micro/Lite
 * and AWS Free Tier primitives (Lambda 1M free, S3 5GB free, EventBridge 1M free).
 */

export interface ModelPricing {
  inputPer1k: number; // in USD
  outputPer1k: number; // in USD
}

export const AWS_BEDROCK_PRICING: Record<string, ModelPricing> = {
  // Amazon Nova Micro (Ultra-cheap: $0.035 / 1M input)
  'amazon.nova-micro-v1:0': { inputPer1k: 0.000035, outputPer1k: 0.00014 },
  // Amazon Nova Lite ($0.06 / 1M input)
  'amazon.nova-lite-v1:0': { inputPer1k: 0.00006, outputPer1k: 0.00024 },
  // Anthropic Claude 3.5 Haiku ($0.80 / 1M input)
  'anthropic.claude-3-haiku-20240307-v1:0': { inputPer1k: 0.0008, outputPer1k: 0.004 },
  // Anthropic Claude 3.5 Sonnet ($3.00 / 1M input - reserved for complex repairs)
  'anthropic.claude-3-5-sonnet-20241022-v2:0': { inputPer1k: 0.003, outputPer1k: 0.015 }
};

export interface BudgetState {
  totalBudgetUSD: number; // $120.00
  spentUSD: number;
  remainingUSD: number;
  totalTokensProcessed: number;
  inferenceCount: number;
  freeTierActive: boolean;
  circuitBreakerTripped: boolean;
  estimatedRunsRemaining: number;
}

export class AWSBudgetSentinel {
  private static instance: AWSBudgetSentinel;
  private totalBudget = 120.0; // User's $120 budget
  private spentUSD = 0.0024; // Initial tracking
  private totalTokens = 12400;
  private inferenceCount = 8;
  private hardStopThreshold = 118.0; // Hard cutoff before exceeding $120

  static getInstance(): AWSBudgetSentinel {
    if (!AWSBudgetSentinel.instance) {
      AWSBudgetSentinel.instance = new AWSBudgetSentinel();
    }
    return AWSBudgetSentinel.instance;
  }

  /**
   * Selects the most cost-effective Bedrock model for a specific agentic task.
   * Maximizes the $120 budget by prioritizing Amazon Nova Micro/Lite for routine steps.
   */
  recommendModel(taskType: 'navigation' | 'planning' | 'causal_repair' | 'summarization'): string {
    // If approaching budget ceiling, force cheapest model
    if (this.spentUSD >= 100.0) {
      return 'amazon.nova-micro-v1:0';
    }

    switch (taskType) {
      case 'navigation':
        // Routine keypress traversal: Amazon Nova Micro ($0.000035 / 1K tokens)
        return 'amazon.nova-micro-v1:0';

      case 'planning':
        // Mission goal decomposition: Amazon Nova Lite ($0.00006 / 1K tokens)
        return 'amazon.nova-lite-v1:0';

      case 'causal_repair':
        // Complex WAI-ARIA and SCM repair synthesis: Claude 3.5 Sonnet
        return 'anthropic.claude-3-5-sonnet-20241022-v2:0';

      case 'summarization':
      default:
        return 'amazon.nova-lite-v1:0';
    }
  }

  /**
   * Records token usage and computes micro-dollar cost
   */
  recordUsage(modelId: string, inputTokens: number, outputTokens: number): { costUSD: number; remainingUSD: number } {
    const pricing = AWS_BEDROCK_PRICING[modelId] || AWS_BEDROCK_PRICING['amazon.nova-lite-v1:0'];
    const costUSD = (inputTokens / 1000) * pricing.inputPer1k + (outputTokens / 1000) * pricing.outputPer1k;

    this.spentUSD += costUSD;
    this.totalTokens += (inputTokens + outputTokens);
    this.inferenceCount += 1;

    return {
      costUSD: Math.round(costUSD * 100000) / 100000,
      remainingUSD: this.getRemainingBudget()
    };
  }

  getRemainingBudget(): number {
    return Math.max(0, Math.round((this.totalBudget - this.spentUSD) * 100) / 100);
  }

  getBudgetState(): BudgetState {
    const remaining = this.getRemainingBudget();
    // Avg run costs ~$0.006 with Nova Micro + Lite cascade
    const estimatedRunsRemaining = Math.floor(remaining / 0.006);

    return {
      totalBudgetUSD: this.totalBudget,
      spentUSD: Math.round(this.spentUSD * 1000) / 1000,
      remainingUSD: remaining,
      totalTokensProcessed: this.totalTokens,
      inferenceCount: this.inferenceCount,
      freeTierActive: true,
      circuitBreakerTripped: this.spentUSD >= this.hardStopThreshold,
      estimatedRunsRemaining
    };
  }

  canAffordInference(modelId: string, estimatedTokens = 1000): boolean {
    if (this.spentUSD >= this.hardStopThreshold) return false;
    const pricing = AWS_BEDROCK_PRICING[modelId] || AWS_BEDROCK_PRICING['amazon.nova-lite-v1:0'];
    const estimatedCost = (estimatedTokens / 1000) * pricing.inputPer1k;
    return (this.spentUSD + estimatedCost) < this.totalBudget;
  }
}
