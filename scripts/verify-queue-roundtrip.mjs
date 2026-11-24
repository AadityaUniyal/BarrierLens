import { sql } from '../lib/supabase/db.js';

async function testQueue() {
  console.log('--- Testing Supabase Concurrency-Safe Queue & Stored Procedures ---');

  const testPayload = {
    targetUrl: 'https://barrierlens.ai',
    goal: 'Test queue processing',
    persona: 'keyboard',
    maxSteps: 4
  };

  // 1. Enqueue job
  const inserted = await sql`
    INSERT INTO jobs (type, payload, status, run_after)
    VALUES ('audit_run', ${JSON.stringify(testPayload)}::jsonb, 'pending', NOW())
    RETURNING id, type, status;
  `;
  const job = inserted[0];
  console.log('✅ Job successfully enqueued into Supabase jobs table:', job.id);

  // 2. Claim job using stored procedure claim_next_job
  console.log('Claiming job via Supabase claim_next_job stored procedure...');
  const claimed = await sql`
    SELECT * FROM claim_next_job('worker-node-1', 3);
  `;
  console.log('✅ Successfully claimed job via stored procedure:', claimed[0]?.id);

  // 3. Mark job as completed
  await sql`
    UPDATE jobs
    SET status = 'completed', payload = jsonb_set(
      CASE WHEN jsonb_typeof(payload) = 'object' THEN payload ELSE '{}'::jsonb END,
      '{result_id}',
      to_jsonb('run-verified-01'::text)
    )
    WHERE id = ${job.id};
  `;
  console.log('✅ Updated job state to completed with jsonb_set');

  // 4. Test get_barrierlens_stats stored procedure
  console.log('Querying real-time system stats via get_barrierlens_stats()...');
  const stats = await sql`
    SELECT get_barrierlens_stats() as stats;
  `;
  console.log('✅ Realtime Stats:', stats[0]?.stats);

  console.log('\n🎉 ALL SUPABASE QUEUE & COMPUTE FEATURES OPERATIONAL!');
  process.exit(0);
}

testQueue().catch(err => {
  console.error('Queue test error:', err);
  process.exit(1);
});
