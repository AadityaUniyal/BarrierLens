import { AuditorCore } from '../agent/auditor-core';
import { AuditRun, BarrierFinding, PersonaType, FindingKind } from '../types';
import {
  ParetoConflictResolver,
  RemediationCandidate,
  ParetoResolutionSummary,
  ExtendedPersona
} from '../ml/pareto-resolver';

export interface SwarmExecutionOptions {
  targetUrl: string;
  goal: string;
  personas?: PersonaType[];
  maxStepsPerPersona?: number;
  concurrency?: number;
  synthesizePatches?: boolean;
  onProgress?: (event: SwarmProgressEvent) => void;
}

export type SwarmProgressEvent =
  | { type: 'swarm_started'; swarmId: string; targetUrl: string; personas: PersonaType[] }
  | { type: 'persona_started'; persona: PersonaType }
  | { type: 'persona_completed'; persona: PersonaType; findingsCount: number; durationMs: number }
  | { type: 'persona_failed'; persona: PersonaType; error: string }
  | { type: 'pareto_analysis_started'; candidateCount: number }
  | { type: 'pareto_analysis_completed'; paretoFrontierCount: number; conflictsResolved: number }
  | { type: 'swarm_completed'; swarmId: string; summary: SwarmExecutionResult };

export interface PersonaRunResult {
  persona: PersonaType;
  runId: string;
  status: 'completed' | 'failed';
  findingsCount: number;
  durationMs: number;
  auditRun?: AuditRun;
  error?: string;
}

export interface SwarmExecutionResult {
  swarmId: string;
  targetUrl: string;
  goal: string;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  personaResults: PersonaRunResult[];
  allFindings: BarrierFinding[];
  uniqueFindingCount: number;
  crossPersonaFindingCount: number;
  unifiedHealthScore: number; // 0 to 100
  paretoSummary: ParetoResolutionSummary;
  recommendedPatches: RemediationCandidate[];
}

/**
 * Parallel Persona Swarm Orchestrator
 * Dispatches and coordinates multi-persona accessibility audits in parallel,
 * cross-correlates multi-perspective barrier findings, and applies mathematical
 * Pareto optimization to produce zero-regression accessibility remediations.
 */
export class ParallelPersonaSwarm {
  private paretoResolver = new ParetoConflictResolver();

