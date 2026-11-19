import { NextRequest, NextResponse } from 'next/server';
import { AdversarialStressAgent } from '@/lib/barrierlens/adversarial/stress-agent';
import { resolvePublicTargetUrl, requestOriginFrom } from '@/lib/barrierlens/security/target-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTarget = body.targetUrl || body.url || 'http://localhost:3000/benchmark';
    const reqOrigin = requestOriginFrom(req);
    const targetUrl = await resolvePublicTargetUrl(rawTarget, reqOrigin);

    const chaosLevel = body.chaosLevel || 'moderate';
    const enableMotorTremor = body.enableMotorTremor !== false;
    const maxSteps = Math.min(25, Math.max(5, parseInt(body.maxSteps || '15')));

    const agent = new AdversarialStressAgent();
    const result = await agent.runStressTest({
      targetUrl,
      chaosLevel,
      enableMotorTremor,
      maxSteps
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error('[Adversarial API Error]:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Adversarial stress test execution failed' },
      { status: 500 }
    );
  }
}
