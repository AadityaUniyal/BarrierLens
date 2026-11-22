import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

// Read DATABASE_URL
let dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        dbUrl = trimmed.slice('DATABASE_URL='.length).trim();
        break;
      }
    }
  } catch {}
}

if (!dbUrl) {
  console.error('❌ DATABASE_URL is required to run migrations.');
  process.exit(1);
}

const sql = neon(dbUrl);

async function migrateBetterAuthSchema() {
  console.log('🔄 Initializing BetterAuth tables in Neon Postgres...');

  try {
    // 1. User table (BetterAuth standard)
    await sql`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        "image" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('  ✓ Table "user" ready');

    // 2. Session table
    await sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
    `;
    console.log('  ✓ Table "session" ready');

    // 3. Account table (Social auth & password credentials)
    await sql`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('  ✓ Table "account" ready');

    // 4. Verification table (email OTP / magic links)
    await sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('  ✓ Table "verification" ready');

    // 5. Passkey table (@better-auth/passkey plugin)
    await sql`
      CREATE TABLE IF NOT EXISTS "passkey" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT,
        "publicKey" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "credentialID" TEXT NOT NULL,
        "counter" INTEGER NOT NULL DEFAULT 0,
        "deviceType" TEXT NOT NULL,
        "backedUp" BOOLEAN NOT NULL DEFAULT FALSE,
        "transports" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('  ✓ Table "passkey" ready');

    // 6. Organization plugin tables
    await sql`
      CREATE TABLE IF NOT EXISTS "organization" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE,
        "logo" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "metadata" TEXT
      );
    `;
    console.log('  ✓ Table "organization" ready');

    await sql`
      CREATE TABLE IF NOT EXISTS "member" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "role" TEXT NOT NULL DEFAULT 'member',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('  ✓ Table "member" ready');

    await sql`
      CREATE TABLE IF NOT EXISTS "invitation" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
        "email" TEXT NOT NULL,
        "role" TEXT DEFAULT 'member',
        "status" TEXT NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMP NOT NULL,
        "inviterId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
    `;
    console.log('  ✓ Table "invitation" ready');

    // Create index on foreign keys
    await sql`CREATE INDEX IF NOT EXISTS idx_session_userId ON "session" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_account_userId ON "account" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_passkey_userId ON "passkey" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_userId ON "member" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_organizationId ON "member" ("organizationId");`;

    console.log('🎉 ALL BETTERAUTH SCHEMA TABLES SUCCESSFULLY MIGRATED!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateBetterAuthSchema();
