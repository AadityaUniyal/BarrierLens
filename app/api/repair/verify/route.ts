import { NextResponse } from 'next/server';
import { VerifiedRepairEngine } from '@/lib/barrierlens/repair/verified-replay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetUrl = body.targetUrl || 'http://localhost:3000/benchmark';
    const findingId = body.findingId || crypto.randomUUID();
    const findingKind = body.findingKind || 'keyboard_trap';
    const patch = body.patch || 'aria-modal="true" role="dialog"';

    const repairEngine = new VerifiedRepairEngine();
    const result = await repairEngine.verifyPatch(targetUrl, findingId, findingKind, patch);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
