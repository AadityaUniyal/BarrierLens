import { runGuardedAudit, publicErrorResponse } from '@/lib/barrierlens/security/public-audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const customStream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendEvent('status', { message: 'Launching Playwright Chromium & CDP session...' });

        await runGuardedAudit(req, body, (progressEvent) => {
          sendEvent(progressEvent.type, progressEvent.data);
        });

        controller.close();
      } catch (err: any) {
        const mapped = publicErrorResponse(err);
        sendEvent('error', mapped.body);
        controller.close();
      }
    }
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
