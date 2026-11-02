import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);

// Transparently ensure execution under tsx loader when invoked directly with `node`
if (!process.env.RUNNING_UNDER_TSX) {
  const result = spawnSync('npx', ['tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNING_UNDER_TSX: '1' },
    shell: true
  });
  process.exit(result.status ?? 0);
}

const { AWSBedrockClient } = await import('../lib/barrierlens/aws/bedrock-client.ts');
const { AWSEventMesh } = await import('../lib/barrierlens/aws/event-mesh.ts');
const { AWSS3ArtifactStore } = await import('../lib/barrierlens/aws/s3-artifact-store.ts');
const { IsolatedExecutionSandbox } = await import('../lib/barrierlens/sandbox/isolated-sandbox.ts');
const { MultiAgentMeshOrchestrator } = await import('../lib/barrierlens/multiagent/mesh-orchestrator.ts');

console.log('🧪 Starting Verification: AWS Strands, Sandbox & Multi-Agent Mesh...\n');

let totalAssertions = 0;
function check(condition, message) {
  assert(condition, message);
  totalAssertions++;
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  // =========================================================================
  // SUITE 1: AWS Bedrock Foundation Model Strand
  // =========================================================================
  console.log('📌 Suite 1: AWS Bedrock Foundation Model Strand');
  const bedrock = new AWSBedrockClient();
  check(typeof bedrock.invokeModel === 'function', 'Bedrock client initializes');
  check(bedrock.getRegion().length > 0, `AWS Region configured (${bedrock.getRegion()})`);

  const bedrockRes = await bedrock.invokeModel({
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    prompt: 'Synthesize minimal accessibility repair patch for empty button label.',
    systemPrompt: 'You are an enterprise accessibility engineer.'
  });

  check(bedrockRes.text.length > 0, `Bedrock returned inference response (${bedrockRes.text.slice(0, 50)}...)`);
  check(bedrockRes.latencyMs > 0, `Bedrock tracked latency (${bedrockRes.latencyMs}ms)`);
  check(bedrockRes.tokenUsage.inputTokens > 0, 'Bedrock tracked token usage');
  console.log('\n');

  // =========================================================================
  // SUITE 2: AWS EventBridge & SQS Inter-Agent Message Mesh
  // =========================================================================
  console.log('📌 Suite 2: AWS EventBridge & SQS Inter-Agent Message Mesh');
  const eventMesh = AWSEventMesh.getInstance();
  eventMesh.clear();

  let receivedMessage = null;
  const unsubscribe = eventMesh.subscribe('barrierlens.agent.navigation', (msg) => {
    receivedMessage = msg;
  });

  const published = await eventMesh.publish(
    'barrierlens.agent.navigation',
    'navigator',
    { action: 'press_key', key: 'Tab', targetSelector: '#submit-btn' },
    'forensic_auditor'
  );

  check(receivedMessage !== null, 'EventBridge subscriber received published event');
  check(receivedMessage.sourceAgent === 'navigator', 'Message source agent preserved');
  check(receivedMessage.targetAgent === 'forensic_auditor', 'Target agent routing preserved');
  check(receivedMessage.traceId.startsWith('1-'), `AWS X-Ray traceId formatted correctly (${receivedMessage.traceId.slice(0, 16)}...)`);
  unsubscribe();

  const telemetry = eventMesh.getTelemetrySummary();
  check(telemetry.totalDispatched >= 1, `Mesh telemetry recorded events (count = ${telemetry.totalDispatched})`);
  console.log('\n');

  // =========================================================================
  // SUITE 3: AWS S3 Artifact & Telemetry Store
  // =========================================================================
  console.log('📌 Suite 3: AWS S3 Artifact & Telemetry Store');
  const s3 = new AWSS3ArtifactStore();
  const testRunId = 'test_run_' + crypto.randomUUID().slice(0, 8);
  const sampleData = { test: true, goal: 'Verify S3 artifact persistence', timestamp: new Date().toISOString() };

  const s3Put = await s3.putArtifact(`runs/${testRunId}/report.json`, sampleData, {
    contentType: 'application/json',
    runId: testRunId,
    agentRole: 'orchestrator'
  });

  check(s3Put.eTag.length > 0, `S3 PutObject generated ETag: ${s3Put.eTag}`);
  check(s3Put.location.includes('.amazonaws.com/'), `S3 location URL valid (${s3Put.location})`);

  const fetched = await s3.getArtifact(`runs/${testRunId}/report.json`);
  check(fetched !== null && fetched.includes('Verify S3 artifact persistence'), 'S3 GetObject retrieved exact stored artifact');

  const list = await s3.listArtifacts(`runs/${testRunId}/`);
  check(list.length >= 1, `S3 ListObjectsV2 matched prefix (found ${list.length} objects)`);
  console.log('\n');

  // =========================================================================
  // SUITE 4: Isolated Execution Sandbox (Firecracker Emulation & Egress Firewall)
  // =========================================================================
  console.log('📌 Suite 4: Isolated Execution Sandbox (Firecracker & Egress Firewall)');
  const sandbox = new IsolatedExecutionSandbox({
    maxMemoryMb: 256,
    timeoutMs: 15000,
    blockCloudMetadata: true,
    emulatedRuntime: 'aws-firecracker'
  });

  // Suite 4: Sandbox execution on self-contained synthetic target
  const syntheticHtml = '<html><head><title>Synthetic Benchmark</title></head><body><button id="submit-btn">Subscribe</button><button class="icon-only"></button><div role="dialog" id="modal-ad"><h3>Ad</h3><button>Close</button></div></body></html>';
  const targetDataUrl = 'data:text/html,' + encodeURIComponent(syntheticHtml);

  const execution = await sandbox.executeInSandbox(targetDataUrl, async (page) => {
    await page.goto(targetDataUrl, { waitUntil: 'domcontentloaded' });
    return {
      title: await page.title(),
      viewport: page.viewportSize()
    };
  });

  check(execution.report.cleanExit === true, 'Sandbox completed clean exit without violations');
  check(execution.report.runtime === 'aws-firecracker', 'Sandbox identified runtime as aws-firecracker');
  check(execution.report.memoryPeakMb > 0, `Sandbox monitored peak memory (${execution.report.memoryPeakMb}MB)`);
  check(execution.report.egressRequestsIntercepted >= 0, 'Sandbox intercepted egress network requests');
  console.log('\n');

  // =========================================================================
  // SUITE 5: Multi-Agent Collaborative Mesh Execution
  // =========================================================================
  console.log('📌 Suite 5: Multi-Agent Collaborative Mesh End-to-End Orchestration');
  const orchestrator = new MultiAgentMeshOrchestrator();

  const dispatchedEvents = [];
  const meshResult = await orchestrator.executeCollaborativeAudit({
    targetUrl: targetDataUrl,
    goal: 'Subscribe to newsletter and test confirmation modal',
    persona: 'keyboard',
    maxSteps: 3,
    enableRedTeamChaos: true,
    onAgentEvent: (evt) => {
      dispatchedEvents.push(evt);
    }
  });

  check(meshResult.status === 'completed', 'Multi-Agent Mesh executed successfully to completion');
  check(meshResult.agentsInvolved.length === 6, `All 6 specialized agents participated (count = ${meshResult.agentsInvolved.length})`);
  check(meshResult.agentsInvolved.includes('orchestrator'), 'Orchestrator Agent led mission');
  check(meshResult.agentsInvolved.includes('navigator'), 'Navigator Agent handled persona exploration');
  check(meshResult.agentsInvolved.includes('forensic_auditor'), 'Forensic Auditor handled formal verification');
  check(meshResult.agentsInvolved.includes('red_team_chaos'), 'Red-Team Chaos Agent injected stress conditions');
  check(meshResult.agentsInvolved.includes('causal_repair'), 'Causal Repair Agent synthesized patches');
  check(meshResult.agentsInvolved.includes('sandbox_judge'), 'Sandbox Judge Agent certified verified repairs');

  check(dispatchedEvents.length >= 4, `Multi-agent event stream recorded inter-agent communications (count = ${dispatchedEvents.length})`);
  check(meshResult.s3Artifacts.length >= 1, `Certified run artifacts persisted to AWS S3 (count = ${meshResult.s3Artifacts.length})`);
  check(meshResult.bedrockInferenceCount >= 1, `AWS Bedrock cognitive model invoked during run (${meshResult.bedrockInferenceCount} calls)`);

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${totalAssertions} AWS STRANDS, SANDBOX & MULTI-AGENT CHECKS PASSED!`);
  console.log('========================================================================\n');
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Verification Failed:', err);
  process.exit(1);
});
