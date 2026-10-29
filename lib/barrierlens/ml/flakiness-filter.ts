import { BarrierFinding, TrustTier } from '../types';

export interface BayesianFlakinessScore {
  findingId: string;
  totalReplays: number;
  successfulReproductions: number;
  priorAlpha: number;
  priorBeta: number;
  posteriorMean: number;
  posteriorVariance: number;
  promotedTier: TrustTier;
  isFlaky: boolean;
  explanation: string;
}

/**
 * M5 Beta-Bernoulli Bayesian Flakiness Filter
 * Models finding reproducibility using conjugate Beta(alpha, beta) distribution.
 * Eliminates false accusations from unstable or dynamic SPAs.
 */
export class FlakinessFilter {
  /**
   * Prior Beta(2, 2) uninformative symmetric prior centered at 0.5
   */
  private alpha0 = 2;
  private beta0 = 2;

  /**
   * Evaluates reproducibility over n replays with k successes.
   * If P(reproducible > 0.75) exceeds 0.85, finding is elevated from 'suspected' to 'observed'.
   */
  evaluateReproducibility(
    findingId: string,
    reproductionsCount: number,
    totalAttempts: number
  ): BayesianFlakinessScore {
    const alpha = this.alpha0 + reproductionsCount;
    const beta = this.beta0 + (totalAttempts - reproductionsCount);

    // Posterior mean: alpha / (alpha + beta)
    const posteriorMean = Math.round((alpha / (alpha + beta)) * 100) / 100;

    // Posterior variance: (alpha * beta) / ((alpha + beta)^2 * (alpha + beta + 1))
    const denom = Math.pow(alpha + beta, 2) * (alpha + beta + 1);
    const posteriorVariance = Math.round(((alpha * beta) / denom) * 1000) / 1000;

    const isFlaky = posteriorMean < 0.60;
    const isObserved = posteriorMean >= 0.75 && totalAttempts >= 2;

    let promotedTier: TrustTier = 'suspected';
    if (isObserved) promotedTier = 'observed';

    return {
      findingId,
      totalReplays: totalAttempts,
      successfulReproductions: reproductionsCount,
      priorAlpha: this.alpha0,
      priorBeta: this.beta0,
      posteriorMean,
      posteriorVariance,
      promotedTier,
      isFlaky,
      explanation: isObserved
        ? `Bayesian filter: Finding promoted to OBSERVED (Posterior reproducibility = ${posteriorMean * 100}%, n=${totalAttempts}).`
        : `Bayesian filter: Flaky or unconfirmed finding retained in SUSPECTED (Posterior reproducibility = ${posteriorMean * 100}%).`
    };
  }
}
