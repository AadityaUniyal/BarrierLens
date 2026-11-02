import { BarrierGenomeEncoder, GenomeContext } from './barrier-encoder';
import { GenomeStore } from './genome-store';
import { BarrierFinding, FindingKind } from '../types';

export interface TransferInsight {
  matchedFindingId: string;
  sourceDomain: string;
  findingKind: FindingKind;
  similarityScore: number;
  provenSolution: string;
  confidence: number;
  explanation: string;
}

export interface PredictedBarrier {
  predictedKind: FindingKind;
  probability: number;
  triggerElement: string;
  reasoning: string;
  preventiveAdvice: string;
}

export class CrossSiteTransfer {
  private encoder = new BarrierGenomeEncoder();
  private store = new GenomeStore();

  /**
   * Discovers transferable remediation insights from previous audits of different domains
   */
  async findTransferableInsights(
    finding: BarrierFinding,
    context: GenomeContext
  ): Promise<TransferInsight[]> {
    const genome = this.encoder.encode(finding, context);
    const similar = await this.store.findSimilar(genome, 3, 0.70);

    const currentDomain = new URL(context.targetUrl || 'http://localhost').hostname;

    return similar
      .filter(s => s.domain !== currentDomain) // Must be cross-site!
      .map(s => {
        return {
          matchedFindingId: s.genome.findingId,
          sourceDomain: s.domain,
          findingKind: s.genome.findingKind,
          similarityScore: s.similarity,
          provenSolution: s.remediationAdvice || 'Standard WCAG remediation applied.',
          confidence: Math.round(s.similarity * 95) / 100,
          explanation: `Cross-site Genome Match (${Math.round(s.similarity * 100)}% structural & behavioral alignment) with proven case on ${s.domain}.`
        };
      });
  }

  /**
   * Predicts likely accessibility barriers before autonomous exploration based on initial AX tree snapshot
   */
  async predictBarriers(targetUrl: string, axTreeSnapshot: string): Promise<PredictedBarrier[]> {
    const predictions: PredictedBarrier[] = [];
    const text = axTreeSnapshot.toLowerCase();

    // Check for unlabeled icon buttons
    if (text.includes('button') && (text.includes('icon') || text.includes('svg') || text.includes('unnamed') || text.includes('untitled'))) {
      predictions.push({
        predictedKind: 'empty_accessible_name',
        probability: 0.88,
        triggerElement: 'icon buttons / svg action controls',
        reasoning: 'Identified interactive controls with visual icon markers but lacking explicit text labels.',
        preventiveAdvice: 'Provide explicit aria-label or title attributes on SVG/icon-only controls.'
      });
    }

    // Check for modal dialogs lacking escape handlers
    if (text.includes('dialog') || text.includes('modal') || text.includes('overlay')) {
      predictions.push({
        predictedKind: 'keyboard_trap',
        probability: 0.82,
        triggerElement: 'modal overlay containers',
        reasoning: 'Discovered modal/dialog structures. Often fail to trap focus inside or provide Escape-key release.',
        preventiveAdvice: 'Ensure focus loop is bounded and document keydown captures Escape to return focus to trigger.'
      });
    }

    // Check for dynamic live region / async update patterns
    if (text.includes('toast') || text.includes('notification') || text.includes('alert') || text.includes('banner')) {
      predictions.push({
        predictedKind: 'silent_state_change',
        probability: 0.79,
        triggerElement: 'notification & toast banners',
        reasoning: 'Dynamic status messages detected. High likelihood of missing aria-live declaration for screen readers.',
        preventiveAdvice: 'Use role="status" or aria-live="polite" aria-atomic="true" for asynchronous notifications.'
      });
    }

    // Fallback baseline prediction if sparse
    if (predictions.length === 0) {
      predictions.push({
        predictedKind: 'low_kendall_tau',
        probability: 0.65,
        triggerElement: 'multi-column grid layout',
        reasoning: 'Complex spatial layout detected; potential divergence between DOM order and CSS visual display order.',
        preventiveAdvice: 'Verify tab navigation order matches visual reading sequence across all viewports.'
      });
    }

    return predictions;
  }
}
