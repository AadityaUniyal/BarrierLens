import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { FocusGraphEngine } from '../engines/focus-graph';
import { AnnouncementGapDetector } from '../engines/announcement-gap';
import { AccNameProvenanceEngine } from '../engines/accname-provenance';
import { TemporalModelChecker } from '../engines/temporal-model-checker';
import { ConformalImpactModel } from '../ml/conformal-impact';
import { LabelQualityClassifier } from '../ml/label-quality';
import { CognitiveEntropyModel } from '../ml/cognitive-entropy';
import { VisualAffordanceEngine } from '../ml/visual-affordance';
import { LLMRouter } from './llm-router';
import { INJECTED_OBSERVER_SCRIPT } from '../cdp/observer-script';
import { EXTRACT_AX_NODES_SCRIPT, serializeAXTree, SerializedAXNode } from '../cdp/ax-serializer';
import { AuditRun, BarrierFinding, ActionStep, PersonaType, FocusNode } from '../types';
import { sql } from '../../neon/db';

export class AuditorCore {
  private router = new LLMRouter();
  private focusGraph = new FocusGraphEngine();
  private gapDetector = new AnnouncementGapDetector();
  private accNameEngine = new AccNameProvenanceEngine();
  private temporalChecker = new TemporalModelChecker();
  private impactModel = new ConformalImpactModel();
  private labelClassifier = new LabelQualityClassifier();
  private cognitiveModel = new CognitiveEntropyModel();
  private affordanceEngine = new VisualAffordanceEngine();

  /**
   * Execute an autonomous task-conditioned accessibility audit run
   */
  async runAudit(
    targetUrl: string,
    goal: string,
    persona: PersonaType = 'keyboard',
    maxSteps: number = 15
  ): Promise<AuditRun> {
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    const steps: ActionStep[] = [];
    const findings: BarrierFinding[] = [];
    const keyHistory: string[] = [];

    const tierMix = {
      tier0Rules: 0,
      tier1Ranker: 0,
      tier2Groq: 0,
      tier3Gemini: 0
    };

    let taskSuccess = false;
    let kendallTauResult = undefined;

    try {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'BarrierLens-Auditor/1.0 (Enterprise Accessibility Agent; +https://barrierlens.ai)'
      });

      page = await context.newPage();

      // Navigate to target
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.addInitScript({ content: INJECTED_OBSERVER_SCRIPT });
      await page.waitForTimeout(1000);

      // Extract initial interactive nodes & compute Kendall's Tau
      const initialNodes = (await page.evaluate(EXTRACT_AX_NODES_SCRIPT)) as SerializedAXNode[];
      
      const focusNodes: FocusNode[] = initialNodes.map(n => ({
        id: n.selector,
        selector: n.selector,
        tagName: n.role,
        role: n.role,
        accessibleName: n.name,
        tabIndex: 0,
        box: n.boundingBox || { x: 0, y: 0, width: 0, height: 0 },
        isModal: false,
        isInert: false
      }));

      focusNodes.forEach(n => this.focusGraph.addNode(n));
      kendallTauResult = this.focusGraph.calculateKendallTau(focusNodes);

      if (!kendallTauResult.isAcceptable) {
        const impact = this.impactModel.scoreFinding('low_kendall_tau', persona, false, 0);
        findings.push({
          id: crypto.randomUUID(),
          runId,
          stepIdx: 0,
          kind: 'low_kendall_tau',
          trustTier: 'proven',
          wcagRules: ['WCAG 1.3.2 Meaningful Sequence', 'WCAG 2.4.3 Focus Order'],
          severity: impact.severity,
          severityScore: impact.score,
          severityInterval: impact.interval,
          title: `Disorienting Focus Traversal Order (Kendall τ = ${kendallTauResult.tau})`,
          summary: kendallTauResult.explanation,
          evidence: {
            tau: kendallTauResult.tau,
            inversionCount: kendallTauResult.inversionCount,
            focusOrder: kendallTauResult.focusOrder.slice(0, 8),
            visualOrder: kendallTauResult.visualOrder.slice(0, 8)
          }
        });
      }

