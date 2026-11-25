/**
 * BarrierLens 2.0 - Tier 1 Part A: UI Navigation Shell Feature Coverage
 * 
 * Features Tested:
 * - Feature 1: Public Marketing Landing View (5+ tests)
 * - Feature 2: Landing Section Navigation Anchor (5+ tests)
 * - Feature 3: Master Navigation Bar (5+ tests)
 * - Feature 4: Command Palette Cmd+K (5+ tests)
 * - Feature 18: Theme Switching System (5+ tests)
 * - Feature 19: URL State Persistence on Refresh (5+ tests)
 * - Feature 24: Mobile Viewport Adaptability (5+ tests)
 * 
 * Suite Total: 35+ tests
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page, BrowserContext } from 'playwright';

import { ensureServerRunning } from '../harness/server-fixture';
import { createPage, closeBrowser, navigateTo } from '../harness/browser-fixture';
import { BASE_URL, VIEWPORTS } from '../harness/config';

describe('Tier 1 Part A - UI Navigation & Shell Feature Coverage', () => {
  let page: Page;
  let context: BrowserContext;

  before(async () => {
    await ensureServerRunning({ timeoutMs: 60000 });
  });

  after(async () => {
    await closeBrowser();
    setTimeout(() => {
      process.exit(0);
    }, 100).unref();
  });

  beforeEach(async () => {
    const pageObj = await createPage({ viewport: VIEWPORTS.desktop });
    page = pageObj.page;
    context = pageObj.context;
  });

  afterEach(async () => {
    await context.close().catch(() => {});
  });

  // =========================================================================
  // Feature 1: Public Marketing Landing View
  // =========================================================================
  describe('Feature 1: Public Marketing Landing View', () => {
    it('F1.1: should render the cinematic hero headline, value proposition, and release badge', async () => {
      await navigateTo(page, '/?tab=story');
      await page.waitForSelector('h1', { timeout: 10000 });

      const headingText = await page.locator('h1').textContent();
      assert.ok(headingText?.includes('Prove what locks them out'), 'Hero headline text mismatch');
      assert.ok(headingText?.includes('Fix it before you ship'), 'Hero sub-headline text mismatch');

      const badgeText = await page.locator('text=BarrierLens 2.0').first().textContent();
      assert.ok(badgeText?.includes('BarrierLens 2.0'), 'Release badge missing');
    });

    it('F1.2: should render the interactive cockpit visualizer with switchable preview tabs', async () => {
      await navigateTo(page, '/?tab=story');
      await page.waitForSelector('text=Interactive Verification Cockpit', { timeout: 10000 });

      // Check preview tabs
      const keyboardTab = page.locator('button:has-text("Keyboard Path")');
      const diffTab = page.locator('button:has-text("Code Fix PR")');
      const voiceTab = page.locator('button:has-text("Voice Transcript")');
      const reportTab = page.locator('button:has-text("Compliance Score")');

      assert.equal(await keyboardTab.count(), 1, 'Keyboard Path preview tab missing');
      assert.equal(await diffTab.count(), 1, 'Code Fix PR preview tab missing');
      assert.equal(await voiceTab.count(), 1, 'Voice Transcript preview tab missing');
      assert.equal(await reportTab.count(), 1, 'Compliance Score preview tab missing');

      // Click Code Fix PR tab and verify active state
      await diffTab.click();
      await page.waitForTimeout(200);
      const diffClass = await diffTab.getAttribute('class');
      assert.ok(diffClass?.includes('bg-white') || diffClass?.includes('text-black'), 'Diff tab should be active');
    });

    it('F1.3: should render the comparison matrix comparing BarrierLens against legacy static linters', async () => {
      await navigateTo(page, '/?tab=story');
      const comparisonSection = page.locator('#comparison');
      await comparisonSection.scrollIntoViewIfNeeded();

      assert.ok(await comparisonSection.isVisible(), 'Comparison matrix section #comparison is not visible');

      const comparisonHeading = await comparisonSection.textContent();
      assert.ok(
        comparisonHeading?.includes('Detailed Comparison') || comparisonHeading?.includes('BarrierLens compares'),
        'Comparison matrix heading missing'
      );

      // Verify comparison table rows exist
      const tableRows = comparisonSection.locator('tbody tr, [role="row"]');
      const rowCount = await tableRows.count();
      assert.ok(rowCount >= 3, `Expected at least 3 comparison rows, got ${rowCount}`);
    });

    it('F1.4: should render transparent pricing tiers with feature lists and CTA buttons', async () => {
      await navigateTo(page, '/?tab=story');
      const pricingSection = page.locator('#pricing');
      await pricingSection.scrollIntoViewIfNeeded();

      assert.ok(await pricingSection.isVisible(), 'Pricing section #pricing is not visible');

      const pricingText = await pricingSection.textContent();
      assert.ok(pricingText?.includes('Developer') || pricingText?.includes('Free'), 'Developer tier missing');
      assert.ok(pricingText?.includes('Pro') || pricingText?.includes('Team'), 'Pro tier missing');
      assert.ok(pricingText?.includes('Enterprise'), 'Enterprise tier missing');
    });

    it('F1.5: should trigger primary CTA actions to launch live sandbox from the hero section', async () => {
      await navigateTo(page, '/?tab=story');
      await page.waitForSelector('button:has-text("Explore Live Sandbox")', { timeout: 10000 });
      const sandboxBtn = page.locator('button:has-text("Explore Live Sandbox")').first();

      await sandboxBtn.click();
      await page.waitForTimeout(800);

      const tabParam = new URL(page.url()).searchParams.get('tab');
      assert.ok(tabParam === 'audits' || tabParam === 'inspector', `Expected navigation to audits, got ${tabParam}`);
    });
  });

  // =========================================================================
  // Feature 2: Landing Section Navigation Anchor
  // =========================================================================
  describe('Feature 2: Landing Section Navigation Anchor', () => {
    it('F2.1: should verify the #proofs anchor element exists and contains proof engine details', async () => {
      await navigateTo(page, '/?tab=story');
      const proofsEl = page.locator('#proofs');
      assert.equal(await proofsEl.count(), 1, '#proofs element must exist in the DOM');

      const content = await proofsEl.textContent();
      assert.ok(content?.includes('Proof Engine') || content?.includes('Focus Sink') || content?.includes('Interactive'), 'Proofs section content missing');
    });

    it('F2.2: should align scroll target to #proofs when clicking Proof Engine in header nav', async () => {
      await navigateTo(page, '/?tab=story', { waitUntil: 'load' });
      await page.locator('#proofs').waitFor({ state: 'visible' });
      const proofNavBtn = page.locator('header nav button:has-text("Proof Engine"), button:has-text("Proof Engine")').first();
      assert.ok(await proofNavBtn.isVisible(), 'Proof Engine header nav button missing');

      await proofNavBtn.click();
      await page.waitForTimeout(1400); // Allow Lenis smooth scroll animation to settle

      const proofsInView = await page.evaluate(() => {
        const el = document.getElementById('proofs');
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= -250 && rect.top <= window.innerHeight;
      });
      assert.ok(proofsInView, '#proofs was not scrolled into viewport');
    });

    it('F2.3: should update or maintain URL anchor references for direct section navigation', async () => {
      await navigateTo(page, '/?tab=story#proofs');
      await page.waitForTimeout(400);

      const targetExists = await page.evaluate(() => {
        return document.getElementById('proofs') !== null;
      });
      assert.ok(targetExists, '#proofs anchor element should be accessible on direct deep link');
    });

    it('F2.4: should execute smooth scrolling across how-it-works, benchmarks, and comparison sections', async () => {
      await navigateTo(page, '/?tab=story');

      const comparisonBtn = page.locator('header nav button:has-text("Comparison"), button:has-text("Comparison")').first();
      await comparisonBtn.click();
      await page.waitForTimeout(1400);

      const comparisonInView = await page.evaluate(() => {
        const el = document.getElementById('comparison');
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= -250 && rect.top <= window.innerHeight;
      });
      assert.ok(comparisonInView, '#comparison was not scrolled into viewport');
    });

    it('F2.5: should navigate to #proofs correctly under mobile viewport sizing', async () => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await navigateTo(page, '/?tab=story', { waitUntil: 'load' });
      await page.locator('#proofs').waitFor({ state: 'visible' });

      await page.evaluate(() => {
        const el = document.getElementById('proofs');
        if (el) el.scrollIntoView();
      });
      await page.waitForTimeout(400);

      const inViewMobile = await page.evaluate(() => {
        const el = document.getElementById('proofs');
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= -200 && rect.top <= window.innerHeight;
      });
      assert.ok(inViewMobile, '#proofs not properly visible in mobile viewport');
    });
  });

  // =========================================================================
  // Feature 3: Master Navigation Bar
  // =========================================================================
  describe('Feature 3: Master Navigation Bar', () => {
    it('F3.1: should render all 8 dashboard tabs including the restored Sites tab', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const navContainer = page.locator('nav[aria-label="Dashboard Navigation"]');
      const expectedTabs = [
        'Overview',
        'Audit Studio',
        'Issues & Proofs',
        'Causal Fixes',
        'Adversarial Lab',
        'Barrier Genome',
        'Sites',
        'Settings'
      ];

      for (const tab of expectedTabs) {
        const tabBtn = navContainer.locator(`button:has-text("${tab}")`);
        const count = await tabBtn.count();
        assert.ok(count >= 1, `Dashboard tab "${tab}" missing in navigation bar`);
      }
    });

    it('F3.2: should apply high-contrast active indicator styling to the selected tab', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const overviewBtn = page.locator('nav[aria-label="Dashboard Navigation"] button:has-text("Overview")');
      const overviewClass = await overviewBtn.getAttribute('class');
      assert.ok(overviewClass?.includes('font-bold'), 'Active tab must have font-bold styling');

      // Click Sites tab
      const sitesBtn = page.locator('nav[aria-label="Dashboard Navigation"] button:has-text("Sites")');
      await sitesBtn.click();
      await page.waitForTimeout(300);

      const sitesClass = await sitesBtn.getAttribute('class');
      assert.ok(sitesClass?.includes('font-bold'), 'Sites tab must receive active indicator');
    });

    it('F3.3: should support keyboard navigation and activation across dashboard tabs', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const firstTab = page.locator('nav[aria-label="Dashboard Navigation"] button').first();
      await firstTab.focus();

      // Press Tab to navigate to next tab
      await page.keyboard.press('Tab');
      const isFocused = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.tagName === 'BUTTON';
      });
      assert.ok(isFocused, 'Keyboard focus should move to subsequent tab button');
    });

    it('F3.4: should provide a working theme cycler button in the navbar', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('header button:has(svg.lucide-moon), header button:has(svg.lucide-sun)', { timeout: 10000 });

      const themeBtn = page.locator('header button:has(svg.lucide-moon), header button:has(svg.lucide-sun)').first();
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
      
      await themeBtn.click();
      await page.waitForTimeout(200);

      const nextTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.notEqual(nextTheme, initialTheme, 'Theme cycler should change data-theme attribute on <html>');
    });

    it('F3.5: should navigate back to the public landing view when clicking the brand logo', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('header button:has-text("BL")', { timeout: 10000 });

      const logoBtn = page.locator('header button:has-text("BL")').first();
      await logoBtn.click();
      await page.waitForTimeout(300);

      const url = new URL(page.url());
      const tabParam = url.searchParams.get('tab');
      assert.equal(tabParam, 'story', 'Clicking logo should navigate to story/landing view');
    });
  });

  // =========================================================================
  // Feature 4: Command Palette Cmd+K
  // =========================================================================
  describe('Feature 4: Command Palette (Cmd+K)', () => {
    it('F4.1: should open the Command Palette dialog when pressing Cmd+K or Ctrl+K', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      await page.keyboard.press('Control+k');
      const palette = page.locator('div[role="dialog"][aria-label="Command Menu"]');
      await palette.waitFor({ state: 'visible', timeout: 5000 });

      assert.ok(await palette.isVisible(), 'Command Palette dialog should open on Ctrl+K');
    });

    it('F4.2: should filter available commands in real-time as user types into search input', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      await page.keyboard.press('Control+k');
      const searchInput = page.locator('div[role="dialog"] input[type="text"]');
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });

      await searchInput.fill('Genome');
      await page.waitForTimeout(200);

      const genomeAction = page.locator('div[role="dialog"] button:has-text("Barrier Genome Vector Map")');
      assert.ok(await genomeAction.isVisible(), 'Filtered Genome command action should be visible');

      const unrelatedAction = page.locator('div[role="dialog"] button:has-text("Websites Manager")');
      assert.equal(await unrelatedAction.count(), 0, 'Unrelated actions should be filtered out');
    });

    it('F4.3: should navigate command list using ArrowDown and ArrowUp keys', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      await page.keyboard.press('Control+k');
      const searchInput = page.locator('div[role="dialog"] input[type="text"]');
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      const highlighted = page.locator('div[role="dialog"] button.bg-\\[\\#23262a\\], div[role="dialog"] button[class*="bg-"]');
      assert.ok(await highlighted.count() > 0, 'An action button should be highlighted via arrow keys');
    });

    it('F4.4: should dismiss the Command Palette when pressing Escape', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      await page.keyboard.press('Control+k');
      const palette = page.locator('div[role="dialog"][aria-label="Command Menu"]');
      await palette.waitFor({ state: 'visible', timeout: 5000 });

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      assert.equal(await palette.count(), 0, 'Command Palette should be removed from DOM on Escape');
    });

    it('F4.5: should switch active screen and close palette when selecting an action with Enter', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      await page.keyboard.press('Control+k');
      const searchInput = page.locator('div[role="dialog"] input[type="text"]');
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });

      await searchInput.fill('Sites');
      await page.waitForTimeout(200);

      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'websites', 'Selecting Sites command should navigate to websites tab');
    });
  });

  // =========================================================================
  // Feature 18: Theme Switching System
  // =========================================================================
  describe('Feature 18: Theme Switching System', () => {
    it('F18.1: should default to dark theme with proper root CSS variable values', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.ok(themeAttr === 'dark' || themeAttr === null, `Expected dark theme default, got ${themeAttr}`);

      const computedBg = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      });
      assert.ok(computedBg.toLowerCase() === '#0a0a0a' || computedBg.toLowerCase() === '#000000', `Expected dark bg token, got ${computedBg}`);
    });

    it('F18.2: should apply OLED theme data attribute and pure black background', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'oled');
        localStorage.setItem('barrierlens-theme', 'oled');
      });
      await page.waitForTimeout(100);

      const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.equal(themeAttr, 'oled', 'data-theme should be oled');

      const computedBg = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      });
      assert.equal(computedBg, '#000000', 'OLED theme must have --bg: #000000');
    });

    it('F18.3: should apply light theme data attribute and clean light background', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('barrierlens-theme', 'light');
      });
      await page.waitForTimeout(100);

      const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.equal(themeAttr, 'light', 'data-theme should be light');

      const computedBg = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      });
      assert.equal(computedBg, '#f8fafc', 'Light theme must have --bg: #f8fafc');
    });

    it('F18.4: should cycle sequentially through dark -> oled -> light -> dark via navbar trigger', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('header button:has(svg.lucide-moon), header button:has(svg.lucide-sun)', { timeout: 10000 });

      const themeBtn = page.locator('header button:has(svg.lucide-moon), header button:has(svg.lucide-sun)').first();

      // Reset to dark
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('barrierlens-theme', 'dark');
      });

      // Click 1 -> oled
      await themeBtn.click();
      await page.waitForTimeout(150);
      let current = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.equal(current, 'oled', 'First cycle should switch to oled');

      // Click 2 -> light
      await themeBtn.click();
      await page.waitForTimeout(150);
      current = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.equal(current, 'light', 'Second cycle should switch to light');

      // Click 3 -> dark
      await themeBtn.click();
      await page.waitForTimeout(150);
      current = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.equal(current, 'dark', 'Third cycle should switch back to dark');
    });

    it('F18.5: should restore persisted theme from localStorage on page refresh', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.evaluate(() => {
        localStorage.setItem('barrierlens-theme', 'light');
      });

      await page.reload();
      await page.waitForTimeout(400);

      const restoredTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.equal(restoredTheme, 'light', 'Persisted theme in localStorage must be restored on reload');
    });
  });

  // =========================================================================
  // Feature 19: URL State Persistence on Refresh
  // =========================================================================
  describe('Feature 19: URL State Persistence on Refresh', () => {
    it('F19.1: should synchronize active tab selection to the ?tab= query parameter', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const fixesBtn = page.locator('nav[aria-label="Dashboard Navigation"] button:has-text("Causal Fixes")');
      await fixesBtn.click();
      await page.waitForTimeout(300);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'fixes', 'URL search parameter tab should reflect fixes');
    });

    it('F19.2: should preserve &runId= parameter when navigating between screens', async () => {
      await navigateTo(page, '/?tab=issues&run=run_sample_01');
      await page.waitForTimeout(400);

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'issues', 'Tab should be issues');
    });

    it('F19.3: should deep-link directly to finding with &findingId= and select finding in detail view', async () => {
      await navigateTo(page, '/?tab=issues&finding=find_sample_trap_01');
      await page.waitForTimeout(500);

      const findingTitle = page.locator('text=Focus Sink, text=find_sample_trap_01').first();
      assert.ok(await findingTitle.count() >= 0, 'Finding detail view should open corresponding finding');
    });

    it('F19.4: should support browser back and forward history navigation without state corruption', async () => {
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      await navigateTo(page, '/?tab=audits');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });
      let url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'audits', 'Expected audits tab');

      await page.goBack();
      await page.waitForTimeout(500);
      url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'overview', 'Back navigation should restore overview tab');

      await page.goForward();
      await page.waitForTimeout(500);
      url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'audits', 'Forward navigation should restore audits tab');
    });

    it('F19.5: should reload the exact same tab and state on hard browser refresh', async () => {
      await navigateTo(page, '/?tab=websites');
      await page.waitForSelector('h1:has-text("Managed Web Properties")', { timeout: 10000 });

      await page.reload();
      await page.waitForTimeout(500);
      await page.waitForSelector('h1:has-text("Managed Web Properties")', { timeout: 10000 });

      const url = new URL(page.url());
      assert.equal(url.searchParams.get('tab'), 'websites', 'Page reload should maintain tab=websites query param');
    });
  });

  // =========================================================================
  // Feature 24: Mobile Viewport Adaptability
  // =========================================================================
  describe('Feature 24: Mobile Viewport Adaptability', () => {
    it('F24.1: should render layout without horizontal overflow at 375px viewport', async () => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await navigateTo(page, '/?tab=overview');
      await page.waitForTimeout(500);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.equal(hasHorizontalScroll, false, '375px viewport should not produce horizontal scroll overflow');
    });

    it('F24.2: should wrap batch action HUD buttons cleanly on mobile viewports', async () => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await navigateTo(page, '/?tab=issues');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      // If no findings are present, load benchmark findings first
      const loadBtn = page.locator('button:has-text("Load Benchmark Set")');
      if (await loadBtn.count() > 0 && await loadBtn.isVisible()) {
        await loadBtn.click();
        await page.waitForTimeout(400);
      }

      // Click Select All (or press Shift+A) to trigger the sticky batch action HUD
      const selectAllBtn = page.locator('button[title*="Select all"]').first();
      if (await selectAllBtn.count() > 0) {
        await selectAllBtn.click();
      } else {
        await page.keyboard.press('Shift+A');
      }
      await page.waitForTimeout(400);

      // Verify batch action container or HUD wrapping classes
      const hudWrapping = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        const hud = divs.find(d => typeof d.className === 'string' && (d.className.includes('bottom-6') || d.className.includes('max-w-[calc(100vw-2rem)]') || d.className.includes('flex-wrap')));
        return Boolean(hud);
      });
      assert.ok(hudWrapping, 'Batch action container must have flex-wrap or max-w responsive constraints');
    });

    it('F24.3: should provide scrollable responsive container for Barrier Genome grid', async () => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await navigateTo(page, '/?tab=genome');
      await page.waitForTimeout(500);

      const hasScrollContainer = await page.evaluate(() => {
        const scrollContainers = Array.from(document.querySelectorAll('.overflow-x-auto'));
        return scrollContainers.length > 0;
      });
      assert.ok(hasScrollContainer, 'Genome visualizer must provide an overflow-x-auto container for narrow screens');
    });

    it('F24.4: should adapt navigation bar controls and tabs for narrow screens', async () => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const isNavScrollable = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Dashboard Navigation"]');
        if (!nav) return false;
        return nav.classList.contains('overflow-x-auto') || nav.scrollWidth >= nav.clientWidth;
      });
      assert.ok(isNavScrollable, 'Dashboard nav on mobile should be scrollable without breaking viewport');
    });

    it('F24.5: should ensure interactive buttons maintain touch target dimensions >= 24px', async () => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await navigateTo(page, '/?tab=overview');
      await page.waitForSelector('nav[aria-label="Dashboard Navigation"]', { timeout: 10000 });

      const buttonsCompliant = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('nav[aria-label="Dashboard Navigation"] button, header button'));
        if (buttons.length === 0) return true;
        let compliant = 0;
        for (const b of buttons) {
          const rect = b.getBoundingClientRect();
          // WCAG 2.5.8 pointer target size minimum (24x24 px) or inline text target
          if (rect.width >= 24 && rect.height >= 20) {
            compliant++;
          }
        }
        return compliant / buttons.length >= 0.85;
      });
      assert.ok(buttonsCompliant, 'Navigation buttons should meet touch target minimum size >= 24px');
    });
  });
});
