#!/usr/bin/env node
import { AWSCLIBridge } from '../lib/barrierlens/aws/aws-cli-bridge.ts';
import { AWSBedrockClient } from '../lib/barrierlens/aws/bedrock-client.ts';
import { MultiAgentMeshOrchestrator } from '../lib/barrierlens/multiagent/mesh-orchestrator.ts';
import { AWSS3ArtifactStore } from '../lib/barrierlens/aws/s3-artifact-store.ts';

const args = process.argv.slice(2);
const command = args[0] || 'status';

console.log('⚡ BarrierLens AWS Agentic AI CLI Bridge\n');

async function main() {
  const bridge = new AWSCLIBridge();
  const bedrock = new AWSBedrockClient();
  const s3 = new AWSS3ArtifactStore();

  switch (command) {
    case 'status': {
      console.log('🔍 Inspecting AWS CLI and Cloud Environment...\n');
      const status = await bridge.getStatus(true);
      console.log(`  • AWS CLI Installed:    ${status.isInstalled ? '✓ YES (' + status.version + ')' : '✗ NO'}`);
      console.log(`  • Configured Region:   ${status.configuredRegion}`);
      console.log(`  • Configured Account:  ${status.configuredAccount}`);
      console.log(`  • Authentication:      ${status.isAuthenticated ? '✓ ACTIVE' : '⚠ ' + (status.authError || 'Unauthenticated')}`);
      console.log(`  • AWS Bedrock Status:  ${status.bedrockReady ? '✓ READY' : '⚠ Simulation Mode Active'}`);
      console.log(`  • S3 Artifact Bucket:  ${s3.getBucketName()}`);
      console.log(`  • Active Profile:      ${status.activeProfile}\n`);

      if (!status.isAuthenticated) {
        console.log('👉 Quick Action: Run "aws login" in your terminal to re-authenticate with AWS IAM Identity Center.');
      }
      break;
    }

    case 'bedrock': {
      const prompt = args.slice(1).join(' ') || 'Synthesize minimal accessibility repair patch for unlabeled icon button.';
      console.log(`🧠 Invoking AWS Bedrock Foundation Model...`);
      console.log(`  Prompt: "${prompt}"\n`);

      const res = await bedrock.invokeModel({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        prompt
      });

      console.log(`  Model:    ${res.modelId}`);
      console.log(`  Provider: ${res.provider}`);
      console.log(`  Latency:  ${res.latencyMs}ms`);
      console.log(`  Tokens:   In=${res.tokenUsage.inputTokens}, Out=${res.tokenUsage.outputTokens}\n`);
      console.log('--- Model Output ---');
      console.log(res.text);
      console.log('--------------------\n');
      break;
    }

    case 'audit': {
      const targetUrl = args[1] || 'data:text/html,' + encodeURIComponent('<html><body><button id="cta-btn">Click me</button><button class="icon"></button><div role="dialog"><h3>Terms</h3><button>Close</button></div></body></html>');
      const goal = args[2] || 'Navigate controls and verify keyboard accessibility';

      console.log(`🚀 Launching 6-Agent Collaborative Audit in AWS Firecracker Sandbox...`);
      console.log(`  Target: "${targetUrl}"`);
      console.log(`  Goal:   "${goal}"\n`);

      const orchestrator = new MultiAgentMeshOrchestrator();

      const result = await orchestrator.executeCollaborativeAudit({
        targetUrl,
        goal,
        persona: 'keyboard',
        maxSteps: 4,
        enableRedTeamChaos: true,
        onAgentEvent: (evt) => {
          console.log(`  [${evt.fromAgent.toUpperCase()} → ${evt.toAgent.toUpperCase()}] ${evt.description}`);
        }
      });

      console.log('\n--- Mission Summary ---');
      console.log(`  Status:             ${result.status.toUpperCase()}`);
      console.log(`  Agents Involved:    ${result.agentsInvolved.join(', ')}`);
      console.log(`  Barriers Flagged:   ${result.findings.length}`);
      console.log(`  Causal Certs Signed: ${result.certificates.length}`);
      console.log(`  Bedrock Inferences: ${result.bedrockInferenceCount}`);
      console.log(`  Sandbox Runtime:    ${result.sandboxReport.runtime} (Peak Mem: ${result.sandboxReport.memoryPeakMb}MB)`);
      console.log(`  S3 Artifacts:       ${result.s3Artifacts.length} uploaded\n`);
      break;
    }

    default:
      console.log('Usage:');
      console.log('  node scripts/aws-agent-cli.mjs status');
      console.log('  node scripts/aws-agent-cli.mjs bedrock "<prompt>"');
      console.log('  node scripts/aws-agent-cli.mjs audit <targetUrl> "<goal>"\n');
  }
}

main().catch(err => {
  console.error('❌ Error executing AWS Agent CLI:', err.message);
  process.exit(1);
});
