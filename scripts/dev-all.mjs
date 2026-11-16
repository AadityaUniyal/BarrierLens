/**
 * BarrierLens Unified Dev Runner
 * Concurrently spawns the Python FastAPI ML backend (:8000) and Next.js frontend (:3000)
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

console.log('='.repeat(70));
console.log('🚀 Launching BarrierLens Full-Stack Development Environment');
console.log('   - Python FastAPI ML Engine on http://127.0.0.1:8000 (CUDA GPU accelerated)');
console.log('   - Next.js Cupertino Studio on  http://localhost:3000');
console.log('='.repeat(70) + '\n');

// 1. Spawn Python FastAPI Backend
const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
const backend = spawn(pythonCmd, ['backend/app.py'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, PYTHONUNBUFFERED: '1' }
});

backend.stdout.on('data', (chunk) => {
  const lines = chunk.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[36m[Backend :8000]\x1b[0m ${line.trim()}`);
    }
  }
});

backend.stderr.on('data', (chunk) => {
  const lines = chunk.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim() && !line.includes('DeprecationWarning')) {
      console.error(`\x1b[33m[Backend :8000]\x1b[0m ${line.trim()}`);
    }
  }
});

backend.on('error', (err) => {
  console.error('\x1b[31m[Backend Error]\x1b[0m Failed to start Python backend:', err.message);
});

// 2. Spawn Next.js Dev Server
const frontend = spawn('npx', ['next', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env }
});

frontend.stdout.on('data', (chunk) => {
  const lines = chunk.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[35m[Next.js :3000]\x1b[0m ${line.trim()}`);
    }
  }
});

frontend.stderr.on('data', (chunk) => {
  const lines = chunk.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.error(`\x1b[31m[Next.js :3000]\x1b[0m ${line.trim()}`);
    }
  }
});

frontend.on('error', (err) => {
  console.error('\x1b[31m[Frontend Error]\x1b[0m Failed to start Next.js dev server:', err.message);
});

// Graceful cleanup on Ctrl+C or kill
function cleanup() {
  console.log('\n\x1b[33m[Shutting down BarrierLens development servers...]\x1b[0m');
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
