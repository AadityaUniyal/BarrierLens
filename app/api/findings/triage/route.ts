import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required for triage action' }, { status: 401 });
    }

    const { findingId, label } = await req.json();

    if (!findingId || !label) {
      return NextResponse.json({ error: 'findingId and label required' }, { status: 400 });
    }

    if (!['accepted', 'rejected', 'needs_review'].includes(label)) {
      return NextResponse.json({ error: 'Invalid triage label' }, { status: 400 });
    }

    // Server-derived reviewer identity from verified session
    const reviewerId = session.user.id || session.user.email;

    // Ensure reviews table exists
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
        reviewer_id TEXT NOT NULL,
        label TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const result = await sql`
      INSERT INTO reviews (finding_id, reviewer_id, label)
      VALUES (${findingId}, ${reviewerId}, ${label})
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
