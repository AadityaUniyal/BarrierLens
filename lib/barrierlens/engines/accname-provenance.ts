import {
  AccNameResult,
  ProvenanceStep,
  AccNameCDPComparison,
  AccNameDiagnostic,
  DiagnosticCode,
  ComparisonStatus,
  AccNameEvaluation,
  AccNameTraversalSource,
  AccNameProvenanceStep
} from '../types';

export {
  type AccNameResult,
  type ProvenanceStep,
  type AccNameCDPComparison,
  type AccNameDiagnostic,
  type DiagnosticCode,
  type ComparisonStatus,
  type AccNameEvaluation,
  type AccNameTraversalSource,
  type AccNameProvenanceStep
};

export interface AccNameComputationOptions {
  isRoot?: boolean;
  traversalSource?: AccNameTraversalSource;
  visitedIds?: Set<string>;
  visitedNodes?: Set<any>;
  documentRoot?: any;
  elementSelector?: string;
  role?: string;
}

// ---------------------------------------------------------------------------
// Virtual DOM Abstraction for Node.js / Headless Testing & Real Browser DOM
// ---------------------------------------------------------------------------

export interface AnyDOMNode {
  nodeType: number; // 1 = Element, 3 = Text
  nodeName: string;
  tagName?: string;
  nodeValue?: string | null;
  textContent?: string | null;
  id?: string;
  className?: string;
  attributes?: Record<string, string>;
  childNodes: AnyDOMNode[];
  children?: AnyDOMNode[];
  parentElement?: AnyDOMNode | null;
  parentNode?: AnyDOMNode | null;
  getAttribute?(name: string): string | null;
  hasAttribute?(name: string): boolean;
  closest?(selector: string): AnyDOMNode | null;
  querySelector?(selector: string): AnyDOMNode | null;
  querySelectorAll?(selector: string): AnyDOMNode[];
  getElementById?(id: string): AnyDOMNode | null;
  style?: Record<string, string> | CSSStyleDeclaration;
}

export class VirtualElement implements AnyDOMNode {
  nodeType: number = 1;
  nodeName: string;
  tagName: string;
  id: string = '';
  className: string = '';
  attributes: Record<string, string> = {};
  childNodes: AnyDOMNode[] = [];
  parentElement: AnyDOMNode | null = null;
  parentNode: AnyDOMNode | null = null;
  style: Record<string, string> = {};

  constructor(tagName: string, attributes: Record<string, string> = {}) {
    this.tagName = tagName.toLowerCase();
    this.nodeName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    if (this.attributes['id']) {
      this.id = this.attributes['id'];
    }
    if (this.attributes['class']) {
      this.className = this.attributes['class'];
    }
    if (this.attributes['style']) {
      this.parseStyleString(this.attributes['style']);
    }
  }

  private parseStyleString(styleStr: string) {
    const parts = styleStr.split(';');
    for (const part of parts) {
      const idx = part.indexOf(':');
      if (idx > 0) {
        const prop = part.slice(0, idx).trim().toLowerCase();
        const val = part.slice(idx + 1).trim();
        if (prop && val) {
          this.style[prop] = val;
        }
      }
    }
  }

  get children(): AnyDOMNode[] {
    return this.childNodes.filter(n => n.nodeType === 1);
  }

  get textContent(): string {
    return this.childNodes.map(n => n.textContent || '').join('');
  }

  getAttribute(name: string): string | null {
    const lower = name.toLowerCase();
    return this.attributes[lower] !== undefined ? this.attributes[lower] : null;
  }

  hasAttribute(name: string): boolean {
    return this.attributes[name.toLowerCase()] !== undefined;
  }

  appendChild(child: AnyDOMNode): AnyDOMNode {
    child.parentElement = this;
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  closest(selector: string): AnyDOMNode | null {
    let curr: AnyDOMNode | null = this;
    while (curr) {
      if (curr.nodeType === 1 && matchesSelector(curr, selector)) {
        return curr;
      }
      curr = curr.parentElement || null;
    }
    return null;
  }

  querySelector(selector: string): VirtualElement | null {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector: string): VirtualElement[] {
    const matches: VirtualElement[] = [];
    const recurse = (node: AnyDOMNode) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (matchesSelector(child, selector)) {
            matches.push(child as VirtualElement);
          }
          recurse(child);
        }
      }
    };
    recurse(this);
    return matches;
  }

  getElementById(id: string): AnyDOMNode | null {
    let found: AnyDOMNode | null = null;
    const recurse = (node: AnyDOMNode) => {
      if (found) return;
      if (node.nodeType === 1 && (node.getAttribute?.('id') === id || node.id === id)) {
        found = node;
        return;
      }
      for (const child of node.childNodes) {
        recurse(child);
      }
    };
    // Search from root
    let root: AnyDOMNode = this;
    while (root.parentElement) {
      root = root.parentElement;
    }
    recurse(root);
    return found;
  }
}

export class VirtualTextNode implements AnyDOMNode {
  nodeType: number = 3;
  nodeName: string = '#text';
  nodeValue: string;
  childNodes: AnyDOMNode[] = [];
  parentElement: AnyDOMNode | null = null;
  parentNode: AnyDOMNode | null = null;

  constructor(text: string) {
    this.nodeValue = text;
  }

  get textContent(): string {
    return this.nodeValue;
  }
}

