/**
 * BarrierLens 2.0 - Unified Master E2E Test Runner CLI
 * 
 * Discovers, filters, executes, and reports on the 4-tier E2E test suite.
 * Compatible with Node.js 22 built-in test runner (node:test) + tsx.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface CliArgs {
  tier?: string;
  suite?: string;
  filter?: string;
  smoke?: boolean;
  bail?: boolean;
  verbose?: boolean;
  timeout?: number;
  help?: boolean;
}

interface SuiteResult {
  file: string;
  relativePath: string;
  passed: boolean;
  exitCode: number;
  testsCount: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  failureDetails?: string[];
}

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--smoke') {
      args.smoke = true;
    } else if (arg === '--bail') {
      args.bail = true;
    } else if (arg === '--verbose') {
      args.verbose = true;
    } else if (arg.startsWith('--tier=')) {
      args.tier = arg.split('=')[1].trim();
    } else if (arg.startsWith('--suite=')) {
      args.suite = arg.split('=')[1].trim();
    } else if (arg.startsWith('--filter=')) {
      args.filter = arg.split('=')[1].trim();
    } else if (arg.startsWith('--timeout=')) {
      args.timeout = parseInt(arg.split('=')[1].trim(), 10);
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                  BarrierLens 2.0 - Master E2E Test Runner                 ║
╚═══════════════════════════════════════════════════════════════════════════╝

Usage:
  npx tsx tests/e2e/run-all.ts [options]
  npm run test:e2e -- [options]

Options:
  --tier=<1|2|3|4|all>   Execute test suites belonging to a specific tier
                         1: Feature Coverage (42 features, >=210 tests)
                         2: Boundary & Corner Cases (>=40 tests)
                         3: Cross-Feature Combinations (>=30 tests)
                         4: Real-World CUJ Scenarios (>=20 steps)
                         all: All discovered test suites (default)
  --suite=<name>         Filter test files whose filename or path matches <name>
                         e.g. --suite=navigation, --suite=backend, --suite=modals
  --filter=<regex>       Filter test file paths matching a regex pattern
  --smoke                Run only the test harness smoke test
  --bail                 Halt execution immediately on the first test suite failure
  --verbose              Stream full test runner output to stdout/stderr
  --timeout=<ms>         Timeout per test suite in milliseconds (default: 120000)
  --help, -h             Show this help documentation

Examples:
  npx tsx tests/e2e/run-all.ts --smoke
  npx tsx tests/e2e/run-all.ts --tier=1
  npx tsx tests/e2e/run-all.ts --tier=2 --bail
  npx tsx tests/e2e/run-all.ts --suite=ui-navigation-shell
  npx tsx tests/e2e/run-all.ts --verbose
`);
}

function discoverTestFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        results = results.concat(discoverTestFiles(fullPath, baseDir));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts'))) {
      results.push(fullPath);
    }
  }

  return results;
}

function filterTestFiles(files: string[], args: CliArgs, rootDir: string): string[] {
  let filtered = [...files];

  if (args.smoke) {
    return filtered.filter((f) => f.includes('smoke.test.ts'));
  }

  if (args.tier && args.tier !== 'all') {
    const tierMap: Record<string, string> = {
      '1': 'tier1-feature-coverage',
      '2': 'tier2-boundary-corner',
      '3': 'tier3-cross-feature',
      '4': 'tier4-application-scenarios',
      'smoke': 'smoke.test.ts',
    };
    const targetFolder = tierMap[args.tier] || `tier${args.tier}`;
    filtered = filtered.filter((f) => {
      const rel = path.relative(rootDir, f).replace(/\\/g, '/');
      return rel.includes(targetFolder);
    });
  }

  if (args.suite) {
    const s = args.suite.toLowerCase();
    filtered = filtered.filter((f) => f.toLowerCase().includes(s));
  }

  if (args.filter) {
    const reg = new RegExp(args.filter, 'i');
    filtered = filtered.filter((f) => reg.test(f));
  }

  return filtered;
}

function parseTapOutput(output: string): {
  testsCount: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  durationMs: number;
  failures: string[];
} {
  let testsCount = 0;
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  let durationMs = 0;
  const failures: string[] = [];

  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# tests ')) {
      testsCount = parseInt(trimmed.replace('# tests ', ''), 10) || 0;
    } else if (trimmed.startsWith('# pass ')) {
      passCount = parseInt(trimmed.replace('# pass ', ''), 10) || 0;
    } else if (trimmed.startsWith('# fail ')) {
      failCount = parseInt(trimmed.replace('# fail ', ''), 10) || 0;
    } else if (trimmed.startsWith('# skipped ') || trimmed.startsWith('# todo ')) {
      skipCount += parseInt(trimmed.replace(/# (skipped|todo) /, ''), 10) || 0;
    } else if (trimmed.startsWith('# duration_ms ')) {
      durationMs = parseFloat(trimmed.replace('# duration_ms ', '')) || 0;
    } else if (trimmed.startsWith('not ok ')) {
      failures.push(trimmed);
    }
  }

  // Fallback heuristic if TAP totals line wasn't matched
  if (testsCount === 0) {
    const okMatches = output.match(/^[ \t]*ok \d+/gm);
    const notOkMatches = output.match(/^[ \t]*not ok \d+/gm);
    passCount = okMatches ? okMatches.length : 0;
    failCount = notOkMatches ? notOkMatches.length : 0;
    testsCount = passCount + failCount;
  }

  return { testsCount, passCount, failCount, skipCount, durationMs, failures };
}

async function runSingleSuite(filePath: string, workspaceRoot: string, options: CliArgs): Promise<SuiteResult> {
  const relPath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
  const timeoutMs = options.timeout || 120_000;

  return new Promise<SuiteResult>((resolve) => {
    const startTime = performance.now();
    let stdoutBuffer = '';
    let stderrBuffer = '';

    const isWindows = process.platform === 'win32';
    const nodeCmd = 'node';
    const child = spawn(nodeCmd, ['--import', 'tsx', '--test', filePath], {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        FORCE_COLOR: '1',
      },
      shell: false,
    });

    const timeoutTimer = setTimeout(() => {
      try {
        child.kill('SIGTERM');
      } catch {}
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdoutBuffer += text;
      if (options.verbose) {
        process.stdout.write(text);
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuffer += text;
      if (options.verbose) {
        process.stderr.write(text);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeoutTimer);
      const durationMs = Math.round(performance.now() - startTime);
      const exitCode = code ?? (stderrBuffer ? 1 : 0);
      const parsed = parseTapOutput(stdoutBuffer);

      resolve({
        file: filePath,
        relativePath: relPath,
        passed: exitCode === 0 && parsed.failCount === 0,
        exitCode,
        testsCount: parsed.testsCount,
        passCount: parsed.passCount,
        failCount: parsed.failCount,
        skipCount: parsed.skipCount,
        durationMs: parsed.durationMs > 0 ? Math.round(parsed.durationMs) : durationMs,
        stdout: stdoutBuffer,
        stderr: stderrBuffer,
        failureDetails: parsed.failures,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timeoutTimer);
      const durationMs = Math.round(performance.now() - startTime);
      resolve({
        file: filePath,
        relativePath: relPath,
        passed: false,
        exitCode: 1,
        testsCount: 0,
        passCount: 0,
        failCount: 1,
        skipCount: 0,
        durationMs,
        stdout: stdoutBuffer,
        stderr: `${stderrBuffer}\nSpawn error: ${String(err)}`,
        failureDetails: [`Spawn error: ${String(err)}`],
      });
    });
  });
}

function padRight(str: string, length: number): string {
  return str.length >= length ? str.slice(0, length) : str + ' '.repeat(length - str.length);
}

function padLeft(str: string, length: number): string {
  return str.length >= length ? str.slice(0, length) : ' '.repeat(length - str.length) + str;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const workspaceRoot = path.resolve(process.cwd());
  const e2eDir = path.join(workspaceRoot, 'tests', 'e2e');

  console.log(`\n=============================================================================`);
  console.log(`              BarrierLens 2.0 - Autonomous E2E Test Suite Runner             `);
  console.log(`=============================================================================`);
  console.log(`Workspace:  ${workspaceRoot}`);
  console.log(`Filter:     tier=${args.tier || 'all'}, suite=${args.suite || 'any'}, smoke=${Boolean(args.smoke)}`);

  const allTestFiles = discoverTestFiles(e2eDir, workspaceRoot);
  const selectedFiles = filterTestFiles(allTestFiles, args, e2eDir);

  if (selectedFiles.length === 0) {
    console.log(`\n[!] No test suites found matching criteria.`);
    if (args.tier) {
      console.log(`    Tier ${args.tier} test files may still be scheduled for upcoming implementation.`);
    }
    console.log(`    Total test files discovered in tests/e2e: ${allTestFiles.length}`);
    process.exit(0);
  }

  console.log(`Discovered: ${selectedFiles.length} test suite file(s) to execute\n`);

  const results: SuiteResult[] = [];
  let overallPass = true;
  const runnerStartTime = performance.now();

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const rel = path.relative(workspaceRoot, file).replace(/\\/g, '/');
    const indexStr = `[${i + 1}/${selectedFiles.length}]`;

    process.stdout.write(`${indexStr} RUNNING  ${rel} ... `);

    const result = await runSingleSuite(file, workspaceRoot, args);
    results.push(result);

    if (result.passed) {
      process.stdout.write(`PASS (${result.passCount} passed, ${formatDuration(result.durationMs)})\n`);
    } else {
      process.stdout.write(`FAIL (${result.failCount} failed, exit ${result.exitCode}, ${formatDuration(result.durationMs)})\n`);
      overallPass = false;
      if (args.bail) {
        console.log(`\n[Bail] Terminating further test runs due to --bail flag.`);
        break;
      }
    }
  }

  const totalDurationMs = Math.round(performance.now() - runnerStartTime);

  // Tabular summary report
  console.log(`\n+------------------------------------------------------------+--------+----------+-----------+`);
  console.log(`| Test Suite                                                 | Status | Duration | Pass/Fail |`);
  console.log(`+------------------------------------------------------------+--------+----------+-----------+`);

  let totalSuites = results.length;
  let passedSuites = 0;
  let failedSuites = 0;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const r of results) {
    if (r.passed) passedSuites++;
    else failedSuites++;

    totalTests += r.testsCount;
    totalPassed += r.passCount;
    totalFailed += r.failCount;
    totalSkipped += r.skipCount;

    const suiteName = padRight(r.relativePath.length > 58 ? '...' + r.relativePath.slice(-55) : r.relativePath, 58);
    const status = r.passed ? ' PASS ' : ' FAIL ';
    const duration = padLeft(formatDuration(r.durationMs), 8);
    const counts = padLeft(`${r.passCount}/${r.failCount}`, 9);

    console.log(`| ${suiteName} | ${status} | ${duration} | ${counts} |`);
  }

  console.log(`+------------------------------------------------------------+--------+----------+-----------+`);

  // Summary counts
  console.log(`\n=============================================================================`);
  console.log(`                                EXECUTION SUMMARY                             `);
  console.log(`=============================================================================`);
  console.log(`  Suites:   ${passedSuites} passed, ${failedSuites} failed, ${totalSuites} total`);
  console.log(`  Tests:    ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped, ${totalTests} total`);
  console.log(`  Duration: ${formatDuration(totalDurationMs)}`);
  console.log(`  Result:   ${overallPass ? 'ALL SUITES PASSED' : 'SUITE FAILURES ENCOUNTERED'}`);
  console.log(`=============================================================================\n`);

  if (!overallPass) {
    console.log(`Detailed Failure Report:`);
    for (const r of results) {
      if (!r.passed) {
        console.log(`\n--- Failed Suite: ${r.relativePath} ---`);
        if (r.failureDetails && r.failureDetails.length > 0) {
          r.failureDetails.forEach((f) => console.log(`  * ${f}`));
        }
        if (r.stderr) {
          console.log(`  Stderr output:\n${r.stderr.trim()}`);
        }
      }
    }
    console.log('');
  }

  process.exit(overallPass ? 0 : 1);
}

main().catch((err) => {
  console.error(`Fatal Test Runner Error: ${String(err)}`);
  process.exit(1);
});
