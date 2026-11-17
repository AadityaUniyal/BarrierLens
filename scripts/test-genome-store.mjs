import { GenomeStore } from '../lib/barrierlens/genome/genome-store.ts';
import { BarrierGenomeEncoder } from '../lib/barrierlens/genome/barrier-encoder.ts';

async function main() {
  console.log('[Test] Testing GenomeStore with Neon pgvector...');
  const store = new GenomeStore();
  const encoder = new BarrierGenomeEncoder();

  // Create test finding
  const sampleFinding = {
    id: 'test-finding-' + Date.now(),
    runId: 'test-run-123',
    stepIdx: 2,
    kind: 'keyboard_trap',
    trustTier: 'proven',
    wcagRules: ['WCAG 2.1.2'],
    severity: 'critical',
    severityScore: 9.5,
    severityInterval: [9.0, 10.0],
    title: 'Keyboard Trap in Modal Dialog',
    summary: 'Focus cannot escape modal',
    evidence: { selector: '#modal-trap' }
  };

  const genome = encoder.encode(sampleFinding, {
    goal: 'Test checkout flow',
    persona: 'keyboard',
    targetUrl: 'https://example.com/checkout',
    effortRatio: 2.5,
    taskSuccess: false,
    maxSteps: 15,
    stepCount: 8
  });

  console.log('[Test] Storing genome with 768-dim vector into Neon...');
  await store.store(genome);
  console.log('[Test] Successfully stored!');

  console.log('[Test] Querying similar genomes via Neon HNSW pgvector index...');
  const similar = await store.findSimilar(genome, 5, 0.5);
  console.log(`[Test] Found ${similar.length} similar genomes:`);
  for (const s of similar) {
    console.log(` - Domain: ${s.domain}, Similarity: ${s.similarity.toFixed(3)}, Advice: ${s.remediationAdvice}`);
  }
}

main();
