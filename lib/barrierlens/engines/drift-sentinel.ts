import { sql } from '../../neon/db';

export interface CUSUMResult {
  hasDrift: boolean;
  changePointIndex?: number;
  currentEffortRatio: number;
  baselineEffortRatio: number;
  cumulativeSum: number;
  threshold: number;
  summary: string;
}

/**
 * M7 Flow Drift Sentinel: CUSUM Change-Point Detection on Effort Ratio Time Series
 * Flags when a site's interaction structure degrades or effort jumps significantly.
 */
export class DriftSentinelEngine {
  private targetEffortRatio = 1.4; // Desired baseline target
  private slack = 0.5; // Parameter k (allowance)
  private decisionThreshold = 2.0; // Parameter h (alarm limit)

  detectDrift(history: number[]): CUSUMResult {
    if (history.length < 2) {
      return {
        hasDrift: false,
        currentEffortRatio: history[0] || 1.0,
        baselineEffortRatio: this.targetEffortRatio,
        cumulativeSum: 0,
        threshold: this.decisionThreshold,
        summary: 'Insufficient time-series data for change-point detection.'
      };
    }

    let sPos = 0;
    let changePointIndex = -1;

    for (let i = 0; i < history.length; i++) {
      const val = history[i];
      // Positive CUSUM formula: S_i = max(0, S_{i-1} + (X_i - target - k))
      sPos = Math.max(0, sPos + (val - this.targetEffortRatio - this.slack));

      if (sPos > this.decisionThreshold && changePointIndex === -1) {
        changePointIndex = i;
      }
    }

    const currentVal = history[history.length - 1];
    const hasDrift = sPos > this.decisionThreshold;

    const summary = hasDrift
      ? `CRITICAL DRIFT ALERT: CUSUM cumulative statistic (${Math.round(sPos * 10) / 10}) exceeded threshold (${this.decisionThreshold}) at run #${changePointIndex + 1}. Effort ratio increased to ${currentVal}x.`
      : `Flow stability nominal: CUSUM statistic (${Math.round(sPos * 10) / 10}) within normal bounds.`;

    return {
      hasDrift,
      changePointIndex: changePointIndex !== -1 ? changePointIndex : undefined,
      currentEffortRatio: currentVal,
      baselineEffortRatio: this.targetEffortRatio,
      cumulativeSum: Math.round(sPos * 100) / 100,
      threshold: this.decisionThreshold,
      summary
    };
  }

  async persistDriftAlert(flowId: string | null, score: number, kind = 'effort_ratio_jump') {
    try {
      await sql`
        INSERT INTO drift_alerts (flow_id, kind, score)
        VALUES (${flowId}, ${kind}, ${score})
      `;
    } catch (err: any) {
      console.warn('[Drift Sentinel] Error recording alert:', err.message);
    }
  }
}
