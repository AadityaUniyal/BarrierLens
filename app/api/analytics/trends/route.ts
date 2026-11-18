import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');

    // 1. Query Overall Run Stats from Neon Postgres
    let runStats: any = null;
    let runsList: any[] = [];
    let findingsList: any[] = [];
    let genomeStats: any = null;

    try {
      if (domain) {
        const [stats] = await sql`
          SELECT 
            count(*) as total_runs,
            count(*) FILTER (WHERE status = 'completed') as completed_runs,
            count(*) FILTER (WHERE task_success = true) as successful_runs,
            coalesce(avg(effort_ratio), 1.0) as avg_effort_ratio
          FROM runs
          WHERE target_url ILIKE ${'%' + domain + '%'};
        `;
        runStats = stats;

        runsList = await sql`
          SELECT id, target_url, goal_text, task_success, effort_ratio, started_at, finished_at
          FROM runs
          WHERE target_url ILIKE ${'%' + domain + '%'}
          ORDER BY COALESCE(started_at, created_at) DESC
          LIMIT 25;
        `;
      } else {
        const [stats] = await sql`
          SELECT 
            count(*) as total_runs,
            count(*) FILTER (WHERE status = 'completed') as completed_runs,
            count(*) FILTER (WHERE task_success = true) as successful_runs,
            coalesce(avg(effort_ratio), 1.0) as avg_effort_ratio
          FROM runs;
        `;
        runStats = stats;

        runsList = await sql`
          SELECT id, target_url, goal_text, task_success, effort_ratio, started_at, finished_at
          FROM runs
          ORDER BY COALESCE(started_at, created_at) DESC
          LIMIT 25;
        `;
      }

      // 2. Query Finding Kinds Breakdown
      findingsList = await sql`
        SELECT 
          kind, 
          count(*) as count, 
          avg(severity) as avg_severity,
          count(*) FILTER (WHERE trust_tier = 'proven') as proven_count
        FROM findings
        GROUP BY kind
        ORDER BY count DESC;
      `;

      // 3. Query Barrier Genome Store Stats
      const [gStats] = await sql`
        SELECT 
          count(*) as total_genomes,
          count(DISTINCT domain) as unique_domains,
          avg(severity_score) as avg_genome_severity
        FROM barrier_genomes;
      `;
      genomeStats = gStats;

    } catch (dbErr: any) {
      console.warn('[Analytics Trends API] Neon query fallback:', dbErr.message);
    }

    // 4. Compute dynamic MTTR from completed runs
    let mttrMinutes: number | null = null;
    try {
      const [mttrRow] = await sql`
        SELECT avg(EXTRACT(EPOCH FROM (finished_at - started_at)) / 60) as avg_minutes
        FROM runs
        WHERE status = 'completed' AND finished_at IS NOT NULL AND started_at IS NOT NULL;
      `;
      const raw = parseFloat(mttrRow?.avg_minutes || '0');
      if (raw > 0) mttrMinutes = Math.round(raw * 10) / 10;
    } catch { /* DB offline fallback */ }

    // 5. Compute dynamic WCAG compliance rates from findings table
    let wcagMatrix: Record<string, string> = {
      wcag212_noKeyboardTrap: '100%',
      wcag412_nameRoleValue: '100%',
      wcag132_meaningfulSequence: '100%',
      wcag413_statusMessages: '100%'
    };
    try {
      const totalFindingsRes = await sql`SELECT count(*) as n FROM findings;`;
      const totalN = parseInt(totalFindingsRes[0]?.n || '0');
      if (totalN > 0) {
        const wcagCounts = await sql`
          SELECT wcag, count(*) as n
          FROM findings
          WHERE wcag IN ('2.1.2', '4.1.2', '1.3.2', '4.1.3')
          GROUP BY wcag;
        `;
        const byWcag: Record<string, number> = {};
        for (const row of wcagCounts) byWcag[row.wcag] = parseInt(row.n || '0');
        const calcPct = (wcagId: string) => {
          const failCount = byWcag[wcagId] || 0;
          return `${Math.round(((totalN - failCount) / totalN) * 1000) / 10}%`;
        };
        wcagMatrix = {
          wcag212_noKeyboardTrap: calcPct('2.1.2'),
          wcag412_nameRoleValue: calcPct('4.1.2'),
          wcag132_meaningfulSequence: calcPct('1.3.2'),
          wcag413_statusMessages: calcPct('4.1.3')
        };
      }
    } catch { /* fallback default matrix */ }

    // 6. Default baseline metrics if DB is fresh / cold
    const totalRuns = parseInt(runStats?.total_runs || '0');
    const successfulRuns = parseInt(runStats?.successful_runs || '0');
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;
    const avgEffortRatio = parseFloat(parseFloat(runStats?.avg_effort_ratio || '1.0').toFixed(2));

    // Calculate synthetic historical trend points from real runs
    const trendPoints = runsList.map((r: any, idx: number) => ({
      runId: r.id,
      timestamp: r.started_at || new Date(Date.now() - (runsList.length - idx) * 3600000).toISOString(),
      effortRatio: parseFloat(r.effort_ratio || '1.0'),
      taskSuccess: Boolean(r.task_success),
      targetUrl: r.target_url || 'Autonomous Fixture'
    }));

    const findingsBreakdown = (findingsList && findingsList.length > 0)
      ? findingsList.map((f: any) => ({
          kind: f.kind,
          count: parseInt(f.count || '0'),
          provenCount: parseInt(f.proven_count || '0'),
          avgSeverity: parseFloat(parseFloat(f.avg_severity || '5.0').toFixed(1))
        }))
      : [];

    return NextResponse.json({
      summary: {
        totalAudits: totalRuns,
        successRate: `${successRate}%`,
        averageEffortRatio: `${avgEffortRatio}x`,
        activeDomains: parseInt(genomeStats?.unique_domains || '0'),
        totalBarrierGenomes: parseInt(genomeStats?.total_genomes || '0'),
        meanTimeToRemediation: mttrMinutes !== null ? `${mttrMinutes} minutes` : (totalRuns > 0 ? 'N/A' : 'Pending runs')
      },
      wcagComplianceMatrix: wcagMatrix,
      findingsBreakdown,
      longitudinalTrend: trendPoints,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Analytics Trends API] Error:', err);
    return NextResponse.json({ error: err.message || 'Analytics query failed' }, { status: 500 });
  }
}
