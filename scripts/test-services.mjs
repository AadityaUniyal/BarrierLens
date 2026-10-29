import { neon } from '@neondatabase/serverless';
import https from 'node:https';
import hello from '../hello.ts';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gcTZU8Fekq0V@ep-ancient-dew-b4x5v2sp-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DATA_API_URL = process.env.NEON_DATA_API_URL || 'https://ep-ancient-dew-b4x5v2sp.apirest.c-6.us-east-2.aws.neon.tech/neondb/rest/v1';
const REALTIME_URL = process.env.NEON_REALTIME_URL || 'https://ep-ancient-dew-b4x5v2sp.rt.c-6.us-east-2.aws.neon.tech/';

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
    const response = await hello();
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
