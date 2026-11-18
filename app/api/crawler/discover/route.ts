import { NextRequest, NextResponse } from 'next/server';
import { DomainCrawler } from '@/lib/barrierlens/crawler/domain-crawler';
import { CUJSynthesizer } from '@/lib/barrierlens/crawler/cuj-synthesizer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const domainUrl = body.domainUrl || body.url || body.targetUrl;

    if (!domainUrl) {
      return NextResponse.json({ error: 'Domain or URL is required' }, { status: 400 });
    }

    const maxRoutes = Math.min(50, Math.max(5, parseInt(body.maxRoutes || '25')));
    const autoSaveToNeon = body.autoSaveToNeon !== false;
    const userId = body.userId || 'usr_autonomous_system';

    console.log(`[Crawler API] Starting autonomous domain discovery for: ${domainUrl}`);

    // 1. Crawl domain routes & archetypes
    const crawler = new DomainCrawler();
    const profile = await crawler.crawlDomain(domainUrl, maxRoutes);

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
