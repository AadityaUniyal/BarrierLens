import { neon, neonConfig } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

// Auto-load .env.local if DATABASE_URL is not in process.env
if (!process.env.DATABASE_URL) {
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
          const v = trimmed.slice(idx + 1).trim();
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch {}
}

// Cache connectionless SQL query client
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

if (!databaseUrl) {
  console.warn('[Neon DB] Warning: DATABASE_URL is not set.');
}

/**
 * Serverless SQL client for Neon Postgres.
 * Uses HTTP pipeline for zero-overhead, connectionless queries in serverless/edge environments.
 */
export const sql: any = databaseUrl 
  ? neon(databaseUrl)
  : async () => [];

/**
 * Helper to execute raw queries with timing and error handling
 */
export async function queryNeon<T = any>(queryText: string, params: any[] = []): Promise<{ rows: T[]; latencyMs: number }> {
  const start = performance.now();
  const rows = await sql(queryText, params);
  const latencyMs = Math.round(performance.now() - start);
  return { rows: rows as T[], latencyMs };
}
