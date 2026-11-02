#!/usr/bin/env node

/**
 * Empirical Edge-Case Stress Testing Harness for Suite 2: Focus Graph & Tarjan SCC Trap Certification
 * 
 * Deeply probes:
 * 1. Roving Tabindex:
 *    - Radiogroup arrow key roving tabindex navigation & Tab key jump-out.
 *    - Asymmetric composite widget transitions.
 *    - Trapped composite widget vs compliant composite widget.
 * 2. Reverse Adjacency:
 *    - Verification of predecessor mapping (fromId in reverseAdjacency of toId).
 *    - Asymmetric Shift+Tab vs Tab paths (A -Tab-> B, B -Shift+Tab-> C, C -Tab-> A).
 *    - Multi-edge and self-loop reverse adjacency consistency.
 * 3. Complex Nested Modal Escape:
 *    - Nested dialogs (Modal 1 -> Modal 2): Escape dismisses Modal 2 back to Modal 1.
 *    - Escape probe behavior with specific selector vs auto-detected modal selector.
 *    - Escape resulting in focus dropped to body.
 *    - Escape intercepted in nested modal (deadlock).
 * 4. Single-Node Trap vs Full-Page Loop:
 *    - Single-node trap in multi-node page (A -> B, B -> B).
 *    - Single-node page (totalNodes === 1) standard vs modal.
 *    - Full-page loop (A -> B -> C -> A) standard non-modal immunity.
 *    - Full-page modal wrap with compliant Escape vs broken Escape.
 */

import { chromium } from 'playwright';
import assert from 'node:assert';

// Import FocusGraphEngine
const engineModule = await import('../lib/barrierlens/engines/focus-graph.ts');
const FocusGraphEngine = engineModule.FocusGraphEngine || engineModule.default?.FocusGraphEngine || engineModule.default;

const RESULTS = {
  passed: 0,
  failed: 0,
  flaws: []
};

async function runTest(name, fn) {
  try {
    await fn();
    RESULTS.passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    RESULTS.failed++;
    const msg = `[CHALLENGE FAIL] ${name}: ${err.message}`;
    console.error(`  ${msg}`);
    RESULTS.flaws.push(msg);
  }
}

