import { AuditorCore } from '@/lib/barrierlens/agent/auditor-core';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const targetUrl = body.targetUrl || 'http://localhost:3000/benchmark';
  const goal = body.goal || 'Complete subscription flow';
  const persona = body.persona || 'keyboard';
  const maxSteps = body.maxSteps || 10;

  const encoder = new TextEncoder();
  const customStream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendEvent('status', { message: 'Launching Playwright Chromium & CDP session...' });

        const auditor = new AuditorCore();
        await auditor.runAudit(
          targetUrl, 
          goal, 
          persona, 
          maxSteps, 
          (progressEvent) => {
            sendEvent(progressEvent.type, progressEvent.data);
          }
        );

        controller.close();
      } catch (err: any) {
        sendEvent('error', { message: err.message });
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
