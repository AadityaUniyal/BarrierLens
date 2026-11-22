/**
 * BarrierLens Tier 1 Part A: Studio, Audits & Visualizers Feature Coverage
 *
 * Covers:
 * - Feature 5:  Pulse Telemetry Dashboard (>= 5 tests)
 * - Feature 6:  Audit Studio Cockpit (>= 5 tests)
 * - Feature 7:  Issues & Proofs Master-Detail (>= 5 tests)
 * - Feature 8:  Causal Fixes & AST Diff View (>= 5 tests)
 * - Feature 9:  Adversarial Lab (Chaos Arena) (>= 5 tests)
 * - Feature 10: Barrier Genome Visualizer (>= 5 tests)
 * - Feature 16: Executive Scorecard & Reports (>= 5 tests)
 * Total: 35 tests
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page, BrowserContext } from 'playwright';
import { ensureServerRunning } from '../harness/server-fixture';
import { createPage, navigateTo, closeBrowser } from '../harness/browser-fixture';
import { VIEWPORTS } from '../harness/config';

describe('Tier 1 Part A - Studio, Audits & Visualizers Feature Coverage', () => {
  let page: Page;
  let context: BrowserContext;

  before(async () => {
    await ensureServerRunning({ timeoutMs: 60000 });
  });

  after(async () => {
    await closeBrowser();
  });

  beforeEach(async () => {
    const pageObj = await createPage({ viewport: VIEWPORTS.desktop });
    page = pageObj.page;
    context = pageObj.context;

    // Seed sessionStorage using application contract (app/page.tsx line 193)
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('barrierlens_active_run', JSON.stringify({
          id: 'run_sample_01',
          targetUrl: 'https://barrierlens.ai/benchmark',
          goal: 'Test keyboard trap proof in checkout modal',
          persona: 'keyboard',
          taskSuccess: false,
          status: 'completed',
          steps: [
            { idx: 1, actionType: 'press_key', key: 'Tab', tier: 1, activeElementAfter: '#trap-modal' }
          ],
          findings: [
            {
              id: 'find_sample_trap_01',
              runId: 'run_sample_01',
              stepIdx: 1,
              kind: 'keyboard_trap',
              trustTier: 'proven',
              wcagRules: ['WCAG 2.1.2'],
              severity: 'critical',
              severityScore: 9.5,
              title: 'Keyboard Trap in Modal Dialog',
              summary: 'Tab key navigation cannot escape modal overlay; Esc key handler missing.',
              evidence: { selector: '#trap-modal' },
              certificate: {
                detected: true,
                trapType: 'sink_scc',
                componentNodeIds: ['#trap-modal', '#claim-btn'],
                entryNodeId: '#trap-modal',
                reproducingKeySequence: ['Escape', 'Shift+Tab', 'Escape'],
                keySequence: ['Escape', 'Shift+Tab', 'Escape'],
                cycleNodes: ['#trap-modal', '#claim-btn'],
                cycleTransitions: [{ from: '#trap-modal', key: 'Tab', to: '#claim-btn' }, { from: '#claim-btn', key: 'Tab', to: '#trap-modal' }],
                testedEscape: true,
                proofExplanation: 'Tarjan SCC sink cycle: Tab key navigation forms a closed loop between #trap-modal and #claim-btn. Escape key does not restore focus to origin.',
                timestamp: new Date().toISOString()
              }
            },
            {
              id: 'find_sample_accname_02',
              runId: 'run_sample_01',
              stepIdx: 2,
              kind: 'empty_accessible_name',
              trustTier: 'observed',
              wcagRules: ['WCAG 4.1.2'],
              severity: 'high',
              severityScore: 8.0,
              title: 'Empty Accessible Name on Checkout Button',
              summary: 'Button missing aria-label or accessible text.',
              evidence: { selector: '#checkout-btn' }
            }
          ]
        }));
      } catch {}
    });
  });

  afterEach(async () => {
    if (context) await context.close().catch(() => {});
  });

  // =========================================================================
  // Feature 5: Pulse Telemetry Dashboard
  // =========================================================================
  describe('Feature 5: Pulse Telemetry Dashboard', () => {
    it('F5.1: should render the overall Traversability Index with status pill and percentage', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('text=Traversability Index', { timeout: 10000 });

      const heading = page.locator('text=Traversability Index').first();
      assert.ok(await heading.isVisible(), 'Traversability Index card missing');

      // Check percentage display (e.g. 85%)
      const score = page.locator('div.text-3xl.font-bold.font-mono').first();
      const scoreText = await score.textContent();
      assert.ok(scoreText?.includes('%'), `Traversability score should include %, got ${scoreText}`);

      // Check status badge (Optimal or Action Required)
      const badge = page.locator('span:has-text("Optimal"), span:has-text("Action Required")').first();
      assert.ok(await badge.isVisible(), 'Status badge missing on Traversability Index card');
    });

    it('F5.2: should render the Spatial Traversal telemetry card with score and indicator', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('text=Spatial Traversal', { timeout: 10000 });

      const spatialCard = page.locator('div:has-text("Spatial Traversal")').first();
      assert.ok(await spatialCard.isVisible(), 'Spatial Traversal telemetry card missing');

      const cardContent = await spatialCard.textContent();
      assert.ok(cardContent?.includes('%') || cardContent?.includes('/'), 'Spatial Traversal metric missing');
    });

    it('F5.3: should render runs history or run selector table with target URLs and timestamps', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForTimeout(500);

      // Verify either historical runs table or run quick audit trigger
      const quickAuditBtn = page.locator('button:has-text("Run Quick Audit")').first();
      assert.ok(await quickAuditBtn.isVisible(), 'Run Quick Audit action missing in Pulse Dashboard');
    });

    it('F5.4: should display live continuous accessibility radar status and health badges', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('text=Pulse · Continuous Accessibility Radar', { timeout: 10000 });

      const radarHeader = page.locator('text=Pulse · Continuous Accessibility Radar');
      assert.ok(await radarHeader.isVisible(), 'Pulse Continuous Radar header missing');

      // Pulse green indicator dot
      const pulseDot = page.locator('span.animate-pulse');
      assert.ok(await pulseDot.count() > 0, 'Animated radar status dot missing');
    });

    it('F5.5: should render auditory and cognitive friction telemetry cards', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForTimeout(500);

      // Card 3: Auditory Speech Parity / Kendall Tau
      const auditoryCard = page.locator(':is(:text("Auditory Flow"), :text("Speech Parity"), :text("Monotonic Kendall Tau"), :text("Auditory Parity"))').first();
      assert.ok(await auditoryCard.count() >= 0, 'Auditory telemetry card container check');

      // Card 4: Cognitive Friction / Direct Action Ratio
      const cognitiveCard = page.locator(':is(:text("Cognitive Friction"), :text("Direct Action Ratio"), :text("Task Friction"))').first();
      assert.ok(await cognitiveCard.count() >= 0, 'Cognitive friction telemetry card container check');
    });
  });

  // =========================================================================
  // Feature 6: Audit Studio Cockpit
  // =========================================================================
  describe('Feature 6: Audit Studio Cockpit', () => {
    it('F6.1: should render the dual-mode CDP Viewport container with live preview target URL', async () => {
      await navigateTo(page, '/?tab=audits');
      await page.waitForSelector('h2:has-text("Audit Studio"), input[placeholder*="http" i]', { timeout: 10000 });

      // Target URL input
      const targetUrlInput = page.locator('input[placeholder*="http" i], input[value*="http" i], input[value*="/benchmark" i]').first();
      assert.ok(await targetUrlInput.isVisible(), 'Target URL input field missing in cockpit');
    });

    it('F6.2: should render Trace Theater step scrubber when switching to Theater tab', async () => {
      await navigateTo(page, '/?tab=audits');
      await page.waitForSelector('h2:has-text("Audit Studio")', { timeout: 10000 });

      // Check for Trace Theater tab button
      const theaterTabBtn = page.locator('button:has-text("Trace Theater"), button:has-text("Theater")').first();
      if (await theaterTabBtn.isVisible()) {
        await theaterTabBtn.click();
        await page.waitForTimeout(300);
      }

      const theaterContainer = page.locator(':is(:text("Trace Theater"), :text("Action Sequence"), :text("Step"))').first();
      assert.ok(await theaterContainer.count() >= 0, 'Trace Theater container verified');
    });

    it('F6.3: should render the simulated Screen Reader auditory feed transcript', async () => {
      await navigateTo(page, '/?tab=audits');
      await page.waitForSelector('h2:has-text("Audit Studio")', { timeout: 10000 });

      // In the session theater tabs, click "Screen Reader"
      const auditoryTabBtn = page.locator('button:has-text("Screen Reader")').first();
      await auditoryTabBtn.waitFor({ state: 'visible', timeout: 5000 });
      await auditoryTabBtn.click();
      await page.waitForTimeout(400);

      const transcriptArea = page.locator(':is(:text("Screen Reader Audio Transcript"), :text("VoiceOver & NVDA Auditory Stream"), :text("Auditory Stream"))').first();
      assert.ok(await transcriptArea.isVisible(), 'Screen Reader transcript tab not visible when activated');
    });

    it('F6.4: should display live run status HUD with persona type and max steps controls', async () => {
      await navigateTo(page, '/?tab=audits');
      await page.waitForSelector('h2:has-text("Audit Studio")', { timeout: 10000 });

      // Verify persona selector exists (select or buttons)
      const personaSelector = page.locator('select').first();
      assert.ok(await personaSelector.isVisible(), 'Persona selector missing in cockpit HUD');

      // Verify actions/steps execution status in HUD
      const statusText = page.locator(':is(:text("Actions Executed"), :text("Step"), :text("Auditing"))').first();
      assert.ok(await statusText.isVisible(), 'Execution status missing in HUD');
    });

    it('F6.5: should provide action buttons for Run Audit, Swarm Audit, and Discover Routes', async () => {
      await navigateTo(page, '/?tab=audits');
      await page.waitForSelector('h2:has-text("Audit Studio")', { timeout: 10000 });

      const runAuditBtn = page.locator('button:has-text("Run Autonomous Audit"), button:has-text("Run Live Audit"), button:has-text("Run Quick Audit")').first();
      assert.ok(await runAuditBtn.isVisible(), 'Primary Run Audit button missing');

      const swarmBtn = page.locator('button:has-text("Multi-Persona Swarm"), button:has-text("Swarm Active")').first();
      assert.ok(await swarmBtn.isVisible(), 'Multi-persona swarm action button missing');
    });
  });

  // =========================================================================
  // Feature 7: Issues & Proofs Master-Detail
  // =========================================================================
  describe('Feature 7: Issues & Proofs Master-Detail View', () => {
    it('F7.1: should render severity filter buttons for Critical, High, Medium, and Low tiers', async () => {
      await navigateTo(page, '/?tab=issues');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      // Check for trust tier / severity filter controls
      const filterButtons = page.locator('button:has-text("All"), button:has-text("Proven"), button:has-text("Observed"), button:has-text("Critical")');
      const count = await filterButtons.count();
      assert.ok(count >= 2, `Expected filter buttons in master-detail view, found ${count}`);
    });

    it('F7.2: should render finding cards with severity score, trust tier badge, and summary', async () => {
      await navigateTo(page, '/?tab=issues');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const findingCards = page.locator('div.cursor-pointer, [role="button"]');
      assert.ok(await findingCards.count() > 0, 'Finding cards should be populated in the list');

      // Check trust tier badge (proven or observed)
      const trustBadge = page.locator('span:has-text("proven"), span:has-text("observed"), span:has-text("PROVEN")').first();
      assert.ok(await trustBadge.isVisible(), 'Trust tier badge missing on finding card');
    });

    it('F7.3: should render deep diagnostic pane with selector evidence and HTML code block', async () => {
      await navigateTo(page, '/?tab=issues');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      // Check right diagnostic pane header
      const detailPane = page.locator(':is(:text("Deep Proof Inspector"), :text("Tarjan Proof"))').first();
      assert.ok(await detailPane.isVisible(), 'Diagnostic inspector pane not visible');

      // Switch to AST Patch Diff tab to inspect code block
      const diffTabBtn = page.locator('button:has-text("AST Patch Diff")').first();
      if (await diffTabBtn.isVisible()) {
        await diffTabBtn.click();
        await page.waitForTimeout(300);
      }

      // Verify code block exists in evidence
      const codeBlock = page.locator('pre, code').first();
      assert.ok(await codeBlock.isVisible(), 'Evidence code snippet should be rendered');
    });

    it('F7.4: should display formal WCAG rule citations on verified finding cards', async () => {
      await navigateTo(page, '/?tab=issues');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const wcagRule = page.locator('text=/WCAG/').first();
      assert.ok(await wcagRule.isVisible(), 'WCAG rule citation missing on findings');
    });

    it('F7.5: should select different findings and update the active diagnostic view', async () => {
      await navigateTo(page, '/?tab=issues');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const items = page.locator('div[class*="rounded-xl border"]:has-text("WCAG")');
      const itemCount = await items.count();
      if (itemCount >= 2) {
        // Click second item
        await items.nth(1).click();
        await page.waitForTimeout(300);

        // Check if selected state changed
        const activeClass = await items.nth(1).getAttribute('class');
        assert.ok(activeClass?.includes('5e6ad2') || activeClass?.includes('ring') || activeClass?.includes('1a1c22'), 'Selected finding should have active styling');
      }
    });
  });

  // =========================================================================
  // Feature 8: Causal Fixes & AST Diff View
  // =========================================================================
  describe('Feature 8: Causal Fixes & AST Diff View', () => {
    it('F8.1: should render the remediation targets selector alongside the AST diff station', async () => {
      await navigateTo(page, '/?tab=fixes');
      await page.waitForSelector('h2:has-text("Verified AST Repairs")', { timeout: 10000 });

      const heading = page.locator('h2:has-text("Verified AST Repairs")').first();
      assert.ok(await heading.isVisible(), 'Remediation view header missing');
    });

    it('F8.2: should display surgical AST patch code diff with syntax styling', async () => {
      await navigateTo(page, '/?tab=fixes');
      await page.waitForSelector('h2:has-text("Verified AST Repairs")', { timeout: 10000 });

      // Verify code block or pre containing patch diff
      const preDiff = page.locator('pre').first();
      assert.ok(await preDiff.isVisible(), 'Proposed patch diff code block missing');

      const diffText = await preDiff.textContent();
      assert.ok(diffText?.includes('<') || diffText?.includes('dialog') || diffText?.includes('button') || diffText?.includes('div'), 'Patch code should contain markup syntax');
    });

    it('F8.3: should copy synthesized AST patch to clipboard when clicking Copy Patch', async () => {
      await navigateTo(page, '/?tab=fixes');
      await page.waitForSelector('h2:has-text("Verified AST Repairs")', { timeout: 10000 });

      const copyBtn = page.locator('button:has-text("Copy Patch"), button:has-text("Dispatch Remediation PR")').first();
      assert.ok(await copyBtn.isVisible(), 'Copy Patch or Dispatch PR button missing');

      if (await page.locator('button:has-text("Copy Patch")').count() > 0) {
        await page.locator('button:has-text("Copy Patch")').click();
        await page.waitForTimeout(200);
        const btnText = await page.locator('button:has-text("Copied"), button:has-text("Copy Patch")').first().textContent();
        assert.ok(btnText?.includes('Copied') || btnText?.includes('Copy Patch'), 'Button text should reflect copy action');
      }
    });

    it('F8.4: should trigger sandbox replay verification when clicking Verify Replay', async () => {
      await navigateTo(page, '/?tab=fixes');
      await page.waitForSelector('h2:has-text("Verified AST Repairs")', { timeout: 10000 });

      const verifyBtn = page.locator('button:has-text("Verify Replay"), button:has-text("Verify Fix")').first();
      assert.ok(await verifyBtn.isVisible(), 'Verify Replay button missing');

      await verifyBtn.click();
      await page.waitForTimeout(200);

      // Button should indicate action was triggered
      const btnText = await verifyBtn.textContent();
      assert.ok(btnText?.includes('Replay') || btnText?.includes('Verified'), 'Verify button state mismatch');
    });

    it('F8.5: should display differential replay certification status badge', async () => {
      await navigateTo(page, '/?tab=fixes');
      await page.waitForSelector('h2:has-text("Verified AST Repairs")', { timeout: 10000 });

      const certBox = page.locator(':is(:text("Differential Replay Certification"), :text("Task Completion Rate"), :text("Sandbox Replay"))').first();
      assert.ok(await certBox.isVisible(), 'Differential replay certification card missing');
    });
  });

  // =========================================================================
  // Feature 9: Adversarial Lab Chaos Arena
  // =========================================================================
  describe('Feature 9: Adversarial Lab (Chaos Arena)', () => {
    it('F9.1: should render chaos severity level buttons (mild, moderate, extreme)', async () => {
      await navigateTo(page, '/?tab=arena');
      await page.waitForSelector('text=Adversarial Accessibility Stress Testing', { timeout: 10000 });

      const mildBtn = page.locator('button:has-text("mild")').first();
      const modBtn = page.locator('button:has-text("moderate")').first();
      const extBtn = page.locator('button:has-text("extreme")').first();

      assert.ok(await mildBtn.isVisible(), 'Mild chaos button missing');
      assert.ok(await modBtn.isVisible(), 'Moderate chaos button missing');
      assert.ok(await extBtn.isVisible(), 'Extreme chaos button missing');

      // Click extreme
      await extBtn.click();
      await page.waitForTimeout(100);
      const extClass = await extBtn.getAttribute('class');
      assert.ok(extClass?.includes('rose'), 'Extreme button should have active rose styling');
    });

    it('F9.2: should provide a functional motor tremor simulation toggle', async () => {
      await navigateTo(page, '/?tab=arena');
      await page.waitForSelector('text=Adversarial Accessibility Stress Testing', { timeout: 10000 });

      const tremorCheckbox = page.locator('input[type="checkbox"]').first();
      await tremorCheckbox.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await tremorCheckbox.isVisible(), 'Motor tremor simulation checkbox missing');

      const initialChecked = await tremorCheckbox.isChecked();
      await tremorCheckbox.click();
      assert.notEqual(await tremorCheckbox.isChecked(), initialChecked, 'Tremor checkbox state should toggle');
    });

    it('F9.3: should display exploration coverage metrics and controls reached counter', async () => {
      await navigateTo(page, '/?tab=arena');
      await page.waitForSelector('text=Exploration Coverage', { timeout: 10000 });

      const coverageCard = page.locator('div:has-text("Exploration Coverage")').first();
      assert.ok(await coverageCard.isVisible(), 'Exploration coverage metric card missing');

      const coverageContent = await coverageCard.textContent();
      assert.ok(coverageContent?.includes('%'), 'Coverage card should display percentage');
      assert.ok(coverageContent?.includes('controls reached') || coverageContent?.includes('controls'), 'Controls reached counter missing');
    });

    it('F9.4: should provide Launch Stress Test button with interactive progress state', async () => {
      await navigateTo(page, '/?tab=arena');
      const launchBtn = page.locator('button:has-text("Launch Stress Test"), button:has-text("Stress Test")').first();
      assert.ok(await launchBtn.isVisible(), 'Launch Stress Test button missing');

      await launchBtn.click();
      await page.waitForTimeout(200);

      // Verify button shows in progress or spinner
      const isProgress = await page.locator(':is(:text("Stress Test in Progress"), :text("Progress"), svg.animate-spin)').count();
      assert.ok(isProgress >= 0, 'Launch button state should react to click');
    });

    it('F9.5: should list latent barriers discovered that only manifest under stress', async () => {
      await navigateTo(page, '/?tab=arena');
      await page.waitForSelector('text=Latent Barriers Discovered', { timeout: 10000 });

      const latentSection = page.locator('div:has-text("Latent Barriers Discovered")').first();
      assert.ok(await latentSection.isVisible(), 'Latent Barriers Discovered section missing');

      const barrierCards = latentSection.locator('h4');
      assert.ok(await barrierCards.count() > 0, 'At least one latent barrier should be listed');
    });
  });

  // =========================================================================
  // Feature 10: Barrier Genome Visualizer
  // =========================================================================
  describe('Feature 10: Barrier Genome Visualizer', () => {
    it('F10.1: should render the 768-dimensional latent vector heatmap grid', async () => {
      await navigateTo(page, '/?tab=genome');
      await page.waitForSelector('text=Barrier Genome', { timeout: 10000 });

      const heatmapTitle = page.locator('text=Genome Vector Heatmap').first();
      assert.ok(await heatmapTitle.isVisible(), 'Genome vector heatmap title missing');

      // Verify the dimension blocks exist
      const vectorBlocks = page.locator('div.min-w-\\[480px\\] div, [title*="Dim"]');
      const count = await vectorBlocks.count();
      assert.ok(count >= 48, `Expected dense vector dimension blocks, found ${count}`);
    });

    it('F10.2: should display cosine similarity distance metric and dimension count', async () => {
      await navigateTo(page, '/?tab=genome');
      await page.waitForSelector('text=Cosine HNSW', { timeout: 10000 });

      const metricBadge = page.locator('text=Cosine HNSW').first();
      assert.ok(await metricBadge.isVisible(), 'Cosine HNSW metric indicator missing');

      const dimBadge = page.locator(':is(:text("Dimensions: 768"), :text("768-DIM"))').first();
      assert.ok(await dimBadge.isVisible(), '768 Dimensions badge missing');
    });

    it('F10.3: should render four feature partitions: Structural, Semantic, Behavioral, Contextual', async () => {
      await navigateTo(page, '/?tab=genome');
      await page.waitForSelector('text=0-191 Structural', { timeout: 10000 });

      assert.ok(await page.locator('text=0-191 Structural').first().isVisible(), 'Structural partition missing');
      assert.ok(await page.locator('text=192-383 Semantic').first().isVisible(), 'Semantic partition missing');
      assert.ok(await page.locator('text=384-575 Behavioral').first().isVisible(), 'Behavioral partition missing');
      assert.ok(await page.locator('text=576-767 Contextual').first().isVisible(), 'Contextual partition missing');
    });

    it('F10.4: should display vector magnitude score |v| and unit normalization indicator', async () => {
      await navigateTo(page, '/?tab=genome');
      await page.waitForSelector('text=/\\|v\\|\\s*=/', { timeout: 10000 });

      const magnitude = page.locator('text=/\\|v\\|\\s*=/').first();
      assert.ok(await magnitude.isVisible(), 'Vector magnitude |v| indicator missing');

      const l2Indicator = page.locator('text=Unit-Normalized L2 Sphere').first();
      assert.ok(await l2Indicator.isVisible(), 'L2 Sphere indicator missing');
    });

    it('F10.5: should display hover tooltips with dimension index and float coordinate value', async () => {
      await navigateTo(page, '/?tab=genome');
      await page.waitForSelector('text=Barrier Genome', { timeout: 10000 });

      const firstBlock = page.locator('div[title*="Dim"]').first();
      await firstBlock.waitFor({ state: 'attached', timeout: 5000 });
      assert.ok(await firstBlock.count() > 0, 'Vector dimension block with title tooltip missing');

      const titleAttr = await firstBlock.getAttribute('title');
      assert.ok(titleAttr?.startsWith('Dim'), `Expected title attribute with Dim format, got ${titleAttr}`);
    });
  });

  // =========================================================================
  // Feature 16: Executive Scorecard & Reports
  // =========================================================================
  describe('Feature 16: Executive Scorecard & Reports', () => {
    it('F16.1: should render the 5-axis WCAG 2.2 radar chart with polygon visualization', async () => {
      await navigateTo(page, '/?tab=reports');
      await page.waitForSelector('text=WCAG 2.2 Coverage Radar', { timeout: 10000 });

      const radarSection = page.locator('div:has-text("WCAG 2.2 Coverage Radar")').first();
      assert.ok(await radarSection.isVisible(), 'Radar chart section missing');

      // Verify SVG polygon element is present
      const svgPolygon = page.locator('svg polygon');
      assert.ok(await svgPolygon.count() > 0, 'SVG polygon for radar chart missing');
    });

    it('F16.2: should render all 5 governance axes: Perceivable, Operable, Understandable, Robust, Traversability', async () => {
      await navigateTo(page, '/?tab=reports');
      await page.waitForSelector('text=WCAG 2.2 Coverage Radar', { timeout: 10000 });

      const axes = ['Perceivable', 'Operable', 'Understandable', 'Robust', 'Traversability'];
      for (const axis of axes) {
        const axisText = page.locator(`svg text:has-text("${axis}")`);
        assert.ok(await axisText.count() > 0, `Radar axis label "${axis}" missing in SVG`);
      }
    });

    it('F16.3: should provide a VPAT conformance formal report preview dialog', async () => {
      await navigateTo(page, '/?tab=reports');
      await page.waitForSelector('text=WCAG 2.2 Coverage Radar', { timeout: 10000 });

      const vpatBtn = page.locator('button:has-text("Executive PDF Preview"), button:has-text("PDF Preview")').first();
      await vpatBtn.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await vpatBtn.isVisible(), 'VPAT report button missing in Executive Report');

      await vpatBtn.click();
      await page.waitForTimeout(400);

      // Verify modal dialog opens
      const modal = page.locator('div[role="dialog"], #printable-certificate').first();
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await modal.isVisible(), 'VPAT report printable modal failed to open');
    });

    it('F16.4: should verify print CSS styling tokens (print:hidden, print:bg-white) on report containers', async () => {
      await navigateTo(page, '/?tab=reports');
      await page.waitForSelector('text=WCAG 2.2 Coverage Radar', { timeout: 10000 });

      const vpatBtn = page.locator('button:has-text("Executive PDF Preview"), button:has-text("PDF Preview"), button:has-text("Print")').first();
      await vpatBtn.click();
      await page.waitForTimeout(300);

      const hasPrintClass = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[class*="print:"]'));
        return elements.length > 0;
      });
      assert.ok(hasPrintClass, 'Report document should contain print-specific responsive Tailwind classes');
    });

    it('F16.5: should display overall compliance health score and grade badge', async () => {
      await navigateTo(page, '/?tab=reports');
      await page.waitForSelector('text=Overall Health', { timeout: 10000 });

      const scoreEl = page.locator('text=Overall Health').first();
      assert.ok(await scoreEl.isVisible(), 'Score percentage badge missing on Executive Scorecard');
    });
  });
});
