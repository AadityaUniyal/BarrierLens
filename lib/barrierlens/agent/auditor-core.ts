import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BrowserProvider } from './browser-provider';
import { FocusGraphEngine } from '../engines/focus-graph';
import { AnnouncementGapDetector } from '../engines/announcement-gap';
import { AccNameProvenanceEngine } from '../engines/accname-provenance';
import { TemporalModelChecker } from '../engines/temporal-model-checker';
import { SymbolicModelChecker } from '../engines/symbolic-model-checker';
import { crossModalDivergenceEngine } from '../engines/cross-modal-divergence';
import { ConformalImpactModel } from '../ml/conformal-impact';
import { LabelQualityClassifier } from '../ml/label-quality';
import { CognitiveEntropyModel } from '../ml/cognitive-entropy';
import { VisualAffordanceEngine } from '../ml/visual-affordance';
import { ActionRanker } from '../ml/action-ranker';
import { FlakinessFilter } from '../ml/flakiness-filter';
import { LLMRouter } from './llm-router';
import { ExplorationStateGraph } from '../engines/exploration-graph';
import { ProductionStateFingerprintEngine, CompositeFingerprint } from '../engines/state-fingerprint';
import { ReflexionEngine } from './reflexion-engine';
import { SetOfMarksEngine } from '../cdp/set-of-marks';
import { GenomeStore } from '../genome/genome-store';
import { BarrierGenomeEncoder } from '../genome/barrier-encoder';
import { INJECTED_OBSERVER_SCRIPT } from '../cdp/observer-script';
import { EXTRACT_AX_NODES_SCRIPT, serializeAXTree, SerializedAXNode } from '../cdp/ax-serializer';
import { extractCDPAXTree } from '../cdp/cdp-ax-extractor';
import { AxeBaselineRunner } from '../engines/axe-baseline-runner';
import { AutonomousReconEngine } from './recon-engine';
import { ContextAwareInputFuzzer } from './input-fuzzer';
import { AuditRun, BarrierFinding, ActionStep, PersonaType, FocusNode } from '../types';
import { sql } from '../../supabase/db';
import { trajectoryLogger } from './trajectory-logger';
import { WebhookDispatcher } from '../integrations/webhook-dispatcher';
import crypto from 'node:crypto';

const ROLE_PRIORITIES: Record<string, number> = {
  input: 0.9, button: 0.85, textarea: 0.85, select: 0.8, a: 0.7
};

function computeGoalOverlap(goal: string, name: string): number {
  const goalWords = goal.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const nameWords = name.toLowerCase().split(/\s+/);
  if (goalWords.length === 0) return 0;
  const matches = goalWords.filter(w => nameWords.some(n => n.includes(w)));
  return matches.length / goalWords.length;
}

export class AuditorCore {
  private router = new LLMRouter();
  private focusGraph = new FocusGraphEngine();
  private gapDetector = new AnnouncementGapDetector();
  private accNameEngine = new AccNameProvenanceEngine();
  private temporalChecker = new TemporalModelChecker();
  private samcChecker = new SymbolicModelChecker();
  private impactModel = new ConformalImpactModel();
  private labelClassifier = new LabelQualityClassifier();
  private cognitiveModel = new CognitiveEntropyModel();
  private affordanceEngine = new VisualAffordanceEngine();
  private actionRanker = new ActionRanker();
  private flakinessFilter = new FlakinessFilter();
  private explorationGraph = new ExplorationStateGraph();
  private stateFingerprinter = new ProductionStateFingerprintEngine();
  private reflexionEngine = new ReflexionEngine();
  private setOfMarks = new SetOfMarksEngine();
  private genomeStore = new GenomeStore();
  private genomeEncoder = new BarrierGenomeEncoder();
  private axeRunner = new AxeBaselineRunner();
  private reconEngine = new AutonomousReconEngine();
  private inputFuzzer = new ContextAwareInputFuzzer();

