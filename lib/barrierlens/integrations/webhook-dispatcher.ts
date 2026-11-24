import { sql } from '../../supabase/db';
import crypto from 'node:crypto';

export type WebhookEventType = 
  | 'audit.completed'
  | 'audit.failed'
  | 'trap.detected'
  | 'repair.verified'
  | 'pr.opened';

export interface WebhookDispatchResult {
  webhookId: string;
  url: string;
  success: boolean;
  httpStatus?: number;
  attempts: number;
  error?: string;
  deliveredAt: string;
}

export interface WebhookDispatcherSummary {
  event: WebhookEventType;
  totalSubscribers: number;
  successfulDispatches: number;
  failedDispatches: number;
  results: WebhookDispatchResult[];
}

/**
 * Enterprise Webhook Dispatcher
 * Dispatches HMAC-SHA256 signed event notifications to active subscribers
 * stored in the Supabase Postgres webhooks table, updating delivery metrics.
 */
export class WebhookDispatcher {
  /**
   * Computes an HMAC-SHA256 signature for a payload
   */
  signPayload(payload: any, secret: string): string {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return `sha256=${crypto.createHmac('sha256', secret).update(str).digest('hex')}`;
  }

  /**
   * Validates an HMAC-SHA256 signature
   */
  verifyPayloadSignature(payload: any, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const expected = this.signPayload(payload, secret);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Dispatches an event payload to all matching active webhooks in Neon DB
   */
  async dispatchEvent(
    eventType: WebhookEventType,
    eventData: Record<string, any>,
    targetUserId?: string
  ): Promise<WebhookDispatcherSummary> {
    const timestamp = Date.now();
    const isoTimestamp = new Date(timestamp).toISOString();

    // 1. Query active webhooks from Neon Postgres
    let matchingHooks: Array<{
      id: string;
      user_id: string;
      url: string;
      secret: string;
      events: string[];
    }> = [];

    try {
      if (targetUserId) {
        matchingHooks = await sql`
          SELECT id, user_id, url, secret, events
          FROM webhooks
          WHERE active = TRUE 
            AND user_id = ${targetUserId}
            AND ${eventType} = ANY(events);
        `;
      } else {
        matchingHooks = await sql`
          SELECT id, user_id, url, secret, events
          FROM webhooks
          WHERE active = TRUE 
            AND ${eventType} = ANY(events);
        `;
      }
    } catch (err: any) {
      console.warn('[Webhook Dispatcher] Neon query note:', err.message);
    }

    const results: WebhookDispatchResult[] = [];

    // 2. Dispatch to each registered webhook endpoint
    for (const hook of matchingHooks) {
      const result = await this.deliverWithRetry(hook, eventType, eventData, timestamp);
      results.push(result);

      // 3. Update delivery stats in Neon
      try {
        await sql`
          UPDATE webhooks
          SET last_status = ${result.httpStatus || (result.success ? 200 : 500)},
              last_dispatched_at = NOW()
          WHERE id = ${hook.id};
        `;
      } catch {}
    }

    const successfulDispatches = results.filter(r => r.success).length;

    return {
      event: eventType,
      totalSubscribers: matchingHooks.length,
      successfulDispatches,
      failedDispatches: results.length - successfulDispatches,
      results
    };
  }

  /**
   * Direct delivery with exponential backoff retry (up to 3 attempts)
   */
  async deliverWithRetry(
    hook: { id: string; url: string; secret: string },
    eventType: WebhookEventType,
    data: Record<string, any>,
    timestamp: number
  ): Promise<WebhookDispatchResult> {
    const payload = {
      id: crypto.randomUUID(),
      event: eventType,
      timestamp,
      data
    };

    const payloadString = JSON.stringify(payload);
    const signature = `sha256=${crypto.createHmac('sha256', hook.secret || 'default-secret').update(payloadString).digest('hex')}`;

    // Format body based on webhook receiver type
    let outgoingBody = payloadString;
    if (hook.url.includes('slack.com') || hook.url.includes('hooks.slack.com')) {
      outgoingBody = JSON.stringify({
        text: `🛡️ *BarrierLens Alert:* \`${eventType}\``,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `🛡️ BarrierLens: ${eventType}` }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Target URL:* ${data.targetUrl || 'N/A'}\n*Status:* \`${data.status || 'completed'}\`\n*Effort Ratio:* \`${data.effortRatio || 1.0}x\`\n*Findings Count:* *${data.findingsCount || data.totalFindings || 0}*`
            }
          }
        ]
      });
    } else if (hook.url.includes('discord.com/api/webhooks')) {
      outgoingBody = JSON.stringify({
        username: 'BarrierLens Bot',
        content: `🛡️ **BarrierLens Event:** \`${eventType}\``,
        embeds: [
          {
            title: `Audit Event: ${eventType}`,
            color: eventType === 'trap.detected' ? 0xFF3B30 : 0x0071E3,
            fields: [
              { name: 'Target URL', value: data.targetUrl || 'N/A', inline: false },
              { name: 'Findings', value: String(data.findingsCount || data.totalFindings || 0), inline: true },
              { name: 'Effort Ratio', value: `${data.effortRatio || 1.0}x`, inline: true }
            ],
            timestamp: new Date(timestamp).toISOString()
          }
        ]
      });
    }

    let attempts = 0;
    let lastError: string | undefined;
    let lastStatus: number | undefined;

    while (attempts < 3) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(hook.url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BarrierLens-Webhook-Dispatcher/2.6.0',
            'X-BarrierLens-Event': eventType,
            'X-BarrierLens-Timestamp': String(timestamp),
            'X-BarrierLens-Signature': signature
          },
          body: outgoingBody
        });
        clearTimeout(timeout);
        lastStatus = res.status;

        if (res.ok) {
          return {
            webhookId: hook.id,
            url: hook.url,
            success: true,
            httpStatus: res.status,
            attempts,
            deliveredAt: new Date().toISOString()
          };
        } else {
          lastError = `HTTP ${res.status} ${res.statusText}`;
        }
      } catch (err: any) {
        lastError = err.message || 'Fetch failed';
      }

      // Exponential backoff delay
      if (attempts < 3) {
        await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempts - 1)));
      }
    }

    return {
      webhookId: hook.id,
      url: hook.url,
      success: false,
      httpStatus: lastStatus,
      attempts,
      error: lastError,
      deliveredAt: new Date().toISOString()
    };
  }
}
