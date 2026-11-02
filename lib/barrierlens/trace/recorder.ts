import { Page } from 'playwright';

export type TraceActionType =
  | 'click'
  | 'fill'
  | 'type'
  | 'press'
  | 'check'
  | 'uncheck'
  | 'selectOption'
  | 'goto'
  | 'wait';

export interface ExpectedStateAssertion {
  selector: string;
  assertion: 'value' | 'textContent' | 'checked' | 'visible' | 'attribute';
  expected: any;
  attributeName?: string;
}

export interface TraceAction {
  id: string;
  stepIdx: number;
  type: TraceActionType;
  selector?: string;
  value?: string;
  key?: string;
  timestamp: number;
  description?: string;
  expectedState?: ExpectedStateAssertion;
}

export interface TraceRecord {
  id: string;
  title: string;
  targetUrl: string;
  startedAt: string;
  finishedAt?: string;
  actions: TraceAction[];
  viewport: { width: number; height: number };
  metadata?: Record<string, any>;
}

export interface RecorderOptions {
  title?: string;
  viewport?: { width: number; height: number };
  metadata?: Record<string, any>;
}

export class PlaywrightTraceRecorder {
  private trace: TraceRecord;
  private actionCount = 0;

  constructor(targetUrl: string, options: RecorderOptions = {}) {
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
  public addAction(
    actionData: Omit<TraceAction, 'id' | 'stepIdx' | 'timestamp'> & { timestamp?: number }
  ): TraceAction {
    this.actionCount++;
    const action: TraceAction = {
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
  public async recordClick(
    page: Page,
    selector: string,
    description?: string,
    expectedState?: ExpectedStateAssertion
  ): Promise<TraceAction> {
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
  public async recordFill(
    page: Page,
    selector: string,
    value: string,
    description?: string,
    expectedState?: ExpectedStateAssertion
  ): Promise<TraceAction> {
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
  public async recordPress(
    page: Page,
    selector: string,
    key: string,
    description?: string,
    expectedState?: ExpectedStateAssertion
  ): Promise<TraceAction> {
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
  public async recordCheck(
    page: Page,
    selector: string,
    description?: string,
    expectedState?: ExpectedStateAssertion
  ): Promise<TraceAction> {
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
  public async recordUncheck(
    page: Page,
    selector: string,
    description?: string,
    expectedState?: ExpectedStateAssertion
  ): Promise<TraceAction> {
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
  public async recordSelectOption(
    page: Page,
    selector: string,
    value: string,
    description?: string,
    expectedState?: ExpectedStateAssertion
  ): Promise<TraceAction> {
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
  public async recordWait(page: Page, durationMs: number, description?: string): Promise<TraceAction> {
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
  public finalize(): TraceRecord {
    this.trace.finishedAt = new Date().toISOString();
    return this.trace;
  }

  /**
   * Get current trace record object
   */
  public getTrace(): TraceRecord {
    return this.trace;
  }

  /**
   * Export trace as formatted JSON string
   */
  public exportJSON(pretty = true): string {
    return JSON.stringify(this.trace, null, pretty ? 2 : 0);
  }
}
