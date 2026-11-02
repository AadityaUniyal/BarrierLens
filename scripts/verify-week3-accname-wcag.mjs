#!/usr/bin/env node

/**
 * BarrierLens Week 3 Automated Verification Test Suite (Milestone 5)
 * 
 * Verifies:
 * - Suite 1: AccName Provenance & Diagnostics (empty names, poor labels, broken IDREFs, generic text, Step 2A bypass)
 * - Suite 2: CDP Cross-Check Comparator (Accessibility.getFullAXTree agreement >= 90%)
 * - Suite 3: Static WCAG Checks (WCAG 1.4.3 Contrast AA/AAA, WCAG 2.2 2.5.8 Target Size base/spacing/inline)
 * - Suite 4: Injected Observer Telemetry (focusin/focusout, live region mutations, microsecond timestamps)
 * - Suite 5: axe-core Baseline Comparison (color-contrast, button-name, image-alt rule violations and normalization)
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

// Engine dynamic imports evaluated under tsx loader
const accnameModule = await import('../lib/barrierlens/engines/accname-provenance.ts');
const { defaultAccNameEngine, compareWithCDP, parseHTMLToVirtualDOM } = accnameModule;

const wcagModule = await import('../lib/barrierlens/engines/static-wcag-checks.ts');
const { defaultStaticWCAGEngine } = wcagModule;

const axeModule = await import('../lib/barrierlens/engines/axe-baseline-runner.ts');
const { defaultAxeBaselineRunner } = axeModule;

const observerModule = await import('../lib/barrierlens/cdp/observer-script.ts');
const { INJECTED_OBSERVER_SCRIPT } = observerModule;

const cdpModule = await import('../lib/barrierlens/cdp/cdp-ax-extractor.ts');
const { extractCDPAXTree } = cdpModule;

const TEST_RESULTS = {
  suite1: { name: 'AccName Provenance & Diagnostics', passed: false, checks: [] },
  suite2: { name: 'CDP Cross-Check Comparator', passed: false, checks: [] },
  suite3: { name: 'Static WCAG Checks', passed: false, checks: [] },
  suite4: { name: 'Injected Observer Telemetry', passed: false, checks: [] },
  suite5: { name: 'axe-core Baseline Comparison', passed: false, checks: [] }
};

function recordCheck(suiteKey, description, passed, detail = '') {
  TEST_RESULTS[suiteKey].checks.push({ description, passed, detail });
  const symbol = passed ? '  [PASS]' : '  [FAIL]';
  console.log(`${symbol} ${description} ${detail ? `(${detail})` : ''}`);
  if (!passed) {
    throw new Error(`Assertion failed in ${suiteKey}: ${description} - ${detail}`);
  }
}

function hasDiagnosticCode(res, expectedCode) {
  const codes = (res.detailedDiagnostics || []).map(d => d.code);
  const aliasMap = {
    'UNLABELED_ICON_ONLY': ['UNLABELED_ICON_ONLY', 'UNLABELED_ICON', 'LABEL_WRAPS_ONLY_ICON'],
    'MISSING_LABEL_NO_SOURCES': ['MISSING_LABEL_NO_SOURCES', 'EMPTY_ACCESSIBLE_NAME'],
    'BROKEN_ARIA_LABELLEDBY': ['BROKEN_ARIA_LABELLEDBY', 'MISSING_LABELLEDBY_TARGET'],
    'GENERIC_NON_DESCRIPTIVE': ['GENERIC_NON_DESCRIPTIVE', 'GENERIC_NON_DESCRIPTIVE_NAME'],
    'EMPTY_IMAGE_NO_ALT': ['EMPTY_IMAGE_NO_ALT', 'IMAGE_MISSING_ALT']
  };
  const expectedList = aliasMap[expectedCode] || [expectedCode];
  return codes.some(c => expectedList.includes(c));
}

// ===========================================================================
// SUITE 1: AccName Provenance & Diagnostics
// ===========================================================================
async function runSuite1(page, docRoot) {
  console.log('\n======================================================================');
  console.log(' SUITE 1: AccName Provenance & Diagnostics');
  console.log('======================================================================');

  // 1.1 button#btn-unlabeled-icon (UNLABELED_ICON_ONLY)
  const btnIcon = docRoot.querySelector('#btn-unlabeled-icon');
  recordCheck('suite1', '#btn-unlabeled-icon exists in fixture', btnIcon !== null);
  const resIcon = defaultAccNameEngine.computeAccessibleName(btnIcon, {
    documentRoot: docRoot,
    elementSelector: '#btn-unlabeled-icon'
  });
  recordCheck('suite1', '#btn-unlabeled-icon computed accessible name is empty', resIcon.name === '', `name: "${resIcon.name}"`);
  recordCheck('suite1', '#btn-unlabeled-icon diagnosed as UNLABELED_ICON_ONLY',
    hasDiagnosticCode(resIcon, 'UNLABELED_ICON_ONLY'),
    `codes: [${(resIcon.detailedDiagnostics || []).map(d => d.code).join(', ')}]`
  );
  recordCheck('suite1', '#btn-unlabeled-icon flagged as isPoorOrEmpty', resIcon.isPoorOrEmpty === true);

  // 1.2 button#btn-empty-no-content (MISSING_LABEL_NO_SOURCES)
  const btnEmpty = docRoot.querySelector('#btn-empty-no-content');
  recordCheck('suite1', '#btn-empty-no-content exists in fixture', btnEmpty !== null);
  const resEmpty = defaultAccNameEngine.computeAccessibleName(btnEmpty, {
    documentRoot: docRoot,
    elementSelector: '#btn-empty-no-content'
  });
  recordCheck('suite1', '#btn-empty-no-content computed accessible name is empty', resEmpty.name === '');
  recordCheck('suite1', '#btn-empty-no-content diagnosed as MISSING_LABEL_NO_SOURCES',
    hasDiagnosticCode(resEmpty, 'MISSING_LABEL_NO_SOURCES'),
    `codes: [${(resEmpty.detailedDiagnostics || []).map(d => d.code).join(', ')}]`
  );

  // 1.3 button#btn-broken-labelledby (BROKEN_ARIA_LABELLEDBY)
  const btnBroken = docRoot.querySelector('#btn-broken-labelledby');
  recordCheck('suite1', '#btn-broken-labelledby exists in fixture', btnBroken !== null);
  const resBroken = defaultAccNameEngine.computeAccessibleName(btnBroken, {
    documentRoot: docRoot,
    elementSelector: '#btn-broken-labelledby'
  });
  recordCheck('suite1', '#btn-broken-labelledby diagnosed as BROKEN_ARIA_LABELLEDBY',
    hasDiagnosticCode(resBroken, 'BROKEN_ARIA_LABELLEDBY'),
    `codes: [${(resBroken.detailedDiagnostics || []).map(d => d.code).join(', ')}]`
  );

  // 1.4 button#btn-generic-text (GENERIC_NON_DESCRIPTIVE)
  const btnGeneric = docRoot.querySelector('#btn-generic-text');
  recordCheck('suite1', '#btn-generic-text exists in fixture', btnGeneric !== null);
  const resGeneric = defaultAccNameEngine.computeAccessibleName(btnGeneric, {
    documentRoot: docRoot,
    elementSelector: '#btn-generic-text'
  });
  recordCheck('suite1', '#btn-generic-text resolves to "click here"', resGeneric.name === 'click here', `name: "${resGeneric.name}"`);
  recordCheck('suite1', '#btn-generic-text diagnosed as GENERIC_NON_DESCRIPTIVE',
    hasDiagnosticCode(resGeneric, 'GENERIC_NON_DESCRIPTIVE'),
    `codes: [${(resGeneric.detailedDiagnostics || []).map(d => d.code).join(', ')}]`
  );

  // 1.5 img#img-no-alt (EMPTY_IMAGE_NO_ALT)
  const imgNoAlt = docRoot.querySelector('#img-no-alt');
  recordCheck('suite1', '#img-no-alt exists in fixture', imgNoAlt !== null);
  const resImg = defaultAccNameEngine.computeAccessibleName(imgNoAlt, {
    documentRoot: docRoot,
    elementSelector: '#img-no-alt'
  });
  recordCheck('suite1', '#img-no-alt resolves to empty name', resImg.name === '');
  recordCheck('suite1', '#img-no-alt diagnosed as EMPTY_IMAGE_NO_ALT',
    hasDiagnosticCode(resImg, 'EMPTY_IMAGE_NO_ALT'),
    `codes: [${(resImg.detailedDiagnostics || []).map(d => d.code).join(', ')}]`
  );

  // 1.6 button#btn-valid-labelledby (Multi-ID concatenation)
  const btnValid = docRoot.querySelector('#btn-valid-labelledby');
  recordCheck('suite1', '#btn-valid-labelledby exists in fixture', btnValid !== null);
  const resValid = defaultAccNameEngine.computeAccessibleName(btnValid, {
    documentRoot: docRoot,
    elementSelector: '#btn-valid-labelledby'
  });
  recordCheck('suite1', '#btn-valid-labelledby correctly concatenates multi-ID tokens to "Add to Wishlist"',
    resValid.name === 'Add to Wishlist',
    `name: "${resValid.name}"`
  );
  recordCheck('suite1', '#btn-valid-labelledby sets winning source to aria-labelledby', resValid.source === 'aria-labelledby');

  // 1.7 button#btn-hidden-ref (Step 2A hidden reference bypass exception)
  const btnHidden = docRoot.querySelector('#btn-hidden-ref');
  recordCheck('suite1', '#btn-hidden-ref exists in fixture', btnHidden !== null);
  const resHidden = defaultAccNameEngine.computeAccessibleName(btnHidden, {
    documentRoot: docRoot,
    elementSelector: '#btn-hidden-ref'
  });
  recordCheck('suite1', 'Step 2A bypass allows aria-labelledby to resolve display:none target text',
    resHidden.name === 'Hidden Action Text',
    `name: "${resHidden.name}"`
  );
  recordCheck('suite1', 'Step 2A bypass records matched 2A step in provenance trace',
    resHidden.steps.some(s => s.step === '2A' && s.status === 'matched')
  );

  TEST_RESULTS.suite1.passed = true;
}

// ===========================================================================
// SUITE 2: CDP Cross-Check Comparator
// ===========================================================================
async function runSuite2(page, docRoot) {
  console.log('\n======================================================================');
  console.log(' SUITE 2: CDP AX-Tree Cross-Check Comparator');
  console.log('======================================================================');

  console.log('[2.1] Extracting full Chromium CDP AX-Tree (Accessibility.getFullAXTree)...');
  const axTreeResult = await extractCDPAXTree(page, { resolveDOM: true, filterInteractiveOnly: false });
  recordCheck('suite2', 'CDP AX-Tree extracted successfully', Array.isArray(axTreeResult.allNodes) && axTreeResult.allNodes.length > 0);
  console.log(`      Extracted ${axTreeResult.allNodes.length} total AX nodes (${axTreeResult.interactiveNodes.length} interactive).`);

  const testSelectors = [
    '#btn-unlabeled-icon',
    '#btn-empty-no-content',
    '#btn-broken-labelledby',
    '#btn-generic-text',
    '#img-no-alt',
    '#btn-valid-labelledby',
    '#btn-hidden-ref',
    '#btn-trigger-mutation',
    '#target-failing-dense',
    '#target-passing-standard'
  ];

  let agreedCount = 0;
  let totalEvaluated = 0;
  const comparisons = [];

  for (const selector of testSelectors) {
    const virtualElem = docRoot.querySelector(selector);
    if (!virtualElem) continue;

    // Compute via W3C engine
    const w3cRes = defaultAccNameEngine.computeAccessibleName(virtualElem, {
      documentRoot: docRoot,
      elementSelector: selector
    });

    // Find in CDP AX-Tree
    const cdpNode = axTreeResult.allNodes.find(n => n.selector?.includes(selector.replace('#', '')) || n.selector === selector);
    const cdpName = cdpNode?.name || '';

    // Compare
    const comparison = compareWithCDP(w3cRes, cdpName, {
      selector,
      backendDOMNodeId: cdpNode?.backendDOMNodeId
    });

    comparisons.push(comparison);
    totalEvaluated++;
    if (comparison.agreement) {
      agreedCount++;
    }

    console.log(`      ${selector.padEnd(26)} -> W3C: "${w3cRes.name}" | CDP: "${cdpName}" | Status: ${comparison.status}`);
  }

  const overallAgreementRate = totalEvaluated > 0 ? (agreedCount / totalEvaluated) : 0;
  console.log(`\n      CDP AX-Tree Cross-Check: ${agreedCount}/${totalEvaluated} agreed (${(overallAgreementRate * 100).toFixed(1)}%).`);

  recordCheck('suite2', 'CDP Cross-Check evaluated all targeted fixture elements', totalEvaluated === testSelectors.length);
  recordCheck('suite2', 'CDP Agreement Rate meets or exceeds 90% threshold',
    overallAgreementRate >= 0.90,
    `Agreement rate: ${(overallAgreementRate * 100).toFixed(1)}% >= 90%`
  );

  TEST_RESULTS.suite2.passed = true;
}

// ===========================================================================
// SUITE 3: Static WCAG Checks (1.4.3 Contrast & 2.2 2.5.8 Target Size)
// ===========================================================================
async function runSuite3(page) {
  console.log('\n======================================================================');
  console.log(' SUITE 3: Static WCAG Checks (Contrast 1.4.3 & Target Size 2.5.8)');
  console.log('======================================================================');

  console.log('[3.1] Running Static WCAG 1.4.3 Color Contrast evaluations...');
  const contrastResults = await defaultStaticWCAGEngine.evaluateContrast(page);
  recordCheck('suite3', 'Evaluated contrast across page elements', contrastResults.length > 0);

  // 3.1.1 #contrast-failing (#777777 on #ffffff ~4.47:1)
  const failingContrast = contrastResults.find(c => c.selector.includes('contrast-failing'));
  recordCheck('suite3', '#contrast-failing evaluated', failingContrast !== undefined);
  recordCheck('suite3', '#contrast-failing fails AA requirement (< 4.5:1)',
    failingContrast?.passesAA === false && failingContrast?.contrastRatio < 4.5,
    `Ratio: ${failingContrast?.contrastRatio}:1 (passesAA: ${failingContrast?.passesAA})`
  );

  // 3.1.2 #contrast-passing (#000000 on #ffffff 21.0:1)
  const passingContrast = contrastResults.find(c => c.selector.includes('contrast-passing'));
  recordCheck('suite3', '#contrast-passing evaluated', passingContrast !== undefined);
  recordCheck('suite3', '#contrast-passing passes AA and AAA requirements (>= 7.0:1)',
    passingContrast?.passesAA === true && passingContrast?.passesAAA === true && passingContrast?.contrastRatio >= 7.0,
    `Ratio: ${passingContrast?.contrastRatio}:1`
  );

  // 3.1.3 #contrast-alpha (semi-transparent alpha compositing)
  const alphaContrast = contrastResults.find(c => c.selector.includes('contrast-alpha'));
  recordCheck('suite3', '#contrast-alpha evaluated via Porter-Duff alpha compositing',
    alphaContrast !== undefined && typeof alphaContrast?.contrastRatio === 'number',
    `Ratio: ${alphaContrast?.contrastRatio}:1`
  );

  console.log('\n[3.2] Running Static WCAG 2.2 2.5.8 Target Size evaluations...');
  const targetSizeResults = await defaultStaticWCAGEngine.evaluateTargetSize(page);
  recordCheck('suite3', 'Evaluated target size across page interactive elements', targetSizeResults.length > 0);

  // 3.2.1 #target-failing-dense (16x16px with 1px gap fails both base size and spacing exception)
  const denseTarget = targetSizeResults.find(t => t.selector.includes('target-failing-dense'));
  recordCheck('suite3', '#target-failing-dense evaluated', denseTarget !== undefined);
  recordCheck('suite3', '#target-failing-dense fails base size (< 24x24px)',
    denseTarget?.passesBaseSize === false,
    `Size: ${denseTarget?.width}x${denseTarget?.height}px`
  );
  recordCheck('suite3', '#target-failing-dense fails spacing exception due to neighbor collision',
    denseTarget?.passesSpacingException === false && denseTarget?.compliant === false,
    `compliant: ${denseTarget?.compliant}, closestNeighbor: ${denseTarget?.closestNeighborDistancePx}px`
  );

  // 3.2.2 #target-passing-spacing (16x16px isolated with > 12px margin passes spacing exception)
  const isolatedTarget = targetSizeResults.find(t => t.selector.includes('target-passing-spacing'));
  recordCheck('suite3', '#target-passing-spacing evaluated', isolatedTarget !== undefined);
  recordCheck('suite3', '#target-passing-spacing passes via 24px clearance circle spacing exception',
    isolatedTarget?.passesSpacingException === true && isolatedTarget?.compliant === true,
    `passesSpacingException: ${isolatedTarget?.passesSpacingException}, compliant: ${isolatedTarget?.compliant}`
  );

  // 3.2.3 #target-passing-standard (32x32px >= 24x24px passes directly)
  const standardTarget = targetSizeResults.find(t => t.selector.includes('target-passing-standard'));
  recordCheck('suite3', '#target-passing-standard evaluated', standardTarget !== undefined);
  recordCheck('suite3', '#target-passing-standard passes base size requirement',
    standardTarget?.passesBaseSize === true && standardTarget?.compliant === true,
    `Size: ${standardTarget?.width}x${standardTarget?.height}px`
  );

  // 3.2.4 #target-inline-link (inline text link passes inline exception)
  const inlineTarget = targetSizeResults.find(t => t.selector.includes('target-inline-link'));
  recordCheck('suite3', '#target-inline-link evaluated', inlineTarget !== undefined);
  recordCheck('suite3', '#target-inline-link exempt via inline exception',
    inlineTarget?.isInlineException === true && inlineTarget?.compliant === true,
    `isInlineException: ${inlineTarget?.isInlineException}`
  );

  // 3.3 Normalization into BarrierFinding
  const staticFindings = defaultStaticWCAGEngine.normalizeStaticViolations(contrastResults, targetSizeResults);
  const contrastFinding = staticFindings.find(f => f.kind === 'color_contrast_violation');
  const targetFinding = staticFindings.find(f => f.kind === 'target_size_violation');
  recordCheck('suite3', 'Static findings normalized to BarrierFinding schema (color_contrast_violation)',
    contrastFinding !== undefined && contrastFinding.trustTier === 'observed'
  );
  recordCheck('suite3', 'Static findings normalized to BarrierFinding schema (target_size_violation)',
    targetFinding !== undefined && targetFinding.trustTier === 'observed'
  );

  TEST_RESULTS.suite3.passed = true;
}

// ===========================================================================
// SUITE 4: Injected Observer Telemetry
// ===========================================================================
async function runSuite4(page) {
  console.log('\n======================================================================');
  console.log(' SUITE 4: Injected Observer & ARIA Live Telemetry');
  console.log('======================================================================');

  console.log('[4.1] Injecting client-side observer script...');
  await page.evaluate(INJECTED_OBSERVER_SCRIPT);

  const isInstalled = await page.evaluate(() => {
    return window.__barrierLensObserver?.isInstalled() === true;
  });
  recordCheck('suite4', 'window.__barrierLensObserver successfully installed', isInstalled);

  // Clear previous buffer to start clean test run
  await page.evaluate(() => window.__barrierLensObserver?.clear());

  console.log('[4.2] Triggering focus movement interactions (focusin / focusout)...');
  await page.focus('#btn-valid-labelledby');
  await page.waitForTimeout(50);

  await page.focus('#btn-trigger-mutation');
  await page.waitForTimeout(50);

  console.log('[4.3] Triggering ARIA live region mutation and DOM insertion...');
  await page.click('#btn-trigger-mutation');
  await page.waitForTimeout(100);

  console.log('[4.4] Flushing telemetry buffers from client ring buffer...');
  const flushedEvents = await page.evaluate(() => window.__barrierLensObserver.flushEvents());
  const flushedAnnouncements = await page.evaluate(() => window.__barrierLensObserver.flushAnnouncements());

  console.log(`      Flushed ${flushedEvents.length} events and ${flushedAnnouncements.length} live announcements.`);

  // Focusin event assertion
  const focusinEvents = flushedEvents.filter(e => e.type === 'focusin');
  recordCheck('suite4', 'Recorded focusin events with microsecond timestamps',
    focusinEvents.length >= 1 && focusinEvents.every(e => typeof e.timestamp === 'number' && e.timestamp > 0),
    `Count: ${focusinEvents.length}`
  );

  // Focusout event assertion
  const focusoutEvents = flushedEvents.filter(e => e.type === 'focusout');
  recordCheck('suite4', 'Recorded focusout events upon focus transfer',
    focusoutEvents.length >= 1,
    `Count: ${focusoutEvents.length}`
  );

  // ARIA live region announcement event assertion
  const statusAnnouncements = flushedAnnouncements.filter(a =>
    a.text?.includes('Profile updated') ||
    a.targetSelector?.includes('live-status-region') ||
    a.role === 'status'
  );
  recordCheck('suite4', 'Captured live region dynamic announcement with role="status"',
    statusAnnouncements.length >= 1,
    `Found announcement: "${statusAnnouncements[0]?.text}"`
  );
  recordCheck('suite4', 'Live region announcement politeness captured as polite',
    statusAnnouncements.some(a => a.politeness === 'polite'),
    `politeness: ${statusAnnouncements[0]?.politeness}`
  );

  TEST_RESULTS.suite4.passed = true;
}

// ===========================================================================
// SUITE 5: axe-core Baseline Comparison
// ===========================================================================
async function runSuite5(page) {
  console.log('\n======================================================================');
  console.log(' SUITE 5: axe-core Baseline Integration & Comparison');
  console.log('======================================================================');

  console.log('[5.1] Executing axe-core baseline evaluation in page context...');
  const axeOutput = await defaultAxeBaselineRunner.runEvaluation(page, {
    runId: 'week3_verification',
    stepIdx: 1
  });

  recordCheck('suite5', 'axe-core executed and produced evaluation output',
    axeOutput !== null && Array.isArray(axeOutput.violations)
  );

  console.log(`      Detected ${axeOutput.violations.length} distinct axe violation categories, ${axeOutput.normalizedFindings.length} normalized findings.`);

  // Rule: color-contrast
  const contrastRule = axeOutput.violations.find(v => v.ruleId === 'color-contrast');
  recordCheck('suite5', 'axe-core detected "color-contrast" violation on fixture',
    contrastRule !== undefined,
    `impact: ${contrastRule?.impact}`
  );

  // Rule: button-name
  const buttonNameRule = axeOutput.violations.find(v => v.ruleId === 'button-name');
  recordCheck('suite5', 'axe-core detected "button-name" violation on fixture',
    buttonNameRule !== undefined,
    `nodes affected: ${buttonNameRule?.nodes?.length}`
  );

  // Rule: image-alt
  const imageAltRule = axeOutput.violations.find(v => v.ruleId === 'image-alt');
  recordCheck('suite5', 'axe-core detected "image-alt" violation on fixture',
    imageAltRule !== undefined,
    `nodes affected: ${imageAltRule?.nodes?.length}`
  );

  // Normalized findings integrity
  const normalized = axeOutput.normalizedFindings;
  recordCheck('suite5', 'All normalized findings adhere to BarrierFinding unified schema',
    normalized.length > 0 && normalized.every(f =>
      f.kind === 'axe_violation' &&
      f.trustTier === 'observed' &&
      typeof f.severityScore === 'number' &&
      f.severityScore >= 0 &&
      f.severityScore <= 10 &&
      Array.isArray(f.wcagRules) &&
      f.wcagRules.length > 0
    )
  );

  recordCheck('suite5', 'Summary metrics correctly aggregated',
    axeOutput.summary.violationCount === normalized.length && axeOutput.summary.passCount >= 0
  );

  TEST_RESULTS.suite5.passed = true;
}

// ===========================================================================
// MAIN RUNNER
// ===========================================================================
async function main() {
  console.log('======================================================================');
  console.log('  BarrierLens: Week 3 Automated Verification Test Suite (M5)');
  console.log('======================================================================');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(() => {
      window.__name = (fn) => fn;
    });
    const page = await context.newPage();

    const fixturePath = path.resolve('fixtures/fixture-accname-wcag.html');
    const fixtureUrl = pathToFileURL(fixturePath).href;

    console.log(`Loading Week 3 HTML Fixture: ${fixtureUrl}`);
    await page.goto(fixtureUrl, { waitUntil: 'load' });

    // Parse HTML string to Virtual DOM for deterministic W3C engine evaluation
    const pageContent = await page.content();
    const docRoot = parseHTMLToVirtualDOM(pageContent);

    // Run all 5 suites
    await runSuite1(page, docRoot);
    await runSuite2(page, docRoot);
    await runSuite3(page);
    await runSuite4(page);
    await runSuite5(page);

    await context.close();

    console.log('\n======================================================================');
    console.log(' TEST SUITE SUMMARY: ALL 5 SUITES PASSED (Exit Code: 0)');
    console.log('======================================================================');
    for (const [key, suite] of Object.entries(TEST_RESULTS)) {
      console.log(`  ✓ ${suite.name.padEnd(42)}: PASSED (${suite.checks.length} checks)`);
    }
    console.log('======================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL] Automated Verification Failed with error:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
