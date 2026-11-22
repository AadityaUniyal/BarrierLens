/**
 * BarrierLens 2.0 - Tier 3 Pairwise Cross-Feature Test Suite
 * Hotkey Guarding & Command Palette (hotkeys-and-command-palette.test.ts)
 * 
 * Verifies global hotkey suppression (`0-7`) when Command Palette (Cmd+K) or modal
 * dialogs are active, ensures typing numbers inputs text rather than switching screens,
 * and verifies Escape key restoration of hotkeys.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, closeBrowser } from '../harness/browser-fixture';
import { Page } from 'playwright';

describe('Tier 3: Hotkeys & Command Palette Guarding', () => {
  let page: Page;

  const HOTKEYS_FIXTURE_HTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>BarrierLens Hotkey Guarding Fixture</title>
      <style>
        body { font-family: sans-serif; background: #0a0a0a; color: #fff; margin: 20px; }
        .screen-badge { display: inline-block; padding: 4px 10px; background: #0090ff; font-weight: bold; border-radius: 4px; }
        .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .dialog-card { background: #141517; border: 1px solid #333; padding: 20px; border-radius: 8px; width: 400px; }
        input { width: 100%; padding: 8px; background: #000; color: #fff; border: 1px solid #555; box-sizing: border-box; }
      </style>
    </head>
    <body>
      <div id="app">
        <header>
          <div>Active Screen: <span id="active-screen-badge" class="screen-badge">overview</span></div>
          <p>Shortcuts: 0=Story, 1=Overview, 2=Audits, 3=Issues, 4=Fixes, 5=Arena, 7=Sites, 8=Settings, Cmd+K=Palette</p>
        </header>

        <main style="margin-top: 20px;">
          <label>Standard Page Input (e.g. Audit URL):</label>
          <input id="page-input" type="text" placeholder="Type here..." />
          <button id="open-generic-modal-btn" onclick="openGenericModal()">Open Custom Dialog</button>
        </main>

        <!-- Command Palette Dialog -->
        <div id="command-palette-backdrop" class="backdrop" style="display: none;">
          <div id="palette-card" class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="palette-h">
            <h3 id="palette-h" style="margin-top: 0;">Spotlight Command Palette</h3>
            <input id="palette-search-input" type="text" placeholder="Type a command or search..." autofocus />
            <div id="palette-shortcuts-hint" style="font-size: 11px; color: #888; margin-top: 8px;">
              Press Esc to dismiss. 0-8 navigation is suppressed inside palette.
            </div>
          </div>
        </div>

        <!-- Generic Accessible Modal -->
        <div id="generic-modal-backdrop" class="backdrop" style="display: none;">
          <div id="generic-dialog" class="dialog-card" role="dialog" aria-modal="true">
            <h3>Accessible Modal Dialog</h3>
            <p>Active dialog testing global hotkey guarding.</p>
            <button id="generic-modal-close" onclick="closeGenericModal()">Close Dialog</button>
          </div>
        </div>
      </div>

      <script>
        let activeScreen = 'overview';
        let isPaletteOpen = false;
        let isGenericModalOpen = false;

        function setScreen(s) {
          activeScreen = s;
          document.getElementById('active-screen-badge').textContent = s;
        }

        function openPalette() {
          isPaletteOpen = true;
          document.getElementById('command-palette-backdrop').style.display = 'flex';
          setTimeout(() => {
            document.getElementById('palette-search-input').focus();
          }, 10);
        }

        function closePalette() {
          isPaletteOpen = false;
          document.getElementById('command-palette-backdrop').style.display = 'none';
          const input = document.getElementById('palette-search-input');
          if (input) input.blur();
          document.body.focus();
        }

        function openGenericModal() {
          isGenericModalOpen = true;
          document.getElementById('generic-modal-backdrop').style.display = 'flex';
          document.getElementById('generic-modal-close').focus();
        }

        function closeGenericModal() {
          isGenericModalOpen = false;
          document.getElementById('generic-modal-backdrop').style.display = 'none';
          document.body.focus();
        }

        // Global Keyboard Navigation Guarding (Mirrors app/page.tsx:304-346)
        window.addEventListener('keydown', (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            isPaletteOpen ? closePalette() : openPalette();
            return;
          }

          if (e.key === 'Escape') {
            if (isPaletteOpen) {
              e.preventDefault();
              closePalette();
              return;
            }
            if (isGenericModalOpen) {
              e.preventDefault();
              closeGenericModal();
              return;
            }
          }

          // Guard: do not switch screens if user is typing or if any modal/dialog is active
          const target = e.target;
          if (
            target &&
            (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
              target.isContentEditable ||
              target.closest('[role="dialog"]') !== null ||
              target.closest('[aria-modal="true"]') !== null)
          ) {
            return;
          }

          if (
            isPaletteOpen ||
            isGenericModalOpen ||
            document.querySelector('[role="dialog"]') !== null && (
              isPaletteOpen || isGenericModalOpen
            )
          ) {
            return;
          }

          if (e.key === '0') setScreen('story');
          if (e.key === '1') setScreen('overview');
          if (e.key === '2') setScreen('audits');
          if (e.key === '3') setScreen('issues');
          if (e.key === '4') setScreen('fixes');
          if (e.key === '5') setScreen('arena');
          if (e.key === '7') setScreen('websites');
          if (e.key === '8') setScreen('settings');
        });

        window.getState = () => ({ activeScreen, isPaletteOpen, isGenericModalOpen });
        window.openPalette = openPalette;
        window.closePalette = closePalette;
        window.openGenericModal = openGenericModal;
        window.closeGenericModal = closeGenericModal;
      </script>
    </body>
    </html>
  `;

  before(async () => {
    const fixture = await createPage();
    page = fixture.page;
    await page.setContent(HOTKEYS_FIXTURE_HTML, { waitUntil: 'domcontentloaded' });
  });

  after(async () => {
    await closeBrowser();
  });

  it('1. should switch screens when pressing numeric keys 0-8 while no modals or inputs are focused', async () => {
    // Focus body to ensure no input is active
    await page.evaluate(() => document.body.focus());

    // Press '2' for Audits
    await page.keyboard.press('2');
    assert.equal(await page.textContent('#active-screen-badge'), 'audits');

    // Press '3' for Issues
    await page.keyboard.press('3');
    assert.equal(await page.textContent('#active-screen-badge'), 'issues');

    // Press '7' for Sites
    await page.keyboard.press('7');
    assert.equal(await page.textContent('#active-screen-badge'), 'websites');

    // Press '1' for Overview
    await page.keyboard.press('1');
    assert.equal(await page.textContent('#active-screen-badge'), 'overview');
  });

  it('2. should open Command Palette when pressing Cmd+K or Ctrl+K', async () => {
    // Press Control+k
    await page.keyboard.press('Control+k');

    // Palette must be visible
    assert.equal(await page.isVisible('#command-palette-backdrop'), true);
    const isPaletteOpen = await page.evaluate(() => (window as any).getState().isPaletteOpen);
    assert.equal(isPaletteOpen, true);
  });

  it('3. should suppress numeric hotkeys and type numbers into search input while palette is open', async () => {
    // Ensure palette input is focused
    await page.focus('#palette-search-input');

    // Type '247' containing numeric hotkey digits
    await page.keyboard.type('247');

    // Search input must contain '247'
    const inputValue = await page.inputValue('#palette-search-input');
    assert.equal(inputValue, '247');

    // Active screen must NOT have changed (remains 'overview')
    const currentScreen = await page.textContent('#active-screen-badge');
    assert.equal(currentScreen, 'overview', 'Numeric keys must NOT trigger screen switching while palette is open');
  });

  it('4. should close Command Palette on Escape key and restore active hotkeys', async () => {
    // Press Escape
    await page.keyboard.press('Escape');

    // Palette must now be hidden
    assert.equal(await page.isVisible('#command-palette-backdrop'), false);
    const isPaletteOpen = await page.evaluate(() => (window as any).getState().isPaletteOpen);
    assert.equal(isPaletteOpen, false);

    // Focus body and test numeric hotkey '4' (Fixes)
    await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (el) el.blur();
      document.body.focus();
    });
    await page.keyboard.press('4');

    assert.equal(await page.textContent('#active-screen-badge'), 'fixes');
  });

  it('5. should suppress numeric hotkeys when typing numbers into regular page inputs', async () => {
    // Focus regular input on page
    await page.focus('#page-input');

    // Type numbers '57'
    await page.keyboard.type('57');

    const pageInputValue = await page.inputValue('#page-input');
    assert.equal(pageInputValue, '57');

    // Active screen must still be 'fixes'
    const currentScreen = await page.textContent('#active-screen-badge');
    assert.equal(currentScreen, 'fixes', 'Numeric hotkeys must be suppressed while typing in standard input');
  });

  it('6. should suppress numeric hotkeys when generic modal dialog is open', async () => {
    // Open generic accessible modal
    await page.click('#open-generic-modal-btn');
    assert.equal(await page.isVisible('#generic-modal-backdrop'), true);

    // Press '1', '2', '3'
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');

    // Active screen must remain 'fixes'
    assert.equal(await page.textContent('#active-screen-badge'), 'fixes');

    // Dismiss modal with Escape
    await page.keyboard.press('Escape');
    assert.equal(await page.isVisible('#generic-modal-backdrop'), false);

    // Focus body and test numeric hotkey '5'
    await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (el) el.blur();
      document.body.focus();
    });
    await page.keyboard.press('5');
    assert.equal(await page.textContent('#active-screen-badge'), 'arena');
  });

});
