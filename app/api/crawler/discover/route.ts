import { NextRequest, NextResponse } from 'next/server';
import { DomainCrawler } from '@/lib/barrierlens/crawler/domain-crawler';
import { CUJSynthesizer } from '@/lib/barrierlens/crawler/cuj-synthesizer';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyApiKey } from '@/lib/barrierlens/security/public-audit';
import { resolvePublicTargetUrl, requestOriginFrom } from '@/lib/barrierlens/security/target-policy';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const workerSecret = process.env.WORKER_SECRET;
    const isWorkerCall = workerSecret && authHeader === `Bearer ${workerSecret}`;

    let authenticatedUserId: string | null = null;

    if (isWorkerCall) {
      authenticatedUserId = 'system_worker';
    } else {
      // Check BetterAuth session
      const session = await auth.api.getSession({
        headers: await headers(),
      }).catch(() => null);

      if (session?.user?.id) {
        authenticatedUserId = session.user.id;
      } else {
        // Check API key
        const apiKeyAuth = await verifyApiKey(req).catch(() => null);
        if (apiKeyAuth?.userId) {
          authenticatedUserId = apiKeyAuth.userId;
        }
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Authentication required to initiate autonomous domain discovery' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const domainUrl = body.domainUrl || body.url || body.targetUrl;

    if (!domainUrl) {
      return NextResponse.json({ error: 'Domain or URL is required' }, { status: 400 });
    }

    let safeDomainUrl: string;
    try {
      safeDomainUrl = await resolvePublicTargetUrl(domainUrl, requestOriginFrom(req));
    } catch (policyErr: any) {
      return NextResponse.json(
        { error: policyErr.message || 'Invalid or untrusted target domain' },
        { status: 400 }
      );
    }

    const maxRoutes = Math.min(50, Math.max(5, parseInt(body.maxRoutes || '25')));
    const autoSaveToNeon = body.autoSaveToNeon !== false;
    const userId = authenticatedUserId;

    console.log(`[Crawler API] Starting autonomous domain discovery for: ${safeDomainUrl} (user: ${userId})`);

    // 1. Crawl domain routes & archetypes
    const crawler = new DomainCrawler();
    const profile = await crawler.crawlDomain(safeDomainUrl, maxRoutes);

    // 2. Synthesize Critical User Journeys (CUJs)
    const synthesizer = new CUJSynthesizer();
    const journeys = synthesizer.synthesizeJourneys(profile);

    // 3. Persist to Neon Postgres if requested
    let bundle = null;
    if (autoSaveToNeon) {
      bundle = await synthesizer.persistToNeon(profile, journeys, userId);
    }

    return NextResponse.json({
      success: true,
      domain: profile.domain,
      origin: profile.origin,
      totalRoutesDiscovered: profile.totalRoutesDiscovered,
      hasSitemap: profile.hasSitemap,
      primaryNavLinks: profile.primaryNavLinks,
      archetypesBreakdown: {
        landing: profile.archetypes.landing.length,
        catalog: profile.archetypes.catalog.length,
        detail: profile.archetypes.detail.length,
        cart_checkout: profile.archetypes.cart_checkout.length,
        auth: profile.archetypes.auth.length,
        account_settings: profile.archetypes.account_settings.length,
        docs_support: profile.archetypes.docs_support.length,
        utility: profile.archetypes.utility.length,
      },
      websiteId: bundle?.websiteId,
      journeysCount: journeys.length,
      journeys,
    });
  } catch (err: any) {
    console.error('[Crawler API] Discovery failed:', err);
    return NextResponse.json({ error: err.message || 'Domain discovery failed' }, { status: 500 });
  }
}
