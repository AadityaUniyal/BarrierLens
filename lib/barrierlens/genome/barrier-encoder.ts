import { BarrierFinding, FindingKind, TrustTier, PersonaType, AuditRun } from '../types';

export interface GenomeContext {
  goal: string;
  persona: PersonaType;
  targetUrl: string;
  effortRatio: number;
  taskSuccess: boolean;
  maxSteps: number;
  stepCount: number;
}

export interface BarrierGenome {
  findingId: string;
  findingKind: FindingKind;
  vector: number[]; // 768-dimensional normalized embedding
  magnitude: number;
  timestamp: string;
  context: GenomeContext;
  metadata: {
    title: string;
    trustTier: TrustTier;
    severityScore: number;
    wcagRules: string[];
  };
}

const FINDING_KINDS: FindingKind[] = [
  'keyboard_trap',
  'unreachable_control',
  'silent_state_change',
  'low_kendall_tau',
  'empty_accessible_name',
  'misleading_accessible_name',
  'focus_loss',
  'color_contrast_violation',
  'target_size_violation',
  'axe_violation'
];

const TRUST_TIERS: TrustTier[] = ['proven', 'observed', 'suspected'];
const PERSONA_TYPES: PersonaType[] = ['keyboard', 'screen_reader', 'low_vision', 'mouse_unconstrained'];

const A11Y_KEYWORDS = [
  'trap', 'focus', 'aria', 'silent', 'label', 'contrast', 'name', 'role',
  'announce', 'modal', 'escape', 'tab', 'keyboard', 'screen', 'reader', 'unreachable',
  'error', 'live', 'dialog', 'button', 'input', 'interactive', 'sequence', 'disorientation',
  'ratio', 'mutation', 'loss', 'missing', 'target', 'wcag', 'conformance', 'certificate'
];

/**
 * Fast 32-bit MurmurHash3-inspired hashing for deterministic feature projection
 */
