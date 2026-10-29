/**
 * Client-side observer script injected by Playwright CDP
 * Captures real-time DOM mutations, aria-live announcements, and focus movement.
 */
export const INJECTED_OBSERVER_SCRIPT = `
(function() {
  if (window.__barrierLensObserver) return;

  const events = [];
  const announcements = [];

  function record(type, payload) {
    events.push({
      timestamp: performance.now(),
      type,
      payload
    });
  }

  // 1. Focusin / Focusout listener
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    record('focusin', {
      tag: el.tagName,
      id: el.id,
      className: el.className,
      text: (el.innerText || el.value || '').slice(0, 50),
      rect: el.getBoundingClientRect(),
      ariaRole: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label')
    });
  }, true);

  // 2. MutationObserver for visual DOM text / visibility changes
  const mutationObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            const live = el.getAttribute('aria-live') || el.closest('[aria-live]')?.getAttribute('aria-live');
            const text = (el.innerText || '').trim();
            if (text.length > 0) {
              if (live) {
                announcements.push({
                  timestamp: performance.now(),
                  type: 'live_region',
                  politeness: live,
                  text: text.slice(0, 200)
                });
              }
              record('dom_added', {
                tag: el.tagName,
                text: text.slice(0, 100),
                isLive: !!live
              });
            }
          }
        });
      } else if (m.type === 'characterData') {
        const text = m.target.textContent || '';
        if (text.trim().length > 0) {
          record('text_change', {
            text: text.trim().slice(0, 100)
          });
        }
      }
    }
  });

  mutationObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Export buffer interface
  window.__barrierLensObserver = {
    getEvents: () => [...events],
    getAnnouncements: () => [...announcements],
    clear: () => {
      events.length = 0;
      announcements.length = 0;
    }
  };
})();
`;
