#!/usr/bin/env node
/**
 * BarrierLens Autonomous GitHub PR Self-Healing Bot CLI
 * 
 * Usage:
 *   node scripts/barrierlens-bot.mjs --url="https://mysite.com" --owner="facebook" --repo="react"
 */

import { AuditorCore } from '../lib/barrierlens/agent/auditor-core.ts';
import { GitPatchGenerator } from '../lib/barrierlens/repair/git-patch-generator.ts';
import { VPATGenerator } from '../lib/barrierlens/compliance/vpat-generator.ts';
import { GitHubPREngine } from '../lib/barrierlens/bot/github-pr-engine.ts';

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    url: 'file:///E:/AGENTIC/fixtures/fixture-keyboard-trap.html',
    owner: 'AadityaUniyal',
    repo: 'BarrierLens',
    base: 'main',
    token: process.env.GITHUB_TOKEN || '',
    steps: 4
  };

  for (const arg of args) {
    if (arg.startsWith('--url=')) params.url = arg.split('=')[1];
    else if (arg.startsWith('--owner=')) params.owner = arg.split('=')[1];
    else if (arg.startsWith('--repo=')) params.repo = arg.split('=')[1];
    else if (arg.startsWith('--base=')) params.base = arg.split('=')[1];
    else if (arg.startsWith('--token=')) params.token = arg.split('=')[1];
    else if (arg.startsWith('--steps=')) params.steps = parseInt(arg.split('=')[1], 10);
  }

  return params;
}

async function main() {
  const { url, owner, repo, base, token, steps } = parseArgs();

  console.log('======================================================================');
  console.log('🤖 BARRIERLENS AUTONOMOUS GITHUB SELF-HEALING BOT');
  console.log('======================================================================');
  console.log(` Target URL : ${url}`);
  console.log(` Repository : ${owner}/${repo} (base: ${base})`);
  console.log(` Max Steps  : ${steps}`);
  console.log('======================================================================\n');

  const auditor = new AuditorCore();
  const patchGen = new GitPatchGenerator();
  const vpatGen = new VPATGenerator();
  const botEngine = new GitHubPREngine();

  console.log('🔍 Executing autonomous behavioral audit...');
  const auditResult = await auditor.runAudit(url, '', 'KEYBOARD', steps);

  console.log(`\n📊 Audit Finished. Discovered ${auditResult.findings.length} findings.`);

  console.log('🛠️  Synthesizing verified AST counterfactual patches...');
  const patchBundle = patchGen.createStructuredPatchBundle(auditResult.findings);
  console.log(`  ✓ Generated patch bundle with ${patchBundle.patches.length} AST repair targets.`);

  console.log('🏛️  Generating official VPAT 2.5 compliance matrix...');
  const vpatBundle = vpatGen.generateVPATBundle(auditResult, auditResult.findings);
  console.log(`  ✓ VPAT Status: ${vpatBundle.conformanceSummary.overallStatus} (${vpatBundle.conformanceSummary.supportsCount}/${vpatBundle.conformanceSummary.totalCriteria} Supports)`);

  console.log('🚀 Triggering autonomous GitHub PR dispatch...');
  const prResult = await botEngine.createSelfHealingPR({
    owner,
    repo,
    baseBranch: base,
    token,
    run: auditResult,
    findings: auditResult.findings,
    patchBundle
  });

  console.log('\n======================================================================');
  console.log('🏁 BOT EXECUTION RESULTS');
  console.log('======================================================================');
  console.log(` Status         : ${prResult.status.toUpperCase()}`);
  console.log(` Branch Name    : ${prResult.branchName}`);
  console.log(` Pull Request   : ${prResult.prUrl || 'Simulated'}`);
  console.log(` Patches Staged : ${prResult.commitsCreated}`);
  console.log(` Message        : ${prResult.message}`);
  console.log('======================================================================\n');
}

main().catch(err => {
  console.error('[Bot Error]:', err);
  process.exit(1);
});
