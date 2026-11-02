import { Page } from 'playwright';

export interface TremorAction {
  intendedKey: string;
  actualKeysPressed: string[];
  timingJitterMs: number;
  hadAccidentalRepeat: boolean;
  hadAccidentalNeighborKey: boolean;
  timestamp: number;
}

export interface PlannedAction {
  type: 'press_key' | 'type_text';
  key?: string;
  text?: string;
}

export interface TremorSequenceResult {
  actions: TremorAction[];
  totalAccidentalPresses: number;
  totalTimingJitterMs: number;
  successRate: number; // percentage of intended actions executed without deviation
}

export class MotorTremorSimulator {
  private neighborKeys: Record<string, string[]> = {
    'Tab': ['Tab', 'Shift+Tab'],
    'Enter': ['Enter', 'Space'],
    'Space': ['Space', 'Enter'],
    'ArrowDown': ['ArrowDown', 'ArrowRight'],
    'ArrowUp': ['ArrowUp', 'ArrowLeft'],
    'ArrowRight': ['ArrowRight', 'ArrowDown'],
    'ArrowLeft': ['ArrowLeft', 'ArrowUp'],
    'Escape': ['Escape', 'Backquote']
  };

  /**
   * Presses a key with simulated human motor tremor, timing jitter, and accidental repeats
   */
  async pressKeyWithTremor(
    page: Page,
    key: string,
    severity: 'mild' | 'moderate' | 'severe' = 'moderate'
  ): Promise<TremorAction> {
    const start = Date.now();

    // 1. Calculate timing jitter based on severity
    let minDelay = 40;
    let maxDelay = 180;
    let repeatProb = 0.08;
    let neighborProb = 0.05;

    if (severity === 'mild') {
      minDelay = 20;
      maxDelay = 90;
      repeatProb = 0.04;
      neighborProb = 0.02;
    } else if (severity === 'severe') {
      minDelay = 80;
      maxDelay = 380;
      repeatProb = 0.22;
      neighborProb = 0.14;
    }

    const jitter = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    await page.waitForTimeout(jitter);

    const actualKeysPressed: string[] = [];
    let hadAccidentalRepeat = false;
    let hadAccidentalNeighborKey = false;

    // Check for neighbor key slip
    let keyToPress = key;
    if (Math.random() < neighborProb && this.neighborKeys[key]) {
      const neighbors = this.neighborKeys[key];
      keyToPress = neighbors[Math.floor(Math.random() * neighbors.length)];
      if (keyToPress !== key) {
        hadAccidentalNeighborKey = true;
      }
    }

    // First press
    await page.keyboard.press(keyToPress);
    actualKeysPressed.push(keyToPress);

    // Accidental repeat key press
    if (Math.random() < repeatProb) {
      hadAccidentalRepeat = true;
      await page.waitForTimeout(Math.floor(Math.random() * 60) + 30);
      await page.keyboard.press(keyToPress);
      actualKeysPressed.push(keyToPress);
    }

    return {
      intendedKey: key,
      actualKeysPressed,
      timingJitterMs: jitter,
      hadAccidentalRepeat,
      hadAccidentalNeighborKey,
      timestamp: start
    };
  }

  /**
   * Types text with simulated motor variations (inconsistent keystroke duration and delays)
   */
  async typeWithTremor(
    page: Page,
    text: string,
    severity: 'mild' | 'moderate' | 'severe' = 'moderate'
  ): Promise<TremorAction> {
    const start = Date.now();
    let totalJitter = 0;

    for (const char of text) {
      const delay = severity === 'severe' ? Math.random() * 120 + 50 : Math.random() * 50 + 20;
      totalJitter += delay;
      await page.keyboard.type(char, { delay });
    }

    return {
      intendedKey: text,
      actualKeysPressed: [text],
      timingJitterMs: Math.round(totalJitter),
      hadAccidentalRepeat: false,
      hadAccidentalNeighborKey: false,
      timestamp: start
    };
  }

  /**
   * Simulates an entire sequence of actions with motor tremor
   */
  async simulateInteraction(
    page: Page,
    actions: PlannedAction[],
    severity: 'mild' | 'moderate' | 'severe' = 'moderate'
  ): Promise<TremorSequenceResult> {
    const executed: TremorAction[] = [];
    let accidentalCount = 0;
    let totalJitter = 0;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      // Simulate fatigue: severity slightly escalates late in the session
      const dynamicSeverity = (i > 10 && severity === 'moderate') ? 'severe' : severity;

      if (action.type === 'press_key' && action.key) {
        const res = await this.pressKeyWithTremor(page, action.key, dynamicSeverity);
        executed.push(res);
        if (res.hadAccidentalRepeat || res.hadAccidentalNeighborKey) accidentalCount++;
        totalJitter += res.timingJitterMs;
      } else if (action.type === 'type_text' && action.text) {
        const res = await this.typeWithTremor(page, action.text, dynamicSeverity);
        executed.push(res);
        totalJitter += res.timingJitterMs;
      }
    }

    const cleanActions = executed.filter(a => !a.hadAccidentalRepeat && !a.hadAccidentalNeighborKey).length;
    const successRate = executed.length > 0 ? Math.round((cleanActions / executed.length) * 100) : 100;

    return {
      actions: executed,
      totalAccidentalPresses: accidentalCount,
      totalTimingJitterMs: totalJitter,
      successRate
    };
  }
}
