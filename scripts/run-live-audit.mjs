#!/usr/bin/env node

/**
 * BarrierLens Live Auditor CLI
 * 
 * Runs a live, end-to-end task-conditioned audit against any target URL
 * utilizing the full multi-tier ML engine (LightGBM, MiniLM, CLIP, Qwen2.5-Coder SLM).
 * 
 * Usage:
 *   npm run audit:live -- --url="http://127.0.0.1:3000/benchmark" --goal="Subscribe to newsletter"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);

if (!process.env.RUNNING_UNDER_TSX) {
  const result = spawnSync('npx', ['tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, RUNNING_UNDER_TSX: '1' },
    shell: true
  });
  process.exit(result.status ?? 0);
}

const { AuditorCore } = await import('../lib/barrierlens/agent/auditor-core.ts');
const { GitPatchGenerator } = await import('../lib/barrierlens/repair/git-patch-generator.ts');

function parseArgs(argv) {
  const options = {
    url: 'http://127.0.0.1:3000/benchmark',
    goal: 'Navigate primary flows, test keyboard trap escape, and ensure accessible names',
    persona: 'keyboard',
    maxSteps: 8,
    out: 'test-results/live-audit-result.json'
  };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--url=')) options.url = arg.split('=')[1];
    else if (arg.startsWith('--goal=')) options.goal = arg.split('=')[1];
    else if (arg.startsWith('--persona=')) options.persona = arg.split('=')[1];
    else if (arg.startsWith('--steps=')) options.maxSteps = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--out=')) options.out = arg.split('=')[1];
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv);

  console.log('='.repeat(70));
  console.log('🔍 BARRIERLENS LIVE BEHAVIORAL ACCESSIBILITY AUDIT');
  console.log('='.repeat(70));
  console.log(` Target URL : ${options.url}`);
  console.log(` Mission    : "${options.goal}"`);
  console.log(` Persona    : ${options.persona.toUpperCase()} (Strict Physical Input Constraint)`);
  console.log(` Max Steps  : ${options.maxSteps}`);
  console.log('='.repeat(70) + '\n');

  const auditor = new AuditorCore();
  const startTime = Date.now();

  try {
    const result = await auditor.runAudit(
      options.url,
      options.goal,
      options.persona,
      options.maxSteps,
      (event) => {
        if (event.type === 'step') {
          const s = event.data?.step || event.data;
          const tierLabel = s.tier === 1 ? '⚡ Tier 1 (LightGBM <1ms)' : s.tier === 2 ? '🤖 Tier 2 (Local SLM CUDA)' : `Tier ${s.tier ?? 0}`;
          console.log(`  [STEP ${s.idx ?? '?'}] Action: \x1b[36m${s.actionType || s.action}\x1b[0m ${s.key ? `(\x1b[33m${s.key}\x1b[0m)` : ''} -> Target: ${s.activeElementAfter || 'body'} [${tierLabel}]`);
        } else if (event.type === 'finding') {
          const f = event.data?.finding || event.data;
          console.log(`  \x1b[31m[BARRIER DETECTED]\x1b[0m ${f.title} (${f.severity?.toUpperCase()})`);
          if (f.certificate?.proofExplanation) {
            console.log(`    └─ Proof: ${f.certificate.proofExplanation}`);
          }
        } else if (event.type === 'status') {
          console.log(`  \x1b[90m[STATUS]\x1b[0m ${event.data?.message || event.data}`);
        }
      }
    );

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(70));
    console.log('📊 AUDIT SUMMARY & METAMORPHIC METRICS');
    console.log('='.repeat(70));
    console.log(` Status               : ${result.taskSuccess ? '✅ Task Completed' : '⚠️ Task Incomplete / Blocked'}`);
    console.log(` Duration             : ${elapsedSec}s`);
    console.log(` Steps Executed       : ${result.steps.length}`);
    console.log(` Effort Ratio         : ${result.effortRatio?.toFixed(1) ?? 'N/A'}x vs Mouse Baseline`);
    console.log(` Reading Order Tau    : ${result.kendallTau?.tau?.toFixed(2) ?? 'N/A'}`);
    console.log(` Findings Count       : ${result.findings.length}`);

    // Generate Surgical Patch Bundle if findings exist
    if (result.findings.length > 0) {
      console.log('\n🛠️  SYNTHESIZING VERIFIED AST COUNTERFACTUAL PATCHES...');
      const patchGen = new GitPatchGenerator();
      const patchBundle = patchGen.createPatchBundle(result.findings);
      console.log(`  ✓ Generated consolidated patch bundle for ${result.findings.length} findings`);
      result.patchBundle = patchBundle;
    }

    // Save output
    const outDir = path.dirname(path.resolve(options.out));
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(options.out), JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n💾 Saved audit evidence bundle to: ${options.out}`);
    console.log('='.repeat(70) + '\n');
  } catch (err) {
    console.error('\n\x1b[31m[AUDIT FAILED]\x1b[0m', err.message);
    process.exit(1);
  }
}

main();
