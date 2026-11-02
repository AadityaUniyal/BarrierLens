#!/usr/bin/env node

/**
 * BarrierLens Week 2 Focus Graph Engine & Detection Automated Test Suite
 * 
 * Verifies:
 * - Suite 1 (Fixture A): Empirical focus traversal, Tarjan SCC sink trap detection,
 *   Escape probe failure, and Trap Certificate generation (entry path, cycle, shortest sequence).
 * - Suite 2 (Fixture B): 2D visual sorting, Kendall's tau computation (tau < 0.60 assertion),
 *   CDP AX-tree extraction, and unreachable interactive control certificate detection.
 * - Suite 3 (Fixture C): Focus loss detection on DOM element deletion, composite tablist
 *   roving tabindex arrow navigation, and intentional modal Escape probe verifying zero false positives.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Transparently ensure execution under tsx loader when invoked directly with `node`
if (!process.env.RUNNING_UNDER_TSX) {
  const result = spawnSync('npx', ['tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNING_UNDER_TSX: '1' },
    shell: true
  });
  process.exit(result.status ?? 0);
}

import { chromium } from 'playwright';

// Import FocusGraphEngine from TypeScript engine
const engineModule = await import('../lib/barrierlens/engines/focus-graph.ts');
const FocusGraphEngine = engineModule.FocusGraphEngine || engineModule.default?.FocusGraphEngine || engineModule.default;

// Import CDP AX Tree Extractor
const cdpModule = await import('../lib/barrierlens/cdp/cdp-ax-extractor.mjs');
const extractCDPAXTree = cdpModule.extractCDPAXTree || cdpModule.default?.extractCDPAXTree || cdpModule.default;

const TEST_RESULTS = {
  suite1: { passed: false, checks: [] },
  suite2: { passed: false, checks: [] },
  suite3: { passed: false, checks: [] }
};

function recordCheck(suiteKey, description, passed, detail = '') {
  TEST_RESULTS[suiteKey].checks.push({ description, passed, detail });
  const symbol = passed ? '  [PASS]' : '  [FAIL]';
  console.log(`${symbol} ${description} ${detail ? `(${detail})` : ''}`);
  if (!passed) {
    throw new Error(`Assertion failed in ${suiteKey}: ${description} - ${detail}`);
  }
}

async function runSuite1(browser) {
  console.log('\n======================================================================');
  console.log(' SUITE 1: Fixture A — Keyboard Trap (Sink SCC & Disabled Escape)');
  console.log('======================================================================');

  const fixturePath = path.resolve('fixtures/fixture-keyboard-trap.html');
  const fixtureUrl = pathToFileURL(fixturePath).href;

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    window.__name = (fn) => fn;
  });
  const page = await context.newPage();

  console.log(`[1.1] Loading Fixture A: ${fixtureUrl}`);
  await page.goto(fixtureUrl, { waitUntil: 'load' });

  // Ensure modal is open and active
  const isDialogOpen = await page.evaluate(() => {
    const dialog = document.getElementById('promo-trap-dialog');
    return dialog && dialog.hasAttribute('open');
  });
  recordCheck('suite1', 'Modal dialog #promo-trap-dialog is open', isDialogOpen);

  // Focus initial control inside trap
  await page.focus('#promo-input');

  console.log('[1.2] Executing empirical focus graph traversal...');
  const engine = new FocusGraphEngine();
  const traversal = await engine.traversePage(page, {
    maxSteps: 25,
    stepDelayMs: 40,
    probeShiftTab: true
  });

  console.log(`      Traversed ${traversal.nodes.length} focus nodes, recorded ${traversal.edges.length} directed transitions.`);

  const nodeIds = traversal.nodes.map(n => n.id);
  recordCheck('suite1', 'Node #promo-input reached in traversal', nodeIds.includes('#promo-input'));
  recordCheck('suite1', 'Node #promo-apply-btn reached in traversal', nodeIds.includes('#promo-apply-btn'));
  recordCheck('suite1', 'Node #promo-cancel-btn reached in traversal', nodeIds.includes('#promo-cancel-btn'));

  console.log('[1.3] Evaluating Tarjan Strongly Connected Components & Escape Key Probe...');
  const trapCert = await engine.findKeyboardTrapsLive(page);

  recordCheck('suite1', 'Tarjan SCC detected keyboard trap', trapCert !== null && trapCert.detected === true);
  recordCheck('suite1', 'Trap classified as modal_deadlock or sink_scc',
    trapCert?.trapType === 'modal_deadlock' || trapCert?.trapType === 'sink_scc',
    `trapType: ${trapCert?.trapType}`
  );
  recordCheck('suite1', 'Escape key probe was tested', trapCert?.testedEscape === true);
  recordCheck('suite1', 'Escape probe returned ignored (intercepted)',
    trapCert?.escapeResult === 'ignored',
    `escapeResult: ${trapCert?.escapeResult}`
  );
  recordCheck('suite1', 'Trapped component contains promo dialog controls',
    trapCert?.componentNodeIds.includes('#promo-input') &&
    trapCert?.componentNodeIds.includes('#promo-apply-btn') &&
    trapCert?.componentNodeIds.includes('#promo-cancel-btn')
  );
  recordCheck('suite1', 'Shortest reproducing key sequence generated',
    Array.isArray(trapCert?.reproducingKeySequence) && trapCert.reproducingKeySequence.length > 0,
    `Sequence: [${trapCert?.reproducingKeySequence.join(' -> ')}]`
  );
  recordCheck('suite1', 'Cycle transitions recorded in certificate',
    Array.isArray(trapCert?.cycleTransitions) && trapCert.cycleTransitions.length >= 1
  );

  console.log('\n--- Generated Trap Certificate (Fixture A) ---');
  console.log(JSON.stringify(trapCert, null, 2));

  await context.close();
  TEST_RESULTS.suite1.passed = true;
}

async function runSuite2(browser) {
  console.log('\n======================================================================');
  console.log(' SUITE 2: Fixture B — Disordered Focus Order & Unreachable Control');
  console.log('======================================================================');

  const fixturePath = path.resolve('fixtures/fixture-disordered-unreachable.html');
  const fixtureUrl = pathToFileURL(fixturePath).href;

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    window.__name = (fn) => fn;
  });
  const page = await context.newPage();

  console.log(`[2.1] Loading Fixture B: ${fixtureUrl}`);
  await page.goto(fixtureUrl, { waitUntil: 'load' });

  console.log('[2.2] Executing empirical focus graph traversal across 3x2 grid...');
  const engine = new FocusGraphEngine();
  const traversal = await engine.traversePage(page, {
    maxSteps: 20,
    stepDelayMs: 40,
    probeShiftTab: false
  });

  console.log(`      Traversed ${traversal.nodes.length} focus nodes.`);

  console.log('[2.3] Computing Kendall Tau (tau) Rank Correlation against visual reading order...');
  const tauMetric = engine.calculateKendallTau();

  console.log(`      Kendall Tau (tau): ${tauMetric.tau}`);
  console.log(`      Concordant pairs: ${tauMetric.concordantCount}, Discordant inversions: ${tauMetric.discordantCount}, Total: ${tauMetric.totalPairs}`);
  console.log(`      Focus order:  [${tauMetric.focusOrder.join(', ')}]`);
  console.log(`      Visual order: [${tauMetric.visualOrder.join(', ')}]`);

  recordCheck('suite2', 'Kendall tau is below 0.60 threshold',
    tauMetric.tau < 0.60,
    `tau = ${tauMetric.tau} < 0.60`
  );
  recordCheck('suite2', 'isAcceptable flag is false (Severe Discordance)',
    tauMetric.isAcceptable === false
  );
  recordCheck('suite2', 'Significant spatial inversions detected',
    tauMetric.inversionCount > 0,
    `inversions = ${tauMetric.inversionCount}`
  );

  console.log('[2.4] Extracting CDP Accessibility Tree & Cross-checking Interactive Controls...');
  const axResult = await extractCDPAXTree(page, { resolveDOM: true });
  console.log(`      Total AX nodes: ${axResult.allNodes.length}, Interactive nodes: ${axResult.interactiveNodes.length}`);

  const unreachable = engine.findUnreachableControls(axResult.interactiveNodes);
  console.log(`      Unreachable controls detected: ${unreachable.unreachableNodes.length}`);

  const foundOrphaned = unreachable.findings.some(
    f => f.selector.includes('#orphaned-export-btn') || f.accessibleName.includes('Export Data')
  );
  recordCheck('suite2', '#orphaned-export-btn detected as unreachable interactive control',
    foundOrphaned,
    `Found among ${unreachable.findings.length} unreachable findings`
  );

  recordCheck('suite2', 'Only truly orphaned controls reported unreachable (0 false positives)',
    unreachable.unreachableNodes.length === 1 && unreachable.findings.some(f => f.selector.includes('orphaned-export-btn')),
    `Reported unreachable count: ${unreachable.unreachableNodes.length}`
  );

  recordCheck('suite2', 'Unreachable control certificate generated',
    unreachable.certificate !== null && unreachable.certificate.detected === true,
    `trapType: ${unreachable.certificate?.trapType}`
  );

  const orphanedFinding = unreachable.findings.find(
    f => f.selector.includes('#orphaned-export-btn') || f.accessibleName.includes('Export Data')
  );
  recordCheck('suite2', 'Unreachable reason correctly attributed to negative_tabindex',
    orphanedFinding?.reason === 'negative_tabindex',
    `reason: ${orphanedFinding?.reason}`
  );

  console.log('\n--- Kendall Tau Metric (Fixture B) ---');
  console.log(JSON.stringify(tauMetric, null, 2));

  console.log('\n--- Unreachable Control Certificate (Fixture B) ---');
  console.log(JSON.stringify(unreachable.certificate, null, 2));

  await context.close();
  TEST_RESULTS.suite2.passed = true;
}

async function runSuite3(browser) {
  console.log('\n======================================================================');
  console.log(' SUITE 3: Fixture C — Focus Loss, Composite Widget & Accessible Modal');
  console.log('======================================================================');

  const fixturePath = path.resolve('fixtures/fixture-focus-loss.html');
  const fixtureUrl = pathToFileURL(fixturePath).href;

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    window.__name = (fn) => fn;
  });
  const page = await context.newPage();

  console.log(`[3.1] Loading Fixture C: ${fixtureUrl}`);
  await page.goto(fixtureUrl, { waitUntil: 'load' });

  const engine = new FocusGraphEngine();

  // --- Sub-test 3.1: Focus Loss Detection upon DOM Element Removal ---
  console.log('[3.2] Testing Focus Loss upon DOM Element Removal...');
  await page.focus('#delete-item-btn');
  const activeBeforeDelete = await page.evaluate(() => document.activeElement?.id);
  recordCheck('suite3', 'Initial focus set to #delete-item-btn', activeBeforeDelete === 'delete-item-btn');

  // Trigger deletion
  await page.click('#delete-item-btn');
  await page.waitForTimeout(100);

  const activeAfterDelete = await page.evaluate(() => {
    const el = document.activeElement;
    return !el || el === document.body || el === document.documentElement ? 'body' : el.id;
  });

  recordCheck('suite3', 'Focus dropped to document.body upon deletion',
    activeAfterDelete === 'body',
    `activeElement = ${activeAfterDelete}`
  );

  const lossFinding = engine.detectFocusLoss({
    beforeActiveElement: '#delete-item-btn',
    afterActiveElement: activeAfterDelete,
    triggerKey: 'Click/Enter',
    actionDescription: 'Removal of #cart-item-container dropped focus to document.body'
  });

  recordCheck('suite3', 'Focus loss detected and documented as WCAG 2.4.3 violation',
    lossFinding !== null && lossFinding.detected === true,
    lossFinding?.proofExplanation
  );

  // --- Sub-test 3.2: Composite Widget (Tablist) Arrow Navigation ---
  console.log('[3.3] Testing Composite Tablist Widget Roving Tabindex & Arrow Navigation...');
  await page.focus('#tab-1');
  const tab1Active = await page.evaluate(() => document.activeElement?.id);
  recordCheck('suite3', 'Focus landed on #tab-1 in tablist', tab1Active === 'tab-1');

  // Send physical ArrowRight
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const tab2Active = await page.evaluate(() => document.activeElement?.id);
  recordCheck('suite3', 'ArrowRight navigated focus to #tab-2', tab2Active === 'tab-2');

  // Send physical ArrowRight again
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const tab3Active = await page.evaluate(() => document.activeElement?.id);
  recordCheck('suite3', 'ArrowRight navigated focus to #tab-3', tab3Active === 'tab-3');

  // Send physical ArrowLeft
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(50);
  const tab2LeftActive = await page.evaluate(() => document.activeElement?.id);
  recordCheck('suite3', 'ArrowLeft navigated focus back to #tab-2', tab2LeftActive === 'tab-2');

  // Verify roving tabindex attributes
  const tabIndexes = await page.evaluate(() => ({
    tab1: document.getElementById('tab-1')?.getAttribute('tabindex'),
    tab2: document.getElementById('tab-2')?.getAttribute('tabindex'),
    tab3: document.getElementById('tab-3')?.getAttribute('tabindex')
  }));
  recordCheck('suite3', 'Roving tabindex maintained (tab2 is 0, others are -1)',
    tabIndexes.tab2 === '0' && tabIndexes.tab1 === '-1' && tabIndexes.tab3 === '-1'
  );

  // --- Sub-test 3.3: Intentional Compliant Modal Escape Probe ---
  console.log('[3.4] Testing Intentional Compliant Modal (Escape Probe & Immunity)...');
  await page.click('#open-acc-modal-btn');
  await page.waitForTimeout(100);

  const modalVisible = await page.evaluate(() => {
    const m = document.getElementById('accessible-modal');
    return m && m.hasAttribute('open');
  });
  recordCheck('suite3', 'Compliant modal #accessible-modal opened', modalVisible);

  // Probe Escape dismissal using engine.verifyModalEscape
  const escapeProbe = await engine.verifyModalEscape(page, '#accessible-modal');

  recordCheck('suite3', 'Escape key dismissed compliant modal', escapeProbe.escaped === true);
  recordCheck('suite3', 'Escape result is escaped_to_trigger',
    escapeProbe.result === 'escaped_to_trigger',
    `result: ${escapeProbe.result}`
  );
  recordCheck('suite3', 'Focus returned cleanly to trigger button #open-acc-modal-btn',
    escapeProbe.activeElementAfter === '#open-acc-modal-btn' || escapeProbe.activeElementAfter.includes('open-acc-modal-btn'),
    `activeElement: ${escapeProbe.activeElementAfter}`
  );

  // Confirm zero false-positive traps reported for compliant modal
  const falsePositiveCheck = await engine.findKeyboardTrapsLive(page);
  recordCheck('suite3', 'Zero false-positive traps reported for intentional accessible modal',
    falsePositiveCheck === null,
    'Compliant modal correctly exempted'
  );

  console.log('\n--- Focus Loss Finding (Fixture C) ---');
  console.log(JSON.stringify(lossFinding, null, 2));

  await context.close();
  TEST_RESULTS.suite3.passed = true;
}

async function main() {
  console.log('======================================================================');
  console.log('  BarrierLens: Week 2 Focus Graph Engine Automated Test Suite (M3)');
  console.log('======================================================================');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });

    await runSuite1(browser);
    await runSuite2(browser);
    await runSuite3(browser);

    console.log('\n======================================================================');
    console.log(' TEST SUITE SUMMARY: ALL 3 FIXTURE SUITES PASSED (Exit Code: 0)');
    console.log('======================================================================');
    console.log(`  ✓ Suite 1 (Keyboard Trap):                     PASSED (${TEST_RESULTS.suite1.checks.length} checks)`);
    console.log(`  ✓ Suite 2 (Disordered Reading & Unreachable):  PASSED (${TEST_RESULTS.suite2.checks.length} checks)`);
    console.log(`  ✓ Suite 3 (Focus Loss & Compliant Modal):      PASSED (${TEST_RESULTS.suite3.checks.length} checks)`);
    console.log('======================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL] Automated Verification Failed with error:', err.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
