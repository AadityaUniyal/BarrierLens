import { sql } from '../lib/neon/db.ts';

async function main() {
  try {
    const rows = await sql`SELECT NOW() as now, current_database() as db, version() as ver`;
    console.log('✅ NEON POSTGRES IS LIVE!');
    console.log('Database:', rows[0].db);
    console.log('Server Time:', rows[0].now);
    console.log('Version:', rows[0].ver.slice(0, 40));
  } catch (err) {
    console.error('❌ NEON POSTGRES CONNECTION FAILED:', err.message);
    console.error('Details:', err);
    if (err.cause) console.error('Cause:', err.cause);
  }
}

main();
