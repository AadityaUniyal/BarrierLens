/**
 * Comprehensive Verification Suite for Apple Philosophy, Neon pgvector, and AWS Strands SDK
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Check environment
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

async function runVerification() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   BarrierLens Apple + Neon + Strands Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ [${total}] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ [${total}] ${name}:`, e.message);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [${total}] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ [${total}] ${name}:`, e.message);
    }
  }

  // 1. Strands SDK Imports & Constructors
  await testAsync('@strands-agents/sdk exports & constructors', async () => {
    const strands = await import('@strands-agents/sdk');
    assert.strictEqual(typeof strands.Agent, 'function', 'Agent should be constructor');
    assert.strictEqual(typeof strands.BedrockModel, 'function', 'BedrockModel should be constructor');
    assert.strictEqual(typeof strands.FunctionTool, 'function', 'FunctionTool should be constructor');
    assert.strictEqual(typeof strands.Swarm, 'function', 'Swarm should be constructor');
  });

  // 2. Strands FunctionTool Execution
  await testAsync('Strands FunctionTool invocation', async () => {
    const { FunctionTool } = await import('@strands-agents/sdk');
    const tool = new FunctionTool({
      name: 'tarjan_detector',
      description: 'Finds focus traps',
      inputSchema: { type: 'object', properties: { count: { type: 'number' } } },
      callback: async (input) => ({ detected: true, count: input.count }),
    });

    const res = await tool.invoke({ count: 5 });
    assert.strictEqual(res.detected, true);
    assert.strictEqual(res.count, 5);
  });

  // 3. Strands Core Agent Mesh
  await testAsync('StrandsAgentMesh end-to-end execution', async () => {
    const { strandsAgentMesh } = await import('../lib/barrierlens/agent/strands-agent-core.ts');
    assert.ok(strandsAgentMesh, 'strandsAgentMesh should be instantiated');

    const result = await strandsAgentMesh.runAudit('https://apple.com/shop');
    assert.ok(result.traceId.startsWith('strands-'), 'traceId should have strands- prefix');
    assert.strictEqual(result.steps.length, 5, 'Should execute 5 agent steps');
    assert.strictEqual(result.causalCertificatesSigned, 1, 'Should sign 1 certificate');
    assert.ok(result.totalTokens > 0, 'Should track token count');
    assert.ok(result.totalCostUsd < 0.05, 'Total cost should be tiny to protect budget');
    assert.ok(result.certificateSummary.sha256.length === 64, 'SHA-256 certificate should be 64 hex chars');
  });

  // 4. Neon Database Service Methods
  await testAsync('Neon services certificate & trace persistence', async () => {
    const { neonServices } = await import('../lib/neon/services.ts');
    assert.strictEqual(typeof neonServices.saveCausalCertificate, 'function');
    assert.strictEqual(typeof neonServices.recordAgentTrace, 'function');
    assert.strictEqual(typeof neonServices.getAgentTraces, 'function');

    const certRes = await neonServices.saveCausalCertificate({
      findingId: 'verify-test-' + Date.now(),
      sha256Hash: 'a'.repeat(64),
      targetUrl: 'https://apple.com',
      persona: 'Keyboard',
      wcagRule: '2.1.2',
      interventionTarget: 'div',
      interventionAction: 'fix',
      astPatch: '<div>fixed</div>',
    });
    assert.ok(certRes, 'saveCausalCertificate should return result');
  });

  // 5. Genome 768-dim Encoder
  await testAsync('Barrier Genome 768-dim embedding and normalization', async () => {
    const { BarrierGenomeEncoder } = await import('../lib/barrierlens/genome/barrier-encoder.ts');
    const encoder = new BarrierGenomeEncoder();
    const finding = {
      id: 'test-f1',
      kind: 'focus_loop',
      stepIdx: 3,
      trustTier: 'proven',
      wcagRules: ['2.1.2'],
      severityScore: 9.0,
      severityInterval: [8.5, 9.5],
      effortCost: 4.0,
      evidence: { domSnippet: '<button>click</button>', axPath: ['body', 'button'], stepIndex: 3 },
      timestamp: new Date().toISOString(),
    };
    const context = {
      targetUrl: 'https://apple.com',
      persona: 'keyboard',
      viewport: { width: 1280, height: 800 },
      taskSuccess: false,
      effortRatio: 2.5,
      stepCount: 5,
      maxSteps: 15,
    };
    const genome = encoder.encode(finding, context);

    assert.strictEqual(genome.vector.length, 768, 'Genome vector must be 768 dimensions');
    assert.ok(Math.abs(genome.magnitude - 1.0) < 0.001, 'Magnitude must be unit-normalized (~1.0)');
  });

  // 6. Frontend Components Exist
  test('Cupertino Apple UI components present', () => {
    const compDir = path.resolve(process.cwd(), 'components/apple');
    const files = fs.readdirSync(compDir);
    assert.ok(files.includes('LiveMissionControl.tsx'), 'LiveMissionControl.tsx must exist');
    assert.ok(files.includes('VisualTwinSimulator.tsx'), 'VisualTwinSimulator.tsx must exist');
    assert.ok(files.includes('BarrierGenomeViz.tsx'), 'BarrierGenomeViz.tsx must exist');
    assert.ok(files.includes('CausalDiffView.tsx'), 'CausalDiffView.tsx must exist');
    assert.ok(files.includes('StressTestDashboard.tsx'), 'StressTestDashboard.tsx must exist');
    assert.ok(files.includes('AWSBridgeConsole.tsx'), 'AWSBridgeConsole.tsx must exist');
    assert.ok(files.includes('MultiAgentMeshView.tsx'), 'MultiAgentMeshView.tsx must exist');
  });

  // 7. AWS Route Exists
  test('Strands API Route present', () => {
    const apiRoute = path.resolve(process.cwd(), 'app/api/strands/route.ts');
    assert.ok(fs.existsSync(apiRoute), 'app/api/strands/route.ts must exist');
  });

  console.log(`\nVerification complete: ${passed}/${total} checks passed.\n`);
  if (passed < total) process.exit(1);
}

runVerification();
