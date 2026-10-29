import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const runs = await sql`
      SELECT 
        id, 
        persona, 
        status, 
        task_success, 
        effort_ratio, 
        started_at, 
        finished_at,
        tier_mix
      FROM runs
      ORDER BY started_at DESC
      LIMIT 20;
    `;

    const findings = await sql`
      SELECT 
        id, 
        run_id, 
        kind, 
        trust_tier, 
        severity, 
        wcag, 
        evidence, 
        certificate,
        created_at
      FROM findings
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    return NextResponse.json({
      runs,
      findings
    });
  } catch (err: any) {
    console.warn('[API Runs List] Error querying Neon:', err.message);
    return NextResponse.json({
      runs: [],
      findings: []
    });
  }
}
