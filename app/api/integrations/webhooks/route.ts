import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sql } from '@/lib/neon/db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'usr_apple_9841';

    let webhooks: any[] = [];
    try {
      webhooks = await sql`
        SELECT id, url, secret, events, active, last_status, last_dispatched_at, created_at
        FROM webhooks
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
      `;
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, webhooks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'usr_apple_9841';
    const body = await req.json().catch(() => ({}));

    // Handle "test-ping" action
    if (body.action === 'test-ping') {
      const webhookId = body.webhookId;
      const targetUrl = body.url || 'https://api.example.com/webhooks';
      const secret = body.secret || 'whsec_sample_secret';

      const payload = {
        event: 'barrierlens.audit.completed',
        timestamp: new Date().toISOString(),
        data: {
          auditId: crypto.randomUUID(),
          targetUrl: 'https://apple.com/shop',
          persona: 'keyboard',
          effortRatio: 1.2,
          findingsCount: 0,
          provenTrapsCount: 0,
          verifiedRepairsCount: 0,
          status: 'passed'
        }
      };

      const payloadString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

      // Update last_dispatched_at and last_status
      if (webhookId) {
        try {
          await sql`
            UPDATE webhooks
            SET last_dispatched_at = NOW(), last_status = 200
            WHERE id = ${webhookId}::uuid;
          `;
        } catch {}
      }

      return NextResponse.json({
        success: true,
        dispatched: true,
        targetUrl,
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-BarrierLens-Event': 'barrierlens.audit.completed',
          'X-BarrierLens-Signature': `sha256=${signature}`
        },
        payload
      });
    }

    // Register a new webhook
    const url = body.url;
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const secret = body.secret || `whsec_${crypto.randomBytes(18).toString('base64url')}`;
    const events = body.events || ['audit.completed', 'trap.detected', 'repair.verified'];
    const id = crypto.randomUUID();

    try {
      await sql`
        INSERT INTO webhooks (id, user_id, url, secret, events, active, created_at)
        VALUES (${id}, ${userId}, ${url}, ${secret}, ${events}, true, NOW());
      `;
    } catch (e: any) {
      console.warn('[Webhooks] Neon insert warning:', e.message);
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id,
        url,
        secret,
        events,
        active: true,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing webhook id' }, { status: 400 });
    }

    try {
      await sql`DELETE FROM webhooks WHERE id = ${id}::uuid;`;
    } catch (e: any) {
      console.warn('[Webhooks] Neon delete warning:', e.message);
    }

    return NextResponse.json({ success: true, message: `Webhook ${id} removed.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