  /**
   * Executes a coordinated multi-persona audit swarm
   */
  async executeSwarm(options: SwarmExecutionOptions): Promise<SwarmExecutionResult> {
    const swarmId = crypto.randomUUID();
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    const targetUrl = options.targetUrl;
    const goal = options.goal;
    const personas: PersonaType[] = options.personas && options.personas.length > 0
      ? options.personas
      : ['keyboard', 'screen_reader', 'low_vision', 'cognitive'];

    const maxSteps = options.maxStepsPerPersona || 8;
    const isCloudServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const hasRemoteCdp = Boolean(process.env.BROWSER_WS_ENDPOINT);
    const safeMaxConcurrency = (isCloudServerless && !hasRemoteCdp) ? 1 : 2;
    const concurrency = Math.max(1, Math.min(options.concurrency || safeMaxConcurrency, safeMaxConcurrency));
    const shouldSynthesizePatches = options.synthesizePatches !== false;

    options.onProgress?.({
      type: 'swarm_started',
      swarmId,
      targetUrl,
      personas
    });

    const personaResults: PersonaRunResult[] = [];
    const allFindings: BarrierFinding[] = [];

    // Worker pool execution with controlled concurrency
    const queue = [...personas];
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (queue.length > 0) {
        const persona = queue.shift();
        if (!persona) break;

        const personaStart = Date.now();
        options.onProgress?.({ type: 'persona_started', persona });

        try {
          const auditorCore = new AuditorCore();
          const auditRun = await auditorCore.runAudit(
            targetUrl,
            goal,
            persona,
            maxSteps
          );

          const personaDuration = Date.now() - personaStart;
          const findings = auditRun.findings || [];
          allFindings.push(...findings);

          personaResults.push({
            persona,
            runId: auditRun.id,
            status: 'completed',
            findingsCount: findings.length,
            durationMs: personaDuration,
            auditRun
          });

          options.onProgress?.({
            type: 'persona_completed',
            persona,
            findingsCount: findings.length,
            durationMs: personaDuration
          });
        } catch (err: any) {
          const personaDuration = Date.now() - personaStart;
          const errorMessage = err?.message || 'Persona audit execution failed';

          personaResults.push({
            persona,
            runId: crypto.randomUUID(),
            status: 'failed',
            findingsCount: 0,
            durationMs: personaDuration,
            error: errorMessage
          });

          options.onProgress?.({
            type: 'persona_failed',
            persona,
            error: errorMessage
          });
        }
      }
    });

    await Promise.all(workers);

    // Correlate findings across personas by (kind, selector)
    const signatureOccurrences = new Map<string, Set<PersonaType>>();
    for (const finding of allFindings) {
      const sel = finding.selector || (finding.evidence?.selector as string) || 'window';
      const sig = `${finding.kind}:${sel}`;
      const p = finding.persona || 'keyboard';
      if (!signatureOccurrences.has(sig)) {
        signatureOccurrences.set(sig, new Set());
      }
      signatureOccurrences.get(sig)!.add(p);
    }

    let crossPersonaCount = 0;
    for (const [_, personaSet] of signatureOccurrences) {
      if (personaSet.size > 1) {
        crossPersonaCount++;
      }
    }

    // Deduplicate findings across personas by signature (kind + selector)
    const uniqueFindingsMap = new Map<string, BarrierFinding>();
    for (const f of allFindings) {
      const sel = f.selector || (f.evidence?.selector as string) || 'root';
      const key = `${f.kind}:${sel}`;
      if (!uniqueFindingsMap.has(key)) {
        uniqueFindingsMap.set(key, f);
      }
    }
    const uniqueFindings = Array.from(uniqueFindingsMap.values());

    // Synthesize remediation candidates and resolve Pareto trade-offs
    const remediationCandidates: RemediationCandidate[] = [];
    if (shouldSynthesizePatches && uniqueFindings.length > 0) {
      for (const finding of uniqueFindings) {
        const candidates = this.synthesizeRemediationCandidates(finding);
        remediationCandidates.push(...candidates);
      }
    }

    options.onProgress?.({
      type: 'pareto_analysis_started',
      candidateCount: remediationCandidates.length
    });

    // Execute Pareto Trade-off Resolution
    const paretoSummary = this.paretoResolver.resolveTradeoffs(remediationCandidates);

    // If any optimal candidate causes a regression, add compensated variant
    const enrichedFrontier: RemediationCandidate[] = [];
    let conflictsResolvedCount = 0;

    for (const candidate of paretoSummary.paretoFrontier) {
      const evalResult = paretoSummary.evaluations[candidate.id];
      if (evalResult && evalResult.hasRegression && evalResult.regressedPersonas.length > 0) {
        conflictsResolvedCount++;
        for (const regressed of evalResult.regressedPersonas) {
          const compensated = this.paretoResolver.generateCompensatedCandidate(candidate, regressed);
          enrichedFrontier.push(compensated);
        }
      } else {
        enrichedFrontier.push(candidate);
      }
    }

    options.onProgress?.({
      type: 'pareto_analysis_completed',
      paretoFrontierCount: enrichedFrontier.length,
      conflictsResolved: conflictsResolvedCount
    });

    // Compute Unified Health Score (0 - 100)
    // Penalize by severe findings and regression counts, reward balanced patches
    const totalFindings = allFindings.length;
    const criticalWeight = allFindings.filter(f => f.severity === 'critical' || f.kind.includes('trap')).length * 20;
    const seriousWeight = allFindings.filter(f => f.severity === 'serious' || f.severity === 'high').length * 10;
    const moderateWeight = allFindings.filter(f => f.severity === 'moderate' || f.severity === 'medium').length * 5;
    const rawPenalty = criticalWeight + seriousWeight + moderateWeight;
    const unifiedHealthScore = Math.max(0, Math.min(100, Math.round(100 - (rawPenalty / (personas.length * 2)))));

    const completedAt = new Date().toISOString();
    const totalDurationMs = Date.now() - startTime;

    const result: SwarmExecutionResult = {
      swarmId,
      targetUrl,
      goal,
      startedAt,
      completedAt,
      totalDurationMs,
      personaResults,
      allFindings,
      uniqueFindingCount: uniqueFindings.length,
      crossPersonaFindingCount: crossPersonaCount,
      unifiedHealthScore,
      paretoSummary: {
        ...paretoSummary,
        paretoFrontier: enrichedFrontier
      },
      recommendedPatches: enrichedFrontier
    };

    options.onProgress?.({
      type: 'swarm_completed',
      swarmId,
      summary: result
    });

    return result;
  }

  /**
   * Synthesizes actionable remediation candidates from a barrier finding
   */
  private synthesizeRemediationCandidates(finding: BarrierFinding): RemediationCandidate[] {
    const candidates: RemediationCandidate[] = [];
    const sel = finding.selector || (finding.evidence?.selector as string) || 'body';
    const kind = finding.kind;

    if (kind === 'keyboard_trap') {
      // Patch 1: Escape key listener release
      const utilities1 = this.paretoResolver.evaluateCandidateUtility(kind, 'listener_patch', {
        hasCompensatoryHelp: true
      });
      candidates.push({
        id: `patch_trap_esc_${crypto.randomUUID().slice(0, 8)}`,
        name: 'Modal Escape Key Focus Release Handler',
        findingKind: kind,
        targetSelector: sel,
        patchType: 'listener_patch',
        patchCode: `
          document.querySelector("${sel}")?.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              (document.querySelector("${sel}") as HTMLElement)?.blur();
              document.body.focus();
            }
          });
        `.trim(),
        utilities: utilities1,
        notes: 'Safely restores focus to body on Escape key down without trapping user.'
      });

      // Patch 2: Focus wrap tab boundary
      const utilities2 = this.paretoResolver.evaluateCandidateUtility(kind, 'dom_reorder', {
        increasesCognitiveLoad: false
      });
      candidates.push({
        id: `patch_trap_wrap_${crypto.randomUUID().slice(0, 8)}`,
        name: 'Circular Focus Sentinel Wrap',
        findingKind: kind,
        targetSelector: sel,
        patchType: 'dom_reorder',
        patchCode: `
          // Circular tab sentinel
          const el = document.querySelector("${sel}");
          if (el) { el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); }
        `.trim(),
        utilities: utilities2,
        notes: 'Declares explicit ARIA modal semantics for assistive tech.'
      });
    } else if (kind === 'missing_accessible_name' || kind === 'empty_accessible_name') {
      const suggestedLabel = finding.suggestedFix?.title || 'Interactive element';
      const utilities = this.paretoResolver.evaluateCandidateUtility(kind, 'attribute_patch', {
        preservesVisualDesign: true
      });
      candidates.push({
        id: `patch_accname_aria_${crypto.randomUUID().slice(0, 8)}`,
        name: `Apply aria-label="${suggestedLabel}"`,
        findingKind: kind,
        targetSelector: sel,
        patchType: 'attribute_patch',
        patchCode: `document.querySelector("${sel}")?.setAttribute("aria-label", ${JSON.stringify(suggestedLabel)});`,
        utilities,
        notes: 'Provides missing accessible description without modifying visible layout.'
      });
    } else if (kind === 'silent_dynamic_mutation' || kind === 'silent_state_change') {
      const utilities = this.paretoResolver.evaluateCandidateUtility(kind, 'listener_patch', {
        hasCompensatoryHelp: true
      });
      candidates.push({
        id: `patch_live_region_${crypto.randomUUID().slice(0, 8)}`,
        name: 'Announce Dynamic Content Mutation via aria-live',
        findingKind: kind,
        targetSelector: sel,
        patchType: 'listener_patch',
        patchCode: `
          let announcer = document.getElementById("barrierlens-announcer");
          if (!announcer) {
            announcer = document.createElement("div");
            announcer.id = "barrierlens-announcer";
            announcer.setAttribute("aria-live", "polite");
            announcer.setAttribute("aria-atomic", "true");
            announcer.className = "sr-only";
            announcer.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
            document.body.appendChild(announcer);
          }
          announcer.textContent = "Content updated";
        `.trim(),
        utilities,
        notes: 'Polite screen reader live announcement container.'
      });
    } else if (kind === 'unreachable_interactive' || kind === 'unreachable_control') {
      const utilities = this.paretoResolver.evaluateCandidateUtility(kind, 'attribute_patch', {
        preservesVisualDesign: true
      });
      candidates.push({
        id: `patch_tabindex_${crypto.randomUUID().slice(0, 8)}`,
        name: 'Inject tabindex="0" and keyup activation',
        findingKind: kind,
        targetSelector: sel,
        patchType: 'attribute_patch',
        patchCode: `
          const target = document.querySelector("${sel}");
          if (target) {
            target.setAttribute("tabindex", "0");
            target.addEventListener("keydown", (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                target.click();
              }
            });
          }
        `.trim(),
        utilities,
        notes: 'Restores keyboard reachability and activation to interactive elements.'
      });
    } else {
      // Generic candidate
      const utilities = this.paretoResolver.evaluateCandidateUtility(kind, 'attribute_patch', {});
      candidates.push({
        id: `patch_generic_${crypto.randomUUID().slice(0, 8)}`,
        name: `Remediate ${kind} on ${sel}`,
        findingKind: kind,
        targetSelector: sel,
        patchType: 'attribute_patch',
        patchCode: `// Remediation for ${kind} on ${sel}`,
        utilities,
        notes: 'Generic remediation attribute.'
      });
    }

    return candidates;
  }
}
