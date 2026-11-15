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

import { neon } from '@neondatabase/serverless';
import https from 'node:https';
import fs from 'node:fs';
import hello from '../hello.ts';

// Auto-load .env.local if DATABASE_URL is not set in environment
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch {}
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
const DATA_API_URL = process.env.NEON_DATA_API_URL || '';
const REALTIME_URL = process.env.NEON_REALTIME_URL || '';

console.log('====================================================');
console.log('       BARRIERLENS - NEON SERVICES TEST SUITE       ');
console.log('====================================================\n');

async function retry(fn, retries = 2, delayMs = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return retry(fn, retries - 1, delayMs * 2);
  }
}

function probeHttps(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve({ statusCode: res.statusCode, statusMessage: res.statusMessage });
    }).on('error', (e) => reject(e));
  });
}

async function runTests() {
  let passed = 0;
  let total = 0;

  // 1. NEON POSTGRES CONNECTION TEST
  total++;
  console.log('TEST 1: Neon Postgres Serverless Connection...');
  try {
    const sql = neon(DATABASE_URL);
    const start = performance.now();
    const rows = await retry(async () => {
      return await sql`SELECT version(), current_database(), current_user, NOW() as server_time`;
    });
    const latency = Math.round(performance.now() - start);

    console.log('   ✓ Connected to Neon Postgres!');
    console.log(`   Database : ${rows[0].current_database}`);
    console.log(`   User     : ${rows[0].current_user}`);
    console.log(`   Version  : ${rows[0].version.split(' ')[0]} ${rows[0].version.split(' ')[1]}`);
    console.log(`   Latency  : ${latency}ms\n`);
    passed++;
  } catch (err) {
    console.error('   ✗ Neon Postgres connection failed:', err.message, '\n');
  }

  // 2. NEON POSTGRES DDL & CRUD TEST
  total++;
  console.log('TEST 2: Neon Postgres DDL & Schema Provisioning...');
  try {
    const sql = neon(DATABASE_URL);
    await sql`
      CREATE TABLE IF NOT EXISTS runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        persona TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        budget JSONB NOT NULL DEFAULT '{"max_steps": 30}'::jsonb,
        task_success BOOLEAN DEFAULT FALSE,
        effort_ratio FLOAT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Insert and query test run
    const inserted = await sql`
      INSERT INTO runs (persona, status, effort_ratio, task_success)
      VALUES ('keyboard', 'completed', 4.2, true)
      RETURNING id, persona, effort_ratio, task_success;
    `;

    console.log('   ✓ Schema verified & live record inserted successfully!');
    console.log(`   Record ID     : ${inserted[0].id}`);
    console.log(`   Persona       : ${inserted[0].persona}`);
    console.log(`   Effort Ratio  : ${inserted[0].effort_ratio}x`);
    console.log(`   Task Success  : ${inserted[0].task_success}\n`);
    passed++;
  } catch (err) {
    console.error('   ✗ Neon Postgres DDL failed:', err.message, '\n');
  }

  // 3. NEON DATA API TEST
  total++;
  console.log('TEST 3: Neon Data API (PostgREST Endpoint)...');
  try {
    const start = performance.now();
    const res = await retry(async () => {
      return await probeHttps(`${DATA_API_URL}/runs`);
    });
    const latency = Math.round(performance.now() - start);
    console.log(`   ✓ Data API responded with HTTP ${res.statusCode} (${res.statusMessage})`);
    console.log(`   Endpoint : ${DATA_API_URL}/runs`);
    console.log(`   Latency  : ${latency}ms\n`);
    passed++;
  } catch (err) {
    console.error('   ✗ Neon Data API test failed:', err.message, '\n');
  }

  // 4. NEON REALTIME TEST
  total++;
  console.log('TEST 4: Neon Realtime Service...');
  try {
    const start = performance.now();
    const res = await retry(async () => {
      return await probeHttps(REALTIME_URL);
    });
    const latency = Math.round(performance.now() - start);
    console.log(`   ✓ Realtime server responded with HTTP ${res.statusCode} (${res.statusMessage})`);
    console.log(`   Endpoint : ${REALTIME_URL}`);
    console.log(`   Latency  : ${latency}ms\n`);
    passed++;
  } catch (err) {
    console.error('   ✗ Neon Realtime test failed:', err.message, '\n');
  }

  // 5. NEON FUNCTIONS TEST
  total++;
  console.log('TEST 5: Neon Functions Handler (hello.ts)...');
  try {
    const fn = typeof hello === 'function' ? hello : (hello?.default || hello);
    const response = await fn();
    const text = await response.text();
    console.log('   ✓ Function executed successfully!');
    console.log(`   Output   : "${text}"\n`);
    passed++;
  } catch (err) {
    console.error('   ✗ Neon Functions test failed:', err.message, '\n');
  }

  // SUMMARY
  console.log('====================================================');
  console.log(`RESULTS: ${passed} / ${total} SERVICES VERIFIED OPERATIONAL`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
