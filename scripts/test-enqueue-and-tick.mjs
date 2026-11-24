async function testFlow() {
  console.log('1. Enqueuing audit job...');
  const enqueueRes = await fetch('http://localhost:3000/api/audit/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetUrl: '/benchmark',
      goal: 'Test keyboard trap escape and accessible names',
      persona: 'keyboard',
      bypassConsent: true
    })
  });

  const enqueueData = await enqueueRes.json();
  console.log('Enqueue Response:', enqueueData);

  if (!enqueueData.jobId) {
    console.error('Failed to enqueue job');
    process.exit(1);
  }

  console.log('\n2. Ticking worker to claim and run job...');
  const tickRes = await fetch('http://localhost:3000/api/worker/tick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const tickData = await tickRes.json();
  console.log('Worker Tick Response:', tickData);
}

testFlow().catch(console.error);
