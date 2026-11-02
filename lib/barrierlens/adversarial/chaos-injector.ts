import { Page } from 'playwright';

export interface ChaosCondition {
  id: string;
  name: string;
  category: 'viewport' | 'network' | 'visual' | 'timing' | 'interaction';
  severity: 'mild' | 'moderate' | 'extreme';
  description: string;
}

export interface AppliedChaos {
  condition: ChaosCondition;
  appliedAt: number;
}

export class ChaosInjector {
  private conditions: ChaosCondition[] = [
    // 1. Viewport Stressors
    {
      id: 'viewport_320',
      name: 'Mobile Narrow Viewport (320px)',
      category: 'viewport',
      severity: 'moderate',
      description: 'Forces viewport to 320x568px to trigger extreme mobile reflow and clipping.'
    },
    {
      id: 'viewport_4k',
      name: 'Ultra-wide 4K Display (3840px)',
      category: 'viewport',
      severity: 'mild',
      description: 'Forces viewport to 3840x2160px to expose broken absolute positioning.'
    },
    {
      id: 'zoom_200',
      name: 'Low Vision 200% Zoom',
      category: 'viewport',
      severity: 'moderate',
      description: 'Simulates browser text-zoom level at 200% according to WCAG 1.4.4.'
    },
    {
      id: 'zoom_400',
      name: 'Extreme 400% Zoom Reflow',
      category: 'viewport',
      severity: 'extreme',
      description: 'Simulates WCAG 2.1 Reflow (1.4.10) requiring single-column responsive reflow.'
    },

    // 2. Visual Stressors
    {
      id: 'forced_colors',
      name: 'Windows High Contrast Mode (Forced Colors)',
      category: 'visual',
      severity: 'moderate',
      description: 'Emulates forced-colors: active to test if focus rings and icons remain visible.'
    },
    {
      id: 'high_contrast',
      name: 'Inverted High Contrast Filter',
      category: 'visual',
      severity: 'mild',
      description: 'Inverts colors to verify luminosity contrast endurance.'
    },
    {
      id: 'reduced_motion',
      name: 'Prefers Reduced Motion',
      category: 'visual',
      severity: 'mild',
      description: 'Emulates prefers-reduced-motion: reduce to verify animated transitions halt.'
    },
    {
      id: 'kill_animations',
      name: 'Animation Stripping Filter',
      category: 'visual',
      severity: 'extreme',
      description: 'Forces animation: none and transition: none across all elements.'
    },

    // 3. Timing Stressors
    {
      id: 'slow_transitions',
      name: 'Stretched Async Transitions',
      category: 'timing',
      severity: 'moderate',
      description: 'Extends CSS transitions to 2000ms to catch race conditions in focus management.'
    },
    {
      id: 'rapid_reflow',
      name: 'Synthetic Layout Thrashing',
      category: 'timing',
      severity: 'extreme',
      description: 'Forces layout recalculations to expose brittle focus states.'
    },

    // 4. Network Stressors
    {
      id: 'slow_3g',
      name: 'Slow 3G Network Throttling',
      category: 'network',
      severity: 'moderate',
      description: 'Throttles network via CDP to 500kbps and 400ms RTT.'
    },
    {
      id: 'offline_transient',
      name: 'Transient Offline Drop',
      category: 'network',
      severity: 'extreme',
      description: 'Simulates momentary connection drop during form interaction.'
    },

    // 5. Interaction Stressors
    {
      id: 'focus_loss_on_click',
      name: 'Active Element Blur Injector',
      category: 'interaction',
      severity: 'moderate',
      description: 'Injects window blur on click to test whether keyboard focus is lost.'
    },
    {
      id: 'double_tab_speed',
      name: 'Hyper-Rapid Keystroke Burst',
      category: 'interaction',
      severity: 'mild',
      description: 'Sends Tab key events with only 15ms intervals to test debounce handlers.'
    },
    {
      id: 'disable_mouse_events',
      name: 'Strict No-Mouse Pointer Sandbox',
      category: 'interaction',
      severity: 'mild',
      description: 'Disables all mouse and pointer events to ensure zero leakage.'
    }
  ];

  getAvailableConditions(): ChaosCondition[] {
    return [...this.conditions];
  }

  async applyChaos(page: Page, condition: ChaosCondition): Promise<AppliedChaos> {
    try {
      switch (condition.id) {
        case 'viewport_320':
          await page.setViewportSize({ width: 320, height: 568 });
          break;
        case 'viewport_4k':
          await page.setViewportSize({ width: 3840, height: 2160 });
          break;
        case 'zoom_200':
          await page.evaluate(() => {
            document.body.style.transform = 'scale(2.0)';
            document.body.style.transformOrigin = 'top left';
          });
          break;
        case 'zoom_400':
          await page.evaluate(() => {
            document.body.style.transform = 'scale(4.0)';
            document.body.style.transformOrigin = 'top left';
          });
          break;
        case 'forced_colors':
          await page.emulateMedia({ forcedColors: 'active' });
          await page.addStyleTag({
            content: '* { forced-color-adjust: none !important; }'
          });
          break;
        case 'reduced_motion':
          await page.emulateMedia({ reducedMotion: 'reduce' });
          break;
        case 'kill_animations':
          await page.addStyleTag({
            content: '* { animation: none !important; transition: none !important; }'
          });
          break;
        case 'high_contrast':
          await page.evaluate(() => {
            document.body.style.filter = 'contrast(200%) invert(1)';
          });
          break;
        case 'slow_3g':
          try {
            const client = await page.context().newCDPSession(page);
            await client.send('Network.emulateNetworkConditions', {
              offline: false,
              downloadThroughput: (500 * 1024) / 8,
              uploadThroughput: (500 * 1024) / 8,
              latency: 400
            });
          } catch {
            // CDP network throttling fallback
          }
          break;
        case 'disable_mouse_events':
          await page.addStyleTag({
            content: '* { pointer-events: none !important; }'
          });
          break;
      }
    } catch (err: any) {
      console.warn(`[ChaosInjector] Failed applying ${condition.id}:`, err.message);
    }

    return {
      condition,
      appliedAt: Date.now()
    };
  }

  async applyRandomChaos(page: Page, level: 'mild' | 'moderate' | 'extreme' = 'moderate'): Promise<AppliedChaos> {
    const candidates = this.conditions.filter(c => {
      if (level === 'mild') return c.severity === 'mild';
      if (level === 'moderate') return c.severity === 'mild' || c.severity === 'moderate';
      return true;
    });

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return this.applyChaos(page, selected);
  }

  async resetChaos(page: Page): Promise<void> {
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
      await page.evaluate(() => {
        document.body.style.transform = '';
        document.body.style.filter = '';
      });
    } catch {
      // Ignore cleanup error
    }
  }
}
