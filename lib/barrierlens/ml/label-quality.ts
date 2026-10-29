export class LabelQualityClassifier {
  /**
   * M1: Classifies accessible name adequacy and detects synthetic/low-information corruptions.
   */
  classifyName(role: string, name: string): { isAdequate: boolean; confidence: number; label: string } {
    const text = (name || '').trim().toLowerCase();

    if (!text) {
      return { isAdequate: false, confidence: 0.99, label: 'empty' };
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
      return { isAdequate: false, confidence: 0.95, label: 'corrupted_or_generic' };
    }

    if (text.length < 2 && role !== 'link') {
      return { isAdequate: false, confidence: 0.88, label: 'too_short' };
    }

    return { isAdequate: true, confidence: 0.94, label: 'adequate' };
  }
}
