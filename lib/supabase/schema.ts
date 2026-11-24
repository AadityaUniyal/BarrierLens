import { sql } from './db';
import fs from 'node:fs';
import path from 'node:path';

async function retry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return retry(fn, retries - 1, delayMs * 2);
  }
}

/**
 * Initializes the BarrierLens database schema on Supabase PostgreSQL.
 * Reads migrations/001_supabase_schema.sql and executes statement blocks.
 */
export async function initializeDatabaseSchema() {
  console.log('[Supabase DB] Initializing BarrierLens schema on Supabase...');

  return await retry(async () => {
    // 1. Enable uuid, pgcrypto and pgvector extensions
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
    } catch (e: any) {
      console.log('[Supabase DB] uuid-ossp notice:', e.message);
    }

    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
    } catch (e: any) {
      console.log('[Supabase DB] pgcrypto notice:', e.message);
    }

    try {
      await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
      console.log('[Supabase DB] pgvector extension verified.');
    } catch (e: any) {
      console.log('[Supabase DB] pgvector notice:', e.message);
    }

    // 2. Read full schema file if available
    const migrationPath = path.resolve(process.cwd(), 'migrations', '001_supabase_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      await sql.unsafe(sqlContent);
      console.log('[Supabase DB] Executed migrations/001_supabase_schema.sql successfully.');
    }

    return { success: true };
  });
}