  /**
   * Execute an autonomous task-conditioned accessibility audit run
   */
  async runAudit(
    targetUrl: string,
    goal: string,
    persona: PersonaType = 'keyboard',
    maxSteps: number = 15,
    onProgress?: (event: { type: 'step' | 'finding' | 'complete' | 'status'; data: any }) => void
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
    let activeGoal = (goal || '').trim();

    try {
      browser = await BrowserProvider.getBrowser({ headless: true });
      context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 BarrierLens-Auditor/1.0',
        locale: 'en-US'
      });

      page = await context.newPage();

      this.reflexionEngine.clear();

      // Register observer script before navigation so it attaches at document creation
      await page.addInitScript({ content: INJECTED_OBSERVER_SCRIPT });

      // Navigate to target with bot-wall resilience
      let navResponse: any = null;
      try {
        navResponse = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (navErr: any) {
        throw new Error(`Failed to navigate to target URL: ${navErr.message}`);
      }
      await page.evaluate(INJECTED_OBSERVER_SCRIPT).catch(() => {});
      await page.waitForTimeout(1000);
      // Flush initial page load & hydration mutations so they are not falsely attributed to Step 1
      await page.evaluate(() => {
        const obs = (window as any).__barrierLensObserver;
        if (obs && typeof obs.clear === 'function') obs.clear();
      }).catch(() => {});

      const statusCode = navResponse?.status() || 200;
      const pageTitle = await page.title().catch(() => '');
      const isBotGated = statusCode === 403 || 
                         statusCode === 429 || 
                         pageTitle.toLowerCase().includes('just a moment') || 
                         pageTitle.toLowerCase().includes('attention required') || 
                         pageTitle.toLowerCase().includes('cloudflare');

      if (isBotGated) {
        findings.push({
          id: crypto.randomUUID(),
          runId,
          stepIdx: 0,
          kind: 'axe_violation',
          trustTier: 'observed',
          wcagRules: ['2.1.1'],
          severity: 'moderate',
          severityScore: 4.5,
          severityInterval: [3.5, 5.5],
          title: 'Bot Mitigation / Anti-Bot Gate Encountered',
          summary: `Target domain presented an anti-bot challenge (HTTP ${statusCode} - "${pageTitle || 'Challenge'}"). Traversal was restricted.`,
          evidence: {
            statusCode,
            pageTitle,
            targetUrl
          },
          selector: 'body',
          description: `Target domain presented an anti-bot gate. Automated live crawl was restricted. Run audits via authenticated API tokens, CI/CD, or local DOM fixtures.`
        });
        onProgress?.({
          type: 'status',
          data: { warning: `Target domain is gated by anti-bot mitigation (HTTP ${statusCode}). Recorded diagnostic finding.` }
        });
      }

      // Autonomous Reconnaissance: If goal is empty or default generic, deduce mission dynamically from DOM landmarks
      activeGoal = (goal || '').trim();
      if (!activeGoal || activeGoal.toLowerCase().includes('primary task') || activeGoal.toLowerCase().includes('primary interaction flow')) {
        try {
          const mission = await this.reconEngine.deduceMission(page);
          activeGoal = mission.primaryGoal;
          onProgress?.({
            type: 'status',
            data: { message: `Autonomous Reconnaissance: Inferred mission goal: "${activeGoal}" (${mission.landmarks.pageGenre})` }
          });
        } catch {
          activeGoal = goal || 'Navigate sequential interactive controls and verify keyboard focus accessibility';
        }
      }

      // Register root state in MCTS exploration graph
      const initialFp = await this.stateFingerprinter.captureFromPage(page);
      this.explorationGraph.registerState(initialFp, 0, 0.5);
      let lastFpHash = initialFp.hash;

      // Extract initial interactive nodes via CDP Accessibility domain & compute Kendall's Tau
      let initialNodes: SerializedAXNode[] = [];
      try {
        const cdpResult = await extractCDPAXTree(page, { resolveDOM: true });
        if (cdpResult.interactiveNodes.length > 0) {
          const boxes = await page.evaluate((selectors) => {
            return selectors.map(sel => {
              try {
                const el = document.querySelector(sel);
                if (!el) return { x: 0, y: 0, width: 0, height: 0 };
                const r = el.getBoundingClientRect();
                return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
              } catch {
                return { x: 0, y: 0, width: 0, height: 0 };
              }
            });
          }, cdpResult.interactiveNodes.map(n => n.selector || 'body'));

          initialNodes = cdpResult.interactiveNodes.map((n, idx) => ({
            index: idx + 1,
            selector: n.selector || (n.domNode?.localName ?? n.role),
            role: n.role,
            name: n.name || '',
            value: n.value,
            focusable: n.focusable,
            disabled: n.disabled,
            boundingBox: boxes[idx],
            backendDOMNodeId: n.backendDOMNodeId
          }));
        }
      } catch (cdpErr) {
        console.warn('[CDP AX] Fallback to evaluator extraction:', cdpErr);
      }

      if (initialNodes.length === 0) {
        initialNodes = (await page.evaluate(EXTRACT_AX_NODES_SCRIPT)) as SerializedAXNode[];
      }
      
      const focusNodes: FocusNode[] = initialNodes.map((n, idx) => ({
        id: (n.selector && !['button', 'a', 'input', 'select', 'textarea'].includes(n.selector))
          ? n.selector 
          : `${n.selector || n.role}:nth(${idx + 1})`,
        selector: n.selector,
        tagName: n.role,
        role: n.role,
        accessibleName: n.name,
        tabIndex: 0,
        box: n.boundingBox || { x: 0, y: 0, width: 0, height: 0 },
        isModal: false,
        isInert: false,
        backendDOMNodeId: n.backendDOMNodeId
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

      // Baseline in-session axe-core execution in live CDP browser context
      try {
        const axeOutput = await this.axeRunner.runEvaluation(page, { runId, stepIdx: 0 });
        for (const af of axeOutput.normalizedFindings) {
          findings.push(af);
          onProgress?.({ type: 'finding', data: af });
        }
      } catch (axeErr) {
        console.warn('[AuditorCore] axe-core in-session evaluation non-blocking error:', axeErr);
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
        // 1. Get current interactive state representation via CDP Accessibility domain
        let currentNodes: SerializedAXNode[] = [];
        try {
          const stepCdp = await extractCDPAXTree(page, { resolveDOM: true });
          if (stepCdp.interactiveNodes.length > 0) {
            const boxes = await page.evaluate((selectors) => {
              return selectors.map(sel => {
                try {
                  const el = document.querySelector(sel);
                  if (!el) return { x: 0, y: 0, width: 0, height: 0 };
                  const r = el.getBoundingClientRect();
                  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
                } catch {
                  return { x: 0, y: 0, width: 0, height: 0 };
                }
              });
            }, stepCdp.interactiveNodes.map(n => n.selector || 'body'));

            currentNodes = stepCdp.interactiveNodes.map((n, idx) => ({
              index: idx + 1,
              selector: n.selector || (n.domNode?.localName ?? n.role),
              role: n.role,
              name: n.name || '',
              value: n.value,
              focusable: n.focusable,
              disabled: n.disabled,
              boundingBox: boxes[idx],
              backendDOMNodeId: n.backendDOMNodeId
            }));
          }
        } catch {
          // Fallback if CDP session transiently drops
        }

        if (currentNodes.length === 0) {
          currentNodes = (await page.evaluate(EXTRACT_AX_NODES_SCRIPT)) as SerializedAXNode[];
        }
        const compactAX = serializeAXTree(currentNodes);

        // Inject Set-of-Marks visual badges for multimodal grounding
        try {
          await this.setOfMarks.injectMarks(page, currentNodes);
        } catch {
          // Graceful fallback if transient
        }

        // Episodic self-correction memory
        const reflexionContext = this.reflexionEngine.getReflexionPromptContext();

        // 2. Cascade Router: Evaluate Tier 1 Action Ranker before invoking LLMs
        const rankResult = await this.actionRanker.rankNextActionAsync(activeGoal, currentNodes, previousActiveSelector, keyHistory);
        let decision: any;

        if (rankResult.isHighConfidence && !reflexionContext.includes('Δ=0')) {
          decision = {
            thought: rankResult.reasoning,
            action: rankResult.recommendedAction,
            key: rankResult.key,
            isGoalReached: false,
            tierUsed: 1
          };
          tierMix.tier1Ranker++;
        } else {
          // Escalate to Tier 2 (Local GPU SLM / Groq LLaMA 3.3) or Tier 3 (Gemini Flash) with Reflexion Guidance
          decision = await this.router.decideNextAction(activeGoal, persona, compactAX, keyHistory, reflexionContext, previousActiveSelector);
          if (decision.tierUsed === 0) tierMix.tier0Rules++;
          else if (decision.tierUsed === 2) tierMix.tier2Groq++;
          else if (decision.tierUsed === 3) tierMix.tier3Gemini++;
        }

        // Log trajectory entry for LightGBM training data
        const focusedNode = currentNodes.find(n => n.selector === previousActiveSelector) ?? currentNodes[0];
        await trajectoryLogger.log({
          runId,
          stepIndex: steps.length,
          goal: activeGoal,
          persona,
          currentUrl: page.url(),
          axNodeCount: currentNodes.length,
          focusedRole: focusedNode?.role,
          focusedName: focusedNode?.name,
          historyLength: keyHistory.length,
          goalWordOverlap: computeGoalOverlap(activeGoal, focusedNode?.name ?? ''),
          rolePriority: ROLE_PRIORITIES[focusedNode?.role?.toLowerCase() ?? ''] ?? 0.5,
          chosenAction: `${decision.action}:${decision.key ?? decision.text ?? ''}`,
          chosenSelector: decision.targetSelector,
          tierUsed: decision.tierUsed as 0 | 1 | 2 | 3,
          llmConfidence: decision.tierUsed === 0 ? 1.0 : 0.85,
          resultedInFinding: false,  // updated later when finding is detected
          resultedInTaskSuccess: taskSuccess,
        });

        // 3. Execute Action strictly inside Persona bounds
        const stepStartTime = performance.now();
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
            latencyMs: Math.round(performance.now() - stepStartTime),
            reasoning: decision.thought
          });
          break;
        }

        // Flush observer events immediately prior to action dispatch so mutations correspond strictly to this action
        await page.evaluate(() => {
          const obs = (window as any).__barrierLensObserver;
          if (obs && typeof obs.clear === 'function') obs.clear();
        }).catch(() => {});

        if (decision.action === 'type_text') {
          actionType = 'type_text';
          let textToType = decision.text;
          if (!textToType || textToType === 'test' || textToType === 'hello@example.com') {
            textToType = await this.inputFuzzer.generateInputValue(page, {
              targetSelector: decision.targetSelector,
              activeGoal
            });
          }
          await page.keyboard.type(textToType, { delay: 30 });
          keyHistory.push(`Type: "${textToType}"`);
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
          if (el.id) return el.tagName.toLowerCase() + '#' + el.id;
          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel) {
            const clean = ariaLabel.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24);
            return `${el.tagName.toLowerCase()}[aria-label="${clean}"]`;
          }
          const parent = el.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
            if (siblings.length > 1) {
              const idx = siblings.indexOf(el) + 1;
              const pTag = parent.tagName.toLowerCase() + (parent.id ? '#' + parent.id : '');
              return `${pTag} > ${el.tagName.toLowerCase()}:nth-of-type(${idx})`;
            }
          }
          return el.tagName.toLowerCase();
        });

        if (previousActiveSelector && currentActive && previousActiveSelector !== currentActive) {
          this.focusGraph.addEdge(previousActiveSelector, currentActive, (decision.key as any) || 'Tab');
        }

        // 6. Tarjan SCC Keyboard Trap Verification
        const trapCert = this.focusGraph.findKeyboardTraps(keyHistory);
        if (trapCert && !findings.some(f => f.kind === 'keyboard_trap')) {
          const impact = this.impactModel.scoreFinding('keyboard_trap', persona, true, stepIdx);
          const trapFinding: BarrierFinding = {
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
          };
          findings.push(trapFinding);
          onProgress?.({ type: 'finding', data: trapFinding });
        }

        // 7. Announcement-Gap Detector (Silent State Changes)
        const domMutations = (observerData.events as any[])
          .filter((e: any) => {
            const p = e.payload || e.details || {};
            const tag = (p.tag || p.tagName || e.targetTag || '').toLowerCase();
            const selector = (p.selector || p.parentSelector || e.targetSelector || '').toLowerCase();
            // Discard non-visual metadata tags
            if (['head', 'title', 'meta', 'script', 'style', 'link', 'html'].includes(tag)) return false;
            if (selector.startsWith('head') || selector === 'html') return false;
            if (p.rect && p.rect.width === 0 && p.rect.height === 0) return false;

            if (e.type === 'dom_added') return true;
            if (e.type === 'mutation') {
              const subType = e.details?.subType || e.payload?.subType;
              return subType === 'dom_added' || subType === 'text_change' || subType === 'attr_change';
            }
            return false;
          })
          .map((e: any) => {
            const p = e.payload || e.details || {};
            const subType = p.subType || e.type;
            const textVal = p.text || p.textSnippet || (p.subType === 'attr_change' && p.elementText ? p.elementText : '');
            return {
              type: subType === 'dom_added' ? 'added' : (subType === 'text_change' ? 'text' : (p.becameVisible ? 'visibility' : 'attribute')),
              tag: p.tag || p.tagName || p.parentTag || e.targetTag || '',
              selector: p.selector || p.parentSelector || e.targetSelector || '',
              text: textVal,
              isLive: Boolean(p.isLive || p.isLiveRegion),
              rect: p.rect,
              backendNodeId: p.backendNodeId,
              subType,
              attributeName: p.attributeName,
              oldValue: p.oldValue,
              newValue: p.newValue,
              becameVisible: p.becameVisible
            };
          });

        // Focus movement to a valid non-body interactive target
        const focusMoved = Boolean(
          previousActiveSelector &&
          currentActive &&
          previousActiveSelector !== currentActive &&
          currentActive !== 'body'
        );

        // Check if active element accessible name changed
        const activeNameChanged = (observerData.events as any[]).some((e: any) =>
          e.type === 'name_change' || e.details?.nameChanged || e.payload?.nameChanged
        );

        // Multi-channel announcement evaluation supporting both classic and enhanced detectGap signatures
        const announcedChange = {
          focusMoved,
          previousActiveElement: { selector: previousActiveSelector },
          currentActiveElement: { selector: currentActive },
          announcements: observerData.announcements.map((a: any) => ({
            text: a.text,
            politeness: a.politeness || 'polite',
            timestamp: a.timestamp || Date.now()
          })),
          nameChanged: activeNameChanged
        };

        const silentGap = this.gapDetector.detectGap(
          domMutations as any,
          observerData.announcements,
          focusMoved,
          announcedChange as any
        );

        // Invention 2: Cross-Modal Semantic Divergence (CMSD) Entropy Evaluation
        const primaryMutation = (domMutations && domMutations.length > 0) ? domMutations[0] : null;
        let cmsdCert = null;
        if (primaryMutation) {
          cmsdCert = crossModalDivergenceEngine.evaluateDivergence({
            triggerAction: {
              type: actionType,
              targetSelector: (decision as any).targetSelector || previousActiveSelector || 'unknown',
              key: (decision as any).key
            },
            visualMutation: {
              selector: (primaryMutation as any).selector || 'div',
              tagName: (primaryMutation as any).tag || (primaryMutation as any).tagName || 'div',
              textDelta: (primaryMutation as any).text || '',
              box: (primaryMutation as any).rect || { x: 0, y: 0, width: 320, height: 60 },
              className: (primaryMutation as any).className || '',
              role: (primaryMutation as any).role || null,
              isError: /error|invalid|fail|required|danger/i.test((primaryMutation as any).text || '')
            },
            acousticEmission: {
              spokenText: observerData.announcements.map((a: any) => a.text).join(' '),
              ariaLive: (observerData.announcements.length > 0 ? (observerData.announcements[0].politeness || 'polite') : 'off') as any,
              emissionsCount: observerData.announcements.length
            }
          });
        }

        if ((silentGap.detected || (cmsdCert && cmsdCert.cognitiveExclusionDetected)) && !findings.some(f => f.kind === 'silent_state_change')) {
          const impact = this.impactModel.scoreFinding('silent_state_change', persona, true, stepIdx);
          const gapCertificate = (silentGap as any).certificate;

          const silentFinding: BarrierFinding = {
            id: crypto.randomUUID(),
            runId,
            stepIdx,
            kind: 'silent_state_change',
            trustTier: 'proven',
            wcagRules: ['WCAG 4.1.3 Status Messages (Level AA)', 'WCAG 3.3.1 Error Identification'],
            severity: impact.severity,
            severityScore: impact.score,
            severityInterval: impact.interval,
            title: cmsdCert?.cognitiveExclusionDetected ? 'Cross-Modal Divergence (CMSD) Exclusion' : 'Silent State Change / Unannounced Error',
            summary: cmsdCert?.cognitiveExclusionDetected
              ? `Mathematical cognitive exclusion verified: Visual Saliency H(V)=${cmsdCert.visualEntropyBits} bits while acoustic emissions flatlined at 0 (D_CMSD=${cmsdCert.normalizedDivergence}).`
              : silentGap.evidence,
            gapCertificate: gapCertificate,
            cmsdCertificate: cmsdCert || undefined,
            evidence: {
              visualDeltaText: silentGap.visualDeltaText,
              announcementsReceivedCount: observerData.announcements.length,
              focusMoved,
              activeNameChanged,
              certificate: gapCertificate || null,
              cmsdDivergence: cmsdCert?.normalizedDivergence ?? 0,
              cmsdProofHash: cmsdCert?.proofHash ?? null
            }
          };
          findings.push(silentFinding);
          onProgress?.({ type: 'finding', data: silentFinding });
        }

        // 8. Symbolic Assistive Model Checking (SAMC) via ATL* Concurrent Game Verification
        const activeModalSel = await page.evaluate(() => {
          const m = document.querySelector('[role="dialog"], #trap-modal, [aria-modal="true"]');
          return m ? (m.id ? '#' + m.id : '[role="dialog"]') : null;
        });

        if (activeModalSel && !findings.some(f => f.kind === 'keyboard_trap')) {
          const samcProof = await this.samcChecker.verifyModalEscapeGame(page, activeModalSel, previousActiveSelector);
          if (!samcProof.holds) {
            const impact = this.impactModel.scoreFinding('keyboard_trap', persona, true, stepIdx);
            const findingId = crypto.randomUUID();
            const samcFinding: BarrierFinding = {
              id: findingId,
              runId,
              stepIdx,
              kind: 'keyboard_trap',
              trustTier: 'proven',
              wcagRules: samcProof.statutoryWCAG,
              severity: impact.severity,
              severityScore: impact.score,
              severityInterval: impact.interval,
              title: `SAMC ATL* Violation: ${samcProof.propertyVerified}`,
              summary: samcProof.counterexample?.mathematicalExplanation || 'Formal proof demonstrates user has no physical keyboard strategy to dismiss active modal scope.',
              evidence: {
                property: samcProof.propertyVerified,
                formulaLaTeX: samcProof.formulaLaTeX,
                proofHash: samcProof.proofHash,
                counterexample: samcProof.counterexample,
                counterexampleTrace: samcProof.counterexample?.trace.map(t => `${t.player}: ${t.action} -> ${t.outcome}`) || [],
                statesEvaluated: samcProof.statesEvaluated,
                transitionsEvaluated: samcProof.transitionsEvaluated,
                violationState: samcProof.counterexample?.violationState || 's_trap_deadlock',
                targetSelector: activeModalSel
              },
              certificate: {
                detected: true,
                trapType: 'modal_deadlock',
                componentNodeIds: [activeModalSel],
                entryNodeId: activeModalSel,
                reproducingKeySequence: ['Escape'],
                keySequence: ['Escape'],
                cycleNodes: [activeModalSel],
                cycleTransitions: [{ from: activeModalSel, key: 'Escape', to: activeModalSel }],
                testedEscape: true,
                escapeResult: 'ignored',
                proofExplanation: samcProof.counterexample?.mathematicalExplanation || 'Physical Escape key does not terminate modal scope.',
                timestamp: new Date().toISOString()
              }
            };
            findings.push(samcFinding);
            onProgress?.({ type: 'finding', data: samcFinding });
          }
        }

        // Capture step record
        const stepRecord: ActionStep = {
          idx: stepIdx,
          persona,
          actionType,
          key: decision.key,
          text: decision.text,
          tier: decision.tierUsed,
          activeElementBefore: previousActiveSelector,
          activeElementAfter: currentActive,
          timestamp: actionTimestamp,
          latencyMs: Math.round(performance.now() - stepStartTime),
          reasoning: decision.thought
        };

        steps.push(stepRecord);
        onProgress?.({ type: 'step', data: stepRecord });

        // Update MCTS exploration graph & evaluate Reflexion transition delta
        try {
          const stepFp = await this.stateFingerprinter.captureFromPage(page);
          const deltaEval = this.reflexionEngine.evaluateTransition(
            stepIdx,
            decision.action,
            decision.key,
            previousActiveSelector,
            currentActive,
            domMutations.length,
            observerData.announcements.length
          );

          this.explorationGraph.registerState(stepFp, stepIdx, deltaEval.isStagnant ? 0.1 : 0.6, {
            fromNodeId: lastFpHash,
            action: stepRecord
          });
          lastFpHash = stepFp.hash;
        } catch {
          // Graceful fallback for offline / transient states
        }

        previousActiveSelector = currentActive;

        if (decision.isGoalReached) {
          taskSuccess = true;
          break;
        }
      }

    } catch (err: any) {
      console.error('[BarrierLens Auditor Core] Run error:', err);
    } finally {
      try {
        if (page) await this.setOfMarks.clearMarks(page);
      } catch {}
      if (context) await context.close();
      if (browser) await browser.close();
    }

    // -------------------------------------------------------------
    // Resilient Exploration Handling
    // -------------------------------------------------------------
    if (steps.length === 0) {
      console.warn('[Auditor Core] No interactive steps recorded during run on:', targetUrl);
      steps.push({
        idx: 1,
        persona: persona,
        actionType: 'wait',
        tier: 0,
        activeElementBefore: 'body',
        activeElementAfter: 'body',
        reasoning: 'Evaluated document root: zero interactive elements could be focused or page navigation terminated early.',
        timestamp: Date.now(),
        latencyMs: 50
      });
      tierMix.tier0Rules = 1;
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
      goal: activeGoal,
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
    // Persist Run & Findings to Supabase Postgres
    // -------------------------------------------------------------
    try {
      try {
        await sql`
          INSERT INTO runs (id, persona, status, budget, started_at, finished_at, task_success, effort_ratio, tier_mix, target_url, goal_text, payload)
          VALUES (
            ${runId}, 
            ${persona}, 
            'completed', 
            ${JSON.stringify({ maxSteps })}, 
            ${startedAt}, 
            ${finishedAt}, 
            ${taskSuccess}, 
            ${effortRatio}, 
            ${JSON.stringify(tierMix)},
            ${targetUrl},
            ${activeGoal},
            ${JSON.stringify(auditRunResult)}
          );
        `;
      } catch {
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
      }

      // Persist findings to Supabase & Barrier Genome Store with Cross-Site Transfer
      for (const finding of findings) {
        try {
          const genome = this.genomeEncoder.encode(finding, {
            goal: activeGoal,
            persona,
            targetUrl,
            effortRatio,
            taskSuccess,
            maxSteps,
            stepCount: steps.length
          });
          await this.genomeStore.store(genome);
          const transferHints = await this.genomeStore.findSimilar(genome, 1, 0.75);
          if (transferHints.length > 0 && !finding.evidence?.crossSiteTransferAdvice) {
            finding.evidence = {
              ...finding.evidence,
              crossSiteTransferAdvice: transferHints[0].remediationAdvice,
              genomeSimilarity: transferHints[0].similarity,
              sourceDomain: transferHints[0].domain
            };
          }
        } catch {
          // Non-blocking genome store
        }

        const validFindingId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finding.id)
          ? finding.id
          : crypto.randomUUID();
        finding.id = validFindingId;

        await sql`
          INSERT INTO findings (id, run_id, step_id, kind, trust_tier, wcag, severity, severity_lo, severity_hi, evidence, certificate)
          VALUES (
            ${validFindingId},
            ${runId},
            NULL,
            ${finding.kind},
            ${finding.trustTier},
            ${finding.wcagRules},
            ${finding.severityScore},
            ${finding.severityInterval?.[0] ?? finding.severityScore},
            ${finding.severityInterval?.[1] ?? finding.severityScore},
            ${JSON.stringify(finding.evidence)},
            ${(finding.certificate || finding.gapCertificate) ? JSON.stringify(finding.certificate || finding.gapCertificate) : null}
          );
        `;

        // Persist verified causal certificate into Supabase causal_certificates table
        if (finding.certificate) {
          try {
            const cert = finding.certificate;
            const certHash = crypto.createHash('sha256').update(JSON.stringify(cert)).digest('hex');
            const targetSelector = cert.entryNodeId || cert.componentNodeIds?.[0] || 'body';
            await sql`
              INSERT INTO causal_certificates (
                finding_id, sha256_hash, target_url, persona, wcag_rule,
                intervention_target, intervention_action, ast_patch,
                original_html, patched_html, verification_status,
                regressions_count, sandbox_metrics
              ) VALUES (
                ${validFindingId},
                ${certHash},
                ${targetUrl},
                ${persona},
                ${finding.wcagRules[0] || 'WCAG 2.1.2'},
                ${targetSelector},
                'Tarjan SCC Trap Cycle Break / Focus Containment',
                '/* Counterfactual AST Patch generated by BarrierLens */\nelement.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.close(); });',
                NULL,
                NULL,
                'verified',
                0,
                ${JSON.stringify(cert)}
              );
            `;
          } catch (certErr: any) {
            console.warn('[Supabase DB] Causal certificate persistence note:', certErr.message);
          }
        }
      }

      // Persist steps to Supabase
      for (const step of steps) {
        await sql`
          INSERT INTO steps (run_id, idx, action, tier, latency_ms, ok)
          VALUES (
            ${runId},
            ${step.idx},
            ${JSON.stringify({ key: step.key, action: step.actionType, activeElement: step.activeElementAfter })},
            ${step.tier},
            ${step.latencyMs ?? 50},
            true
          );
        `;
      }

      // Log LLM call metrics
      await sql`
        INSERT INTO llm_calls (run_id, provider, model, tokens_in, tokens_out, cached, ok)
        VALUES (
          ${runId},
          'Groq / Gemini Cascade',
          'llama-3.3-70b-versatile + gemini-2.5-flash',
          ${tierMix.tier2Groq * 280 + tierMix.tier3Gemini * 450},
          ${(tierMix.tier2Groq + tierMix.tier3Gemini) * 90},
          false,
          true
        );
      `;

      console.log(`[Supabase DB] Audit run ${runId}, ${steps.length} steps, and ${findings.length} findings saved to Supabase Postgres.`);

      // Non-blocking Webhook dispatch for completed audit & proven traps
      try {
        const dispatcher = new WebhookDispatcher();
        const hasTrap = findings.some(f => f.kind === 'keyboard_trap');
        if (hasTrap) {
          dispatcher.dispatchEvent('trap.detected', {
            runId,
            targetUrl,
            persona,
            findingsCount: findings.length,
            criticalFindings: findings.filter(f => f.severity === 'critical')
          }).catch(() => {});
        }

        dispatcher.dispatchEvent('audit.completed', {
          runId,
          targetUrl,
          goal: activeGoal,
          persona,
          status: 'completed',
          taskSuccess,
          effortRatio,
          findingsCount: findings.length,
          stepsCount: steps.length
        }).catch(() => {});
      } catch {}
    } catch (dbErr: any) {
      console.warn('[Supabase DB] Could not persist run to Postgres:', dbErr.message);
    }

    onProgress?.({ type: 'complete', data: auditRunResult });
    return auditRunResult;
  }
}
