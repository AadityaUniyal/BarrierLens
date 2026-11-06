import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="310" height="32" viewBox="0 0 310 32" fill="none">
  <defs>
    <linearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0071e3"/>
      <stop offset="100%" stop-color="#30d158"/>
    </linearGradient>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121215"/>
      <stop offset="100%" stop-color="#050507"/>
    </linearGradient>
  </defs>

  <!-- Outer Pill -->
  <rect x="0.5" y="0.5" width="309" height="31" rx="15.5" fill="url(#bgGradient)" stroke="rgba(255,255,255,0.12)"/>
  
  <!-- Left Brand Pill -->
  <rect x="3" y="3" width="94" height="26" rx="13" fill="url(#appleGradient)" fill-opacity="0.15"/>
  <circle cx="14" cy="16" r="4" fill="#30d158"/>
  <text x="24" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="600" fill="#ffffff" letter-spacing="-0.2px">BarrierLens</text>

  <!-- Divider -->
  <line x1="104" y1="9" x2="104" y2="23" stroke="rgba(255,255,255,0.1)"/>

  <!-- Right Metric -->
  <text x="114" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="500" fill="#86868b">Self-Audit: </text>
  <text x="175" y="19" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="11" font-weight="700" fill="#30d158">100% Proven</text>
  <text x="254" y="19" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="10" font-weight="600" fill="#0071e3">WCAG 2.2</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
