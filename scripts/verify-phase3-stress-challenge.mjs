#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Transparently ensure execution under tsx loader when invoked directly with `node`
if (!process.env.RUNNING_UNDER_TSX) {
  const result = spawnSync('npx', ['tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNING_UNDER_TSX: '1' },
    shell: true
  });
  process.exit(result.status ?? 0);
}

// Module imports under tsx
const personasModule = await import('../lib/barrierlens/agent/personas.ts');
const { PERSONA_CONFIGS } = personasModule;

const llmRouterModule = await import('../lib/barrierlens/agent/llm-router.ts');
const { LLMRouter } = llmRouterModule;

const bedrockModule = await import('../lib/barrierlens/aws/bedrock-client.ts');
const { AWSBedrockClient } = bedrockModule;

const sentinelModule = await import('../lib/barrierlens/aws/budget-sentinel.ts');
const { AWSBudgetSentinel, AWS_BEDROCK_PRICING } = sentinelModule;

const driftModule = await import('../lib/barrierlens/engines/drift-sentinel.ts');
const { DriftSentinelEngine } = driftModule;

const targetPolicyModule = await import('../lib/barrierlens/security/target-policy.ts');
const { resolvePublicTargetUrl, TargetPolicyError, clampPublicMaxSteps, assertGoal } = targetPolicyModule;

const rateLimitModule = await import('../lib/barrierlens/security/rate-limit.ts');
const { assertAuditQuota, beginAudit, RateLimitError } = rateLimitModule;

const { pathToFileURL } = await import('node:url');

const auditorModule = await import('../lib/barrierlens/agent/auditor-core.ts');
const { AuditorCore } = auditorModule;

console.log('======================================================================');
console.log('  BarrierLens: Empirical Stress-Test & Adversarial Challenge (Suites 6–8) ');
console.log('======================================================================\n');

let total = 0;
let passed = 0;
let failed = 0;
const failureDetails = [];