console.log('======================================================================');
console.log(' EMPIRICAL CHALLENGE SUITE: DEEP EDGE CASES FOR SUITE 2 FOCUS ENGINE');
console.log('======================================================================\n');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__name = (fn) => fn;
  });
  const page = await context.newPage();

  try {
    // =========================================================================
    // SECTION 1: ROVING TABINDEX & COMPOSITE WIDGETS
    // =========================================================================
    console.log('--- 1. Roving Tabindex & Composite Widgets ---');

    await runTest('1.1 Radiogroup with roving tabindex: Tab jumps out to next control, Arrow keys cycle', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <input id="before-input" type="text" />
          <div role="radiogroup" aria-label="Payment Options">
            <div id="radio-1" role="radio" tabindex="0" aria-checked="true">Credit Card</div>
            <div id="radio-2" role="radio" tabindex="-1" aria-checked="false">PayPal</div>
            <div id="radio-3" role="radio" tabindex="-1" aria-checked="false">Apple Pay</div>
          </div>
          <button id="after-btn">Submit Payment</button>
          <script>
            const radios = [document.getElementById('radio-1'), document.getElementById('radio-2'), document.getElementById('radio-3')];
            let activeIdx = 0;
            radios.forEach((r, idx) => {
              r.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  radios[activeIdx].tabIndex = -1;
                  radios[activeIdx].setAttribute('aria-checked', 'false');
                  activeIdx = (activeIdx + 1) % radios.length;
                  radios[activeIdx].tabIndex = 0;
                  radios[activeIdx].setAttribute('aria-checked', 'true');
                  radios[activeIdx].focus();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  radios[activeIdx].tabIndex = -1;
                  radios[activeIdx].setAttribute('aria-checked', 'false');
                  activeIdx = (activeIdx - 1 + radios.length) % radios.length;
                  radios[activeIdx].tabIndex = 0;
                  radios[activeIdx].setAttribute('aria-checked', 'true');
                  radios[activeIdx].focus();
                }
              });
            });
          </script>
        </body>
        </html>
      `);

      const engine = new FocusGraphEngine();
      await page.focus('#before-input');

      const traversal = await engine.traversePage(page, {
        maxSteps: 15,
        exploreCompositeWidgets: true,
        probeShiftTab: false
      });

      const nodeIds = traversal.nodes.map(n => n.id);
      assert.ok(nodeIds.includes('#before-input'), '#before-input visited');
      assert.ok(nodeIds.includes('#radio-1'), '#radio-1 visited');
      assert.ok(nodeIds.includes('#radio-2'), '#radio-2 visited via ArrowDown/ArrowRight probe');
      assert.ok(nodeIds.includes('#after-btn'), '#after-btn reached by Tab jump out of radiogroup');

      // Verify that radiogroup is not falsely flagged as a keyboard trap
      const trap = engine.findKeyboardTraps();
      assert.strictEqual(trap, null, 'Compliant radiogroup with roving tabindex must not be flagged as a trap');
    });

    await runTest('1.2 Broken composite widget: author intercepts Tab inside radiogroup (creates sink trap)', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <button id="entry-btn">Start</button>
          <div role="radiogroup" aria-label="Broken Group">
            <button id="bad-r1" role="radio" tabindex="0">Option A</button>
            <button id="bad-r2" role="radio" tabindex="-1">Option B</button>
          </div>
          <button id="exit-btn">Unreachable Submit</button>
          <script>
            const r1 = document.getElementById('bad-r1');
            const r2 = document.getElementById('bad-r2');
            r1.addEventListener('keydown', (e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                r2.focus(); // Traps Tab inside radiogroup!
              }
            });
            r2.addEventListener('keydown', (e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                r1.focus(); // Traps Tab inside radiogroup!
              }
            });
          </script>
        </body>
        </html>
      `);

      const engine = new FocusGraphEngine();
      const traversal = await engine.traversePage(page, {
        maxSteps: 10,
        exploreCompositeWidgets: false,
        probeShiftTab: false
      });

      const trap = engine.findKeyboardTraps();
      assert.notStrictEqual(trap, null, 'Must detect broken radiogroup tabbing trap');
      assert.strictEqual(trap.trapType, 'sink_scc');
      assert.ok(trap.componentNodeIds.includes('#bad-r1'));
      assert.ok(trap.componentNodeIds.includes('#bad-r2'));
      assert.ok(!trap.componentNodeIds.includes('#exit-btn'));
    });

    // =========================================================================
    // SECTION 2: REVERSE ADJACENCY EDGE CASES
    // =========================================================================
    console.log('\n--- 2. Reverse Adjacency Deep Verification ---');

    await runTest('2.1 Predecessor mapping: fromId is correctly mapped in reverseAdjacency of toId', () => {
      const engine = new FocusGraphEngine();
      ['#A', '#B', '#C', '#D'].forEach(id => {
        engine.addNode({
          id,
          selector: id,
          tagName: 'BUTTON',
          role: 'button',
          accessibleName: id,
          tabIndex: 0,
          box: { x: 0, y: 0, width: 20, height: 20 },
          isModal: false,
          isInert: false
        });
      });

      engine.addEdge('#A', '#B', 'Tab');
      engine.addEdge('#C', '#B', 'ArrowDown');
      engine.addEdge('#D', '#B', 'Shift+Tab');

      const revB = engine['reverseAdjacency']?.get('#B');
      assert.ok(revB !== undefined, 'reverseAdjacency must have entry for #B');
      assert.deepStrictEqual(revB.sort(), ['#A', '#C', '#D'].sort(), 'reverseAdjacency of #B must contain predecessors #A, #C, #D');

      const revA = engine['reverseAdjacency']?.get('#A');
      assert.strictEqual(revA.length, 0, 'reverseAdjacency of #A must be empty when #A has no incoming edges');
    });

    await runTest('2.2 Asymmetric Shift+Tab vs Tab cycle: A -Tab-> B, B -Shift+Tab-> C, C -Tab-> A', () => {
      const engine = new FocusGraphEngine();
      ['#A', '#B', '#C'].forEach(id => {
        engine.addNode({
          id,
          selector: id,
          tagName: 'BUTTON',
          role: 'button',
          accessibleName: id,
          tabIndex: 0,
          box: { x: 0, y: 0, width: 20, height: 20 },
          isModal: false,
          isInert: false
        });
      });

      engine.addEdge('#A', '#B', 'Tab');
      engine.addEdge('#B', '#C', 'Shift+Tab');
      engine.addEdge('#C', '#A', 'Tab');

      // reverseAdjacency checks
      assert.deepStrictEqual(engine['reverseAdjacency'].get('#B'), ['#A']);
      assert.deepStrictEqual(engine['reverseAdjacency'].get('#C'), ['#B']);
      assert.deepStrictEqual(engine['reverseAdjacency'].get('#A'), ['#C']);

      // Graph forms an SCC of length 3 with no exit
      // But because it covers totalNodes (3) and is not modal, it's exempt as full-page loop
      const trap = engine.findKeyboardTraps();
      assert.strictEqual(trap, null, 'Asymmetric full-page cycle is exempt when non-modal');
    });

    await runTest('2.3 Multi-edge & self-loop reverse adjacency idempotence', () => {
      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#self',
        selector: '#self',
        tagName: 'INPUT',
        role: 'textbox',
        accessibleName: 'Self',
        tabIndex: 0,
        box: { x: 0, y: 0, width: 20, height: 20 },
        isModal: false,
        isInert: false
      });

      // Adding same edge multiple times
      engine.addEdge('#self', '#self', 'Tab');
      engine.addEdge('#self', '#self', 'Tab');
      engine.addEdge('#self', '#self', 'Shift+Tab');

      const rev = engine['reverseAdjacency'].get('#self');
      assert.strictEqual(rev.filter(x => x === '#self').length, 1, 'reverseAdjacency must not contain duplicate self entries');
    });

    // =========================================================================
    // SECTION 3: COMPLEX NESTED MODAL ESCAPE
    // =========================================================================
    console.log('\n--- 3. Complex Nested Modal Escape ---');

    await runTest('3.1 Nested Modal: Escape on Modal 2 returns focus to Modal 1 trigger', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <button id="open-m1-btn">Open Parent Modal</button>

          <dialog id="parent-dialog">
            <h2>Parent Modal</h2>
            <button id="open-child-btn">Open Confirmation</button>
            <button id="m1-cancel-btn">Cancel Parent</button>
          </dialog>

          <dialog id="child-dialog">
            <h3>Are you sure?</h3>
            <button id="confirm-yes-btn">Yes</button>
            <button id="confirm-no-btn">No</button>
          </dialog>

          <script>
            const parentDialog = document.getElementById('parent-dialog');
            const childDialog = document.getElementById('child-dialog');
            const openM1Btn = document.getElementById('open-m1-btn');
            const openChildBtn = document.getElementById('open-child-btn');

            openM1Btn.addEventListener('click', () => {
              parentDialog.showModal();
              openChildBtn.focus();
            });

            openChildBtn.addEventListener('click', () => {
              childDialog.showModal();
              document.getElementById('confirm-yes-btn').focus();
            });

            // Handling Escape on child dialog
            childDialog.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                childDialog.close();
                openChildBtn.focus(); // Returns focus to parent dialog trigger!
              }
            });

            // Handling Escape on parent dialog
            parentDialog.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                parentDialog.close();
                openM1Btn.focus(); // Returns focus to main page!
              }
            });
          </script>
        </body>
        </html>
      `);

      // 1. Open parent dialog
      await page.click('#open-m1-btn');
      await page.waitForTimeout(100);

      // 2. Open child dialog
      await page.click('#open-child-btn');
      await page.waitForTimeout(100);

      // Focus should be on confirm-yes-btn inside child dialog
      const activeEl = await page.evaluate(() => document.activeElement?.id);
      assert.strictEqual(activeEl, 'confirm-yes-btn', 'Focus landed in child dialog');

      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#confirm-yes-btn',
        selector: '#confirm-yes-btn',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Yes',
        tabIndex: 0,
        box: { x: 50, y: 50, width: 80, height: 30 },
        isModal: true,
        isInert: false
      });
      engine.addNode({
        id: '#confirm-no-btn',
        selector: '#confirm-no-btn',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'No',
        tabIndex: 0,
        box: { x: 140, y: 50, width: 80, height: 30 },
        isModal: true,
        isInert: false
      });
      engine.addEdge('#confirm-yes-btn', '#confirm-no-btn', 'Tab');
      engine.addEdge('#confirm-no-btn', '#confirm-yes-btn', 'Tab');

      // Test verifyModalEscape specifically targeting child dialog selector
      const escapeProbeSpecific = await engine.verifyModalEscape(page, '#child-dialog');
      assert.strictEqual(escapeProbeSpecific.escaped, true, 'Specific modal selector detects successful escape from child modal');
      assert.strictEqual(escapeProbeSpecific.result, 'escaped_to_trigger');
      assert.strictEqual(escapeProbeSpecific.activeElementAfter, '#open-child-btn', 'Focus returned to #open-child-btn inside parent dialog');

      // Now close parent dialog as well via Escape
      const escapeProbeParent = await engine.verifyModalEscape(page, '#parent-dialog');
      assert.strictEqual(escapeProbeParent.escaped, true, 'Escape dismisses parent dialog');
      assert.strictEqual(escapeProbeParent.result, 'escaped_to_trigger');
      assert.strictEqual(escapeProbeParent.activeElementAfter, '#open-m1-btn', 'Focus returned to page trigger #open-m1-btn');
    });

    await runTest('3.2 Nested Modal Trap: Escape is blocked in child modal (deadlock)', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <dialog id="deadlock-child-dialog" open>
            <button id="trap-btn-1">Stay Here</button>
            <button id="trap-btn-2">Can't Leave</button>
          </dialog>
          <script>
            window.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                e.preventDefault(); // Intercept and ignore Escape
              }
            });
          </script>
        </body>
        </html>
      `);

      await page.focus('#trap-btn-1');
      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#trap-btn-1',
        selector: '#trap-btn-1',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Stay Here',
        tabIndex: 0,
        box: { x: 50, y: 50, width: 80, height: 30 },
        isModal: true,
        isInert: false
      });
      engine.addNode({
        id: '#trap-btn-2',
        selector: '#trap-btn-2',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Cant Leave',
        tabIndex: 0,
        box: { x: 140, y: 50, width: 80, height: 30 },
        isModal: true,
        isInert: false
      });
      engine.addEdge('#trap-btn-1', '#trap-btn-2', 'Tab');
      engine.addEdge('#trap-btn-2', '#trap-btn-1', 'Tab');

      const trapCert = await engine.findKeyboardTrapsLive(page);
      assert.notStrictEqual(trapCert, null, 'Must report modal deadlock when Escape is intercepted');
      assert.strictEqual(trapCert.trapType, 'modal_deadlock');
      assert.strictEqual(trapCert.escapeResult, 'ignored');
      assert.strictEqual(trapCert.testedEscape, true);
    });

    // =========================================================================
    // SECTION 4: SINGLE-NODE TRAP VS FULL-PAGE LOOP
    // =========================================================================
    console.log('\n--- 4. Single-Node Trap vs Full-Page Loop ---');

    await runTest('4.1 Multi-node page with 1 trapped element (Tab is intercepted)', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <button id="free-btn">Normal Button</button>
          <input id="locked-input" type="text" />
          <button id="post-btn">After Button</button>
          <script>
            const input = document.getElementById('locked-input');
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Tab') {
                e.preventDefault(); // Traps focus in locked-input
              }
            });
          </script>
        </body>
        </html>
      `);

      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#free-btn',
        selector: '#free-btn',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Free',
        tabIndex: 0,
        box: { x: 0, y: 0, width: 80, height: 30 },
        isModal: false,
        isInert: false
      });
      engine.addNode({
        id: '#locked-input',
        selector: '#locked-input',
        tagName: 'INPUT',
        role: 'textbox',
        accessibleName: 'Locked',
        tabIndex: 0,
        box: { x: 0, y: 40, width: 80, height: 30 },
        isModal: false,
        isInert: false
      });
      engine.addNode({
        id: '#post-btn',
        selector: '#post-btn',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Post',
        tabIndex: 0,
        box: { x: 0, y: 80, width: 80, height: 30 },
        isModal: false,
        isInert: false
      });

      engine.addEdge('#free-btn', '#locked-input', 'Tab');
      engine.addEdge('#locked-input', '#locked-input', 'Tab');

      const trap = engine.findKeyboardTraps();
      assert.notStrictEqual(trap, null, 'Must detect single-node self-loop sink SCC');
      assert.strictEqual(trap.trapType, 'sink_scc');
      assert.deepStrictEqual(trap.componentNodeIds, ['#locked-input']);
      assert.strictEqual(trap.entryNodeId, '#locked-input');
      assert.deepStrictEqual(trap.reproducingKeySequence, ['Tab', 'Tab']);
    });

    await runTest('4.2 1-node page (totalNodes === 1) is naturally immune from false positive', () => {
      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#only-link',
        selector: '#only-link',
        tagName: 'A',
        role: 'link',
        accessibleName: 'Only Link',
        tabIndex: 0,
        box: { x: 0, y: 0, width: 80, height: 30 },
        isModal: false,
        isInert: false
      });
      engine.addEdge('#only-link', '#only-link', 'Tab');

      const trap = engine.findKeyboardTraps();
      assert.strictEqual(trap, null, 'Single-node page with self-loop must NOT be flagged as a trap');
    });

    await runTest('4.3 Full-page loop (5 standard nodes cycling A->B->C->D->E->A) is exempt', () => {
      const engine = new FocusGraphEngine();
      const ids = ['#nav-1', '#nav-2', '#nav-3', '#nav-4', '#nav-5'];
      ids.forEach((id, i) => {
        engine.addNode({
          id,
          selector: id,
          tagName: 'A',
          role: 'link',
          accessibleName: id,
          tabIndex: 0,
          box: { x: 0, y: i * 30, width: 80, height: 25 },
          isModal: false,
          isInert: false
        });
      });

      for (let i = 0; i < ids.length; i++) {
        const nextId = ids[(i + 1) % ids.length];
        engine.addEdge(ids[i], nextId, 'Tab');
      }

      const trap = engine.findKeyboardTraps();
      assert.strictEqual(trap, null, 'Standard full-page cyclic navigation must NEVER be flagged as a trap');
    });

    await runTest('4.4 Full-page modal wrap: all nodes inside modal with compliant Escape probe -> exempt', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <button id="trigger-btn">Open Dialog</button>
          <dialog id="fullscreen-dialog" open>
            <button id="modal-item-1">First</button>
            <button id="modal-item-2">Second</button>
            <button id="modal-item-3">Third</button>
          </dialog>
          <script>
            const dialog = document.getElementById('fullscreen-dialog');
            const trigger = document.getElementById('trigger-btn');
            window.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                dialog.close();
                trigger.focus();
              }
            });
          </script>
        </body>
        </html>
      `);

      await page.focus('#modal-item-1');
      const engine = new FocusGraphEngine();
      ['#modal-item-1', '#modal-item-2', '#modal-item-3'].forEach((id, i) => {
        engine.addNode({
          id,
          selector: id,
          tagName: 'BUTTON',
          role: 'button',
          accessibleName: id,
          tabIndex: 0,
          box: { x: 50, y: 50 + i * 40, width: 100, height: 30 },
          isModal: true,
          isInert: false
        });
      });

      engine.addEdge('#modal-item-1', '#modal-item-2', 'Tab');
      engine.addEdge('#modal-item-2', '#modal-item-3', 'Tab');
      engine.addEdge('#modal-item-3', '#modal-item-1', 'Tab');

      const trapCert = await engine.findKeyboardTrapsLive(page);
    });

    await runTest('4.5 Non-modal trap at document start: subsequent controls flagged unreachable via findUnreachableControls', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <button id="trap-start-1">Trap Start 1</button>
          <button id="trap-start-2">Trap Start 2</button>
          <button id="blocked-subsequent-btn">Subsequent Button</button>
          <script>
            const t1 = document.getElementById('trap-start-1');
            const t2 = document.getElementById('trap-start-2');
            t1.addEventListener('keydown', (e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                t2.focus();
              }
            });
            t2.addEventListener('keydown', (e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                t1.focus();
              }
            });
          </script>
        </body>
        </html>
      `);

      const engine = new FocusGraphEngine();
      const traversal = await engine.traversePage(page, {
        maxSteps: 10,
        exploreCompositeWidgets: false,
        probeShiftTab: false
      });

      // Visited nodes are only trap-start-1 and trap-start-2
      assert.deepStrictEqual(traversal.nodes.map(n => n.id).sort(), ['#trap-start-1', '#trap-start-2'].sort());

      // Because only 2 nodes were visited, evaluateTrapsInternal alone sees scc.length === totalNodes
      // Now test with findUnreachableControls against all interactive AX nodes
      const axNodes = [
        { nodeId: 'ax-1', role: 'button', focusable: true, selector: 'button#trap-start-1' },
        { nodeId: 'ax-2', role: 'button', focusable: true, selector: 'button#trap-start-2' },
        { nodeId: 'ax-3', role: 'button', focusable: true, selector: 'button#blocked-subsequent-btn' }
      ];

      const unreachable = engine.findUnreachableControls(axNodes);
      assert.strictEqual(unreachable.unreachableNodes.length, 1, 'findUnreachableControls flags subsequent button as unreachable');
      assert.strictEqual(unreachable.findings[0].selector, 'button#blocked-subsequent-btn');
      assert.strictEqual(unreachable.certificate?.trapType, 'unreachable_control');
    });

    await runTest('4.6 Single-node trap inside modal dialog with working vs broken Escape', async () => {
      // Dialog with 1 button where Escape is ignored
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <dialog id="single-btn-dialog" open>
            <button id="solo-btn">Only Button</button>
          </dialog>
          <script>
            window.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                e.preventDefault(); // Deadlock!
              }
            });
          </script>
        </body>
        </html>
      `);

      await page.focus('#solo-btn');
      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#trigger-outside',
        selector: '#trigger-outside',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Outside',
        tabIndex: 0,
        box: { x: 0, y: 0, width: 50, height: 20 },
        isModal: false,
        isInert: false
      });
      engine.addNode({
        id: '#solo-btn',
        selector: '#solo-btn',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Only Button',
        tabIndex: 0,
        box: { x: 50, y: 50, width: 80, height: 30 },
        isModal: true,
        isInert: false
      });
      engine.addEdge('#trigger-outside', '#solo-btn', 'Tab');
      engine.addEdge('#solo-btn', '#solo-btn', 'Tab');

      const trapCert = await engine.findKeyboardTrapsLive(page);
      assert.notStrictEqual(trapCert, null, 'Must detect single-node modal deadlock when Escape is ignored');
      assert.strictEqual(trapCert.trapType, 'modal_deadlock');
      assert.strictEqual(trapCert.escapeResult, 'ignored');
    });

    // Summary
    console.log('\n======================================================================');
    console.log(` EDGE CASE CHALLENGE SUMMARY: ${RESULTS.passed} Passed, ${RESULTS.failed} Failed`);
    console.log('======================================================================');

    if (RESULTS.failed > 0) {
      console.error('Flaws detected:');
      RESULTS.flaws.forEach(f => console.error(`  - ${f}`));
      process.exit(1);
    } else {
      process.exit(0);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal challenge runner error:', err);
  process.exit(1);
});
