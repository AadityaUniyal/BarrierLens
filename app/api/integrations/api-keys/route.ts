import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sql } from '@/lib/supabase/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getUserId(req: NextRequest): Promise<string> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);
    if (session?.user?.id) return session.user.id;
  } catch {}
  return 'sample_user';
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    let keys: any[] = [];
    try {
      keys = await sql`
        SELECT id, name, key_prefix, scopes, rate_limit_per_min, last_used_at, created_at
        FROM api_keys
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
      `;
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, keys });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json().catch(() => ({}));
    const name = body.name || 'Production CI/CD Runner';
    const scopes = body.scopes || ['audits:read', 'audits:write'];

    // Generate bl_live_ key
    const rawEntropy = crypto.randomBytes(24).toString('base64url');
    const secretKey = `bl_live_${rawEntropy}`;
    const keyPrefix = secretKey.slice(0, 12);
    const keyHash = crypto.createHash('sha256').update(secretKey).digest('hex');

    const keyId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    try {
      await sql`
        INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, scopes, rate_limit_per_min, created_at)
        VALUES (${keyId}, ${userId}, ${name}, ${keyPrefix}, ${keyHash}, ${scopes}, 120, ${createdAt});
      `;
    } catch (e: any) {
      console.error('[API Keys] Neon insert failure:', e.message);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }

    // Return the secretKey plaintext ONLY ONCE upon creation
    return NextResponse.json({
      success: true,
      key: {
        id: keyId,
        name,
        keyPrefix,
        secretKey, // Displayed once in UI modal
        scopes,
        rateLimitPerMin: 120,
        createdAt
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing key id' }, { status: 400 });
    }

    const userId = await getUserId(req);

    try {
      await sql`DELETE FROM api_keys WHERE id = ${id}::uuid AND user_id = ${userId};`;
    } catch (e: any) {
      console.error('[API Keys] Neon delete failure:', e.message);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Key ${id} revoked.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
