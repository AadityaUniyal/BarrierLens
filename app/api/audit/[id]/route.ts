import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { AuditRun, BarrierFinding, ActionStep } from '@/lib/barrierlens/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Audit run ID is required' }, { status: 400 });
  }

  try {
    // 1. Query runs table in Neon Postgres
    const runRows = await sql`
      SELECT 
        id, 
        persona, 
        status, 
        budget, 
        started_at, 
        finished_at, 
        task_success, 
        effort_ratio, 
        tier_mix, 
        target_url, 
        goal_text, 
        payload
      FROM runs
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (runRows.length > 0) {
      const r = runRows[0];

      // If full payload was persisted, return it
      if (r.payload && typeof r.payload === 'object' && r.payload.steps && r.payload.findings) {
        return NextResponse.json({
          run: r.payload,
          source: 'neon_postgres_payload'
        });
      }

      // Otherwise assemble from relational tables
      const stepsRows = await sql`
        SELECT idx, action, tier, latency_ms, ok
        FROM steps
        WHERE run_id = ${id}
        ORDER BY idx ASC;
      `;

      const findingsRows = await sql`
        SELECT 
          id, 
          kind, 
          trust_tier, 
          wcag, 
          severity, 
          severity_lo, 
          severity_hi, 
          evidence, 
          certificate,
          created_at
        FROM findings
        WHERE run_id = ${id}
        ORDER BY created_at ASC;
      `;

      const steps: ActionStep[] = stepsRows.map((s: any) => ({
        idx: s.idx,
        persona: r.persona || 'keyboard',
        actionType: s.action?.action || 'press_key',
        key: s.action?.key,
        tier: s.tier,
        activeElementBefore: '',
        activeElementAfter: s.action?.activeElement || '',
        reasoning: 'Autonomous execution step',
        timestamp: Date.now()
      }));

      const findings: BarrierFinding[] = findingsRows.map((f: any) => ({
        id: f.id,
        runId: id,
        stepIdx: 0,
        kind: f.kind,
        trustTier: f.trust_tier,
        wcagRules: f.wcag || [],
        severity: f.severity > 8 ? 'critical' : f.severity > 5 ? 'high' : 'medium',
        severityScore: f.severity || 5.0,
        severityInterval: [f.severity_lo || 4.0, f.severity_hi || 6.0],
        title: `${f.kind.replace(/_/g, ' ').toUpperCase()}`,
        summary: f.certificate?.summary || `Finding detected: ${f.kind}`,
        evidence: f.evidence || {},
        certificate: f.certificate
      }));

      const auditRun: AuditRun = {
        id: r.id,
        targetUrl: r.target_url || 'https://barrierlens.ai',
        goal: r.goal_text || 'Complete accessibility evaluation',
        persona: r.persona || 'keyboard',
        status: r.status,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        taskSuccess: r.task_success ?? true,
        effortRatio: r.effort_ratio ? parseFloat(r.effort_ratio) : 1.0,
        tierMix: r.tier_mix || { tier0Rules: 1, tier1Ranker: 1, tier2Groq: 1, tier3Gemini: 0 },
        steps,
        findings
      };

      return NextResponse.json({
        run: auditRun,
        source: 'neon_postgres_relational'
      });
    }

    // 2. Check if ID belongs to a Job in the jobs queue
    const jobRows = await sql`
      SELECT id, type, payload, status, locked_at, attempts
      FROM jobs
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (jobRows.length > 0) {
      const job = jobRows[0];
      const payload = job.payload && typeof job.payload === 'object' ? job.payload : {};
      const runId = payload.runId || payload.result_id;

      return NextResponse.json({
        job: {
          id: job.id,
          status: job.status,
          attempts: job.attempts,
          runId
        },
        message: 'Job found in queue. Query /api/audit/status/' + id + ' for real-time progress.'
      });
    }

    return NextResponse.json({ error: 'Audit run not found in Neon database' }, { status: 404 });
  } catch (err: any) {
    console.error('[API Audit ID] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch audit run' }, { status: 500 });
  }
}
