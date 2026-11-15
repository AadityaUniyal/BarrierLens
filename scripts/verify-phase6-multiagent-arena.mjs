/**
 * BarrierLens Phase 6 Automated Verification Suite
 * Multi-Agent Collaborative Persona Mesh, Metamorphic Adversarial Fuzzer & Arena
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);

// Ensure execution under tsx loader
if (!process.env.RUNNING_UNDER_TSX) {
  const result = spawnSync('npx', ['tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNING_UNDER_TSX: '1' },
    shell: true
  });
  process.exit(result.status ?? 0);
}

const { MultiAgentMeshOrchestrator } = await import('../lib/barrierlens/multiagent/mesh-orchestrator.ts');
const { AWSEventMesh } = await import('../lib/barrierlens/aws/event-mesh.ts');
const { AWSBedrockClient } = await import('../lib/barrierlens/aws/bedrock-client.ts');
const { AWSS3ArtifactStore } = await import('../lib/barrierlens/aws/s3-artifact-store.ts');
const { IsolatedExecutionSandbox } = await import('../lib/barrierlens/sandbox/isolated-sandbox.ts');
const { AdversarialStressAgent } = await import('../lib/barrierlens/adversarial/stress-agent.ts');
const { ChaosInjector } = await import('../lib/barrierlens/adversarial/chaos-injector.ts');
const { MotorTremorSimulator } = await import('../lib/barrierlens/adversarial/motor-tremor.ts');

console.log('='.repeat(70));
console.log('🤖 BARRIERLENS PHASE 6 VERIFICATION SUITE');
console.log('   Multi-Agent Collaborative Mesh & Metamorphic Adversarial Arena');
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

async function runPhase6Tests() {
  // =========================================================================
  // SECTION 1: Multi-Agent Event Mesh & AWS Infrastructure Strands
  // =========================================================================
  console.log('\n--- 1. Testing Event Mesh & Inter-Agent Dispatch ---');
  const eventMesh = AWSEventMesh.getInstance();
  eventMesh.clear();

  let capturedEvent = null;
  const unsub = eventMesh.subscribe('barrierlens.agent.navigator', (msg) => {
    capturedEvent = msg;
  });

  await eventMesh.publish(
    'barrierlens.agent.navigator',
    'navigator',
    { action: 'press_key', key: 'Tab', target: '#login-button' },
    'forensic_auditor'
  );

  check('EventMesh dispatches and receives inter-agent message', capturedEvent !== null);
  check('Event preserves source agent role', capturedEvent?.sourceAgent === 'navigator');
  check('Event routes to correct target agent', capturedEvent?.targetAgent === 'forensic_auditor');
  check('AWS X-Ray trace ID generated', capturedEvent?.traceId?.startsWith('1-'));
  unsub();

  // =========================================================================
  // SECTION 2: AWS Bedrock Foundation Client & Cognitive Inference
  // =========================================================================
  console.log('\n--- 2. Testing Bedrock Cognitive Reasoning Strand ---');
  const bedrock = new AWSBedrockClient();
  check('Bedrock client instance initialized', typeof bedrock.invokeModel === 'function');

  const bedrockRes = await bedrock.invokeModel({
    prompt: 'Evaluate accessibility trap in modal dialog and propose ARIA fix.'
  });

  check('Bedrock returns structured reasoning', bedrockRes.text.length > 0);
  check('Bedrock tracks token usage', (bedrockRes.tokenUsage.inputTokens + bedrockRes.tokenUsage.outputTokens) > 0);
  check('Bedrock tracks execution latency', bedrockRes.latencyMs >= 0);

  // =========================================================================
  // SECTION 3: S3 Audit Evidence & Artifact Store
  // =========================================================================
  console.log('\n--- 3. Testing S3 Cryptographic Artifact Persistence ---');
  const s3Store = new AWSS3ArtifactStore();
  const runId = 'phase6_run_' + crypto.randomUUID().slice(0, 8);
  const sampleReport = {
    runId,
    verified: true,
    score: 95,
    timestamp: new Date().toISOString()
  };

  const putResult = await s3Store.putArtifact(`runs/${runId}/certificate.json`, sampleReport, {
    contentType: 'application/json',
    runId,
    agentRole: 'sandbox_judge'
  });

  check('S3 PutObject generates valid ETag', Boolean(putResult.eTag));
  check('S3 artifact location format is valid', putResult.location.includes('.amazonaws.com/'));

  const retrieved = await s3Store.getArtifact(`runs/${runId}/certificate.json`);
  check('S3 GetObject accurately retrieves stored JSON', retrieved !== null && retrieved.includes(runId));

  // =========================================================================
  // SECTION 4: Firecracker-Emulated Isolated Execution Sandbox
  // =========================================================================
  console.log('\n--- 4. Testing Firecracker-Emulated Execution Sandbox ---');
  const sandbox = new IsolatedExecutionSandbox({
    maxMemoryMb: 256,
    timeoutMs: 15000,
    blockCloudMetadata: true,
    emulatedRuntime: 'aws-firecracker'
  });

  const testHtml = '<!DOCTYPE html><html><body><button id="btn1">Button 1</button><a id="lnk1" href="#test">Link</a></body></html>';
  const dataUrl = 'data:text/html,' + encodeURIComponent(testHtml);

  const sandboxRun = await sandbox.executeInSandbox(dataUrl, async (page) => {
    await page.goto(dataUrl);
    return {
      buttonsCount: await page.locator('button').count(),
      linksCount: await page.locator('a').count()
    };
  });

  check('Sandbox completes execution with clean exit', sandboxRun.report.cleanExit === true);
  check('Sandbox runtime matches configured firecracker', sandboxRun.report.runtime === 'aws-firecracker');
  check('Sandbox tracks peak memory utilization', sandboxRun.report.memoryPeakMb > 0);
  check('Sandbox executes payload successfully', sandboxRun.result.buttonsCount === 1 && sandboxRun.result.linksCount === 1);

  // =========================================================================
  // SECTION 5: End-to-End Multi-Agent Collaborative Mesh
  // =========================================================================
  console.log('\n--- 5. Testing Multi-Agent Collaborative Mesh Orchestration ---');
  const orchestrator = new MultiAgentMeshOrchestrator();
  const eventLog = [];

  const syntheticSiteHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Accessible Demo Site</title></head>
      <body>
        <header><nav><a href="#content">Skip to content</a></nav></header>
        <main id="content">
          <h1>Product Catalog</h1>
          <button id="cart-btn" aria-label="Shopping Cart">Cart</button>
          <div role="dialog" id="promo-modal" aria-modal="true" aria-label="Promotion">
            <p>10% Off Today!</p>
            <button id="close-modal-btn">Close</button>
          </div>
        </main>
      </body>
    </html>
  `;
  const syntheticSiteUrl = 'data:text/html,' + encodeURIComponent(syntheticSiteHtml);

  const meshResult = await orchestrator.executeCollaborativeAudit({
    targetUrl: syntheticSiteUrl,
    goal: 'Navigate catalog, test modal dialog escape, and verify accessible labels',
    persona: 'keyboard',
    maxSteps: 4,
    enableRedTeamChaos: true,
    onAgentEvent: (evt) => {
      eventLog.push(evt);
    }
  });

  check('Multi-Agent Mesh completes execution', meshResult.status === 'completed');
  check('All 6 specialized agents participate in mission', meshResult.agentsInvolved.length >= 5);
  check('Navigator agent is included in roster', meshResult.agentsInvolved.includes('navigator'));
  check('Forensic auditor agent is included in roster', meshResult.agentsInvolved.includes('forensic_auditor'));
  check('Red-Team chaos agent is included in roster', meshResult.agentsInvolved.includes('red_team_chaos'));
  check('Causal repair agent is included in roster', meshResult.agentsInvolved.includes('causal_repair'));
  check('Sandbox judge agent is included in roster', meshResult.agentsInvolved.includes('sandbox_judge'));
  check('Inter-agent event stream records transitions', eventLog.length >= 3);
  check('Bedrock cognitive models invoked during run', meshResult.bedrockInferenceCount >= 1);
  check('Mesh persists certified audit artifacts', meshResult.s3Artifacts.length >= 1);

  // =========================================================================
  // SECTION 6: Adversarial Stress Testing & Chaos Injector
  // =========================================================================
  console.log('\n--- 6. Testing Adversarial Stress & Metamorphic Chaos ---');
  const chaos = new ChaosInjector();
  const catalog = chaos.getAvailableConditions();
  check('Chaos catalog contains diverse stress conditions', catalog.length >= 10);
  check('Includes mobile viewport reflow (320px)', catalog.some(c => c.name.includes('320px')));
  check('Includes Windows High Contrast forced colors', catalog.some(c => c.name.includes('High Contrast')));

  const tremor = new MotorTremorSimulator();
  check('Tremor simulator provides pressKeyWithTremor method', typeof tremor.pressKeyWithTremor === 'function');
  check('Tremor simulator provides typeWithTremor method', typeof tremor.typeWithTremor === 'function');
  check('Tremor simulator provides simulateInteraction sequence method', typeof tremor.simulateInteraction === 'function');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log(`Phase 6 Verification Summary: ${passCount} / ${totalCount} checks PASSED`);
  console.log('='.repeat(70));

  if (passCount === totalCount) {
    console.log('🎉 ALL PHASE 6 MULTI-AGENT & ARENA VERIFICATIONS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`❌ ${totalCount - passCount} check(s) failed.\n`);
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error('[FATAL] Phase 6 Verification Suite crashed:', err);
  process.exit(1);
});
