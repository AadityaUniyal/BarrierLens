import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^[0-9a-f-]{16,}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid run id' }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT id, persona, status, task_success, effort_ratio, started_at, finished_at,
             tier_mix, target_url, goal_text, payload
      FROM runs
      WHERE id = ${id}
      LIMIT 1;
    `;
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const payload = row.payload && typeof row.payload === 'object' ? row.payload : null;
    return NextResponse.json({
      id: row.id,
      persona: row.persona,
      status: row.status,
      taskSuccess: row.task_success,
      effortRatio: row.effort_ratio,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      targetUrl: row.target_url,
      goal: row.goal_text,
      audit: payload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lookup failed' }, { status: 500 });
  }
}
