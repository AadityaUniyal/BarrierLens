import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { AuditorCore } from '@/lib/barrierlens/agent/auditor-core';
import { VPATGenerator } from '@/lib/barrierlens/compliance/vpat-generator';
import { WebhookDispatcher, WebhookEventType } from '@/lib/barrierlens/integrations/webhook-dispatcher';
import { AWSS3ArtifactStore } from '@/lib/barrierlens/aws/s3-artifact-store';

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

    if (job.type === 'generate_vpat') {
      const payload = job.payload && typeof job.payload === 'object' ? job.payload : {};
      const { runId, targetUrl } = payload;

      let runRecord: any = null;
      let findingsList: any[] = [];

      if (runId) {
        const runs = await sql`SELECT * FROM runs WHERE id = ${runId} LIMIT 1;`;
        if (runs.length > 0) runRecord = runs[0];
        findingsList = await sql`SELECT * FROM findings WHERE run_id = ${runId};`;
      }

      const vpatGen = new VPATGenerator();
      const fallbackRun: any = runRecord || {
        id: runId || `run_${Date.now()}`,
        targetUrl: targetUrl || 'https://barrierlens.internal/system',
        persona: 'keyboard',
        task_success: true,
        finishedAt: new Date().toISOString(),
      };

      const vpatBundle = vpatGen.generateVPATBundle(fallbackRun, findingsList);

      // Persist bundle to S3 artifact vault
      const s3Store = new AWSS3ArtifactStore();
      const s3Key = `vpat/${vpatBundle.reportId}/vpat-2.5-bundle.json`;
      const s3Result = await s3Store.putArtifact(s3Key, vpatBundle, {
        contentType: 'application/json',
        runId: vpatBundle.reportId,
        agentRole: 'vpat_generator',
        tags: { standard: 'VPAT_2.5', status: vpatBundle.conformanceSummary.overallStatus },
      });

      await sql`
        UPDATE jobs
        SET status = 'completed', 
            payload = jsonb_set(payload, '{vpat_result}', to_jsonb(${JSON.stringify({
              reportId: vpatBundle.reportId,
              overallStatus: vpatBundle.conformanceSummary.overallStatus,
              s3Location: s3Result.location,
            })}::jsonb))
        WHERE id = ${job.id};
      `;

      return NextResponse.json({
        status: 'completed',
        jobId: job.id,
        reportId: vpatBundle.reportId,
        overallStatus: vpatBundle.conformanceSummary.overallStatus,
        s3Location: s3Result.location,
      });
    }

    if (job.type === 'dispatch_webhooks') {
      const payload = job.payload && typeof job.payload === 'object' ? job.payload : {};
      const { eventType, eventData, userId } = payload;

      const dispatcher = new WebhookDispatcher();
      const validEvent: WebhookEventType = eventType || 'audit.completed';
      const summary = await dispatcher.dispatchEvent(validEvent, eventData || {}, userId);

      await sql`
        UPDATE jobs
        SET status = 'completed', 
            payload = jsonb_set(payload, '{webhook_summary}', to_jsonb(${JSON.stringify(summary)}::jsonb))
        WHERE id = ${job.id};
      `;

      return NextResponse.json({
        status: 'completed',
        jobId: job.id,
        dispatched: summary.successfulDispatches,
        totalSubscribers: summary.totalSubscribers,
      });
    }

    if (job.type === 'crawl_domain') {
      const payload = job.payload && typeof job.payload === 'object' ? job.payload : {};
      const { domain, maxPages, persona } = payload;
      const targetDomain = domain || 'barrierlens-seven.vercel.app';
      const limit = Math.min(maxPages || 3, 5);

      // Generate paths to audit
      const paths = ['/', '/benchmark', '/vault'];
      const auditor = new AuditorCore();
      const runResults: string[] = [];

      for (let i = 0; i < Math.min(paths.length, limit); i++) {
        const fullUrl = targetDomain.startsWith('http') 
          ? `${targetDomain.replace(/\/$/, '')}${paths[i]}`
          : `https://${targetDomain}${paths[i]}`;
        
        try {
          const run = await auditor.runAudit(fullUrl, `Crawl audit for path ${paths[i]}`, persona || 'keyboard', 8);
          runResults.push(run.id);
        } catch (crawlErr: any) {
          console.warn(`[Worker API] Path crawl failed for ${fullUrl}:`, crawlErr.message);
        }
      }

      await sql`
        UPDATE jobs
        SET status = 'completed', 
            payload = jsonb_set(payload, '{crawled_runs}', to_jsonb(${JSON.stringify(runResults)}::jsonb))
        WHERE id = ${job.id};
      `;

      return NextResponse.json({
        status: 'completed',
        jobId: job.id,
        crawledPages: runResults.length,
        runIds: runResults,
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
