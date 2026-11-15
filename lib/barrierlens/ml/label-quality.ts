export interface LabelQualityResult {
  isAdequate: boolean;
  confidence: number;
  label: string;
  cosineToBadAnchor?: number;
  worstAnchor?: string;
  contextRelevance?: number;
  explanation?: string;
  source: 'gpu_minilm' | 'heuristic_fallback';
}

/**
 * M1: Classifies accessible name adequacy and detects synthetic/low-information corruptions.
 * Uses CUDA-accelerated all-MiniLM-L6-v2 embeddings when backend is available,
 * with deterministic fallback to robust syntactic patterns.
 */
export class LabelQualityClassifier {
  private backendUrl: string;

  constructor(backendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000') {
    this.backendUrl = backendUrl;
  }

  async classifyNameAsync(
    role: string,
    name: string,
    surroundingText: string = ''
  ): Promise<LabelQualityResult> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ml/label-quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, name, surroundingText }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          source: 'gpu_minilm',
        };
      }
    } catch {
      // Backend offline or timeout -> proceed with fallback
    }

    return this.heuristicFallback(role, name);
  }

  /**
   * Synchronous signature for backward compatibility with synchronous callers.
   */
  classifyName(role: string, name: string): { isAdequate: boolean; confidence: number; label: string } {
    const res = this.heuristicFallback(role, name);
    return {
      isAdequate: res.isAdequate,
      confidence: res.confidence,
      label: res.label,
    };
  }

  private heuristicFallback(role: string, name: string): LabelQualityResult {
    const text = (name || '').trim().toLowerCase();

    if (!text) {
      return {
        isAdequate: false,
        confidence: 0.99,
        label: 'empty',
        cosineToBadAnchor: 1.0,
        source: 'heuristic_fallback',
        explanation: 'Empty accessible name.'
      };
    }

    // Corrupted or synthetic placeholders
    const badPatterns = [
      /^btn_?/i,
      /^img_?\d+/i,
      /^icon_?/i,
      /^button$/i,
      /^click here$/i,
      /^untitled$/i,
      /^link$/i,
      /^[0-9]+$/
    ];

    if (badPatterns.some(p => p.test(text))) {
      return {
        isAdequate: false,
        confidence: 0.95,
        label: 'corrupted_or_generic',
        cosineToBadAnchor: 0.95,
        source: 'heuristic_fallback',
        explanation: `Matches generic or corrupted placeholder pattern.`
      };
    }

    if (text.length < 2 && role !== 'link') {
      return {
        isAdequate: false,
        confidence: 0.88,
        label: 'too_short',
        source: 'heuristic_fallback',
        explanation: 'Accessible name length is insufficient.'
      };
    }

    return {
      isAdequate: true,
      confidence: 0.94,
      label: 'adequate',
      source: 'heuristic_fallback',
      explanation: 'Accessible name meets length and informativeness criteria.'
    };
  }
}
