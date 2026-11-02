import { strandsAgentMesh } from '../lib/barrierlens/agent/strands-agent-core.ts';

async function main() {
  console.log('1. Starting Real Strands Audit with Playwright & Amazon Bedrock...');
  const target = 'https://example.com';
  
  const res = await strandsAgentMesh.runAudit(target);
  console.log('\nAudit Completed Successfully!');
  console.log('Page Title:', res.realPageTitle);
  console.log('Interactive Nodes Found:', res.interactiveNodesFound);
  console.log('Barriers Found:', res.barriersFound);
  console.log('Total Bedrock Tokens:', res.totalTokens);
  console.log('Total Cost USD: $' + res.totalCostUsd);
  console.log('Budget Remaining USD: $' + res.budgetRemainingUsd);
  console.log('Causal Certificate SHA-256:', res.certificateSummary?.sha256);
  console.log('Causal Patch (Nova Pro):', res.certificateSummary?.patch);
}

main().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
