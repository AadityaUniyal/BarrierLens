import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Auto-load .env.local if DATABASE_URL or SUPABASE_URL is not set
if (!process.env.DATABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

/**
 * Standard Supabase client (PostgREST, Auth, Realtime, Storage)
 */
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder'
);

function isValidPostgresUrl(urlStr: string | undefined): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (trimmed.includes('[YOUR-PASSWORD]') || trimmed.includes('[SENSITIVE]')) return false;
  return trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://');
}

let _cachedSql: any = null;
let _cachedUrl: string = '';

function getPostgresClient() {
  const currentUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').trim();
  if (!isValidPostgresUrl(currentUrl)) {
    return null;
  }
  if (!_cachedSql || _cachedUrl !== currentUrl) {
    try {
      _cachedSql = postgres(currentUrl, {
        ssl: 'require',
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false, // Required for Supabase pgbouncer transaction pooler
      });
      _cachedUrl = currentUrl;
    } catch {
      _cachedSql = null;
    }
  }
  return _cachedSql;
}

/**
 * Serverless-compatible tagged template SQL client for Supabase Postgres.
 * Lazy proxy ensures build-time static evaluation does not crash on missing credentials.
 */
export const sql: any = new Proxy(function () {} as any, {
  apply(_target, _thisArg, args) {
    const client = getPostgresClient();
    if (!client) {
      return Promise.reject(new Error('Supabase PostgreSQL client unconfigured or password not set'));
    }
    return Reflect.apply(client, _thisArg, args);
  },
  get(_target, prop) {
    const client = getPostgresClient();
    if (!client) {
      if (prop === 'then') return undefined;
      return () => Promise.reject(new Error('Supabase PostgreSQL client unconfigured or password not set'));
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
export async function queryDb<T = any>(queryText: string, params: any[] = []): Promise<{ rows: T[]; latencyMs: number }> {
  const client = getPostgresClient();
  if (!client) {
    throw new Error('Supabase PostgreSQL client unconfigured');
  }
  const start = performance.now();
  const rows = await client.unsafe(queryText, params);
  const latencyMs = Math.round(performance.now() - start);
  return { rows: rows as unknown as T[], latencyMs };
}

// Compatibility export
export const queryNeon = queryDb;