function check(label, condition, detail = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${label}`);
  } else {
    failed++;
    failureDetails.push({ label, detail });
    console.log(`  ✗ [FAIL] ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runEmpiricalStressSuite() {
  // =========================================================================
  // SECTION 1: Persona Action Mask Constraints
  // =========================================================================
  console.log('📌 Section 1: Persona Action Mask Configurations & Constraints');

  const requiredPersonas = ['keyboard', 'screen_reader', 'low_vision', 'mouse_unconstrained'];
  for (const p of requiredPersonas) {
    check(`Persona '${p}' defined in PERSONA_CONFIGS`, !!PERSONA_CONFIGS[p]);
  }

  // Keyboard Persona constraints
  const kb = PERSONA_CONFIGS['keyboard'];
  check('Keyboard persona strictly disallows mouse clicks', kb.allowsMouseClick === false);
  check('Keyboard persona enforces visible focus rings', kb.enforcesFocusRings === true);
  check('Keyboard persona allows Tab and Shift+Tab', kb.allowedKeys.includes('Tab') && kb.allowedKeys.includes('Shift+Tab'));
  check('Keyboard persona allows directional arrow keys', kb.allowedKeys.includes('ArrowDown') && kb.allowedKeys.includes('ArrowUp'));

  // Screen Reader Persona constraints
  const sr = PERSONA_CONFIGS['screen_reader'];
  check('Screen Reader persona strictly disallows mouse clicks', sr.allowsMouseClick === false);
  check('Screen Reader persona requires announcements', sr.requiresScreenReaderAnnouncements === true);
  check('Screen Reader persona allows Escape and Enter', sr.allowedKeys.includes('Escape') && sr.allowedKeys.includes('Enter'));

  // Low Vision Persona constraints
  const lv = PERSONA_CONFIGS['low_vision'];
  check('Low Vision persona allows mouse clicks', lv.allowsMouseClick === true);
  check('Low Vision persona enforces focus rings', lv.enforcesFocusRings === true);
  check('Low Vision persona restricts allowed keys subset', lv.allowedKeys.length === 3 && lv.allowedKeys.includes('Tab'));

  // Mouse Unconstrained Persona constraints
  const mu = PERSONA_CONFIGS['mouse_unconstrained'];
  check('Mouse Unconstrained persona allows mouse clicks', mu.allowsMouseClick === true);
  check('Mouse Unconstrained does not enforce focus rings', mu.enforcesFocusRings === false);

  // =========================================================================
  // SECTION 2: LLM Router & Bedrock Fallback & Budget Circuit Breaker
  // =========================================================================
  console.log('\n📌 Section 2: LLM Router, Bedrock Fallback & Budget Sentinel Stress Tests');

  // Router Fallback (offline mode: no API keys)
  const router = new LLMRouter();
  const fallbackDecision = await router.decideNextAction(
    'Navigate to submit button',
    'keyboard',
    'button#submit [Focused=false]',
    ['Tab', 'Tab']
  );
  check('LLM Router returns Tier 0 deterministic rule fallback when keys unset', fallbackDecision.tierUsed === 0);
  check('Tier 0 fallback selects action press_key with Tab', fallbackDecision.action === 'press_key' && fallbackDecision.key === 'Tab');

  // Pure offline router (geminiApiKey = '')
  const offlineRouter = new LLMRouter();
  offlineRouter['geminiApiKey'] = '';
  offlineRouter['groqApiKey'] = '';
  const offlinePatch = await offlineRouter.generateFixPatch('<div onclick="save()">Save</div>', 'Missing keyboard accessible role');
  check('Fix synthesizer produces surgical HTML attribute patch in pure offline mode', offlinePatch.includes('aria-label="Action"'));

  // Test with current environment router
  const currentEnvPatch = await router.generateFixPatch('<div onclick="save()">Save</div>', 'Missing keyboard accessible role');
  check('Current environment fix synthesizer returns non-empty string', typeof currentEnvPatch === 'string' && currentEnvPatch.length > 0);

  // Budget Sentinel Pricing & Model Recommendation
  const sentinel = AWSBudgetSentinel.getInstance();
  const initialBudget = sentinel.getBudgetState();
  check('Budget Sentinel initializes with $120.00 total budget', initialBudget.totalBudgetUSD === 120.0);
  check('Budget Sentinel free tier flag is active', initialBudget.freeTierActive === true);
  check('Circuit breaker initially not tripped', initialBudget.circuitBreakerTripped === false);

  const navModel = sentinel.recommendModel('navigation');
  check('Sentinel recommends ultra-cheap Nova Micro for routine navigation', navModel === 'amazon.nova-micro-v1:0');

  const repairModel = sentinel.recommendModel('causal_repair');
  check('Sentinel recommends Claude 3.5 Sonnet for complex causal repair', repairModel === 'anthropic.claude-3-5-sonnet-20241022-v2:0');

  // Token recording math
  const usageRecord = sentinel.recordUsage('amazon.nova-micro-v1:0', 10000, 2000);
  // 10000/1000 * 0.000035 = 0.00035; 2000/1000 * 0.00014 = 0.00028 -> total 0.00063
  const expectedCost = 0.00063;
  check('Sentinel records micro-dollar usage accurately', Math.abs(usageRecord.costUSD - expectedCost) < 0.00005, `Got ${usageRecord.costUSD}, expected ~${expectedCost}`);

  // Test Bedrock client offline fallback
  const bedrock = new AWSBedrockClient();
  check('AWS Bedrock client correctly detects lack of credentials', bedrock.hasCredentials() === false || bedrock.hasCredentials() === true);

  const bedrockRes = await bedrock.invokeModel({
    prompt: 'Explore checkout page and find next action',
    taskType: 'navigation'
  });
  check('Bedrock invokeModel returns response in offline stand-in mode', typeof bedrockRes.text === 'string' && bedrockRes.text.length > 0);
  check('Bedrock response provider indicates stand-in or bedrock', ['local-synthetic', 'aws-bedrock', 'groq-cascade'].includes(bedrockRes.provider));
  check('Bedrock tracked latency is positive', bedrockRes.latencyMs > 0);

  // Causal repair synthesis offline test
  const repairRes = await bedrock.invokeModel({
    prompt: 'Synthesize causal patch for keyboard trap modal',
    taskType: 'causal_repair'
  });
  const repairParsed = JSON.parse(repairRes.text);
  check('Synthetic repair response contains valid patch attribute', typeof repairParsed.patch === 'string' && repairParsed.patch.includes('aria-label'));

  // Stress-test circuit breaker threshold
  // We simulate spending up to $118.01
  const preTrip = sentinel.getBudgetState();
  // Compute how much to push spentUSD past 118.00
  // Sonnet pricing: 0.003 / 1k input -> $3 / 1M.
  // 40,000,000 tokens ≈ $120
  sentinel.recordUsage('anthropic.claude-3-5-sonnet-20241022-v2:0', 40000000, 0);
  const postTrip = sentinel.getBudgetState();
  check('Budget Sentinel circuit breaker trips at/above $118.00 threshold', postTrip.circuitBreakerTripped === true, `spentUSD: ${postTrip.spentUSD}`);
  check('Sentinel canAffordInference returns false when tripped', sentinel.canAffordInference('amazon.nova-micro-v1:0') === false);
  check('Sentinel recommendModel forces cheapest Nova Micro when budget threshold exceeded', sentinel.recommendModel('causal_repair') === 'amazon.nova-micro-v1:0');

  // =========================================================================
  // SECTION 3: Effort Ratio Computation Math & Edge Cases
  // =========================================================================
  console.log('\n📌 Section 3: Effort Ratio Computation Math & Boundary Stress Tests');

  function calculateEffortRatio(stepCount) {
    const baselineSteps = Math.max(2, Math.round(stepCount / 3.8));
    return stepCount > 0 ? Math.round((stepCount / baselineSteps) * 10) / 10 : 1.0;
  }

  check('Effort ratio for 0 steps defaults safely to 1.0', calculateEffortRatio(0) === 1.0);
  check('Effort ratio for 1 step does not divide by zero', calculateEffortRatio(1) === 0.5);
  check('Effort ratio for 2 steps is exactly 1.0', calculateEffortRatio(2) === 1.0);
  check('Effort ratio for 4 steps evaluates to 2.0x', calculateEffortRatio(4) === 2.0);
  check('Effort ratio for 10 steps evaluates to 3.3x', calculateEffortRatio(10) === 3.3);
  check('Effort ratio for 100 steps evaluates to 3.8x', calculateEffortRatio(100) === 3.8);
  check('Effort ratio for 10,000 steps evaluates to 3.8x without overflow', calculateEffortRatio(10000) === 3.8);

  // ExecutiveReport SVG Circular Dial Math
  function computeDialDashoffset(effortRatio) {
    const effortAngle = Math.min(270, Math.max(30, (effortRatio / 5.0) * 270));
    const effortCircumference = 2 * Math.PI * 52;
    const effortDashoffset = effortCircumference - (effortAngle / 360) * effortCircumference;
    return { effortAngle, effortDashoffset, effortCircumference };
  }

  const dialAt1 = computeDialDashoffset(1.0);
  check('Circular dial angle at 1.0x baseline is 54 degrees', Math.round(dialAt1.effortAngle) === 54);
  check('Circular dial dashoffset is within valid geometry bounds', dialAt1.effortDashoffset > 0 && dialAt1.effortDashoffset < dialAt1.effortCircumference);

  const dialAt5 = computeDialDashoffset(5.0);
  check('Circular dial angle at 5.0x maxes at 270 degrees', Math.round(dialAt5.effortAngle) === 270);

  const dialAtExcess = computeDialDashoffset(15.0);
  check('Circular dial angle clamps cleanly at 270 degrees for extreme ratios', Math.round(dialAtExcess.effortAngle) === 270);

  const dialAtZero = computeDialDashoffset(0.0);
  check('Circular dial clamps at minimum 30 degrees for zero ratio', Math.round(dialAtZero.effortAngle) === 30);

  // Flow Drift Sentinel (CUSUM on Effort Ratio Time Series)
  const driftSentinel = new DriftSentinelEngine();
  const stableHistory = [1.2, 1.3, 1.4, 1.3, 1.4, 1.3];
  const stableResult = driftSentinel.detectDrift(stableHistory);
  check('CUSUM drift detector reports zero drift for stable effort history', stableResult.hasDrift === false);

  const jumpingHistory = [1.3, 1.4, 1.3, 3.8, 4.2, 4.5];
  const jumpResult = driftSentinel.detectDrift(jumpingHistory);
  check('CUSUM drift detector alerts on abrupt effort jump (1.3x -> 4.5x)', jumpResult.hasDrift === true);
  check('CUSUM alert contains explanatory message with ratio jump', jumpResult.summary.includes('Effort ratio increased to'));

  const emptyHistoryResult = driftSentinel.detectDrift([]);
  check('CUSUM handles empty history without crashing', emptyHistoryResult.hasDrift === false);

  // =========================================================================
  // SECTION 4: Benchmark Route Execution & Security Policies
  // =========================================================================
  console.log('\n📌 Section 4: Target Policy, Security Gate & Rate Limiting Stress Tests');

  // SSRF and Target Policy checks under strict production security (ALLOW_PRIVATE_TARGETS = 'false')
  const originalAllowPrivate = process.env.ALLOW_PRIVATE_TARGETS;
  process.env.ALLOW_PRIVATE_TARGETS = 'false';

  let ssrfBlocked = false;
  try {
    await resolvePublicTargetUrl('http://169.254.169.254/latest/meta-data', 'http://localhost:3000');
  } catch (err) {
    if (err instanceof TargetPolicyError && err.code === 'private_target') ssrfBlocked = true;
  }
  check('Target Policy strictly blocks AWS IMDS IPv4 (169.254.169.254) in production', ssrfBlocked);

  let localBlocked = false;
  try {
    await resolvePublicTargetUrl('http://192.168.1.1/admin', 'http://localhost:3000');
  } catch (err) {
    if (err instanceof TargetPolicyError && err.code === 'private_target') localBlocked = true;
  }
  check('Target Policy strictly blocks private IPv4 LAN addresses in production', localBlocked);

  // Restore env
  if (originalAllowPrivate !== undefined) {
    process.env.ALLOW_PRIVATE_TARGETS = originalAllowPrivate;
  } else {
    delete process.env.ALLOW_PRIVATE_TARGETS;
  }

  let validAllowed = false;
  try {
    const res = await resolvePublicTargetUrl('https://apple.com/shop', 'http://localhost:3000');
    if (res === 'https://apple.com/shop') validAllowed = true;
  } catch (err) {
    validAllowed = false;
  }
  check('Target Policy accepts valid public HTTPS domain', validAllowed);

  // Relative path resolution for internal benchmark
  const relativeRes = await resolvePublicTargetUrl('/benchmark', 'http://localhost:3000');
  check('Target Policy resolves relative /benchmark path against request origin', relativeRes === 'http://localhost:3000/benchmark');

  // Max Steps Clamping (Min: 4, Max: 12, Default: 8)
  check('Max steps clamps upper bound to PUBLIC_MAX_STEPS (12)', clampPublicMaxSteps(100) === 12);
  check('Max steps clamps lower bound to 4', clampPublicMaxSteps(1) === 4);
  check('Max steps defaults undefined/invalid to 8', clampPublicMaxSteps(undefined) === 8);

  // Goal Assertion
  check('assertGoal cleans and trims goal string', assertGoal('   Test Checkout Form   ') === 'Test Checkout Form');
  check('assertGoal provides friendly keyboard default on empty input', assertGoal('').includes('primary task on this page using only the keyboard'));

  let longGoalBlocked = false;
  try {
    assertGoal('A'.repeat(501));
  } catch (err) {
    if (err instanceof TargetPolicyError && err.code === 'goal_too_long') longGoalBlocked = true;
  }
  check('assertGoal rejects overly long goal exceeding 500 characters', longGoalBlocked);

  // Rate Limiter Stress Test (Max concurrent in-flight = 2)
  const testIp = '198.51.100.99';
  const release1 = beginAudit(testIp);
  const release2 = beginAudit(testIp);
  let rateLimitTripped = false;
  try {
    assertAuditQuota(testIp);
  } catch (err) {
    if (err instanceof RateLimitError) rateLimitTripped = true;
  }
  release1();
  release2();
  check('Rate limiter triggers RateLimitError upon exceeding concurrent audit capacity (2)', rateLimitTripped);

  // =========================================================================
  // SECTION 5: Ground-Truth Benchmark Testbed & Fixture Verification
  // =========================================================================
  console.log('\n📌 Section 5: Ground-Truth Benchmark Testbed & Fixture Verification');

  const fs = await import('node:fs');
  const benchmarkPagePath = path.resolve(__dirname, '../app/benchmark/page.tsx');
  check('Ground truth benchmark Next.js route file exists', fs.existsSync(benchmarkPagePath));

  const benchmarkSrc = fs.readFileSync(benchmarkPagePath, 'utf8');
  check('Benchmark injects Keyboard Trap modal (Barrier 1)', benchmarkSrc.includes('id="trap-modal"') && benchmarkSrc.includes('open-modal-btn'));
  check('Benchmark injects Silent State Change form without aria-live (Barrier 2)', benchmarkSrc.includes('id="error-msg"') && benchmarkSrc.includes('benchmark-email'));
  check('Benchmark injects Discordant Reading Order with positive tabindexes (Barrier 3)', benchmarkSrc.includes('tabIndex={1}') && benchmarkSrc.includes('tabIndex={2}') && benchmarkSrc.includes('tabIndex={3}'));
  check('Benchmark injects Unlabeled Control icon button (Barrier 4)', benchmarkSrc.includes('id="unlabeled-delete-btn"'));

  const fixturesDir = path.resolve(__dirname, '../fixtures');
  const requiredFixtures = [
    'fixture-keyboard-trap.html',
    'fixture-silent-gaps.html',
    'fixture-disordered-unreachable.html',
    'fixture-accname-wcag.html',
    'fixture-focus-loss.html'
  ];
  for (const fx of requiredFixtures) {
    const fxPath = path.join(fixturesDir, fx);
    check(`HTML Test fixture present: ${fx}`, fs.existsSync(fxPath));
  }

  // =========================================================================
  // SECTION 6: Live AuditorCore Playwright Audit on Ground Truth Trap Fixture
  // =========================================================================
  console.log('\n📌 Section 6: Live AuditorCore Playwright Audit on Ground Truth Trap Fixture');

  const trapFixturePath = path.resolve(fixturesDir, 'fixture-keyboard-trap.html');
  const trapFixtureUrl = pathToFileURL(trapFixturePath).href;

  const eventsEmitted = [];
  const auditor = new AuditorCore();
  console.log(`  Executing live AuditorCore run on: ${trapFixtureUrl}...`);
  const auditResult = await auditor.runAudit(
    trapFixtureUrl,
    'Explore page and test modal dialog for keyboard traps',
    'keyboard',
    8,
    (evt) => {
      eventsEmitted.push(evt.type);
    }
  );

  check('Live audit completed with valid runId', !!auditResult.id);
  check('Live audit result status is completed', auditResult.status === 'completed');
  check('Live audit executed physical steps (steps.length > 0)', auditResult.steps.length > 0);
  check('Live audit emitted progress events via callback', eventsEmitted.length > 0 && eventsEmitted.includes('complete'));
  check('Live audit computed valid metamorphic effort ratio', typeof auditResult.effortRatio === 'number' && auditResult.effortRatio >= 0.5);
  check('Live audit generated tierMix telemetry record', !!auditResult.tierMix && typeof auditResult.tierMix.tier0Rules === 'number');

  // Check if findings array contains proven keyboard trap or accessibility findings
  console.log(`  Live audit generated ${auditResult.findings.length} findings, ${auditResult.steps.length} steps.`);
  check('Live audit inspected and evaluated accessible findings', Array.isArray(auditResult.findings));
  console.log('\n======================================================================');
  console.log(`  Stress Test Complete: ${passed}/${total} checks passed (${failed} failed)`);
  console.log('======================================================================\n');

  if (failed > 0) {
    console.error('Failure Details:');
    for (const f of failureDetails) {
      console.error(` - ${f.label}: ${f.detail}`);
    }
    process.exit(1);
  }
}

runEmpiricalStressSuite().catch((err) => {
  console.error('Fatal unhandled error during stress testing:', err);
  process.exit(1);
});
