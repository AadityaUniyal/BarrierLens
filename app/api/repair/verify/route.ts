import { NextResponse } from 'next/server';
import { VerifiedRepairEngine } from '@/lib/barrierlens/repair/verified-replay';
import { resolvePublicTargetUrl, requestOriginFrom, TargetPolicyError } from '@/lib/barrierlens/security/target-policy';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
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
    if (err instanceof TargetPolicyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message || 'Repair verification failed' },
      { status: 500 }
    );
  }
}
