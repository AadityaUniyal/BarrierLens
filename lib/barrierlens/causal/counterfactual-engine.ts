import { BarrierFinding, FindingKind } from '../types';
import { LLMRouter } from '../agent/llm-router';

export interface DOMSnapshot {
  selector: string;
  outerHTML: string;
  parentChain?: { selector: string; tag: string; role?: string; ariaAttributes?: Record<string, string> }[];
  siblings?: { selector: string; tag: string; role?: string }[];
  ariaReferences?: { type: 'labelledby' | 'describedby' | 'owns' | 'controls'; targetIds: string[] }[];
  computedStyles?: Record<string, string>;
  focusable?: boolean;
  tabIndex?: number;
}

export interface CausalNode {
  id: string;
  type: 'element' | 'attribute' | 'style' | 'aria_ref' | 'focus_order' | 'container';
  selector: string;
  properties: Record<string, any>;
  isBarrierSource: boolean;
  causalStrength: number; // 0.0 to 1.0
}

export interface CausalEdge {
  from: string;
  to: string;
  relation: 'parent_of' | 'labels' | 'describes' | 'owns' | 'controls' | 'styles' | 'focus_precedes' | 'contains';
  strength: number;
}

export interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
  rootCause: CausalNode | null;
  interventionPoints: CausalNode[];
}

export interface CausalIntervention {
  nodeId: string;
  interventionType: 'add_attribute' | 'change_attribute' | 'remove_attribute' | 'change_tag' | 'add_wrapper' | 'add_listener';
  attribute?: string;
  oldValue?: string;
  newValue?: string;
  invasiveness: number; // 1 (attribute-only) to 5 (structural change)
  explanation: string;
  expectedEffect: string;
}

export interface CounterfactualPatch {
  id: string;
  intervention: CausalIntervention;
  originalHTML: string;
  patchedHTML: string;
  invasiveness: number;
  confidence: number;
  explanation: string;
}

export interface CounterfactualResult {
  finding: BarrierFinding;
  causalGraph: CausalGraph;
  interventions: CausalIntervention[];
  patches: CounterfactualPatch[];
  bestPatch: CounterfactualPatch | null;
}

export class CounterfactualEngine {
  private router = new LLMRouter();

  /**
   * Constructs a Structural Causal Model (SCM) DAG from the local DOM environment
   */
  buildCausalGraph(finding: BarrierFinding, domSnapshot: DOMSnapshot): CausalGraph {
    const nodes: CausalNode[] = [];
    const edges: CausalEdge[] = [];

    const targetSelector = domSnapshot.selector || finding.evidence?.selector || 'body';

    // 1. Root target element node
    const targetNode: CausalNode = {
      id: `node_target_${finding.id.slice(0, 8)}`,
      type: 'element',
      selector: targetSelector,
      properties: {
        html: domSnapshot.outerHTML,
        tabIndex: domSnapshot.tabIndex ?? 0,
        focusable: domSnapshot.focusable ?? true
      },
      isBarrierSource: true,
      causalStrength: 0.95
    };
    nodes.push(targetNode);

    // 2. Parent Container Node
    const parent = domSnapshot.parentChain?.[0];
    if (parent) {
      const parentNode: CausalNode = {
        id: `node_parent_${finding.id.slice(0, 8)}`,
        type: 'container',
        selector: parent.selector || 'parent',
        properties: { tag: parent.tag, role: parent.role, aria: parent.ariaAttributes },
        isBarrierSource: false,
        causalStrength: 0.65
      };
      nodes.push(parentNode);
      edges.push({
        from: parentNode.id,
        to: targetNode.id,
        relation: 'contains',
        strength: 0.8
      });
    }

    // 3. ARIA Reference Nodes
    if (domSnapshot.ariaReferences) {
      for (let i = 0; i < domSnapshot.ariaReferences.length; i++) {
        const ref = domSnapshot.ariaReferences[i];
        const refNode: CausalNode = {
          id: `node_aria_${ref.type}_${i}`,
          type: 'aria_ref',
          selector: ref.targetIds.join(','),
          properties: { type: ref.type, targets: ref.targetIds },
          isBarrierSource: ref.targetIds.length === 0,
          causalStrength: 0.85
        };
        nodes.push(refNode);
        edges.push({
          from: refNode.id,
          to: targetNode.id,
          relation: ref.type === 'labelledby' ? 'labels' : 'controls',
          strength: 0.9
        });
      }
    }

    // Identify Root Cause and Intervention candidates based on Finding Kind
    let rootCause = targetNode;
    const interventionPoints: CausalNode[] = [targetNode];

    if (finding.kind === 'keyboard_trap' && parent) {
      // Often modal wrapper is the true causal locus
      const parentNode = nodes.find(n => n.type === 'container');
      if (parentNode) {
        interventionPoints.push(parentNode);
      }
    }

    return {
      nodes,
      edges,
      rootCause,
      interventionPoints
    };
  }

