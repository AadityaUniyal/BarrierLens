import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { AuditorCore } from '@/lib/barrierlens/agent/auditor-core';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Worker Tick Processor
 * Atomically claims and executes one pending job from the Postgres queue.
 * Can be triggered via Cron, Docker worker loop, or on-demand background worker.
 */
export async function POST(req: Request) {
  // Optional security token check for worker endpoint
  const authHeader = req.headers.get('authorization');
  const workerSecret = process.env.WORKER_SECRET;
  if (workerSecret && authHeader !== `Bearer ${workerSecret}`) {
    return NextResponse.json({ error: 'Unauthorized worker invocation' }, { status: 401 });
  }

  let currentJobId: string | null = null;
  try {
    // 1. Claim next pending job atomically
    const claimed = await sql`
      UPDATE jobs
      SET status = 'running', locked_at = NOW(), attempts = attempts + 1
      WHERE id = (
        SELECT id FROM jobs
        WHERE status = 'pending' AND run_after <= NOW()
        ORDER BY run_after ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, type, payload, attempts;
    `;

    if (claimed.length === 0) {
      return NextResponse.json({ status: 'idle', message: 'No pending jobs in queue' });
    }

    const job = claimed[0];
    currentJobId = job.id;
    console.log(`[Worker API] Claimed Job #${job.id} (Type: ${job.type})`);

    if (job.type === 'audit_run') {
      const payload = job.payload && typeof job.payload === 'object' ? job.payload : {};
      const { targetUrl, goal, persona, maxSteps } = payload;

      const auditor = new AuditorCore();
      const result = await auditor.runAudit(
        targetUrl,
        goal,
        persona || 'keyboard',
        maxSteps || 12
      );

      // Update job to completed
      await sql`
        UPDATE jobs
        SET status = 'completed', payload = jsonb_set(payload, '{result_id}', to_jsonb(${result.id}::text))
        WHERE id = ${job.id};
      `;

      return NextResponse.json({
        status: 'completed',
        jobId: job.id,
        runId: result.id,
        findingsCount: result.findings.length,
        effortRatio: result.effortRatio,
      });
    }

    return NextResponse.json({ status: 'ignored', message: `Unknown job type: ${job.type}` });
  } catch (err: any) {
    console.error('[Worker API] Job execution failed:', err.message);
    if (currentJobId) {
      try {
        await sql`
          UPDATE jobs
          SET status = 'failed', payload = jsonb_set(payload, '{error}', to_jsonb(${String(err.message)}::text))
          WHERE id = ${currentJobId};
        `;
      } catch (updateErr) {
        console.error('[Worker API] Failed to update job failure status', updateErr);
      }
    }
    return NextResponse.json({ error: err.message, jobId: currentJobId }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
