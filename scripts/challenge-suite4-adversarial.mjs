#!/usr/bin/env node

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

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';

// Engine dynamic imports evaluated under tsx loader
const gapModule = await import('../lib/barrierlens/engines/announcement-gap.ts');
const { AnnouncementGapDetector, computeProofHash } = gapModule;
const transcriptModule = await import('../lib/barrierlens/engines/transcript-from-run.ts');
const { transcriptItemsFromRun } = transcriptModule;
const observerModule = await import('../lib/barrierlens/cdp/observer-script.ts');
const { INJECTED_OBSERVER_SCRIPT } = observerModule;
const transcriptComponentModule = await import('../components/apple/ScreenReaderTranscript.tsx');
const { ScreenReaderTranscript } = transcriptComponentModule;

console.log('======================================================================');
console.log('   BarrierLens: Empirical Challenger Stress Harness (Suite 4)         ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
    if (details) console.log(`         ${details}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
    if (details) console.error(`         ${details}`);
    process.exitCode = 1;
  }
}

async function runAdversarialChallenge() {
  const detector = new AnnouncementGapDetector();

  // ======================================================================
  // CHALLENGE 1: Silent Inline Form Error Variations & Edge Cases
  // ======================================================================
  console.log('======================================================================');
  console.log(' CHALLENGE 1: Silent Inline Form Errors Stress Testing');
  console.log('======================================================================');

  // Case 1A: Error keyword variations
  const errorPhrases = [
    'Error: A valid email address is required',
    'Invalid credit card number format',
    'Password must contain at least 8 characters',
    'This field is required and cannot be blank',
    'Payment failed: insufficient funds',
    'Username does not match our records',
    'Please enter your phone number',
    'Access forbidden: invalid credentials'
  ];

  for (const phrase of errorPhrases) {
    const finding = detector.detectGap(
      [{ selector: '#form-feedback', text: phrase, tag: 'DIV', isLive: false, rect: { x: 10, y: 10, width: 200, height: 30 } }],
      {
        announcements: [],
        focusMoved: false,
        previousActiveElement: { selector: '#submit-btn', tagName: 'BUTTON', accessibleName: 'Submit' },
        currentActiveElement: { selector: '#submit-btn', tagName: 'BUTTON', accessibleName: 'Submit' },
        nameChanged: false
      }
    );
    assert(
      finding.detected === true && finding.category === 'inline_form_error',
      `Caught silent error phrase: "${phrase.slice(0, 32)}..."`,
      `Category: ${finding.category}, Missing: ${finding.missingAnnouncementType}`
    );
  }

  // Case 1B: Focus shifted to an irrelevant element vs remaining stationary
  const findingIrrelevantFocus = detector.detectGap(
    [{ selector: '#error-msg', text: 'Invalid zip code', tag: 'SPAN', isLive: false, rect: { x: 0, y: 0, width: 100, height: 20 } }],
    {
      announcements: [],
      focusMoved: true, // Focus shifted, but to another unrelated field (#next-field), NOT to the error
      previousActiveElement: { selector: '#zip-code', tagName: 'INPUT', accessibleName: 'Zip Code' },
      currentActiveElement: { selector: '#cancel-btn', tagName: 'BUTTON', accessibleName: 'Cancel' },
      nameChanged: false
    }
  );
  assert(
    findingIrrelevantFocus.detected === true && findingIrrelevantFocus.category === 'inline_form_error',
    'Inline error detected even when focus moved to an unrelated button',
    `Active element: #cancel-btn, Error selector: #error-msg`
  );

  // Case 1C: Focus shifted directly to the error message container (should NOT trigger gap!)
  const findingLegitimateFocusShift = detector.detectGap(
    [{ selector: '#error-msg', text: 'Invalid zip code', tag: 'SPAN', isLive: false, rect: { x: 0, y: 0, width: 100, height: 20 } }],
    {
      announcements: [],
      focusMoved: true,
      previousActiveElement: { selector: '#zip-code', tagName: 'INPUT', accessibleName: 'Zip Code' },
      currentActiveElement: { selector: '#error-msg', tagName: 'SPAN', accessibleName: 'Invalid zip code' },
      nameChanged: false
    }
  );
  assert(
    findingLegitimateFocusShift.detected === false,
    'Zero false positive when programmatic focus moves directly to the error container'
  );

  // ======================================================================
  // CHALLENGE 2: Silent Toast Notification Stress Testing
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 2: Silent Toast Notifications Stress Testing');
  console.log('======================================================================');

  const toastPhrases = [
    { text: 'Product BarrierLens Enterprise successfully added to cart', sel: '#toast-msg' },
    { text: 'Saved 4 draft items to cloud', sel: '.toast-container' },
    { text: 'Profile updated with new photo', sel: 'div.snackbar' },
    { text: 'Order placed: Confirmation #98214', sel: '.notification-bar' },
    { text: 'Item removed from wishlist', sel: '#alert-success' }
  ];

  for (const toast of toastPhrases) {
    const finding = detector.detectGap(
      [{ selector: toast.sel, text: toast.text, tag: 'DIV', isLive: false, rect: { x: 50, y: 50, width: 300, height: 50 } }],
      {
        announcements: [],
        focusMoved: false,
        previousActiveElement: { selector: '#action-btn', tagName: 'BUTTON', accessibleName: 'Save' },
        currentActiveElement: { selector: '#action-btn', tagName: 'BUTTON', accessibleName: 'Save' },
        nameChanged: false
      }
    );
    assert(
      finding.detected === true && finding.category === 'toast_notification',
      `Detected silent toast: "${toast.text.slice(0, 30)}..." (${toast.sel})`,
      `Missing: ${finding.missingAnnouncementType}, WCAG: ${finding.wcagCriteria?.join(', ')}`
    );
  }

  // ======================================================================
  // CHALLENGE 3: Unannounced Loading Spinner Detection
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 3: Unannounced Loading Spinner Detection');
  console.log('======================================================================');

  // Case 3A: Spinner DOM mutation with spinner class
  const spinnerFindingClass = detector.detectGap(
    [{ selector: '#sync-spinner', tag: 'SPAN', text: 'Loading data...', isLive: false, rect: { x: 0, y: 0, width: 24, height: 24 } }],
    {
      announcements: [],
      focusMoved: false,
      previousActiveElement: { selector: '#sync-btn', tagName: 'BUTTON', accessibleName: 'Sync' },
      currentActiveElement: { selector: '#sync-btn', tagName: 'BUTTON', accessibleName: 'Sync' },
      nameChanged: false
    }
  );
  assert(
    spinnerFindingClass.detected === true && spinnerFindingClass.category === 'loading_spinner',
    'Detected unannounced loading spinner via selector and text keywords',
    `Category: ${spinnerFindingClass.category}, WCAG: ${spinnerFindingClass.wcagCriteria?.join(', ')}`
  );
  assert(
    spinnerFindingClass.wcagCriteria?.includes('WCAG 4.1.3 Status Messages (Level AA)') &&
    spinnerFindingClass.wcagCriteria?.includes('WCAG 2.2.1 Timing Adjustable (Level A)'),
    'Loading spinner finding references WCAG 4.1.3 and 2.2.1'
  );

  // Case 3B: Spinner concluding silently
  const spinnerConcludedFinding = detector.detectGap(
    [{ selector: '.animate-spin', tag: 'DIV', text: 'Processing request...', isLive: false, rect: { x: 10, y: 10, width: 32, height: 32 } }],
    {
      announcements: [],
      focusMoved: false,
      previousActiveElement: { selector: '#submit-btn', tagName: 'BUTTON', accessibleName: 'Submit' },
      currentActiveElement: { selector: '#submit-btn', tagName: 'BUTTON', accessibleName: 'Submit' },
      nameChanged: false
    }
  );
  assert(
    spinnerConcludedFinding.detected === true && spinnerConcludedFinding.category === 'loading_spinner',
    'Detected spinner via Tailwind class animate-spin'
  );

  // ======================================================================
  // CHALLENGE 4: Compliant Live Regions & Zero False Positives Stress Test
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 4: Compliant Live Regions & False Positive Resistance');
  console.log('======================================================================');

  // 4A: Exact matching text in polite live announcement
  const politeExact = detector.detectGap(
    [{ selector: '#live-status', text: 'Settings updated successfully', tag: 'DIV', isLive: true }],
    {
      announcements: [{ text: 'Settings updated successfully', politeness: 'polite' }],
      focusMoved: false
    }
  );
  assert(politeExact.detected === false, 'Zero false positive on exact matching polite live announcement');

  // 4B: Token Jaccard approximate match (e.g. screen reader announces formatted prefix)
  const jaccardApprox = detector.detectGap(
    [{ selector: '#cart-msg', text: 'Added 2 items to shopping cart', tag: 'DIV', isLive: false, rect: { x: 0, y: 0, width: 100, height: 30 } }],
    {
      announcements: [{ text: 'Notice: 2 items added to shopping cart now', politeness: 'polite' }],
      focusMoved: false
    }
  );
  assert(jaccardApprox.detected === false, 'Zero false positive on approximate Token Jaccard match');

  // 4C: Assertive live announcement
  const assertiveAlert = detector.detectGap(
    [{ selector: '#alert-box', text: 'High temperature warning', tag: 'DIV', isLive: false, rect: { x: 0, y: 0, width: 100, height: 30 } }],
    {
      announcements: [{ text: 'Alert: Temperature critical', politeness: 'assertive' }],
      focusMoved: false
    }
  );
  assert(assertiveAlert.detected === false, 'Zero false positive when an assertive announcement was dispatched');

  // 4D: Mutation marked isLive: true directly on mutation payload
  const isLiveDirect = detector.detectGap(
    [{ selector: '#live-polite-region', text: 'Item updated', tag: 'DIV', isLive: true }],
    { announcements: [], focusMoved: false }
  );
  assert(isLiveDirect.detected === false, 'Zero false positive when DOM mutation node has isLive: true');

  // 4E: Sub-threshold noise mutation (empty / single character / microscopic rect)
  const tinyNoise = detector.detectGap(
    [{ selector: '#tiny-icon', text: ' ', tag: 'SPAN', isLive: false, rect: { x: 0, y: 0, width: 2, height: 2 } }],
    { announcements: [], focusMoved: false }
  );
  assert(tinyNoise.detected === false, 'Zero false positive on sub-threshold visual noise (<25px area, 0 chars)');

  // 4F: Accessible name change on active element
  const nameChangedMatch = detector.detectGap(
    [{ selector: '#toggle-btn', text: 'Mute Audio', tag: 'BUTTON', isLive: false, rect: { x: 0, y: 0, width: 80, height: 30 } }],
    {
      announcements: [],
      focusMoved: false,
      nameChanged: true,
      currentActiveName: 'Mute Audio',
      previousActiveName: 'Unmute Audio'
    }
  );
  assert(nameChangedMatch.detected === false, 'Zero false positive when active element accessible name changed to match mutation');

  // ======================================================================
  // CHALLENGE 5: SHA-256 Proof Hash Determinism & Geometric Sensitivity
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 5: SHA-256 Certificate Proof Hash Rigor');
  console.log('======================================================================');

  const actionA = { actionType: 'click', targetSelector: '#btn-1', targetTagName: 'BUTTON' };
  const deltaA = { selector: '#err-1', tagName: 'DIV', textContent: 'Required field', boundingBox: { x: 10, y: 20, width: 100, height: 30 } };
  const silenceA = { announcementsCount: 0, focusStationary: true, focusAfter: { selector: '#btn-1' }, focusedNameUnchanged: true };

  const hash1 = computeProofHash(actionA, deltaA, silenceA);
  const hash2 = computeProofHash(actionA, deltaA, silenceA);

  assert(hash1 === hash2, 'Identical inputs produce identical deterministic SHA-256 proof hash', `Hash: ${hash1}`);
  assert(typeof hash1 === 'string' && hash1.length === 64, 'Proof hash is valid 64-character SHA-256 hex string');

  // Change geometry by 1px
  const deltaModifiedBox = { ...deltaA, boundingBox: { x: 11, y: 20, width: 100, height: 30 } };
  const hashModifiedBox = computeProofHash(actionA, deltaModifiedBox, silenceA);
  assert(hash1 !== hashModifiedBox, 'Geometric perturbation (1px shift) produces completely distinct SHA-256 hash', `Modified: ${hashModifiedBox}`);

  // Change text content
  const deltaModifiedText = { ...deltaA, textContent: 'Required field missing' };
  const hashModifiedText = computeProofHash(actionA, deltaModifiedText, silenceA);
  assert(hash1 !== hashModifiedText, 'Text perturbation produces distinct SHA-256 hash');

  // ======================================================================
  // CHALLENGE 6: Screen Reader Transcript Generation (transcriptItemsFromRun)
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 6: Reading Order Transcript Generation (transcriptItemsFromRun)');
  console.log('======================================================================');

  const mockRun = {
    id: 'run-stress-test-001',
    targetUrl: 'https://barrierlens.test/checkout',
    goal: 'Complete checkout flow with credit card',
    startedAt: '2026-11-02T12:00:00.000Z',
    status: 'completed',
    steps: [
      {
        idx: 0,
        timestamp: Date.parse('2026-11-02T12:00:00.000Z'),
        actionType: 'type_text',
        targetSelector: '#email-input',
        activeElementAfter: 'Email address, edit text',
        status: 'success'
      },
      {
        idx: 1,
        timestamp: Date.parse('2026-11-02T12:00:01.500Z'),
        actionType: 'press_key',
        key: 'Tab',
        targetSelector: '#submit-btn',
        activeElementAfter: 'Continue to payment, button',
        status: 'success'
      },
      {
        idx: 2,
        timestamp: Date.parse('2026-11-02T12:00:03.200Z'),
        actionType: 'press_key',
        key: 'Enter',
        targetSelector: '#submit-btn',
        activeElementAfter: 'Continue to payment, button',
        status: 'success'
      }
    ],
    findings: [
      {
        id: 'finding-silent-gap-1',
        stepIdx: 2,
        kind: 'silent_state_change',
        category: 'inline_error',
        summary: 'Error: Email address is invalid appeared visually with 0 announcements',
        gapCertificate: {
          proofHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'
        }
      },
      {
        id: 'finding-trap-1',
        stepIdx: 1,
        kind: 'keyboard_trap',
        category: 'navigation',
        summary: 'Tarjan SCC trap detected on #modal-dialog'
      }
    ]
  };

  const transcript = transcriptItemsFromRun(mockRun);

  assert(Array.isArray(transcript), 'transcriptItemsFromRun returns an array');
  assert(transcript.length >= 5, `Generated ${transcript.length} transcript items`);

  // Verify opening item
  assert(
    transcript[0].type === 'speech' && transcript[0].tag === 'NAV' && transcript[0].text.includes('Opened https://barrierlens.test/checkout'),
    'First transcript item is auditory navigation entry with goal & URL'
  );

  // Verify typed step speech item
  const typedItem = transcript.find(t => t.id === 'run-stress-test-001-step-0');
  assert(
    typedItem && typedItem.text.includes('Typed into Email address, edit text'),
    'Step 0 properly formatted for type_text action',
    typedItem?.text
  );

  // Verify Tab key step
  const tabItem = transcript.find(t => t.id === 'run-stress-test-001-step-1');
  assert(
    tabItem && tabItem.tag === 'TAB' && tabItem.text.includes('Pressed Tab'),
    'Step 1 properly tagged as TAB key press'
  );

  // Verify Silent Gap item co-located at Step 2
  const gapItem = transcript.find(t => t.id === 'finding-silent-gap-1');
  assert(
    gapItem !== undefined && gapItem.type === 'silent_gap' && gapItem.tag === 'SILENT',
    'Silent gap finding injected as silent_gap bubble at appropriate step',
    `Tag: ${gapItem?.tag}, Certificate: ${gapItem?.proofCertificate}`
  );
  assert(
    gapItem?.proofCertificate === 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    'Silent gap bubble contains exact SHA-256 proof certificate hash'
  );

  // Verify Keyboard Trap item
  const trapItem = transcript.find(t => t.id === 'finding-trap-1');
  assert(
    trapItem !== undefined && trapItem.type === 'silent_gap' && trapItem.tag === 'KEYBOARD TRAP',
    'Keyboard trap finding surfaced with KEYBOARD TRAP tag'
  );

  // Edge case: Empty run with zero steps
  const emptyRun = { id: 'empty-run', targetUrl: 'about:blank', goal: 'Test empty', startedAt: '', steps: [], findings: [] };
  const emptyTranscript = transcriptItemsFromRun(emptyRun);
  assert(emptyTranscript.length === 1 && emptyTranscript[0].type === 'speech', 'Empty run produces clean single navigation speech item');

  // ======================================================================
  // CHALLENGE 7: Browser-Driven Fixture Test for Loading Spinner Lifecycle
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 7: Browser-Driven Fixture Test for Loading Spinner Lifecycle');
  console.log('======================================================================');

  const fixturePath = path.resolve(process.cwd(), 'fixtures/fixture-silent-gaps.html');
  const fixtureUrl = pathToFileURL(fixturePath).href;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // Correct lifecycle: addInitScript BEFORE navigation ensures observer is active from inception
    await page.addInitScript({ content: INJECTED_OBSERVER_SCRIPT });
    await page.goto(fixtureUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const observerInstalled = await page.evaluate(() => Boolean(window.__barrierLensObserver?.isInstalled()));
    assert(observerInstalled === true, 'Injected CDP observer script is successfully installed on page');

    // Step A: Trigger the silent sync spinner button in fixture
    await page.click('#sync-btn');
    await page.waitForTimeout(200);

    const spinnerEval = await page.evaluate(() => {
      const active = document.activeElement;
      const syncStatus = document.getElementById('sync-status');
      const syncSpinner = document.getElementById('sync-spinner');
      const spinnerBox = syncSpinner.getBoundingClientRect();
      const statusBox = syncStatus.getBoundingClientRect();
      const isVisible = window.getComputedStyle(syncStatus).display !== 'none';

      const obs = window.__barrierLensObserver;
      const announcements = obs ? obs.getAnnouncements() : [];

      return {
        activeElement: {
          selector: active?.id ? `#${active.id}` : active?.tagName.toLowerCase() || 'body',
          tagName: active?.tagName || 'BODY',
          accessibleName: active?.getAttribute('aria-label') || active?.innerText || ''
        },
        isVisible,
        spinnerBox: { x: spinnerBox.x, y: spinnerBox.y, width: spinnerBox.width, height: spinnerBox.height },
        statusBox: { x: statusBox.x, y: statusBox.y, width: statusBox.width, height: statusBox.height },
        statusText: syncStatus.innerText,
        announcements
      };
    });

    assert(spinnerEval.isVisible === true, 'Loading spinner rendered visually in browser DOM');
    assert(spinnerEval.announcements.length === 0, 'No live announcements dispatched during spinner start');

    // Test 7A: Direct spinner element mutation detection
    const spinnerElementFinding = detector.detectGap(
      [
        {
          selector: '#sync-spinner',
          tag: 'SPAN',
          text: '',
          isLive: false,
          rect: spinnerEval.spinnerBox
        }
      ],
      {
        announcements: spinnerEval.announcements,
        focusMoved: false,
        currentActiveElement: spinnerEval.activeElement,
        previousActiveElement: { selector: '#sync-btn', tagName: 'BUTTON', accessibleName: 'Sync Repositories' },
        nameChanged: false
      },
      false,
      {
        stepIdx: 5,
        actionType: 'click',
        targetSelector: '#sync-btn',
        targetTagName: 'BUTTON'
      }
    );

    assert(spinnerElementFinding.detected === true, 'Announcement-Gap Detector caught unannounced loading spinner');
    assert(spinnerElementFinding.category === 'loading_spinner', 'Correctly classified as category: loading_spinner');
    assert(spinnerElementFinding.certificate !== undefined, 'Generated certificate for browser spinner gap');
    console.log(`   ✓ Spinner Start Certificate Hash: ${spinnerElementFinding.certificate?.proofHash?.slice(0, 28)}...`);

    // Step B: Wait for sync completion in fixture (fixture has 1000ms timer)
    await page.waitForTimeout(1100);

    const completionEval = await page.evaluate(() => {
      const syncStatus = document.getElementById('sync-status');
      const syncSpinner = document.getElementById('sync-spinner');
      const syncText = document.getElementById('sync-text');
      const spinnerHidden = window.getComputedStyle(syncSpinner).display === 'none';
      const textUpdated = syncText.innerText;

      const obs = window.__barrierLensObserver;
      const announcements = obs ? obs.getAnnouncements() : [];

      return {
        spinnerHidden,
        textUpdated,
        announcements
      };
    });

    assert(completionEval.spinnerHidden === true, 'Loading spinner dismissed after completion in fixture');
    assert(completionEval.textUpdated === 'Sync complete. 42 files updated.', 'Status text updated to completion message in fixture');
    assert(completionEval.announcements.length === 0, 'Still zero live announcements on process conclusion (silent completion)');

    // Test 7B: Silent conclusion update detection
    const conclusionFinding = detector.detectGap(
      [
        {
          selector: '#sync-text',
          tag: 'SPAN',
          text: completionEval.textUpdated,
          isLive: false,
          rect: { x: 50, y: 50, width: 250, height: 25 }
        }
      ],
      {
        announcements: completionEval.announcements,
        focusMoved: false,
        nameChanged: false
      }
    );

    assert(conclusionFinding.detected === true, 'Detected silent status update upon background sync conclusion');
    console.log(`   ✓ Conclusion Gap Certificate Hash: ${conclusionFinding.certificate?.proofHash?.slice(0, 28)}...`);

  } finally {
    await browser.close();
  }

  // ======================================================================
  // CHALLENGE 8: ScreenReaderTranscript React Component Rendering (SSR)
  // ======================================================================
  console.log('\n======================================================================');
  console.log(' CHALLENGE 8: ScreenReaderTranscript React Component Rendering');
  console.log('======================================================================');

  // Test 8A: Default rendering
  const defaultHtml = renderToStaticMarkup(React.createElement(ScreenReaderTranscript));
  assert(defaultHtml.includes('VoiceOver &amp; NVDA Auditory Feed') || defaultHtml.includes('VoiceOver & NVDA Auditory Feed'), 'Component renders VoiceOver badge');
  assert(defaultHtml.includes('Screen Reader Audio Transcript'), 'Component renders title');
  assert(defaultHtml.includes('Hear It Aloud (SpeechSynthesis)'), 'Component renders Hear It Aloud button');
  assert(defaultHtml.includes('2 Silent Gap(s) Detected'), 'Component computes and displays silent gap count');

  // Test 8B: Custom bubbles generated by transcriptItemsFromRun
  const customHtml = renderToStaticMarkup(React.createElement(ScreenReaderTranscript, { items: transcript }));
  assert(customHtml.includes('1 Silent Gap(s) Detected') || customHtml.includes('2 Silent Gap(s) Detected'), 'Component reflects custom run silent gap count');
  assert(customHtml.includes('SILENT STATE CHANGE (UNANNOUNCED)'), 'Component highlights unannounced silent state changes');
  assert(customHtml.includes('a1b2c3d4e5f60718'), 'Component renders certificate hash snippet in DOM');

  // ======================================================================
  // SUMMARY
  // ======================================================================
  console.log('\n======================================================================');
  console.log(` EMPIRICAL CHALLENGER SUMMARY: ${passedTests}/${totalTests} PASSED (Failed: ${failedTests})`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdversarialChallenge().catch(err => {
  console.error('Adversarial challenge execution failed with unhandled error:', err);
  process.exit(1);
});
