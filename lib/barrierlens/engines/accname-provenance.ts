export interface AccNameEvaluation {
  elementSelector: string;
  role: string;
  computedName: string;
  isAdequate: boolean;
  reason: 'missing_label' | 'non_descriptive_placeholder' | 'unlabeled_icon' | 'good';
  provenanceExplanation: string;
}

export class AccNameProvenanceEngine {
  evaluateName(selector: string, role: string, name: string, innerHtmlSnippet: string = ''): AccNameEvaluation {
    const trimmed = (name || '').trim();

    if (!trimmed) {
      const isIconOnly = innerHtmlSnippet.includes('<svg') || innerHtmlSnippet.includes('<i');
      return {
        elementSelector: selector,
        role,
        computedName: '',
        isAdequate: false,
        reason: isIconOnly ? 'unlabeled_icon' : 'missing_label',
        provenanceExplanation: isIconOnly
          ? `Interactive ${role} element contains only an SVG icon with no accessible name (missing aria-label, aria-labelledby, or svg title).`
          : `Interactive ${role} has no accessible name. It will be announced as an empty control.`
      };
    }

    const nonDescriptive = ['button', 'click here', 'more', 'link', 'icon', 'img', 'image', 'submit'];
    if (nonDescriptive.includes(trimmed.toLowerCase())) {
      return {
        elementSelector: selector,
        role,
        computedName: trimmed,
        isAdequate: false,
        reason: 'non_descriptive_placeholder',
        provenanceExplanation: `Accessible name "${trimmed}" is generic and non-descriptive. It fails to convey purpose or destination out of context (WCAG 2.4.4 / 4.1.2).`
      };
    }

    return {
      elementSelector: selector,
      role,
      computedName: trimmed,
      isAdequate: true,
      reason: 'good',
      provenanceExplanation: `Accessible name computed successfully: "${trimmed}".`
    };
  }
}
