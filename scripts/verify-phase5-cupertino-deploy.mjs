/**
 * BarrierLens Phase 5 Automated Verification Suite
 * Suites 11–12: Cupertino UI/UX Studio, Longitudinal Drift Sentinel & Production Deployment
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

const ROOT_DIR = process.cwd();

console.log('='.repeat(70));
console.log(' BarrierLens Phase 5 Verification: Suites 11–12 (Cupertino & Production)');
console.log('='.repeat(70));

let passCount = 0;
let totalCount = 0;

function check(title, condition, detail = '') {
  totalCount++;
  if (condition) {
    passCount++;
    console.log(`  ✓ [PASS] ${title}`);
    if (detail) console.log(`      └─ ${detail}`);
  } else {
    console.error(`  ✗ [FAIL] ${title}`);
    if (detail) console.error(`      └─ ${detail}`);
    process.exitCode = 1;
  }
}

// =========================================================================
// SECTION 1: Suite 11 — Apple Senior UI/UX Cupertino Design Studio
// =========================================================================
console.log('\n[Suite 11] Verifying 9 Apple Cupertino Studio Components & Dashboard Integration');

const cupertinoComponents = [
  {
    name: 'ComposeView.tsx',
    features: ['PersonaType', 'goalPresets', 'Physical Persona', 'Per-Run Budget', 'onRunAudit', 'Free public run'],
    desc: 'Flow composition, persona selection, seed URL'
  },
  {
    name: 'TraceTheater.tsx',
    features: ['TraceTheaterProps', 'steps', 'findings', 'apple-keycap', 'currentStepIndex', 'Focus Ring'],
    desc: 'Step scrubber, keystroke HUD, state visualization'
  },
  {
    name: 'ExecutiveReport.tsx',
    features: ['radarData', 'radarFillGrad', 'Metamorphic Effort Ratio', 'complianceScores', 'polygonPoints', 'BarrierDetailView'],
    desc: 'Metamorphic effort ratio summary, WCAG radar chart'
  },
  {
    name: 'BarrierDetailView.tsx',
    features: ['AccNameProvenanceTree', 'Tarjan SCC Trap Certificate', 'reproducingKeySequence', 'contrastRatio', 'patchProposal', 'Verify Surgical Fix'],
    desc: 'Barrier cards, code diff, W3C AccName explanation'
  },
  {
    name: 'FocusMapView.tsx',
    features: ['FocusNode', 'FocusEdge', 'kendallTau', 'trapCertificate', 'sink_scc', 'VisualNode', 'replaySteps'],
    desc: 'Interactive focus graph canvas, Tarjan cycle alerts'
  },
  {
    name: 'ScreenReaderTranscript.tsx',
    features: ['SpeechTranscriptItem', 'SpeechSynthesisUtterance', 'handleHearIt', 'silent_gap', 'aria-live'],
    desc: 'Reading order transcript, Hear it audio button'
  },
  {
    name: 'VisualTwinSimulator.tsx',
    features: ['VisionFilterMode', 'protanopia-filter', 'blur(3.5px)', 'contrastMode', 'tremorIntensity', 'reflow320'],
    desc: 'Low-vision blur, protanopia, contrast simulation'
  },
  {
    name: 'PublicScorecardView.tsx',
    features: ['grade', 'Public Verifiable Scorecard', 'EAA 2025', 'Detailed Metric Breakdown', 'embedSnippet'],
    desc: 'Public certification badge, grade, metric breakdown'
  },
  {
    name: 'TrendsView.tsx',
    features: ['DriftSentinelEngine', 'detectDrift', 'CUSUM', 'effort_ratio', 'cumulativeSum'],
    desc: 'Longitudinal accessibility trends, drift alerts'
  }
];

for (const comp of cupertinoComponents) {
  const filePath = path.join(ROOT_DIR, 'components', 'apple', comp.name);
  const exists = fs.existsSync(filePath);
  check(`Component exists: components/apple/${comp.name}`, exists, comp.desc);

  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const missingFeatures = comp.features.filter(f => !content.includes(f));
    check(
      `Verified Cupertino features in ${comp.name}`,
      missingFeatures.length === 0,
      missingFeatures.length === 0 
        ? `Contains: ${comp.features.slice(0, 4).join(', ')}...` 
        : `Missing required features: ${missingFeatures.join(', ')}`
    );
  }
}

// Verify app/page.tsx dashboard integration
const pagePath = path.join(ROOT_DIR, 'app', 'page.tsx');
const pageExists = fs.existsSync(pagePath);
check('Studio Dashboard entrypoint app/page.tsx exists', pageExists);

if (pageExists) {
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  const integratedComponents = [
    'ComposeView',
    'TraceTheater',
    'ExecutiveReport',
    'FocusMapView',
    'ScreenReaderTranscript',
    'VisualTwinSimulator',
    'PublicScorecardView',
    'TrendsView',
    'Navbar',
    'CommandPalette'
  ];
  const missingImports = integratedComponents.filter(c => !pageContent.includes(c));
  check(
    'Dashboard app/page.tsx integrates Cupertino Studio components',
    missingImports.length === 0,
    missingImports.length === 0 
      ? `Integrates all ${integratedComponents.length} primary studio views & modals` 
      : `Missing imports: ${missingImports.join(', ')}`
  );
}

// =========================================================================
// SECTION 2: Suite 12 — Longitudinal Drift Sentinel Engine
// =========================================================================
console.log('\n[Suite 12] Verifying Drift Sentinel CUSUM Statistical Change-Point Engine');

const sentinelPath = path.join(ROOT_DIR, 'lib', 'barrierlens', 'engines', 'drift-sentinel.ts');
check('Engine file lib/barrierlens/engines/drift-sentinel.ts exists', fs.existsSync(sentinelPath));

// Import the Drift Sentinel engine dynamically
const { DriftSentinelEngine } = await import('../lib/barrierlens/engines/drift-sentinel.ts');
const sentinel = new DriftSentinelEngine();

// Test A: Baseline stable history
const stableHistory = [1.2, 1.3, 1.4, 1.3, 1.2, 1.4];
const stableRes = sentinel.detectDrift(stableHistory);
check(
  'CUSUM: Stable time series does not flag drift',
  stableRes.hasDrift === false && stableRes.cumulativeSum < stableRes.threshold,
  `CUSUM statistic=${stableRes.cumulativeSum}, Threshold=${stableRes.threshold}`
);

// Test B: Sudden effort jump (PR regression)
const spikeHistory = [1.2, 1.3, 1.4, 3.8, 4.2, 4.5];
const spikeRes = sentinel.detectDrift(spikeHistory);
check(
  'CUSUM: Sudden effort ratio spike triggers drift alarm',
  spikeRes.hasDrift === true && spikeRes.cumulativeSum > spikeRes.threshold,
  `CUSUM statistic=${spikeRes.cumulativeSum} > Threshold=${spikeRes.threshold}, ChangePoint=#${spikeRes.changePointIndex + 1}`
);
check(
  'CUSUM: Accurately identifies change-point index of the regression',
  spikeRes.changePointIndex === 4,
  `Identified change-point at index ${spikeRes.changePointIndex} (val: ${spikeHistory[spikeRes.changePointIndex]}x)`
);

// Test C: Insufficient history graceful handling
const singleHistory = [1.2];
const singleRes = sentinel.detectDrift(singleHistory);
check(
  'CUSUM: Insufficient history handles gracefully without false alarms',
  singleRes.hasDrift === false && singleRes.summary.includes('Insufficient'),
  singleRes.summary
);

// Test D: Mathematical parameter verification
check(
  'CUSUM: Baseline target effort ratio and alarm parameters calibrated',
  stableRes.baselineEffortRatio === 1.4 && stableRes.threshold === 2.0,
  `Target=1.4x, Alarm Threshold=2.0`
);

// =========================================================================
// SECTION 3: Requirement R3 — Production Deployment Verification
// =========================================================================
console.log('\n[Requirement R3] Verifying Next.js Production Build Artifacts & Server Launch');

const nextDir = path.join(ROOT_DIR, '.next');
check('.next build output directory exists', fs.existsSync(nextDir));

const buildIdPath = path.join(nextDir, 'BUILD_ID');
check('.next/BUILD_ID generated', fs.existsSync(buildIdPath), `Build ID: ${fs.existsSync(buildIdPath) ? fs.readFileSync(buildIdPath, 'utf8').trim() : 'missing'}`);

const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
check('.next/routes-manifest.json exists', fs.existsSync(routesManifestPath));

if (fs.existsSync(routesManifestPath)) {
  const routesManifest = JSON.parse(fs.readFileSync(routesManifestPath, 'utf8'));
  const staticRoutes = (routesManifest.staticRoutes || []).map(r => r.page);
  const dynamicRoutes = (routesManifest.dynamicRoutes || []).map(r => r.page);

  check('Production route / registered', staticRoutes.includes('/'));
  check('Production route /benchmark registered', staticRoutes.includes('/benchmark'));
  check('Production fixture /fixtures/keyboard-trap registered', staticRoutes.includes('/fixtures/keyboard-trap'));
  check('Dynamic route /api/runs/[id] registered', dynamicRoutes.includes('/api/runs/[id]'));
}

// Launch local production server and verify HTTP 200 responses
async function verifyProductionServer() {
  const TEST_PORT = 3099;
  console.log(`\n  Starting Next.js production server on http://127.0.0.1:${TEST_PORT}...`);

  return new Promise((resolve) => {
    const serverProcess = spawn('npx', ['next', 'start', '-p', String(TEST_PORT)], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'production' }
    });

    let serverReady = false;

    serverProcess.stdout.on('data', async (chunk) => {
      const output = chunk.toString();
      if ((output.includes('Ready') || output.includes('started server') || output.includes(String(TEST_PORT))) && !serverReady) {
        serverReady = true;

        try {
          // Probe root route
          const rootRes = await fetchRoute(`http://127.0.0.1:${TEST_PORT}/`);
          check('Production Server GET / returns HTTP 200 OK', rootRes.statusCode === 200, `Status: ${rootRes.statusCode}, Content-Length: ${rootRes.body.length} bytes`);

          // Probe health endpoint
          const healthRes = await fetchRoute(`http://127.0.0.1:${TEST_PORT}/api/health`);
          check('Production Server GET /api/health returns HTTP 200 OK', healthRes.statusCode === 200, `Status: ${healthRes.statusCode}`);

          // Probe fixture route
          const fixtureRes = await fetchRoute(`http://127.0.0.1:${TEST_PORT}/fixtures/keyboard-trap`);
          check('Production Server GET /fixtures/keyboard-trap returns HTTP 200 OK', fixtureRes.statusCode === 200, `Status: ${fixtureRes.statusCode}`);
        } catch (err) {
          check('Production Server probe HTTP request succeeded', false, err.message);
        } finally {
          serverProcess.kill();
          resolve();
        }
      }
    });

    serverProcess.stderr.on('data', (chunk) => {
      // ignore normal deprecation or node notices
    });

    serverProcess.on('error', (err) => {
      check('Production Server process launched without error', false, err.message);
      resolve();
    });

    // Timeout safety: 15 seconds
    setTimeout(() => {
      if (!serverReady) {
        check('Production Server responded within 15 seconds', false, 'Server startup timed out');
        try { serverProcess.kill(); } catch {}
        resolve();
      }
    }, 15000);
  });
}

function fetchRoute(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

await verifyProductionServer();

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n' + '='.repeat(70));
console.log(` Phase 5 Verification Summary: ${passCount} / ${totalCount} checks PASSED`);
console.log('='.repeat(70));

if (passCount === totalCount) {
  console.log(' ✨ ALL PHASE 5 CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
} else {
  console.error(` ❌ ${totalCount - passCount} verification check(s) failed.\n`);
  process.exit(1);
}
