import { chromium } from 'playwright';

export class PlaywrightTraceReplayer {
  /**
   * Replays a structured trace against a fresh browser context with step verification
   */
  async replay(trace, options = {}) {
    const startedAt = performance.now();
    let ownBrowser = null;
    let browser;

    if (options.browserInstance) {
      browser = options.browserInstance;
    } else {
      ownBrowser = await chromium.launch({
        headless: options.headless !== false,
        slowMo: options.slowMo || 0
      });
      browser = ownBrowser;
    }

    let context = null;
    let page = null;
    const stepResults = [];
    const timeout = options.timeout || 10000;

    try {
      // 1. Launch a completely fresh context to isolate state
      context = await browser.newContext({
        viewport: trace.viewport || { width: 1280, height: 800 }
      });
      page = await context.newPage();

      // 2. Navigate to target URL
      await page.goto(trace.targetUrl, { waitUntil: 'load', timeout: 30000 });

      // 3. Sequentially replay actions with verification
      for (const action of trace.actions) {
        const stepStart = performance.now();
        let ok = true;
        let stepError;
        let assertionPassed;

        try {
          if (action.selector) {
            await page.waitForSelector(action.selector, { state: 'attached', timeout });
          }

          switch (action.type) {
            case 'click':
              if (!action.selector) throw new Error('Click action requires a selector');
              await page.click(action.selector, { timeout });
              break;

            case 'fill':
              if (!action.selector) throw new Error('Fill action requires a selector');
              await page.fill(action.selector, action.value ?? '', { timeout });
              break;

            case 'type':
              if (!action.selector) throw new Error('Type action requires a selector');
              await page.locator(action.selector).pressSequentially(action.value ?? '', { delay: 20 });
              break;

            case 'press':
              if (action.selector) {
                await page.press(action.selector, action.key || 'Enter', { timeout });
              } else {
                await page.keyboard.press(action.key || 'Enter');
              }
              break;

            case 'check':
              if (!action.selector) throw new Error('Check action requires a selector');
              await page.check(action.selector, { timeout });
              break;

            case 'uncheck':
              if (!action.selector) throw new Error('Uncheck action requires a selector');
              await page.uncheck(action.selector, { timeout });
              break;

            case 'selectOption':
              if (!action.selector) throw new Error('SelectOption action requires a selector');
              await page.selectOption(action.selector, action.value ?? '', { timeout });
              break;

            case 'wait':
              const waitDuration = action.value ? parseInt(action.value, 10) : 300;
              await page.waitForTimeout(waitDuration);
              break;

            case 'goto':
              if (action.value) {
                await page.goto(action.value, { waitUntil: 'load', timeout });
              }
              break;

            default:
              console.warn(`[Replay Engine] Unsupported action type: ${action.type}`);
          }

          // Intermediate state assertion if configured
          if (action.expectedState && options.assertIntermediateStates !== false) {
            assertionPassed = await this.verifyExpectedState(page, action.expectedState);
            if (!assertionPassed) {
              throw new Error(
                `Intermediate assertion failed for step ${action.stepIdx} (${action.expectedState.assertion} on ${action.expectedState.selector})`
              );
            }
          }
        } catch (err) {
          ok = false;
          stepError = err.message;
        }

        const stepDuration = Math.round(performance.now() - stepStart);
        stepResults.push({
          stepIdx: action.stepIdx,
          actionType: action.type,
          selector: action.selector,
          ok,
          durationMs: stepDuration,
          error: stepError,
          assertionPassed
        });

        if (!ok) {
          break;
        }
      }

      const allOk = stepResults.length === trace.actions.length && stepResults.every((s) => s.ok);
      const totalDuration = Math.round(performance.now() - startedAt);
      const finalUrl = page.url();

      let finalDomState = {};
      try {
        if (options.extractDomState) {
          finalDomState = await options.extractDomState(page);
        } else {
          finalDomState = {
            url: page.url(),
            title: await page.title()
          };
        }
      } catch {
        // Ignore if page closed or detached
      }

      return {
        traceId: trace.id,
        totalSteps: trace.actions.length,
        executedSteps: stepResults.length,
        success: allOk,
        stepResults,
        durationMs: totalDuration,
        finalUrl,
        finalDomState,
        error: allOk ? undefined : stepResults.find((s) => !s.ok)?.error
      };
    } finally {
      if (context) await context.close();
      if (ownBrowser) await ownBrowser.close();
    }
  }

  /**
   * Evaluate intermediate state assertions against current page DOM
   */
  async verifyExpectedState(page, expected) {
    try {
      const { selector, assertion, expected: targetVal, attributeName } = expected;
      await page.waitForSelector(selector, { state: 'attached', timeout: 3000 });

      switch (assertion) {
        case 'value': {
          const val = await page.inputValue(selector);
          return val === targetVal;
        }
        case 'textContent': {
          const text = (await page.textContent(selector)) || '';
          return text.includes(String(targetVal));
        }
        case 'checked': {
          const isChecked = await page.isChecked(selector);
          return isChecked === Boolean(targetVal);
        }
        case 'visible': {
          const isVisible = await page.isVisible(selector);
          return isVisible === Boolean(targetVal);
        }
        case 'attribute': {
          if (!attributeName) return false;
          const attrVal = await page.getAttribute(selector, attributeName);
          return attrVal === String(targetVal);
        }
        default:
          return true;
      }
    } catch {
      return false;
    }
  }
}
