import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  try {
    // 1. Check Job Status
    const jobs = await sql`
      SELECT id, type, payload, status, locked_at, attempts
      FROM jobs
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (jobs.length === 0) {
      // Check if `id` was a run ID instead
      const runs = await sql`
        SELECT id, persona, status, task_success, effort_ratio, started_at, finished_at, tier_mix, payload
        FROM runs
        WHERE id = ${id}
        LIMIT 1;
      `;
      if (runs.length > 0) {
        return NextResponse.json({
          status: 'completed',
          run: runs[0],
        });
      }
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[0];
    const payload = job.payload && typeof job.payload === 'object' ? job.payload : {};
    const runId = payload.runId || payload.result_id;

    // 2. If running or completed, fetch latest steps & findings
    let steps: any[] = [];
    let findings: any[] = [];
    let runDetails: any = null;

    if (runId) {
      const runs = await sql`
        SELECT id, persona, status, task_success, effort_ratio, started_at, finished_at, tier_mix, payload
        FROM runs
        WHERE id = ${runId}
        LIMIT 1;
      `;
      if (runs.length > 0) {
        runDetails = runs[0];
      }

      steps = await sql`
        SELECT idx, action, tier, latency_ms, ok
        FROM steps
        WHERE run_id = ${runId}
        ORDER BY idx ASC;
      `;

      findings = await sql`
        SELECT id, kind, trust_tier, wcag, severity, evidence, certificate
        FROM findings
        WHERE run_id = ${runId}
        ORDER BY created_at ASC;
      `;
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      attempts: job.attempts,
      runId,
      run: runDetails,
      stepsCount: steps.length,
      steps,
      findingsCount: findings.length,
      findings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Status query failed' }, { status: 500 });
  }
}
