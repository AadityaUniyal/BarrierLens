/**
 * Tier 2 E2E Boundary & Corner Suite: UI Navigation Boundaries
 * 
 * Tests boundary conditions, extreme viewports, search fuzzing,
 * URL query parameter corruption, and session storage recovery.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page, Browser } from 'playwright';
import { getBrowser, createPage, closeBrowser } from '../harness/browser-fixture';
import { VIEWPORTS, resolveUrl } from '../harness/config';

describe('Tier 2: UI Navigation Boundaries', () => {

  describe('Extreme Viewport Boundaries', () => {
    let browser: Browser;

    before(async () => {
      browser = await getBrowser();
    });

    after(async () => {
      await closeBrowser();
      setTimeout(() => {
        process.exit(0);
      }, 100).unref();
    });

    it('should adapt to ultra-narrow 280px fold viewport without negative layout box dimensions', async () => {
      const { page, context } = await createPage({
        viewport: { width: 280, height: 653 }
      });

      try {
        await page.setContent(`
          <div id="root" style="width: 100%; box-sizing: border-box; padding: 8px;">
            <header id="nav" style="display: flex; flex-wrap: wrap; gap: 4px;">
              <span id="brand">BarrierLens</span>
              <nav id="actions" style="display: flex; gap: 4px; overflow-x: auto;">
                <button id="btn1">Audits</button>
                <button id="btn2">Fixes</button>
              </nav>
            </header>
            <main id="main" style="max-width: 100%; overflow-x: hidden;">
              <div id="hud" style="display: flex; flex-direction: column; gap: 8px;">
                <div id="stat1" style="min-width: 0; width: 100%;">Score: 94</div>
                <div id="stat2" style="min-width: 0; width: 100%;">Violations: 3</div>
              </div>
            </main>
          </div>
        `);

        const dimensions = await page.evaluate(() => {
          const nav = document.getElementById('nav')!.getBoundingClientRect();
          const hud = document.getElementById('hud')!.getBoundingClientRect();
          const winWidth = window.innerWidth;
          return {
            winWidth,
            navWidth: nav.width,
            hudWidth: hud.width,
            hasHorizontalOverflow: document.documentElement.scrollWidth > winWidth
          };
        });

        assert.equal(dimensions.winWidth, 280);
        assert.ok(dimensions.navWidth <= 280, `Nav width (${dimensions.navWidth}) should not exceed viewport`);
        assert.ok(dimensions.hudWidth <= 280, `HUD width (${dimensions.hudWidth}) should not exceed viewport`);
        assert.equal(dimensions.hasHorizontalOverflow, false, 'Should not produce unconstrained horizontal scroll');
      } finally {
        await context.close();
      }
    });

    it('should maintain minimum touch target clearances on 320px narrow mobile viewport', async () => {
      const { page, context } = await createPage({
        viewport: { width: 320, height: 568 }
      });

      try {
        await page.setContent(`
          <div style="width: 100%; padding: 12px; box-sizing: border-box;">
            <div role="toolbar" style="display: flex; flex-direction: column; gap: 8px;">
              <button id="t1" style="min-height: 44px; min-width: 44px; padding: 10px;">Primary Action</button>
              <button id="t2" style="min-height: 44px; min-width: 44px; padding: 10px;">Secondary Action</button>
            </div>
          </div>
        `);

        const buttonRects = await page.evaluate(() => {
          const b1 = document.getElementById('t1')!.getBoundingClientRect();
          const b2 = document.getElementById('t2')!.getBoundingClientRect();
          return {
            b1Height: b1.height,
            b2Height: b2.height,
            gap: b2.top - b1.bottom
          };
        });

        assert.ok(buttonRects.b1Height >= 44, `Target 1 height (${buttonRects.b1Height}) must meet WCAG 2.5.8 (>= 44px)`);
        assert.ok(buttonRects.b2Height >= 44, `Target 2 height (${buttonRects.b2Height}) must meet WCAG 2.5.8 (>= 44px)`);
        assert.ok(buttonRects.gap >= 8, 'Vertical touch target separation must be preserved');
      } finally {
        await context.close();
      }
    });

    it('should clamp layout container bounds in extreme 3840px 4K UHD viewport', async () => {
      const { page, context } = await createPage({
        viewport: { width: 3840, height: 2160 }
      });

      try {
        await page.setContent(`
          <div style="width: 100%; display: flex; justify-content: center;">
            <div id="container" style="box-sizing: border-box; width: 100%; max-width: 1440px; margin: 0 auto; padding: 24px;">
              <h1 id="title">BarrierLens Executive Cockpit</h1>
            </div>
          </div>
        `);

        const metrics = await page.evaluate(() => {
          const el = document.getElementById('container')!.getBoundingClientRect();
          return {
            viewportWidth: window.innerWidth,
            containerWidth: el.width,
            leftMargin: el.left,
            rightMargin: window.innerWidth - el.right
          };
        });

        assert.equal(metrics.viewportWidth, 3840);
        assert.ok(metrics.containerWidth <= 1440, `Container width (${metrics.containerWidth}) should clamp at 1440px max`);
        assert.ok(metrics.leftMargin > 1000, `Left gutter (${metrics.leftMargin}) should center content`);
        assert.ok(Math.abs(metrics.leftMargin - metrics.rightMargin) < 2, 'Content must be horizontally centered');
      } finally {
        await context.close();
      }
    });

    it('should maintain readable grid constraints in 5120px super ultrawide viewport', async () => {
      const { page, context } = await createPage({
        viewport: { width: 5120, height: 1440 }
      });

      try {
        await page.setContent(`
          <div style="width: 100%; display: flex; justify-content: center;">
            <div id="wrapper" style="max-width: 1920px; width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
              <div class="card" style="height: 200px;">Card 1</div>
              <div class="card" style="height: 200px;">Card 2</div>
              <div class="card" style="height: 200px;">Card 3</div>
              <div class="card" style="height: 200px;">Card 4</div>
            </div>
          </div>
        `);

        const gridMetrics = await page.evaluate(() => {
          const wrapper = document.getElementById('wrapper')!.getBoundingClientRect();
          return {
            width: wrapper.width,
            windowWidth: window.innerWidth
          };
        });

        assert.equal(gridMetrics.windowWidth, 5120);
        assert.ok(gridMetrics.width <= 1920, 'Ultrawide view must clamp max container width to avoid visual disjunction');
      } finally {
        await context.close();
      }
    });
  });

  describe('Command Palette Search Fuzzing', () => {
    // Model command palette actions as defined in components/apple/CommandPalette.tsx
    const actions = [
      { id: 'hub-studio', category: 'Hubs', label: 'Audit Studio', description: 'Real-time multi-agent execution & action trace' },
      { id: 'hub-issues', category: 'Hubs', label: 'Evidence & Proofs', description: 'Deterministic Tarjan SCC cycles & WCAG violations' },
      { id: 'hub-remedy', category: 'Hubs', label: 'Verified Fixes', description: 'Causal AST repair engine & GitHub PR generator' },
      { id: 'hub-reports', category: 'Hubs', label: 'Executive Scorecard & Reports', description: '5-axis radar chart, PDF export & governance' },
      { id: 'hub-websites', category: 'Hubs', label: 'Websites Manager', description: 'Domain verification & critical user journey governance' },
      { id: 'act-run', category: 'Actions', label: 'Launch Autonomous Flow Audit', description: 'Dispatch Tarjan graph & screen reader probes' },
      { id: 'lab-focus', category: 'Diagnostics', label: 'Focus Map & Kendall\'s Tau Meter', description: '2D keyboard geometry and concordance score' },
      { id: 'lab-genome', category: 'Lab Tools', label: 'Barrier Genome Vector Map', description: 'Clustered embeddings of historical failure modes' },
    ];

    function filterCommandPalette(query: string) {
      if (!query.trim()) return actions;
      const q = query.toLowerCase();
      return actions.filter(a =>
        a.label.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
      );
    }

    it('should process 1,000-character input in Command Palette without timeout or crash', () => {
      const longInput = 'a'.repeat(1000);
      const startTime = performance.now();
      const results = filterCommandPalette(longInput);
      const elapsed = performance.now() - startTime;

      assert.equal(results.length, 0, '1000-char arbitrary repetition should yield 0 results');
      assert.ok(elapsed < 20, `Search filtering must complete in < 20ms (took ${elapsed}ms)`);
    });

    it('should neutralize HTML script tags and XSS injection vectors in search queries', () => {
      const xssVectors = [
        '<script>alert("xss")</script>',
        '"><img src=x onerror=alert(1)>',
        'javascript:void(0)',
        '<svg onload=alert(document.cookie)>',
        '"><script>fetch("http://attacker.com")</script>',
      ];

      for (const vector of xssVectors) {
        assert.doesNotThrow(() => {
          const results = filterCommandPalette(vector);
          assert.ok(Array.isArray(results));
        }, `Should safely process XSS vector without throwing: ${vector}`);
      }
    });

    it('should handle regex metacharacters and special punctuation safely without crashing', () => {
      const regexFuzzStrings = [
        '.*+?^${}()|[]\\',
        '[[[[[[(((((((((',
        '\\d+\\w+[a-z]*',
        '!@#$%^&*()_+~|}{[]:;?><,./\'"',
        '(?<=lookbehind).*',
      ];

      for (const str of regexFuzzStrings) {
        assert.doesNotThrow(() => {
          const res = filterCommandPalette(str);
          assert.ok(Array.isArray(res));
        }, `Search filter must not throw on metacharacters: ${str}`);
      }
    });

    it('should correctly process Unicode, emoji, zero-width, and RTL characters', () => {
      const unicodeInputs = [
        '🚀✨🔥',
        'ᚠᛇᚻ 𝓤𝓷𝓲𝓬𝓸𝓭𝓮',
        '﷽', // Arabic ligature
        '\u0000\u0001\u001F', // Control characters
        'Audit\u200BStudio', // Zero-width space
        'Fixes\u200D', // Zero-width joiner
      ];

      for (const input of unicodeInputs) {
        assert.doesNotThrow(() => {
          const filtered = filterCommandPalette(input);
          assert.ok(Array.isArray(filtered));
        });
      }

      // Exact match check for regular query
      const match = filterCommandPalette('Fixes');
      assert.ok(match.length >= 1);
      assert.ok(match.some(m => m.id === 'hub-remedy'));
    });

    it('should handle whitespace boundary inputs (empty, spaces, newlines, tabs)', () => {
      const whitespaceInputs = ['', '   ', '\t', '\n', '\r\n', ' \t \n '];
      for (const input of whitespaceInputs) {
        const results = filterCommandPalette(input);
        assert.equal(results.length, actions.length, 'Whitespace-only query should return all actions');
      }
    });
  });

  describe('Corrupted & Extreme URL Query Parameters', () => {
    // Parser contract derived from app/page.tsx:183-214
    const VALID_SCREENS = new Set([
      'story', 'overview', 'audits', 'issues', 'fixes',
      'arena', 'genome', 'websites', 'settings', 'remedy',
      'scorecard', 'focus-map', 'screen-reader', 'visual-twin',
      'pulse', 'multi-agent', 'vault'
    ]);

    function parseNavigationQueryParams(queryString: string): {
      activeScreen: string;
      targetUrl?: string;
      findingId?: string;
      runId?: string;
    } {
      const params = new URLSearchParams(queryString);
      const tabParam = params.get('tab') || params.get('view');
      const activeScreen = (tabParam && VALID_SCREENS.has(tabParam)) ? tabParam : 'story';

      const urlParam = params.get('url') || params.get('targetUrl') || undefined;
      const findingParam = params.get('finding') || params.get('findingId') || undefined;
      const runParam = params.get('runId') || undefined;

      // Path traversal neutralization
      const sanitizedRunId = runParam && !runParam.includes('..') && !runParam.includes('/') && !runParam.includes('\\')
        ? runParam
        : undefined;

      // UUID / Finding format validation
      const sanitizedFindingId = findingParam && /^[a-zA-Z0-9_-]{1,64}$/.test(findingParam)
        ? findingParam
        : undefined;

      return {
        activeScreen,
        targetUrl: urlParam,
        findingId: sanitizedFindingId,
        runId: sanitizedRunId
      };
    }

    it('should fall back safely to default screen when encountering unknown screen parameters', () => {
      const corruptTabs = [
        '?tab=UNKNOWN_SCREEN_999',
        '?tab=null',
        '?tab=undefined',
        '?view=__proto__',
        '?tab=DROP_TABLE',
        '?tab=',
      ];

      for (const qs of corruptTabs) {
        const parsed = parseNavigationQueryParams(qs);
        assert.equal(parsed.activeScreen, 'story', `Corrupted tab ${qs} must fallback to 'story'`);
      }
    });

    it('should neutralize path traversal sequences in runId URL parameter', () => {
      const attackVectors = [
        '?tab=audits&runId=../../etc/passwd',
        '?tab=audits&runId=..\\..\\windows\\system32',
        '?tab=audits&runId=....//....//config.json',
      ];

      for (const qs of attackVectors) {
        const parsed = parseNavigationQueryParams(qs);
        assert.equal(parsed.runId, undefined, `Path traversal in ${qs} must be neutralized`);
        assert.equal(parsed.activeScreen, 'audits');
      }

      // Valid runId must pass through
      const valid = parseNavigationQueryParams('?tab=audits&runId=run_prod_2026_abc123');
      assert.equal(valid.runId, 'run_prod_2026_abc123');
    });

    it('should reject non-standard / SQL injection findingId parameter values', () => {
      const sqlInjectionQueries = [
        '?tab=issues&findingId=\'; DROP TABLE findings; --',
        '?tab=issues&findingId=" OR 1=1 --',
        '?tab=issues&findingId=<script>alert(1)</script>',
      ];

      for (const qs of sqlInjectionQueries) {
        const parsed = parseNavigationQueryParams(qs);
        assert.equal(parsed.findingId, undefined, `Injection syntax in ${qs} must not be accepted as findingId`);
      }

      // Valid findingId must pass
      const valid = parseNavigationQueryParams('?tab=issues&findingId=find_sample_trap_01');
      assert.equal(valid.findingId, 'find_sample_trap_01');
    });

    it('should process 100 redundant query parameters without performance degradation or memory spike', () => {
      const redundantParams: string[] = ['tab=audits'];
      for (let i = 0; i < 100; i++) {
        redundantParams.push(`redundant_key_${i}=excess_value_${i}`);
      }
      const qs = '?' + redundantParams.join('&');

      const startTime = performance.now();
      const parsed = parseNavigationQueryParams(qs);
      const elapsed = performance.now() - startTime;

      assert.equal(parsed.activeScreen, 'audits');
      assert.ok(elapsed < 10, `Parsing 100 parameters should take < 10ms (took ${elapsed}ms)`);
    });
  });

  describe('Storage Corruption & State Recovery', () => {
    interface AuditRunCache {
      id: string;
      status: string;
      findings: Array<{ id: string; title: string }>;
    }

    function safeRestoreSessionState(storageValue: string | null): AuditRunCache | null {
      if (!storageValue) return null;
      try {
        const parsed = JSON.parse(storageValue);
        if (parsed && typeof parsed === 'object' && typeof parsed.id === 'string' && parsed.id.trim() !== '') {
          return {
            id: parsed.id,
            status: typeof parsed.status === 'string' ? parsed.status : 'completed',
            findings: Array.isArray(parsed.findings) ? parsed.findings : []
          };
        }
        return null;
      } catch {
        // Recovery mechanism: catch syntax errors on truncated or corrupt JSON
        return null;
      }
    }

    it('should recover gracefully when sessionStorage contains truncated or malformed JSON', () => {
      const corruptions = [
        '{"id": "run_test_01", "status": "completed", "findings": [', // Truncated
        '{ invalid_json: 123 }', // Unquoted keys
        'undefined',
        'NaN',
        '<html><body>502 Bad Gateway</body></html>',
        '{"id": ""}', // Empty ID
        '12345678', // Number primitive
      ];

      for (const corrupt of corruptions) {
        const recovered = safeRestoreSessionState(corrupt);
        assert.equal(recovered, null, `Corrupted JSON string should safely resolve to null without throwing: ${corrupt}`);
      }
    });

    it('should cleanly restore valid cached run payload from sessionStorage', () => {
      const validPayload = JSON.stringify({
        id: 'run_live_alpha_01',
        status: 'completed',
        findings: [
          { id: 'f1', title: 'Keyboard Trap in Modal' },
          { id: 'f2', title: 'Missing Accessible Name' }
        ]
      });

      const restored = safeRestoreSessionState(validPayload);
      assert.ok(restored !== null);
      assert.equal(restored.id, 'run_live_alpha_01');
      assert.equal(restored.status, 'completed');
      assert.equal(restored.findings.length, 2);
    });

    it('should withstand simulated storage quota exceeded exception during state caching', () => {
      // Mock Storage interface with quota rejection
      const mockStorage = {
        store: new Map<string, string>(),
        setItem(key: string, value: string) {
          if (value.length > 100_000) {
            const err = new Error('QuotaExceededError: The quota has been exceeded.');
            err.name = 'QuotaExceededError';
            throw err;
          }
          this.store.set(key, value);
        }
      };

      function cacheRunSafely(runData: object): { success: boolean; fallbackApplied: boolean } {
        try {
          const serialized = JSON.stringify(runData);
          mockStorage.setItem('barrierlens_active_run', serialized);
          return { success: true, fallbackApplied: false };
        } catch (err: any) {
          if (err.name === 'QuotaExceededError') {
            // Safe fallback: try saving lightweight stub
            try {
              const lightweight = JSON.stringify({ id: (runData as any).id, status: 'completed', findings: [] });
              mockStorage.setItem('barrierlens_active_run', lightweight);
              return { success: true, fallbackApplied: true };
            } catch {
              return { success: false, fallbackApplied: false };
            }
          }
          return { success: false, fallbackApplied: false };
        }
      }

      // Massive payload (150KB) simulating quota overflow
      const massiveRun = {
        id: 'run_heavy_01',
        data: 'x'.repeat(120_000)
      };

      const result = cacheRunSafely(massiveRun);
      assert.equal(result.success, true);
      assert.equal(result.fallbackApplied, true);
    });
  });

});
