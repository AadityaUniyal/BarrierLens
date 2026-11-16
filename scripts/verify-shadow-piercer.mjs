/**
 * Verification test for Deep Shadow DOM & iFrame Piercer
 */
import { chromium } from 'playwright';
import { DeepShadowDOMPiercer } from '../lib/barrierlens/cdp/shadow-dom-piercer.ts';
import { extractCDPAXTree } from '../lib/barrierlens/cdp/cdp-ax-extractor.ts';

async function runVerification() {
  console.log('======================================================================');
  console.log('🕸️  VERIFYING DEEP SHADOW DOM & IFRAME PIERCER');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  try {
    // Set up HTML fixture with Web Components (Shadow DOM) and an iframe
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shadow DOM & iFrame Testbed</title>
          <script>
            class CustomCard extends HTMLElement {
              connectedCallback() {
                if (!this.shadowRoot) {
                  const shadow = this.attachShadow({ mode: 'open' });
                  shadow.innerHTML = \`
                    <style>button { padding: 8px; }</style>
                    <div class="card-inner">
                      <h3>Shadow Profile</h3>
                      <input id="shadow-name" placeholder="Enter username" />
                      <button id="shadow-save-btn" aria-label="Save Profile In Shadow">Save</button>
                    </div>
                  \`;
                }
              }
            }
            customElements.define('custom-card', CustomCard);
          </script>
        </head>
        <body>
          <h1>Standard Page Content</h1>
          <button id="standard-btn">Main Document Button</button>

          <!-- Web Component with Shadow DOM -->
          <custom-card id="user-card"></custom-card>

          <!-- Embedded iframe -->
          <iframe id="payment-frame" name="payment-frame" srcdoc="
            <html>
              <body>
                <h2>Secure Payment</h2>
                <input id='card-number' name='card_number' placeholder='Card Number'>
                <button id='pay-btn'>Authorize Payment</button>
              </body>
            </html>
          "></iframe>
        </body>
      </html>
    `);

    await page.waitForTimeout(500);

    const piercer = new DeepShadowDOMPiercer();
    const piercedNodes = await piercer.extractPiercedInteractiveNodes(page);

    assert(piercedNodes.length > 0, `Discovered ${piercedNodes.length} pierced elements across shadow DOM and iframes`);

    // Verify shadow DOM discovery
    const shadowBtn = piercedNodes.find(n => n.name.includes('Save Profile In Shadow') || n.selector.includes('shadow-save-btn'));
    assert(!!shadowBtn, `Discovered shadow DOM button: ${shadowBtn?.selector}`);
    assert(shadowBtn?.isShadowRootChild === true, `Marked correctly as shadow root child`);
    assert(shadowBtn?.selector.includes('>>>'), `Uses transparent pierced selector syntax (>>>): ${shadowBtn?.selector}`);

    // Verify iframe discovery
    const iframeBtn = piercedNodes.find(n => n.selector.includes('pay-btn') || n.name.includes('Authorize Payment'));
    assert(!!iframeBtn, `Discovered child iframe button: ${iframeBtn?.selector}`);
    assert(iframeBtn?.isIFrameChild === true, `Marked correctly as child iframe element`);

    // Verify integrated CDP AX Tree extraction with pierce: true
    const cdpResult = await extractCDPAXTree(page, { resolveDOM: true, pierce: true });
    assert(cdpResult.interactiveNodes.length >= 3, `CDP AX Tree includes both main document and pierced nodes (${cdpResult.interactiveNodes.length} nodes)`);

    const cdpShadowNode = cdpResult.interactiveNodes.find(n => n.selector?.includes('shadow-save-btn'));
    assert(!!cdpShadowNode, `CDP AX Tree seamlessly integrated shadow node: ${cdpShadowNode?.selector}`);

  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`Results: ${passed} / ${total} tests passed`);
  console.log('======================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
