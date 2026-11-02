import { NextResponse } from 'next/server';
import { runGuardedAudit, publicErrorResponse } from '@/lib/barrierlens/security/public-audit';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runGuardedAudit(req, body);
    return NextResponse.json(result);
  } catch (err: any) {
    const mapped = publicErrorResponse(err);
    return NextResponse.json(mapped.body, {
      status: mapped.status,
      headers: mapped.status === 429 ? { 'Retry-After': String((mapped.body.retryAfterSec as number) || 60) } : undefined,
    });
  }
}