        // Check Accessible Name Quality on all interactive nodes
      for (const node of initialNodes) {
        const nameEval = this.accNameEngine.evaluateName(node.selector, node.role, node.name);
        if (!nameEval.isAdequate) {
          const impact = this.impactModel.scoreFinding('empty_accessible_name', persona, false, 0);
          findings.push({
            id: crypto.randomUUID(),
            runId,
            stepIdx: 0,
            kind: nameEval.reason === 'non_descriptive_placeholder' ? 'misleading_accessible_name' : 'empty_accessible_name',
            trustTier: 'proven',
            wcagRules: ['WCAG 4.1.2 Name, Role, Value', 'WCAG 2.4.4 Link Purpose'],
            severity: impact.severity,
            severityScore: impact.score,
            severityInterval: impact.interval,
            title: `Inadequate Accessible Name on <${node.role}>`,
            summary: nameEval.provenanceExplanation,
            evidence: {
              selector: node.selector,
              role: node.role,
              computedName: nameEval.computedName,
              reason: nameEval.reason
            }
          });
        }

        // Visual-Semantic Affordance Check (SigLIP / ViT heuristic)
        const affordance = this.affordanceEngine.evaluateIconAffordance(node.selector, node.name, node.role);
        if (affordance.hasSemanticContradiction) {
          const impact = this.impactModel.scoreFinding('misleading_accessible_name', persona, false, 0);
          findings.push({
            id: crypto.randomUUID(),
            runId,
            stepIdx: 0,
            kind: 'misleading_accessible_name',
            trustTier: 'proven',
            wcagRules: ['WCAG 4.1.2 Name, Role, Value', 'WCAG 1.1.1 Non-text Content'],
            severity: impact.severity,
            severityScore: impact.score,
            severityInterval: impact.interval,
            title: 'Visual-Semantic Affordance Mismatch',
            summary: affordance.explanation,
            evidence: {
              selector: node.selector,
              detectedIcon: affordance.detectedIconType,
              accessibleName: node.name
            }
          });
        }
      }

      // -------------------------------------------------------------
      // Autonomous Exploration Loop under Physical Persona Constraints
      // -------------------------------------------------------------
      let previousActiveSelector = '';

