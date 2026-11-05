import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { resolvePublicTargetUrl, requestOriginFrom } from '@/lib/barrierlens/security/target-policy';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const isSample = !session?.user || userId === 'sample_user';

    let sites = await sql`
      SELECT id, user_id, name, origin, environment, verification_token, verified_at, created_at, updated_at
      FROM websites
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    // If user has no sites or is in sample mode, provide reliable initial sample properties
    if (sites.length === 0 && isSample) {
      return NextResponse.json({
        websites: [
          {
            id: 'site_sample_prod_01',
            name: 'BarrierLens Production Showcase',
            origin: 'https://barrierlens-seven.vercel.app',
            environment: 'production',
            verified: true,
            verificationMethod: 'dns_txt',
            verificationToken: 'barrierlens-site-verification=bl_v1_showcase_prod',
            pagesDiscovered: 15,
            lastAudited: '10 minutes ago',
            status: 'healthy',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'site_sample_benchmark_02',
            name: 'WCAG Benchmark Suite',
            origin: 'https://barrierlens-seven.vercel.app/benchmark',
            environment: 'staging',
            verified: true,
            verificationMethod: 'meta_tag',
            verificationToken: 'barrierlens-site-verification=bl_v1_benchmark_stg',
            pagesDiscovered: 6,
            lastAudited: '45 minutes ago',
            status: 'needs_review',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          }
        ],
        isSample: true
      });
    }

    const formatted = sites.map((s: any) => ({
      id: s.id,
      name: s.name,
      origin: s.origin,
      environment: s.environment,
      verified: !!s.verified_at,
      verificationMethod: 'dns_txt',
      verificationToken: s.verification_token,
      pagesDiscovered: 1,
      lastAudited: 'Recently added',
      status: s.verified_at ? 'healthy' : 'unverified',
      createdAt: s.created_at,
    }));

    return NextResponse.json({ websites: formatted, isSample: false });
  } catch (err: any) {
    console.error('[Websites API] Error fetching websites:', err);
    return NextResponse.json({ error: err.message || 'Failed to list websites' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const body = await req.json().catch(() => ({}));
    const { name, origin, environment = 'production' } = body;

    if (!origin) {
      return NextResponse.json({ error: 'Origin URL is required' }, { status: 400 });
    }

    const reqOrigin = requestOriginFrom(req);
    const validatedOrigin = await resolvePublicTargetUrl(origin, reqOrigin);
    const parsed = new URL(validatedOrigin);
    const siteName = name?.trim() || parsed.hostname;

    const verificationToken = `barrierlens-site-verification=bl_v1_${crypto.randomBytes(12).toString('hex')}`;

    const [created] = await sql`
      INSERT INTO websites (user_id, name, origin, environment, verification_token)
      VALUES (${userId}, ${siteName}, ${parsed.origin}, ${environment}, ${verificationToken})
      RETURNING id, user_id, name, origin, environment, verification_token, verified_at, created_at, updated_at
    `;

    return NextResponse.json({
      success: true,
      website: {
        id: created.id,
        name: created.name,
        origin: created.origin,
        environment: created.environment,
        verified: !!created.verified_at,
        verificationMethod: 'dns_txt',
        verificationToken: created.verification_token,
        pagesDiscovered: 1,
        lastAudited: 'Never',
        status: 'unverified',
        createdAt: created.created_at,
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('[Websites API] Error creating website:', err);
    return NextResponse.json({ error: err.message || 'Failed to register website' }, { status: 400 });
  }
}
