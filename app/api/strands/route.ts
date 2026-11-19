import { NextRequest, NextResponse } from 'next/server';
import { strandsAgentMesh } from '@/lib/barrierlens/agent/strands-agent-core';
import { backendBreaker } from '@/lib/barrierlens/agent/backend-circuit-breaker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = body.targetUrl || body.url || 'http://localhost:3000/benchmark';

    // 1. Explicit Python Engine Execution (if requested by caller and backend is online)
    if (body.engine === 'python' || body.preferBackend === 'python') {
      const isOnline = await backendBreaker.checkAvailability();
      if (isOnline) {
        try {
          const pyRes = await fetch(`${backendBreaker.getUrl()}/api/strands/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUrl,
              goal: body.goal || 'Complete primary interaction flow using only keyboard',
              persona: body.persona || 'keyboard',
              maxSteps: body.maxSteps || 8
            }),
            signal: AbortSignal.timeout(45_000)
          });

          if (pyRes.ok) {
            const pyData = await pyRes.json();
            backendBreaker.markOnline();
            return NextResponse.json({
              success: true,
              backendEngine: 'Python Strands Swarm (FastAPI + Bedrock Nova)',
              timestamp: new Date().toISOString(),
              ...pyData
            });
          }
        } catch {
          backendBreaker.markOffline();
        }
      }
    }

    // 2. High-Performance Integrated Node.js Multi-Agent Mesh
    const result = await strandsAgentMesh.runAudit(targetUrl);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('[Strands API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Autonomous Agent Traversal encountered an error.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
  let pythonAvailable = false;
  try {
    const ping = await fetch(`${pythonBackendUrl}/health`, { signal: AbortSignal.timeout(1000) });
    pythonAvailable = ping.ok;
  } catch {
    pythonAvailable = false;
  }

  return NextResponse.json({
    status: 'operational',
    framework: 'AWS Strands Agents (Python + Node.js Dual Runtime)',
    pythonBackendAvailable: pythonAvailable,
    models: {
      routine: 'amazon.nova-micro-v1:0 ($0.000035/1K tokens)',
      reasoning: 'amazon.nova-pro-v1:0 ($0.0008/1K tokens)',
    },
    capabilities: [
      'Tarjan SCC Focus Loop Detection (NetworkX)',
      'VoiceOver Kendall Tau Reading Order Analysis (scipy)',
      'Pearl SCM Causal Counterfactual Intervention',
      'Isolated Container Sandbox Replay (Playwright Chromium)',
      '768-dim Barrier Genome Vectorizer (Neon pgvector)',
    ],
  });
}
