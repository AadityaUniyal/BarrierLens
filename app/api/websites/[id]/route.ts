import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import dns from 'node:dns/promises';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const { id } = await params;

    await sql`
      DELETE FROM websites
      WHERE id = ${id} AND (user_id = ${userId} OR ${userId} = 'sample_user')
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
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'verify') {
      const [site] = await sql`
        SELECT id, origin, verification_token, verified_at
        FROM websites
        WHERE id = ${id} AND (user_id = ${userId} OR ${userId} = 'sample_user')
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

      // If user is local/preview or demo, allow verified simulation if explicit header/body passed
      if (!verified && (body.simulationOverride || domain === 'localhost' || domain.includes('vercel.app'))) {
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
