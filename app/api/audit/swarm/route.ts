import { NextRequest, NextResponse } from 'next/server';
import { ParallelPersonaSwarm } from '@/lib/barrierlens/swarm/persona-swarm';
import { PersonaType } from '@/lib/barrierlens/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minute max runtime for multi-persona swarm

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { targetUrl, goal, personas, maxStepsPerPersona, concurrency, synthesizePatches } = body;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing targetUrl' },
        { status: 400 }
      );
    }

    if (!goal || typeof goal !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing goal description' },
        { status: 400 }
      );
    }

    const swarm = new ParallelPersonaSwarm();
    const result = await swarm.executeSwarm({
      targetUrl,
      goal,
      personas: Array.isArray(personas) ? (personas as PersonaType[]) : undefined,
      maxStepsPerPersona: typeof maxStepsPerPersona === 'number' ? maxStepsPerPersona : 6,
      concurrency: typeof concurrency === 'number' ? concurrency : 2,
      synthesizePatches: synthesizePatches !== false
    });

    return NextResponse.json({
      success: true,
      swarmId: result.swarmId,
      summary: {
        targetUrl: result.targetUrl,
        goal: result.goal,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        totalDurationMs: result.totalDurationMs,
        unifiedHealthScore: result.unifiedHealthScore,
        uniqueFindingCount: result.uniqueFindingCount,
        crossPersonaFindingCount: result.crossPersonaFindingCount,
        personasEvaluated: result.personaResults.map(p => ({
          persona: p.persona,
          status: p.status,
          findingsCount: p.findingsCount,
          durationMs: p.durationMs
        })),
        paretoFrontierCount: result.paretoSummary.paretoFrontier.length,
        recommendedPatches: result.recommendedPatches
      },
      findings: result.allFindings
    });
  } catch (error: any) {
    console.error('[API /api/audit/swarm] Error executing swarm:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute parallel persona swarm',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
