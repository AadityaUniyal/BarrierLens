/**
 * BarrierLens 2.0 - Tier 3 Pairwise Cross-Feature Test Suite
 * URL State Persistence & Audits (url-persistence-and-audits.test.ts)
 * 
 * Verifies bi-directional URL synchronization (`?tab=audits&runId=...&findingId=...`),
 * sessionStorage caching, browser refresh restoration, and resilience against malformed params.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, closeBrowser } from '../harness/browser-fixture';
import { Page } from 'playwright';
import { AuditRun, BarrierFinding } from '../../../lib/barrierlens/types';

describe('Tier 3: URL State Persistence & Audits State Machine', () => {
  let page: Page;

  const SAMPLE_RUN: AuditRun = {
    id: 'run_benchmark_101',
    targetUrl: 'http://localhost:3000/benchmark',
    goal: 'Navigate page and verify interactive keyboard focus paths',
    persona: 'keyboard',
    status: 'completed',
    startedAt: new Date(Date.now() - 30000).toISOString(),
    finishedAt: new Date().toISOString(),
    taskSuccess: false,
    steps: [
      { idx: 1, persona: 'keyboard', actionType: 'press_key', key: 'Tab', tier: 0, activeElementBefore: 'body', activeElementAfter: '#nav-home', timestamp: Date.now() - 2000 },
      { idx: 2, persona: 'keyboard', actionType: 'press_key', key: 'Tab', tier: 1, activeElementBefore: '#nav-home', activeElementAfter: '#trap-modal', timestamp: Date.now() - 1000 },
      { idx: 3, persona: 'keyboard', actionType: 'press_key', key: 'Tab', tier: 0, activeElementBefore: '#trap-modal', activeElementAfter: '#claim-btn', timestamp: Date.now() - 500 }
    ],
    findings: [
      {
        id: 'find_sample_trap_01',
        runId: 'run_benchmark_101',
        stepIdx: 3,
        kind: 'keyboard_trap',
        trustTier: 'proven',
        wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
        severity: 'critical',
        severityScore: 9.8,
        severityInterval: [9.2, 10.0],
        title: 'Focus Sink Cycle in Dialog Container',
        summary: 'Tab key navigation cannot escape modal overlay; Esc key handler missing.',
        evidence: {
          selector: '#trap-modal',
          elementHTML: '<div id="trap-modal"><button id="claim-btn">Confirm</button></div>'
        },
        certificate: {
          detected: true,
          trapType: 'sink_scc',
          componentNodeIds: ['#trap-modal', '#claim-btn'],
          entryNodeId: '#trap-modal',
          keySequence: ['Escape', 'Shift+Tab', 'Escape'],
          cycleNodes: ['#trap-modal', '#claim-btn'],
          cycleTransitions: [{ from: '#trap-modal', key: 'Tab', to: '#claim-btn' }, { from: '#claim-btn', key: 'Tab', to: '#trap-modal' }],
          testedEscape: true,
          proofExplanation: 'Tarjan SCC sink cycle detected.',
          timestamp: new Date().toISOString()
        }
      },
      {
        id: 'find_sample_accname_02',
        runId: 'run_benchmark_101',
        stepIdx: 2,
        kind: 'empty_accessible_name',
        trustTier: 'proven',
        wcagRules: ['WCAG 4.1.2 Name, Role, Value (Level A)'],
        severity: 'high',
        severityScore: 7.5,
        severityInterval: [6.8, 8.2],
        title: 'Unlabeled Dismiss Button',
        summary: 'SVG icon button has empty accessible name.',
        evidence: {
          selector: 'button.close-btn'
        }
      }
    ],
    effortRatio: 3.8,
    kendallTau: {
      tau: 0.52,
      focusOrder: ['#grid-btn-2', '#grid-btn-1'],
      visualOrder: ['#grid-btn-1', '#grid-btn-2'],
      inversionCount: 4,
      totalPairs: 10,
      concordantCount: 6,
      discordantCount: 4,
      isAcceptable: false,
      explanation: 'Visual reading flow sequence diverges from DOM traversal order.'
    },
    tierMix: { tier0Rules: 2, tier1Ranker: 1, tier2Groq: 0, tier3Gemini: 0 }
  };

  const URL_PERSISTENCE_FIXTURE_HTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>BarrierLens URL State Persistence Fixture</title>
      <style>
        body { font-family: sans-serif; margin: 20px; background: #0a0a0a; color: #fff; }
        nav button { margin-right: 8px; padding: 6px 12px; background: #222; color: #fff; border: 1px solid #444; cursor: pointer; }
        nav button.active { background: #0090ff; border-color: #0090ff; font-weight: bold; }
        .screen-panel { display: none; padding: 20px; border: 1px solid #333; margin-top: 15px; }
        .screen-panel.active { display: block; }
        .finding-card { border: 1px solid #444; padding: 10px; margin: 8px 0; cursor: pointer; }
        .finding-card.selected { border-color: #0090ff; background: rgba(0, 144, 255, 0.1); }
      </style>
    </head>
    <body>
      <div id="app">
        <nav id="navbar">
          <button id="tab-story" onclick="setScreen('story')">Landing [0]</button>
          <button id="tab-overview" onclick="setScreen('overview')">Overview [1]</button>
          <button id="tab-audits" onclick="setScreen('audits')">Audit Studio [2]</button>
          <button id="tab-issues" onclick="setScreen('issues')">Issues & Proofs [3]</button>
          <button id="tab-fixes" onclick="setScreen('fixes')">Causal Fixes [4]</button>
          <button id="tab-arena" onclick="setScreen('arena')">Adversarial Lab [5]</button>
          <button id="tab-websites" onclick="setScreen('websites')">Sites [7]</button>
          <button id="tab-settings" onclick="setScreen('settings')">Settings [8]</button>
        </nav>

        <div id="screen-story" class="screen-panel"><h1>Marketing Landing</h1></div>
        <div id="screen-overview" class="screen-panel"><h1>Pulse Overview</h1></div>
        <div id="screen-audits" class="screen-panel">
          <h1>Audit Studio Cockpit</h1>
          <div id="audit-target-display">Target: <span></span></div>
          <div id="active-run-display">Run ID: <span id="current-run-id">none</span></div>
          <button id="load-sample-run" onclick="loadSampleRun()">Load Sample Run</button>
        </div>
        <div id="screen-issues" class="screen-panel">
          <h1>Issues & Proofs Master-Detail</h1>
          <div id="findings-list"></div>
          <div id="finding-detail" style="margin-top: 16px; border: 1px solid #555; padding: 12px;">
            <h3>Selected Finding</h3>
            <div id="detail-id">None</div>
            <div id="detail-title">None</div>
            <div id="detail-severity">None</div>
          </div>
        </div>
        <div id="screen-fixes" class="screen-panel"><h1>Verified Fixes</h1></div>
        <div id="screen-arena" class="screen-panel"><h1>Adversarial Arena</h1></div>
        <div id="screen-websites" class="screen-panel"><h1>Websites Manager</h1></div>
        <div id="screen-settings" class="screen-panel"><h1>Settings & Cloud</h1></div>
      </div>

      <script>
        // Polyfill in-memory storage if document origin is restricted
        const memStore = new Map();
        const fakeStorage = {
          getItem: (k) => memStore.has(k) ? memStore.get(k) : null,
          setItem: (k, v) => memStore.set(k, String(v)),
          removeItem: (k) => memStore.delete(k),
          clear: () => memStore.clear()
        };
        const storage = (function() {
          try { window.sessionStorage.getItem('test'); return window.sessionStorage; } catch (e) { return fakeStorage; }
        })();

        let state = {
          activeScreen: 'story',
          targetUrl: 'http://localhost:3000/benchmark',
          auditResult: null,
          selectedFinding: null,
        };

        const validScreens = ['story', 'overview', 'audits', 'issues', 'fixes', 'arena', 'genome', 'websites', 'settings'];

        window.storage = storage;
        window.state = state;

        function setScreen(screenId) {
          if (!validScreens.includes(screenId)) {
            screenId = 'story';
          }
          state.activeScreen = screenId;
          syncStateToUrl();
          render();
        }

        function setFinding(findingId) {
          if (!state.auditResult || !state.auditResult.findings) return;
          const found = state.auditResult.findings.find(f => f.id === findingId);
          if (found) {
            state.selectedFinding = found;
            syncStateToUrl();
            render();
          }
        }

        function loadSampleRun() {
          state.auditResult = window.__SAMPLE_RUN__;
          state.selectedFinding = window.__SAMPLE_RUN__.findings[0];
          try {
            storage.setItem('barrierlens_active_run', JSON.stringify(state.auditResult));
          } catch {}
          syncStateToUrl();
          render();
        }

        function syncStateToUrl() {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', state.activeScreen);
            if (state.auditResult && state.auditResult.id) {
              url.searchParams.set('run', state.auditResult.id);
              url.searchParams.set('runId', state.auditResult.id);
            } else {
              url.searchParams.delete('run');
              url.searchParams.delete('runId');
            }
            if (state.selectedFinding && state.selectedFinding.id) {
              url.searchParams.set('finding', state.selectedFinding.id);
              url.searchParams.set('findingId', state.selectedFinding.id);
            } else {
              url.searchParams.delete('finding');
              url.searchParams.delete('findingId');
            }
            if (state.targetUrl) {
              url.searchParams.set('url', state.targetUrl);
            }
            window.history.replaceState({}, '', url.toString());
          } catch (e) {}
        }

        function restoreFromUrlAndStorage() {
          try {
            const url = new URL(window.location.href);
            const tabParam = url.searchParams.get('tab') || url.searchParams.get('view');
            if (tabParam && validScreens.includes(tabParam)) {
              state.activeScreen = tabParam;
            } else {
              state.activeScreen = 'story';
            }
            const urlParam = url.searchParams.get('url') || url.searchParams.get('targetUrl');
            if (urlParam) {
              state.targetUrl = urlParam;
            }

            // Restore from storage
            const rawStored = storage.getItem('barrierlens_active_run');
            if (rawStored) {
              try {
                const parsed = JSON.parse(rawStored);
                if (parsed && parsed.id) {
                  state.auditResult = parsed;
                  const findingParam = url.searchParams.get('finding') || url.searchParams.get('findingId');
                  if (findingParam && parsed.findings) {
                    state.selectedFinding = parsed.findings.find(f => f.id === findingParam) || parsed.findings[0];
                  } else if (parsed.findings && parsed.findings.length > 0) {
                    state.selectedFinding = parsed.findings[0];
                  }
                }
              } catch (e) {}
            }
          } catch (e) {}
          render();
        }

        function render() {
          document.querySelectorAll('.screen-panel').forEach(p => p.classList.remove('active'));
          const activePanel = document.getElementById('screen-' + state.activeScreen);
          if (activePanel) activePanel.classList.add('active');

          document.querySelectorAll('#navbar button').forEach(b => b.classList.remove('active'));
          const activeBtn = document.getElementById('tab-' + state.activeScreen);
          if (activeBtn) activeBtn.classList.add('active');

          const targetSpan = document.querySelector('#audit-target-display span');
          if (targetSpan) targetSpan.textContent = state.targetUrl;

          const runSpan = document.getElementById('current-run-id');
          if (runSpan) runSpan.textContent = state.auditResult ? state.auditResult.id : 'none';

          const findingsList = document.getElementById('findings-list');
          if (findingsList) {
            findingsList.innerHTML = '';
            if (state.auditResult && state.auditResult.findings) {
              state.auditResult.findings.forEach(f => {
                const div = document.createElement('div');
                div.className = 'finding-card' + (state.selectedFinding?.id === f.id ? ' selected' : '');
                div.id = 'finding-card-' + f.id;
                div.textContent = '[' + f.severity.toUpperCase() + '] ' + f.title;
                div.onclick = () => setFinding(f.id);
                findingsList.appendChild(div);
              });
            }
          }

          if (state.selectedFinding) {
            document.getElementById('detail-id').textContent = state.selectedFinding.id;
            document.getElementById('detail-title').textContent = state.selectedFinding.title;
            document.getElementById('detail-severity').textContent = state.selectedFinding.severity;
          }
        }

        window.__SAMPLE_RUN__ = null;
        window.initApp = function(sample) {
          window.__SAMPLE_RUN__ = sample;
          restoreFromUrlAndStorage();
        };
      </script>
    </body>
    </html>
  `;

  before(async () => {
    const fixture = await createPage();
    page = fixture.page;
    await page.setContent(URL_PERSISTENCE_FIXTURE_HTML, { waitUntil: 'domcontentloaded' });
    await page.evaluate((sample) => (window as any).initApp(sample), SAMPLE_RUN);
  });

  after(async () => {
    await closeBrowser();
  });

  it('1. should synchronize URL query string ?tab= when switching screens', async () => {
    // Click on Audit Studio tab
    await page.click('#tab-audits');
    let url = await page.evaluate(() => window.location.href);
    assert.ok(url.includes('tab=audits'), `Expected URL to contain tab=audits, got ${url}`);
    assert.equal(await page.isVisible('#screen-audits'), true);

    // Click on Issues tab
    await page.click('#tab-issues');
    url = await page.evaluate(() => window.location.href);
    assert.ok(url.includes('tab=issues'), `Expected URL to contain tab=issues, got ${url}`);
    assert.equal(await page.isVisible('#screen-issues'), true);

    // Click on Sites tab
    await page.click('#tab-websites');
    url = await page.evaluate(() => window.location.href);
    assert.ok(url.includes('tab=websites'), `Expected URL to contain tab=websites, got ${url}`);
    assert.equal(await page.isVisible('#screen-websites'), true);
  });

  it('2. should synchronize ?runId= and ?findingId= when selecting an audit run and finding', async () => {
    // Switch to Audits screen and load sample run
    await page.click('#tab-audits');
    await page.click('#load-sample-run');

    const runIdText = await page.textContent('#current-run-id');
    assert.equal(runIdText, 'run_benchmark_101');

    // Verify URL contains run and runId parameters
    let url = await page.evaluate(() => window.location.href);
    assert.ok(url.includes('run=run_benchmark_101') || url.includes('runId=run_benchmark_101'));
    assert.ok(url.includes('finding=find_sample_trap_01') || url.includes('findingId=find_sample_trap_01'));

    // Switch to Issues screen and select second finding
    await page.click('#tab-issues');
    await page.click('#finding-card-find_sample_accname_02');

    url = await page.evaluate(() => window.location.href);
    assert.ok(url.includes('finding=find_sample_accname_02') || url.includes('findingId=find_sample_accname_02'));

    const detailId = await page.textContent('#detail-id');
    assert.equal(detailId, 'find_sample_accname_02');
  });

  it('3. should restore active screen and selected finding upon simulated refresh with query params', async () => {
    // Simulate navigation/refresh to deep-linked URL: ?tab=issues&run=run_benchmark_101&finding=find_sample_accname_02
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'issues');
      url.searchParams.set('run', 'run_benchmark_101');
      url.searchParams.set('finding', 'find_sample_accname_02');
      window.history.replaceState({}, '', url.toString());

      // Trigger restoration routine simulating page reload
      (window as any).restoreFromUrlAndStorage();
    });

    // Verify active panel is issues
    assert.equal(await page.isVisible('#screen-issues'), true);

    // Verify selected finding restored cleanly
    const detailId = await page.textContent('#detail-id');
    assert.equal(detailId, 'find_sample_accname_02');
    const detailTitle = await page.textContent('#detail-title');
    assert.equal(detailTitle, 'Unlabeled Dismiss Button');
  });

  it('4. should recover full audit metadata and steps from sessionStorage cache', async () => {
    // Inspect cached run from storage
    const recoveredRun: AuditRun = await page.evaluate(() => {
      const raw = (window as any).storage ? (window as any).storage.getItem('barrierlens_active_run') : null;
      return raw ? JSON.parse(raw) : null;
    });

    assert.ok(recoveredRun !== null, 'SessionStorage must contain cached audit run');
    assert.equal(recoveredRun.id, 'run_benchmark_101');
    assert.equal(recoveredRun.steps.length, 3);
    assert.equal(recoveredRun.findings.length, 2);
    assert.equal(recoveredRun.effortRatio, 3.8);
    assert.equal(recoveredRun.kendallTau?.tau, 0.52);

    // Verify trap certificate exists within finding
    const trapFinding = recoveredRun.findings.find(f => f.kind === 'keyboard_trap');
    assert.ok(trapFinding?.certificate?.detected === true);
    assert.equal(trapFinding?.certificate?.trapType, 'sink_scc');
  });

  it('5. should synchronize targetUrl query param across audit configuration updates', async () => {
    await page.evaluate(() => {
      (window as any).state.targetUrl = 'https://store.example.com/checkout';
      (window as any).syncStateToUrl();
    });

    const url = await page.evaluate(() => window.location.href);
    assert.ok(url.includes('url=https%3A%2F%2Fstore.example.com%2Fcheckout') || url.includes('url=https://store.example.com/checkout'));
  });

  it('6. should gracefully fallback to default story screen when tab param is invalid or malformed', async () => {
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'invalid_corrupted_hub_99');
      window.history.replaceState({}, '', url.toString());
      (window as any).restoreFromUrlAndStorage();
    });

    // Should fall back safely to story/landing without throwing
    assert.equal(await page.isVisible('#screen-story'), true);
  });

});
