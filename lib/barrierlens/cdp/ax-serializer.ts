export interface SerializedAXNode {
  index: number;
  selector: string;
  role: string;
  name: string;
  value?: string;
  focusable: boolean;
  disabled: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

/**
 * Compact AX-Tree Serializer:
 * Extracts only interactive controls, form fields, and landmarks from the page DOM/AX tree.
 * Produces a high-density, low-token representation for Groq & Gemini LLMs.
 */
export function serializeAXTree(nodes: SerializedAXNode[]): string {
  const lines: string[] = [];

  for (const node of nodes) {
    const states: string[] = [];
    if (node.focusable) states.push('focusable');
    if (node.disabled) states.push('disabled');
    if (node.value) states.push(`val="${node.value}"`);

    const stateStr = states.length > 0 ? ` (${states.join(', ')})` : '';
    const nameStr = node.name ? ` "${node.name.replace(/\n+/g, ' ').trim()}"` : ' [unnamed]';

    lines.push(`[${node.index}] ${node.role}${nameStr}${stateStr}`);
  }

  return lines.join('\n');
}

/**
 * Browser-evaluable extraction script to capture all interactive elements with geometry and computed names.
 */
export const EXTRACT_AX_NODES_SCRIPT = `
(() => {
  const interactiveSelectors = [
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="combobox"]',
    '[role="dialog"]',
    '[role="menuitem"]'
  ];

  const elements = Array.from(document.querySelectorAll(interactiveSelectors.join(',')))
    .filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
    });

  return elements.map((el, index) => {
    const rect = el.getBoundingClientRect();
    
    // Compute accessible name heuristic
    let name = el.getAttribute('aria-label') || '';
    if (!name && el.getAttribute('aria-labelledby')) {
      const labelId = el.getAttribute('aria-labelledby');
      const labelEl = document.getElementById(labelId);
      if (labelEl) name = labelEl.innerText;
    }
    if (!name) {
      if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
        name = el.value;
      } else if (el.placeholder) {
        name = el.placeholder;
      } else {
        name = (el.innerText || el.textContent || '').trim();
      }
    }

    const role = el.getAttribute('role') || el.tagName.toLowerCase();
    const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

    // Unique selector path
    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector += '#' + el.id;
    } else if (el.className && typeof el.className === 'string') {
      const firstClass = el.className.split(' ')[0];
      if (firstClass) selector += '.' + firstClass;
    }

    return {
      index: index + 1,
      selector,
      role,
      name: name.slice(0, 80),
      value: (el.value || '').slice(0, 50),
      focusable: el.tabIndex >= 0 || ['button', 'input', 'select', 'textarea', 'a'].includes(el.tagName.toLowerCase()),
      disabled,
      boundingBox: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    };
  });
})()
`;
