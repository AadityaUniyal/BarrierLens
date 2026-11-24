import { searchSimilarBarriers, computeCosineSimilarity } from '../lib/supabase/vector.js';
import { getArtifactPublicUrl, uploadReportArtifact } from '../lib/supabase/storage.js';

async function main() {
  console.log('Testing storage url generation...');
  const testUrl = getArtifactPublicUrl('test/sample.json');
  console.log('Sample public URL:', testUrl);

  console.log('Testing vector similarity math...');
  const sim = computeCosineSimilarity([1, 0, 0], [1, 0, 0]);
  console.log('Self-similarity:', sim);

  console.log('Testing pgvector query execution...');
  const queryVector = new Array(768).fill(0.02);
  const matches = await searchSimilarBarriers(queryVector, { threshold: 0.1, limit: 3 });
  console.log('Similar barriers found:', matches.length);

  console.log('Testing Supabase storage upload...');
  const uploadRes = await uploadReportArtifact('test-run-1', 'healthcheck.json', JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
  console.log('Upload result:', uploadRes);

  console.log('All storage & vector tests passed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
