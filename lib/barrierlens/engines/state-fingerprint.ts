import crypto from 'node:crypto';

export interface CompositeFingerprint {
  hash: string;
  urlNormalized: string;
  domSimhash: string; // 64-bit binary string
  axTreeHash: string;
  phash: string; // 64-bit perceptual hash binary string
  interactiveCount: number;
  timestamp: number;
}

export interface StateDistanceMetrics {
  domHammingDistance: number;
  phashHammingDistance: number;
  axTreeMatch: boolean;
  urlMatch: boolean;
  compositeSimilarity: number; // 0.0 - 1.0 (1.0 = identical)
  shouldMerge: boolean;
}

export class ProductionStateFingerprintEngine {
  private readonly simhashThreshold: number = 6; // Max hamming distance (out of 64) to consider structurally identical
  private readonly phashThreshold: number = 10;  // Max perceptual visual hash distance

  /**
   * 1. URL Normalization: strip tracking query params, session IDs, collapse numeric IDs
   */
  normalizeUrl(rawUrl: string): string {
    try {
      const u = new URL(rawUrl);
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid', 'fbclid', 'session_id'];
      trackingParams.forEach(p => u.searchParams.delete(p));
      
      // Collapse trailing dynamic numeric slugs /orders/123951 -> /orders/:id
      let pathname = u.pathname.replace(/\/\d+(?=\/|$)/g, '/:id');
      u.pathname = pathname;
      u.hash = '';
      return u.toString();
    } catch {
      return rawUrl;
    }
  }

  /**
   * 2. 64-bit SimHash of DOM tag structure (strips attributes, text, and volatile dynamic scripts)
   */
  computeDomSimHash(domHtml: string): string {
    // Extract ordered tag names only: e.g. ["div", "header", "nav", "ul", "li", "button"]
    const tags = Array.from(domHtml.matchAll(/<([a-z0-9]+)(?:>|\s)/gi)).map(m => m[1].toLowerCase());
    if (tags.length === 0) return '0'.repeat(64);

    const v = new Array(64).fill(0);

    for (let i = 0; i < tags.length; i++) {
      // 3-gram tag tokens for structural context
      const token = tags.slice(i, i + 3).join('-');
      const hash = crypto.createHash('md5').update(token).digest();

      for (let bit = 0; bit < 64; bit++) {
        const byteIndex = Math.floor(bit / 8);
        const bitIndex = bit % 8;
        const isSet = (hash[byteIndex] & (1 << bitIndex)) !== 0;
        v[bit] += isSet ? 1 : -1;
      }
    }

    return v.map(weight => (weight > 0 ? '1' : '0')).join('');
  }

  /**
   * 3. 64-bit Perceptual Hash (pHash) simulation on downscaled screenshot or visual layout bounding boxes
   */
  computeLayoutPHash(layoutBoxes: Array<{ x: number; y: number; width: number; height: number }>): string {
    if (!layoutBoxes || layoutBoxes.length === 0) return '0'.repeat(64);

    // 8x8 spatial density matrix
    const grid = new Array(64).fill(0);
    const viewportWidth = 1280;
    const viewportHeight = 800;

    for (const box of layoutBoxes) {
      const col = Math.min(7, Math.max(0, Math.floor((box.x / viewportWidth) * 8)));
      const row = Math.min(7, Math.max(0, Math.floor((box.y / viewportHeight) * 8)));
      const idx = row * 8 + col;
      grid[idx] += Math.round(box.width * box.height / 100);
    }

    const mean = grid.reduce((a, b) => a + b, 0) / 64;
    return grid.map(val => (val >= mean ? '1' : '0')).join('');
  }

  /**
   * Compute complete 4-factor composite fingerprint
   */
  computeCompositeFingerprint(
    url: string,
    axTreeSerialized: string,
    domHtml: string = '',
    layoutBoxes: Array<{ x: number; y: number; width: number; height: number }> = [],
    interactiveCount: number = 0
  ): CompositeFingerprint {
    const urlNormalized = this.normalizeUrl(url);
    const axTreeHash = crypto.createHash('sha256').update(axTreeSerialized.trim()).digest('hex').slice(0, 24);
    const domSimhash = this.computeDomSimHash(domHtml);
    const phash = this.computeLayoutPHash(layoutBoxes);

    // Master SHA-256 state key
    const masterPayload = `${urlNormalized}::${axTreeHash}::${domSimhash}::${phash}`;
    const hash = crypto.createHash('sha256').update(masterPayload).digest('hex').slice(0, 32);

    return {
      hash,
      urlNormalized,
      domSimhash,
      axTreeHash,
      phash,
      interactiveCount,
      timestamp: Date.now()
    };
  }

  /**
   * Helper to capture composite fingerprint directly from a Playwright Page
   */
  async captureFromPage(page: any): Promise<CompositeFingerprint> {
    try {
      const url = page.url();
      const data = await page.evaluate(() => {
        const dom = document.body ? document.body.innerHTML.slice(0, 50000) : '';
        const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [tabindex="0"], [role="button"]'));
        const boxes = elements.slice(0, 30).map(el => {
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
        });
        return { dom, boxes, interactiveCount: elements.length };
      });
      return this.computeCompositeFingerprint(url, data.dom.slice(0, 1000), data.dom, data.boxes, data.interactiveCount);
    } catch {
      return this.computeCompositeFingerprint(page.url ? page.url() : 'http://localhost', 'ax_fallback');
    }
  }

  /**
   * Compute Hamming distance between two 64-bit binary strings
   */
  hammingDistance(binA: string, binB: string): number {
    let dist = 0;
    const len = Math.min(binA.length, binB.length);
    for (let i = 0; i < len; i++) {
      if (binA[i] !== binB[i]) dist++;
    }
    return dist;
  }

  /**
   * Distance and state equivalence comparator
   */
  compareStates(stateA: CompositeFingerprint, stateB: CompositeFingerprint): StateDistanceMetrics {
    const urlMatch = stateA.urlNormalized === stateB.urlNormalized;
    const axTreeMatch = stateA.axTreeHash === stateB.axTreeHash;
    const domHammingDistance = this.hammingDistance(stateA.domSimhash, stateB.domSimhash);
    const phashHammingDistance = this.hammingDistance(stateA.phash, stateB.phash);

    // Normalized similarity (0 to 1)
    const domSimScore = 1.0 - (domHammingDistance / 64);
    const visualSimScore = 1.0 - (phashHammingDistance / 64);
    const axSimScore = axTreeMatch ? 1.0 : 0.0;

    const compositeSimilarity = Math.round(
      ((urlMatch ? 0.3 : 0.0) + (axSimScore * 0.35) + (domSimScore * 0.2) + (visualSimScore * 0.15)) * 100
    ) / 100;

    // Merge decision: same normalized URL and (identical AX tree OR within SimHash and pHash threshold)
    const shouldMerge = urlMatch && (
      axTreeMatch ||
      (domHammingDistance <= this.simhashThreshold && phashHammingDistance <= this.phashThreshold)
    );

    return {
      domHammingDistance,
      phashHammingDistance,
      axTreeMatch,
      urlMatch,
      compositeSimilarity,
      shouldMerge
    };
  }
}
