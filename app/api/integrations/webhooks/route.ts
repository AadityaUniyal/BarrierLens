import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sql } from '@/lib/supabase/db';
import { getAuthenticatedContext, unauthorizedResponse } from '@/lib/barrierlens/security/auth-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 * GET /api/integrations/webhooks
 * Lists registered webhooks for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const authCtx = await getAuthenticatedContext(req);
    if (!authCtx) return unauthorizedResponse('Sign in to view webhooks');
    const userId = authCtx.userId;

    let webhooks: any[] = [];
    try {
      webhooks = await sql`
        SELECT id, user_id, url, secret, events, created_at
        FROM webhooks
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
      `;
    } catch (dbErr: any) {
      console.warn('[Webhooks API] Neon DB read notice:', dbErr.message);
    }

    return NextResponse.json({ success: true, webhooks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/integrations/webhooks
 * Supports:
 * 1. Webhook Registration ({ url, name?, events? })
 * 2. Test Ping ({ action: 'test-ping', webhookId?, url, secret? })
 * 3. Outgoing Dispatch ({ action: 'dispatch', webhookUrl, data, eventType })
 * 4. Incoming Webhook Verification (external triggers)
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

    const authCtx = await getAuthenticatedContext(req);
    if (!authCtx) return unauthorizedResponse('Sign in to manage or dispatch webhooks');
    const userId = authCtx.userId;
    const { action, webhookUrl, url, secret, eventType, data, name, events } = body;
    const targetUrl = url || webhookUrl;

    // Case 1: Webhook Registration from UI (body contains url and no action)
    if (!action && targetUrl) {
      const generatedSecret = `whsec_${crypto.randomBytes(24).toString('base64url')}`;
      const webhookEvents = events || ['audit.completed', 'trap.detected', 'repair.verified'];
      const webhookId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      try {
        await sql`
          INSERT INTO webhooks (id, user_id, url, secret, events, created_at)
          VALUES (${webhookId}, ${userId}, ${targetUrl}, ${generatedSecret}, ${webhookEvents}, ${createdAt});
        `;
      } catch (dbErr: any) {
        console.error('[Webhooks API] Neon DB insert failure:', dbErr.message);
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        webhook: {
          id: webhookId,
          userId,
          url: targetUrl,
          secret: generatedSecret,
          events: webhookEvents,
          createdAt
        }
      });
    }

    // Case 2: Test Ping ({ action: 'test-ping', url, secret })
    if (action === 'test-ping' && targetUrl) {
      const timestamp = Date.now();
      const pingSecret = secret || process.env.BARRIERLENS_WEBHOOK_SECRET || 'barrierlens-test-secret';
      const testPayload = {
        event: 'barrierlens.test_ping',
        timestamp,
        data: {
          message: 'BarrierLens webhook connectivity test successful.',
          platform: 'BarrierLens v2.6.0',
          testId: crypto.randomUUID()
        }
      };

      const payloadString = JSON.stringify(testPayload);
      const signature = `sha256=${crypto.createHmac('sha256', pingSecret).update(payloadString).digest('hex')}`;

      let outgoingBody: string;
      if (targetUrl.includes('slack.com') || targetUrl.includes('hooks.slack.com')) {
        outgoingBody = JSON.stringify({
          text: '🛡️ *BarrierLens Webhook Test:* Connectivity verified successfully!',
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: '🛡️ BarrierLens Webhook Test' }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Status:* `Connected & Verified`\n*Timestamp:* ' + new Date(timestamp).toISOString()
              }
            }
          ]
        });
      } else {
        outgoingBody = payloadString;
      }

      let responseStatus = 200;
      let responseOk = true;

      try {
        const pingRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BarrierLens-Webhook/2.6.0',
            'X-BarrierLens-Event': 'barrierlens.test_ping',
            'X-BarrierLens-Timestamp': String(timestamp),
            'X-BarrierLens-Signature': signature
          },
          body: outgoingBody
        });
        responseStatus = pingRes.status;
        responseOk = pingRes.ok;
      } catch (netErr: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to deliver test ping: ${netErr.message}`,
          targetUrl
        }, { status: 502 });
      }

      return NextResponse.json({
        success: responseOk,
        status: responseStatus,
        deliveredAt: new Date(timestamp).toISOString(),
        message: responseOk ? 'Test ping delivered successfully.' : `Remote server returned HTTP ${responseStatus}`
      });
    }

    // Case 3: Outgoing Dispatch (e.g. notify Slack/Teams/Discord or customer endpoint)
    if (action === 'dispatch' || (webhookUrl && action !== 'test-ping')) {
      if (!targetUrl) {
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
      if (targetUrl.includes('slack.com') || targetUrl.includes('hooks.slack.com')) {
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

      const response = await fetch(targetUrl, {
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

    // Case 4: Incoming Webhook (e.g. from GitHub PR or external trigger)
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

/**
 * DELETE /api/integrations/webhooks?id=<uuid>
 * Revokes and deletes a webhook endpoint.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing webhook id' }, { status: 400 });
    }

    const authCtx = await getAuthenticatedContext(req);
    if (!authCtx) return unauthorizedResponse('Sign in to manage or dispatch webhooks');
    const userId = authCtx.userId;

    try {
      await sql`
        DELETE FROM webhooks 
        WHERE id = ${id}::uuid AND user_id = ${userId};
      `;
    } catch (e: any) {
      console.error('[Webhooks API] Neon delete failure:', e.message);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Webhook ${id} removed.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
