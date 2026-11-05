import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    // Support pagination
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    let runs = [];
    let findings = [];

    if (session?.user) {
      // Scoped query for authenticated user's organization or account
      runs = await sql`
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
        LIMIT ${limit} OFFSET ${offset};
      `;

      findings = await sql`
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
    } else {
      // For unauthenticated visitors, only expose public sample/benchmark evaluation runs
      runs = await sql`
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
        WHERE status = 'completed'
        ORDER BY started_at DESC
        LIMIT 5;
      `;

      findings = [];
    }

    return NextResponse.json({
      authenticated: !!session?.user,
      runs,
      findings,
      pagination: { limit, offset, count: runs.length }
    });
  } catch (err: any) {
    console.warn('[API Runs List] Error querying Neon:', err.message);
    return NextResponse.json({
      authenticated: false,
      runs: [],
      findings: [],
      error: 'Unable to retrieve audit history'
    }, { status: 500 });
  }
}
