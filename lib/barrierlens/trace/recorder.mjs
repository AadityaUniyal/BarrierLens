export class PlaywrightTraceRecorder {
  constructor(targetUrl, options = {}) {
    this.actionCount = 0;
    this.trace = {
      id: crypto.randomUUID(),
      title: options.title || 'Recorded Interaction Trace',
      targetUrl,
      startedAt: new Date().toISOString(),
      actions: [],
      viewport: options.viewport || { width: 1280, height: 800 },
      metadata: options.metadata || {}
    };
  }

  /**
   * Append a raw action to trace
   */
  addAction(actionData) {
    this.actionCount++;
    const action = {
      id: crypto.randomUUID(),
      stepIdx: this.actionCount,
      timestamp: actionData.timestamp || Date.now(),
      ...actionData
    };
    this.trace.actions.push(action);
    return action;
  }

  /**
   * Record and execute a click action
   */
  async recordClick(page, selector, description, expectedState) {
    try {
      await page.click(selector);
    } catch (err) {
      throw err;
    }
    return this.addAction({
      type: 'click',
      selector,
      description: description || `Click on ${selector}`,
      expectedState
    });
  }

  /**
   * Record and execute a fill input action
   */
  async recordFill(page, selector, value, description, expectedState) {
    try {
      await page.fill(selector, value);
    } catch (err) {
      throw err;
    }
    return this.addAction({
      type: 'fill',
      selector,
      value,
      description: description || `Fill ${selector} with "${value}"`,
      expectedState
    });
  }

  /**
   * Record and execute a press key action
   */
  async recordPress(page, selector, key, description, expectedState) {
    try {
      await page.press(selector, key);
    } catch (err) {
      throw err;
    }
    return this.addAction({
      type: 'press',
      selector,
      key,
      description: description || `Press ${key} on ${selector}`,
      expectedState
    });
  }

  /**
   * Record and execute a checkbox check action
   */
  async recordCheck(page, selector, description, expectedState) {
    try {
      await page.check(selector);
    } catch (err) {
      throw err;
    }
    return this.addAction({
      type: 'check',
      selector,
      description: description || `Check ${selector}`,
      expectedState
    });
  }

  /**
   * Record and execute a checkbox uncheck action
   */
  async recordUncheck(page, selector, description, expectedState) {
    try {
      await page.uncheck(selector);
    } catch (err) {
      throw err;
    }
    return this.addAction({
      type: 'uncheck',
      selector,
      description: description || `Uncheck ${selector}`,
      expectedState
    });
  }

  /**
   * Record and execute a select dropdown option action
   */
  async recordSelectOption(page, selector, value, description, expectedState) {
    try {
      await page.selectOption(selector, value);
    } catch (err) {
      throw err;
    }
    return this.addAction({
      type: 'selectOption',
      selector,
      value,
      description: description || `Select "${value}" on ${selector}`,
      expectedState
    });
  }

  /**
   * Record and execute a timeout wait
   */
  async recordWait(page, durationMs, description) {
    try {
      await page.waitForTimeout(durationMs);
    } catch (err) {
      throw err;
    }
    return this.addAction({
      type: 'wait',
      value: String(durationMs),
      description: description || `Wait for ${durationMs}ms`
    });
  }

  /**
   * Conclude recording and finalize trace
   */
  finalize() {
    this.trace.finishedAt = new Date().toISOString();
    return this.trace;
  }

  /**
   * Get current trace record object
   */
  getTrace() {
    return this.trace;
  }

  /**
   * Export trace as formatted JSON string
   */
  exportJSON(pretty = true) {
    return JSON.stringify(this.trace, null, pretty ? 2 : 0);
  }
}
