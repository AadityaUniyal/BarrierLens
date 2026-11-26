import { NextResponse } from 'next/server';
import { VerifiedRepairEngine } from '@/lib/barrierlens/repair/verified-replay';
import { resolvePublicTargetUrl, requestOriginFrom, TargetPolicyError } from '@/lib/barrierlens/security/target-policy';
import { assertAuditQuota, beginAudit, clientIp, RateLimitError } from '@/lib/barrierlens/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let release: (() => void) | null = null;
  try {
    const ip = clientIp(req);
    assertAuditQuota(ip);
    release = beginAudit(ip);
    const body = await req.json().catch(() => ({}));
    const rawTargetUrl = body.targetUrl || '/benchmark';
    const findingId = body.findingId || crypto.randomUUID();
    const findingKind = body.findingKind || 'keyboard_trap';
    const patch = body.patch || 'aria-modal="true" role="dialog"';

    const targetSelector = body.selector || body.targetSelector || undefined;
    const traceKeySequence = body.traceKeySequence || ['Tab', 'Tab', 'Enter'];

    // Enforce SSRF & target policy guards
    const origin = requestOriginFrom(req);
    const targetUrl = await resolvePublicTargetUrl(rawTargetUrl, origin);

    const repairEngine = new VerifiedRepairEngine();
    const result = await repairEngine.verifyPatch(
      targetUrl,
      findingId,
      findingKind,
      patch,
      traceKeySequence,
      undefined,
      targetSelector
    );

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, retryAfterSec: err.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(err.retryAfterSec) } }
      );
    }
    if (err instanceof TargetPolicyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message || 'Repair verification failed' },
      { status: 500 }
    );
  } finally {
    release?.();
  }
}
