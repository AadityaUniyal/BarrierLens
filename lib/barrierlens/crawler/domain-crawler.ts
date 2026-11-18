export type RouteArchetype = 
  | 'landing'
  | 'auth'
  | 'catalog'
  | 'detail'
  | 'cart_checkout'
  | 'account_settings'
  | 'docs_support'
  | 'utility';

export interface DiscoveredRoute {
  url: string;
  path: string;
  title?: string;
  archetype: RouteArchetype;
  depth: number;
  statusCode?: number;
}

export interface DiscoveredDomainProfile {
  origin: string;
  domain: string;
  totalRoutesDiscovered: number;
  routes: DiscoveredRoute[];
  archetypes: Record<RouteArchetype, DiscoveredRoute[]>;
  primaryNavLinks: string[];
  hasSitemap: boolean;
  discoveredAt: string;
}

/**
 * Autonomous Domain Crawler
 * Explores website topologies via sitemap.xml and fast HTTP HTML link discovery.
 * Classifies pages into semantic archetypes without heavy browser overhead.
 */
export class DomainCrawler {
  private visitedUrls = new Set<string>();

  /**
   * Classify a URL path or full URL into an interaction archetype
   */
  classifyArchetype(pathOrUrl: string): RouteArchetype {
    let cleanPath = pathOrUrl;
    try {
      if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
        cleanPath = new URL(pathOrUrl).pathname;
      }
    } catch {}

    const p = cleanPath.toLowerCase().replace(/\/$/, '') || '/';

    if (p === '/' || p === '/home' || p === '/index' || p === '/index.html') {
      return 'landing';
    }
    if (/^\/(login|signin|sign-in|signup|sign-up|register|auth|forgot-password|reset-password)/.test(p)) {
      return 'auth';
    }
    if (/^\/(cart|checkout|basket|bag|pay|payment|order-review)/.test(p)) {
      return 'cart_checkout';
    }
    if (/^\/(products|shop|catalog|categories|collection|store|search|browse|explore|pricing|features)/.test(p)) {
      return 'catalog';
    }
    if (/^\/(product|item|p|goods|article|post|blog)/.test(p)) {
      return 'detail';
    }
    if (/^\/(account|profile|settings|dashboard|orders|preferences|admin)/.test(p)) {
      return 'account_settings';
    }
    if (/^\/(docs|documentation|help|faq|support|contact|about|privacy|terms|legal)/.test(p)) {
      return 'docs_support';
    }

    return 'utility';
  }

  /**
   * Extracts links from an HTML string
   */
  extractLinks(html: string, baseOrigin: string): string[] {
    const links: Set<string> = new Set();
    const hrefRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(html)) !== null) {
      const rawHref = match[1].trim();
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        continue;
      }

      try {
        const resolved = new URL(rawHref, baseOrigin);
        if (resolved.origin === baseOrigin) {
          // Normalize: remove query strings and hashes for archetype clustering
          const cleanPath = resolved.pathname;
          links.add(`${baseOrigin}${cleanPath}`);
        }
      } catch {}
    }

    return Array.from(links);
  }

  /**
   * Attempts to parse sitemap.xml
   */
  async fetchSitemapUrls(origin: string): Promise<string[]> {
    const urls: Set<string> = new Set();
    const sitemapEndpoints = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`
    ];

    for (const endpoint of sitemapEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(endpoint, {
          signal: controller.signal,
          headers: { 'User-Agent': 'BarrierLens-Domain-Crawler/1.0 (+https://barrierlens.ai)' }
        });
        clearTimeout(timeout);

        if (res.ok) {
          const xml = await res.text();
          const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/gi;
          let match: RegExpExecArray | null;
          while ((match = locRegex.exec(xml)) !== null) {
            try {
              const u = new URL(match[1].trim());
              if (u.origin === origin) {
                urls.add(`${origin}${u.pathname}`);
              }
            } catch {}
          }
          if (urls.size > 0) break;
        }
      } catch {}
    }

    return Array.from(urls);
  }

  /**
   * Autonomous crawl and archetype profiling
   */
  async crawlDomain(entryUrl: string, maxRoutes: number = 30): Promise<DiscoveredDomainProfile> {
    this.visitedUrls.clear();

    let parsedOrigin = '';
    let domainName = '';
    try {
      const u = new URL(entryUrl);
      parsedOrigin = u.origin;
      domainName = u.hostname;
    } catch {
      throw new Error(`Invalid entry URL: ${entryUrl}`);
    }

    const archetypes: Record<RouteArchetype, DiscoveredRoute[]> = {
      landing: [],
      auth: [],
      catalog: [],
      detail: [],
      cart_checkout: [],
      account_settings: [],
      docs_support: [],
      utility: []
    };

    const routes: DiscoveredRoute[] = [];
    const queue: Array<{ url: string; depth: number }> = [{ url: parsedOrigin, depth: 0 }];
    const primaryNavLinks: Set<string> = new Set();

    // 1. Try sitemap first
    const sitemapUrls = await this.fetchSitemapUrls(parsedOrigin);
    const hasSitemap = sitemapUrls.length > 0;
    for (const sUrl of sitemapUrls.slice(0, maxRoutes)) {
      if (!this.visitedUrls.has(sUrl)) {
        queue.push({ url: sUrl, depth: 1 });
      }
    }

    // 2. Breadth-First Route Exploration
    while (queue.length > 0 && routes.length < maxRoutes) {
      const item = queue.shift()!;
      if (this.visitedUrls.has(item.url)) continue;
      this.visitedUrls.add(item.url);

      const path = new URL(item.url).pathname;
      const archetype = this.classifyArchetype(path);

      let title = path;
      let statusCode = 200;

      // Fetch HTML for landing and top routes to extract outbound links
      if (item.depth <= 2 && routes.length < maxRoutes) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(item.url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'BarrierLens-Domain-Crawler/1.0 (+https://barrierlens.ai)' }
          });
          clearTimeout(timeout);
          statusCode = res.status;

          if (res.ok) {
            const html = await res.text();
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) title = titleMatch[1].trim();

            const extracted = this.extractLinks(html, parsedOrigin);
            for (const link of extracted) {
              if (item.depth === 0) primaryNavLinks.add(link);
              if (!this.visitedUrls.has(link) && queue.length < maxRoutes * 2) {
                queue.push({ url: link, depth: item.depth + 1 });
              }
            }
          }
        } catch {
          // Graceful fallback for unreachable pages during crawl
          statusCode = 0;
        }
      }

      const discovered: DiscoveredRoute = {
        url: item.url,
        path,
        title,
        archetype,
        depth: item.depth,
        statusCode
      };

      routes.push(discovered);
      archetypes[archetype].push(discovered);
    }

    // Ensure landing page is explicitly categorized if present
    if (archetypes.landing.length === 0) {
      const rootRoute: DiscoveredRoute = {
        url: parsedOrigin,
        path: '/',
        title: 'Home Page',
        archetype: 'landing',
        depth: 0,
        statusCode: 200
      };
      routes.unshift(rootRoute);
      archetypes.landing.push(rootRoute);
    }

    return {
      origin: parsedOrigin,
      domain: domainName,
      totalRoutesDiscovered: routes.length,
      routes,
      archetypes,
      primaryNavLinks: Array.from(primaryNavLinks).slice(0, 10),
      hasSitemap,
      discoveredAt: new Date().toISOString()
    };
  }
}
