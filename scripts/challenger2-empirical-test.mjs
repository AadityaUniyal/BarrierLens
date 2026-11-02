import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Load environment
if (!process.env.DATABASE_URL) {
  if (fs.existsSync('.env.local')) {
    process.loadEnvFile('.env.local');
  } else if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Helper to generate normalized vector of dimension 384
function makeVector(dim = 384, components = {}) {
  const vec = new Array(dim).fill(0);
  for (const [idx, val] of Object.entries(components)) {
    vec[Number(idx)] = val;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

function vectorToPgString(vec) {
  return `[${vec.map(v => v.toFixed(6)).join(',')}]`;
}

async function runEmpiricalChallenge() {
  console.log('===============================================================');
  console.log('   CHALLENGER 2: EMPIRICAL STRESS TEST & VERIFICATION HARNESS  ');
  console.log('   Target: Neon Postgres Schema, pgvector HNSW & SKIP LOCKED   ');
  console.log('===============================================================\n');

  const testReport = {
    r3SchemaAndQueueVerification: false,
    concurrencyBurstTest: false,
    concurrencyContentionTest: false,
    concurrencyDrainTest: false,
    pgvectorDistanceOrdering: false,
    pgvectorHnswIndexVerified: false,
    details: {}
  };

  try {
    // ------------------------------------------------------------------
    // TEST SUITE 1: CONCURRENCY & SKIP LOCKED QUEUE STRESS TEST
    // ------------------------------------------------------------------
    console.log('--- TEST SUITE 1: Concurrency & SKIP LOCKED Stress Tests ---');

    // 1.1 Burst Concurrency: 15 simultaneous workers for 15 pending jobs
    const burstBatchTag = `burst-${Date.now()}`;
    const burstCount = 15;
    console.log(`\n[1.1] Enqueuing ${burstCount} jobs for Burst Concurrency test (tag: ${burstBatchTag})...`);

    const burstJobIds = [];
    for (let i = 0; i < burstCount; i++) {
      const res = await sql`
        INSERT INTO jobs (type, payload, status, run_after)
        VALUES ('burst_test_job', ${JSON.stringify({ batch: burstBatchTag, index: i })}::jsonb, 'pending', NOW())
        RETURNING id;
      `;
      burstJobIds.push(res[0].id);
    }
    console.log(`   ✓ Enqueued ${burstJobIds.length} jobs.`);

    console.log(`   Executing ${burstCount} simultaneous dequeue queries via Promise.all...`);
    const burstWorkerClaims = await Promise.all(
      Array.from({ length: burstCount }, async (_, workerIdx) => {
        const claim = await sql`
          UPDATE jobs
          SET status = 'running', locked_at = NOW(), attempts = attempts + 1
          WHERE id = (
            SELECT id FROM jobs
            WHERE status = 'pending' AND run_after <= NOW() AND payload->>'batch' = ${burstBatchTag}
            ORDER BY run_after ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          RETURNING id, type, payload, attempts, status, locked_at;
        `;
        return {
          workerIdx,
          claimed: claim.length > 0 ? claim[0] : null
        };
      })
    );

    const claimedJobsBurst = burstWorkerClaims.filter(c => c.claimed !== null).map(c => c.claimed.id);
    const uniqueClaimedBurst = new Set(claimedJobsBurst);

    console.log(`   - Claims recorded: ${claimedJobsBurst.length}`);
    console.log(`   - Unique jobs claimed: ${uniqueClaimedBurst.size} / ${burstCount}`);

    if (claimedJobsBurst.length !== burstCount || uniqueClaimedBurst.size !== burstCount) {
      throw new Error(`Burst test FAILED: Expected ${burstCount} unique claims, got ${uniqueClaimedBurst.size} (total claims: ${claimedJobsBurst.length})`);
    }
    testReport.concurrencyBurstTest = true;
    console.log('   ✓ Burst Concurrency Test PASSED: 100% unique claims, 0 duplicate processing.');

    // Clean up burst jobs
    await sql`DELETE FROM jobs WHERE payload->>'batch' = ${burstBatchTag};`;

    // 1.2 Contention / Oversubscribed Concurrency: 30 workers competing for 10 jobs
    const contentionBatchTag = `contention-${Date.now()}`;
    const jobCount = 10;
    const workerCount = 30;
    console.log(`\n[1.2] Enqueuing ${jobCount} jobs with ${workerCount} competing parallel workers (3x contention)...`);

    for (let i = 0; i < jobCount; i++) {
      await sql`
        INSERT INTO jobs (type, payload, status, run_after)
        VALUES ('contention_test_job', ${JSON.stringify({ batch: contentionBatchTag, index: i })}::jsonb, 'pending', NOW());
      `;
    }

    console.log(`   Flipping switch on ${workerCount} simultaneous dequeue attempts...`);
    const contentionResults = await Promise.all(
      Array.from({ length: workerCount }, async (_, workerIdx) => {
        const claim = await sql`
          UPDATE jobs
          SET status = 'running', locked_at = NOW(), attempts = attempts + 1
          WHERE id = (
            SELECT id FROM jobs
            WHERE status = 'pending' AND run_after <= NOW() AND payload->>'batch' = ${contentionBatchTag}
            ORDER BY run_after ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          RETURNING id, type, payload, attempts, status, locked_at;
        `;
        return {
          workerIdx,
          claimed: claim.length > 0 ? claim[0] : null
        };
      })
    );

    const successClaims = contentionResults.filter(c => c.claimed !== null);
    const emptyClaims = contentionResults.filter(c => c.claimed === null);
    const claimedIds = successClaims.map(c => c.claimed.id);
    const uniqueClaimedIds = new Set(claimedIds);

    console.log(`   - Successful claims: ${successClaims.length} (expected ${jobCount})`);
    console.log(`   - Empty returns (skipped): ${emptyClaims.length} (expected ${workerCount - jobCount})`);
    console.log(`   - Unique claimed IDs: ${uniqueClaimedIds.size} / ${jobCount}`);

    if (successClaims.length !== jobCount || uniqueClaimedIds.size !== jobCount) {
      throw new Error(`Contention test FAILED: Race condition detected! Expected ${jobCount} unique claims, got ${uniqueClaimedIds.size}`);
    }
    testReport.concurrencyContentionTest = true;
    console.log('   ✓ Contention Test PASSED: Zero double-claiming under heavy contention. Workers without jobs skipped cleanly.');

    // Clean up contention jobs
    await sql`DELETE FROM jobs WHERE payload->>'batch' = ${contentionBatchTag};`;

    // 1.3 Continuous Multi-Worker Loop: 5 workers continuously draining 25 jobs
    const drainBatchTag = `drain-${Date.now()}`;
    const totalDrainJobs = 25;
    const numWorkers = 5;
    console.log(`\n[1.3] Multi-Worker Queue Drain: 5 workers continuously draining ${totalDrainJobs} jobs...`);

    for (let i = 0; i < totalDrainJobs; i++) {
      await sql`
        INSERT INTO jobs (type, payload, status, run_after)
        VALUES ('drain_test_job', ${JSON.stringify({ batch: drainBatchTag, index: i })}::jsonb, 'pending', NOW());
      `;
    }

    const workerProcessedSets = Array.from({ length: numWorkers }, () => []);

    async function drainWorker(workerId) {
      while (true) {
        const claim = await sql`
          UPDATE jobs
          SET status = 'running', locked_at = NOW(), attempts = attempts + 1
          WHERE id = (
            SELECT id FROM jobs
            WHERE status = 'pending' AND run_after <= NOW() AND payload->>'batch' = ${drainBatchTag}
            ORDER BY run_after ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          RETURNING id;
        `;

        if (claim.length === 0) {
          // No more jobs left
          break;
        }

        const jobId = claim[0].id;
        workerProcessedSets[workerId].push(jobId);

        // Simulate tiny processing time
        await new Promise(r => setTimeout(r, 10));

        // Mark completed
        await sql`UPDATE jobs SET status = 'completed' WHERE id = ${jobId};`;
      }
    }

    await Promise.all(Array.from({ length: numWorkers }, (_, id) => drainWorker(id)));

    const allProcessed = workerProcessedSets.flat();
    const uniqueProcessed = new Set(allProcessed);

    console.log('   Worker distribution:');
    workerProcessedSets.forEach((set, idx) => {
      console.log(`     - Worker #${idx}: processed ${set.length} jobs`);
    });
    console.log(`   - Total processed: ${allProcessed.length} / ${totalDrainJobs}`);
    console.log(`   - Unique processed: ${uniqueProcessed.size} / ${totalDrainJobs}`);

    // Pairwise disjointness check
    for (let i = 0; i < numWorkers; i++) {
      for (let j = i + 1; j < numWorkers; j++) {
        const setI = new Set(workerProcessedSets[i]);
        for (const id of workerProcessedSets[j]) {
          if (setI.has(id)) {
            throw new Error(`CRITICAL RACE CONDITION: Job ${id} was processed by both Worker ${i} and Worker ${j}!`);
          }
        }
      }
    }

    if (allProcessed.length !== totalDrainJobs || uniqueProcessed.size !== totalDrainJobs) {
      throw new Error(`Drain test FAILED: Processed count mismatch.`);
    }

    // Verify all in DB are 'completed'
    const dbDrainStatus = await sql`
      SELECT status, count(*) 
      FROM jobs 
      WHERE payload->>'batch' = ${drainBatchTag} 
      GROUP BY status;
    `;
    console.log('   - DB Job Status counts:', dbDrainStatus);
    if (dbDrainStatus.length !== 1 || dbDrainStatus[0].status !== 'completed' || Number(dbDrainStatus[0].count) !== totalDrainJobs) {
      throw new Error(`Drain test FAILED: DB records not all completed.`);
    }

    testReport.concurrencyDrainTest = true;
    console.log('   ✓ Multi-Worker Queue Drain PASSED: Complete disjoint processing across all workers, zero duplicates.');

    // Cleanup
    await sql`DELETE FROM jobs WHERE payload->>'batch' = ${drainBatchTag};`;


    // ------------------------------------------------------------------
    // TEST SUITE 2: PGVECTOR COSINE DISTANCE & HNSW INDEX VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: pgvector HNSW Index & Cosine Distance Verification ---');

    // 2.1 Verify HNSW index metadata on states table
    console.log('\n[2.1] Inspecting HNSW index metadata on states(embedding)...');
    const indexQuery = await sql`
      SELECT 
        i.relname AS index_name,
        a.amname AS access_method,
        pg_get_indexdef(i.oid) AS index_definition
      FROM pg_class i
      JOIN pg_am a ON i.relam = a.oid
      JOIN pg_index ix ON ix.indexrelid = i.oid
      JOIN pg_class t ON ix.indrelid = t.oid
      WHERE t.relname = 'states' AND i.relname = 'idx_states_embedding';
    `;

    if (indexQuery.length === 0) {
      throw new Error('FAIL: idx_states_embedding not found in pg_class/pg_am.');
    }
    const idx = indexQuery[0];
    console.log(`   ✓ Found index: ${idx.index_name}`);
    console.log(`   ✓ Access Method: ${idx.access_method}`);
    console.log(`   ✓ Definition: ${idx.index_definition}`);

    if (idx.access_method !== 'hnsw') {
      throw new Error(`FAIL: Expected access method 'hnsw', got '${idx.access_method}'`);
    }
    testReport.pgvectorHnswIndexVerified = true;

    // 2.2 Insert test vector states to test cosine distance operator (<=>)
    const vectorTestMarker = `vec-test-${Date.now()}`;
    console.log(`\n[2.2] Inserting controlled 384-dimensional test vectors (marker: ${vectorTestMarker})...`);

    // We create:
    // v_base:       [1, 0, 0, ...]
    // v_identical:  [1, 0, 0, ...]             -> expected cosine dist = 0.0000
    // v_near:       [0.99, 0.141, 0, ...]      -> expected cosine dist ~= 0.0100
    // v_mid:        [0.7071, 0.7071, 0, ...]   -> expected cosine dist ~= 0.2929
    // v_orthogonal: [0, 1, 0, ...]             -> expected cosine dist = 1.0000
    // v_opposite:   [-1, 0, 0, ...]            -> expected cosine dist = 2.0000

    const vBase = makeVector(384, { 0: 1.0 });
    const vIdentical = makeVector(384, { 0: 1.0 });
    const vNear = makeVector(384, { 0: 0.99, 1: 0.141067 });
    const vMid = makeVector(384, { 0: 1.0, 1: 1.0 });
    const vOrthogonal = makeVector(384, { 1: 1.0 });
    const vOpposite = makeVector(384, { 0: -1.0 });

    const vectorEntries = [
      { name: 'identical', vec: vIdentical, expectedDist: 0.0, label: 'Identical' },
      { name: 'near', vec: vNear, expectedDist: 0.01, label: 'Near neighbor (~0.99 cos sim)' },
      { name: 'mid', vec: vMid, expectedDist: 0.2929, label: '45-degree angle (~0.707 cos sim)' },
      { name: 'orthogonal', vec: vOrthogonal, expectedDist: 1.0, label: 'Orthogonal (0 cos sim)' },
      { name: 'opposite', vec: vOpposite, expectedDist: 2.0, label: 'Opposite (-1 cos sim)' }
    ];

    const insertedStateIds = [];
    for (const item of vectorEntries) {
      const vecStr = vectorToPgString(item.vec);
      const res = await sql`
        INSERT INTO states (fingerprint, url, embedding)
        VALUES (${`${vectorTestMarker}:${item.name}`}, 'https://barrierlens.ai/test', ${vecStr}::vector)
        RETURNING id, fingerprint;
      `;
      insertedStateIds.push(res[0].id);
    }
    console.log(`   ✓ Inserted ${insertedStateIds.length} synthetic state embeddings.`);

    // 2.3 Query nearest neighbors using cosine distance (<=>)
    const queryVecStr = vectorToPgString(vBase);
    console.log('\n[2.3] Executing vector cosine similarity ranking query...');
    const searchResults = await sql`
      SELECT 
        id,
        fingerprint,
        (embedding <=> ${queryVecStr}::vector) AS cosine_distance,
        1 - (embedding <=> ${queryVecStr}::vector) AS cosine_similarity
      FROM states
      WHERE fingerprint LIKE ${`${vectorTestMarker}:%`}
      ORDER BY embedding <=> ${queryVecStr}::vector ASC;
    `;

    console.log('   Empirical Cosine Ranking Results:');
    searchResults.forEach((row, i) => {
      console.log(`     #${i + 1}: ${row.fingerprint} -> Distance: ${Number(row.cosine_distance).toFixed(4)}, Similarity: ${Number(row.cosine_similarity).toFixed(4)}`);
    });

    // Verification assertions:
    // 1. Identical must be closest (dist ~0)
    if (Math.abs(Number(searchResults[0].cosine_distance) - 0.0) > 0.0001) {
      throw new Error(`FAIL: Top result distance was ${searchResults[0].cosine_distance}, expected ~0.0`);
    }
    // 2. Near must be #2
    if (!searchResults[1].fingerprint.includes('near')) {
      throw new Error(`FAIL: Expected 'near' vector in rank 2, got ${searchResults[1].fingerprint}`);
    }
    // 3. Orthogonal must be dist ~1.0
    const orthoRow = searchResults.find(r => r.fingerprint.includes('orthogonal'));
    if (Math.abs(Number(orthoRow.cosine_distance) - 1.0) > 0.001) {
      throw new Error(`FAIL: Orthogonal distance was ${orthoRow.cosine_distance}, expected ~1.0`);
    }
    // 4. Opposite must be dist ~2.0 and rank last
    const lastRow = searchResults[searchResults.length - 1];
    if (!lastRow.fingerprint.includes('opposite') || Math.abs(Number(lastRow.cosine_distance) - 2.0) > 0.001) {
      throw new Error(`FAIL: Opposite vector not ranked last or distance != 2.0: ${lastRow.cosine_distance}`);
    }

    testReport.pgvectorDistanceOrdering = true;
    console.log('   ✓ Vector Cosine Distance (<=>) mathematical properties strictly verified.');

    // 2.4 Verify Query Execution Plan
    console.log('\n[2.4] Query Plan inspection for vector similarity search...');
    const plan = await sql`
      EXPLAIN (COSTS ON)
      SELECT id, fingerprint, embedding <=> ${queryVecStr}::vector AS dist
      FROM states
      ORDER BY embedding <=> ${queryVecStr}::vector ASC
      LIMIT 5;
    `;
    console.log('   Execution plan lines:');
    plan.forEach(p => console.log('    ', p['QUERY PLAN']));

    // Cleanup test states
    await sql`DELETE FROM states WHERE fingerprint LIKE ${`${vectorTestMarker}:%`};`;
    console.log('   ✓ Test vector states cleaned up.');

    // ------------------------------------------------------------------
    // FINAL ASSESSMENT
    // ------------------------------------------------------------------
    testReport.r3SchemaAndQueueVerification = true;
    console.log('\n===============================================================');
    console.log('   ALL EMPIRICAL CHALLENGES COMPLETED SUCCESSFULLY!            ');
    console.log('   Verdict: APPROVE                                            ');
    console.log('===============================================================');
    console.log(JSON.stringify(testReport, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('\nEMPIRICAL CHALLENGE FAILED:', err);
    process.exit(1);
  }
}

runEmpiricalChallenge();
