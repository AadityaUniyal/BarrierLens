import { FindingKind, PersonaType } from '../types';

export type ExtendedPersona = 'keyboard' | 'screen_reader' | 'low_vision' | 'cognitive' | 'mouse_unconstrained';

export interface PersonaUtilityVector {
  keyboard: number;       // -1.0 to +1.0 (Focus flow, traps, Kendall tau)
  screenReader: number;   // -1.0 to +1.0 (Accessible names, aria-live, semantics)
  lowVision: number;      // -1.0 to +1.0 (Contrast, zoom reflow, target size)
  cognitive: number;      // -1.0 to +1.0 (Shannon entropy, step complexity, clarity)
}

export interface RemediationCandidate {
  id: string;
  name: string;
  findingKind: FindingKind;
  targetSelector: string;
  patchCode: string;
  patchType: 'attribute_patch' | 'listener_patch' | 'dom_reorder' | 'style_patch' | 'composite';
  utilities: PersonaUtilityVector;
  notes?: string;
}

export interface ParetoEvaluationResult {
  candidateId: string;
  isParetoOptimal: boolean;
  isDominated: boolean;
  dominatedByCandidateIds: string[];
  aggregateScore: number;
  hasRegression: boolean;
  regressedPersonas: ExtendedPersona[];
  conflictAnalysis: {
    hasConflict: boolean;
    primaryBenefitPersona?: ExtendedPersona;
    primaryRegressedPersona?: ExtendedPersona;
    explanation: string;
  };
  recommendedCompensations: string[];
}

export interface ParetoResolutionSummary {
  totalCandidates: number;
  paretoFrontier: RemediationCandidate[];
  dominatedCandidates: RemediationCandidate[];
  bestBalancedCandidate: RemediationCandidate | null;
  evaluations: Record<string, ParetoEvaluationResult>;
}

/**
 * Multi-Objective Pareto Conflict Resolver
 * Evaluates candidate accessibility repairs across 4 personas to guarantee
 * that fixing a barrier for one user group never regresses another without
 * generating compensatory affordances.
 */
export class ParetoConflictResolver {
  private personaWeights: Record<ExtendedPersona, number> = {
    keyboard: 0.30,
    screen_reader: 0.30,
    low_vision: 0.20,
    cognitive: 0.20,
    mouse_unconstrained: 0.00
  };

  constructor(customWeights?: Partial<Record<ExtendedPersona, number>>) {
    if (customWeights) {
      this.personaWeights = { ...this.personaWeights, ...customWeights };
    }
  }

  /**
   * Computes the 4D Persona Utility Vector for a given repair action
   */
  evaluateCandidateUtility(
    findingKind: FindingKind,
    patchType: RemediationCandidate['patchType'],
    patchDetails: {
      addsAriaLiveAssertive?: boolean;
      addsVerboseText?: boolean;
      reordersDomWithoutFlexMatch?: boolean;
      shrinksTargetSizeBelow44px?: boolean;
      hidesElementVisually?: boolean;
      implementsModalInert?: boolean;
      addsEscKeyListener?: boolean;
      setsCompactAriaLabel?: boolean;
      hasCompensatoryHelp?: boolean;
      preservesVisualDesign?: boolean;
      increasesCognitiveLoad?: boolean;
      [key: string]: any;
    }
  ): PersonaUtilityVector {
    let key = 0.0;
    let sr = 0.0;
    let lv = 0.0;
    let cog = 0.0;

    switch (findingKind) {
      case 'keyboard_trap':
        if (patchDetails.implementsModalInert && patchDetails.addsEscKeyListener) {
          key = 1.0;
          sr = 0.8;
          lv = 0.4;
          cog = 0.7; // Esc works intuitively, modal escape is standard
        } else if (patchDetails.addsEscKeyListener) {
          key = 0.9;
          sr = 0.6;
          lv = 0.3;
          cog = 0.5;
        } else if (patchDetails.hidesElementVisually) {
          key = 0.4;
          sr = 0.2;
          lv = -0.7; // Visual surprise: modal abruptly vanished
          cog = -0.5;
        }
        break;

      case 'silent_state_change':
        if (patchDetails.addsAriaLiveAssertive && patchDetails.addsVerboseText) {
          key = 0.0;
          sr = 0.5;
          lv = 0.0;
          cog = -0.7; // Screen reader cuts off reading, cognitive fatigue
        } else {
          key = 0.1;
          sr = 0.9; // Polite status notification
          lv = 0.2;
          cog = 0.8; // Clean, concise confirmation
        }
        break;

      case 'low_kendall_tau':
        if (patchDetails.reordersDomWithoutFlexMatch) {
          key = 0.8; // DOM matches tab order
          sr = 0.7;
          lv = -0.6; // Visual flow now disagrees with visual presentation
          cog = -0.4;
        } else {
          key = 0.9; // Harmonized DOM and CSS flex order
          sr = 0.9;
          lv = 0.9;
          cog = 0.9;
        }
        break;

      case 'empty_accessible_name':
      case 'misleading_accessible_name':
        if (patchDetails.setsCompactAriaLabel) {
          key = 0.2;
          sr = 0.9;
          lv = 0.1;
          cog = 0.8; // Concise, informative label
        } else if (patchDetails.addsVerboseText) {
          key = 0.0;
          sr = 0.6;
          lv = -0.1;
          cog = -0.5; // Excessive descriptive text slows down cognition
        }
        break;

      case 'target_size_violation':
        if (patchDetails.shrinksTargetSizeBelow44px) {
          key = 0.0;
          sr = 0.0;
          lv = -0.8; // Motor/vision tap penalty
          cog = -0.2;
        } else {
          key = 0.4;
          sr = 0.0;
          lv = 0.9; // Expanded touch target
          cog = 0.4;
        }
        break;

      default:
        key = 0.2;
        sr = 0.2;
        lv = 0.2;
        cog = 0.2;
        break;
    }

    return {
      keyboard: Math.round(key * 100) / 100,
      screenReader: Math.round(sr * 100) / 100,
      lowVision: Math.round(lv * 100) / 100,
      cognitive: Math.round(cog * 100) / 100
    };
  }

