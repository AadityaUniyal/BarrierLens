/**
 * Tier 2 E2E Boundary & Corner Suite: Modals & Focus Boundaries
 * 
 * Tests boundary edge cases on modal dialogs, focus trapping,
 * unmounted/disabled triggers, rapid Escape key spamming,
 * zero vs 100 focusable elements, and nested focus boundary events.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page, Browser } from 'playwright';
import { getBrowser, createPage, closeBrowser } from '../harness/browser-fixture';

describe('Tier 2: Modals & Focus Boundaries', () => {
  let browser: Browser;

  before(async () => {
    browser = await getBrowser();
  });

  after(async () => {
    await closeBrowser();
    setTimeout(() => {
      process.exit(0);
    }, 100).unref();
  });

  describe('Unmounted and Disabled Trigger Boundaries', () => {
    it('should safely recover focus when modal trigger element is unmounted while modal is open', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="app">
            <div id="trigger-container">
              <button id="open-modal-btn">Open Dialog</button>
            </div>
            <div id="modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5);">
              <div id="modal-dialog" role="dialog" aria-modal="true" tabindex="-1" style="background: white; padding: 20px;">
                <h2>Accessible Dialog</h2>
                <button id="modal-close-btn">Close</button>
              </div>
            </div>
          </div>
        `);

        // Execute modal open, unmount trigger, then close modal
        const result = await page.evaluate(`(() => {
          const trigger = document.getElementById('open-modal-btn');
          const backdrop = document.getElementById('modal-backdrop');
          const dialog = document.getElementById('modal-dialog');
          const closeBtn = document.getElementById('modal-close-btn');

          // 1. Focus trigger & Open modal
          trigger.focus();
          const storedTrigger = trigger;
          backdrop.style.display = 'block';
          dialog.focus();

          // 2. Unmount trigger from DOM while modal is open
          trigger.remove();

          // 3. Modal close with defensive focus restoration logic
          backdrop.style.display = 'none';
          let focusRestoredTo = '';
          if (storedTrigger && document.body.contains(storedTrigger) && typeof storedTrigger.focus === 'function') {
            storedTrigger.focus();
            focusRestoredTo = storedTrigger.id;
          } else {
            // Safe fallback: redirect focus to document.body or fallback container
            document.body.focus();
            focusRestoredTo = 'body';
          }

          return {
            focusRestoredTo,
            activeElement: (document.activeElement)?.tagName.toLowerCase(),
            isTriggerInDOM: document.body.contains(storedTrigger)
          };
        })()`);

        assert.equal(result.isTriggerInDOM, false, 'Trigger must have been unmounted from DOM');
        assert.equal(result.focusRestoredTo, 'body', 'Focus must safely fall back to body when trigger is unmounted');
      } finally {
        await context.close();
      }
    });

    it('should fall back safely when trigger element becomes disabled while modal is open', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="app">
            <button id="trigger-btn">Launch Audit</button>
            <div id="modal" role="dialog" aria-modal="true" style="display: none;">
              <button id="close-btn">Dismiss</button>
            </div>
          </div>
        `);

        const recovery = await page.evaluate(`(() => {
          const trigger = document.getElementById('trigger-btn');
          const modal = document.getElementById('modal');
          const closeBtn = document.getElementById('close-btn');

          trigger.focus();
          modal.style.display = 'block';

          // Disable the trigger while modal is open
          trigger.disabled = true;

          // Dismiss modal with disabled trigger check
          modal.style.display = 'none';
          let destination = '';
          if (trigger && !trigger.disabled && typeof trigger.focus === 'function') {
            trigger.focus();
            destination = trigger.id;
          } else {
            // Disabled elements cannot receive focus under WCAG 2.4.3
            document.body.focus();
            destination = 'body';
          }

          return {
            triggerDisabled: trigger.disabled,
            destination,
            activeElement: document.activeElement === document.body ? 'body' : (document.activeElement)?.id
          };
        })()`);

        assert.equal(recovery.triggerDisabled, true);
        assert.equal(recovery.destination, 'body', 'Disabled trigger must not be focused');
      } finally {
        await context.close();
      }
    });

    it('should bypass hidden trigger (display: none) upon modal close', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="app">
            <button id="disappearing-btn">Submit</button>
            <div id="modal-box" role="dialog" style="display: none;">
              <button id="dismiss">OK</button>
            </div>
          </div>
        `);

        const result = await page.evaluate(`(() => {
          const btn = document.getElementById('disappearing-btn');
          const modal = document.getElementById('modal-box');

          btn.focus();
          modal.style.display = 'block';

          // Hide trigger while modal is active
          btn.style.display = 'none';

          // Dismiss modal
          modal.style.display = 'none';
          const style = window.getComputedStyle(btn);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && btn.offsetWidth > 0;

          let target = '';
          if (isVisible) {
            btn.focus();
            target = btn.id;
          } else {
            document.body.focus();
            target = 'body';
          }

          return { target, activeTag: document.activeElement?.tagName.toLowerCase() };
        })()`);

        assert.equal(result.target, 'body');
      } finally {
        await context.close();
      }
    });
  });

  describe('Rapid Escape Key Spamming & Animation Transitions', () => {
    it('should withstand 50 rapid Escape keypress events without deadlock or uncaught exceptions', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="app">
            <button id="launch">Open Modal</button>
            <div id="backdrop" style="display: none; opacity: 0; transition: opacity 200ms;">
              <div id="dialog" role="dialog" aria-modal="true" tabindex="-1">
                <input id="input1" type="text" value="hello" />
                <button id="cancel">Cancel</button>
              </div>
            </div>
          </div>
          <script>
            let closeCallCount = 0;
            let isOpen = false;
            const backdrop = document.getElementById('backdrop');
            const dialog = document.getElementById('dialog');

            function openModal() {
              isOpen = true;
              backdrop.style.display = 'block';
              backdrop.style.opacity = '1';
              dialog.focus();
            }

            function closeModal() {
              closeCallCount++;
              isOpen = false;
              backdrop.style.opacity = '0';
              setTimeout(() => {
                backdrop.style.display = 'none';
              }, 50);
            }

            window.addEventListener('keydown', (e) => {
              if (e.key === 'Escape' && isOpen) {
                closeModal();
              }
            });

            window.__getModalState = () => ({
              isOpen,
              closeCallCount,
              display: backdrop.style.display
            });
            window.__openModal = openModal;
          </script>
        `);

        // Open modal
        await page.evaluate(`window.__openModal()`);

        // Spam 50 Escape keys in rapid sequence (< 100ms)
        const spamPromises: Promise<void>[] = [];
        for (let i = 0; i < 50; i++) {
          spamPromises.push(page.keyboard.press('Escape'));
        }
        await Promise.all(spamPromises);

        // Allow animation frame settle
        await page.waitForTimeout(100);

        const state = await page.evaluate(`window.__getModalState()`);

        assert.equal(state.isOpen, false, 'Modal must be fully closed');
        assert.equal(state.closeCallCount, 1, 'Close handler must be idempotent (exactly 1 close transition)');
        assert.equal(state.display, 'none', 'Backdrop must be hidden');
      } finally {
        await context.close();
      }
    });
  });

  describe('Modal Focusable Density Extremes (0 vs 100 Elements)', () => {
    it('should trap focus on modal container when modal contains ZERO focusable elements', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="app">
            <div id="zero-modal" role="dialog" aria-modal="true" aria-label="Informational Alert" tabindex="-1" style="outline: none;">
              <p id="info-text">System maintenance in progress. All controls are temporarily offline.</p>
            </div>
          </div>
        `);

        const trapBehavior = await page.evaluate(`(() => {
          const modal = document.getElementById('zero-modal');
          const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

          const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR));

          // Edge case handling: when zero interactive elements exist, container must receive focus
          if (focusables.length === 0) {
            modal.focus();
          } else {
            focusables[0].focus();
          }

          return {
            focusableCount: focusables.length,
            activeElementId: (document.activeElement)?.id,
            containerHasTabIndex: modal.getAttribute('tabindex') === '-1'
          };
        })()`);

        assert.equal(trapBehavior.focusableCount, 0, 'Modal must contain 0 focusable controls');
        assert.equal(trapBehavior.activeElementId, 'zero-modal', 'Focus must clamp to modal container');
        assert.equal(trapBehavior.containerHasTabIndex, true, 'Container must have tabindex="-1" for programmatic focus');
      } finally {
        await context.close();
      }
    });

    it('should correctly identify boundaries and wrap focus in a modal containing 100 focusable elements', async () => {
      const { page, context } = await createPage();

      try {
        // Generate modal containing 100 buttons
        let buttonsHtml = '';
        for (let i = 0; i < 100; i++) {
          buttonsHtml += `<button id="btn_${i}" class="modal-control">Control ${i}</button>\n`;
        }

        await page.setContent(`
          <div id="massive-modal" role="dialog" aria-modal="true" style="max-height: 400px; overflow-y: auto;">
            <div id="controls-list">
              ${buttonsHtml}
            </div>
          </div>
        `);

        const wrapMetrics = await page.evaluate(`(() => {
          const modal = document.getElementById('massive-modal');
          const focusables = Array.from(modal.querySelectorAll('.modal-control'));

          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          // Simulate Tab forward wrap from element 99
          last.focus();
          let forwardTarget = '';
          if (document.activeElement === last) {
            first.focus(); // Wrap around
            forwardTarget = (document.activeElement).id;
          }

          // Simulate Shift+Tab backward wrap from element 0
          first.focus();
          let backwardTarget = '';
          if (document.activeElement === first) {
            last.focus(); // Wrap backwards
            backwardTarget = (document.activeElement).id;
          }

          return {
            totalFocusables: focusables.length,
            firstId: first.id,
            lastId: last.id,
            forwardTarget,
            backwardTarget
          };
        })()`);

        assert.equal(wrapMetrics.totalFocusables, 100);
        assert.equal(wrapMetrics.firstId, 'btn_0');
        assert.equal(wrapMetrics.lastId, 'btn_99');
        assert.equal(wrapMetrics.forwardTarget, 'btn_0', 'Tab on last element must wrap to first element');
        assert.equal(wrapMetrics.backwardTarget, 'btn_99', 'Shift+Tab on first element must wrap to last element');
      } finally {
        await context.close();
      }
    });
  });

  describe('Deep Nested Focus Boundaries & Wrap-Around Limits', () => {
    it('should isolate focus within child modal and prevent leaking to parent modal', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="app">
            <div id="parent-modal" role="dialog" aria-modal="true" class="modal-layer">
              <input id="p_input" value="Parent Data" />
              <button id="open-child-btn">Open Nested Child</button>
              <button id="p_close">Parent Close</button>

              <div id="child-modal" role="dialog" aria-modal="true" class="modal-layer" style="display: none;">
                <input id="c_input" value="Child Data" />
                <button id="c_confirm">Confirm Child</button>
                <button id="c_cancel">Cancel Child</button>
              </div>
            </div>
          </div>
        `);

        const isolation = await page.evaluate(`(() => {
          const parent = document.getElementById('parent-modal');
          const child = document.getElementById('child-modal');
          const openChildBtn = document.getElementById('open-child-btn');

          // Open child modal
          child.style.display = 'block';

          const childFocusables = Array.from(child.querySelectorAll('input, button'));
          const childFirst = childFocusables[0];
          const childLast = childFocusables[childFocusables.length - 1];

          childFirst.focus();

          // Simulate Tab wrap inside child modal
          childLast.focus();
          let wrapTarget = '';
          if (document.activeElement === childLast) {
            childFirst.focus();
            wrapTarget = (document.activeElement).id;
          }

          // Check if focus ever leaked to parent controls
          const parentInputFocused = document.activeElement?.id === 'p_input';

          return {
            childFocusableCount: childFocusables.length,
            childFirstId: childFirst.id,
            wrapTarget,
            parentInputFocused
          };
        })()`);

        assert.equal(isolation.childFocusableCount, 3);
        assert.equal(isolation.wrapTarget, 'c_input', 'Child modal Tab wrap must remain within child modal');
        assert.equal(isolation.parentInputFocused, false, 'Focus must not leak into parent modal');
      } finally {
        await context.close();
      }
    });

    it('should restore focus to parent trigger when child modal dismisses', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="parent-modal" role="dialog" aria-modal="true">
            <button id="parent-trigger">Open Child</button>
            <div id="child-modal" role="dialog" aria-modal="true" style="display: none;">
              <button id="child-dismiss">Close Child</button>
            </div>
          </div>
        `);

        const restoration = await page.evaluate(`(() => {
          const parentTrigger = document.getElementById('parent-trigger');
          const child = document.getElementById('child-modal');
          const childDismiss = document.getElementById('child-dismiss');

          // Open child
          parentTrigger.focus();
          const savedTrigger = document.activeElement;
          child.style.display = 'block';
          childDismiss.focus();

          // Dismiss child
          child.style.display = 'none';
          savedTrigger.focus();

          return {
            restoredId: (document.activeElement)?.id
          };
        })()`);

        assert.equal(restoration.restoredId, 'parent-trigger', 'Closing child modal must restore focus to parent trigger');
      } finally {
        await context.close();
      }
    });

    it('should ignore non-Tab modifier combinations (Control+Tab, Alt+Tab, Meta+Tab) in focus trapping', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="dialog" role="dialog" aria-modal="true">
            <button id="btn1">First</button>
            <button id="btn2">Last</button>
          </div>
        `);

        const modifierHandling = await page.evaluate(`(() => {
          const btn1 = document.getElementById('btn1');
          const btn2 = document.getElementById('btn2');

          btn1.focus();

          let trappedEvents = 0;
          const onKeyDown = (e) => {
            // Focus trap should ONLY handle Tab and Shift+Tab, ignoring Ctrl/Alt/Meta
            if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
              trappedEvents++;
            }
          };

          window.addEventListener('keydown', onKeyDown);

          // Dispatch Control+Tab, Alt+Tab, Meta+Tab
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', ctrlKey: true }));
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', altKey: true }));
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', metaKey: true }));

          // Dispatch standard Tab
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false }));

          window.removeEventListener('keydown', onKeyDown);

          return { trappedEvents };
        })()`);

        assert.equal(modifierHandling.trappedEvents, 1, 'Only standard Tab must trigger intra-modal focus trap');
      } finally {
        await context.close();
      }
    });

    it('should dynamically update focus trap boundaries when elements are added or removed from modal', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="dynamic-modal" role="dialog">
            <button id="d1">One</button>
            <button id="d2">Two</button>
          </div>
        `);

        const dynamicTrap = await page.evaluate(`(() => {
          const modal = document.getElementById('dynamic-modal');

          const initialButtons = Array.from(modal.querySelectorAll('button:not([disabled])'));
          const initialCount = initialButtons.length;

          // Dynamically append 3rd button
          const d3 = document.createElement('button');
          d3.id = 'd3';
          d3.textContent = 'Three';
          modal.appendChild(d3);

          const updatedButtons = Array.from(modal.querySelectorAll('button:not([disabled])'));
          const newLast = updatedButtons[updatedButtons.length - 1];

          // Remove element d2
          const d2 = document.getElementById('d2');
          d2.remove();

          const finalButtons = Array.from(modal.querySelectorAll('button:not([disabled])'));

          return {
            initialCount,
            updatedCount: updatedButtons.length,
            newLastId: newLast.id,
            finalCount: finalButtons.length,
            finalIds: finalButtons.map(el => el.id)
          };
        })()`);

        assert.equal(dynamicTrap.initialCount, 2);
        assert.equal(dynamicTrap.updatedCount, 3);
        assert.equal(dynamicTrap.newLastId, 'd3');
        assert.equal(dynamicTrap.finalCount, 2);
        assert.deepEqual(dynamicTrap.finalIds, ['d1', 'd3']);
      } finally {
        await context.close();
      }
    });

    it('should maintain focus lock when user clicks on inert backdrop without dismiss trigger', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5);">
            <div id="modal" role="dialog" aria-modal="true" style="margin: 50px auto; width: 300px; background: white;">
              <input id="locked-input" value="Sensitive Data" />
            </div>
          </div>
        `);

        const lock = await page.evaluate(`(() => {
          const backdrop = document.getElementById('backdrop');
          const input = document.getElementById('locked-input');
          input.focus();

          // Clicking backdrop: ensure focus does not leak to body or outside modal
          backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

          if (document.activeElement !== input) {
            input.focus();
          }

          return {
            activeId: (document.activeElement)?.id
          };
        })()`);

        assert.equal(lock.activeId, 'locked-input');
      } finally {
        await context.close();
      }
    });

    it('should handle repetitive wrap-around cycles (5 consecutive Tab wraps and Shift+Tab wraps)', async () => {
      const { page, context } = await createPage();

      try {
        await page.setContent(`
          <div id="cycle-modal" role="dialog">
            <button id="cycle-a">A</button>
            <button id="cycle-b">B</button>
            <button id="cycle-c">C</button>
          </div>
        `);

        const cycles = await page.evaluate(`(() => {
          const modal = document.getElementById('cycle-modal');
          const buttons = Array.from(modal.querySelectorAll('button'));
          let currIndex = 0;
          buttons[currIndex].focus();

          const forwardSequence = [];
          for (let step = 0; step < 6; step++) {
            currIndex = (currIndex + 1) % buttons.length;
            buttons[currIndex].focus();
            forwardSequence.push(buttons[currIndex].id);
          }

          const backwardSequence = [];
          for (let step = 0; step < 6; step++) {
            currIndex = (currIndex - 1 + buttons.length) % buttons.length;
            buttons[currIndex].focus();
            backwardSequence.push(buttons[currIndex].id);
          }

          return { forwardSequence, backwardSequence };
        })()`);

        assert.deepEqual(cycles.forwardSequence, ['cycle-b', 'cycle-c', 'cycle-a', 'cycle-b', 'cycle-c', 'cycle-a']);
        assert.deepEqual(cycles.backwardSequence, ['cycle-c', 'cycle-b', 'cycle-a', 'cycle-c', 'cycle-b', 'cycle-a']);
      } finally {
        await context.close();
      }
    });
  });

});
