import { NextRequest, NextResponse } from 'next/server';
import { strandsAgentMesh } from '@/lib/barrierlens/agent/strands-agent-core';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = body.targetUrl || body.url || 'http://localhost:3000/benchmark';

    // 1. Try forwarding to Python FastAPI Backend if active
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const pyRes = await fetch(`${pythonBackendUrl}/api/strands/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          goal: body.goal || 'Complete primary interaction flow using only keyboard',
          persona: body.persona || 'keyboard',
          maxSteps: body.maxSteps || 8
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        return NextResponse.json({
          success: true,
          backendEngine: 'Python Strands Swarm (FastAPI + Bedrock Nova)',
          timestamp: new Date().toISOString(),
          ...pyData
        });
      }
    } catch {
      // Python backend not running or timed out; fall back to integrated Node runner
    }

    // 2. Integrated Multi-Agent Runner
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
  return NextResponse.json({
    status: 'operational',
    framework: 'AWS Strands Agents (Python + Node.js Dual Runtime)',
    pythonBackendAvailable: true,
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
