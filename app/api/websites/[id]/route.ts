import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAuthenticatedContext, unauthorizedResponse } from '@/lib/barrierlens/security/auth-guard';
import dns from 'node:dns/promises';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCtx = await getAuthenticatedContext(req);
    if (!authCtx) return unauthorizedResponse('Sign in to delete websites');
    const userId = authCtx.userId;
    const { id } = await params;

    if (id.startsWith('site_sample_')) {
      return NextResponse.json({ error: 'Cannot delete read-only showcase website' }, { status: 403 });
    }

    await sql`
      DELETE FROM websites
      WHERE id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCtx = await getAuthenticatedContext(req);
    if (!authCtx) return unauthorizedResponse('Sign in to verify websites');
    const userId = authCtx.userId;
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'verify') {
      const [site] = await sql`
        SELECT id, origin, verification_token, verified_at
        FROM websites
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (!site) {
        return NextResponse.json({ error: 'Website not found' }, { status: 404 });
      }

      const domain = new URL(site.origin).hostname;
      let verified = false;
      let reason = '';

      // Check DNS TXT records
      try {
        const records = await dns.resolveTxt(domain);
        const flattened = records.flat();
        verified = flattened.includes(site.verification_token);
        if (!verified) {
          reason = `DNS TXT record on ${domain} does not contain ${site.verification_token}.`;
        }
      } catch (dnsErr: any) {
        reason = `DNS TXT lookup failed: ${dnsErr.code || dnsErr.message}`;
      }

      // Check HTTP well-known verification file fallback
      if (!verified) {
        try {
          const fileRes = await fetch(`https://${domain}/.well-known/barrierlens-verification.txt`, {
            signal: AbortSignal.timeout(4000)
          });
          if (fileRes.ok) {
            const text = await fileRes.text();
            if (text.trim().includes(site.verification_token)) {
              verified = true;
            }
          }
        } catch {}
      }

      // Local loopback development fallback only
      if (!verified && (domain === 'localhost' || domain === '127.0.0.1')) {
        verified = true;
      }

      if (verified) {
        await sql`
          UPDATE websites
          SET verified_at = NOW(), updated_at = NOW()
          WHERE id = ${id}
        `;
        return NextResponse.json({ success: true, verified: true });
      } else {
        return NextResponse.json({
          success: false,
          verified: false,
          error: reason || 'Domain verification challenge not met.',
          token: site.verification_token
        }, { status: 422 });
      }
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
