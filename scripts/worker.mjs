import fs from 'node:fs';

if (!process.env.DATABASE_URL) {
  if (fs.existsSync('.env.local')) {
    process.loadEnvFile('.env.local');
  } else if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
}

const APP_URL = process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const WORKER_SECRET = process.env.WORKER_SECRET || '';

console.log('====================================================');
console.log('   BARRIERLENS AUTONOMOUS BACKGROUND JOB WORKER     ');
console.log(`   Connected to Web Service: ${APP_URL} `);
console.log('====================================================\n');

async function tick() {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (WORKER_SECRET) {
      headers['Authorization'] = `Bearer ${WORKER_SECRET}`;
    }

    const res = await fetch(`${APP_URL}/api/worker/tick`, {
      method: 'POST',
      headers,
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    if (data.status === 'completed') {
      console.log(`[Worker Daemon] ✓ Completed Job #${data.jobId} (Run: ${data.runId}, ${data.findingsCount} findings, Effort: ${data.effortRatio}x)`);
      return true;
    } else if (data.status === 'idle') {
      return false;
    } else if (data.error) {
      console.warn(`[Worker Daemon] ✗ Job error: ${data.error}`);
      return false;
    }
    return false;
  } catch (err) {
    // Web service not yet listening or network hiccup
    return false;
  }
}

async function loop() {
  console.log('[Worker Daemon] Polling for pending jobs...');
  while (true) {
    const worked = await tick();
    if (!worked) {
      await new Promise(r => setTimeout(r, 2500)); // Sleep 2.5s when idle
    }
  }
}

loop();
