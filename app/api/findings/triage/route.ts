import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { findingId, label, reviewerId = 'human_auditor' } = await req.json();

    if (!findingId || !label) {
      return NextResponse.json({ error: 'findingId and label required' }, { status: 400 });
    }

    // Ensure reviews table exists
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
        reviewer_id TEXT NOT NULL,
        label TEXT NOT NULL, -- 'accepted' | 'rejected'
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
      review: result[0]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
