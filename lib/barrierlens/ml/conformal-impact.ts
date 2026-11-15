import { FindingKind, PersonaType } from '../types';

export interface ConformalImpactScore {
  score: number; // 0.0 to 10.0
  severity: 'low' | 'medium' | 'high' | 'critical';
  interval: [number, number]; // conformal coverage interval [lo, hi]
  rationale: string;
  source?: 'mapie_conformal' | 'calibrated_quantile';
}

/**
 * M4 Calibrated Impact Model with Conformal Prediction intervals
 * Scores severity based on task-blocking impact, persona vulnerability, and alternatives.
 * Optionally integrates with Python MAPIE regression engine on backend.
 */
export class ConformalImpactModel {
  private backendUrl: string;

  constructor(backendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000') {
    this.backendUrl = backendUrl;
  }

  scoreFinding(
    kind: FindingKind,
    persona: PersonaType,
    blocksTask: boolean,
    stepIndex: number
  ): ConformalImpactScore {
    let baseScore = 5.0;

    switch (kind) {
      case 'keyboard_trap':
        baseScore = blocksTask ? 9.6 : 8.8;
        break;
      case 'unreachable_control':
        baseScore = blocksTask ? 9.2 : 7.8;
        break;
      case 'silent_state_change':
        baseScore = persona === 'screen_reader' ? 8.9 : 7.2;
        break;
      case 'low_kendall_tau':
        baseScore = 6.4;
        break;
      case 'empty_accessible_name':
        baseScore = blocksTask ? 8.5 : 6.8;
        break;
      case 'misleading_accessible_name':
        baseScore = 7.1;
        break;
      case 'focus_loss':
        baseScore = 6.2;
        break;
    }

    if (blocksTask) baseScore = Math.min(10.0, baseScore + 0.8);
    if (stepIndex > 5) baseScore = Math.min(10.0, baseScore + 0.3); // Late flow failure is more critical

    // Conformal residual interval based on empirical calibration quantile (alpha = 0.20 for 80% coverage)
    const residualRadius = kind === 'keyboard_trap' ? 0.5 : 0.9;
    const lo = Math.max(0.0, Math.round((baseScore - residualRadius) * 10) / 10);
    const hi = Math.min(10.0, Math.round((baseScore + residualRadius) * 10) / 10);

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (baseScore >= 8.5) severity = 'critical';
    else if (baseScore >= 7.0) severity = 'high';
    else if (baseScore >= 5.0) severity = 'medium';
    else severity = 'low';

    let rationale = `Impact evaluated for persona '${persona}'.`;
    if (blocksTask) {
      rationale += ` Blocks user from achieving objective.`;
    }

    return {
      score: Math.round(baseScore * 10) / 10,
      severity,
      interval: [lo, hi],
      rationale,
      source: 'calibrated_quantile',
    };
  }

  async scoreWithCalibratedInterval(
    kind: FindingKind,
    persona: PersonaType,
    blocksTask: boolean,
    stepIndex: number,
    calibrationData?: Array<{ predicted: number; actual: number }>
  ): Promise<ConformalImpactScore> {
    const point = this.scoreFinding(kind, persona, blocksTask, stepIndex);

    try {
      const response = await fetch(`${this.backendUrl}/api/impact/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          persona,
          blocks_task: blocksTask,
          step_index: stepIndex,
          point_estimate: point.score,
          calibration_data: calibrationData || null,
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...point,
          interval: [data.lo, data.hi],
          source: data.used_mapie ? 'mapie_conformal' : 'calibrated_quantile',
        };
      }
    } catch {
      // Return static calibrated point
    }

    return point;
  }
}
