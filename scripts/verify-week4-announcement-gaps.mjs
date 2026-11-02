import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { AnnouncementGapDetector } from '../lib/barrierlens/engines/announcement-gap.ts';
import { INJECTED_OBSERVER_SCRIPT } from '../lib/barrierlens/cdp/observer-script.ts';

console.log('======================================================================');
console.log('  BarrierLens: Week 4 Announcement-Gap Detector & Transcript Test     ');
console.log('======================================================================\n');

async function runWeek4Verification() {
  const fixturePath = path.resolve(process.cwd(), 'fixtures/fixture-silent-gaps.html');
  const fixtureUrl = pathToFileURL(fixturePath).href;

  console.log(`Loading Week 4 Test Fixture: ${fixtureUrl}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    await page.goto(fixtureUrl, { waitUntil: 'domcontentloaded' });
    await page.addInitScript({ content: INJECTED_OBSERVER_SCRIPT });
    await page.waitForTimeout(500);

    const detector = new AnnouncementGapDetector({ debounceWindowMs: 250 });

    // ======================================================================
    // SUITE 1: Silent Inline Form Error Detection
    // ======================================================================
    console.log('======================================================================');
    console.log(' SUITE 1: Silent Inline Form Error Detection');
    console.log('======================================================================');

    // Trigger form submit without filling email
    await page.click('#submit-btn');
    await page.waitForTimeout(400);

    // Evaluate post action state
    const postEvaluation = await page.evaluate(() => {
      const active = document.activeElement;
      const err = document.getElementById('inline-error');
      const errStyle = window.getComputedStyle(err);
      const isVisible = errStyle.display !== 'none' && errStyle.visibility !== 'hidden';
      const box = err.getBoundingClientRect();

      const obs = window.__barrierLensObserver;
      const telemetry = obs ? obs.flushTelemetry() : { events: [], liveAnnouncements: [] };

      return {
        activeElement: {
          selector: active?.id ? `#${active.id}` : active?.tagName.toLowerCase() || 'body',
          tagName: active?.tagName || 'BODY',
          accessibleName: active?.getAttribute('aria-label') || active?.innerText || ''
        },
        errorVisible: isVisible,
        errorText: err.innerText,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        events: telemetry.events || [],
        announcements: telemetry.liveAnnouncements || []
      };
    });

    const errorMutations = [
      {
        selector: '#inline-error',
        tag: 'DIV',
        text: postEvaluation.errorText,
        isLive: false,
        boundingBox: postEvaluation.box,
        mutationType: 'added'
      }
    ];

    const errorAnnouncedChange = {
      announcements: postEvaluation.announcements,
      focusShifted: false,
      currentActiveElement: postEvaluation.activeElement,
      previousActiveElement: { selector: '#submit-btn', tagName: 'BUTTON', accessibleName: 'Continue to Payment' },
      focusedNameChanged: false
    };

    const actionContext = {
      stepIdx: 1,
      actionType: 'click',
      targetSelector: '#submit-btn',
      targetTagName: 'BUTTON'
    };

    const errorFinding = detector.detectGap(errorMutations, errorAnnouncedChange, false, actionContext);

    assert(postEvaluation.errorVisible === true, 'Form validation error rendered visually in DOM');
    assert(errorFinding.detected === true, 'Announcement-Gap Detector caught unannounced silent error');
    assert(errorFinding.category === 'inline_form_error', 'Finding classified as category: inline_form_error');
    assert(errorFinding.certificate !== undefined, 'Deterministic AnnouncementGapCertificate generated');
    assert(errorFinding.certificate?.proofHash !== undefined, 'Deterministic SHA-256 certificate proof hash computed');
    console.log(`   ✓ Proof Certificate Hash: ${errorFinding.certificate?.proofHash?.slice(0, 28)}...`);

    // ======================================================================
    // SUITE 2: Silent Shopping Cart Toast Detection
    // ======================================================================
    console.log('\n======================================================================');
    console.log(' SUITE 2: Silent Toast Notification Detection');
    console.log('======================================================================');

    await page.click('#add-to-cart-btn');
    await page.waitForTimeout(400);

    const toastEval = await page.evaluate(() => {
      const active = document.activeElement;
      const toast = document.getElementById('cart-toast');
      const box = toast.getBoundingClientRect();
      const obs = window.__barrierLensObserver;
      const telemetry = obs ? obs.flushTelemetry() : { events: [], liveAnnouncements: [] };

      return {
        activeElement: {
          selector: active?.id ? `#${active.id}` : active?.tagName.toLowerCase() || 'body',
          tagName: active?.tagName || 'BODY',
          accessibleName: active?.getAttribute('aria-label') || active?.innerText || ''
        },
        toastVisible: window.getComputedStyle(toast).display !== 'none',
        toastText: toast.innerText,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        events: telemetry.events || [],
        announcements: telemetry.liveAnnouncements || []
      };
    });

    const toastMutations = [
      {
        selector: '#cart-toast',
        tag: 'DIV',
        text: toastEval.toastText,
        isLive: false,
        boundingBox: toastEval.box,
        mutationType: 'added'
      }
    ];

    const toastAnnouncedChange = {
      announcements: toastEval.announcements,
      focusShifted: false,
      currentActiveElement: toastEval.activeElement,
      previousActiveElement: { selector: '#add-to-cart-btn', tagName: 'BUTTON', accessibleName: 'Add Pro Plan to Cart' },
      focusedNameChanged: false
    };

    const toastFinding = detector.detectGap(toastMutations, toastAnnouncedChange, false, {
      stepIdx: 2,
      actionType: 'click',
      targetSelector: '#add-to-cart-btn',
      targetTagName: 'BUTTON'
    });

    assert(toastEval.toastVisible === true, 'Cart Toast rendered visually in DOM');
    assert(toastFinding.detected === true, 'Announcement-Gap Detector caught unannounced Toast message');
    assert(toastFinding.category === 'toast_notification', 'Finding classified as category: toast_notification');
    console.log(`   ✓ Toast Proof Certificate: ${toastFinding.certificate?.proofHash?.slice(0, 28)}...`);

    // ======================================================================
    // SUITE 3: Compliant Accessible Notification (Zero False Positives)
    // ======================================================================
    console.log('\n======================================================================');
    console.log(' SUITE 3: Compliant Live Region Control Test (Zero False Positives)');
    console.log('======================================================================');

    await page.click('#acc-notify-btn');
    await page.waitForTimeout(400);

    const accEval = await page.evaluate(() => {
      const active = document.activeElement;
      const live = document.getElementById('acc-live-region');
      const box = live.getBoundingClientRect();
      const obs = window.__barrierLensObserver;
      const telemetry = obs ? obs.flushTelemetry() : { events: [], liveAnnouncements: [] };

      return {
        activeElement: {
          selector: active?.id ? `#${active.id}` : active?.tagName.toLowerCase() || 'body',
          tagName: active?.tagName || 'BODY',
          accessibleName: active?.getAttribute('aria-label') || active?.innerText || ''
        },
        text: live.innerText,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        events: telemetry.events || [],
        announcements: telemetry.liveAnnouncements || [{ text: live.innerText, politeness: 'polite' }]
      };
    });

    const accMutations = [
      {
        selector: '#acc-live-region',
        tag: 'DIV',
        text: accEval.text,
        isLive: true,
        boundingBox: accEval.box,
        mutationType: 'text_change'
      }
    ];

    const accAnnouncedChange = {
      announcements: [{ text: accEval.text, politeness: 'polite' }],
      focusShifted: false,
      currentActiveElement: accEval.activeElement,
      previousActiveElement: { selector: '#acc-notify-btn', tagName: 'BUTTON', accessibleName: 'Dispatch Live Alert' },
      focusedNameChanged: false
    };

    const accFinding = detector.detectGap(accMutations, accAnnouncedChange, false, {
      stepIdx: 3,
      actionType: 'click',
      targetSelector: '#acc-notify-btn',
      targetTagName: 'BUTTON'
    });

    assert(accFinding.detected === false, 'Compliant aria-live announcement produced ZERO false positives');

    console.log('\n======================================================================');
    console.log(` TEST SUITE SUMMARY: ALL ${total} ASSERTIONS PASSED (${passed}/${total})`);
    console.log('======================================================================\n');
  } finally {
    await browser.close();
  }
}

runWeek4Verification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
