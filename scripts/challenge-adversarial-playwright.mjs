import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const engineModule = await import('../lib/barrierlens/engines/focus-graph.ts');
const FocusGraphEngine = engineModule.FocusGraphEngine || engineModule.default?.FocusGraphEngine || engineModule.default;

console.log('======================================================================');
console.log(' ADVERSARIAL PLAYWRIGHT STRESS SUITE: Edge Behaviors & Modals');
console.log('======================================================================');

let passes = 0;
let failures = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passes++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failures++;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__name = (fn) => fn;
  });
  const page = await context.newPage();

  try {
    // -----------------------------------------------------------------------
    // Stress Test P1: Modal that closes on Escape but DROPS focus to body
    // -----------------------------------------------------------------------
    await runTest('P1: Escape probe detects "focus_lost_to_body" when modal closes without restoring focus', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <button id="trigger">Open Faulty Modal</button>
          <dialog id="faulty-modal" open>
            <input id="modal-input" />
            <button id="modal-btn">Action</button>
          </dialog>
          <script>
            const modal = document.getElementById('faulty-modal');
            window.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                modal.removeAttribute('open');
                // Deliberately do NOT restore focus to #trigger -> drops to body!
              }
            });
          </script>
        </body>
        </html>
      `);

      await page.focus('#modal-input');
      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#modal-input',
        selector: '#modal-input',
        tagName: 'INPUT',
        role: 'textbox',
        accessibleName: 'Input',
        tabIndex: 0,
        box: { x: 50, y: 50, width: 100, height: 30 },
        isModal: true,
        isInert: false
      });
      engine.addNode({
        id: '#modal-btn',
        selector: '#modal-btn',
        tagName: 'BUTTON',
        role: 'button',
        accessibleName: 'Btn',
        tabIndex: 0,
        box: { x: 50, y: 90, width: 100, height: 30 },
        isModal: true,
        isInert: false
      });
      engine.addEdge('#modal-input', '#modal-btn', 'Tab');
      engine.addEdge('#modal-btn', '#modal-input', 'Tab');

      const probe = await engine.verifyModalEscape(page, '#faulty-modal');
      assert.strictEqual(probe.escaped, false);
      assert.strictEqual(probe.result, 'focus_lost_to_body');

      const trapCert = await engine.findKeyboardTrapsLive(page);
      assert.notStrictEqual(trapCert, null);
      assert.strictEqual(trapCert.trapType, 'focus_loss');
      assert.strictEqual(trapCert.escapeResult, 'focus_lost_to_body');
    });

    // -----------------------------------------------------------------------
    // Stress Test P2: Composite widget adjacent edge exploration
    // -----------------------------------------------------------------------
    await runTest('P2: Traversal explores adjacent composite items via arrow probe', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body>
          <div role="menubar" aria-label="Menu">
            <button id="m1" role="menuitem" tabindex="0">File</button>
            <button id="m2" role="menuitem" tabindex="-1">Edit</button>
          </div>
          <script>
            const items = [document.getElementById('m1'), document.getElementById('m2')];
            let active = 0;
            items.forEach((item, idx) => {
              item.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  items[0].tabIndex = -1;
                  items[1].tabIndex = 0;
                  items[1].focus();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  items[1].tabIndex = -1;
                  items[0].tabIndex = 0;
                  items[0].focus();
                }
              });
            });
          </script>
        </body>
        </html>
      `);

      const engine = new FocusGraphEngine();
      await page.focus('#m1');
      const res = await engine.traversePage(page, {
        maxSteps: 5,
        exploreCompositeWidgets: true,
        probeShiftTab: false
      });

      const nodeIds = res.nodes.map(n => n.id);
      assert.ok(nodeIds.includes('#m1'), 'm1 reached');
      assert.ok(nodeIds.includes('#m2'), 'm2 reached via arrow key probe');

      const arrowEdge = res.edges.find(e => e.fromId === '#m1' && e.toId === '#m2' && e.key === 'ArrowRight');
      assert.ok(arrowEdge, 'ArrowRight directed transition recorded in graph');
    });

    // -----------------------------------------------------------------------
    // Stress Test P3: Reverse Adjacency Registration Verification
    // -----------------------------------------------------------------------
    await runTest('P3: reverseAdjacency registers fromId in reverseAdjacency of toId', async () => {
      const engine = new FocusGraphEngine();
      engine.addNode({
        id: '#A',
        selector: '#A',
        tagName: 'A',
        role: 'link',
        accessibleName: 'A',
        tabIndex: 0,
        box: { x: 0, y: 0, width: 20, height: 20 },
        isModal: false,
        isInert: false
      });
      engine.addNode({
        id: '#B',
        selector: '#B',
        tagName: 'B',
        role: 'link',
        accessibleName: 'B',
        tabIndex: 0,
        box: { x: 0, y: 30, width: 20, height: 20 },
        isModal: false,
        isInert: false
      });

      engine.addEdge('#A', '#B', 'Tab');

      // Access private reverseAdjacency via engine
      const rev = engine.reverseAdjacency?.get('#B') || engine['reverseAdjacency']?.get('#B');
      assert.ok(rev.includes('#A'), 'reverseAdjacency of #B must contain #A');
      assert.ok(!rev.includes('#B'), 'reverseAdjacency of #B must NOT contain #B');
    });

    console.log(`\nPlaywright Stress Results: ${passes} Passed, ${failures} Failed`);
    if (failures > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal Playwright stress error:', err);
  process.exit(1);
});
