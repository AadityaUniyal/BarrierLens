import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

// Auto-load .env.local
if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch {}
}

const connectionUrls = [
  { name: 'Session Pooler (port 5432)', url: process.env.DIRECT_URL },
  { name: 'Direct Host (port 5432)', url: process.env.SUPABASE_DIRECT_URL },
  { name: 'Transaction Pooler (port 6543)', url: process.env.DATABASE_URL }
];

async function migrate() {
  console.log('====================================================');
  console.log('   BARRIERLENS - SUPABASE DATABASE MIGRATION        ');
  console.log('====================================================\n');

  let activeSql = null;
  let activeName = '';

  for (const conn of connectionUrls) {
    if (!conn.url) continue;
    try {
      console.log(`Attempting connection via ${conn.name}...`);
      const client = postgres(conn.url, {
        ssl: 'require',
        max: 1,
        connect_timeout: 10,
        prepare: false,
      });
      const res = await client`SELECT version(), current_database(), current_user`;
      console.log(`✅ Connected successfully via ${conn.name}!`);
      console.log(`   Database: ${res[0].current_database}`);
      console.log(`   User: ${res[0].current_user}`);
      console.log(`   Version: ${res[0].version.split(',')[0]}\n`);
      activeSql = client;
      activeName = conn.name;
      break;
    } catch (err) {
      console.warn(`   ⚠️ ${conn.name} failed: ${err.message}`);
    }
  }

  if (!activeSql) {
    throw new Error('Could not establish connection to Supabase PostgreSQL using any connection string.');
  }

  const migrationFile = path.resolve(process.cwd(), 'migrations', '001_supabase_schema.sql');
  console.log(`Reading migration script from: ${migrationFile}`);
  const sqlContent = fs.readFileSync(migrationFile, 'utf8');

  console.log('Applying migration to Supabase PostgreSQL...');
  await activeSql.unsafe(sqlContent);
  console.log('✅ Migration executed successfully!\n');

  console.log('Verifying created extensions...');
  const extensions = await activeSql`
    SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp', 'pgcrypto');
  `;
  for (const ext of extensions) {
    console.log(`   🧩 Extension '${ext.extname}' is ACTIVE (v${ext.extversion})`);
  }

  console.log('\nVerifying created tables...');
  const tables = await activeSql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  for (const t of tables) {
    console.log(`   📋 Table: ${t.table_name}`);
  }

  console.log('\nVerifying seed configuration...');
  const configs = await activeSql`SELECT key, value, category FROM configuration ORDER BY key;`;
  console.log(`   ⚙️ Configuration rows seeded: ${configs.length}`);
  for (const c of configs) {
    console.log(`      - ${c.key}: ${JSON.stringify(c.value)}`);
  }

  await activeSql.end();
  console.log('\n====================================================');
  console.log('   🎉 SUPABASE DATABASE SETUP COMPLETE & VERIFIED!   ');
  console.log('====================================================\n');
}

migrate().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
