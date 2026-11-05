import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { resolvePublicTargetUrl, requestOriginFrom } from '@/lib/barrierlens/security/target-policy';

export const dynamic = 'force-dynamic';

export interface JourneyStep {
  id: string;
  order: number;
  type: 'navigate' | 'click' | 'enter_text' | 'select_option' | 'wait_state' | 'assert_text' | 'assert_url' | 'human_checkpoint';
  selector?: string;
  value?: string;
  expectedOutcome: string;
  timeoutMs?: number;
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const isSample = !session?.user || userId === 'sample_user';

    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('website_id');

    let rows;
    if (websiteId) {
      rows = await sql`
        SELECT j.id, j.website_id, j.user_id, j.name, j.description, j.starting_url, j.steps, j.criticality, j.version, j.created_at, j.updated_at,
               w.name as website_name, w.origin as website_origin
        FROM journeys j
        LEFT JOIN websites w ON j.website_id = w.id
        WHERE j.website_id = ${websiteId} AND (j.user_id = ${userId} OR ${userId} = 'sample_user')
        ORDER BY j.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT j.id, j.website_id, j.user_id, j.name, j.description, j.starting_url, j.steps, j.criticality, j.version, j.created_at, j.updated_at,
               w.name as website_name, w.origin as website_origin
        FROM journeys j
        LEFT JOIN websites w ON j.website_id = w.id
        WHERE j.user_id = ${userId} OR ${userId} = 'sample_user'
        ORDER BY j.created_at DESC
      `;
    }

    if (rows.length === 0 && isSample) {
      // Default sample journeys
      return NextResponse.json({
        journeys: [
          {
            id: 'journey_sample_checkout_01',
            website_id: websiteId || 'site_sample_prod_01',
            name: 'Keyboard Accessible Checkout Flow',
            description: 'Navigate product catalog, add item to bag, open cart drawer, complete shipping form via tab navigation.',
            starting_url: 'https://barrierlens-seven.vercel.app/benchmark',
            criticality: 'critical',
            version: 1,
            steps: [
              {
                id: 'step_1',
                order: 1,
                type: 'navigate',
                value: 'https://barrierlens-seven.vercel.app/benchmark',
                expectedOutcome: 'Landed on test benchmark catalog.'
              },
              {
                id: 'step_2',
                order: 2,
                type: 'click',
                selector: 'button#open-modal-btn',
                expectedOutcome: 'Modal dialog appears with focus trapped inside.'
              },
              {
                id: 'step_3',
                order: 3,
                type: 'assert_text',
                selector: 'h3',
                value: 'Modal Dialog',
                expectedOutcome: 'Modal heading announces to assistive technology.'
              },
              {
                id: 'step_4',
                order: 4,
                type: 'click',
                selector: 'button#close-modal-btn',
                expectedOutcome: 'Modal dismisses and focus safely returns to trigger.'
              }
            ],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'journey_sample_onboarding_02',
            website_id: websiteId || 'site_sample_prod_01',
            name: 'Passkey & Form Registration Journey',
            description: 'Verify screen reader announcements for email inputs, role attributes, and biometric prompt states.',
            starting_url: 'https://barrierlens-seven.vercel.app',
            criticality: 'high',
            version: 1,
            steps: [
              {
                id: 'step_1',
                order: 1,
                type: 'navigate',
                value: 'https://barrierlens-seven.vercel.app',
                expectedOutcome: 'Main landing page loaded.'
              },
              {
                id: 'step_2',
                order: 2,
                type: 'click',
                selector: 'button#auth-cta',
                expectedOutcome: 'Authentication sheet opened with passkey focus.'
              }
            ],
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          }
        ],
        isSample: true
      });
    }

    return NextResponse.json({
      journeys: rows.map((r: any) => ({
        id: r.id,
        website_id: r.website_id,
        website_name: r.website_name,
        website_origin: r.website_origin,
        name: r.name,
        description: r.description,
        starting_url: r.starting_url,
        steps: r.steps,
        criticality: r.criticality,
        version: r.version,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      })),
      isSample: false
    });
  } catch (err: any) {
    console.error('[Journeys API] Error fetching journeys:', err);
    return NextResponse.json({ error: err.message || 'Failed to list journeys' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const body = await req.json().catch(() => ({}));
    const { website_id, name, description, starting_url, steps = [], criticality = 'high' } = body;

    if (!name || !starting_url) {
      return NextResponse.json({ error: 'Name and starting_url are required.' }, { status: 400 });
    }

    const reqOrigin = requestOriginFrom(req);
    const validatedStartingUrl = await resolvePublicTargetUrl(starting_url, reqOrigin);

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'At least one step must be defined for a journey.' }, { status: 400 });
    }

    // Validate and normalize steps
    const normalizedSteps = steps.map((s: any, idx: number) => ({
      id: s.id || `step_${idx + 1}`,
      order: idx + 1,
      type: ['navigate', 'click', 'enter_text', 'select_option', 'wait_state', 'assert_text', 'assert_url', 'human_checkpoint'].includes(s.type)
        ? s.type
        : 'click',
      selector: s.selector?.trim() || undefined,
      value: s.value?.trim() || undefined,
      expectedOutcome: s.expectedOutcome?.trim() || `Execute ${s.type || 'step'}`,
      timeoutMs: typeof s.timeoutMs === 'number' ? s.timeoutMs : 5000,
    }));

    const [created] = await sql`
      INSERT INTO journeys (website_id, user_id, name, description, starting_url, steps, criticality)
      VALUES (${website_id || null}, ${userId}, ${name.trim()}, ${description?.trim() || null}, ${validatedStartingUrl}, ${JSON.stringify(normalizedSteps)}::jsonb, ${criticality})
      RETURNING id, website_id, user_id, name, description, starting_url, steps, criticality, version, created_at, updated_at
    `;

    return NextResponse.json({
      success: true,
      journey: created
    }, { status: 201 });
  } catch (err: any) {
    console.error('[Journeys API] Error creating journey:', err);
    return NextResponse.json({ error: err.message || 'Failed to create journey' }, { status: 400 });
  }
}
