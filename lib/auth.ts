import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { organization } from 'better-auth/plugins/organization';
import { Pool } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || '9f8c1b2e3a4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
  database: new Pool({ connectionString: databaseUrl }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy_github_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_github_secret',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_google_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_secret',
    },
  },
  plugins: [
    passkey({
      rpID: process.env.AUTH_RP_ID || 'localhost',
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
