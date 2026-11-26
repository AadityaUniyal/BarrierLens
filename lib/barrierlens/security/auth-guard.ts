import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/supabase/db';

export interface AuthenticatedContext {
  userId: string;
  method: 'session' | 'api_key' | 'worker';
}

/**
 * Resolves an authenticated caller from BetterAuth session cookies,
 * a scoped `bl_live_` API key, or `WORKER_SECRET`.
 * Returns null if unauthenticated — never falls back to a shared sample user.
 */
export async function getAuthenticatedContext(req?: Request): Promise<AuthenticatedContext | null> {
  // 1. BetterAuth session
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);
    if (session?.user?.id) {
      return { userId: session.user.id, method: 'session' };
    }
  } catch {
    // ignore header/session lookup errors
  }

  // 2. Bearer token (Worker secret or scoped API key)
  const authHeader = req?.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const workerSecret = process.env.WORKER_SECRET;
    if (workerSecret && token === workerSecret) {
      return { userId: 'worker_system', method: 'worker' };
    }

    if (token.startsWith('bl_live_')) {
      const keyHash = crypto.createHash('sha256').update(token).digest('hex');
      try {
        const rows = await sql`
          SELECT user_id
          FROM api_keys
          WHERE key_hash = ${keyHash} AND revoked_at IS NULL
          LIMIT 1;
        `;
        if (rows[0]?.user_id) {
          await sql`
            UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = ${keyHash};
          `.catch(() => {});
          return { userId: String(rows[0].user_id), method: 'api_key' };
        }
      } catch {
        // DB unavailable
      }
    }
  }

  return null;
}

export function unauthorizedResponse(message = 'Authentication required') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}
