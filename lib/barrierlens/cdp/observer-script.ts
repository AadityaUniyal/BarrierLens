/**
 * Client-side observer script injected by Playwright CDP
 * Captures real-time DOM mutations, accessibility attribute changes, aria-live announcements,
 * and focus movement with microsecond timestamps into a bounded 2,000-event ring buffer.
 */

export interface ObserverEvent {
  type: 'focusin' | 'focusout' | 'focus_loss' | 'mutation' | 'aria-live' | 'name_change';
  timestamp: number;
  isoTime: string;
  targetSelector?: string;
  targetTag?: string;
  targetId?: string;
  details?: Record<string, any>;
  payload?: Record<string, any>;
  target?: Record<string, any>;
}

export interface ActiveElementState {
  tagName: string;
  id: string;
  selector: string;
  isBody: boolean;
  role?: string | null;
  accessibleName: string;
  ariaLabel?: string | null;
  text?: string;
  backendNodeId?: number;
}

export interface ObserverFocusEvent {
  timestamp: number;
  isoTime?: string;
  type: 'focusin' | 'focusout';
  targetSelector?: string;
  targetTag?: string;
  targetId?: string;
  target: {
    selector: string;
    tagName: string;
    id: string;
    className: string;
    role: string | null;
    ariaLabel: string | null;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
      top?: number;
      left?: number;
      bottom?: number;
      right?: number;
    };
    backendNodeId?: number;
    activeElement?: {
      tagName: string;
      id: string;
      selector: string;
      isBody: boolean;
      backendNodeId?: number;
    } | null;
    text?: string;
    tabIndex?: number;
  };
  details?: Record<string, any>;
  payload?: Record<string, any>;
}

export interface ObserverMutationEvent {
  timestamp: number;
  isoTime?: string;
  type: 'mutation' | 'dom_added' | 'dom_removed' | 'text_change' | 'attr_change' | 'name_change';
  targetSelector: string;
  tagName: string;
  textSnippet?: string;
  text?: string;
  attributeName?: string;
  attributeValue?: string;
  oldValue?: string | null;
  newValue?: string | null;
  isLiveRegion: boolean;
  isLive?: boolean;
  rect?: { x: number; y: number; width: number; height: number };
  backendNodeId?: number;
  becameVisible?: boolean;
  nameChanged?: boolean;
  details?: Record<string, any>;
  payload?: Record<string, any>;
}

export interface ObserverAnnouncementEvent {
  timestamp: number;
  isoTime: string;
  type: 'live_region' | 'alert' | 'status';
  politeness: 'polite' | 'assertive';
  role: string | null;
  text: string;
  atomic: boolean;
  targetSelector: string;
  targetTag?: string;
  targetId?: string;
}

export interface BarrierLensObserverGlobal {
  flushEvents: () => ObserverEvent[];
  getEvents: () => ObserverEvent[];
  flushAnnouncements: () => ObserverAnnouncementEvent[];
  getAnnouncements: () => ObserverAnnouncementEvent[];
  getActiveElement?: () => ActiveElementState | null;
  clear: () => void;
  isInstalled: () => boolean;
  version: string;
}

declare global {
  interface Window {
    __barrierLensObserver?: BarrierLensObserverGlobal;
  }
}

