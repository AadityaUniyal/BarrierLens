import { NextResponse } from 'next/server';
import { auditCapacity } from '@/lib/barrierlens/security/rate-limit';
import { sql } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let database = false;
  try {
    await sql`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const capacity = auditCapacity();
  return NextResponse.json({
    ok: true,
    product: 'BarrierLens',
    access: 'free',
    database,
    audit: {
      available: capacity.inFlight < capacity.maxInFlight,
      ...capacity,
    },
    demoPath: '/benchmark',
  });
}
