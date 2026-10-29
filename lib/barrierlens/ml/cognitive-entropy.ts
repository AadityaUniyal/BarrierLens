export interface CognitiveEntropyMetrics {
  auditoryBufferEntropy: number; // in nats/bits
  disorientationScore: number; // 0 to 10
  informationDisparity: number; // KL-Divergence estimate
  cognitiveLoadLevel: 'optimal' | 'moderate' | 'excessive' | 'overwhelming';
  analysis: string;
}

/**
 * Information-Theoretic Cognitive Load & Sensory Disparity Model
 * Quantifies cognitive friction caused by fragmented auditory buffers and unannounced mutations.
 */
export class CognitiveEntropyModel {
  calculateEntropy(
    spokenTokens: string[],
    unannouncedMutationsCount: number,
    focusDisplacementPixels: number
  ): CognitiveEntropyMetrics {
    // 1. Calculate Shannon entropy over announced vocabulary distribution
    const freqMap = new Map<string, number>();
    for (const token of spokenTokens) {
      const word = token.toLowerCase();
      freqMap.set(word, (freqMap.get(word) || 0) + 1);
    }

    const totalWords = spokenTokens.length || 1;
    let entropy = 0;
    for (const count of freqMap.values()) {
      const p = count / totalWords;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    // 2. Compute Information Disparity penalty based on unannounced mutations
    const informationDisparity = Math.round((unannouncedMutationsCount * 1.8 + (focusDisplacementPixels > 400 ? 1.5 : 0.2)) * 10) / 10;

    // 3. Overall Disorientation Score (0.0 to 10.0)
    let score = Math.min(10.0, Math.round((informationDisparity * 1.4 + Math.min(entropy, 4.0)) * 10) / 10);

    let level: CognitiveEntropyMetrics['cognitiveLoadLevel'] = 'optimal';
    if (score >= 7.5) level = 'overwhelming';
    else if (score >= 5.5) level = 'excessive';
    else if (score >= 3.5) level = 'moderate';

    return {
      auditoryBufferEntropy: Math.round(entropy * 100) / 100,
      disorientationScore: score,
      informationDisparity,
      cognitiveLoadLevel: level,
      analysis: `Sensory Channel Analysis: Disorientation ${score}/10 (${level.toUpperCase()}). ` +
        (unannouncedMutationsCount > 0 
          ? `Disparity triggered by ${unannouncedMutationsCount} unannounced DOM mutations causing auditory buffer desynchronization.`
          : `Auditory stream remains synchronized with DOM state.`)
    };
  }
}
