export interface ReflexionEntry {
  stepIdx: number;
  attemptedAction: string;
  attemptedKey?: string;
  targetElement: string;
  stateDeltaMagnitude: number; // 0.0 = completely unchanged, 1.0 = significant change
  critique: string;
  suggestedRecovery: string;
}

export class ReflexionEngine {
  private memory: ReflexionEntry[] = [];
  private consecutiveNullDeltas = 0;

  /**
   * Evaluate whether the previous action produced meaningful progress or a null delta
   */
  evaluateTransition(
    stepIdx: number,
    action: string,
    key: string | undefined,
    elementBefore: string,
    elementAfter: string,
    domMutationCount: number,
    announcementCount: number
  ): { isStagnant: boolean; entry?: ReflexionEntry } {
    const focusMoved = elementBefore !== elementAfter;
    const hasMutations = domMutationCount > 0;
    const hasAnnouncements = announcementCount > 0;

    // Delta magnitude: 0 = completely frozen
    let delta = 0;
    if (focusMoved) delta += 0.5;
    if (hasMutations) delta += 0.3;
    if (hasAnnouncements) delta += 0.2;

    if (delta === 0) {
      this.consecutiveNullDeltas++;
      let critique = '';
      let suggestedRecovery = '';

      if (key === 'Tab') {
        critique = `Action [Tab] on "${elementBefore}" yielded Δ=0. Focus did not move and no DOM change occurred. Potential focus trap, non-focusable sibling, or missing tabindex.`;
        suggestedRecovery = this.consecutiveNullDeltas >= 2 
          ? 'Execute Escape to dismiss potential invisible overlay or use Shift+Tab to reverse focus.' 
          : 'Attempt Shift+Tab or Space to activate parent container.';
      } else if (key === 'Enter' || key === 'Space') {
        critique = `Action [${key}] on "${elementBefore}" yielded Δ=0. The control did not respond to standard keyboard activation.`;
        suggestedRecovery = 'Check if control requires Tab to focus inner interactive element or if ARIA button role is missing keydown handler.';
      } else {
        critique = `Action [${action}] on "${elementBefore}" produced no perceptible change.`;
        suggestedRecovery = 'Backtrack to previous milestone node in MCTS graph.';
      }

      const entry: ReflexionEntry = {
        stepIdx,
        attemptedAction: action,
        attemptedKey: key,
        targetElement: elementBefore,
        stateDeltaMagnitude: delta,
        critique,
        suggestedRecovery
      };

      this.memory.push(entry);
      return { isStagnant: true, entry };
    }

    // Progress occurred: reset consecutive null counter
    this.consecutiveNullDeltas = 0;
    return { isStagnant: false };
  }

  /**
   * Format recent critiques into a guidance prompt for LLM Router / Action Ranker
   */
  getReflexionPromptContext(): string {
    if (this.memory.length === 0) return '';
    const recent = this.memory.slice(-3);
    const lines = recent.map(r => 
      `- Step ${r.stepIdx}: Attempted [${r.attemptedKey || r.attemptedAction}] on "${r.targetElement}". Critique: ${r.critique} Recommendation: ${r.suggestedRecovery}`
    );
    return `\nEpisodic Self-Correction Memory (Avoid repeating these failures):\n${lines.join('\n')}\n`;
  }

  clear() {
    this.memory = [];
    this.consecutiveNullDeltas = 0;
  }
}
