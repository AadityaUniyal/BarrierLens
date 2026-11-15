/**
 * BarrierLens Visual Text Recovery & Screen Reader Silence Engine (M5)
 * Detects visual text burned into canvas, icons, image-buttons, or raster elements
 * that assistive technology cannot perceive due to missing programmatic labels.
 */

export interface VisualTextAnalysisResult {
  extractedText: string;
  hasDiscrepancy: boolean;
  suggestedLabel: string;
  confidence: number;
  explanation: string;
  source: 'python_ocr_gpu' | 'client_heuristic';
}

export class VisualTextRecoveryClient {
  private backendUrl: string;

  constructor(backendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000') {
    this.backendUrl = backendUrl;
  }

  async analyzeVisualText(
    screenshotB64: string,
    computedName: string = '',
    role: string = 'button'
  ): Promise<VisualTextAnalysisResult> {
    try {
      const res = await fetch(`${this.backendUrl}/api/ml/visual-text-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot_b64: screenshotB64,
          computed_name: computedName,
          role
        }),
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const data = await res.json();
        return {
          extractedText: data.extractedText || '',
          hasDiscrepancy: !!data.hasDiscrepancy,
          suggestedLabel: data.suggestedLabel || '',
          confidence: data.confidence ?? 0.85,
          explanation: data.explanation || '',
          source: 'python_ocr_gpu'
        };
      }
    } catch {
      // Fallback
    }

    // Client-side fallback heuristic when backend is offline
    const isGenericOrEmpty = !computedName || ['button', 'icon', 'link', 'submit'].includes(computedName.toLowerCase().trim());
    return {
      extractedText: '',
      hasDiscrepancy: isGenericOrEmpty,
      suggestedLabel: isGenericOrEmpty ? 'Action button' : computedName,
      confidence: 0.6,
      explanation: isGenericOrEmpty ? 'Element lacks programmatic name, potential visual silence' : '',
      source: 'client_heuristic'
    };
  }
}
