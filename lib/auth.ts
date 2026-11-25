import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { organization } from 'better-auth/plugins/organization';
import postgres from 'postgres';

const databaseUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').trim();
const isValidUrl =
  Boolean(databaseUrl) &&
  !databaseUrl.includes('[SENSITIVE]') &&
  !databaseUrl.includes('[YOUR-PASSWORD]') &&
  (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'));

// Safe mock pool for build time when no DB URL is configured
const dummyPool: any = {
  connect: async () => ({
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => {},
  }),
  query: async () => ({ rows: [], rowCount: 0 }),
  on: () => {},
  end: async () => {},
};

/**
 * Adapts `postgres` (postgres.js) into a pg-Pool compatible interface for BetterAuth's Kysely PostgresDialect.
 */
function createPostgresPool(url: string): any {
  const client = postgres(url, {
    ssl: 'require',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  const runQuery = async (text: string, params?: any[]) => {
    const rows = await client.unsafe(text, params || []);
    return {
      rows: Array.from(rows),
      rowCount: typeof (rows as any).count === 'number' ? (rows as any).count : rows.length,
    };
  };

  return {
    connect: async () => ({
      query: runQuery,
      release: () => {},
    }),
    query: runQuery,
    on: () => {},
    end: async () => {
      await client.end();
    },
  };
}

const dbPool = isValidUrl ? createPostgresPool(databaseUrl) : dummyPool;

const isProduction = process.env.NODE_ENV === 'production';
const authSecret = process.env.BETTER_AUTH_SECRET;

if (isProduction && !authSecret) {
  console.warn('[Security Warning] BETTER_AUTH_SECRET is not configured in production environment.');
}

// Build social providers dynamically based only on genuine configuration
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: authSecret || 'dev_secret_only_local_fallback_min_32_characters_long',
  database: dbPool,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
  plugins: [
    passkey({
      rpID: process.env.AUTH_RP_ID || (process.env.VERCEL_URL ? process.env.VERCEL_URL.replace(/https?:\/\//, '') : 'localhost'),
      rpName: 'BarrierLens',
    }),
    organization(),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
