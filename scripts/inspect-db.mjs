import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('Neon Tables currently present:\n', tables.map(t => '  - ' + t.table_name).join('\n'));

  const ext = await sql`SELECT extname, extversion FROM pg_extension;`;
  console.log('\nInstalled Extensions:\n', ext.map(e => `  - ${e.extname} (v${e.extversion})`).join('\n'));
}

inspect();
