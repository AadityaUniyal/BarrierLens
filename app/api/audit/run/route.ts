import { NextResponse } from 'next/server';
import { AuditorCore } from '@/lib/barrierlens/agent/auditor-core';

export const maxDuration = 60; // Allow up to 60s for full browser exploration
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetUrl = body.targetUrl || 'http://localhost:3000/benchmark';
    const goal = body.goal || 'Complete newsletter sign up and confirm subscription';
    const persona = body.persona || 'keyboard';
    const maxSteps = body.maxSteps || 10;

    const auditor = new AuditorCore();
    const result = await auditor.runAudit(targetUrl, goal, persona, maxSteps);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API Audit Run Error]:', err);
    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
