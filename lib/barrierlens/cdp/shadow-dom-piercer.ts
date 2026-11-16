/**
 * BarrierLens Deep Shadow DOM & iFrame Piercer
 * 
 * Traverses nested shadow roots (Lit, Stencil, LWC, Web Components)
 * and child iframes (payment forms, authentication modals, embeds)
 * to extract interactive nodes with transparent pierced selector syntax (>>>).
 */

import { Page, Frame } from 'playwright';
import { SerializedAXNode } from './ax-serializer';

export interface PiercedElementInfo {
  selector: string;
  role: string;
  name: string;
  value?: string;
  focusable: boolean;
  disabled: boolean;
  boundingBox: { x: number; y: number; width: number; height: number };
  isShadowRootChild: boolean;
  isIFrameChild: boolean;
  hostSelector?: string;
  frameUrl?: string;
}

export class DeepShadowDOMPiercer {
  /**
   * Recursively traverses all shadow roots and iframes in the page
   * to uncover deeply nested interactive controls.
   */
  async extractPiercedInteractiveNodes(page: Page): Promise<PiercedElementInfo[]> {
    const results: PiercedElementInfo[] = [];

    // 1. Extract shadow root nodes from the main frame
    try {
      const shadowNodes = await page.evaluate(`(() => {
        const discovered = [];

        const getAccessibleName = (el) => {
          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel) return ariaLabel.trim();
          const labelledBy = el.getAttribute('aria-labelledby');
          if (labelledBy) {
            const labelEl = document.getElementById(labelledBy);
            if (labelEl) return (labelEl.textContent || '').trim();
          }
          if (el.placeholder) return el.placeholder;
          if (el.title) return el.title;
          return (el.innerText || el.textContent || '').trim().slice(0, 80);
        };

        const getElementSelector = (el, prefix = '') => {
          const tag = el.tagName.toLowerCase();
          let base = tag;
          if (el.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(el.id)) {
            base = tag + '#' + el.id;
          } else if (el.getAttribute('name')) {
            base = tag + '[name="' + el.getAttribute('name') + '"]';
          } else if (el.classList.length > 0) {
            base = tag + '.' + Array.from(el.classList).slice(0, 2).join('.');
          }
          return prefix ? (prefix + ' >>> ' + base) : base;
        };

        const isInteractive = (el) => {
          const tag = el.tagName.toLowerCase();
          if (['button', 'a', 'input', 'select', 'textarea'].includes(tag)) return true;
          const role = (el.getAttribute('role') || '').toLowerCase();
          if (['button', 'link', 'checkbox', 'radio', 'combobox', 'tab', 'menuitem', 'switch', 'searchbox'].includes(role)) return true;
          const tabIndex = el.getAttribute('tabindex');
          if (tabIndex !== null && parseInt(tabIndex, 10) >= 0) return true;
          return false;
        };

        const traverseTree = (root, hostPath = '') => {
          try {
            const elements = root.querySelectorAll('*');
            for (const el of Array.from(elements)) {
              if (el.shadowRoot) {
                const currentHostSelector = getElementSelector(el, hostPath);
                traverseTree(el.shadowRoot, currentHostSelector);
              }

              if (hostPath && isInteractive(el)) {
                let r = { x: 0, y: 0, width: 0, height: 0 };
                try {
                  const rect = el.getBoundingClientRect();
                  r = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
                } catch {}

                let isHidden = false;
                try {
                  const style = window.getComputedStyle(el);
                  isHidden = style.display === 'none' || style.visibility === 'hidden';
                } catch {}

                if (!isHidden) {
                  discovered.push({
                    selector: getElementSelector(el, hostPath),
                    role: el.getAttribute('role') || el.tagName.toLowerCase(),
                    name: getAccessibleName(el),
                    value: el.value || undefined,
                    focusable: el.tabIndex !== undefined && el.tabIndex >= 0,
                    disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
                    boundingBox: r,
                    isShadowRootChild: true,
                    isIFrameChild: false,
                    hostSelector: hostPath
                  });
                }
              }
            }
          } catch {}
        };

        traverseTree(document);
        return discovered;
      })()`);

      results.push(...shadowNodes);
    } catch (evalErr) {
      console.error('[DeepShadowDOMPiercer] Main frame shadow evaluation error:', evalErr);
    }

    // 2. Extract interactive controls from child iframes
    try {
      const frames = page.frames().filter(f => f !== page.mainFrame());
      for (const frame of frames) {
        try {
          const frameUrl = frame.url();
          const frameName = frame.name();
          const frameHostSelector = frameName ? `iframe[name="${frameName}"]` : `iframe[src*="${frameUrl.slice(0, 30)}"]`;

          const frameNodes = await frame.evaluate((hostSel) => {
            const discovered: any[] = [];
            const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])');

            for (const el of Array.from(interactiveElements) as HTMLElement[]) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) {
                const tag = el.tagName.toLowerCase();
                let sel = tag;
                if (el.id) sel = `${tag}#${el.id}`;
                else if (el.getAttribute('name')) sel = `${tag}[name="${el.getAttribute('name')}"]`;

                discovered.push({
                  selector: `${hostSel} >>> ${sel}`,
                  role: el.getAttribute('role') || tag,
                  name: el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 50),
                  value: (el as HTMLInputElement).value || undefined,
                  focusable: el.tabIndex >= 0,
                  disabled: (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true',
                  boundingBox: {
                    x: Math.round(r.x),
                    y: Math.round(r.y),
                    width: Math.round(r.width),
                    height: Math.round(r.height)
                  },
                  isShadowRootChild: false,
                  isIFrameChild: true,
                  hostSelector: hostSel,
                  frameUrl: window.location.href
                });
              }
            }
            return discovered;
          }, frameHostSelector);

          results.push(...frameNodes);
        } catch {
          // Cross-origin frames may restrict direct script evaluation without CDP Target domain
        }
      }
    } catch {
      // Non-blocking
    }

    return results;
  }

  /**
   * Converts PiercedElementInfo into standard SerializedAXNode format
   */
  toSerializedAXNodes(piercedNodes: PiercedElementInfo[], startIndex: number = 100): SerializedAXNode[] {
    return piercedNodes.map((n, idx) => ({
      index: startIndex + idx,
      selector: n.selector,
      role: n.role,
      name: n.name,
      value: n.value,
      focusable: n.focusable,
      disabled: n.disabled,
      boundingBox: n.boundingBox
    }));
  }
}
