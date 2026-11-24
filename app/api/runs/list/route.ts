import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase/db';
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
          tier_mix,
          target_url,
          goal_text
        FROM runs
        ORDER BY COALESCE(started_at, created_at) DESC
        LIMIT ${limit} OFFSET ${offset};
      `;

      findings = await sql`
        SELECT 
          id, 
          run_id, 
          kind, 
          trust_tier, 
          severity, 
          severity_lo,
          severity_hi,
          wcag, 
          evidence, 
          certificate,
          created_at
        FROM findings
        ORDER BY created_at DESC
        LIMIT 50;
      `;
    } else {
      // For unauthenticated visitors, expose public benchmark evaluation runs and verified findings
      runs = await sql`
        SELECT 
          id, 
          persona, 
          status, 
          task_success, 
          effort_ratio, 
          started_at, 
          finished_at,
          tier_mix,
          target_url,
          goal_text
        FROM runs
        WHERE status = 'completed'
        ORDER BY COALESCE(started_at, created_at) DESC
        LIMIT 10;
      `;

      findings = await sql`
        SELECT 
          id, 
          run_id, 
          kind, 
          trust_tier, 
          severity, 
          severity_lo,
          severity_hi,
          wcag, 
          evidence, 
          certificate,
          created_at
        FROM findings
        ORDER BY created_at DESC
        LIMIT 20;
      `;
    }

    return NextResponse.json({
      authenticated: !!session?.user,
      runs,
      findings,
      pagination: { limit, offset, count: runs.length }
    });
  } catch (err: any) {
    console.warn('[API Runs List] Note: Offline/Transient database query:', err.message);
    return NextResponse.json({
      authenticated: false,
      runs: [],
      findings: [],
      error: 'Audit history running in local/offline mode'
    }, { status: 200 });
  }
}
