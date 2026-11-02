import { CDPSession, Page } from 'playwright';

export interface CDPAXProperty {
  name: string;
  value: any;
}

export interface CDPDOMNodeInfo {
  nodeId: number;
  backendNodeId: number;
  nodeType: number;
  nodeName: string;
  localName: string;
  attributes: Record<string, string>;
  selector: string;
}

export interface CDPAXValueSource {
  type: string;
  value?: any;
  attribute?: string;
  attributeValue?: any;
  superseded?: boolean;
  nativeSource?: string;
  invalid?: boolean;
  invalidReason?: string;
}

export interface CDPAXNode {
  nodeId: string;
  backendDOMNodeId?: number;
  role: string;
  name?: string;
  nameSources?: CDPAXValueSource[];
  value?: string;
  description?: string;
  disabled: boolean;
  focusable: boolean;
  focused: boolean;
  childIds?: string[];
  parentId?: string;
  properties?: Record<string, any>;
  domNode?: CDPDOMNodeInfo;
  selector?: string;
  ignored?: boolean;
}

export interface CDPAXTreeResult {
  allNodes: CDPAXNode[];
  interactiveNodes: CDPAXNode[];
  backendNodeMap: Map<number, CDPAXNode>;
  rootNode?: CDPAXNode;
}

export interface CDPAXExtractorOptions {
  resolveDOM?: boolean;
  filterInteractiveOnly?: boolean;
}

/**
 * Converts CDP attributes array ['id', 'foo', 'class', 'bar'] into key-value map.
 */
export function parseCDPAttributes(attrArray?: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!attrArray || !Array.isArray(attrArray)) return result;
  for (let i = 0; i < attrArray.length; i += 2) {
    result[attrArray[i]] = attrArray[i + 1] ?? '';
  }
  return result;
}

/**
 * Derives a deterministic CSS selector from described DOM node information.
 */
export function deriveSelectorFromDOMNode(domNode: {
  nodeType?: number;
  nodeName?: string;
  localName?: string;
  attributes?: string[];
}): string {
  if (domNode.nodeType === 9 || domNode.nodeName === '#document') {
    return 'html';
  }
  const rawTag = domNode.localName || domNode.nodeName || 'div';
  const tagName = rawTag.startsWith('#') ? 'body' : rawTag.toLowerCase();
  const attrs = parseCDPAttributes(domNode.attributes);

  if (attrs.id) {
    if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(attrs.id)) {
      return `${tagName}#${attrs.id}`;
    }
    return `${tagName}[id="${attrs.id.replace(/"/g, '\\"')}"]`;
  }
  if (attrs.name) {
    return `${tagName}[name="${attrs.name.replace(/"/g, '\\"')}"]`;
  }
  if (tagName === 'option' && attrs.value !== undefined) {
    return `option[value="${attrs.value.replace(/"/g, '\\"')}"]`;
  }
  if (attrs['aria-label']) {
    return `${tagName}[aria-label="${attrs['aria-label'].replace(/"/g, '\\"')}"]`;
  }
  if (attrs.role) {
    return `${tagName}[role="${attrs.role.replace(/"/g, '\\"')}"]`;
  }
  if (attrs.class) {
    const classList = attrs.class.trim().split(/\s+/).filter(Boolean);
    if (classList.length > 0) {
      return `${tagName}.${classList.slice(0, 2).join('.')}`;
    }
  }
  return tagName;
}

export const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'textbox',
  'checkbox',
  'radio',
  'combobox',
  'listbox',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'searchbox',
  'switch',
  'tab',
  'slider',
  'spinbutton',
  'treeitem',
  'dialog',
  'alertdialog',
  'option'
]);

export function isInteractiveNode(axNode: CDPAXNode): boolean {
  if (axNode.ignored) {
    return false;
  }
  const role = axNode.role ? axNode.role.toLowerCase() : 'none';
  const isDocOrGeneric = ['rootwebarea', 'webarea', 'none', 'generic'].includes(role);
  if (isDocOrGeneric) {
    return false;
  }
  if (axNode.domNode && axNode.domNode.nodeType !== 1) {
    return false;
  }
  if (axNode.focusable) return true;
  if (INTERACTIVE_ROLES.has(role)) return true;
  if (axNode.domNode && ['button', 'input', 'select', 'textarea', 'a', 'option'].includes(axNode.domNode.localName)) {
    return true;
  }
  return false;
}

/**
 * Primary extractor: uses Chrome DevTools Protocol (CDP) Accessibility and DOM domains
 * to extract the full AX tree and map backendDOMNodeId to rendered DOM elements.
 */
