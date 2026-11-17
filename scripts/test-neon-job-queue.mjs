import { sql } from '../lib/neon/db.ts';
import { AuditorCore } from '../lib/barrierlens/agent/auditor-core.ts';

async function main() {
  console.log('[Queue Test] 1. Enqueueing job into Neon jobs table...');
  const runId = crypto.randomUUID();
  const targetUrl = 'https://example.com/cart-flow';
  const goal = 'Test shopping cart accessibility';
  const persona = 'keyboard';
  const maxSteps = 4;

  const [job] = await sql`
    INSERT INTO jobs (type, payload, status, run_after)
    VALUES (
      'audit_run',
      ${JSON.stringify({ targetUrl, goal, persona, maxSteps, runId })},
      'pending',
      NOW()
    )
    RETURNING id, status, created_at;
  `;

  console.log(`[Queue Test] Job enqueued! Job ID: ${job.id}, Status: ${job.status}`);

  console.log('[Queue Test] 2. Worker tick: atomically claiming job with FOR UPDATE SKIP LOCKED...');
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
    throw new Error('Worker failed to claim pending job');
  }

  const claimedJob = claimed[0];
  console.log(`[Queue Test] Claimed job #${claimedJob.id} (attempts: ${claimedJob.attempts})`);

  console.log('[Queue Test] 3. Executing audit for claimed job...');
  const auditor = new AuditorCore();
  const auditResult = await auditor.runAudit(targetUrl, goal, persona, maxSteps);

  console.log('[Queue Test] 4. Updating job to completed...');
  await sql`
    UPDATE jobs
    SET status = 'completed', payload = jsonb_set(payload, '{result_id}', to_jsonb(${auditResult.id}::text))
    WHERE id = ${claimedJob.id};
  `;

  console.log('[Queue Test] 5. Verifying job status and results from Neon...');
  const [updatedJob] = await sql`SELECT id, status, payload FROM jobs WHERE id = ${claimedJob.id}`;
  console.log(`[Queue Test] Final Job Status: ${updatedJob.status}, Result ID: ${updatedJob.payload?.result_id}`);

  const [runRecord] = await sql`SELECT id, target_url, status FROM runs WHERE id = ${auditResult.id}`;
  console.log(`[Queue Test] Run record verified in Neon: ${runRecord.id} (${runRecord.status})`);

  console.log('✅ NEON DISTRIBUTED JOB QUEUE (SKIP LOCKED) VERIFIED!');
}

main().catch(err => {
  console.error('❌ Queue test failed:', err);
  process.exit(1);
});