function matchesSelector(node: AnyDOMNode, selector: string): boolean {
  if (node.nodeType !== 1) return false;
  const sel = selector.trim();

  // Tag selector (e.g. 'label', 'svg', 'title')
  if (/^[a-zA-Z0-9_-]+$/.test(sel)) {
    const tagName = (node.tagName || node.nodeName || '').toLowerCase();
    return tagName === sel.toLowerCase();
  }

  // ID selector (e.g. '#my-id')
  if (sel.startsWith('#')) {
    const targetId = sel.slice(1);
    const idVal = node.getAttribute ? node.getAttribute('id') : (node as any).id;
    return idVal === targetId;
  }

  // Class selector (e.g. '.my-class')
  if (sel.startsWith('.')) {
    const targetClass = sel.slice(1);
    const classVal = (node.getAttribute ? node.getAttribute('class') : (node as any).className) || '';
    return classVal.split(/\s+/).includes(targetClass);
  }

  // Attribute selector (e.g. '[for="my-id"]', 'label[for="my-id"]', '[type="button"]')
  const attrMatch = sel.match(/^([a-zA-Z0-9_-]*)\[([a-zA-Z0-9_-]+)(?:=(["][^"]*["]|['][^']*[']|[^\]]*))?\]$/);
  if (attrMatch) {
    const [, tag, attrName, rawExpectedVal] = attrMatch;
    if (tag) {
      const nodeTag = (node.tagName || node.nodeName || '').toLowerCase();
      if (nodeTag !== tag.toLowerCase()) return false;
    }
    if (!node.hasAttribute?.(attrName)) return false;
    if (rawExpectedVal !== undefined) {
      const expectedVal = rawExpectedVal.replace(/^["']|["']$/g, '');
      const actualVal = node.getAttribute?.(attrName);
      return actualVal === expectedVal;
    }
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// HTML String to Virtual DOM Parser
// ---------------------------------------------------------------------------

export function parseHTMLToVirtualDOM(html: string): VirtualElement {
  const trimmed = html.trim();
  const root = new VirtualElement('root');

  const tagRegex = /<\/?([a-zA-Z0-9_-]+)((?:\s+[a-zA-Z0-9_:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  const selfClosingTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  let currentParent: VirtualElement = root;
  const stack: VirtualElement[] = [root];

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(trimmed)) !== null) {
    const [fullMatch, tagName, rawAttrs, selfCloseSlash, textContent] = match;

    if (textContent !== undefined && textContent.length > 0) {
      const textNode = new VirtualTextNode(textContent);
      currentParent.appendChild(textNode);
      continue;
    }

    if (!tagName) continue;

    const isClosing = fullMatch.startsWith('</');
    const lowerTag = tagName.toLowerCase();

    if (isClosing) {
      if (stack.length > 1) {
        stack.pop();
        currentParent = stack[stack.length - 1];
      }
    } else {
      const attributes = parseAttributes(rawAttrs || '');
      const elem = new VirtualElement(lowerTag, attributes);
      currentParent.appendChild(elem);

      const isSelfClosing = selfCloseSlash === '/' || selfClosingTags.has(lowerTag);
      if (!isSelfClosing) {
        stack.push(elem);
        currentParent = elem;
      }
    }
  }

  const firstElem = root.children[0] as VirtualElement;
  return firstElem || root;
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const [, name, val1, val2, val3] = match;
    const val = val1 !== undefined ? val1 : val2 !== undefined ? val2 : val3 !== undefined ? val3 : '';
    attrs[name.toLowerCase()] = val;
  }
  return attrs;
}

// ---------------------------------------------------------------------------
// W3C Accessible Name & Provenance Engine Core
// ---------------------------------------------------------------------------

const ROLES_ALLOWING_NAME_FROM_CONTENTS = new Set([
  'button',
  'link',
  'checkbox',
  'radio',
  'tab',
  'heading',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'switch',
  'treeitem',
  'option',
  'columnheader',
  'rowheader',
  'cell',
  'gridcell',
  'tooltip'
]);

const GENERIC_NON_DESCRIPTIVE_NAMES = new Set([
  'click here',
  'click',
  'here',
  'more',
  'read more',
  'learn more',
  'link',
  'button',
  'btn',
  'icon',
  'img',
  'image',
  'photo',
  'picture',
  'details',
  'go',
  'submit',
  'item',
  'show more'
]);

export class AccNameProvenanceEngine {
  /**
   * Primary entry point: computes accessible name, step-by-step provenance trace,
   * and attaches rich diagnostic findings.
   */
  computeAccessibleName(
    target: AnyDOMNode | string,
    options: AccNameComputationOptions = {}
  ): AccNameResult {
    let node: AnyDOMNode;
    if (typeof target === 'string') {
      node = parseHTMLToVirtualDOM(target);
    } else {
      node = target;
    }

    const steps: ProvenanceStep[] = [];
    const diagnostics: string[] = [];
    const detailedDiagnostics: AccNameDiagnostic[] = [];
    const visitedIds = options.visitedIds ? new Set(options.visitedIds) : new Set<string>();
    const visitedNodes = options.visitedNodes ? new Set(options.visitedNodes) : new Set<any>();

    const rawResult = this.computeStepRecursive(node, {
      ...options,
      isRoot: true,
      traversalSource: options.traversalSource || 'direct',
      visitedIds,
      visitedNodes,
      documentRoot: options.documentRoot || node
    }, steps, diagnostics);

    // Step 2G: Whitespace normalization
    const normalized = this.normalizeWhitespace(rawResult.name);
    steps.push({
      step: '2G',
      description: 'Whitespace normalization',
      matched: true,
      yieldedText: normalized,
      candidateSource: rawResult.name,
      status: 'matched',
      explanation: `Normalized whitespace runs to single spaces and trimmed ends: "${normalized}".`
    });

    // Determine winning source
    const winningSource = rawResult.source || (normalized.length > 0 ? 'contents' : 'none');

    // Run 10 diagnostics for poor/empty names
    this.runDiagnostics(node, normalized, winningSource, steps, diagnostics, detailedDiagnostics, options);

    const isPoorOrEmpty = normalized.length === 0 || detailedDiagnostics.some(d => d.severity === 'critical' || d.severity === 'high');
    const remediationAdvice = this.buildRemediationAdvice(detailedDiagnostics, normalized);

    return {
      name: normalized,
      source: winningSource,
      steps,
      diagnostics: Array.from(new Set(diagnostics)),
      isPoorOrEmpty,
      remediationAdvice,
      detailedDiagnostics,
      elementSelector: options.elementSelector || this.inferSelector(node),
      role: options.role || this.inferRole(node)
    };
  }

  /**
   * Alias for computeAccessibleName.
   */
  evaluate(target: AnyDOMNode | string, options: AccNameComputationOptions = {}): AccNameResult {
    return this.computeAccessibleName(target, options);
  }

  /**
   * Backward-compatible evaluation method matching existing BarrierLens signature.
   */
  evaluateName(
    selector: string,
    role: string,
    name: string,
    innerHtmlSnippet: string = ''
  ): AccNameEvaluation {
    const targetHtml = innerHtmlSnippet || `<${role} id="target" role="${role}">${name || ''}</${role}>`;
    const result = this.computeAccessibleName(targetHtml, {
      elementSelector: selector,
      role
    });

    let reason: 'missing_label' | 'non_descriptive_placeholder' | 'unlabeled_icon' | 'good' = 'good';
    if (!result.name) {
      const isIcon = innerHtmlSnippet.includes('<svg') || innerHtmlSnippet.includes('<i');
      reason = isIcon ? 'unlabeled_icon' : 'missing_label';
    } else if (GENERIC_NON_DESCRIPTIVE_NAMES.has(result.name.toLowerCase())) {
      reason = 'non_descriptive_placeholder';
    }

    const isAdequate = !result.isPoorOrEmpty && reason === 'good';
    const provenanceExplanation = result.steps
      .filter(s => s.matched)
      .map(s => `${s.step}: ${s.description}${s.yieldedText ? ` -> "${s.yieldedText}"` : ''}`)
      .join(' | ') || (isAdequate ? `Accessible name computed successfully: "${result.name}".` : (result.remediationAdvice || 'Accessible name is poor or empty.'));

    const provenanceTree: AccNameProvenanceStep[] = result.steps.map(s => {
      let stepName: '2A' | '2B' | '2C' | '2D' | '2E' | '2F' | '2I' = '2F';
      if (s.step.startsWith('2A')) stepName = '2A';
      else if (s.step.startsWith('2B')) stepName = '2B';
      else if (s.step.startsWith('2C')) stepName = '2C';
      else if (s.step.startsWith('2D')) stepName = '2D';
      else if (s.step.startsWith('2E')) stepName = '2E';
      else if (s.step.startsWith('2F')) stepName = '2F';
      else if (s.step.startsWith('2I')) stepName = '2I';

      let sourceKind: 'aria-labelledby' | 'aria-label' | 'native-markup' | 'subtree-contents' | 'title' | 'hidden-check' = 'subtree-contents';
      if (s.source === 'aria-labelledby') sourceKind = 'aria-labelledby';
      else if (s.source === 'aria-label') sourceKind = 'aria-label';
      else if (s.source === 'native-label') sourceKind = 'native-markup';
      else if (s.source === 'contents') sourceKind = 'subtree-contents';
      else if (s.source === 'title') sourceKind = 'title';
      else if (s.step.startsWith('2A')) sourceKind = 'hidden-check';

      return {
        step: stepName,
        source: sourceKind,
        candidateText: s.yieldedText || s.candidateSource,
        evaluated: s.status !== 'skipped',
        success: s.matched,
        reason: s.explanation || s.diagnostic
      };
    });

    const winningSource = provenanceTree.find(p => p.success);
    const diagnostic = result.detailedDiagnostics?.[0];

    return {
      selector,
      elementSelector: selector,
      role,
      computedName: result.name,
      provenanceTree,
      winningSource,
      diagnostic,
      isAdequate,
      reason,
      provenanceExplanation,
      steps: result.steps,
      diagnostics: result.diagnostics
    };
  }

  // -------------------------------------------------------------------------
  // Recursive W3C AccName 1.2 / 1.3 Step Execution
  // -------------------------------------------------------------------------

  private computeStepRecursive(
    node: AnyDOMNode,
    options: AccNameComputationOptions,
    steps: ProvenanceStep[],
    diagnostics: string[]
  ): { name: string; source: string } {
    if (!node) return { name: '', source: 'none' };

    // Handle text nodes directly
    if (node.nodeType === 3) {
      const val = (node.nodeValue || node.textContent || '');
      return { name: val, source: 'contents' };
    }

    if (node.nodeType !== 1) return { name: '', source: 'none' };

    // Prevent cyclic DOM recursion
    if (options.visitedNodes?.has(node)) {
      steps.push({
        step: '2_CYCLE_CHECK',
        description: 'Cyclic DOM node reference detected',
        matched: false,
        status: 'loop_prevented',
        explanation: 'DOM node has already been visited in the current traversal path; aborting subtree recursion.'
      });
      return { name: '', source: 'none' };
    }
    options.visitedNodes?.add(node);

    const traversalSource = options.traversalSource || 'direct';
    const tagName = (node.tagName || node.nodeName || '').toLowerCase();
    const role = (node.getAttribute?.('role') || '').toLowerCase();

    // -----------------------------------------------------------------------
    // Step 2A: Hidden node checking
    // Authoritative Exception: When traversalSource === 'labelledby', hidden elements ARE processed.
    // -----------------------------------------------------------------------
    const isHidden = this.checkIsHidden(node);
    if (isHidden) {
      if (traversalSource === 'labelledby') {
        steps.push({
          step: '2A',
          description: 'Hidden element check (authoritative aria-labelledby traversal exception)',
          matched: false,
          candidateSource: 'hidden attribute/style',
          status: 'matched',
          explanation: 'Node is hidden but traversalSource is "labelledby"; traversal permitted per W3C AccName 1.2 §2.A.'
        });
      } else {
        steps.push({
          step: '2A',
          description: 'Hidden element pruned',
          matched: true,
          candidateSource: 'hidden attribute/style',
          status: 'pruned',
          yieldedText: '',
          diagnostic: 'hidden element pruned',
          explanation: 'Node is hidden (aria-hidden="true", hidden attribute, or display:none) and not part of an aria-labelledby traversal.'
        });
        return { name: '', source: 'none' };
      }
    } else {
      steps.push({
        step: '2A',
        description: 'Hidden element check (visible)',
        matched: false,
        status: 'skipped',
        explanation: 'Element is visible in the accessibility tree.'
      });
    }

    const currentNodeId = node.getAttribute?.('id') || (node as any).id;
    if (currentNodeId && options.visitedIds) {
      options.visitedIds.add(currentNodeId);
    }

    // -----------------------------------------------------------------------
    // Step 2B: aria-labelledby traversal
    // -----------------------------------------------------------------------
    if (traversalSource === 'labelledby' && node.hasAttribute?.('aria-labelledby')) {
      steps.push({
        step: '2B',
        description: 'aria-labelledby chaining prohibited (loop protection)',
        matched: false,
        status: 'loop_prevented',
        candidateSource: `aria-labelledby="${node.getAttribute?.('aria-labelledby') || ''}"`,
        diagnostic: 'Circular ID reference detected',
        explanation: 'aria-labelledby was ignored on target element because traversal is already within an aria-labelledby path per W3C AccName 1.2 §2.B.'
      });
    }

    if (traversalSource !== 'labelledby' && node.hasAttribute?.('aria-labelledby')) {
      const attrVal = (node.getAttribute?.('aria-labelledby') || '').trim();
      if (attrVal) {
        const idList = attrVal.split(/\s+/);
        const resolvedTexts: string[] = [];
        let hasLoop = false;
        let missingTarget = false;

        for (const targetId of idList) {
          if (options.visitedIds?.has(targetId)) {
            hasLoop = true;
            steps.push({
              step: '2B',
              description: `aria-labelledby loop protection on ID "${targetId}"`,
              matched: false,
              status: 'loop_prevented',
              candidateSource: `aria-labelledby="${targetId}"`,
              diagnostic: `Circular ID reference detected: ${targetId}`,
              explanation: `ID "${targetId}" was already visited in this traversal branch; skipping to avoid infinite loop.`
            });
            continue;
          }

          const targetEl = this.resolveElementById(node, targetId, options.documentRoot);
          if (!targetEl) {
            missingTarget = true;
            steps.push({
              step: '2B',
              description: `aria-labelledby lookup failed for ID "${targetId}"`,
              matched: false,
              status: 'missing_ref',
              candidateSource: `aria-labelledby="${targetId}"`,
              diagnostic: 'aria-labelledby refers to missing ID',
              explanation: `Referenced element with ID "${targetId}" does not exist in the DOM.`
            });
            diagnostics.push('aria-labelledby refers to missing ID');
          } else {
            const nextVisitedIds = new Set(options.visitedIds);
            nextVisitedIds.add(targetId);

            const subResult = this.computeStepRecursive(targetEl, {
              ...options,
              isRoot: false,
              traversalSource: 'labelledby',
              visitedIds: nextVisitedIds
            }, steps, diagnostics);

            if (subResult.name.trim()) {
              resolvedTexts.push(subResult.name.trim());
            }
          }
        }

        const joined = resolvedTexts.join(' ');
        if (joined.length > 0) {
          steps.push({
            step: '2B',
            description: 'aria-labelledby resolved successfully',
            matched: true,
            status: 'matched',
            source: 'aria-labelledby',
            candidateSource: `aria-labelledby="${attrVal}"`,
            yieldedText: joined,
            explanation: `Accessible name resolved via aria-labelledby target(s): "${joined}".`
          });
          return { name: joined, source: 'aria-labelledby' };
        } else {
          steps.push({
            step: '2B',
            description: 'aria-labelledby targets yielded empty name',
            matched: false,
            status: 'empty',
            candidateSource: `aria-labelledby="${attrVal}"`,
            diagnostic: 'aria-labelledby target is empty',
            explanation: `aria-labelledby was provided but referenced element(s) yielded no accessible text.`
          });
          diagnostics.push('aria-labelledby target is empty');
        }
      }
    }

    // -----------------------------------------------------------------------
    // Step 2C: aria-label attribute
    // -----------------------------------------------------------------------
    if (node.hasAttribute?.('aria-label')) {
      const rawLabel = node.getAttribute?.('aria-label') || '';
      const trimmedLabel = rawLabel.trim();
      if (trimmedLabel.length > 0) {
        steps.push({
          step: '2C',
          description: 'aria-label attribute matched',
          matched: true,
          status: 'matched',
          source: 'aria-label',
          candidateSource: `aria-label="${rawLabel}"`,
          yieldedText: trimmedLabel,
          explanation: `Accessible name derived directly from aria-label attribute: "${trimmedLabel}".`
        });
        return { name: trimmedLabel, source: 'aria-label' };
      } else {
        steps.push({
          step: '2C',
          description: 'aria-label attribute is empty string',
          matched: false,
          status: 'empty',
          candidateSource: 'aria-label=""',
          explanation: 'aria-label attribute is present but empty; proceeding to native host semantics / contents.'
        });
      }
    }

    // -----------------------------------------------------------------------
    // Step 2D: Native HTML host language rules
    // -----------------------------------------------------------------------
    const hostResult = this.computeHostLanguageName(node, options, steps, diagnostics);
    if (hostResult.name.length > 0) {
      return hostResult;
    }

    // -----------------------------------------------------------------------
    // Step 2E: Text subtree recursion (Name from Contents)
    // -----------------------------------------------------------------------
    const allowsNameFromContents = this.supportsNameFromContents(tagName, role, traversalSource);
    if (allowsNameFromContents) {
      const contentsResult = this.computeNameFromContents(node, options, steps, diagnostics);
      if (contentsResult.name.trim().length > 0) {
        return contentsResult;
      }
    } else {
      steps.push({
        step: '2E',
        description: `Name from contents not permitted for role "${role || tagName}"`,
        matched: false,
        status: 'skipped',
        explanation: `Element role "${role || tagName}" does not permit accessible name from contents per W3C ARIA specification.`
      });
    }

    // -----------------------------------------------------------------------
    // Step 2F: Fallback to title or placeholder
    // -----------------------------------------------------------------------
    if (node.hasAttribute?.('title')) {
      const titleVal = (node.getAttribute?.('title') || '').trim();
      if (titleVal.length > 0) {
        steps.push({
          step: '2F',
          description: 'title attribute fallback',
          matched: true,
          status: 'matched',
          source: 'title',
          candidateSource: `title="${titleVal}"`,
          yieldedText: titleVal,
          explanation: `Fallback to HTML title attribute: "${titleVal}".`
        });
        return { name: titleVal, source: 'title' };
      }
    }

    if (node.hasAttribute?.('placeholder')) {
      const placeholderVal = (node.getAttribute?.('placeholder') || '').trim();
      if (placeholderVal.length > 0) {
        steps.push({
          step: '2F',
          description: 'placeholder attribute fallback',
          matched: true,
          status: 'matched',
          source: 'placeholder',
          candidateSource: `placeholder="${placeholderVal}"`,
          yieldedText: placeholderVal,
          diagnostic: 'placeholder used as only label',
          explanation: `Fallback to input placeholder: "${placeholderVal}". Note: placeholder disappears on typing.`
        });
        diagnostics.push('placeholder used as only label');
        return { name: placeholderVal, source: 'placeholder' };
      }
    }

    return { name: '', source: 'none' };
  }

  // -------------------------------------------------------------------------
  // Step 2D: Native Host Language Rules Helper
  // -------------------------------------------------------------------------

  private computeHostLanguageName(
    node: AnyDOMNode,
    options: AccNameComputationOptions,
    steps: ProvenanceStep[],
    diagnostics: string[]
  ): { name: string; source: string } {
    const tagName = (node.tagName || node.nodeName || '').toLowerCase();
    const type = (node.getAttribute?.('type') || '').toLowerCase();

    // 1. input[type="button" | "submit" | "reset"]
    if (tagName === 'input' && (type === 'button' || type === 'submit' || type === 'reset')) {
      if (node.hasAttribute?.('value')) {
        const val = (node.getAttribute?.('value') || '').trim();
        if (val) {
          steps.push({
            step: '2D',
            description: `input[type="${type}"] value attribute matched`,
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: `value="${val}"`,
            yieldedText: val,
            explanation: `Button input accessible name derived from value attribute: "${val}".`
          });
          return { name: val, source: 'native-label' };
        }
      }
      // Default fallback for submit / reset
      const defaultVal = type === 'submit' ? 'Submit' : type === 'reset' ? 'Reset' : '';
      if (defaultVal) {
        steps.push({
          step: '2D',
          description: `input[type="${type}"] default browser value`,
          matched: true,
          status: 'matched',
          source: 'native-label',
          candidateSource: 'browser default',
          yieldedText: defaultVal,
          explanation: `Button input using browser default text: "${defaultVal}".`
        });
        return { name: defaultVal, source: 'native-label' };
      }
    }

    // 2. input[type="image"]
    if (tagName === 'input' && type === 'image') {
      if (node.hasAttribute?.('alt')) {
        const alt = (node.getAttribute?.('alt') || '').trim();
        if (alt) {
          steps.push({
            step: '2D',
            description: 'input[type="image"] alt attribute matched',
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: `alt="${alt}"`,
            yieldedText: alt,
            explanation: `Image input name derived from alt attribute: "${alt}".`
          });
          return { name: alt, source: 'native-label' };
        }
      }
      if (node.hasAttribute?.('value')) {
        const val = (node.getAttribute?.('value') || '').trim();
        if (val) {
          steps.push({
            step: '2D',
            description: 'input[type="image"] value fallback',
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: `value="${val}"`,
            yieldedText: val,
            explanation: `Image input name fallback to value attribute: "${val}".`
          });
          return { name: val, source: 'native-label' };
        }
      }
      diagnostics.push('image has no alt');
    }

    // 3. input / textarea / select form controls -> label[for] or wrapping label
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      const id = node.getAttribute?.('id') || (node as any).id;
      if (id) {
        const explicitLabels = this.findLabelsForId(node, id, options.documentRoot);
        if (explicitLabels.length > 0) {
          const labelTexts = explicitLabels
            .map(lbl => this.computeNameFromContents(lbl, { ...options, traversalSource: 'contents' }, steps, diagnostics).name)
            .filter(t => t.trim().length > 0);
          if (labelTexts.length > 0) {
            const joined = labelTexts.join(' ').trim();
            steps.push({
              step: '2D',
              description: `Associated <label for="${id}"> matched`,
              matched: true,
              status: 'matched',
              source: 'native-label',
              candidateSource: `label[for="${id}"]`,
              yieldedText: joined,
              explanation: `Form control labelled by explicit label[for="${id}"]: "${joined}".`
            });
            return { name: joined, source: 'native-label' };
          }
        }
      }

      // Check wrapping parent <label>
      const wrappingLabel = this.findWrappingLabel(node);
      if (wrappingLabel) {
        const labelText = this.computeWrappingLabelContents(wrappingLabel, node, options, steps, diagnostics);
        if (labelText.trim().length > 0) {
          steps.push({
            step: '2D',
            description: 'Wrapping parent <label> matched',
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: '<label>...</label>',
            yieldedText: labelText.trim(),
            explanation: `Form control labelled by enclosing parent <label>: "${labelText.trim()}".`
          });
          return { name: labelText.trim(), source: 'native-label' };
        }
      }

      // Check placeholder fallback for form controls
      if (node.hasAttribute?.('placeholder')) {
        const placeholder = (node.getAttribute?.('placeholder') || '').trim();
        if (placeholder) {
          steps.push({
            step: '2D',
            description: 'Form control placeholder attribute matched as only label',
            matched: true,
            status: 'matched',
            source: 'placeholder',
            candidateSource: `placeholder="${placeholder}"`,
            yieldedText: placeholder,
            diagnostic: 'placeholder used as only label',
            explanation: `Input control has no associated <label>; using placeholder as accessible name.`
          });
          diagnostics.push('placeholder used as only label');
          return { name: placeholder, source: 'placeholder' };
        }
      }
    }

    // 4. img & area elements
    if (tagName === 'img' || tagName === 'area') {
      if (node.hasAttribute?.('alt')) {
        const alt = node.getAttribute?.('alt') || '';
        if (alt === '') {
          // Explicitly empty alt="" means decorative image
          steps.push({
            step: '2D',
            description: 'img[alt=""] decorative image (empty name)',
            matched: true,
            status: 'pruned',
            source: 'native-label',
            candidateSource: 'alt=""',
            yieldedText: '',
            explanation: 'Image marked explicitly decorative via alt=""; accessible name is empty string.'
          });
          return { name: '', source: 'native-label' };
        } else {
          steps.push({
            step: '2D',
            description: 'img alt attribute matched',
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: `alt="${alt}"`,
            yieldedText: alt.trim(),
            explanation: `Image accessible name derived from alt attribute: "${alt.trim()}".`
          });
          return { name: alt.trim(), source: 'native-label' };
        }
      } else {
        steps.push({
          step: '2D',
          description: 'img missing alt attribute',
          matched: false,
          status: 'missing_ref',
          candidateSource: 'img without alt',
          diagnostic: 'image has no alt',
          explanation: 'Image lacks alt attribute; screen readers will announce image URL filename.'
        });
        diagnostics.push('image has no alt');
      }
    }

    // 5. svg element -> child <title>
    if (tagName === 'svg') {
      const titleElem = this.findChildByTag(node, 'title');
      if (titleElem) {
        const titleText = (titleElem.textContent || titleElem.nodeValue || '').trim();
        if (titleText) {
          steps.push({
            step: '2D',
            description: 'svg child <title> matched',
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: '<title>...</title>',
            yieldedText: titleText,
            explanation: `SVG accessible name derived from internal <title> element: "${titleText}".`
          });
          return { name: titleText, source: 'native-label' };
        }
      }
    }

    // 6. table -> caption or summary
    if (tagName === 'table') {
      const captionElem = this.findChildByTag(node, 'caption');
      if (captionElem) {
        const captionText = (captionElem.textContent || '').trim();
        if (captionText) {
          steps.push({
            step: '2D',
            description: 'table child <caption> matched',
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: '<caption>...</caption>',
            yieldedText: captionText,
            explanation: `Table accessible name derived from <caption>: "${captionText}".`
          });
          return { name: captionText, source: 'native-label' };
        }
      }
      if (node.hasAttribute?.('summary')) {
        const summary = (node.getAttribute?.('summary') || '').trim();
        if (summary) {
          return { name: summary, source: 'native-label' };
        }
      }
    }

    // 7. fieldset -> first child <legend>
    if (tagName === 'fieldset') {
      const legendElem = this.findChildByTag(node, 'legend');
      if (legendElem) {
        const legendText = (legendElem.textContent || '').trim();
        if (legendText) {
          steps.push({
            step: '2D',
            description: 'fieldset child <legend> matched',
            matched: true,
            status: 'matched',
            source: 'native-label',
            candidateSource: '<legend>...</legend>',
            yieldedText: legendText,
            explanation: `Fieldset accessible name derived from <legend>: "${legendText}".`
          });
          return { name: legendText, source: 'native-label' };
        }
      }
    }

    // 8. figure -> figcaption
    if (tagName === 'figure') {
      const figcaption = this.findChildByTag(node, 'figcaption');
      if (figcaption) {
        const text = (figcaption.textContent || '').trim();
        if (text) {
          return { name: text, source: 'native-label' };
        }
      }
    }

    // 9. details -> summary
    if (tagName === 'details') {
      const summary = this.findChildByTag(node, 'summary');
      if (summary) {
        const text = (summary.textContent || '').trim();
        if (text) {
          return { name: text, source: 'native-label' };
        }
      }
    }

    return { name: '', source: 'none' };
  }

  // -------------------------------------------------------------------------
  // Step 2E: Subtree Traversal (Name from Contents) Helper
  // -------------------------------------------------------------------------

  private computeNameFromContents(
    node: AnyDOMNode,
    options: AccNameComputationOptions,
    steps: ProvenanceStep[],
    diagnostics: string[]
  ): { name: string; source: string } {
    const parts: string[] = [];
    const children = node.childNodes || [];

    for (const child of children) {
      if (child.nodeType === 3) {
        // Text node
        const val = (child.nodeValue || child.textContent || '');
        if (val) {
          parts.push(val);
        }
      } else if (child.nodeType === 1) {
        // Element node
        const childTag = (child.tagName || child.nodeName || '').toLowerCase();
        
        // Embedded form controls inside a label/button
        if (childTag === 'input' || childTag === 'select' || childTag === 'textarea') {
          const type = (child.getAttribute?.('type') || '').toLowerCase();
          if (type === 'button' || type === 'submit' || type === 'reset') {
            const val = child.getAttribute?.('value') || '';
            if (val) parts.push(val);
          } else {
            const val = child.getAttribute?.('value') || (child as any).value || '';
            if (val) {
              parts.push(val);
            }
          }
        } else {
          // Recursive call with traversalSource: 'contents'
          const childResult = this.computeStepRecursive(child, {
            ...options,
            isRoot: false,
            traversalSource: 'contents'
          }, steps, diagnostics);

          if (childResult.name) {
            if (parts.length > 0 && !/\s$/.test(parts[parts.length - 1]) && !/^\s/.test(childResult.name)) {
              parts.push(' ');
            }
            parts.push(childResult.name);
          }
        }
      }
    }

    const joined = parts.join('');
    if (joined.trim().length > 0) {
      steps.push({
        step: '2E',
        description: 'Name from contents subtree recursion',
        matched: true,
        status: 'matched',
        source: 'contents',
        candidateSource: 'child nodes',
        yieldedText: joined.trim(),
        explanation: `Accessible name accumulated from child subtree: "${joined.trim()}".`
      });
      return { name: joined, source: 'contents' };
    }

    return { name: '', source: 'none' };
  }

  // -------------------------------------------------------------------------
  // Diagnostic Anti-Pattern Rules Engine (10 Rules)
  // -------------------------------------------------------------------------

  private runDiagnostics(
    node: AnyDOMNode,
    computedName: string,
    source: string,
    steps: ProvenanceStep[],
    diagnostics: string[],
    detailedDiagnostics: AccNameDiagnostic[],
    options: AccNameComputationOptions
  ) {
    const tagName = (node.tagName || node.nodeName || '').toLowerCase();
    const role = (node.getAttribute?.('role') || options.role || '').toLowerCase();
    const isInteractive = this.isInteractiveElement(tagName, role);
    const innerHtml = this.serializeNodeToSnippet(node);

    // 1. EMPTY_ACCESSIBLE_NAME
    if (isInteractive && computedName.length === 0) {
      const code: DiagnosticCode = 'EMPTY_ACCESSIBLE_NAME';
      const msg = `Interactive <${role || tagName}> element has no accessible name and will be announced as an empty control to assistive tech.`;
      diagnostics.push('no aria-label, no text content');
      detailedDiagnostics.push({
        code,
        severity: 'critical',
        wcagRules: ['WCAG 4.1.2 Name, Role, Value (Level A)'],
        message: msg,
        remediationAdvice: 'Provide an aria-label attribute (e.g., aria-label="Action description") or include visible text content within the control.'
      });
    }

    // 2. UNLABELED_ICON
    const containsIcon = innerHtml.includes('<svg') || innerHtml.includes('<i ') || innerHtml.includes('class="icon') || innerHtml.includes('class="fa');
    if (isInteractive && computedName.length === 0 && containsIcon) {
      const code: DiagnosticCode = 'UNLABELED_ICON';
      const msg = `Interactive <${role || tagName}> wraps an icon graphic without an accessible text label.`;
      diagnostics.push('parent link wraps only an icon');
      detailedDiagnostics.push({
        code,
        severity: 'critical',
        wcagRules: ['WCAG 4.1.2 Name, Role, Value', 'WCAG 1.1.1 Non-text Content'],
        message: msg,
        remediationAdvice: 'Add an aria-label on the parent interactive element or a child <title> inside the <svg>.'
      });
    }

    // 3. IMAGE_MISSING_ALT
    if (tagName === 'img' && !node.hasAttribute?.('alt')) {
      const code: DiagnosticCode = 'IMAGE_MISSING_ALT';
      diagnostics.push('image has no alt');
      detailedDiagnostics.push({
        code,
        severity: 'high',
        wcagRules: ['WCAG 1.1.1 Non-text Content (Level A)'],
        message: 'Image element is missing an alt attribute. Screen readers will read the raw image URL.',
        remediationAdvice: 'Add alt="Description" for informative images, or alt="" for purely decorative images.'
      });
    }

    // 4. MISSING_LABELLEDBY_TARGET
    if (node.hasAttribute?.('aria-labelledby')) {
      const attrVal = (node.getAttribute?.('aria-labelledby') || '').trim();
      const idTokens = attrVal.split(/\s+/);
      for (const id of idTokens) {
        const target = this.resolveElementById(node, id, options.documentRoot);
        if (!target) {
          const code: DiagnosticCode = 'MISSING_LABELLEDBY_TARGET';
          diagnostics.push('aria-labelledby refers to missing ID');
          detailedDiagnostics.push({
            code,
            severity: 'high',
            wcagRules: ['WCAG 1.3.1 Info and Relationships', 'WCAG 4.1.2 Name, Role, Value'],
            message: `aria-labelledby references non-existent ID "${id}".`,
            remediationAdvice: `Ensure the element with id="${id}" exists in the DOM or correct the ID reference.`
          });
        }
      }
    }

    // 5. EMPTY_LABELLEDBY_TARGET
    if (node.hasAttribute?.('aria-labelledby') && computedName.length === 0) {
      const code: DiagnosticCode = 'EMPTY_LABELLEDBY_TARGET';
      diagnostics.push('aria-labelledby target is empty');
      detailedDiagnostics.push({
        code,
        severity: 'high',
        wcagRules: ['WCAG 4.1.2 Name, Role, Value'],
        message: 'aria-labelledby references elements that contain no accessible text.',
        remediationAdvice: 'Add descriptive text content to the elements referenced by aria-labelledby.'
      });
    }

    // 6. LABEL_WRAPS_ONLY_ICON
    if ((tagName === 'a' || tagName === 'button' || role === 'link' || role === 'button') && containsIcon) {
      const directText = (node.textContent || '').trim();
      if (!directText && computedName.length === 0) {
        const code: DiagnosticCode = 'LABEL_WRAPS_ONLY_ICON';
        diagnostics.push('parent link wraps only an icon');
        detailedDiagnostics.push({
          code,
          severity: 'high',
          wcagRules: ['WCAG 2.4.4 Link Purpose', 'WCAG 4.1.2 Name, Role, Value'],
          message: 'Interactive link or button wraps only an icon and provides no textual label.',
          remediationAdvice: 'Add an aria-label attribute describing the action or destination.'
        });
      }
    }

    // 7. PLACEHOLDER_ONLY_LABEL
    if ((tagName === 'input' || tagName === 'textarea') && source === 'placeholder') {
      const code: DiagnosticCode = 'PLACEHOLDER_ONLY_LABEL';
      diagnostics.push('placeholder used as only label');
      detailedDiagnostics.push({
        code,
        severity: 'medium',
        wcagRules: ['WCAG 3.3.2 Labels or Instructions', 'WCAG 4.1.2 Name, Role, Value'],
        message: 'Input relies solely on placeholder text as its label. Placeholder text vanishes when typing and often fails contrast requirements.',
        remediationAdvice: 'Add an explicit <label for="..."> or an aria-label attribute to provide a persistent accessible label.'
      });
    }

    // 8. REDUNDANT_ROLE_IN_NAME
    if (computedName && (role || tagName)) {
      const currentRole = role || (tagName === 'button' ? 'button' : tagName === 'a' ? 'link' : '');
      if (currentRole && currentRole !== 'generic') {
        const nameLower = computedName.toLowerCase();
        if (nameLower.endsWith(` ${currentRole}`) || nameLower.startsWith(`${currentRole} `) || nameLower === currentRole) {
          const code: DiagnosticCode = 'REDUNDANT_ROLE_IN_NAME';
          diagnostics.push('redundant role in accessible name');
          detailedDiagnostics.push({
            code,
            severity: 'low',
            wcagRules: ['WCAG Usability & Best Practice'],
            message: `Accessible name "${computedName}" repeats the control's role ("${currentRole}"). Screen readers already announce the role.`,
            remediationAdvice: `Remove "${currentRole}" from the accessible name to avoid repetitive announcements like "${computedName}, ${currentRole}".`
          });
        }
      }
    }

    // 9. GENERIC_NON_DESCRIPTIVE_NAME
    if (computedName && GENERIC_NON_DESCRIPTIVE_NAMES.has(computedName.toLowerCase())) {
      const code: DiagnosticCode = 'GENERIC_NON_DESCRIPTIVE_NAME';
      diagnostics.push('non-descriptive generic placeholder');
      detailedDiagnostics.push({
        code,
        severity: 'medium',
        wcagRules: ['WCAG 2.4.4 Link Purpose (In Context) (Level A)'],
        message: `Accessible name "${computedName}" is generic and non-descriptive. It fails to convey purpose out of context.`,
        remediationAdvice: `Replace generic text "${computedName}" with specific context (e.g., "Read more about quarterly earnings").`
      });
    }

    // 10. LABEL_IN_NAME_MISMATCH
    if (isInteractive && computedName && node.childNodes?.length) {
      const visibleText = (node.textContent || '').trim();
      if (visibleText && visibleText.length > 2) {
        const normVisible = visibleText.toLowerCase().replace(/\s+/g, ' ');
        const normComputed = computedName.toLowerCase().replace(/\s+/g, ' ');
        if (!normComputed.includes(normVisible)) {
          const code: DiagnosticCode = 'LABEL_IN_NAME_MISMATCH';
          diagnostics.push('visible text not in accessible name');
          detailedDiagnostics.push({
            code,
            severity: 'high',
            wcagRules: ['WCAG 2.5.3 Label in Name (Level A)'],
            message: `Visible text "${visibleText}" does not appear within computed accessible name "${computedName}". Voice navigation will fail.`,
            remediationAdvice: `Ensure the accessible name contains the visible text "${visibleText}" at the beginning of the name.`
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // CDP AX-Tree Cross-Check Comparator
  // -------------------------------------------------------------------------

  /**
   * Compares custom W3C Accessible Name computation with Chrome DevTools Protocol
   * AX-Tree (Accessibility.getFullAXTree / AXValue) computed name.
   */
  compareWithCDP(
    w3cResult: AccNameResult | string,
    cdpName: string,
    context?: { selector?: string; backendDOMNodeId?: number }
  ): AccNameCDPComparison {
    const rawW3c = typeof w3cResult === 'string' ? w3cResult : (w3cResult?.name ?? '');
    const normW3c = this.normalizeWhitespace(rawW3c);
    const normCdp = this.normalizeWhitespace(cdpName ?? '');

    let status: ComparisonStatus;
    let agreementRate: number;
    let agreement: boolean;
    let discrepancyReason: string;

    if (normW3c === normCdp) {
      status = 'EXACT_MATCH';
      agreementRate = 1.0;
      agreement = true;
      discrepancyReason = `Custom W3C computation and CDP AX-Tree computed name match exactly: "${normW3c}".`;
    } else if (normW3c.toLowerCase() === normCdp.toLowerCase()) {
      status = 'CASE_INSENSITIVE_MATCH';
      agreementRate = 1.0;
      agreement = true;
      discrepancyReason = `Names match with case-folding difference (W3C: "${normW3c}" vs CDP: "${normCdp}").`;
    } else if (normW3c && normCdp && (normW3c.includes(normCdp) || normCdp.includes(normW3c))) {
      status = 'SUBSET_MATCH';
      agreementRate = 0.85;
      agreement = true;
      discrepancyReason = `Subset agreement: one name is contained in the other (W3C: "${normW3c}" vs CDP: "${normCdp}").`;
    } else if (normW3c.length > 0 && normCdp.length === 0) {
      status = 'CUSTOM_FOUND_CDP_EMPTY';
      agreementRate = 0.0;
      agreement = false;
      discrepancyReason = `Discrepancy: W3C engine computed "${normW3c}", but CDP reported empty accessible name.`;
    } else if (normW3c.length === 0 && normCdp.length > 0) {
      status = 'CDP_FOUND_CUSTOM_EMPTY';
      agreementRate = 0.0;
      agreement = false;
      discrepancyReason = `Discrepancy: W3C engine yielded empty name, but CDP reported "${normCdp}" (likely due to internal localized default or shadow root).`;
    } else {
      status = 'VALUE_MISMATCH';
      agreementRate = 0.0;
      agreement = false;
      discrepancyReason = `Discrepancy: W3C engine calculated "${normW3c}", but CDP reported "${normCdp}".`;
    }

    return {
      w3cName: normW3c,
      cdpName: normCdp,
      agreement,
      discrepancyReason,
      status,
      agreementRate,
      selector: context?.selector,
      backendDOMNodeId: context?.backendDOMNodeId,
      provenanceTrace: typeof w3cResult === 'object' ? w3cResult.steps : undefined
    };
  }

  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------

  private normalizeWhitespace(str: string): string {
    if (!str) return '';
    return str
      .replace(/[\s\u00A0\u2000-\u200B\uFEFF]+/g, ' ')
      .trim();
  }

  private checkIsHidden(node: AnyDOMNode): boolean {
    if (!node || node.nodeType !== 1) return false;

    if (node.getAttribute?.('aria-hidden') === 'true') return true;
    if (node.hasAttribute?.('hidden') || node.hasAttribute?.('inert')) return true;

    // Check style attribute
    const styleAttr = node.getAttribute?.('style') || '';
    if (/display\s*:\s*none/i.test(styleAttr)) return true;
    if (/visibility\s*:\s*hidden/i.test(styleAttr)) return true;

    // In browser environment: check window.getComputedStyle if available
    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function' && (node as any) instanceof (window as any).Element) {
      try {
        const computed = window.getComputedStyle(node as unknown as Element);
        if (computed.display === 'none' || computed.visibility === 'hidden') {
          return true;
        }
      } catch {
        // Ignore cross-origin / detached DOM error
      }
    }

    return false;
  }

  private supportsNameFromContents(tagName: string, role: string, traversalSource: AccNameTraversalSource): boolean {
    if (traversalSource === 'labelledby' || traversalSource === 'contents') {
      return true;
    }
    if (role && ROLES_ALLOWING_NAME_FROM_CONTENTS.has(role)) {
      return true;
    }
    const nativeContentsTags = new Set([
      'button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'summary', 'caption', 'legend', 'figcaption', 'output', 'th'
    ]);
    return nativeContentsTags.has(tagName);
  }

  private isInteractiveElement(tagName: string, role: string): boolean {
    const interactiveRoles = new Set([
      'button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio',
      'combobox', 'listbox', 'menuitem', 'tab', 'switch', 'slider',
      'spinbutton'
    ]);
    if (role && interactiveRoles.has(role)) return true;
    const interactiveTags = new Set(['button', 'a', 'input', 'select', 'textarea']);
    return interactiveTags.has(tagName);
  }

  private resolveElementById(currentNode: AnyDOMNode, id: string, documentRoot?: AnyDOMNode): AnyDOMNode | null {
    if (!id) return null;

    // 1. Browser document check if running in browser
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      try {
        const el = document.getElementById(id);
        if (el) return el as unknown as AnyDOMNode;
      } catch {
        // Fallback
      }
    }

    // 2. Virtual DOM search
    if (documentRoot && typeof documentRoot.getElementById === 'function') {
      const found = documentRoot.getElementById(id);
      if (found) return found;
    }

    if (currentNode && typeof currentNode.getElementById === 'function') {
      return currentNode.getElementById(id);
    }

    return null;
  }

  private findLabelsForId(node: AnyDOMNode, id: string, documentRoot?: AnyDOMNode): AnyDOMNode[] {
    const results: AnyDOMNode[] = [];
    if (!id) return results;

    const selector = `label[for="${id}"]`;

    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      try {
        const nodeList = document.querySelectorAll(selector);
        return Array.from(nodeList) as unknown as AnyDOMNode[];
      } catch {
        // Fallback
      }
    }

    let root: AnyDOMNode = documentRoot || node;
    while (root.parentElement) {
      root = root.parentElement;
    }
    if (typeof root.querySelectorAll === 'function') {
      return root.querySelectorAll(selector);
    }
    return results;
  }

  private findWrappingLabel(node: AnyDOMNode): AnyDOMNode | null {
    if (typeof node.closest === 'function') {
      return node.closest('label');
    }
    let curr = node.parentElement;
    while (curr) {
      const tag = (curr.tagName || curr.nodeName || '').toLowerCase();
      if (tag === 'label') return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  private computeWrappingLabelContents(
    label: AnyDOMNode,
    targetInput: AnyDOMNode,
    options: AccNameComputationOptions,
    steps: ProvenanceStep[],
    diagnostics: string[]
  ): string {
    const parts: string[] = [];
    const children = label.childNodes || [];

    for (const child of children) {
      if (child === targetInput) {
        // Exclude the input control itself from its own wrapping label's text
        continue;
      }
      if (child.nodeType === 3) {
        parts.push(child.nodeValue || child.textContent || '');
      } else if (child.nodeType === 1) {
        const sub = this.computeStepRecursive(child, {
          ...options,
          isRoot: false,
          traversalSource: 'contents'
        }, steps, diagnostics);
        if (sub.name) {
          parts.push(sub.name);
        }
      }
    }

    return parts.join('').trim();
  }

  private findChildByTag(node: AnyDOMNode, tagName: string): AnyDOMNode | null {
    const target = tagName.toLowerCase();
    for (const child of node.childNodes || []) {
      if (child.nodeType === 1) {
        const cTag = (child.tagName || child.nodeName || '').toLowerCase();
        if (cTag === target) return child;
      }
    }
    return null;
  }

  private inferSelector(node: AnyDOMNode): string {
    const tag = (node.tagName || node.nodeName || 'element').toLowerCase();
    const id = node.getAttribute?.('id') || (node as any).id;
    if (id) return `${tag}#${id}`;
    const cls = node.getAttribute?.('class') || (node as any).className;
    if (cls) {
      const firstClass = cls.trim().split(/\s+/)[0];
      if (firstClass) return `${tag}.${firstClass}`;
    }
    return tag;
  }

  private inferRole(node: AnyDOMNode): string {
    const explicit = (node.getAttribute?.('role') || '').toLowerCase();
    if (explicit) return explicit;
    const tag = (node.tagName || node.nodeName || '').toLowerCase();
    switch (tag) {
      case 'button': return 'button';
      case 'a': return 'link';
      case 'input': {
        const type = (node.getAttribute?.('type') || 'text').toLowerCase();
        if (type === 'button' || type === 'submit' || type === 'reset') return 'button';
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        return 'textbox';
      }
      case 'select': return 'combobox';
      case 'textarea': return 'textbox';
      case 'img': return 'img';
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': return 'heading';
      default: return tag;
    }
  }

  private serializeNodeToSnippet(node: AnyDOMNode): string {
    if (node.nodeType === 3) return node.nodeValue || '';
    const tag = (node.tagName || node.nodeName || 'div').toLowerCase();
    const attrs = Object.entries(node.attributes || {})
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    const childrenStr = (node.childNodes || []).map(c => this.serializeNodeToSnippet(c)).join('');
    return `<${tag}${attrs ? ' ' + attrs : ''}>${childrenStr}</${tag}>`;
  }

  private buildRemediationAdvice(detailed: AccNameDiagnostic[], computedName: string): string {
    if (detailed.length === 0) {
      return `Accessible name "${computedName}" is valid and conforms to W3C AccName specifications.`;
    }
    const critical = detailed.filter(d => d.severity === 'critical' || d.severity === 'high');
    if (critical.length > 0) {
      return critical.map(d => `${d.message} Remediation: ${d.remediationAdvice}`).join(' | ');
    }
    return detailed.map(d => `${d.message} Remediation: ${d.remediationAdvice}`).join(' | ');
  }
}

// ---------------------------------------------------------------------------
// Standalone Helper Functions
// ---------------------------------------------------------------------------

export const defaultAccNameEngine = new AccNameProvenanceEngine();

export function computeAccessibleName(
  target: AnyDOMNode | string,
  options?: AccNameComputationOptions
): AccNameResult {
  return defaultAccNameEngine.computeAccessibleName(target, options);
}

export function compareWithCDP(
  w3cResult: AccNameResult | string,
  cdpName: string,
  context?: { selector?: string; backendDOMNodeId?: number }
): AccNameCDPComparison {
  return defaultAccNameEngine.compareWithCDP(w3cResult, cdpName, context);
}
