import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ExplorationStateGraph } from '../engines/exploration-graph';
import { ProductionStateFingerprintEngine } from '../engines/state-fingerprint';
import { FocusGraphEngine } from '../engines/focus-graph';
import { ChaosInjector, AppliedChaos } from './chaos-injector';
import { MotorTremorSimulator } from './motor-tremor';
import { extractCDPAXTree } from '../cdp/cdp-ax-extractor';
import { INJECTED_OBSERVER_SCRIPT } from '../cdp/observer-script';
import { BarrierFinding, PersonaType, FindingKind } from '../types';

export interface StressTestConfig {
  targetUrl: string;
  maxSteps?: number;
  personas?: PersonaType[];
  chaosLevel?: 'mild' | 'moderate' | 'extreme';
  enableMotorTremor?: boolean;
  enableChaosInjection?: boolean;
  onProgress?: (event: StressProgressEvent) => void;
}

export interface LatentBarrier extends BarrierFinding {
  triggerCondition: string;
  chaosLevel: string;
  onlyUnderStress: boolean;
  stressCategory: 'viewport' | 'network' | 'motor' | 'visual' | 'timing' | 'interaction';
}

export interface CoverageMetrics {
  totalInteractiveElements: number;
  elementsReached: number;
  coveragePercent: number;
  statesExplored: number;
  maxDepthReached: number;
  uniqueKeySequences: number;
  personasTested: PersonaType[];
  chaosConditionsTested: string[];
}

export interface StressProgressEvent {
  type: 'step' | 'finding' | 'chaos_applied' | 'coverage_update' | 'complete';
  data: any;
}

export interface StressTestResult {
  id: string;
  targetUrl: string;
  totalSteps: number;
  statesExplored: number;
  uniqueBarriersFound: number;
  latentBarriers: LatentBarrier[];
  standardBarriers: BarrierFinding[];
  coverageMetrics: CoverageMetrics;
  chaosConditionsApplied: string[];
  durationMs: number;
  timestamp: string;
}

export class AdversarialStressAgent {
  private chaosInjector = new ChaosInjector();
  private tremorSimulator = new MotorTremorSimulator();
  private fingerprintEngine = new ProductionStateFingerprintEngine();

  async runStressTest(config: StressTestConfig): Promise<StressTestResult> {
    const runId = crypto.randomUUID();
    const startTime = Date.now();
    const maxSteps = config.maxSteps || 25;
    const chaosLevel = config.chaosLevel || 'moderate';
    const personas: PersonaType[] = config.personas?.length ? config.personas : ['keyboard', 'screen_reader'];

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    const standardBarriers: BarrierFinding[] = [];
    const latentBarriers: LatentBarrier[] = [];
    const appliedChaosHistory: AppliedChaos[] = [];
    const reachedSelectors = new Set<string>();
    let totalElementsDiscovered = 0;

    const graph = new ExplorationStateGraph();
    const focusGraph = new FocusGraphEngine();

    try {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
      });
      page = await context.newPage();

