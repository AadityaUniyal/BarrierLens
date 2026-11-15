export interface VisualAffordanceResult {
  selector: string;
  detectedIconType?: 'trash' | 'cart' | 'search' | 'menu' | 'close' | 'arrow' | 'unknown';
  accessibleName: string;
  hasSemanticContradiction: boolean;
  confidence: number;
  explanation: string;
  source?: 'gpu_clip' | 'heuristic_fallback';
  topLabel?: string;
  scores?: Record<string, number>;
}

/**
 * Visual-Semantic Affordance Mismatch Detector
 * Evaluates whether an icon's visual metaphor contradicts its programmatic accessible name.
 * Uses CLIP ViT-B/32 zero-shot image classification when element screenshot is available,
 * with deterministic SVG/CSS structural analysis as fallback.
 */
export class VisualAffordanceEngine {
  private backendUrl: string;

  constructor(backendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000') {
    this.backendUrl = backendUrl;
  }

  async evaluateScreenshotAffordance(
    selector: string,
    accessibleName: string,
    screenshotBase64: string,
    candidateLabels?: string[]
  ): Promise<VisualAffordanceResult> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ml/visual-affordance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot_b64: screenshotBase64,
          accessible_name: accessibleName,
          candidate_labels: candidateLabels || [
            accessibleName,
            'trash', 'delete', 'cart', 'search', 'close', 'save', 'submit'
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          selector,
          accessibleName,
          hasSemanticContradiction: data.hasSemanticContradiction,
          confidence: data.topScore,
          explanation: data.hasSemanticContradiction
            ? `CLIP Zero-Shot detected visual icon matches '${data.topLabel}' (score: ${data.topScore}) but programmatic name is '${accessibleName}'.`
            : `Visual icon matches expected semantic context (top classification: '${data.topLabel}').`,
          source: 'gpu_clip',
          topLabel: data.topLabel,
          scores: data.scores,
        };
      }
    } catch {
      // Backend offline -> continue with fallback
    }

    return this.evaluateIconAffordance(selector, accessibleName, '');
  }

  evaluateIconAffordance(
    selector: string,
    accessibleName: string,
    svgOrHtmlSnippet: string
  ): VisualAffordanceResult {
    const text = (accessibleName || '').toLowerCase().trim();
    const snippet = (svgOrHtmlSnippet || '').toLowerCase();

    // Icon heuristic detection from SVG path signatures or icon classes
    let detectedIcon: VisualAffordanceResult['detectedIconType'] = 'unknown';

    if (snippet.includes('trash') || snippet.includes('delete') || snippet.includes('remove') || snippet.includes('bin')) {
      detectedIcon = 'trash';
    } else if (snippet.includes('cart') || snippet.includes('basket') || snippet.includes('shopping')) {
      detectedIcon = 'cart';
    } else if (snippet.includes('search') || snippet.includes('magnif') || snippet.includes('glass')) {
      detectedIcon = 'search';
    } else if (snippet.includes('close') || snippet.includes('cross') || snippet.includes('times')) {
      detectedIcon = 'close';
    }

    if (detectedIcon === 'unknown') {
      return {
        selector,
        accessibleName,
        hasSemanticContradiction: false,
        confidence: 0.5,
        explanation: 'No conflicting visual icon affordance detected.',
        source: 'heuristic_fallback',
      };
    }

    // Check for contradictory semantics
    let contradiction = false;
    let explanation = '';

    if (detectedIcon === 'trash' && (text.includes('save') || text.includes('submit') || text.includes('add') || text.includes('buy'))) {
      contradiction = true;
      explanation = `Severe Visual-Semantic Contradiction: Visual icon is a destructive 'trash/delete' metaphor, but accessible name is "${accessibleName}".`;
    } else if (detectedIcon === 'close' && (text.includes('open') || text.includes('confirm') || text.includes('submit'))) {
      contradiction = true;
      explanation = `Visual-Semantic Contradiction: Visual icon is a 'close/dismiss' cross, but accessible name is "${accessibleName}".`;
    } else if (detectedIcon === 'cart' && text.includes('search')) {
      contradiction = true;
      explanation = `Visual-Semantic Contradiction: Visual icon is a 'shopping cart', but accessible name is "${accessibleName}".`;
    }

    return {
      selector,
      detectedIconType: detectedIcon,
      accessibleName,
      hasSemanticContradiction: contradiction,
      confidence: contradiction ? 0.92 : 0.65,
      explanation: contradiction ? explanation : `Visual icon affordance '${detectedIcon}' appears aligned with function.`,
      source: 'heuristic_fallback',
    };
  }
}