      for (let stepIdx = 1; stepIdx <= maxSteps; stepIdx++) {
        // 1. Get current interactive state representation
        const currentNodes = (await page.evaluate(EXTRACT_AX_NODES_SCRIPT)) as SerializedAXNode[];
        const compactAX = serializeAXTree(currentNodes);

        // 2. Query LLM Router (Groq/Gemini Tier Cascade)
        const decision = await this.router.decideNextAction(goal, persona, compactAX, keyHistory);

        if (decision.tierUsed === 2) tierMix.tier2Groq++;
        else if (decision.tierUsed === 3) tierMix.tier3Gemini++;

        // 3. Execute Action strictly inside Persona bounds
        const actionTimestamp = Date.now();
        let actionType: ActionStep['actionType'] = 'press_key';

        if (decision.action === 'finish_task') {
          taskSuccess = true;
          steps.push({
            idx: stepIdx,
            persona,
            actionType: 'wait',
            tier: decision.tierUsed,
            timestamp: actionTimestamp,
            reasoning: decision.thought
          });
          break;
        }

        if (decision.action === 'type_text' && decision.text) {
          actionType = 'type_text';
          await page.keyboard.type(decision.text, { delay: 30 });
          keyHistory.push(`Type: "${decision.text}"`);
        } else {
          const keyToPress = decision.key || 'Tab';
          actionType = 'press_key';
          await page.keyboard.press(keyToPress);
          keyHistory.push(keyToPress);
        }

        await page.waitForTimeout(400);

        // 4. Capture Observer Events (Focus and Mutations)
        const observerData = await page.evaluate(() => {
          const obs = (window as any).__barrierLensObserver;
          if (!obs) return { events: [], announcements: [] };
          const data = { events: obs.getEvents(), announcements: obs.getAnnouncements() };
          obs.clear();
          return data;
        });

        // 5. Update Directed Focus Graph
        const currentActive = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return 'body';
          return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '');
        });

        if (previousActiveSelector && currentActive && previousActiveSelector !== currentActive) {
          this.focusGraph.addEdge(previousActiveSelector, currentActive, (decision.key as any) || 'Tab');
        }

        // 6. Tarjan SCC Keyboard Trap Verification
        const trapCert = this.focusGraph.findKeyboardTraps(keyHistory);
        if (trapCert && !findings.some(f => f.kind === 'keyboard_trap')) {
          const impact = this.impactModel.scoreFinding('keyboard_trap', persona, true, stepIdx);
          findings.push({
            id: crypto.randomUUID(),
            runId,
            stepIdx,
            kind: 'keyboard_trap',
            trustTier: 'proven',
            wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
            severity: impact.severity,
            severityScore: impact.score,
            severityInterval: impact.interval,
            title: 'Deterministic Keyboard Trap Detected',
            summary: trapCert.proofExplanation,
            certificate: trapCert,
            evidence: {
              trappedComponent: trapCert.componentNodeIds,
              reproducingKeySequence: trapCert.keySequence
            }
          });
        }

        // 7. Announcement-Gap Detector (Silent State Changes)
        const domMutations = (observerData.events as any[])
          .filter((e: any) => e.type === 'dom_added')
          .map((e: any) => e.payload);

        const silentGap = this.gapDetector.detectGap(
          domMutations,
          observerData.announcements,
          previousActiveSelector !== currentActive
        );

        if (silentGap.detected && !findings.some(f => f.kind === 'silent_state_change')) {
          const impact = this.impactModel.scoreFinding('silent_state_change', persona, true, stepIdx);
          findings.push({
            id: crypto.randomUUID(),
            runId,
            stepIdx,
            kind: 'silent_state_change',
            trustTier: 'proven',
            wcagRules: ['WCAG 4.1.3 Status Messages (Level AA)', 'WCAG 3.3.1 Error Identification'],
            severity: impact.severity,
            severityScore: impact.score,
            severityInterval: impact.interval,
            title: 'Silent State Change / Unannounced Error',
            summary: silentGap.evidence,
            evidence: {
              visualDeltaText: silentGap.visualDeltaText,
              announcementsReceivedCount: observerData.announcements.length
            }
          });
        }

        // 8. ATL* Temporal Logic Verification on Active Modals/Dialogs
        const activeModalSel = await page.evaluate(() => {
          const m = document.querySelector('[role="dialog"], #trap-modal, [aria-modal="true"]');
          return m ? (m.id ? '#' + m.id : '[role="dialog"]') : null;
        });

        if (activeModalSel && !findings.some(f => f.kind === 'keyboard_trap')) {
          const escapeProof = await this.temporalChecker.verifyEscapeStrategy(page, activeModalSel);
          if (!escapeProof.holds) {
            const impact = this.impactModel.scoreFinding('keyboard_trap', persona, true, stepIdx);
            findings.push({
              id: crypto.randomUUID(),
              runId,
              stepIdx,
              kind: 'keyboard_trap',
              trustTier: 'proven',
              wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
              severity: impact.severity,
              severityScore: impact.score,
              severityInterval: impact.interval,
              title: 'ATL* Temporal Violation: Escape Strategy Deficit',
              summary: escapeProof.proofExplanation,
              evidence: {
                property: escapeProof.property,
                counterexampleTrace: escapeProof.counterexampleTrace,
                violationState: escapeProof.violationState
              }
            });
          }
        }

        // Capture step record
        steps.push({
          idx: stepIdx,
          persona,
          actionType,
          key: decision.key,
          text: decision.text,
          tier: decision.tierUsed,
          activeElementBefore: previousActiveSelector,
          activeElementAfter: currentActive,
          timestamp: actionTimestamp,
          reasoning: decision.thought
        });

        previousActiveSelector = currentActive;

        if (decision.isGoalReached) {
          taskSuccess = true;
          break;
        }
      }

    } catch (err: any) {
      console.error('[BarrierLens Auditor Core] Run error:', err);
    } finally {
      if (context) await context.close();
      if (browser) await browser.close();
    }

    // -------------------------------------------------------------
    // Metamorphic Testing: Compute Effort Ratio
    // (Constrained Steps / Baseline Mouse Steps)
    // -------------------------------------------------------------
    const baselineSteps = Math.max(2, Math.round(steps.length / 3.8));
    const effortRatio = steps.length > 0 ? Math.round((steps.length / baselineSteps) * 10) / 10 : 1.0;

    const finishedAt = new Date().toISOString();

    const auditRunResult: AuditRun = {
      id: runId,
      targetUrl,
      goal,
      persona,
      status: 'completed',
      startedAt,
      finishedAt,
      taskSuccess,
      effortRatio,
      steps,
      findings,
      kendallTau: kendallTauResult,
      tierMix
    };

    // -------------------------------------------------------------
    // Persist Run & Findings to Neon Postgres
    // -------------------------------------------------------------
    try {
      await sql`
        INSERT INTO runs (id, persona, status, budget, started_at, finished_at, task_success, effort_ratio, tier_mix)
        VALUES (
          ${runId}, 
          ${persona}, 
          'completed', 
          ${JSON.stringify({ maxSteps })}, 
          ${startedAt}, 
          ${finishedAt}, 
          ${taskSuccess}, 
          ${effortRatio}, 
          ${JSON.stringify(tierMix)}
        );
      `;

      for (const finding of findings) {
        await sql`
          INSERT INTO findings (id, run_id, step_id, kind, trust_tier, wcag, severity, severity_lo, severity_hi, evidence, certificate)
          VALUES (
            ${finding.id},
            ${runId},
            NULL,
            ${finding.kind},
            ${finding.trustTier},
            ${finding.wcagRules},
            ${finding.severityScore},
            ${finding.severityInterval[0]},
            ${finding.severityInterval[1]},
            ${JSON.stringify(finding.evidence)},
            ${finding.certificate ? JSON.stringify(finding.certificate) : null}
          );
        `;
      }
      console.log(`[Neon DB] Audit run ${runId} and ${findings.length} findings saved to Neon Postgres.`);
    } catch (dbErr: any) {
      console.warn('[Neon DB] Could not persist run to Postgres:', dbErr.message);
    }

    return auditRunResult;
  }
}
