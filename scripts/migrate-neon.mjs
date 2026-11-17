import { initializeDatabaseSchema } from '../lib/neon/schema.ts';
import { sql } from '../lib/neon/db.ts';

async function main() {
  console.log('[Migration] Starting Neon database schema synchronization...');
  try {
    const result = await initializeDatabaseSchema();
    console.log('[Migration] Schema init completed successfully:', result);

    // Backfill barrier_genomes.embedding from vector JSONB if null
    console.log('[Migration] Checking for unvectorized barrier_genomes rows...');
    const unvectorized = await sql`
      SELECT id, vector 
      FROM barrier_genomes 
      WHERE embedding IS NULL AND vector IS NOT NULL 
      LIMIT 100;
    `;

    console.log(`[Migration] Found ${unvectorized.length} barrier genomes to vectorize.`);
    let backfilled = 0;
    for (const row of unvectorized) {
      try {
        const vec = typeof row.vector === 'string' ? JSON.parse(row.vector) : row.vector;
        if (Array.isArray(vec) && vec.length === 768) {
          const vectorStr = `[${vec.join(',')}]`;
          await sql`
            UPDATE barrier_genomes
            SET embedding = ${vectorStr}::vector
            WHERE id = ${row.id};
          `;
          backfilled++;
        }
      } catch (err) {
        console.warn(`[Migration] Could not backfill row ${row.id}:`, err.message);
      }
    }
    console.log(`[Migration] Successfully backfilled ${backfilled} vector embeddings in Neon Postgres.`);

    // Verify row counts and verify HNSW index
    const [finalCounts] = await sql`
      SELECT 
        (SELECT count(*) FROM runs) as runs_count,
        (SELECT count(*) FROM findings) as findings_count,
        (SELECT count(*) FROM barrier_genomes) as genomes_count,
        (SELECT count(*) FROM barrier_genomes WHERE embedding IS NOT NULL) as vectorized_genomes_count,
        (SELECT count(*) FROM jobs) as jobs_count;
    `;
    console.log('[Migration] Live Neon DB Stats:', finalCounts);

  } catch (error) {
    console.error('[Migration] Failed to synchronize Neon schema:', error);
    process.exit(1);
  }
}

main();
