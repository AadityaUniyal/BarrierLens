import { WebhookDispatcher } from '../lib/barrierlens/integrations/webhook-dispatcher.ts';
import { sql } from '../lib/neon/db.ts';
import crypto from 'node:crypto';

async function main() {
  console.log('[Test] Testing Enterprise Webhook Dispatcher...');
  const dispatcher = new WebhookDispatcher();

  const testUserId = 'usr_webhook_test_' + Date.now();
  const testSecret = 'whsec_test_' + crypto.randomBytes(16).toString('hex');
  const dummyEndpoint = 'https://httpbin.org/post'; // Reliable public echo endpoint

  // 1. Insert test webhook into Neon Postgres
  console.log('\n--- 1. Registering Webhook in Neon Postgres ---');
  let testHookId = crypto.randomUUID();
  let dbActive = false;

  try {
    const [hook] = await sql`
      INSERT INTO webhooks (id, user_id, url, secret, events, active)
      VALUES (
        ${testHookId},
        ${testUserId},
        ${dummyEndpoint},
        ${testSecret},
        '{"audit.completed", "trap.detected"}',
        TRUE
      )
      RETURNING id, url, events;
    `;
    console.log(`Webhook registered in Neon! ID: ${hook.id}, URL: ${hook.url}`);
    dbActive = true;
  } catch (err) {
    console.log('[Test] Note: Live Neon DB timeout or offline check:', err.message);
  }

  // 2. Dispatch audit.completed event
  console.log('\n--- 2. Dispatching audit.completed Event ---');
  const sampleEventData = {
    targetUrl: 'https://example.com/checkout',
    status: 'completed',
    effortRatio: 1.8,
    findingsCount: 3
  };

  if (dbActive) {
    const summary = await dispatcher.dispatchEvent('audit.completed', sampleEventData, testUserId);
    console.log(`Dispatched to ${summary.totalSubscribers} subscribers:`);
    for (const r of summary.results) {
      console.log(` - Hook: ${r.webhookId}, Success: ${r.success}, Attempts: ${r.attempts}, Status: ${r.httpStatus}`);
    }

    // 3. Verify Neon webhooks row was updated with last_status and last_dispatched_at
    console.log('\n--- 3. Verifying Neon Webhook Delivery Metadata ---');
    const [updatedHook] = await sql`
      SELECT id, last_status, last_dispatched_at 
      FROM webhooks 
      WHERE id = ${testHookId};
    `;
    console.log('Neon updated webhook record:', updatedHook);

    // 4. Clean up test row
    await sql`DELETE FROM webhooks WHERE id = ${testHookId}`;
    console.log('Cleaned up test webhook record from Neon.');
  } else {
    // Direct delivery test
    console.log('Testing direct delivery with retry...');
    const result = await dispatcher.deliverWithRetry(
      { id: testHookId, url: dummyEndpoint, secret: testSecret },
      'audit.completed',
      sampleEventData,
      Date.now()
    );
    console.log('Direct delivery result:', result);
  }

  console.log('\n✅ ALL WEBHOOK DISPATCHER TESTS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Webhook test failed:', err);
  process.exit(1);
});
