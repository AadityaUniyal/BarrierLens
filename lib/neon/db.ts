import { neon, neonConfig } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';

// Ensure resilient public DNS fallback for serverless Neon HTTP queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

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

function isValidPostgresUrl(urlStr: string | undefined): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (trimmed === '[SENSITIVE]' || trimmed.includes('[SENSITIVE]')) return false;
  return trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://');
}

let _cachedClient: any = null;
let _cachedUrl: string = '';

function getNeonClient() {
  const currentUrl = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '').trim();
  if (!isValidPostgresUrl(currentUrl)) {
    return null;
  }
  if (!_cachedClient || _cachedUrl !== currentUrl) {
    try {
      _cachedClient = neon(currentUrl);
      _cachedUrl = currentUrl;
    } catch {
      _cachedClient = null;
    }
  }
  return _cachedClient;
}

/**
 * Serverless SQL client for Neon Postgres.
 * Uses HTTP pipeline for zero-overhead, connectionless queries in serverless/edge environments.
 * Lazy proxy ensures build-time static evaluation and Vercel placeholder credentials do not crash.
 */
export const sql: any = new Proxy(function () {} as any, {
  apply(_target, _thisArg, args) {
    const client = getNeonClient();
    if (!client) {
      return Promise.reject(new Error('Neon database client unconfigured'));
    }
    return Reflect.apply(client, _thisArg, args);
  },
  get(_target, prop) {
    const client = getNeonClient();
    if (!client) {
      if (prop === 'then') return undefined;
      return () => Promise.reject(new Error('Neon database client unconfigured'));
    }
    return Reflect.get(client, prop);
  }
});

/**
 * Returns the active SQL client
 */
export const getDb = () => sql;

/**
 * Helper to execute raw queries with timing and error handling
 */
export async function queryNeon<T = any>(queryText: string, params: any[] = []): Promise<{ rows: T[]; latencyMs: number }> {
  const start = performance.now();
  const rows = await sql(queryText, params);
  const latencyMs = Math.round(performance.now() - start);
  return { rows: rows as T[], latencyMs };
}
