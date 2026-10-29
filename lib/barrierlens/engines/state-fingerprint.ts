import crypto from 'node:crypto';

export interface StateFingerprint {
  hash: string;
  urlNormalized: string;
  axTreeHash: string;
  domStructureHash: string;
  interactiveCount: number;
}

/**
 * State Identity & Deduplication Engine:
 * Computes composite fingerprint so dynamic pages avoid infinite loops during exploration.
 */
export class StateFingerprintEngine {
  computeFingerprint(
    url: string,
    axTreeSerialized: string,
    domSnippet: string = '',
    interactiveCount: number = 0
  ): StateFingerprint {
    // 1. Normalize URL (strip tracking params and fragments)
    let urlNormalized = url;
    try {
      const u = new URL(url);
      u.searchParams.delete('utm_source');
      u.searchParams.delete('utm_medium');
      u.searchParams.delete('utm_campaign');
      u.searchParams.delete('ref');
      u.hash = '';
      urlNormalized = u.toString();
    } catch {
      // fallback
    }

    // 2. Hash of AX-tree roles and names
    const axTreeHash = crypto.createHash('sha256').update(axTreeSerialized).digest('hex').slice(0, 16);

    // 3. Structure SimHash (strip attributes and text, keep tag skeleton)
    const tagSkeleton = domSnippet
      .replace(/<([a-z0-9]+)[^>]*>/gi, '<$1>')
      .replace(/[^<>\/]/g, '')
      .slice(0, 2000);

    const domStructureHash = crypto.createHash('md5').update(tagSkeleton).digest('hex').slice(0, 16);

    // Composite fingerprint
    const composite = `${urlNormalized}::${axTreeHash}::${domStructureHash}`;
    const hash = crypto.createHash('sha256').update(composite).digest('hex').slice(0, 24);

    return {
      hash,
      urlNormalized,
      axTreeHash,
      domStructureHash,
      interactiveCount
    };
  }

  isStateEquivalent(fpA: StateFingerprint, fpB: StateFingerprint): boolean {
    if (fpA.hash === fpB.hash) return true;
    if (fpA.urlNormalized === fpB.urlNormalized && fpA.axTreeHash === fpB.axTreeHash) return true;
    return false;
  }
}
