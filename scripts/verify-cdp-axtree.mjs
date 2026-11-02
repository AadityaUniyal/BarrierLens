import { chromium } from 'playwright';
import { extractCDPAXTree } from '../lib/barrierlens/cdp/cdp-ax-extractor.mjs';

async function main() {
  console.log('===============================================================');
  console.log('  BarrierLens: Automated CDP Accessibility Domain & AX-Tree Verification');
  console.log('===============================================================\n');

  let browser;
  try {
    console.log('[1/4] Launching Chromium instance via Playwright...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    console.log('[2/4] Setting up test fixture with diverse interactive controls...');
    const testHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>CDP AX-Tree Verification Fixture</title>
      </head>
      <body>
        <header>
          <nav aria-label="Primary Navigation">
            <a href="#home" id="nav-home">Home</a>
            <a href="#services" id="nav-services">Services</a>
          </nav>
        </header>
        <main>
          <h1>Checkout Verification</h1>
          <form id="checkout-form" onsubmit="event.preventDefault()">
            <label for="customer-name">Full Name</label>
            <input id="customer-name" name="customerName" type="text" placeholder="John Appleseed" required />

            <label for="customer-email">Email Address</label>
            <input id="customer-email" name="customerEmail" type="email" placeholder="john@apple.com" required />

            <label for="shipping-method">Shipping Option</label>
            <select id="shipping-method" name="shipping">
              <option value="standard">Standard Ground</option>
              <option value="expedited">Expedited Next Day</option>
            </select>

            <div class="checkbox-row">
              <input type="checkbox" id="gift-wrap-check" name="giftWrap" />
              <label for="gift-wrap-check">Include Gift Wrapping</label>
            </div>

            <button type="submit" id="submit-order-btn" class="action-btn primary" aria-label="Complete Order">
              Place Order
            </button>
            <button type="button" id="cancel-btn" class="action-btn secondary">
              Cancel
            </button>
          </form>

          <div role="button" tabindex="0" id="custom-help-chip" aria-label="Need Help? Contact Concierge">
            Concierge
          </div>

          <dialog open id="confirmation-dialog" aria-modal="true" aria-labelledby="dialog-heading">
            <h2 id="dialog-heading">Order Placed</h2>
            <p>Your order confirmation #40921 has been issued.</p>
            <button id="close-dialog-btn" aria-label="Dismiss Confirmation">Dismiss</button>
          </dialog>
        </main>
      </body>
      </html>
    `;

    await page.setContent(testHtml, { waitUntil: 'load' });
    console.log('   ✓ Test fixture loaded into page DOM.');

    console.log('[3/4] Extracting full AX-tree with backendDOMNodeId via CDP Accessibility & DOM domains...');
    const result = await extractCDPAXTree(page, { resolveDOM: true });

    console.log(`   ✓ Total AX nodes extracted: ${result.allNodes.length}`);
    console.log(`   ✓ Interactive AX nodes identified: ${result.interactiveNodes.length}`);
    console.log(`   ✓ Mapped backend DOM nodes: ${result.backendNodeMap.size}`);

    console.log('\n[4/4] Validating backendDOMNodeId integrity and DOM element mappings:');

    if (result.interactiveNodes.length === 0) {
      throw new Error('FAIL: No interactive nodes detected in extracted AX-tree.');
    }

    let validBackendIdCount = 0;
    let mappedDomCount = 0;

    for (const node of result.interactiveNodes) {
      // 1. Verify backendDOMNodeId is a positive integer
      if (typeof node.backendDOMNodeId !== 'number' || !Number.isInteger(node.backendDOMNodeId) || node.backendDOMNodeId <= 0) {
        throw new Error(`FAIL: Node <${node.role}> has invalid backendDOMNodeId: ${node.backendDOMNodeId}`);
      }
      validBackendIdCount++;

      // 2. Verify DOM node description and selector mapping
      if (node.domNode) {
        mappedDomCount++;
        const { backendNodeId, localName, attributes, selector } = node.domNode;

        if (backendNodeId !== node.backendDOMNodeId) {
          throw new Error(`FAIL: Mismatched backendNodeId: AX=${node.backendDOMNodeId} vs DOM=${backendNodeId}`);
        }

        // Verify selector exists and matches in rendered page DOM
        const elementExists = await page.evaluate((sel) => {
          try {
            return document.querySelector(sel) !== null;
          } catch {
            return false;
          }
        }, selector);

        if (!elementExists) {
          throw new Error(`FAIL: Derived selector "${selector}" did not match rendered element in DOM.`);
        }

        console.log(`   ✓ [AX:${node.role}] backendDOMNodeId=${node.backendDOMNodeId} -> DOM <${localName}> | selector: "${selector}" | name: "${node.name || ''}"`);
      }
    }

    // Explicit checkpoint for key target elements
    const expectedControls = [
      { id: 'customer-name', expectedTag: 'input', role: 'textbox' },
      { id: 'customer-email', expectedTag: 'input', role: 'textbox' },
      { id: 'shipping-method', expectedTag: 'select', role: 'combobox' },
      { id: 'gift-wrap-check', expectedTag: 'input', role: 'checkbox' },
      { id: 'submit-order-btn', expectedTag: 'button', role: 'button' },
      { id: 'cancel-btn', expectedTag: 'button', role: 'button' },
      { id: 'custom-help-chip', expectedTag: 'div', role: 'button' },
      { id: 'close-dialog-btn', expectedTag: 'button', role: 'button' }
    ];

    console.log('\nVerifying specific required interactive controls:');
    for (const ctrl of expectedControls) {
      const matched = result.interactiveNodes.find(
        (n) => n.domNode?.attributes.id === ctrl.id || n.selector?.includes(`#${ctrl.id}`)
      );

      if (!matched) {
        throw new Error(`FAIL: Expected control #${ctrl.id} not found in extracted interactive nodes.`);
      }

      if (!matched.backendDOMNodeId || matched.backendDOMNodeId <= 0) {
        throw new Error(`FAIL: Control #${ctrl.id} missing valid positive backendDOMNodeId.`);
      }

      console.log(`   ✓ Confirmed #${ctrl.id}: backendDOMNodeId=${matched.backendDOMNodeId}, tag=${matched.domNode?.localName}, role=${matched.role}`);
    }

    console.log('\n===============================================================');
    console.log(`VERIFICATION PASSED: All ${validBackendIdCount} interactive nodes retain valid backendDOMNodeId.`);
    console.log(`All ${mappedDomCount} nodes successfully resolved and mapped to rendered DOM elements.`);
    console.log('Exit code: 0');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\nVerification failed with error:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
