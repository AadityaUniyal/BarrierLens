import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL ?? 'http://127.0.0.1:8000';

async function proxy(request: NextRequest, segments: string[]) {
  const path = '/' + (segments || []).join('/');
  const search = request.nextUrl.search || '';
  const targetUrl = `${PYTHON_BACKEND}${path}${search}`;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'barrierlens-nextjs'
      },
      body,
      signal: AbortSignal.timeout(60_000),
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }
    const textData = await upstream.text();
    return new NextResponse(textData, {
      status: upstream.status,
      headers: { 'Content-Type': contentType || 'text/plain' }
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Python backend timeout after 60s', backend: PYTHON_BACKEND },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Python backend unavailable', detail: err.message, backend: PYTHON_BACKEND },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  return proxy(req, route);
}

export async function POST(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  return proxy(req, route);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  return proxy(req, route);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  return proxy(req, route);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  return proxy(req, route);
}
