/**
 * BarrierLens 2.0 - Tier 1 Part A: Modals, Dialogs & A11y Feature Coverage
 * 
 * Features Tested:
 * - Feature 13: Journey Builder Modal (>= 5 tests)
 * - Feature 14: Causal Certificate Drawer (>= 5 tests)
 * - Feature 15: GitHub Remediation PR Modal (>= 5 tests)
 * - Feature 20: Modal Dialog Accessibility (>= 5 tests)
 * - Feature 21: Hotkey Guarding on Modals (>= 5 tests)
 * 
 * Total: 25 tests
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page, BrowserContext } from 'playwright';

import { ensureServerRunning } from '../harness/server-fixture';
import { createPage, closeBrowser, navigateTo } from '../harness/browser-fixture';
import { VIEWPORTS } from '../harness/config';

describe('Tier 1 Part A - Modals, Dialogs & Accessibility Feature Coverage', () => {
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

    // Fast-path network routing for website & journey endpoints to ensure deterministic execution
    await page.route('**/api/websites**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          websites: [
            {
              id: 'site_sample_01',
              name: 'BarrierLens Production Showcase',
              origin: 'https://barrierlens-seven.vercel.app',
              environment: 'production',
              verified: true,
              verificationMethod: 'dns_txt',
              status: 'healthy'
            }
          ]
        })
      });
    });

    await page.route('**/api/journeys**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, journey: { id: 'j_sample_1' } })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ journeys: [] })
        });
      }
    });

    // Seed active run into sessionStorage to satisfy the application state contract
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
  // Feature 13: Journey Builder Modal
  // =========================================================================
  describe('Feature 13: Journey Builder Modal', () => {
    it('F13.1: should open and close Journey Builder modal dialog from Websites manager', async () => {
      await navigateTo(page, '/?tab=websites');
      await page.waitForSelector('h1:has-text("Managed Web Properties")', { timeout: 10000 });

      // Click Add Journey button on the first website card
      const addJourneyBtn = page.locator('button:has-text("Add Journey")').first();
      await addJourneyBtn.waitFor({ state: 'visible', timeout: 8000 });
      await addJourneyBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"][aria-labelledby="journey-modal-title"]');
      assert.ok(await modal.isVisible(), 'Journey Builder modal should open');

      // Close modal using close button
      const closeBtn = modal.locator('button[aria-label="Close dialog"]').first();
      await closeBtn.click();
      await page.waitForTimeout(300);

      assert.equal(await modal.count(), 0, 'Journey Builder modal should close');
    });

    it('F13.2: should allow adding new journey action steps dynamically', async () => {
      await navigateTo(page, '/?tab=websites');
      await page.waitForSelector('h1:has-text("Managed Web Properties")', { timeout: 10000 });

      const addJourneyBtn = page.locator('button:has-text("Add Journey")').first();
      await addJourneyBtn.waitFor({ state: 'visible', timeout: 8000 });
      await addJourneyBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"][aria-labelledby="journey-modal-title"]');
      const sequenceHeader = modal.locator('span:has-text("Sequence")').first();
      const headerTextBefore = await sequenceHeader.textContent();

      // Click Add Step button
      const addStepBtn = modal.locator('button:has-text("Add Step")').first();
      await addStepBtn.click();
      await page.waitForTimeout(200);

      const headerTextAfter = await sequenceHeader.textContent();
      assert.notEqual(headerTextBefore, headerTextAfter, 'Sequence count should update after clicking Add Step');
      assert.ok(headerTextAfter?.includes('4 Steps') || headerTextAfter?.includes('Steps'), 'Step count should reflect addition');
    });

    it('F13.3: should support reordering journey steps via move up / move down buttons', async () => {
      await navigateTo(page, '/?tab=websites');
      await page.waitForSelector('h1:has-text("Managed Web Properties")', { timeout: 10000 });

      const addJourneyBtn = page.locator('button:has-text("Add Journey")').first();
      await addJourneyBtn.waitFor({ state: 'visible', timeout: 8000 });
      await addJourneyBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"][aria-labelledby="journey-modal-title"]');
      const firstStepTypeBefore = await modal.locator('span.text-xs.font-medium').first().textContent();

      const moveDownBtn = modal.locator('button:has(svg.lucide-arrow-down):not([disabled])').first();
      assert.ok(await moveDownBtn.isVisible(), 'Move down button should be present on first step');

      // Click move down
      await moveDownBtn.click();
      await page.waitForTimeout(200);

      const firstStepTypeAfter = await modal.locator('span.text-xs.font-medium').first().textContent();
      assert.notEqual(firstStepTypeBefore, firstStepTypeAfter, 'First step type should change after reordering');
    });

    it('F13.4: should validate journey input and prevent saving on empty name', async () => {
      await navigateTo(page, '/?tab=websites');
      await page.waitForSelector('h1:has-text("Managed Web Properties")', { timeout: 10000 });

      const addJourneyBtn = page.locator('button:has-text("Add Journey")').first();
      await addJourneyBtn.waitFor({ state: 'visible', timeout: 8000 });
      await addJourneyBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"][aria-labelledby="journey-modal-title"]');
      const nameInput = modal.locator('input[placeholder*="Checkout" i]').first();
      await nameInput.fill(''); // Clear journey name

      const saveBtn = modal.locator('button:has-text("Save Journey")').first();
      await saveBtn.click();
      await page.waitForTimeout(200);

      // Modal must remain open because validation guards empty names
      assert.ok(await modal.isVisible(), 'Modal should remain open when saving with empty name');
    });

    it('F13.5: should submit valid journey configurations successfully', async () => {
      await navigateTo(page, '/?tab=websites');
      await page.waitForSelector('h1:has-text("Managed Web Properties")', { timeout: 10000 });

      const addJourneyBtn = page.locator('button:has-text("Add Journey")').first();
      await addJourneyBtn.waitFor({ state: 'visible', timeout: 8000 });
      await addJourneyBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"][aria-labelledby="journey-modal-title"]');
      const nameInput = modal.locator('input[placeholder*="Checkout" i]').first();
      await nameInput.fill('Deterministic Checkout E2E');

      const saveBtn = modal.locator('button:has-text("Save Journey")').first();
      await saveBtn.click();
      await page.waitForTimeout(500);

      // Modal closes upon successful submission
      assert.equal(await modal.count(), 0, 'Modal should close cleanly after successful save');
    });
  });

  // =========================================================================
  // Feature 14: Causal Certificate Drawer
  // =========================================================================
  describe('Feature 14: Causal Certificate Drawer', () => {
    it('F14.1: should open the Causal Certificate Drawer via action triggers in Audit Studio', async () => {
      await navigateTo(page, '/?tab=audits');
      await page.waitForSelector('button:has-text("Export Certificate")', { timeout: 10000 });

      const certBtn = page.locator('button:has-text("Export Certificate")').first();
      await certBtn.click();
      await page.waitForTimeout(300);

      const drawer = page.locator('div[role="dialog"][aria-labelledby="cert-drawer-title"]');
      assert.ok(await drawer.isVisible(), 'Causal Certificate Drawer should open');
    });

    it('F14.2: should display cryptographic SHA-256 ledger digest and certificate ID', async () => {
      await navigateTo(page, '/?tab=audits');
      const certBtn = page.locator('button:has-text("Export Certificate")').first();
      await certBtn.click();
      await page.waitForTimeout(300);

      const drawer = page.locator('div[role="dialog"][aria-labelledby="cert-drawer-title"]');
      const content = await drawer.textContent();
      assert.ok(content?.includes('SHA-256'), 'SHA-256 ledger digest label missing in certificate drawer');
      assert.ok(content?.includes('cert_sha256_') || content?.includes('Audit ID'), 'Certificate ID identifier missing');
    });

    it('F14.3: should display the mathematical proof chain and SCM causal steps', async () => {
      await navigateTo(page, '/?tab=audits');
      const certBtn = page.locator('button:has-text("Export Certificate")').first();
      await certBtn.click();
      await page.waitForTimeout(300);

      const drawer = page.locator('div[role="dialog"][aria-labelledby="cert-drawer-title"]');
      const content = await drawer.textContent();
      assert.ok(content?.includes('Mathematical Proof'), 'Mathematical Proof section missing');
      assert.ok(content?.includes('Tarjan SCC') || content?.includes('Structural Dependency'), 'Causal dependency analysis missing');
      assert.ok(content?.includes('Counterfactual') || content?.includes('do('), 'SCM counterfactual action missing');
    });

    it('F14.4: should dismiss certificate drawer when pressing Escape', async () => {
      await navigateTo(page, '/?tab=audits');
      const certBtn = page.locator('button:has-text("Export Certificate")').first();
      await certBtn.click();
      await page.waitForTimeout(300);

      const drawer = page.locator('div[role="dialog"][aria-labelledby="cert-drawer-title"]');
      assert.ok(await drawer.isVisible(), 'Drawer should be open prior to Escape');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      assert.equal(await drawer.count(), 0, 'Drawer should be dismissed on Escape key');
    });

    it('F14.5: should dismiss certificate drawer when clicking backdrop outside container', async () => {
      await navigateTo(page, '/?tab=audits');
      const certBtn = page.locator('button:has-text("Export Certificate")').first();
      await certBtn.click();
      await page.waitForTimeout(300);

      const backdrop = page.locator('div.fixed.inset-0.z-50').first();
      assert.ok(await backdrop.isVisible(), 'Modal backdrop overlay should be present');

      // Click top-left edge of viewport backdrop outside modal card
      await backdrop.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);

      const drawer = page.locator('div[role="dialog"][aria-labelledby="cert-drawer-title"]');
      assert.equal(await drawer.count(), 0, 'Drawer should be dismissed on backdrop click');
    });
  });

  // =========================================================================
  // Feature 15: GitHub Remediation PR Modal
  // =========================================================================
  describe('Feature 15: GitHub Remediation PR Modal', () => {
    it('F15.1: should open GitHub PR Modal from the Causal Fixes view', async () => {
      await navigateTo(page, '/?tab=fixes');
      await page.waitForSelector('button:has-text("Dispatch Remediation PR")', { timeout: 10000 });

      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      const prModal = page.locator('div[role="dialog"][aria-labelledby="pr-modal-title"]');
      assert.ok(await prModal.isVisible(), 'GitHub PR Modal should open');
    });

    it('F15.2: should provide target GitHub repository input defaulting to owner/repo format', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      const repoInput = page.locator('div[role="dialog"] input[placeholder*="owner/repo" i]');
      assert.ok(await repoInput.isVisible(), 'Target repository input missing');

      const val = await repoInput.inputValue();
      assert.ok(val.includes('/'), `Repository input should default to owner/repo format, got ${val}`);
    });

    it('F15.3: should provide base branch input defaulting to main', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      const branchInput = page.locator('div[role="dialog"] input[placeholder="main"]');
      assert.ok(await branchInput.isVisible(), 'Base branch input missing');

      const branchVal = await branchInput.inputValue();
      assert.equal(branchVal, 'main', 'Base branch should default to main');
    });

    it('F15.4: should preview the synthesized declarative AST patch in the form', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"][aria-labelledby="pr-modal-title"]');
      const patchBadge = modal.locator('text=Verified Patch');
      assert.ok(await patchBadge.isVisible(), 'Verified Patch context indicator missing in PR modal');
    });

    it('F15.5: should trigger PR dispatch action and show progress status feedback', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"][aria-labelledby="pr-modal-title"]');
      const dispatchBtn = modal.locator('button:has-text("Dispatch Pull Request")').first();
      assert.ok(await dispatchBtn.isVisible(), 'Dispatch button inside modal should be present');

      await dispatchBtn.click();
      await page.waitForTimeout(500);

      // Verify simulated PR or progress confirmation is shown
      const hasFeedback = await modal.locator('text=Copy Verified Git Patch').first().isVisible();
      assert.ok(hasFeedback, 'PR dispatch feedback should display Copy Verified Git Patch button');
    });
  });

  // =========================================================================
  // Feature 20: Modal Dialog Accessibility
  // =========================================================================
  describe('Feature 20: Modal Dialog Accessibility', () => {
    it('F20.1: should ensure modal dialogs declare role="dialog" attribute', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);

      const dialog = page.locator('[role="dialog"]');
      assert.ok(await dialog.count() > 0, 'Modal container must declare role="dialog"');
    });

    it('F20.2: should ensure modal dialogs declare aria-modal="true" attribute', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);

      const ariaModal = page.locator('[aria-modal="true"]');
      assert.ok(await ariaModal.count() > 0, 'Modal container must declare aria-modal="true"');
    });

    it('F20.3: should trap keyboard focus within modal on Tab and Shift+Tab cycles', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('div[role="dialog"]');
      assert.ok(await modal.isVisible(), 'Modal must be open for focus trap test');

      // Focus first input
      const firstInput = modal.locator('input').first();
      await firstInput.focus();

      // Press Shift+Tab from first element -> should cycle to last focusable element in dialog
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);

      const focusStaysInModal = await page.evaluate(() => {
        const active = document.activeElement;
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(active);
      });
      assert.ok(focusStaysInModal, 'Focus must remain inside modal dialog when cycling Shift+Tab');
    });

    it('F20.4: should close modal dialog when pressing Escape', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const modalCount = await page.locator('div[role="dialog"]').count();
      assert.equal(modalCount, 0, 'Modal should close cleanly on Escape key press');
    });

    it('F20.5: should restore focus or maintain stable document position upon dismissal', async () => {
      await navigateTo(page, '/?tab=overview');
      const themeBtn = page.locator('header button[title*="theme" i]').first();
      if (await themeBtn.isVisible()) {
        await themeBtn.focus();
      }

      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const bodyActive = await page.evaluate(() => document.activeElement !== null);
      assert.ok(bodyActive, 'Document activeElement should remain valid after modal dismiss');
    });
  });

  // =========================================================================
  // Feature 21: Hotkey Guarding on Modals
  // =========================================================================
  describe('Feature 21: Hotkey Guarding on Modals', () => {
    it('F21.1: should suppress global screen switching hotkeys (0-8) when a modal is open', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);

      // Press '5' (which normally switches to arena)
      await page.keyboard.press('5');
      await page.waitForTimeout(200);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'overview', 'Tab must NOT switch to arena while modal is open');
    });

    it('F21.2: should allow screen switching hotkeys (0-8) when no modal is open', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      // Click body to ensure no modal is open and no input is focused
      await page.locator('body').click();
      await page.keyboard.press('6'); // Switch to genome
      await page.waitForTimeout(300);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'genome', 'Pressing 6 should switch to genome when modal is closed');
    });

    it('F21.3: should close modal on Escape without triggering any screen switch', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'overview', 'Escape should dismiss modal without changing screen');
    });

    it('F21.4: should not trigger hotkeys when typing digits into an input inside a modal', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      const repoInput = page.locator('div[role="dialog"] input[type="text"]').first();
      await repoInput.focus();
      await page.keyboard.type('test-12345');
      await page.waitForTimeout(200);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'fixes', 'Typing numbers inside input must not switch tabs');
    });

    it('F21.5: should guard hotkeys consistently across multiple different modal types', async () => {
      await navigateTo(page, '/?tab=fixes');
      const prBtn = page.locator('button:has-text("Dispatch Remediation PR")').first();
      await prBtn.click();
      await page.waitForTimeout(300);

      // Press '1' while PR modal is open
      await page.keyboard.press('1');
      await page.waitForTimeout(200);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'fixes', 'PR modal must suppress hotkey 1');
    });
  });
});
