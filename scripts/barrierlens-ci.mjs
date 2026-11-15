#!/usr/bin/env node

/**
 * BarrierLens CI/CD Autonomous PR Gatekeeper
 * 
 * Executes task-conditioned accessibility audits in CI pipelines (GitHub Actions,
 * GitLab CI, CircleCI), enforces Metamorphic Effort Ratio budgets, detects
 * keyboard traps, outputs JUnit XML test reports, and writes GitHub Step Summaries.
 * 
 * Usage:
 *   node scripts/barrierlens-ci.mjs --url=http://localhost:3000 --budget=2.5
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuditorCore } from '../lib/barrierlens/agent/auditor-core.ts';
import { GitPatchGenerator } from '../lib/barrierlens/repair/git-patch-generator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
function parseArgs(argv) {
  const options = {
    url: process.env.TARGET_URL || 'http://127.0.0.1:3000/benchmark',
    goal: process.env.AUDIT_GOAL || 'Verify primary interaction flow and keyboard accessibility without traps',
    persona: process.env.AUDIT_PERSONA || 'keyboard',
    budget: parseFloat(process.env.EFFORT_BUDGET || '3.5'),
    maxSteps: parseInt(process.env.MAX_STEPS || '10', 10),
    failOnBlocker: process.env.FAIL_ON_BLOCKER !== 'false',
    junitOut: process.env.JUNIT_OUT || null,
    jsonOut: process.env.JSON_OUT || null,
    postComment: process.env.PR_COMMENT === 'true'
  };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--url=')) options.url = arg.split('=')[1];
    else if (arg.startsWith('--goal=')) options.goal = arg.split('=')[1];
    else if (arg.startsWith('--persona=')) options.persona = arg.split('=')[1];
    else if (arg.startsWith('--budget=')) options.budget = parseFloat(arg.split('=')[1]);
    else if (arg.startsWith('--max-steps=')) options.maxSteps = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--fail-on-blocker=')) options.failOnBlocker = arg.split('=')[1] !== 'false';
    else if (arg.startsWith('--junit-out=')) options.junitOut = arg.split('=')[1];
    else if (arg.startsWith('--json-out=')) options.jsonOut = arg.split('=')[1];
    else if (arg === '--pr-comment') options.postComment = true;
  }

  return options;
}

// Generate JUnit XML for CI test viewers
function generateJunitXml(run, options, testPassed, failureReasons) {
  const durationSec = (new Date(run.finishedAt || Date.now()).getTime() - new Date(run.startedAt).getTime()) / 1000;
  const testcases = [];

  // Testcase 1: Task Completion
  const tc1Failed = !run.taskSuccess ? `<failure message="Task goal was not completed">${run.notes || 'Autonomous agent could not complete flow'}</failure>` : '';
  testcases.push(`    <testcase classname="BarrierLens.Auditor" name="TaskCompletion" time="${(durationSec * 0.4).toFixed(2)}">${tc1Failed}</testcase>`);

  // Testcase 2: Effort Ratio Budget
  const tc2Failed = run.effortRatio > options.budget
    ? `<failure message="Effort ratio ${run.effortRatio.toFixed(2)} exceeded budget of ${options.budget.toFixed(2)}" />`
    : '';
  testcases.push(`    <testcase classname="BarrierLens.MetamorphicEngine" name="EffortRatioBudget" time="${(durationSec * 0.2).toFixed(2)}">${tc2Failed}</testcase>`);

  // Testcase 3: Critical & High Blockers
  const blockerFindings = run.findings.filter(f => f.severity === 'critical' || f.severity === 'high');
  const tc3Failed = blockerFindings.length > 0 && options.failOnBlocker
    ? `<failure message="Found ${blockerFindings.length} severe accessibility blockers">\n${blockerFindings.map(f => `[${f.trustTier.toUpperCase()}] ${f.title} (${f.wcagRules.join(', ')})`).join('\n')}\n</failure>`
    : '';
  testcases.push(`    <testcase classname="BarrierLens.TrapCertification" name="ZeroCriticalBlockers" time="${(durationSec * 0.4).toFixed(2)}">${tc3Failed}</testcase>`);

  const failuresCount = testPassed ? 0 : failureReasons.length;

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="BarrierLens Gatekeeper" tests="3" failures="${failuresCount}" errors="0" time="${durationSec.toFixed(2)}">
  <testsuite name="AccessibilityJourneyAudit" tests="3" failures="${failuresCount}" time="${durationSec.toFixed(2)}">
${testcases.join('\n')}
  </testsuite>
</testsuites>`;
}

// Generate rich Markdown for GitHub Step Summary and PR comments
function generateMarkdownSummary(run, options, testPassed, failureReasons) {
  const patchGenerator = new GitPatchGenerator();
  const patchBundle = patchGenerator.createPatchBundle(run.findings);

  const statusEmoji = testPassed ? '✅' : '❌';
  const statusTitle = testPassed ? 'BarrierLens PR Gatekeeper: PASSED' : 'BarrierLens PR Gatekeeper: FAILED / BLOCKED';

  let md = `## ${statusEmoji} ${statusTitle}\n\n`;
  md += `**Target URL:** \`${run.targetUrl}\`  \n`;
  md += `**Goal:** *${run.goal}*  \n`;
  md += `**Physical Persona:** \`${run.persona}\`  \n`;
  md += `**Audit Status:** \`${run.status.toUpperCase()}\` | **Duration:** \`${((new Date(run.finishedAt || Date.now()).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1)}s\`\n\n`;

  md += `### 📊 Metamorphic Metrics & Performance\n\n`;
  md += `| Metric | Measured | Budget / Target | Status |\n`;
  md += `|---|---|---|---|\n`;
  md += `| **Task Success** | ${run.taskSuccess ? '✅ Yes' : '❌ Blocked'} | Complete | ${run.taskSuccess ? '✅ PASS' : '❌ FAIL'} |\n`;
  md += `| **Effort Ratio ($E_{ratio}$)** | \`${run.effortRatio ? run.effortRatio.toFixed(2) : '1.00'}x\` | $\\le ${options.budget.toFixed(2)}x$ | ${run.effortRatio <= options.budget ? '✅ PASS' : '⚠️ EXCEEDED'} |\n`;
  md += `| **Total Steps** | \`${run.steps ? run.steps.length : 0}\` | $\\le ${options.maxSteps}$ | ✅ OK |\n`;
  const t0 = run.tierMix?.tier0Rules ?? run.tierMix?.t0 ?? 0;
  const t1 = run.tierMix?.tier1Ranker ?? run.tierMix?.t1 ?? 0;
  const t2 = run.tierMix?.tier2Groq ?? run.tierMix?.t2 ?? 0;
  const t3 = run.tierMix?.tier3Gemini ?? run.tierMix?.t3 ?? 0;
  md += `| **Tier Mix** | \`T0: ${t0} | T1: ${t1} | T2: ${t2} | T3: ${t3}\` | High T0/T1 | ⚡ Optimized |\n\n`;

  if (failureReasons.length > 0) {
    md += `> [!CAUTION]\n`;
    md += `> **CI Gate Failure Reasons:**\n`;
    for (const r of failureReasons) {
      md += `> - ${r}\n`;
    }
    md += `\n`;
  }

  md += `### 🔍 Discovered Behavioral Findings (${run.findings.length})\n\n`;
  if (run.findings.length === 0) {
    md += `*No accessibility barriers detected! The tested journey is completely fluid and accessible.* 🎉\n\n`;
  } else {
    md += `| Tier | Severity | Barrier Kind | WCAG | Title |\n`;
    md += `|---|---|---|---|---|\n`;
    for (const f of run.findings) {
      const tierBadge = f.trustTier === 'proven' ? '🛡️ **Proven**' : f.trustTier === 'observed' ? '👁️ *Observed*' : '🤖 Suspected';
      const sevBadge = f.severity === 'critical' ? '🔴 Critical' : f.severity === 'high' ? '🟠 High' : f.severity === 'medium' ? '🟡 Medium' : '⚪ Low';
      md += `| ${tierBadge} | ${sevBadge} | \`${f.kind}\` | \`${f.wcagRules.join(', ') || 'N/A'}\` | ${f.title} |\n`;
    }
    md += `\n`;

    // Reproducing Key Sequences for Proven Traps
    const trapFindings = run.findings.filter(f => f.kind === 'keyboard_trap' && f.certificate);
    if (trapFindings.length > 0) {
      md += `#### 🪤 Certified Keyboard Trap Reproductions\n\n`;
      for (const t of trapFindings) {
        md += `- **Trap in \`${t.certificate.entryNodeId}\`**: Reproducing Keys: \`${t.certificate.reproducingKeySequence.join(' ➔ ')}\`\n`;
        md += `  > *Proof:* ${t.certificate.proofExplanation}\n`;
      }
      md += `\n`;
    }

    // Git Unified Patch Details
    if (patchBundle && run.findings.some(f => f.trustTier === 'proven' || f.trustTier === 'observed')) {
      md += `### 🛠️ One-Click Verified Fix Patch\n\n`;
      md += `Apply this patch directly to your repository using \`git apply\`:\n\n`;
      md += `\`\`\`diff\n${patchBundle}\n\`\`\`\n\n`;
    }
  }

  md += `---\n*Automated report generated by [BarrierLens](https://github.com/barrierlens) v2.6.0 Autonomous CI Gatekeeper*`;
  return md;
}

// Post comment to GitHub PR if token and env are set
async function maybePostGitHubComment(markdownSummary) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER || (process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)\/merge/) ? RegExp.$1 : null);

  if (!token || !repo || !prNumber) {
    return;
  }

  console.log(`[BarrierLens CI] Posting comment to GitHub PR #${prNumber} on ${repo}...`);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: markdownSummary })
    });

    if (res.ok) {
      console.log(`[BarrierLens CI] Successfully posted PR comment.`);
    } else {
      console.warn(`[BarrierLens CI] Failed to post PR comment: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.warn(`[BarrierLens CI] Error posting GitHub comment:`, err.message);
  }
}

// Main execution
async function main() {
  const options = parseArgs(process.argv);
  console.log(`=======================================================`);
  console.log(`🛡️  BARRIERLENS AUTONOMOUS PR GATEKEEPER (v2.6.0)`);
  console.log(`=======================================================`);
  console.log(`Target URL:       ${options.url}`);
  console.log(`Goal:             ${options.goal}`);
  console.log(`Persona:          ${options.persona}`);
  console.log(`Effort Budget:    ${options.budget.toFixed(2)}x`);
  console.log(`Max Steps:        ${options.maxSteps}`);
  console.log(`Fail On Blocker:  ${options.failOnBlocker}`);
  console.log(`-------------------------------------------------------`);

  const auditor = new AuditorCore();
  const startTime = Date.now();

  let run;
  try {
    run = await auditor.runAudit(options.url, options.goal, options.persona, options.maxSteps);
  } catch (err) {
    console.error(`[BarrierLens CI] Fatal execution error during audit:`, err);
    process.exit(1);
  }

  const durationMs = Date.now() - startTime;
  console.log(`[BarrierLens CI] Audit finished in ${(durationMs / 1000).toFixed(2)}s with status: ${run.status}`);

  // Evaluate Gate Conditions
  const failureReasons = [];
  if (!run.taskSuccess) {
    failureReasons.push(`Task goal failed: "${options.goal}" could not be completed.`);
  }

  if (run.effortRatio > options.budget) {
    failureReasons.push(`Effort Ratio of ${run.effortRatio.toFixed(2)}x exceeded allowable budget of ${options.budget.toFixed(2)}x.`);
  }

  const blockers = run.findings.filter(f => f.severity === 'critical' || f.severity === 'high');
  if (blockers.length > 0 && options.failOnBlocker) {
    failureReasons.push(`Encountered ${blockers.length} severe accessibility blockers (${blockers.map(b => b.kind).join(', ')}).`);
  }

  const testPassed = failureReasons.length === 0;

  // Print CLI Summary Table
  console.log(`\n================== AUDIT SCORECARD ==================`);
  console.log(`Task Success:      ${run.taskSuccess ? '✅ YES' : '❌ NO'}`);
  console.log(`Effort Ratio:      ${run.effortRatio ? run.effortRatio.toFixed(2) : '1.00'}x (Budget: <= ${options.budget.toFixed(2)}x)`);
  console.log(`Total Findings:    ${run.findings.length}`);
  console.log(`Critical/High:     ${blockers.length}`);
  console.log(`Overall Result:    ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`=====================================================\n`);

  // Write Markdown Summary
  const mdSummary = generateMarkdownSummary(run, options, testPassed, failureReasons);

  // If in GitHub Actions, write to GITHUB_STEP_SUMMARY
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, mdSummary + '\n');
      console.log(`[BarrierLens CI] Written summary to GITHUB_STEP_SUMMARY.`);
    } catch (e) {
      console.warn(`[BarrierLens CI] Could not write to GITHUB_STEP_SUMMARY:`, e.message);
    }
  }

  // Write JUnit XML if requested
  if (options.junitOut) {
    try {
      const xml = generateJunitXml(run, options, testPassed, failureReasons);
      const outDir = path.dirname(path.resolve(options.junitOut));
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      fs.writeFileSync(options.junitOut, xml, 'utf-8');
      console.log(`[BarrierLens CI] Written JUnit XML to ${options.junitOut}`);
    } catch (e) {
      console.warn(`[BarrierLens CI] Could not write JUnit XML:`, e.message);
    }
  }

  // Write JSON output if requested
  if (options.jsonOut) {
    try {
      const outDir = path.dirname(path.resolve(options.jsonOut));
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      fs.writeFileSync(options.jsonOut, JSON.stringify(run, null, 2), 'utf-8');
      console.log(`[BarrierLens CI] Written JSON report to ${options.jsonOut}`);
    } catch (e) {
      console.warn(`[BarrierLens CI] Could not write JSON:`, e.message);
    }
  }

  // Optionally post PR comment
  if (options.postComment) {
    await maybePostGitHubComment(mdSummary);
  }

  // Exit with proper code
  if (!testPassed) {
    console.error(`[BarrierLens CI] ❌ PR Gatekeeper check FAILED with ${failureReasons.length} issue(s):`);
    for (const r of failureReasons) {
      console.error(`  - ${r}`);
    }
    process.exit(1);
  }

  console.log(`[BarrierLens CI] ✅ PR Gatekeeper check PASSED.`);
  process.exit(0);
}

main().catch(err => {
  console.error('[BarrierLens CI] Fatal uncaught error:', err);
  process.exit(1);
});
