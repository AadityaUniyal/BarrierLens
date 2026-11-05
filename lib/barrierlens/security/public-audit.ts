import { AuditorCore } from '../agent/auditor-core';
import { PersonaType } from '../types';
import {
  assertAuditQuota,
  beginAudit,
  clientIp,
} from './rate-limit';
import {
  TargetPolicyError,
  assertGoal,
  clampPublicMaxSteps,
  requestOriginFrom,
  resolvePublicTargetUrl,
} from './target-policy';
import { RateLimitError } from './rate-limit';

export type PublicAuditBody = {
  targetUrl?: string;
  goal?: string;
  persona?: PersonaType;
  maxSteps?: number;
};

export async function runGuardedAudit(
  req: Request,
  body: PublicAuditBody,
  onProgress?: (event: { type: 'step' | 'finding' | 'complete' | 'status'; data: any }) => void
) {
  const ip = clientIp(req);
  assertAuditQuota(ip);

  const origin = requestOriginFrom(req);
  const targetUrl = await resolvePublicTargetUrl(body.targetUrl, origin);
  const goal = assertGoal(body.goal);
  const persona: PersonaType = body.persona || 'keyboard';
  const maxSteps = clampPublicMaxSteps(body.maxSteps);

  const release = beginAudit(ip);
  try {
    const auditor = new AuditorCore();
    return await auditor.runAudit(targetUrl, goal, persona, maxSteps, onProgress);
  } catch (auditErr: any) {
    console.error('[Auditor Core] Audit execution failed:', auditErr.message);
    // Report honest error state without fabricating synthetic steps or fake certificates
    onProgress?.({ 
      type: 'status', 
      data: { error: auditErr.message || 'Audit execution halted', status: 'failed' } 
    });
    throw auditErr;
  } finally {
    release();
  }
}

export function publicErrorResponse(err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof TargetPolicyError) {
    return { status: 400, body: { error: err.message, code: err.code } };
  }
  if (err instanceof RateLimitError) {
    return {
      status: 429,
      body: { error: err.message, code: 'rate_limited', retryAfterSec: err.retryAfterSec },
    };
  }
  const message = err instanceof Error ? err.message : 'Audit failed';
  return { status: 500, body: { error: message, code: 'audit_failed' } };
}