  /**
   * Evaluates Pareto Dominance between two candidates.
   * Returns true if candidate A dominates candidate B (A strictly >= B in all dims and > in at least one).
   */
  dominates(a: RemediationCandidate, b: RemediationCandidate): boolean {
    const uA = [a.utilities.keyboard, a.utilities.screenReader, a.utilities.lowVision, a.utilities.cognitive];
    const uB = [b.utilities.keyboard, b.utilities.screenReader, b.utilities.lowVision, b.utilities.cognitive];

    let strictlyBetterInAtLeastOne = false;
    for (let i = 0; i < 4; i++) {
      if (uA[i] < uB[i]) return false; // A is worse in dimension i -> cannot dominate B
      if (uA[i] > uB[i]) strictlyBetterInAtLeastOne = true;
    }
    return strictlyBetterInAtLeastOne;
  }

  /**
   * Computes the weighted scalar utility score
   */
  computeAggregateScore(utils: PersonaUtilityVector): number {
    return (
      utils.keyboard * this.personaWeights.keyboard +
      utils.screenReader * this.personaWeights.screen_reader +
      utils.lowVision * this.personaWeights.low_vision +
      utils.cognitive * this.personaWeights.cognitive
    );
  }

  /**
   * Discovers the Pareto Frontier across all candidates and generates compensatory affordances
   */
  resolveParetoFrontier(candidates: RemediationCandidate[]): ParetoResolutionSummary {
    if (candidates.length === 0) {
      return {
        totalCandidates: 0,
        paretoFrontier: [],
        dominatedCandidates: [],
        bestBalancedCandidate: null,
        evaluations: {}
      };
    }

    const evaluations: Record<string, ParetoEvaluationResult> = {};
    const dominatedSet = new Set<string>();

    // 1. Pairwise dominance check
    for (const candA of candidates) {
      const dominatedBy: string[] = [];
      for (const candB of candidates) {
        if (candA.id === candB.id) continue;
        if (this.dominates(candB, candA)) {
          dominatedBy.push(candB.id);
          dominatedSet.add(candA.id);
        }
      }

      // Check regressions (utility < 0)
      const regressedPersonas: ExtendedPersona[] = [];
      if (candA.utilities.keyboard < 0) regressedPersonas.push('keyboard');
      if (candA.utilities.screenReader < 0) regressedPersonas.push('screen_reader');
      if (candA.utilities.lowVision < 0) regressedPersonas.push('low_vision');
      if (candA.utilities.cognitive < 0) regressedPersonas.push('cognitive');

      const aggregateScore = Math.round(this.computeAggregateScore(candA.utilities) * 1000) / 1000;

      // Conflict analysis & compensations
      const conflictAnalysis = this.analyzeConflict(candA);
      const compensations = this.synthesizeCompensations(candA, regressedPersonas);

      evaluations[candA.id] = {
        candidateId: candA.id,
        isParetoOptimal: dominatedBy.length === 0,
        isDominated: dominatedBy.length > 0,
        dominatedByCandidateIds: dominatedBy,
        aggregateScore,
        hasRegression: regressedPersonas.length > 0,
        regressedPersonas,
        conflictAnalysis,
        recommendedCompensations: compensations
      };
    }

    const paretoFrontier = candidates.filter(c => !dominatedSet.has(c.id));
    const dominatedCandidates = candidates.filter(c => dominatedSet.has(c.id));

    // Determine best balanced candidate (highest aggregate score among Pareto optimal candidates with least regressions)
    const sortedOptimal = [...paretoFrontier].sort((a, b) => {
      const evalA = evaluations[a.id];
      const evalB = evaluations[b.id];
      if (evalA.hasRegression !== evalB.hasRegression) {
        return evalA.hasRegression ? 1 : -1; // Prefer zero regression
      }
      return evalB.aggregateScore - evalA.aggregateScore;
    });

    return {
      totalCandidates: candidates.length,
      paretoFrontier,
      dominatedCandidates,
      bestBalancedCandidate: sortedOptimal[0] || null,
      evaluations
    };
  }

