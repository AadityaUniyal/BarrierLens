export interface VisualAffordanceResult {
  selector: string;
  detectedIconType?: 'trash' | 'cart' | 'search' | 'menu' | 'close' | 'arrow' | 'unknown';
  accessibleName: string;
  hasSemanticContradiction: boolean;
  confidence: number;
  explanation: string;
}

/**
 * Visual-Semantic Affordance Mismatch Detector
 * Evaluates whether an icon's visual metaphor contradicts its programmatic accessible name.
 */
export class VisualAffordanceEngine {
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
        explanation: 'No conflicting visual icon affordance detected.'
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
      confidence: contradiction ? 0.96 : 0.85,
      explanation: contradiction ? explanation : `Visual icon (${detectedIcon}) matches accessible name semantics.`
    };
  }
}