export const INJECTED_OBSERVER_SCRIPT = `
(function() {
  if (window.__barrierLensObserver && window.__barrierLensObserver.isInstalled && window.__barrierLensObserver.isInstalled()) {
    return;
  }

  var MAX_EVENTS = 2000;
  var MAX_ANNOUNCEMENTS = 1000;

  function createRingBuffer(capacity) {
    var buffer = new Array(capacity);
    var head = 0;
    var count = 0;

    return {
      push: function(item) {
        buffer[head] = item;
        head = (head + 1) % capacity;
        if (count < capacity) {
          count++;
        }
      },
      toArray: function() {
        var items = new Array(count);
        var start = count < capacity ? 0 : head;
        for (var i = 0; i < count; i++) {
          items[i] = buffer[(start + i) % capacity];
        }
        return items;
      },
      clear: function() {
        for (var i = 0; i < capacity; i++) {
          buffer[i] = undefined;
        }
        head = 0;
        count = 0;
      },
      size: function() {
        return count;
      },
      capacity: function() {
        return capacity;
      }
    };
  }

  var eventsBuffer = createRingBuffer(MAX_EVENTS);
  var announcementsBuffer = createRingBuffer(MAX_ANNOUNCEMENTS);

  function getCssSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';
    if (el.id) {
      try {
        if (typeof CSS !== 'undefined' && CSS.escape) {
          return '#' + CSS.escape(el.id);
        }
        return '#' + el.id;
      } catch (e) {
        return '#' + el.id;
      }
    }
    var parts = [];
    var curr = el;
    while (curr && curr.nodeType === 1 && curr !== document.documentElement && parts.length < 5) {
      var part = curr.tagName.toLowerCase();
      if (curr.id) {
        try {
          part += '#' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(curr.id) : curr.id);
        } catch (e) {
          part += '#' + curr.id;
        }
        parts.unshift(part);
        break;
      }
      var className = typeof curr.className === 'string'
        ? curr.className.trim()
        : (curr.getAttribute ? (curr.getAttribute('class') || '').trim() : '');
      if (className) {
        var firstClass = className.split(/\\s+/)[0];
        if (firstClass && !/[^a-zA-Z0-9_-]/.test(firstClass)) {
          part += '.' + firstClass;
        }
      }
      var sibling = curr.previousElementSibling;
      var index = 1;
      while (sibling) {
        if (sibling.tagName === curr.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      if (index > 1) {
        part += ':nth-of-type(' + index + ')';
      }
      parts.unshift(part);
      curr = curr.parentElement;
    }
    return parts.join(' > ') || el.tagName.toLowerCase();
  }

  function getBoundingRect(el) {
    try {
      if (!el || typeof el.getBoundingClientRect !== 'function') {
        return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 };
      }
      var r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
        top: Math.round(r.top * 100) / 100,
        left: Math.round(r.left * 100) / 100,
        bottom: Math.round(r.bottom * 100) / 100,
        right: Math.round(r.right * 100) / 100
      };
    } catch (e) {
      return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 };
    }
  }

  function extractBackendNodeId(el) {
    if (!el || el.nodeType !== 1) return undefined;
    try {
      if (el.dataset && el.dataset.backendNodeId) {
        var parsed = parseInt(el.dataset.backendNodeId, 10);
        if (!isNaN(parsed)) return parsed;
      }
      if (el.hasAttribute && el.hasAttribute('data-backend-node-id')) {
        var parsedAttr = parseInt(el.getAttribute('data-backend-node-id'), 10);
        if (!isNaN(parsedAttr)) return parsedAttr;
      }
      if (typeof el.__backendNodeId === 'number') {
        return el.__backendNodeId;
      }
    } catch (e) {}
    return undefined;
  }

  function computeAccessibleName(el) {
    if (!el || el.nodeType !== 1) return '';
    try {
      if (el.getAttribute) {
        var labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
          var ids = labelledBy.trim().split(/\s+/);
          var parts = [];
          for (var i = 0; i < ids.length; i++) {
            var refEl = document.getElementById(ids[i]);
            if (refEl) {
              var refText = (refEl.innerText || refEl.textContent || '').trim();
              if (refText) parts.push(refText);
            }
          }
          if (parts.length > 0) return parts.join(' ');
        }
        var ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
        if (el.id && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
          var labelEl = null;
          try {
            labelEl = document.querySelector('label[for="' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(el.id) : el.id) + '"]');
          } catch (e) {}
          if (labelEl) {
            var labelText = (labelEl.innerText || labelEl.textContent || '').trim();
            if (labelText) return labelText;
          }
        }
        if (el.tagName === 'INPUT') {
          var itype = (el.type || '').toLowerCase();
          if (itype === 'submit' || itype === 'button' || itype === 'reset') {
            return (el.value || 'Submit').trim();
          }
          var ph = el.getAttribute('placeholder');
          if (ph && ph.trim()) return ph.trim();
        }
        var title = el.getAttribute('title');
        if (title && title.trim()) return title.trim();
      }
      var inner = (el.innerText || el.value || el.textContent || '').trim();
      return inner.slice(0, 100);
    } catch (e) {
      return '';
    }
  }

  var lastActiveState = null;

  function getActiveElementState() {
    try {
      var active = document.activeElement;
      if (!active || active === document.body || active === document.documentElement) {
        return {
          tagName: 'BODY',
          id: '',
          selector: 'body',
          isBody: true,
          role: null,
          accessibleName: '',
          ariaLabel: null,
          text: '',
          backendNodeId: undefined
        };
      }
      var name = computeAccessibleName(active);
      return {
        tagName: active.tagName,
        id: active.id || '',
        selector: getCssSelector(active),
        isBody: false,
        role: active.getAttribute ? active.getAttribute('role') : null,
        accessibleName: name,
        ariaLabel: active.getAttribute ? active.getAttribute('aria-label') : null,
        text: (active.innerText || active.value || active.textContent || '').trim().slice(0, 100),
        backendNodeId: extractBackendNodeId(active)
      };
    } catch (e) {
      return null;
    }
  }

  function isInteractiveElement(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName.toLowerCase();
    if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'a') return true;
    if (el.hasAttribute && el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1') return true;
    var role = el.getAttribute ? el.getAttribute('role') : null;
    if (role && ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem', 'combobox', 'textbox', 'switch'].indexOf(role) !== -1) return true;
    return false;
  }

  var liveRoles = {
    'alert': 'assertive',
    'status': 'polite',
    'log': 'polite',
    'timer': 'off',
    'marquee': 'off'
  };

  function isLiveElement(el) {
    if (!el || el.nodeType !== 1 || !el.getAttribute) return false;
    var live = el.getAttribute('aria-live');
    if (live && live !== 'off') return true;
    var role = el.getAttribute('role');
    if (role && liveRoles[role] && liveRoles[role] !== 'off') return true;
    return false;
  }

  function getLivePoliteness(el) {
    if (!el || el.nodeType !== 1 || !el.getAttribute) return 'polite';
    var live = el.getAttribute('aria-live');
    if (live && live !== 'off') return live;
    var role = el.getAttribute('role');
    if (role && liveRoles[role]) return liveRoles[role];
    return 'polite';
  }

  function getLiveRole(el) {
    if (!el || el.nodeType !== 1 || !el.getAttribute) return null;
    var role = el.getAttribute('role');
    if (role && liveRoles[role]) return role;
    var live = el.getAttribute('aria-live');
    if (live === 'assertive') return 'alert';
    if (live === 'polite') return 'status';
    return null;
  }

  function getLiveContainer(el) {
    if (!el || el.nodeType !== 1) return null;
    if (isLiveElement(el)) return el;
    if (el.closest) {
      return el.closest('[aria-live]:not([aria-live="off"]), [role="alert"], [role="status"], [role="log"]');
    }
    var curr = el.parentElement;
    while (curr && curr.nodeType === 1) {
      if (isLiveElement(curr)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  function recordEvent(type, targetEl, details) {
    var now = performance.now();
    var iso = new Date().toISOString();
    var selector = targetEl ? getCssSelector(targetEl) : '';
    var tag = targetEl && targetEl.tagName ? targetEl.tagName : '';
    var id = targetEl && targetEl.id ? targetEl.id : '';

    var event = {
      type: type,
      timestamp: now,
      isoTime: iso,
      targetSelector: selector,
      targetTag: tag,
      targetId: id,
      details: details || {},
      payload: details || {},
      target: details || {}
    };

    eventsBuffer.push(event);
    return event;
  }

  function recordFocusEvent(type, el) {
    if (!el || el.nodeType !== 1) return;
    var rect = getBoundingRect(el);
    var className = typeof el.className === 'string'
      ? el.className
      : (el.getAttribute ? (el.getAttribute('class') || '') : '');
    var text = (el.innerText || el.value || el.textContent || '').trim().slice(0, 100);
    var backendId = extractBackendNodeId(el);
    var activeState = getActiveElementState();
    if (type === 'focusin') {
      lastActiveState = activeState;
    }

    var details = {
      selector: getCssSelector(el),
      tagName: el.tagName,
      id: el.id || '',
      className: className,
      backendNodeId: backendId,
      rect: rect,
      activeElement: activeState,
      role: el.getAttribute ? el.getAttribute('role') : null,
      ariaRole: el.getAttribute ? el.getAttribute('role') : null,
      ariaLabel: el.getAttribute ? el.getAttribute('aria-label') : null,
      text: text,
      tabIndex: typeof el.tabIndex === 'number' ? el.tabIndex : undefined
    };

    recordEvent(type, el, details);
  }

  function recordAnnouncement(liveEl, text, politeness, role, trigger) {
    text = (text || '').trim();
    if (!text) return;

    // Check aria-busy suppression
    var isBusy = false;
    if (liveEl.getAttribute && liveEl.getAttribute('aria-busy') === 'true') {
      isBusy = true;
    } else if (liveEl.closest && liveEl.closest('[aria-busy="true"]')) {
      isBusy = true;
    } else {
      var p = liveEl.parentElement;
      while (p && p.nodeType === 1) {
        if (p.getAttribute && p.getAttribute('aria-busy') === 'true') {
          isBusy = true;
          break;
        }
        p = p.parentElement;
      }
    }
    if (isBusy) {
      // Suppress announcements while container is aria-busy="true"
      return;
    }

    var now = performance.now();
    var iso = new Date().toISOString();
    var selector = liveEl ? getCssSelector(liveEl) : '';
    var tag = liveEl && liveEl.tagName ? liveEl.tagName : '';
    var id = liveEl && liveEl.id ? liveEl.id : '';
    var atomic = liveEl && liveEl.getAttribute ? (liveEl.getAttribute('aria-atomic') === 'true') : false;
    var backendId = extractBackendNodeId(liveEl);

    var announcement = {
      timestamp: now,
      isoTime: iso,
      type: role === 'alert' ? 'alert' : (role === 'status' ? 'status' : 'live_region'),
      politeness: politeness || 'polite',
      role: role || null,
      text: text.slice(0, 500),
      atomic: atomic,
      targetSelector: selector,
      targetTag: tag,
      targetId: id
    };
    announcementsBuffer.push(announcement);

    recordEvent('aria-live', liveEl, {
      politeness: announcement.politeness,
      role: announcement.role,
      text: announcement.text,
      atomic: announcement.atomic,
      trigger: trigger || 'mutation',
      backendNodeId: backendId,
      selector: selector,
      tagName: tag,
      id: id
    });
  }

  // 1. Paired focusin / focusout capture with activeElement state and focus loss detection
  document.addEventListener('focusin', function(e) {
    try {
      recordFocusEvent('focusin', e.target);
    } catch (err) {}
  }, true);

  document.addEventListener('focusout', function(e) {
    try {
      recordFocusEvent('focusout', e.target);
      var blurredEl = e.target;
      setTimeout(function() {
        var active = document.activeElement;
        if (!active || active === document.body || active === document.documentElement) {
          recordEvent('focus_loss', document.body, {
            elementBefore: getCssSelector(blurredEl),
            elementAfter: 'body',
            tagBefore: blurredEl && blurredEl.tagName ? blurredEl.tagName.toLowerCase() : '',
            timestamp: performance.now(),
            proofExplanation: 'Focus lost to document.body following blur on ' + getCssSelector(blurredEl)
          });
        }
      }, 0);
    } catch (err) {}
  }, true);

  // 2. Comprehensive MutationObserver for DOM tree, accessibility attributes, and characterData
  var observerConfig = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'aria-live',
      'aria-hidden',
      'aria-expanded',
      'aria-invalid',
      'aria-atomic',
      'aria-busy',
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'title',
      'hidden',
      'class',
      'style',
      'role',
      'disabled',
      'tabindex'
    ],
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true
  };

  var mutationObserver = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      try {
        if (m.type === 'childList') {
          // Additions
          if (m.addedNodes && m.addedNodes.length > 0) {
            for (var a = 0; a < m.addedNodes.length; a++) {
              var node = m.addedNodes[a];
              if (node.nodeType === 1) { // ELEMENT_NODE
                var el = node;
                var liveContainer = getLiveContainer(el);
                var isLive = isLiveElement(el) || !!liveContainer;
                var text = (el.innerText || el.textContent || '').trim();
                var backendId = extractBackendNodeId(el);
                var rect = getBoundingRect(el);

                var details = {
                  mutationType: 'childList',
                  subType: 'dom_added',
                  tag: el.tagName,
                  tagName: el.tagName,
                  id: el.id || '',
                  selector: getCssSelector(el),
                  text: text.slice(0, 100),
                  textSnippet: text.slice(0, 100),
                  isLive: isLive,
                  isLiveRegion: isLive,
                  isInteractive: isInteractiveElement(el),
                  rect: rect,
                  backendNodeId: backendId,
                  addedNodesCount: m.addedNodes.length
                };

                // Track activeElement name update if addition is within active element
                if (document.activeElement && (el === document.activeElement || document.activeElement.contains(el))) {
                  var newActiveName = computeAccessibleName(document.activeElement);
                  if (lastActiveState && lastActiveState.accessibleName !== newActiveName) {
                    recordEvent('name_change', document.activeElement, {
                      subType: 'name_change',
                      previousName: lastActiveState.accessibleName,
                      newName: newActiveName,
                      selector: getCssSelector(document.activeElement),
                      tagName: document.activeElement.tagName
                    });
                    lastActiveState.accessibleName = newActiveName;
                  }
                }

                recordEvent('mutation', el, details);

                if (text.length > 0) {
                  if (isLiveElement(el)) {
                    recordAnnouncement(el, text, getLivePoliteness(el), getLiveRole(el), 'added_live_region');
                  } else if (liveContainer) {
                    var p = getLivePoliteness(liveContainer);
                    var r = getLiveRole(liveContainer);
                    var isAtomic = liveContainer.getAttribute && liveContainer.getAttribute('aria-atomic') === 'true';
                    var announcedText = isAtomic ? (liveContainer.innerText || liveContainer.textContent || '').trim() : text;
                    recordAnnouncement(liveContainer, announcedText, p, r, 'added_child_to_live');
                  } else if (el.querySelectorAll) {
                    var childLiveElements = el.querySelectorAll('[aria-live]:not([aria-live="off"]), [role="alert"], [role="status"], [role="log"]');
                    for (var cl = 0; cl < childLiveElements.length; cl++) {
                      var cle = childLiveElements[cl];
                      var clText = (cle.innerText || cle.textContent || '').trim();
                      if (clText.length > 0) {
                        recordAnnouncement(cle, clText, getLivePoliteness(cle), getLiveRole(cle), 'added_live_descendant');
                      }
                    }
                  }
                }
              }
            }
          }

          // Removals
          if (m.removedNodes && m.removedNodes.length > 0) {
            for (var r = 0; r < m.removedNodes.length; r++) {
              var rNode = m.removedNodes[r];
              if (rNode.nodeType === 1) {
                var rEl = rNode;
                var rText = (rEl.textContent || '').trim().slice(0, 100);
                recordEvent('mutation', m.target, {
                  mutationType: 'childList',
                  subType: 'dom_removed',
                  tag: rEl.tagName,
                  tagName: rEl.tagName,
                  id: rEl.id || '',
                  textSnippet: rText,
                  removedNodesCount: m.removedNodes.length
                });
              }
            }
          }
        } else if (m.type === 'attributes') {
          var attrName = m.attributeName;
          var targetEl = m.target;
          if (targetEl && targetEl.nodeType === 1) {
            var newVal = targetEl.getAttribute ? targetEl.getAttribute(attrName) : null;
            var oldVal = m.oldValue;
            var elText = (targetEl.innerText || targetEl.textContent || '').trim().slice(0, 100);
            var elRect = getBoundingRect(targetEl);
            var isLive = isLiveElement(targetEl) || !!getLiveContainer(targetEl);

            // Detect transition from hidden to visible
            var becameVisible = false;
            if (attrName === 'hidden' && oldVal !== null && newVal === null) {
              becameVisible = true;
            } else if (attrName === 'style') {
              var hadDisplayNone = oldVal && /display\s*:\s*none/i.test(oldVal);
              var hasDisplayNone = newVal && /display\s*:\s*none/i.test(newVal);
              if (hadDisplayNone && !hasDisplayNone) becameVisible = true;
            } else if (attrName === 'class') {
              var hadHiddenClass = oldVal && /\b(hidden|hide|d-none|invisible)\b/i.test(oldVal);
              var hasHiddenClass = newVal && /\b(hidden|hide|d-none|invisible)\b/i.test(newVal);
              if (hadHiddenClass && !hasHiddenClass) becameVisible = true;
            }

            var attrDetails = {
              mutationType: 'attributes',
              subType: 'attr_change',
              attributeName: attrName,
              oldValue: oldVal,
              newValue: newVal,
              tagName: targetEl.tagName,
              id: targetEl.id || '',
              selector: getCssSelector(targetEl),
              text: elText,
              elementText: elText,
              rect: elRect,
              isLive: isLive,
              isLiveRegion: isLive,
              becameVisible: becameVisible,
              backendNodeId: extractBackendNodeId(targetEl),
              isAccessibilityAttribute: true
            };

            // Detect activeElement accessible name change
            var isActive = document.activeElement && (targetEl === document.activeElement || document.activeElement.contains(targetEl));
            if (isActive) {
              attrDetails.isActiveElement = true;
              var curActiveName = computeAccessibleName(document.activeElement);
              if (lastActiveState && lastActiveState.accessibleName !== curActiveName) {
                attrDetails.nameChanged = true;
                attrDetails.previousActiveElementName = lastActiveState.accessibleName;
                attrDetails.currentActiveElementName = curActiveName;

                recordEvent('name_change', document.activeElement, {
                  subType: 'name_change',
                  previousName: lastActiveState.accessibleName,
                  newName: curActiveName,
                  selector: getCssSelector(document.activeElement),
                  tagName: document.activeElement.tagName
                });
                lastActiveState.accessibleName = curActiveName;
              }
            }

            recordEvent('mutation', targetEl, attrDetails);

            if (attrName === 'aria-live' || attrName === 'role' || (attrName === 'aria-hidden' && newVal !== 'true') || becameVisible) {
              if (isLiveElement(targetEl)) {
                var liveText = (targetEl.innerText || targetEl.textContent || '').trim();
                if (liveText.length > 0) {
                  recordAnnouncement(targetEl, liveText, getLivePoliteness(targetEl), getLiveRole(targetEl), 'attribute_change');
                }
              }
            }
          }
        } else if (m.type === 'characterData') {
          var textNode = m.target;
          var parentEl = textNode.parentElement;
          var newText = (textNode.textContent || '').trim();
          var oldText = m.oldValue;

          if (newText.length > 0 && newText !== (oldText ? oldText.trim() : '')) {
            var parentLive = parentEl ? (isLiveElement(parentEl) || !!getLiveContainer(parentEl)) : false;
            var textDetails = {
              mutationType: 'characterData',
              subType: 'text_change',
              oldValue: oldText,
              newValue: newText.slice(0, 100),
              text: newText.slice(0, 100),
              textSnippet: newText.slice(0, 100),
              parentTag: parentEl ? parentEl.tagName : '',
              parentSelector: parentEl ? getCssSelector(parentEl) : '',
              selector: parentEl ? getCssSelector(parentEl) : '',
              tag: parentEl ? parentEl.tagName : '',
              rect: parentEl ? getBoundingRect(parentEl) : { x: 0, y: 0, width: 0, height: 0 },
              isLive: parentLive,
              isLiveRegion: parentLive,
              backendNodeId: parentEl ? extractBackendNodeId(parentEl) : undefined
            };

            // Detect activeElement text update
            if (parentEl && document.activeElement && (parentEl === document.activeElement || document.activeElement.contains(parentEl))) {
              var newActiveName = computeAccessibleName(document.activeElement);
              if (lastActiveState && lastActiveState.accessibleName !== newActiveName) {
                textDetails.nameChanged = true;
                textDetails.previousActiveElementName = lastActiveState.accessibleName;
                textDetails.currentActiveElementName = newActiveName;

                recordEvent('name_change', document.activeElement, {
                  subType: 'name_change',
                  previousName: lastActiveState.accessibleName,
                  newName: newActiveName,
                  selector: getCssSelector(document.activeElement),
                  tagName: document.activeElement.tagName
                });
                lastActiveState.accessibleName = newActiveName;
              }
            }

            recordEvent('mutation', parentEl || document.body, textDetails);

            if (parentLive) {
              var liveEl = getLiveContainer(parentEl);
              if (liveEl) {
                var pLive = getLivePoliteness(liveEl);
                var rLive = getLiveRole(liveEl);
                var atomicLive = liveEl.getAttribute && liveEl.getAttribute('aria-atomic') === 'true';
                var announce = atomicLive ? (liveEl.innerText || liveEl.textContent || '').trim() : newText;
                recordAnnouncement(liveEl, announce, pLive, rLive, 'character_data');
              }
            }
          }
        }
      } catch (err) {}
    }
  });

  function attachObserver() {
    try {
      var root = document.documentElement || document.body || document;
      if (root) {
        mutationObserver.observe(root, observerConfig);
      }
    } catch (e) {
      try {
        mutationObserver.observe(document, observerConfig);
      } catch (e2) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
  }
  attachObserver();

  // 3. Export global interface with 2,000-event bounded ring buffer
  window.__barrierLensObserver = {
    flushEvents: function() {
      var items = eventsBuffer.toArray();
      eventsBuffer.clear();
      return items;
    },
    getEvents: function() {
      return eventsBuffer.toArray();
    },
    flushAnnouncements: function() {
      var items = announcementsBuffer.toArray();
      announcementsBuffer.clear();
      return items;
    },
    getAnnouncements: function() {
      return announcementsBuffer.toArray();
    },
    getActiveElement: function() {
      return getActiveElementState();
    },
    clear: function() {
      eventsBuffer.clear();
      announcementsBuffer.clear();
    },
    isInstalled: function() {
      return true;
    },
    version: '4.0.0'
  };
})();
`;

