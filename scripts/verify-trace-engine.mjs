import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { PlaywrightTraceRecorder } from '../lib/barrierlens/trace/recorder.mjs';
import { PlaywrightTraceReplayer } from '../lib/barrierlens/trace/replay.mjs';

async function main() {
  console.log('===============================================================');
  console.log('  BarrierLens: Automated Playwright Recorder & Replay Trace Engine Verification');
  console.log('===============================================================\n');

  let browser;
  try {
    const fixturePath = path.resolve('fixtures/trace-fixture.html');
    const fixtureUrl = pathToFileURL(fixturePath).href;
    console.log(`[1/5] Resolved test fixture: ${fixtureUrl}`);

    console.log('[2/5] Launching initial browser for recording user actions...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.goto(fixtureUrl, { waitUntil: 'load' });
    console.log('   ✓ Recording harness navigated to fixture.');

    const recorder = new PlaywrightTraceRecorder(fixtureUrl, {
      title: 'Accessible Profile & Modal Interaction Trace'
    });

    console.log('\n[3/5] Recording sequential interaction sequence:');

    // 1. Fill user name
    await recorder.recordFill(page, '#user-name', 'Ada Lovelace', 'Fill full name', {
      selector: '#user-name',
      assertion: 'value',
      expected: 'Ada Lovelace'
    });
    console.log('   ✓ [Step 1] Recorded fill #user-name -> "Ada Lovelace"');

    // 2. Fill user email
    await recorder.recordFill(page, '#user-email', 'ada@analytical.org', 'Fill email', {
      selector: '#user-email',
      assertion: 'value',
      expected: 'ada@analytical.org'
    });
    console.log('   ✓ [Step 2] Recorded fill #user-email -> "ada@analytical.org"');

    // 3. Select department
    await recorder.recordSelectOption(page, '#department-select', 'engineering', 'Select engineering department', {
      selector: '#department-select',
      assertion: 'value',
      expected: 'engineering'
    });
    console.log('   ✓ [Step 3] Recorded selectOption #department-select -> "engineering"');

    // 4. Check terms checkbox
    await recorder.recordCheck(page, '#agree-terms', 'Check audit terms agreement', {
      selector: '#agree-terms',
      assertion: 'checked',
      expected: true
    });
    console.log('   ✓ [Step 4] Recorded check #agree-terms');

    // 5. Submit form
    await recorder.recordClick(page, '#submit-form-btn', 'Submit user profile form', {
      selector: '#submission-result',
      assertion: 'attribute',
      attributeName: 'data-state',
      expected: 'submitted'
    });
    console.log('   ✓ [Step 5] Recorded click #submit-form-btn (Form Submission)');

    // 6. Open modal dialog
    await recorder.recordClick(page, '#open-dialog-btn', 'Open support modal dialog', {
      selector: '#dialog-status',
      assertion: 'textContent',
      expected: 'Dialog opened'
    });
    console.log('   ✓ [Step 6] Recorded click #open-dialog-btn (Dialog Opened)');

    // 7. Type note inside dialog
    await recorder.recordFill(page, '#dialog-message', 'Automated replay trace is fully verified.', 'Type feedback note', {
      selector: '#dialog-message',
      assertion: 'value',
      expected: 'Automated replay trace is fully verified.'
    });
    console.log('   ✓ [Step 7] Recorded fill #dialog-message');

    // 8. Save note inside dialog
    await recorder.recordClick(page, '#save-dialog-btn', 'Save feedback note', {
      selector: '#dialog-status',
      assertion: 'textContent',
      expected: 'Note saved:'
    });
    console.log('   ✓ [Step 8] Recorded click #save-dialog-btn (Note Saved)');

    // 9. Close dialog
    await recorder.recordClick(page, '#close-dialog-btn', 'Close support modal dialog', {
      selector: '#dialog-status',
      assertion: 'textContent',
      expected: 'Dialog closed.'
    });
    console.log('   ✓ [Step 9] Recorded click #close-dialog-btn (Dialog Closed)');

    // Finalize trace
    const trace = recorder.finalize();
    console.log(`\n   ✓ Trace captured successfully: ID=${trace.id}, Total Actions=${trace.actions.length}`);

    // Close recording context and browser
    await context.close();
    await browser.close();
    browser = null;

    console.log('\n[4/5] Executing replay in a FRESH isolated browser context...');
    const replayer = new PlaywrightTraceReplayer();
    const replayResult = await replayer.replay(trace, {
      headless: true,
      assertIntermediateStates: true,
      extractDomState: async (page) => {
        return page.evaluate(() => {
          const sub = document.getElementById('submission-result');
          const diag = document.getElementById('support-dialog');
          const diagStatus = document.getElementById('dialog-status');
          return {
            submissionText: sub ? sub.textContent?.trim() : '',
            submissionState: sub ? sub.getAttribute('data-state') : null,
            dialogClosed: sub ? sub.getAttribute('data-dialog-closed') : null,
            dialogStatusText: diagStatus ? diagStatus.textContent?.trim() : '',
            dialogIsOpen: diag ? diag.hasAttribute('open') : false
          };
        });
      }
    });

    console.log(`   ✓ Replay execution completed in ${replayResult.durationMs}ms`);
    console.log(`   ✓ Steps executed: ${replayResult.executedSteps} / ${replayResult.totalSteps}`);
    console.log(`   ✓ Overall replay success: ${replayResult.success}`);

    if (!replayResult.success) {
      throw new Error(`FAIL: Trace replay failed with error: ${replayResult.error}`);
    }

    console.log('\n[5/5] Verifying final DOM conditions and state assertions on replayed page:');

    for (const step of replayResult.stepResults) {
      console.log(`   ✓ Step ${step.stepIdx} [${step.actionType} ${step.selector || ''}]: OK (${step.durationMs}ms, assertionPassed=${step.assertionPassed})`);
    }

    const { finalDomState } = replayResult;
    if (!finalDomState) {
      throw new Error('FAIL: Replay did not capture finalDomState.');
    }

    // Assert form was submitted properly in replay
    if (finalDomState.submissionState !== 'submitted') {
      throw new Error(`FAIL: Expected submissionState 'submitted', got '${finalDomState.submissionState}'`);
    }
    if (!finalDomState.submissionText.includes('Ada Lovelace')) {
      throw new Error(`FAIL: Expected submissionText to include 'Ada Lovelace', got '${finalDomState.submissionText}'`);
    }
    if (!finalDomState.submissionText.includes('engineering')) {
      throw new Error(`FAIL: Expected submissionText to include 'engineering', got '${finalDomState.submissionText}'`);
    }

    // Assert dialog was toggled and closed properly in replay
    if (finalDomState.dialogClosed !== 'true') {
      throw new Error(`FAIL: Expected dialogClosed 'true', got '${finalDomState.dialogClosed}'`);
    }
    if (finalDomState.dialogIsOpen) {
      throw new Error('FAIL: Dialog is still open; expected dialog to be closed.');
    }
    if (!finalDomState.dialogStatusText.includes('Dialog closed.')) {
      throw new Error(`FAIL: Expected dialogStatusText to indicate closed, got '${finalDomState.dialogStatusText}'`);
    }

    console.log('\nDOM State Verification Passed:');
    console.log(`   - Form submission status: "${finalDomState.submissionState}"`);
    console.log(`   - Form result text: "${finalDomState.submissionText}"`);
    console.log(`   - Dialog status text: "${finalDomState.dialogStatusText}"`);
    console.log(`   - Dialog closed flag: ${finalDomState.dialogClosed}`);

    console.log('\n===============================================================');
    console.log('VERIFICATION PASSED: Trace recording and replay engine verified successfully!');
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