  /**
   * Alias for resolveParetoFrontier for trade-off resolution
   */
  resolveTradeoffs(candidates: RemediationCandidate[]): ParetoResolutionSummary {
    return this.resolveParetoFrontier(candidates);
  }

  private analyzeConflict(candidate: RemediationCandidate): {
    hasConflict: boolean;
    primaryBenefitPersona?: ExtendedPersona;
    primaryRegressedPersona?: ExtendedPersona;
    explanation: string;
  } {
    const u = candidate.utilities;
    const entries: [ExtendedPersona, number][] = [
      ['keyboard', u.keyboard],
      ['screen_reader', u.screenReader],
      ['low_vision', u.lowVision],
      ['cognitive', u.cognitive]
    ];

    entries.sort((a, b) => b[1] - a[1]);
    const best = entries[0];
    const worst = entries[entries.length - 1];

    if (best[1] > 0.3 && worst[1] < 0) {
      return {
        hasConflict: true,
        primaryBenefitPersona: best[0],
        primaryRegressedPersona: worst[0],
        explanation: `Trade-off detected: Fix heavily benefits ${best[0]} (+${best[1]}) but regresses ${worst[0]} (${worst[1]}). Compensatory adjustments required.`
      };
    }

    return {
      hasConflict: false,
      primaryBenefitPersona: best[1] > 0 ? best[0] : undefined,
      explanation: 'No adversarial cross-persona conflict detected.'
    };
  }

  private synthesizeCompensations(candidate: RemediationCandidate, regressions: ExtendedPersona[]): string[] {
    const list: string[] = [];

    for (const reg of regressions) {
      if (reg === 'cognitive') {
        list.push('Switch assertive aria-live to polite, or truncate verbose status messages to <= 8 words.');
      } else if (reg === 'keyboard') {
        list.push('Pair visual CSS element ordering with corresponding DOM order to maintain monotonic Kendall tau traversal.');
      } else if (reg === 'low_vision') {
        list.push('Ensure modal dimming overlays retain minimum 4.5:1 contrast and respect CSS reflow up to 200% zoom.');
      } else if (reg === 'screen_reader') {
        list.push('Avoid hiding elements via aria-hidden="true" unless explicit off-screen accessible alternative is provided.');
      }
    }

    return list;
  }

  /**
   * Generates a compensated remediation candidate that neutralizes persona regression
   */
  generateCompensatedCandidate(candidate: RemediationCandidate, targetRegressedPersona: ExtendedPersona): RemediationCandidate {
    const updatedUtils: PersonaUtilityVector = { ...candidate.utilities };
    let compensationSnippet = '';

    if (targetRegressedPersona === 'cognitive') {
      updatedUtils.cognitive = Math.max(0.2, updatedUtils.cognitive + 0.6);
      compensationSnippet = '\n/* Compensatory fix for cognitive load */\nannouncer.setAttribute("aria-live", "polite");';
    } else if (targetRegressedPersona === 'keyboard') {
      updatedUtils.keyboard = Math.max(0.3, updatedUtils.keyboard + 0.6);
      compensationSnippet = '\n/* Compensatory fix for keyboard flow */\nelement.setAttribute("tabindex", "0");';
    } else if (targetRegressedPersona === 'low_vision') {
      updatedUtils.lowVision = Math.max(0.3, updatedUtils.lowVision + 0.6);
      compensationSnippet = '\n/* Compensatory fix for low-vision contrast */\nelement.style.outline = "2px solid #5e6ad2"; element.style.minWidth = "44px"; element.style.minHeight = "44px";';
    } else if (targetRegressedPersona === 'screen_reader') {
      updatedUtils.screenReader = Math.max(0.3, updatedUtils.screenReader + 0.6);
      compensationSnippet = '\n/* Compensatory fix for assistive tech name */\nelement.setAttribute("aria-label", "Interactive element");';
    }

    return {
      ...candidate,
      id: `${candidate.id}_comp_${targetRegressedPersona}`,
      name: `${candidate.name} (Compensated for ${targetRegressedPersona})`,
      patchCode: `${candidate.patchCode}${compensationSnippet}`,
      utilities: updatedUtils,
      notes: `${candidate.notes || ''} [Compensated for ${targetRegressedPersona} regression]`.trim()
    };
  }
}
