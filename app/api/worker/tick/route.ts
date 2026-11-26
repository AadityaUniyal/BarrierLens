import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase/db';
import { AuditorCore } from '@/lib/barrierlens/agent/auditor-core';
import { VPATGenerator } from '@/lib/barrierlens/compliance/vpat-generator';
import { WebhookDispatcher, WebhookEventType } from '@/lib/barrierlens/integrations/webhook-dispatcher';
import { AWSS3ArtifactStore } from '@/lib/barrierlens/aws/s3-artifact-store';
import { DomainCrawler } from '@/lib/barrierlens/crawler/domain-crawler';
import { getAuthenticatedContext, unauthorizedResponse } from '@/lib/barrierlens/security/auth-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Worker Tick Processor
 * Atomically claims and executes one pending job from the Postgres queue.
 * Recovers stale locks (>5m) and retries transient failures up to 3 attempts.
 */
export async function POST(req: Request) {
  const authCtx = await getAuthenticatedContext(req);
  if (!authCtx) {
    return unauthorizedResponse('Unauthorized worker invocation');
  }

  let currentJobId: string | null = null;
  try {
    // 0. Requeue stale running jobs locked > 5 minutes ago
    await sql`
      UPDATE jobs
      SET status = 'pending', locked_at = NULL, run_after = NOW()
      WHERE status = 'running' AND locked_at < NOW() - INTERVAL '5 minutes' AND attempts < 3;
    `.catch(() => {});

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
      const { targetUrl, goal, persona, maxSteps, sessionHeaders, sessionCookies } = payload;

      const auditor = new AuditorCore();
      const result = await auditor.runAudit(
        targetUrl,
        goal,
        persona || 'keyboard',
        maxSteps || 12,
        undefined,
        {
          extraHeaders: sessionHeaders,
          cookies: sessionCookies,
          bypassConsent: true,
        }
      );

      // Update job to completed
      await sql`
        UPDATE jobs
        SET status = 'completed', payload = jsonb_set(
          CASE WHEN jsonb_typeof(payload) = 'object' THEN payload ELSE '{}'::jsonb END,
          '{result_id}',
          to_jsonb(${result.id}::text)
        )
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

      const targetOrigin = targetDomain.startsWith('http')
        ? targetDomain.replace(/\/$/, '')
        : `https://${targetDomain}`;

      // Autonomously discover real routes via DomainCrawler
      const crawler = new DomainCrawler();
      let targetUrls: string[] = [];
      try {
        const crawlProfile = await crawler.crawlDomain(targetOrigin, limit);
        targetUrls = crawlProfile.routes.map((r) => r.url);
      } catch (crawlErr: any) {
        console.warn(`[Worker API] Route discovery failed for ${targetOrigin}, using origin:`, crawlErr.message);
        targetUrls = [targetOrigin];
      }

      if (targetUrls.length === 0) {
        targetUrls = [targetOrigin];
      }

      const auditor = new AuditorCore();
      const runResults: string[] = [];

      for (const urlToAudit of targetUrls.slice(0, limit)) {
        try {
          const run = await auditor.runAudit(urlToAudit, `Continuous crawler audit for ${urlToAudit}`, persona || 'keyboard', 8);
          runResults.push(run.id);
        } catch (auditErr: any) {
          console.warn(`[Worker API] Path crawl failed for ${urlToAudit}:`, auditErr.message);
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
          SET
            status = CASE WHEN attempts < 3 THEN 'pending' ELSE 'failed' END,
            locked_at = NULL,
            run_after = CASE WHEN attempts < 3 THEN NOW() + INTERVAL '30 seconds' ELSE run_after END,
            payload = jsonb_set(
              CASE WHEN jsonb_typeof(payload) = 'object' THEN payload ELSE '{}'::jsonb END,
              '{error}',
              to_jsonb(${String(err.message)}::text)
            )
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
