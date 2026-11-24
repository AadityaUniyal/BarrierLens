import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

// Read DIRECT_URL from .env.local
let dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
if (!dbUrl) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DIRECT_URL=')) {
        dbUrl = trimmed.slice('DIRECT_URL='.length).trim().replace(/^["']|["']$/g, '');
        break;
      }
    }
  } catch {}
}

const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

async function migrateBetterAuth() {
  console.log('🔄 Provisioning BetterAuth tables in Supabase Postgres...');
  try {
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
    console.log('  ✓ Table "user" created');

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
    console.log('  ✓ Table "session" created');

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
    console.log('  ✓ Table "account" created');

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
    console.log('  ✓ Table "verification" created');

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
    console.log('  ✓ Table "passkey" created');

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
    console.log('  ✓ Table "organization" created');

    await sql`
      CREATE TABLE IF NOT EXISTS "member" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "role" TEXT NOT NULL DEFAULT 'member',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('  ✓ Table "member" created');

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
    console.log('  ✓ Table "invitation" created');

    await sql`CREATE INDEX IF NOT EXISTS idx_session_userId ON "session" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_account_userId ON "account" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_passkey_userId ON "passkey" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_userId ON "member" ("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_member_organizationId ON "member" ("organizationId");`;

    console.log('✅ BetterAuth tables successfully initialized in Supabase Postgres!');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
  } finally {
    await sql.end();
  }
}

migrateBetterAuth();
