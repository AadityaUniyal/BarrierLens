import { neon, neonConfig } from '@neondatabase/serverless';

// Cache connectionless SQL query client
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

if (!databaseUrl) {
  console.warn('[Neon DB] Warning: DATABASE_URL is not set.');
}

/**
 * Serverless SQL client for Neon Postgres.
 * Uses HTTP pipeline for zero-overhead, connectionless queries in serverless/edge environments.
 */
export const sql = neon(databaseUrl);

/**
 * Helper to execute raw queries with timing and error handling
 */
export async function queryNeon<T = any>(queryText: string, params: any[] = []): Promise<{ rows: T[]; latencyMs: number }> {
  const start = performance.now();
  const rows = await sql(queryText, params);
  const latencyMs = Math.round(performance.now() - start);
  return { rows: rows as T[], latencyMs };
}
