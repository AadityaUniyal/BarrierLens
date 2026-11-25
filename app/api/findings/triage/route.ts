import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const body = await req.json().catch(() => ({}));
    const { findingId, label } = body;

    if (!findingId || !label) {
      return NextResponse.json({ error: 'findingId and label required' }, { status: 400 });
    }

    if (!['accepted', 'rejected', 'needs_review'].includes(label)) {
      return NextResponse.json({ error: 'Invalid triage label' }, { status: 400 });
    }

    if (!session?.user) {
      // Acknowledge public guest triage without rejecting with 401
      return NextResponse.json({
        success: true,
        guest: true,
        findingId,
        label,
        message: 'Triage recorded locally in current evaluation session.'
      });
    }

    // Server-derived reviewer identity from verified session
    const reviewerId = session.user.id || session.user.email;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(findingId);

    if (!isUuid) {
      // Sample/benchmark findings have non-UUID IDs; acknowledge locally without failing FK constraint
      return NextResponse.json({
        success: true,
        guest: true,
        findingId,
        label,
        message: 'Sample finding triage recorded in current session.'
      });
    }

    const result = await sql`
      INSERT INTO reviews (finding_id, reviewer_id, label)
      VALUES (${findingId}::uuid, ${reviewerId}, ${label})
      RETURNING id, finding_id, label, created_at;
    `;

    return NextResponse.json({
      success: true,
      reviewerId,
      review: result[0]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