export async function extractCDPAXTree(
  page: Page,
  options: CDPAXExtractorOptions = { resolveDOM: true, filterInteractiveOnly: false }
): Promise<CDPAXTreeResult> {
  const context = page.context();
  const client: CDPSession = await context.newCDPSession(page);

  try {
    // 1. Enable Accessibility and DOM domains
    await client.send('DOM.enable');
    await client.send('Accessibility.enable');

    // 2. Call Accessibility.getFullAXTree to extract the complete AX tree
    const { nodes } = (await client.send('Accessibility.getFullAXTree')) as { nodes: any[] };

    const allNodes: CDPAXNode[] = [];
    const interactiveNodes: CDPAXNode[] = [];
    const backendNodeMap = new Map<number, CDPAXNode>();

    for (const rawNode of nodes) {
      const properties: Record<string, any> = {};
      if (rawNode.properties && Array.isArray(rawNode.properties)) {
        for (const prop of rawNode.properties) {
          properties[prop.name] = prop.value?.value ?? prop.value;
        }
      }

      const role = String(rawNode.role?.value || 'none');
      const name = rawNode.name?.value !== undefined ? String(rawNode.name.value) : undefined;
      const nameSources = Array.isArray(rawNode.name?.sources) ? (rawNode.name.sources as CDPAXValueSource[]) : undefined;
      const value = rawNode.value?.value !== undefined ? String(rawNode.value.value) : undefined;
      const description = rawNode.description?.value !== undefined ? String(rawNode.description.value) : undefined;
      const disabled = Boolean(properties.disabled);
      const focusable = Boolean(properties.focusable);
      const focused = Boolean(properties.focused);

      const axNode: CDPAXNode = {
        nodeId: rawNode.nodeId,
        backendDOMNodeId: typeof rawNode.backendDOMNodeId === 'number' ? rawNode.backendDOMNodeId : undefined,
        role,
        name,
        nameSources,
        value,
        description,
        disabled,
        focusable,
        focused,
        childIds: rawNode.childIds,
        parentId: rawNode.parentId,
        properties,
        ignored: Boolean(rawNode.ignored)
      };

      allNodes.push(axNode);

      if (axNode.backendDOMNodeId) {
        backendNodeMap.set(axNode.backendDOMNodeId, axNode);
      }
    }

    // 3. Resolve / describe node via DOM.describeNode({ backendNodeId }) in batches of 25
    if (options.resolveDOM !== false) {
      let nodesWithBackendId = allNodes.filter(
        (n): n is CDPAXNode & { backendDOMNodeId: number } => typeof n.backendDOMNodeId === 'number'
      );

      if (options.filterInteractiveOnly === true) {
        nodesWithBackendId = nodesWithBackendId.filter((n) => isInteractiveNode(n));
      }

      const CHUNK_SIZE = 25;
      for (let i = 0; i < nodesWithBackendId.length; i += CHUNK_SIZE) {
        const chunk = nodesWithBackendId.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (axNode) => {
            try {
              const domRes = (await client.send('DOM.describeNode', {
                backendNodeId: axNode.backendDOMNodeId
              })) as { node: any };

              if (domRes?.node) {
                const attrMap = parseCDPAttributes(domRes.node.attributes);
                const selector = deriveSelectorFromDOMNode(domRes.node);

                axNode.domNode = {
                  nodeId: domRes.node.nodeId,
                  backendNodeId: domRes.node.backendNodeId,
                  nodeType: domRes.node.nodeType,
                  nodeName: domRes.node.nodeName,
                  localName: domRes.node.localName || domRes.node.nodeName.toLowerCase(),
                  attributes: attrMap,
                  selector
                };
                axNode.selector = selector;
              }
            } catch {
              // Some pseudo-elements or detached nodes cannot be described by DOM domain
            }
          })
        );
      }
    }

    // 4. Identify interactive nodes
    for (const axNode of allNodes) {
      if (isInteractiveNode(axNode)) {
        interactiveNodes.push(axNode);
      }
    }

    const rootNode = allNodes.find((n) => n.role === 'RootWebArea') || allNodes[0];

    return {
      allNodes,
      interactiveNodes,
      backendNodeMap,
      rootNode
    };
  } finally {
    try {
      await client.detach();
    } catch {
      // Session may already be closed if page navigated
    }
  }
}

/**
 * Converts CDP interactive nodes to a compact text summary for LLM prompt consumption
 */
export function formatCDPAXTreeForLLM(nodes: CDPAXNode[]): string {
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const states: string[] = [];
    if (node.focusable) states.push('focusable');
    if (node.disabled) states.push('disabled');
    if (node.focused) states.push('focused');
    if (node.value) states.push(`val="${node.value}"`);
    if (node.backendDOMNodeId) states.push(`backendId=${node.backendDOMNodeId}`);

    const stateStr = states.length > 0 ? ` (${states.join(', ')})` : '';
    const nameStr = node.name ? ` "${node.name.replace(/\n+/g, ' ').trim()}"` : ' [unnamed]';
    const selectorStr = node.selector ? ` [${node.selector}]` : '';

    lines.push(`[${i + 1}] <${node.role}>${selectorStr}${nameStr}${stateStr}`);
  }

  return lines.join('\n');
}