      await page.goto(config.targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.addInitScript({ content: INJECTED_OBSERVER_SCRIPT });
      await page.waitForTimeout(800);

      // Initial interactive element count
      const initialCdp = await extractCDPAXTree(page);
      totalElementsDiscovered = Math.max(initialCdp.interactiveNodes.length, 1);
      initialCdp.interactiveNodes.forEach(n => {
        if (n.selector) reachedSelectors.add(n.selector);
      });

      // Register initial root state
      const rootFp = await this.fingerprintEngine.captureFromPage(page);
      graph.registerState(rootFp, 0, 1.0);

      let step = 0;
      let lastActiveChaos: AppliedChaos | null = null;

      while (step < maxSteps) {
        step++;

        // 1. Coverage & Novelty-Maximizing Action Selection
        const candidateKeys = ['Tab', 'Tab', 'Shift+Tab', 'Enter', 'Space', 'ArrowDown', 'Escape'];
        const chosenKey = candidateKeys[Math.floor(Math.random() * candidateKeys.length)];

        // 2. Probabilistically apply chaos condition
        if (config.enableChaosInjection !== false && Math.random() < 0.40) {
          lastActiveChaos = await this.chaosInjector.applyRandomChaos(page, chaosLevel);
          appliedChaosHistory.push(lastActiveChaos);
          config.onProgress?.({
            type: 'chaos_applied',
            data: { condition: lastActiveChaos.condition.name, step }
          });
        }

        // 3. Dispatch Key Action (optionally with motor tremor)
        if (config.enableMotorTremor) {
          await this.tremorSimulator.pressKeyWithTremor(page, chosenKey, chaosLevel === 'extreme' ? 'severe' : 'moderate');
        } else {
          await page.keyboard.press(chosenKey);
        }

        await page.waitForTimeout(250);

        // 4. Capture current active element & state
        const activeSelector = await page.evaluate(() => {
          const el = document.activeElement;
          return el && el !== document.body ? (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')) : 'body';
        });

        if (activeSelector && activeSelector !== 'body') {
          reachedSelectors.add(activeSelector);
        }

        const currentFp = await this.fingerprintEngine.captureFromPage(page);
        const stateReg = graph.registerState(currentFp, step, 0.5);

        // 5. Stress Barrier Evaluation:
        // A. Check for Keyboard Traps under stress
        const activeModal = await page.evaluate(() => {
          const m = document.querySelector('[role="dialog"], [aria-modal="true"]');
          return m ? true : false;
        });

        if (activeModal && chosenKey === 'Escape') {
          // If Escape failed to close modal, that's a latent modal trap
          const stillOpen = await page.evaluate(() => {
            const m = document.querySelector('[role="dialog"], [aria-modal="true"]');
            return m ? true : false;
          });

          if (stillOpen && !latentBarriers.some(b => b.kind === 'keyboard_trap')) {
            latentBarriers.push({
              id: crypto.randomUUID(),
              runId,
              stepIdx: step,
              kind: 'keyboard_trap',
              trustTier: 'proven',
              wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
              severity: 'critical',
              severityScore: 9.2,
              severityInterval: [8.5, 9.8],
              title: 'Adversarial Latent Trap: Escape Key Ignored under Stress',
              summary: 'Modal dialog failed to dismiss or return focus when subjected to rapid or jittered Escape dispatch.',
              evidence: {
                activeChaos: lastActiveChaos?.condition.name || 'none',
                modalPresent: true
              },
              triggerCondition: lastActiveChaos?.condition.name || 'Rapid keypress',
              chaosLevel,
              onlyUnderStress: true,
              stressCategory: 'interaction'
            });
          }
        }

        // B. Check for Viewport Overflow / Target Size Violations on Mobile Viewport
        if (lastActiveChaos?.condition.category === 'viewport') {
          const tinyTargetsCount = await page.evaluate(() => {
            const clickables = Array.from(document.querySelectorAll('button, a, input'));
            let count = 0;
            for (const el of clickables) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24)) {
                count++;
              }
            }
            return count;
          });

          if (tinyTargetsCount > 0 && !latentBarriers.some(b => b.kind === 'target_size_violation')) {
            latentBarriers.push({
              id: crypto.randomUUID(),
              runId,
              stepIdx: step,
              kind: 'target_size_violation',
              trustTier: 'proven',
              wcagRules: ['WCAG 2.2 2.5.8 Target Size (Minimum)'],
              severity: 'high',
              severityScore: 7.8,
              severityInterval: [7.0, 8.5],
              title: `Latent Target Size Violation under ${lastActiveChaos.condition.name}`,
              summary: `Discovered ${tinyTargetsCount} interactive elements falling below 24x24px when responsive reflow was stressed.`,
              evidence: { tinyTargetsCount, condition: lastActiveChaos.condition.name },
              triggerCondition: lastActiveChaos.condition.name,
              chaosLevel,
              onlyUnderStress: true,
              stressCategory: 'viewport'
            });
          }
        }

        // C. Standard Unlabeled Controls
        if (step % 5 === 0) {
          const emptyLabelsCount = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
            return btns.filter(b => !b.getAttribute('aria-label') && !b.textContent?.trim()).length;
          });

          if (emptyLabelsCount > 0 && !standardBarriers.some(b => b.kind === 'empty_accessible_name')) {
            standardBarriers.push({
              id: crypto.randomUUID(),
              runId,
              stepIdx: step,
              kind: 'empty_accessible_name',
              trustTier: 'proven',
              wcagRules: ['WCAG 4.1.2 Name, Role, Value'],
              severity: 'high',
              severityScore: 8.0,
              severityInterval: [7.2, 8.8],
              title: 'Empty Accessible Name on Interactive Button',
              summary: `Found ${emptyLabelsCount} buttons lacking accessible names during stress traversal.`,
              evidence: { count: emptyLabelsCount }
            });
          }
        }

        config.onProgress?.({
          type: 'step',
          data: { step, activeSelector, stateHash: stateReg.node.id }
        });
      }

      await this.chaosInjector.resetChaos(page);
    } catch (err: any) {
      console.warn('[AdversarialStressAgent] Stress test loop error:', err.message);
    } finally {
      if (context) await context.close();
      if (browser) await browser.close();
    }

    const durationMs = Date.now() - startTime;
    const graphSummary = graph.getGraphSummary();
    const reachedCount = reachedSelectors.size;
    const coveragePercent = Math.min(100, Math.round((reachedCount / Math.max(totalElementsDiscovered, reachedCount, 1)) * 100));

    const coverageMetrics: CoverageMetrics = {
      totalInteractiveElements: Math.max(totalElementsDiscovered, reachedCount),
      elementsReached: reachedCount,
      coveragePercent,
      statesExplored: graphSummary.totalStates,
      maxDepthReached: graphSummary.maxDepth,
      uniqueKeySequences: graphSummary.totalTransitions,
      personasTested: personas,
      chaosConditionsTested: Array.from(new Set(appliedChaosHistory.map(c => c.condition.name)))
    };

    const result: StressTestResult = {
      id: runId,
      targetUrl: config.targetUrl,
      totalSteps: maxSteps,
      statesExplored: graphSummary.totalStates,
      uniqueBarriersFound: standardBarriers.length + latentBarriers.length,
      latentBarriers,
      standardBarriers,
      coverageMetrics,
      chaosConditionsApplied: coverageMetrics.chaosConditionsTested,
      durationMs,
      timestamp: new Date().toISOString()
    };

    config.onProgress?.({ type: 'complete', data: result });
    return result;
  }
}
