import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { extractCDPAXTree } from '../lib/barrierlens/cdp/cdp-ax-extractor.mjs';
import { PlaywrightTraceRecorder } from '../lib/barrierlens/trace/recorder.mjs';
import { PlaywrightTraceReplayer } from '../lib/barrierlens/trace/replay.mjs';

const RESULTS = {
  passed: 0,
  failed: 0,
  details: []
};

function recordTest(name, passed, message) {
  if (passed) {
    RESULTS.passed++;
    console.log(`  [PASS] ${name}: ${message}`);
  } else {
    RESULTS.failed++;
    console.error(`  [FAIL] ${name}: ${message}`);
  }
  RESULTS.details.push({ name, passed, message });
}

async function runR1Challenges(browser) {
  console.log('\n===============================================================');
  console.log('--- CHALLENGE SUITE: R1 (CDP AX-Tree & backendDOMNodeId) ---');
  console.log('===============================================================');

  const context = await browser.newContext();
  const page = await context.newPage();

  // --- Test 1.1: Hidden Elements (display:none, visibility:hidden, aria-hidden, hidden attr) ---
  console.log('\n[R1.1] Testing Hidden Elements Handling:');
  const hiddenHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <button id="visible-btn">Visible Button</button>
      <button id="disp-none-btn" style="display: none;">Display None Button</button>
      <input id="vis-hidden-input" style="visibility: hidden;" value="hidden text" />
      <button id="hidden-attr-btn" hidden>Hidden Attr Button</button>
      <button id="aria-hidden-btn" aria-hidden="true">Aria Hidden Button</button>
      <button id="zero-opacity-btn" style="opacity: 0;">Zero Opacity Button</button>
    </body>
    </html>
  `;
  await page.setContent(hiddenHtml, { waitUntil: 'load' });
  const r1Hidden = await extractCDPAXTree(page, { resolveDOM: true });

  const dispNoneNode = r1Hidden.allNodes.find(n => n.domNode?.attributes.id === 'disp-none-btn');
  const ariaHiddenNode = r1Hidden.allNodes.find(n => n.domNode?.attributes.id === 'aria-hidden-btn');
  const visibleNode = r1Hidden.interactiveNodes.find(n => n.domNode?.attributes.id === 'visible-btn');
  const zeroOpacityNode = r1Hidden.interactiveNodes.find(n => n.domNode?.attributes.id === 'zero-opacity-btn');

  // Verify visible node is interactive with valid backendDOMNodeId
  recordTest(
    'R1.1a Visible Button Present & Interactive',
    Boolean(visibleNode && visibleNode.backendDOMNodeId && visibleNode.backendDOMNodeId > 0),
    `visible-btn found with backendDOMNodeId=${visibleNode?.backendDOMNodeId}`
  );

  // In Chrome CDP AX tree, display:none elements are either ignored or omitted from interactive tree
  const dispNoneInInteractive = r1Hidden.interactiveNodes.find(n => n.domNode?.attributes.id === 'disp-none-btn');
  recordTest(
    'R1.1b Display-None Excluded from Interactive Nodes',
    !dispNoneInInteractive,
    `disp-none-btn excluded from interactiveNodes (correctly treated as non-interactive)`
  );

  // aria-hidden elements should not be exposed as interactive
  const ariaHiddenInInteractive = r1Hidden.interactiveNodes.find(n => n.domNode?.attributes.id === 'aria-hidden-btn');
  recordTest(
    'R1.1c Aria-Hidden Excluded from Interactive Nodes',
    !ariaHiddenInInteractive,
    `aria-hidden-btn excluded from interactiveNodes (correctly respected aria-hidden)`
  );

  // Zero opacity button is in layout/accessible tree but visually transparent
  recordTest(
    'R1.1d Zero-Opacity Preserves backendDOMNodeId',
    Boolean(zeroOpacityNode && zeroOpacityNode.backendDOMNodeId && zeroOpacityNode.backendDOMNodeId > 0),
    `zero-opacity-btn preserved backendDOMNodeId=${zeroOpacityNode?.backendDOMNodeId}`
  );

  // --- Test 1.2: Dynamic Elements & DOM Mutations ---
  console.log('\n[R1.2] Testing Dynamic Elements Injected post-load:');
  await page.evaluate(() => {
    const newBtn = document.createElement('button');
    newBtn.id = 'dynamic-async-btn';
    newBtn.textContent = 'Dynamically Added';
    newBtn.setAttribute('data-dynamic', 'true');
    document.body.appendChild(newBtn);

    const newSelect = document.createElement('select');
    newSelect.id = 'dynamic-select';
    newSelect.innerHTML = '<option value="dyn1">Dynamic 1</option><option value="dyn2">Dynamic 2</option>';
    document.body.appendChild(newSelect);
  });

  const r1Dynamic = await extractCDPAXTree(page, { resolveDOM: true });
  const dynBtn = r1Dynamic.interactiveNodes.find(n => n.domNode?.attributes.id === 'dynamic-async-btn');
  const dynSelect = r1Dynamic.interactiveNodes.find(n => n.domNode?.attributes.id === 'dynamic-select');

  recordTest(
    'R1.2a Dynamically Added Button Captured',
    Boolean(dynBtn && dynBtn.backendDOMNodeId && dynBtn.backendDOMNodeId > 0),
    `dynamic-async-btn captured with backendDOMNodeId=${dynBtn?.backendDOMNodeId}, selector="${dynBtn?.selector}"`
  );

  recordTest(
    'R1.2b Dynamically Added Select Captured',
    Boolean(dynSelect && dynSelect.backendDOMNodeId && dynSelect.backendDOMNodeId > 0),
    `dynamic-select captured with backendDOMNodeId=${dynSelect?.backendDOMNodeId}, role=${dynSelect?.role}`
  );

  // --- Test 1.3: Deeply Nested Elements & Complex DOM ---
  console.log('\n[R1.3] Testing Deeply Nested & Complex DOM Elements:');
  const nestedHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <div id="level-1">
        <section id="level-2">
          <article id="level-3">
            <div id="level-4">
              <span id="level-5">
                <a id="deeply-nested-link" href="https://example.com" class="nav-link special-cta">
                  <span>Click deeply nested</span>
                </a>
              </span>
            </div>
          </article>
        </section>
      </div>
      <div role="button" tabindex="0" class="btn primary-action flex-row" aria-label="Complex Role Button">
        <span>Custom Div Button</span>
      </div>
    </body>
    </html>
  `;
  await page.setContent(nestedHtml, { waitUntil: 'load' });
  const r1Nested = await extractCDPAXTree(page, { resolveDOM: true });

  const deepLink = r1Nested.interactiveNodes.find(n => n.domNode?.attributes.id === 'deeply-nested-link');
  const customDivBtn = r1Nested.interactiveNodes.find(n => n.role === 'button' && n.name === 'Complex Role Button');

  recordTest(
    'R1.3a Deeply Nested Link Preserves backendDOMNodeId',
    Boolean(deepLink && deepLink.backendDOMNodeId && deepLink.backendDOMNodeId > 0),
    `deeply-nested-link found at depth 5 with backendDOMNodeId=${deepLink?.backendDOMNodeId}`
  );

  recordTest(
    'R1.3b Custom ARIA button Preserves backendDOMNodeId',
    Boolean(customDivBtn && customDivBtn.backendDOMNodeId && customDivBtn.backendDOMNodeId > 0),
    `custom ARIA role=button found with backendDOMNodeId=${customDivBtn?.backendDOMNodeId}`
  );

  // --- Test 1.4: Direct CDP DOM.resolveNode verification on backendDOMNodeId ---
  console.log('\n[R1.4] Direct CDP DOM.resolveNode Verification:');
  const cdpClient = await context.newCDPSession(page);
  await cdpClient.send('DOM.enable');

  let directResolutionSuccessCount = 0;
  for (const node of r1Nested.interactiveNodes) {
    try {
      const resolved = await cdpClient.send('DOM.resolveNode', {
        backendNodeId: node.backendDOMNodeId
      });
      if (resolved.object && resolved.object.type === 'object' && resolved.object.subtype === 'node') {
        directResolutionSuccessCount++;
      }
    } catch (e) {
      console.error(`Failed to resolve backendDOMNodeId ${node.backendDOMNodeId}:`, e.message);
    }
  }
  await cdpClient.detach();

  recordTest(
    'R1.4 Direct CDP DOM.resolveNode for all interactive nodes',
    directResolutionSuccessCount === r1Nested.interactiveNodes.length,
    `Successfully resolved ${directResolutionSuccessCount}/${r1Nested.interactiveNodes.length} backendDOMNodeIds directly via CDP DOM.resolveNode`
  );

  // --- Test 1.5: Verify option resolveDOM=false ---
  console.log('\n[R1.5] Verify extractor behavior with resolveDOM=false:');
  const r1NoDom = await extractCDPAXTree(page, { resolveDOM: false });
  const allHaveBackendId = r1NoDom.allNodes.filter(n => n.backendDOMNodeId).length > 0;
  const noDomNodePopulated = r1NoDom.allNodes.every(n => n.domNode === undefined);
  recordTest(
    'R1.5 resolveDOM=false honors option and skips DOM describe',
    allHaveBackendId && noDomNodePopulated,
    `backendDOMNodeId preserved but domNode resolution skipped as requested`
  );

  await context.close();
}

