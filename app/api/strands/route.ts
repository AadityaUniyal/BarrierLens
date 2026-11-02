import { NextRequest, NextResponse } from 'next/server';
import { strandsAgentMesh } from '@/lib/barrierlens/agent/strands-agent-core';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl = body.targetUrl || body.url || 'https://example.com';

    const result = await strandsAgentMesh.runAudit(targetUrl);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Strands Agent Audit failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    framework: '@strands-agents/sdk v1.23.0',
    models: {
      routine: 'amazon.nova-micro-v1:0 ($0.000035/1K tokens)',
      reasoning: 'amazon.nova-pro-v1:0 ($0.0008/1K tokens)',
    },
    capabilities: [
      'Tarjan SCC Focus Loop Detection',
      'VoiceOver Kendall Tau Reading Order Analysis',
      'Pearl SCM Causal Counterfactual Intervention',
      'Isolated Container Sandbox Replay (IMDS blocked)',
      '768-dim Barrier Genome Vectorizer (pgvector HNSW)',
    ],
  });
}
