import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'js';

  if (!siteId) {
    return NextResponse.json({ error: 'Site ID or Domain required' }, { status: 400 });
  }

  // 1. Fetch verified causal certificates from Neon Postgres
  let verifiedPatches: Array<{
    findingId: string;
    wcagRule: string;
    targetSelector: string;
    action: string;
    patch: string;
  }> = [];

  try {
    const rows = await sql`
      SELECT finding_id, wcag_rule, intervention_target, intervention_action, ast_patch
      FROM causal_certificates
      WHERE (
        target_url ILIKE ${'%' + siteId + '%'} OR 
        finding_id ILIKE ${'%' + siteId + '%'}
      ) AND verification_status = 'verified'
      LIMIT 50;
    `;

    if (rows && rows.length > 0) {
      verifiedPatches = rows.map((r: any) => ({
        findingId: r.finding_id,
        wcagRule: r.wcag_rule,
        targetSelector: r.intervention_target,
        action: r.intervention_action,
        patch: r.ast_patch
      }));
    }
  } catch (err: any) {
    console.warn('[Edge Healer API] Neon lookup notice (falling back to baseline self-healing):', err.message);
  }

  // 2. If JSON format is requested, return metadata
  if (format === 'json') {
    return NextResponse.json({
      siteId,
      status: 'active',
      patchesCount: verifiedPatches.length,
      patches: verifiedPatches,
      timestamp: new Date().toISOString()
    });
  }

  // 3. Generate high-performance, zero-dependency self-executing JavaScript runtime (<4KB)
  const scriptContent = `/**
 * BarrierLens Autonomous Self-Healing Edge Runtime
 * Target Site / Domain: ${siteId}
 * Active Verified Patches: ${verifiedPatches.length}
 * Generated: ${new Date().toISOString()}
 */
(function() {
  if (window.__BARRIERLENS_HEALER_ACTIVE__) return;
  window.__BARRIERLENS_HEALER_ACTIVE__ = true;

  console.info('[BarrierLens] Autonomous accessibility self-healing active.');

  var PATCHES = ${JSON.stringify(verifiedPatches)};

  // 1. Universal Live Region Announcer for Silent State Changes
  var liveRegion = document.getElementById('barrierlens-live-announcer');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'barrierlens-live-announcer';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.margin = '-1px';
    liveRegion.style.padding = '0';
    liveRegion.style.overflow = 'hidden';
    liveRegion.style.clip = 'rect(0, 0, 0, 0)';
    liveRegion.style.border = '0';
    liveRegion.style.whiteSpace = 'nowrap';
    document.body ? document.body.appendChild(liveRegion) : document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(liveRegion);
    });
  }

  function announce(text) {
    try {
      if (!liveRegion || !text) return;
      liveRegion.textContent = '';
      setTimeout(function() { liveRegion.textContent = text; }, 50);
    } catch(e) {}
  }

  // 2. Universal Keyboard Trap & Modal Esc Key Containment
  window.addEventListener('keydown', function(e) {
    try {
      if (e.key === 'Escape' || e.key === 'Esc') {
        var activeModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"]), dialog[open], .modal.is-active, .modal.show, [data-modal][open]');
        if (activeModal) {
          var closeBtn = activeModal.querySelector('button.close, [data-dismiss="modal"], [aria-label*="close" i], [aria-label*="dismiss" i]');
          if (closeBtn && typeof closeBtn.click === 'function') {
            closeBtn.click();
            announce('Dialog closed via Escape key.');
          } else if (typeof activeModal.close === 'function') {
            activeModal.close();
            announce('Dialog closed via Escape key.');
          }
        }
      }
    } catch(err) {
      console.warn('[BarrierLens] Esc handler note:', err);
    }
  }, true);

  // 3. Dynamic Remediation Engine
  function applyRemediations() {
    try {
      // A. Apply Verified Database Patches
      for (var i = 0; i < PATCHES.length; i++) {
        var p = PATCHES[i];
        if (!p.targetSelector) continue;
        var nodes = document.querySelectorAll(p.targetSelector);
        for (var j = 0; j < nodes.length; j++) {
          var el = nodes[j];
          if (el.dataset.blHealed) continue;
          el.dataset.blHealed = 'true';

          if (p.wcagRule.indexOf('4.1.2') !== -1 || p.action.indexOf('Name') !== -1) {
            if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
              var inferredName = el.title || el.placeholder || el.innerText.trim() || 'Interactive Control';
              el.setAttribute('aria-label', inferredName);
            }
          }
        }
      }

      // B. Universal Empty Accessible Name Fallbacks for Icon-Only Buttons
      var unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby]), a[role="button"]:not([aria-label])');
      for (var k = 0; k < unlabeledButtons.length; k++) {
        var btn = unlabeledButtons[k];
        if (btn.dataset.blNameHealed) continue;
        var text = btn.innerText ? btn.innerText.trim() : '';
        if (!text) {
          var svg = btn.querySelector('svg');
          var iconClass = btn.className || (svg ? svg.className : '');
          var label = 'Interactive Action';
          if (typeof iconClass === 'string') {
            if (iconClass.indexOf('close') !== -1 || iconClass.indexOf('dismiss') !== -1) label = 'Close dialog';
            else if (iconClass.indexOf('search') !== -1) label = 'Search';
            else if (iconClass.indexOf('menu') !== -1) label = 'Toggle navigation menu';
            else if (iconClass.indexOf('cart') !== -1) label = 'Shopping cart';
            else if (iconClass.indexOf('user') !== -1 || iconClass.indexOf('account') !== -1) label = 'User account';
          }
          btn.setAttribute('aria-label', label);
          btn.dataset.blNameHealed = 'true';
        }
      }
    } catch(err) {
      console.warn('[BarrierLens] Remediation cycle note:', err);
    }
  }

  // 4. MutationObserver for Single-Page Application (SPA) Dynamic Nodes
  if (typeof MutationObserver !== 'undefined') {
    var debounceTimer = null;
    var observer = new MutationObserver(function() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyRemediations, 80);
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, attributes: false });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true, attributes: false });
      });
    }
  }

  // Initial execution pass
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRemediations);
  } else {
    applyRemediations();
  }
})();
`;

  return new NextResponse(scriptContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
