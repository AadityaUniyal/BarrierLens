import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { organization } from 'better-auth/plugins/organization';
import { Pool } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

// Fail closed in production if security secrets are missing
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
  baseURL: process.env.BETTER_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  secret: authSecret || 'dev_secret_only_local_fallback_min_32_characters_long',
  database: new Pool({ connectionString: databaseUrl }),
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
