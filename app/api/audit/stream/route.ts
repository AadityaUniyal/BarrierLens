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
      const sendEvent = (event: string, rawData: any) => {
        let payload: any = { type: event };
        if (event === 'step') {
          payload.step = rawData?.step || rawData;
        } else if (event === 'finding') {
          payload.finding = rawData?.finding || rawData;
        } else if (event === 'complete') {
          payload.auditRun = rawData?.auditRun || rawData;
          payload.shareUrl = rawData?.shareUrl || (payload.auditRun?.id ? `/scorecard/${payload.auditRun.id}` : '');
        } else if (event === 'status') {
          payload.message = rawData?.message || (typeof rawData === 'string' ? rawData : 'Processing...');
        } else if (event === 'error') {
          payload.error = rawData?.error || rawData?.message || 'Audit encountered an issue';
        } else if (typeof rawData === 'object' && rawData !== null) {
          payload = { ...payload, ...rawData };
        }
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
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
