import { sql } from '../lib/neon/db.ts';

async function main() {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('TABLES IN NEON POSTGRES:');
  for (const t of tables) {
    console.log(' -', t.table_name);
  }
}

main();