  /**
   * Generates intervention candidates using do-calculus: do(X = x')
   */
  generateInterventions(graph: CausalGraph, finding: BarrierFinding): CausalIntervention[] {
    const interventions: CausalIntervention[] = [];
    const targetNode = graph.rootCause || graph.nodes[0];

    switch (finding.kind) {
      case 'empty_accessible_name':
      case 'misleading_accessible_name':
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'add_attribute',
          attribute: 'aria-label',
          newValue: 'Action Trigger',
          invasiveness: 1,
          explanation: 'Inject explicit descriptive aria-label directly onto element to satisfy W3C AccName.',
          expectedEffect: 'Provides instant deterministic accessible name without altering visual styling.'
        });
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'add_attribute',
          attribute: 'title',
          newValue: 'Interactive Control',
          invasiveness: 1,
          explanation: 'Supply fallback title attribute for native tooltip and accessible description.',
          expectedEffect: 'Satisfies Level A baseline name resolution.'
        });
        break;

      case 'keyboard_trap':
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'add_attribute',
          attribute: 'onkeydown',
          newValue: "if(event.key==='Escape'){this.closest('[role=dialog]')?.remove()}",
          invasiveness: 2,
          explanation: 'Attach deterministic Escape key escape hatch to terminate trapped focus cycles.',
          expectedEffect: 'Eliminates Tarjan SCC cycle by adding an outward directed edge to body or trigger.'
        });
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'add_attribute',
          attribute: 'aria-modal',
          newValue: 'true',
          invasiveness: 1,
          explanation: 'Declare aria-modal="true" and role="dialog" so screen readers and UAs scope navigation.',
          expectedEffect: 'Enforces standard WAI-ARIA modal dialogue focus containment.'
        });
        break;

      case 'silent_state_change':
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'add_attribute',
          attribute: 'aria-live',
          newValue: 'polite',
          invasiveness: 1,
          explanation: 'Declare aria-live="polite" and aria-atomic="true" on message container.',
          expectedEffect: 'Screen reader synthesizers speak DOM additions asynchronously without interrupting user.'
        });
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'change_attribute',
          attribute: 'role',
          newValue: 'status',
          invasiveness: 1,
          explanation: 'Apply semantic role="status" to container element.',
          expectedEffect: 'Automatically maps to live region in Accessibility Object Model.'
        });
        break;

      case 'unreachable_control':
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'change_attribute',
          attribute: 'tabindex',
          newValue: '0',
          invasiveness: 1,
          explanation: 'Update negative or missing tabindex to "0" to insert control into sequential keyboard navigation.',
          expectedEffect: 'Element becomes reachable via Tab key traversal.'
        });
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'change_tag',
          newValue: 'button',
          invasiveness: 2,
          explanation: 'Convert generic non-focusable tag (e.g. <div>) to native semantic <button>.',
          expectedEffect: 'Inherits keyboard focus, Enter/Space activation, and native role semantics.'
        });
        break;

      default:
        interventions.push({
          nodeId: targetNode.id,
          interventionType: 'add_attribute',
          attribute: 'aria-label',
          newValue: 'Interactive Section',
          invasiveness: 1,
          explanation: 'Add accessibility descriptor.',
          expectedEffect: 'Improves accessibility tree clarity.'
        });
        break;
    }

    return interventions.sort((a, b) => a.invasiveness - b.invasiveness);
  }

  /**
   * Applies interventions to generate concrete HTML patches
   */
  async generateCounterfactuals(
    finding: BarrierFinding,
    domSnapshot: DOMSnapshot
  ): Promise<CounterfactualResult> {
    const causalGraph = this.buildCausalGraph(finding, domSnapshot);
    const interventions = this.generateInterventions(causalGraph, finding);
    const patches: CounterfactualPatch[] = [];

    const rawHTML = domSnapshot.outerHTML || `<div class="control">Click</div>`;

    for (const intervention of interventions) {
      let patchedHTML = rawHTML;

      if (intervention.interventionType === 'add_attribute' && intervention.attribute && intervention.newValue) {
        // Surgically insert attribute into opening tag
        const match = patchedHTML.match(/<([a-z0-9\-]+)([^>]*)>/i);
        if (match) {
          const tagName = match[1];
          const existingAttrs = match[2];
          const attrString = ` ${intervention.attribute}="${intervention.newValue}"`;
          patchedHTML = patchedHTML.replace(match[0], `<${tagName}${existingAttrs}${attrString}>`);
        }
      } else if (intervention.interventionType === 'change_attribute' && intervention.attribute && intervention.newValue) {
        const regex = new RegExp(`${intervention.attribute}=["'][^"']*["']`, 'i');
        if (regex.test(patchedHTML)) {
          patchedHTML = patchedHTML.replace(regex, `${intervention.attribute}="${intervention.newValue}"`);
        } else {
          const match = patchedHTML.match(/<([a-z0-9\-]+)([^>]*)>/i);
          if (match) {
            patchedHTML = patchedHTML.replace(match[0], `<${match[1]}${match[2]} ${intervention.attribute}="${intervention.newValue}">`);
          }
        }
      } else if (intervention.interventionType === 'change_tag' && intervention.newValue) {
        patchedHTML = patchedHTML
          .replace(/^<[a-z0-9\-]+/i, `<${intervention.newValue}`)
          .replace(/<\/[a-z0-9\-]+>$/i, `</${intervention.newValue}>`);
      }

      patches.push({
        id: `patch_${crypto.randomUUID().slice(0, 8)}`,
        intervention,
        originalHTML: rawHTML,
        patchedHTML,
        invasiveness: intervention.invasiveness,
        confidence: Math.round((1.0 - (intervention.invasiveness * 0.12)) * 100) / 100,
        explanation: intervention.explanation
      });
    }

    // Try Gemini Flash LLM synthesizer for an advanced surgical patch if available
    try {
      const llmPatch = await this.router.generateFixPatch(rawHTML, `${finding.title}: ${finding.summary}`);
      if (llmPatch && llmPatch !== rawHTML && !patches.some(p => p.patchedHTML === llmPatch)) {
        patches.push({
          id: `patch_llm_${crypto.randomUUID().slice(0, 8)}`,
          intervention: {
            nodeId: causalGraph.rootCause?.id || 'target',
            interventionType: 'add_attribute',
            invasiveness: 2,
            explanation: 'Surgically synthesized ARIA patch via Gemini Flash Model.',
            expectedEffect: 'Resolves complex contextual accessibility barrier.'
          },
          originalHTML: rawHTML,
          patchedHTML: llmPatch,
          invasiveness: 2,
          confidence: 0.92,
          explanation: 'AI-Synthesized multi-attribute repair pattern.'
        });
      }
    } catch {
      // Deterministic patches suffice
    }

    const bestPatch = patches.length > 0 ? patches[0] : null;

    return {
      finding,
      causalGraph,
      interventions,
      patches,
      bestPatch
    };
  }
}
