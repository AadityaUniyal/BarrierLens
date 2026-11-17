import { sql } from '../lib/neon/db.ts';

async function main() {
  const [runsCount] = await sql`SELECT count(*) FROM runs`;
  const [findingsCount] = await sql`SELECT count(*) FROM findings`;
  const [genomesCount] = await sql`SELECT count(*) FROM barrier_genomes`;
  const [websitesCount] = await sql`SELECT count(*) FROM websites`;
  const [journeysCount] = await sql`SELECT count(*) FROM journeys`;

  console.log('NEON POSTGRES DATA COUNTS:');
  console.log(' - runs:', runsCount.count);
  console.log(' - findings:', findingsCount.count);
  console.log(' - barrier_genomes:', genomesCount.count);
  console.log(' - websites:', websitesCount.count);
  console.log(' - journeys:', journeysCount.count);

  const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'runs';
  `;
  console.log('\nRUNS TABLE COLUMNS:');
  for (const c of columns) {
    console.log(` - ${c.column_name}: ${c.data_type}`);
  }
  const bgCols = await sql`
    SELECT a.attname, format_type(a.atttypid, a.atttypmod) as type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'barrier_genomes' AND a.attnum > 0;
  `;
  console.log('\nBARRIER_GENOMES COLUMN TYPES:');
  for (const c of bgCols) {
    console.log(` - ${c.attname}: ${c.type}`);
  }
  const fCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'findings';
  `;
  console.log('\nFINDINGS COLUMN TYPES:');
  for (const c of fCols) {
    console.log(` - ${c.column_name}: ${c.data_type}`);
  }
  const jobsCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'jobs';
  `;
  console.log('\nJOBS COLUMN TYPES:');
  for (const c of jobsCols) {
    console.log(` - ${c.column_name}: ${c.data_type}`);
  }
  const [sampleGenome] = await sql`
    SELECT id, finding_kind, embedding IS NOT NULL as has_embedding, vector IS NOT NULL as has_vector 
    FROM barrier_genomes 
    LIMIT 1;
  `;
  console.log('\nSAMPLE GENOME CHECK:', sampleGenome);
}

main();
