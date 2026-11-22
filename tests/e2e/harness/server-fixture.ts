/**
 * BarrierLens E2E Test Suite - Server Fixture
 * 
 * Manages Next.js server lifecycle: detection, spawning, health checking, and clean teardown.
 */

import { spawn, execSync, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import waitOn from 'wait-on';
import { BASE_URL, SERVER_PORT, TIMEOUTS } from './config';

let serverProcess: ChildProcess | null = null;
let serverSpawnedByHarness = false;

/**
 * Checks if the target server is already accepting HTTP requests.
 */
export async function isServerRunning(url = BASE_URL, timeoutMs = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'text/html,application/xhtml+xml,application/json' },
    });
    clearTimeout(timeout);
    return response.status > 0;
  } catch {
    return false;
  }
}

export interface EnsureServerOptions {
  timeoutMs?: number;
  dev?: boolean;
  port?: number;
  cwd?: string;
  silent?: boolean;
}

/**
 * Ensures the target Next.js server is running and ready.
 * If the server is not currently responding, spawns a new server instance and waits for port readiness.
 */
export async function ensureServerRunning(options: EnsureServerOptions = {}): Promise<{ spawned: boolean; url: string }> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.serverStartup;
  const targetPort = options.port ?? SERVER_PORT;
  const targetUrl = options.port ? `http://127.0.0.1:${targetPort}` : BASE_URL;

  // 1. Check if server is already running
  if (await isServerRunning(targetUrl, 1500)) {
    return { spawned: false, url: targetUrl };
  }

  const workspaceRoot = options.cwd ?? path.resolve(process.cwd());
  const hasDotNext = fs.existsSync(path.join(workspaceRoot, '.next'));
  const useDev = options.dev ?? !hasDotNext;

  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const commandArgs = useDev ? ['run', 'dev', '--', '-p', String(targetPort)] : ['run', 'start', '--', '-p', String(targetPort)];

  serverProcess = spawn(npmCmd, commandArgs, {
    cwd: workspaceRoot,
    stdio: options.silent ? 'ignore' : 'pipe',
    shell: isWindows,
    env: {
      ...process.env,
      PORT: String(targetPort),
    },
  });

  serverSpawnedByHarness = true;

  if (serverProcess.stdout && !options.silent) {
    serverProcess.stdout.on('data', (chunk) => {
      const line = chunk.toString();
      if (process.env.DEBUG_SERVER) {
        process.stdout.write(`[Next.js Server] ${line}`);
      }
    });
  }

  if (serverProcess.stderr && !options.silent) {
    serverProcess.stderr.on('data', (chunk) => {
      const line = chunk.toString();
      if (process.env.DEBUG_SERVER) {
        process.stderr.write(`[Next.js Server:ERR] ${line}`);
      }
    });
  }

  serverProcess.on('exit', (code, signal) => {
    if (serverSpawnedByHarness && code !== null && code !== 0) {
      console.warn(`[ServerFixture] Next.js server process exited with code ${code} (signal: ${signal})`);
    }
    serverProcess = null;
  });

  // Wait for the server port/URL to become available
  try {
    await waitOn({
      resources: [targetUrl],
      timeout: timeoutMs,
      interval: 500,
      validateStatus: (status) => status < 500,
    });
    return { spawned: true, url: targetUrl };
  } catch (err) {
    await stopServer();
    throw new Error(`Failed to start Next.js server at ${targetUrl} within ${timeoutMs}ms: ${String(err)}`);
  }
}

/**
 * Cleanly shuts down any server instance spawned by this harness.
 * On Windows, invokes `taskkill /pid ... /T /F` to eliminate orphaned child trees.
 */
export async function stopServer(): Promise<void> {
  if (!serverProcess || !serverProcess.pid) {
    serverProcess = null;
    serverSpawnedByHarness = false;
    return;
  }

  const pid = serverProcess.pid;
  try {
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      } catch {
        // Process might have already exited
      }
    } else {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        serverProcess.kill('SIGKILL');
      }
    }
  } catch {
    // Ignore teardown errors
  } finally {
    serverProcess = null;
    serverSpawnedByHarness = false;
  }
}

/**
 * Access the spawned server child process if one exists.
 */
export function getServerProcess(): ChildProcess | null {
  return serverProcess;
}

// Cleanup hook on process exit to avoid dangling background servers
const cleanup = () => {
  if (serverSpawnedByHarness && serverProcess?.pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        serverProcess.kill('SIGKILL');
      }
    } catch {}
  }
};

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});