async function runR2Challenges(browser) {
  console.log('\n===============================================================');
  console.log('--- CHALLENGE SUITE: R2 (Playwright Recorder & Replay Engine) ---');
  console.log('===============================================================');

  const fixturePath = path.resolve('fixtures/trace-fixture.html');
  const fixtureUrl = pathToFileURL(fixturePath).href;

  const replayer = new PlaywrightTraceReplayer();

  // --- Test 2.1: Empty Trace Handling ---
  console.log('\n[R2.1] Testing Empty Trace Handling:');
  const emptyTrace = {
    id: 'empty-test-trace',
    title: 'Empty Trace',
    targetUrl: fixtureUrl,
    startedAt: new Date().toISOString(),
    actions: [],
    viewport: { width: 1280, height: 800 }
  };

  const emptyResult = await replayer.replay(emptyTrace, { headless: true, browserInstance: browser });
  recordTest(
    'R2.1 Empty Trace Replay',
    emptyResult.success === true && emptyResult.executedSteps === 0 && emptyResult.totalSteps === 0,
    `Returned success=true, executedSteps=0, totalSteps=0 cleanly without crash`
  );

  // --- Test 2.2: Invalid Selector & Abort Behavior ---
  console.log('\n[R2.2] Testing Non-Existent Selector and Execution Abort:');
  const failingTrace = {
    id: 'failing-selector-trace',
    title: 'Failing Selector Trace',
    targetUrl: fixtureUrl,
    startedAt: new Date().toISOString(),
    actions: [
      {
        id: 'step-1',
        stepIdx: 1,
        type: 'fill',
        selector: '#user-name',
        value: 'Jane Doe',
        timestamp: Date.now()
      },
      {
        id: 'step-2',
        stepIdx: 2,
        type: 'click',
        selector: '#non-existent-button-99999',
        timestamp: Date.now()
      },
      {
        id: 'step-3',
        stepIdx: 3,
        type: 'click',
        selector: '#submit-form-btn',
        timestamp: Date.now()
      }
    ],
    viewport: { width: 1280, height: 800 }
  };

  const failResult = await replayer.replay(failingTrace, {
    headless: true,
    timeout: 800, // Short timeout for rapid test
    browserInstance: browser
  });

  const step1 = failResult.stepResults[0];
  const step2 = failResult.stepResults[1];
  const step3 = failResult.stepResults[2];

  recordTest(
    'R2.2a Step 1 succeeded before failure',
    step1 && step1.ok === true,
    `Step 1 filled #user-name successfully (${step1?.durationMs}ms)`
  );

  recordTest(
    'R2.2b Step 2 failed cleanly on non-existent selector',
    step2 && step2.ok === false && failResult.success === false && Boolean(failResult.error),
    `Step 2 failed with error: "${failResult.error?.substring(0, 60)}..."`
  );

  recordTest(
    'R2.2c Execution chain aborted on failure (Step 3 never executed)',
    step3 === undefined && failResult.executedSteps === 2 && failResult.totalSteps === 3,
    `Chain aborted after step 2; executedSteps=2 / totalSteps=3`
  );

  // --- Test 2.3: Syntactically Malformed CSS Selector Handling ---
  console.log('\n[R2.3] Testing Malformed CSS Selector:');
  const malformedTrace = {
    id: 'malformed-selector-trace',
    title: 'Malformed Selector Trace',
    targetUrl: fixtureUrl,
    startedAt: new Date().toISOString(),
    actions: [
      {
        id: 'step-1',
        stepIdx: 1,
        type: 'click',
        selector: 'div:invalid[[syntax',
        timestamp: Date.now()
      }
    ],
    viewport: { width: 1280, height: 800 }
  };

  const malformedResult = await replayer.replay(malformedTrace, {
    headless: true,
    timeout: 500,
    browserInstance: browser
  });

  recordTest(
    'R2.3 Malformed Selector Handled Without Unhandled Rejection',
    malformedResult.success === false && malformedResult.stepResults[0]?.ok === false,
    `Malformed selector failed gracefully: "${malformedResult.error?.substring(0, 60)}..."`
  );

  // --- Test 2.4: Step Timeout Parameter Conformance ---
  console.log('\n[R2.4] Testing Step Timeout Parameter:');
  const timeoutTrace = {
    id: 'timeout-test-trace',
    title: 'Timeout Test Trace',
    targetUrl: fixtureUrl,
    startedAt: new Date().toISOString(),
    actions: [
      {
        id: 'step-1',
        stepIdx: 1,
        type: 'click',
        selector: '#will-never-exist',
        timestamp: Date.now()
      }
    ],
    viewport: { width: 1280, height: 800 }
  };

  const t0 = performance.now();
  const timeoutResult = await replayer.replay(timeoutTrace, {
    headless: true,
    timeout: 700,
    browserInstance: browser
  });
  const elapsed = performance.now() - t0;

  recordTest(
    'R2.4 Timeout Option Respected (~700ms, not 10000ms default)',
    timeoutResult.success === false && elapsed >= 650 && elapsed < 2500,
    `Timeout occurred within ${Math.round(elapsed)}ms (expected around ~700ms)`
  );

  // --- Test 2.5: Intermediate State Assertion Failure ---
  console.log('\n[R2.5] Testing Intermediate State Assertion Failure:');
  const assertionFailTrace = {
    id: 'assertion-fail-trace',
    title: 'Assertion Failure Trace',
    targetUrl: fixtureUrl,
    startedAt: new Date().toISOString(),
    actions: [
      {
        id: 'step-1',
        stepIdx: 1,
        type: 'fill',
        selector: '#user-name',
        value: 'Actual Value',
        timestamp: Date.now(),
        expectedState: {
          selector: '#user-name',
          assertion: 'value',
          expected: 'Expected Something Else'
        }
      }
    ],
    viewport: { width: 1280, height: 800 }
  };

  const assertResult = await replayer.replay(assertionFailTrace, {
    headless: true,
    assertIntermediateStates: true,
    browserInstance: browser
  });

  recordTest(
    'R2.5 Intermediate Assertion Failure Detected & Flagged',
    assertResult.success === false &&
      assertResult.stepResults[0]?.assertionPassed === false &&
      assertResult.stepResults[0]?.error?.includes('Intermediate assertion failed'),
    `Assertion mismatch properly halted replay with assertionPassed=false`
  );

  // --- Test 2.6: Diverse Action Types (type, press without selector, uncheck, wait) ---
  console.log('\n[R2.6] Testing Diverse Action Types (type, press, check/uncheck, wait):');
  const diverseTrace = {
    id: 'diverse-actions-trace',
    title: 'Diverse Actions Trace',
    targetUrl: fixtureUrl,
    startedAt: new Date().toISOString(),
    actions: [
      {
        id: 'step-1',
        stepIdx: 1,
        type: 'type',
        selector: '#user-name',
        value: 'Grace Hopper',
        timestamp: Date.now(),
        expectedState: { selector: '#user-name', assertion: 'value', expected: 'Grace Hopper' }
      },
      {
        id: 'step-2',
        stepIdx: 2,
        type: 'check',
        selector: '#agree-terms',
        timestamp: Date.now(),
        expectedState: { selector: '#agree-terms', assertion: 'checked', expected: true }
      },
      {
        id: 'step-3',
        stepIdx: 3,
        type: 'uncheck',
        selector: '#agree-terms',
        timestamp: Date.now(),
        expectedState: { selector: '#agree-terms', assertion: 'checked', expected: false }
      },
      {
        id: 'step-4',
        stepIdx: 4,
        type: 'wait',
        value: '100',
        timestamp: Date.now()
      },
      {
        id: 'step-5',
        stepIdx: 5,
        type: 'press',
        key: 'Tab',
        timestamp: Date.now()
      }
    ],
    viewport: { width: 1280, height: 800 }
  };

  const diverseResult = await replayer.replay(diverseTrace, {
    headless: true,
    assertIntermediateStates: true,
    browserInstance: browser
  });

  recordTest(
    'R2.6 Diverse Action Types (type, check, uncheck, wait, global keyboard press)',
    diverseResult.success === true && diverseResult.executedSteps === 5,
    `All 5 diverse actions executed and validated successfully`
  );

  // --- Test 2.7: Recorder round-trip validation ---
  console.log('\n[R2.7] Testing Recorder-to-Replay Roundtrip:');
  const recContext = await browser.newContext();
  const recPage = await recContext.newPage();
  await recPage.goto(fixtureUrl, { waitUntil: 'load' });

  const recorder = new PlaywrightTraceRecorder(fixtureUrl, { title: 'Roundtrip Test' });
  await recorder.recordFill(recPage, '#user-email', 'grace@navy.mil');
  await recorder.recordPress(recPage, '#user-email', 'Enter');
  await recorder.recordWait(recPage, 50);
  const recordedTrace = recorder.finalize();
  await recContext.close();

  const exportedJson = recorder.exportJSON();
  const parsedTrace = JSON.parse(exportedJson);

  recordTest(
    'R2.7a Recorder JSON export/parse serialization',
    parsedTrace.actions.length === 3 && parsedTrace.title === 'Roundtrip Test',
    `Trace serialized to valid JSON with 3 recorded actions`
  );

  const roundtripResult = await replayer.replay(parsedTrace, {
    headless: true,
    browserInstance: browser
  });

  recordTest(
    'R2.7b Replaying serialized trace',
    roundtripResult.success === true && roundtripResult.executedSteps === 3,
    `Serialized trace replayed successfully (3/3 steps)`
  );
}

async function main() {
  console.log('===============================================================');
  console.log('  BarrierLens Challenger Suite: Empirical Verification of R1 & R2');
  console.log('===============================================================');

  const browser = await chromium.launch({ headless: true });
  try {
    await runR1Challenges(browser);
    await runR2Challenges(browser);

    console.log('\n===============================================================');
    console.log('CHALLENGE SUITE SUMMARY:');
    console.log(`Total tests: ${RESULTS.passed + RESULTS.failed}`);
    console.log(`Passed:      ${RESULTS.passed}`);
    console.log(`Failed:      ${RESULTS.failed}`);
    console.log('===============================================================');

    if (RESULTS.failed > 0) {
      console.error('\nVERDICT: REQUEST_CHANGES - One or more empirical challenge tests failed.');
      process.exit(1);
    } else {
      console.log('\nVERDICT: APPROVE - All empirical challenge tests passed with zero defects.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during challenge execution:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
