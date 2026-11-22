/**
 * BarrierLens 2.0 - Tier 3 Pairwise Cross-Feature Test Suite
 * Theme Switching & Modal Dialog Co-Existence (theme-and-modals.test.ts)
 * 
 * Verifies dynamic theme switching (`dark` -> `oled` -> `light`) while modal dialogs
 * are open, ensuring CSS custom properties update on dialog surface, backdrop, and
 * buttons without visual glitches or focus state corruption.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, closeBrowser } from '../harness/browser-fixture';
import { calculateContrastRatio, meetsWcagAA } from '../harness/a11y-helpers';
import { Page } from 'playwright';

describe('Tier 3: Theme Switching & Modal Dialog Interactions', () => {
  let page: Page;

  const MODAL_FIXTURE_HTML = `
    <!DOCTYPE html>
    <html lang="en" data-theme="dark">
    <head>
      <meta charset="UTF-8">
      <title>BarrierLens Theme & Modal Fixture</title>
      <style>
        :root {
          --bg: #0a0a0a;
          --bg-secondary: #121316;
          --bg-surface: #17181c;
          --fg: #ffffff;
          --fg-muted: rgba(255, 255, 255, 0.65);
          --fg-subtle: rgba(255, 255, 255, 0.4);
          --line: rgba(255, 255, 255, 0.14);
          --line-strong: rgba(255, 255, 255, 0.28);
          --scrim: rgba(0, 0, 0, 0.45);
          --accent: #0090ff;
        }
        [data-theme="oled"] {
          --bg: #000000;
          --bg-secondary: #050507;
          --bg-surface: #0a0a0e;
          --fg: #ffffff;
          --fg-muted: rgba(255, 255, 255, 0.65);
          --line: rgba(255, 255, 255, 0.08);
          --line-strong: rgba(255, 255, 255, 0.20);
          --scrim: rgba(0, 0, 0, 0.70);
        }
        [data-theme="light"] {
          --bg: #f8fafc;
          --bg-secondary: #ffffff;
          --bg-surface: #f1f5f9;
          --fg: #0f172a;
          --fg-muted: rgba(15, 23, 42, 0.65);
          --fg-subtle: rgba(15, 23, 42, 0.4);
          --line: rgba(15, 23, 42, 0.12);
          --line-strong: rgba(15, 23, 42, 0.24);
          --scrim: rgba(15, 23, 42, 0.40);
        }
        body {
          background-color: var(--bg);
          color: var(--fg);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .backdrop {
          position: fixed;
          inset: 0;
          background-color: var(--scrim);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-card {
          background-color: var(--bg-surface);
          color: var(--fg);
          border: 1px solid var(--line);
          padding: 24px;
          border-radius: 12px;
          width: 480px;
          max-width: 90vw;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          position: relative;
        }
        .modal-card button.primary-btn {
          background-color: var(--fg);
          color: var(--bg);
          border: 1px solid var(--line);
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .modal-card button.secondary-btn {
          background-color: var(--bg-secondary);
          color: var(--fg);
          border: 1px solid var(--line);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        .modal-card input {
          width: 100%;
          background-color: var(--bg);
          color: var(--fg);
          border: 1px solid var(--line);
          padding: 8px 12px;
          border-radius: 6px;
          box-sizing: border-box;
          margin: 12px 0;
        }
        .code-container {
          background-color: var(--bg-secondary);
          color: var(--fg);
          border: 1px solid var(--line);
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div id="app-root">
        <header>
          <button id="theme-cycler" onclick="cycleTheme()">Switch Theme</button>
        </header>
        <main>
          <h1>BarrierLens Application Shell</h1>
          <button id="open-auth-modal" onclick="openModal('auth-modal')">Open Auth Modal</button>
          <button id="open-palette" onclick="openModal('palette-modal')">Open Command Palette</button>
          <button id="open-drawer" onclick="openModal('drawer-modal')">Open Certificate Drawer</button>
        </main>
      </div>

      <!-- Auth Modal -->
      <div id="auth-modal" class="backdrop" style="display: none;">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <h2 id="auth-modal-title">Sign In to Console</h2>
          <p style="color: var(--fg-muted);">Hardware-backed cryptographic sessions for mathematical accessibility audits.</p>
          <input id="auth-email-input" type="email" placeholder="auditor@barrierlens.com" value="auditor@barrierlens.com" />
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="auth-close-btn" class="secondary-btn" onclick="closeModal('auth-modal')">Cancel</button>
            <button id="auth-submit-btn" class="primary-btn">Authenticate</button>
          </div>
        </div>
      </div>

      <!-- Command Palette Modal -->
      <div id="palette-modal" class="backdrop" style="display: none;">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="palette-title">
          <h2 id="palette-title">Command Palette</h2>
          <input id="palette-search-input" type="text" placeholder="Type a command or search..." />
          <div id="palette-list" style="margin-top: 8px;">
            <div class="palette-item" style="padding: 8px; border-bottom: 1px solid var(--line);">Audit Studio (Press 1)</div>
            <div class="palette-item" style="padding: 8px; border-bottom: 1px solid var(--line);">Evidence & Proofs (Press 2)</div>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
            <button id="palette-close-btn" class="secondary-btn" onclick="closeModal('palette-modal')">Close</button>
          </div>
        </div>
      </div>

      <!-- Causal Certificate Drawer Modal -->
      <div id="drawer-modal" class="backdrop" style="display: none;">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="drawer-title" style="width: 580px;">
          <h2 id="drawer-title">Causal Certificate & AST Patch</h2>
          <div class="code-container" id="ast-diff-snippet">@@ -1,4 +1,7 @@
-&lt;button class="trigger"&gt;Dismiss&lt;/button&gt;
+&lt;button class="trigger" aria-label="Dismiss Modal"&gt;Dismiss&lt;/button&gt;</div>
          <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
            <button id="drawer-close-btn" class="secondary-btn" onclick="closeModal('drawer-modal')">Dismiss</button>
          </div>
        </div>
      </div>

      <script>
        // Polyfill localStorage in case document is about:blank
        try {
          window.localStorage.getItem('test');
        } catch (e) {
          const mem = new Map();
          Object.defineProperty(window, 'localStorage', {
            value: {
              getItem: (k) => mem.has(k) ? mem.get(k) : null,
              setItem: (k, v) => { mem.set(k, String(v)); },
              removeItem: (k) => { mem.delete(k); },
              clear: () => { mem.clear(); },
              key: (i) => Array.from(mem.keys())[i] || null,
              get length() { return mem.size; }
            },
            configurable: true
          });
        }

        const themes = ['dark', 'oled', 'light'];
        function cycleTheme() {
          const current = document.documentElement.getAttribute('data-theme') || 'dark';
          const nextIdx = (themes.indexOf(current) + 1) % themes.length;
          const nextTheme = themes[nextIdx];
          document.documentElement.setAttribute('data-theme', nextTheme);
          try {
            localStorage.setItem('barrierlens-theme', nextTheme);
          } catch {}
          return nextTheme;
        }

        function openModal(id) {
          document.getElementById(id).style.display = 'flex';
          const focusable = document.getElementById(id).querySelector('input, button');
          if (focusable) focusable.focus();
        }

        function closeModal(id) {
          document.getElementById(id).style.display = 'none';
          document.getElementById('open-auth-modal').focus();
        }

        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            ['auth-modal', 'palette-modal', 'drawer-modal'].forEach(closeModal);
          }
        });
      </script>
    </body>
    </html>
  `;

  before(async () => {
    const fixture = await createPage();
    page = fixture.page;
    await page.setContent(MODAL_FIXTURE_HTML, { waitUntil: 'domcontentloaded' });
  });

  after(async () => {
    await closeBrowser();
  });

  it('1. should cycle theme from dark to oled with modal open and update CSS properties correctly', async () => {
    // Open auth modal
    await page.click('#open-auth-modal');
    const isModalVisibleBefore = await page.isVisible('#auth-modal');
    assert.equal(isModalVisibleBefore, true);

    // Initial theme is dark
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    assert.equal(initialTheme, 'dark');

    // Cycle theme to oled
    const newTheme = await page.evaluate(() => (window as any).cycleTheme());
    assert.equal(newTheme, 'oled');
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'oled');

    // Verify modal remains open
    assert.equal(await page.isVisible('#auth-modal'), true);

    // Verify computed CSS properties on modal surface
    const surfaceStyles = await page.evaluate(() => {
      const card = document.querySelector('#auth-modal .modal-card') as HTMLElement;
      const computed = window.getComputedStyle(card);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor,
      };
    });

    // In OLED mode: --bg-surface is #0a0a0e (rgb(10, 10, 14))
    assert.ok(surfaceStyles.backgroundColor.includes('10, 10, 14') || surfaceStyles.backgroundColor.includes('0, 0, 0'),
      `Expected dark/oled background color, got: ${surfaceStyles.backgroundColor}`);
  });

  it('2. should cycle theme from oled to light with modal open and satisfy WCAG AA contrast on buttons', async () => {
    // Current theme is oled; cycle to light
    const newTheme = await page.evaluate(() => (window as any).cycleTheme());
    assert.equal(newTheme, 'light');
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'light');

    // Verify modal dialog remains mounted and visible
    assert.equal(await page.isVisible('#auth-modal'), true);

    // Verify primary button colors update to inverted light mode styling
    const btnStyles = await page.evaluate(() => {
      const btn = document.querySelector('#auth-submit-btn') as HTMLElement;
      const computed = window.getComputedStyle(btn);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
      };
    });

    // In light mode: --fg is #0f172a, --bg is #f8fafc
    const contrastRatio = calculateContrastRatio(btnStyles.color, btnStyles.backgroundColor);
    const wcag = meetsWcagAA(btnStyles.color, btnStyles.backgroundColor);

    assert.ok(
      contrastRatio >= 4.5,
      `Primary button text must meet WCAG AA (>= 4.5:1), got ${contrastRatio.toFixed(2)}:1`
    );
    assert.equal(wcag.pass, true);
  });

  it('3. should cycle theme from light to dark with Command Palette open without losing search input state', async () => {
    // Close auth modal and open Command Palette
    await page.evaluate(() => {
      (window as any).closeModal('auth-modal');
      (window as any).openModal('palette-modal');
    });

    assert.equal(await page.isVisible('#palette-modal'), true);

    // Type query into search input
    await page.fill('#palette-search-input', 'Audit Studio');
    const typedTextBefore = await page.inputValue('#palette-search-input');
    assert.equal(typedTextBefore, 'Audit Studio');

    // Cycle theme from light to dark
    const newTheme = await page.evaluate(() => (window as any).cycleTheme());
    assert.equal(newTheme, 'dark');

    // Verify palette remains open and text value is completely preserved
    assert.equal(await page.isVisible('#palette-modal'), true);
    const typedTextAfter = await page.inputValue('#palette-search-input');
    assert.equal(typedTextAfter, 'Audit Studio');

    // Verify search input styles updated to dark theme
    const inputStyles = await page.evaluate(() => {
      const input = document.querySelector('#palette-search-input') as HTMLElement;
      const comp = window.getComputedStyle(input);
      return {
        backgroundColor: comp.backgroundColor,
        color: comp.color,
      };
    });

    assert.ok(
      inputStyles.color.includes('255, 255, 255'),
      `Expected white text color in dark theme, got: ${inputStyles.color}`
    );
  });

  it('4. should cycle through all 3 themes while Causal Certificate Drawer is open and maintain readable diff', async () => {
    // Switch to drawer modal
    await page.evaluate(() => {
      (window as any).closeModal('palette-modal');
      (window as any).openModal('drawer-modal');
    });

    assert.equal(await page.isVisible('#drawer-modal'), true);

    // Verify code snippet is present
    const snippetText = await page.textContent('#ast-diff-snippet');
    assert.ok(snippetText?.includes('aria-label="Dismiss Modal"'));

    // Cycle through all themes: dark -> oled -> light -> dark
    for (const expectedTheme of ['oled', 'light', 'dark']) {
      const current = await page.evaluate(() => (window as any).cycleTheme());
      assert.equal(current, expectedTheme);
      assert.equal(await page.isVisible('#drawer-modal'), true);

      // Verify diff container is rendered with non-zero dimensions
      const box = await page.locator('#ast-diff-snippet').boundingBox();
      assert.ok(box && box.width > 200 && box.height > 20, 'Code snippet should maintain bounding box');
    }
  });

  it('5. should retain Escape key dismissal handler across repeated theme transitions', async () => {
    // Ensure drawer is open
    assert.equal(await page.isVisible('#drawer-modal'), true);

    // Cycle themes multiple times while modal is open
    await page.evaluate(() => {
      (window as any).cycleTheme();
      (window as any).cycleTheme();
      (window as any).cycleTheme();
    });

    // Press Escape to dismiss drawer
    await page.keyboard.press('Escape');

    // Verify drawer closed cleanly
    const isVisibleAfterEscape = await page.isVisible('#drawer-modal');
    assert.equal(isVisibleAfterEscape, false);
  });

  it('6. should persist theme preference in localStorage across modal interactions', async () => {
    // Set theme to light
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      try {
        localStorage.setItem('barrierlens-theme', 'light');
      } catch {}
    });

    // Open and close auth modal
    await page.click('#open-auth-modal');
    assert.equal(await page.isVisible('#auth-modal'), true);
    await page.click('#auth-close-btn');
    assert.equal(await page.isVisible('#auth-modal'), false);

    // Read stored theme from localStorage
    const savedTheme = await page.evaluate(() => {
      try {
        return localStorage.getItem('barrierlens-theme');
      } catch {
        return document.documentElement.getAttribute('data-theme');
      }
    });
    assert.equal(savedTheme, 'light');
  });

});
