import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { assertAuditQuota, clientIp } from '@/lib/barrierlens/security/rate-limit';
import {
  assertGoal,
  clampPublicMaxSteps,
  requestOriginFrom,
  resolvePublicTargetUrl,
} from '@/lib/barrierlens/security/target-policy';
import { publicErrorResponse } from '@/lib/barrierlens/security/public-audit';
import { PersonaType } from '@/lib/barrierlens/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    assertAuditQuota(ip);

    const body = await req.json().catch(() => ({}));
    const origin = requestOriginFrom(req);
    const targetUrl = await resolvePublicTargetUrl(body.targetUrl, origin);
    const goal = assertGoal(body.goal);
    const persona: PersonaType = body.persona || 'keyboard';
    const maxSteps = clampPublicMaxSteps(body.maxSteps);

    const runId = crypto.randomUUID();

    // 1. Enqueue job into Postgres SKIP LOCKED jobs table
    const result = await sql`
      INSERT INTO jobs (type, payload, status, run_after)
      VALUES (
        'audit_run',
        ${JSON.stringify({ targetUrl, goal, persona, maxSteps, runId })},
        'pending',
        NOW()
      )
      RETURNING id, status, created_at;
    `;

    const job = result[0];

    return NextResponse.json({
      jobId: job.id,
      runId,
      status: 'pending',
      targetUrl,
      goal,
      persona,
      maxSteps,
      pollUrl: `/api/audit/status/${job.id}`,
    });
  } catch (err: any) {
    const mapped = publicErrorResponse(err);
    return NextResponse.json(mapped.body, {
      status: mapped.status,
      headers: mapped.status === 429 ? { 'Retry-After': String((mapped.body.retryAfterSec as number) || 60) } : undefined,
    });
  }
}
