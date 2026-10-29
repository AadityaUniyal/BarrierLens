import { neon } from '@neondatabase/serverless';
import { AuditorCore } from '../lib/barrierlens/agent/auditor-core.ts';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[Worker] DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

console.log('====================================================');
console.log('   BARRIERLENS AUTONOMOUS BACKGROUND JOB WORKER     ');
console.log('   Strategy: PostgreSQL SKIP LOCKED Queue Processor  ');
console.log('====================================================\n');

async function processNextJob() {
  try {
    // 1. Claim a pending job atomically using SKIP LOCKED
    const claimed = await sql`
      UPDATE jobs
      SET status = 'running', locked_at = NOW(), attempts = attempts + 1
      WHERE id = (
        SELECT id FROM jobs
        WHERE status = 'pending' AND run_after <= NOW()
        ORDER BY run_after ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, type, payload, attempts;
    `;

    if (claimed.length === 0) {
      return false; // No jobs waiting
    }

    const job = claimed[0];
    console.log(`[Worker] Claimed Job #${job.id} (Type: ${job.type}, Attempt: ${job.attempts})`);

    if (job.type === 'audit_run') {
      const { targetUrl, goal, persona, maxSteps } = job.payload;
      console.log(`[Worker] Executing Audit: "${goal}" on ${targetUrl} [${persona}]...`);

      const auditor = new AuditorCore();
      const result = await auditor.runAudit(targetUrl, goal, persona, maxSteps || 10);

      console.log(`[Worker] Audit finished: ${result.findings.length} findings, effort ratio: ${result.effortRatio}x`);

      // Update job to completed
      await sql`
        UPDATE jobs
        SET status = 'completed', payload = jsonb_set(payload, '{result_id}', to_jsonb(${result.id}::text))
        WHERE id = ${job.id};
      `;
    }

    return true;
  } catch (err) {
    console.error('[Worker] Error processing job:', err.message);
    return false;
  }
}

async function loop() {
  while (true) {
    const worked = await processNextJob();
    if (!worked) {
      await new Promise(r => setTimeout(r, 2000)); // Poll every 2s when idle
    }
  }
}

loop();
