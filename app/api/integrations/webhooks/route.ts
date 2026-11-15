import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

/**
 * Verify incoming webhook HMAC signature
 */
function verifySignature(payload: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}

/**
 * POST /api/integrations/webhooks
 * Dispatches audit failure or completion notifications, or handles incoming CI triggers.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { action, webhookUrl, secret, eventType, data } = body;

    // Action 1: Outgoing Dispatch (e.g. notify Slack/Teams/Discord or customer endpoint)
    if (action === 'dispatch' || webhookUrl) {
      if (!webhookUrl) {
        return NextResponse.json({ error: 'webhookUrl is required for dispatch' }, { status: 400 });
      }

      const timestamp = Date.now();
      const payloadData = data || {};
      const signingSecret = secret || process.env.BARRIERLENS_WEBHOOK_SECRET || 'barrierlens-default-secret';

      const payload = {
        event: eventType || 'audit.completed',
        timestamp,
        data: payloadData
      };

      const payloadString = JSON.stringify(payload);
      const signature = `sha256=${crypto.createHmac('sha256', signingSecret).update(payloadString).digest('hex')}`;

      // Check if Slack format
      let outgoingBody: string;
      if (webhookUrl.includes('slack.com') || webhookUrl.includes('hooks.slack.com')) {
        outgoingBody = JSON.stringify({
          text: `🛡️ *BarrierLens Audit Alert:* ${eventType || 'audit.completed'}`,
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: `🛡️ BarrierLens Audit: ${eventType || 'audit.completed'}` }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Target URL:* ${payloadData.targetUrl || 'N/A'}\n*Status:* ${payloadData.status || 'completed'}\n*Effort Ratio:* \`${payloadData.effortRatio?.toFixed(2) || '1.00'}x\`\n*Total Findings:* ${payloadData.totalFindings || 0}`
              }
            }
          ]
        });
      } else {
        outgoingBody = payloadString;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BarrierLens-Webhook/2.6.0',
          'X-BarrierLens-Event': eventType || 'audit.completed',
          'X-BarrierLens-Timestamp': String(timestamp),
          'X-BarrierLens-Signature': signature
        },
        body: outgoingBody
      });

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        deliveredAt: new Date(timestamp).toISOString()
      });
    }

    // Action 2: Incoming Webhook (e.g. from GitHub PR or external trigger)
    const signature = req.headers.get('x-barrierlens-signature') || req.headers.get('x-hub-signature-256');
    const secretKey = process.env.BARRIERLENS_WEBHOOK_SECRET || 'barrierlens-default-secret';

    const isValid = signature ? verifySignature(rawBody, signature, secretKey) : true;

    return NextResponse.json({
      received: true,
      verified: isValid,
      event: body.event || 'custom_trigger',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