function murmur3_32(str: string, seed: number = 0x9747b28c): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h = Math.imul(h ^ k, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

export class BarrierGenomeEncoder {
  public static readonly DIMENSIONS = 768;

  /**
   * Encodes a single accessibility finding into a normalized 768-dimensional dense vector
   */
  encode(finding: BarrierFinding, context: GenomeContext): BarrierGenome {
    const vec = new Float64Array(BarrierGenomeEncoder.DIMENSIONS);

    // ==========================================
    // BLOCK 1: Structural Dimensions (0 - 191)
    // ==========================================
    let offset = 0;

    // 1. One-hot Finding Kind (10 dims)
    const kindIdx = FINDING_KINDS.indexOf(finding.kind);
    if (kindIdx >= 0) vec[offset + kindIdx] = 1.0;
    offset += 10;

    // 2. One-hot Trust Tier (3 dims)
    const tierIdx = TRUST_TIERS.indexOf(finding.trustTier);
    if (tierIdx >= 0) vec[offset + tierIdx] = 1.0;
    offset += 3;

    // 3. Severity & Interval Features (3 dims)
    vec[offset] = Math.min(1.0, Math.max(0.0, (finding.severityScore || 5.0) / 10.0));
    vec[offset + 1] = Math.min(1.0, Math.max(0.0, (finding.severityInterval?.[0] || 0) / 10.0));
    vec[offset + 2] = Math.min(1.0, Math.max(0.0, (finding.severityInterval?.[1] || 10) / 10.0));
    offset += 3;

    // 4. Selector Structural Complexity (8 dims)
    const selectorStr = String(finding.evidence?.selector || finding.evidence?.targetSelector || '');
    if (selectorStr) {
      vec[offset] = Math.min(1.0, (selectorStr.split('>').length - 1) / 5.0); // Child combinator depth
      vec[offset + 1] = Math.min(1.0, (selectorStr.split(' ').length - 1) / 8.0); // Descendant depth
      vec[offset + 2] = selectorStr.includes('#') ? 1.0 : 0.0; // Has ID
      vec[offset + 3] = Math.min(1.0, (selectorStr.split('.').length - 1) / 4.0); // Class density
      vec[offset + 4] = selectorStr.includes('[') ? 1.0 : 0.0; // Attribute selector
      vec[offset + 5] = selectorStr.includes(':') ? 1.0 : 0.0; // Pseudo selector
      vec[offset + 6] = Math.min(1.0, selectorStr.length / 100.0);
    }
    offset += 8;

    // 5. WCAG Rule Hash Map (64 dims)
    const wcagRules = finding.wcagRules || [];
    for (const rule of wcagRules) {
      const h = murmur3_32(rule) % 64;
      vec[offset + h] = Math.min(1.0, vec[offset + h] + 0.5);
    }
    offset += 64;

    // Pad remaining structural dims up to index 191
    // (offset is now 10 + 3 + 3 + 8 + 64 = 88; leaving 104 dims for tag/role projections)
    const evidenceRole = String(finding.evidence?.role || '');
    if (evidenceRole) {
      const roleHash = murmur3_32(evidenceRole) % 40;
      vec[offset + roleHash] = 0.8;
    }

    // ==========================================
    // BLOCK 2: Semantic Dimensions (192 - 383)
    // ==========================================
    const semanticStart = 192;
    const semanticDims = 192;

    const fullText = `${finding.title || ''} ${finding.summary || ''}`.toLowerCase();
    
    // Accessibility vocabulary frequency match
    A11Y_KEYWORDS.forEach((kw, i) => {
      if (fullText.includes(kw)) {
        vec[semanticStart + i] = 1.0;
      }
    });

    // Character 3-gram and word feature hashing
    const words = fullText.split(/[^a-z0-9_]+/i).filter(w => w.length > 2);
    for (const word of words) {
      const hWord = murmur3_32(word) % semanticDims;
      vec[semanticStart + hWord] = Math.min(1.0, vec[semanticStart + hWord] + 0.25);

      // Substring 3-grams
      for (let i = 0; i < word.length - 2; i++) {
        const tri = word.slice(i, i + 3);
        const hTri = murmur3_32(tri, 0x12345678) % semanticDims;
        vec[semanticStart + hTri] = Math.min(1.0, vec[semanticStart + hTri] + 0.1);
      }
    }

    // ==========================================
    // BLOCK 3: Behavioral Dimensions (384 - 575)
    // ==========================================
    const behaviorStart = 384;
    let bOffset = behaviorStart;

    // Step index normalized
    const maxSteps = context.maxSteps || 15;
    vec[bOffset] = Math.min(1.0, finding.stepIdx / maxSteps);
    bOffset += 1;

    // Trap certificate metrics
    if (finding.certificate) {
      vec[bOffset] = 1.0; // Has certificate
      const cycleLen = finding.certificate.cycleNodes?.length || 0;
      vec[bOffset + 1] = Math.min(1.0, cycleLen / 10.0);
      const seqLen = finding.certificate.reproducingKeySequence?.length || 0;
      vec[bOffset + 2] = Math.min(1.0, seqLen / 12.0);
      vec[bOffset + 3] = finding.certificate.testedEscape ? 1.0 : 0.0;
    }
    bOffset += 4;

    // Announcement Gap certificate metrics
    if (finding.gapCertificate) {
      vec[bOffset] = 1.0;
      const cat = finding.gapCertificate.category;
      if (cat === 'inline_form_error') vec[bOffset + 1] = 1.0;
      else if (cat === 'toast_notification') vec[bOffset + 2] = 1.0;
      else if (cat === 'loading_spinner') vec[bOffset + 3] = 1.0;

      const deltaLen = finding.gapCertificate.visualDelta?.textContent?.length || 0;
      vec[bOffset + 4] = Math.min(1.0, deltaLen / 200.0);
      vec[bOffset + 5] = finding.gapCertificate.assistiveSilence?.focusStationary ? 1.0 : 0.0;
    }
    bOffset += 6;

    // Binary evidence flags
    if (finding.evidence?.focusMoved) vec[bOffset] = 1.0;
    if (finding.evidence?.activeNameChanged) vec[bOffset + 1] = 1.0;
    if (finding.evidence?.tau !== undefined) {
      vec[bOffset + 2] = Math.max(-1.0, Math.min(1.0, finding.evidence.tau));
    }
    bOffset += 3;

    // ==========================================
    // BLOCK 4: Contextual Dimensions (576 - 767)
    // ==========================================
    const contextStart = 576;
    const contextDims = 192;
    let cOffset = contextStart;

    // 1. Persona One-Hot (4 dims)
    const personaIdx = PERSONA_TYPES.indexOf(context.persona);
    if (personaIdx >= 0) vec[cOffset + personaIdx] = 1.0;
    cOffset += 4;

    // 2. Effort Ratio & Task Success (2 dims)
    vec[cOffset] = Math.min(1.0, (context.effortRatio || 1.0) / 10.0);
    vec[cOffset + 1] = context.taskSuccess ? 1.0 : 0.0;
    cOffset += 2;

    // 3. Goal Text Hash Projections (64 dims)
    const goalWords = (context.goal || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    for (const gw of goalWords) {
      const gh = murmur3_32(gw, 0xaabbccdd) % 64;
      vec[cOffset + gh] = Math.min(1.0, vec[cOffset + gh] + 0.3);
    }
    cOffset += 64;

    // 4. Target URL Domain Hash Projections (32 dims)
    try {
      const domain = new URL(context.targetUrl || 'http://localhost').hostname;
      const dh = murmur3_32(domain, 0x55667788) % 32;
      vec[cOffset + dh] = 1.0;
    } catch {
      // Fallback
    }

    // ==========================================
    // L2 Normalization
    // ==========================================
    let sumSquares = 0;
    for (let i = 0; i < BarrierGenomeEncoder.DIMENSIONS; i++) {
      sumSquares += vec[i] * vec[i];
    }
    const magnitude = Math.sqrt(sumSquares) || 1.0;

    const normalizedVector = new Array(BarrierGenomeEncoder.DIMENSIONS);
    let normSumSquares = 0;
    for (let i = 0; i < BarrierGenomeEncoder.DIMENSIONS; i++) {
      const val = Math.round((vec[i] / magnitude) * 10000) / 10000;
      normalizedVector[i] = val;
      normSumSquares += val * val;
    }
    const normalizedMagnitude = Math.round(Math.sqrt(normSumSquares) * 1000) / 1000;

    return {
      findingId: finding.id,
      findingKind: finding.kind,
      vector: normalizedVector,
      magnitude: normalizedMagnitude || 1.0,
      timestamp: new Date().toISOString(),
      context,
      metadata: {
        title: finding.title,
        trustTier: finding.trustTier,
        severityScore: finding.severityScore,
        wcagRules: finding.wcagRules
      }
    };
  }

  /**
   * Computes cosine similarity between two BarrierGenomes: dot(a, b) / (|a| * |b|)
   * Since vectors are unit-normalized, this is strictly the dot product.
   */
  similarity(a: BarrierGenome, b: BarrierGenome): number {
    let dot = 0;
    const len = Math.min(a.vector.length, b.vector.length);
    for (let i = 0; i < len; i++) {
      dot += a.vector[i] * b.vector[i];
    }
    return Math.max(0, Math.min(1.0, Math.round(dot * 10000) / 10000));
  }

  /**
   * Encodes all findings in an entire AuditRun
   */
  encodeRun(run: AuditRun): BarrierGenome[] {
    const context: GenomeContext = {
      goal: run.goal,
      persona: run.persona,
      targetUrl: run.targetUrl,
      effortRatio: run.effortRatio || 1.0,
      taskSuccess: run.taskSuccess || false,
      maxSteps: run.steps?.length || 15,
      stepCount: run.steps?.length || 0
    };

    return run.findings.map(finding => this.encode(finding, context));
  }
}
