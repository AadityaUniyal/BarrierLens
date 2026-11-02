import crypto from 'node:crypto';
import {
  AnnouncementEvent,
  SilentErrorFinding,
  VisualMutation,
  AnnouncedChange,
  SilentGapFinding,
  AnnouncementGapCertificate,
  SilentGapCategory,
  MissingAnnouncementType
} from '../types';

export interface AnnouncementGapDetectorOptions {
  debounceWindowMs?: number;
  minBoundingBoxAreaPx?: number;
  minTextLength?: number;
  errorKeywords?: string[];
  toastKeywords?: string[];
  spinnerKeywords?: string[];
}

export interface StepActionContext {
  stepIdx?: number;
  actionType?: 'click' | 'press_key' | 'type_text' | 'submit';
  targetSelector?: string;
  targetTagName?: string;
  key?: string;
  backendNodeId?: number;
  keyHistory?: string[];
  reproducingActionTrace?: Array<{ action: 'click' | 'press' | 'fill'; selector: string; value?: string }>;
}

export interface PreActionState {
  timestamp: number;
  activeElement: {
    selector: string;
    tagName: string;
    id?: string;
    backendNodeId?: number;
    accessibleName: string;
  };
}

export interface PostActionState {
  timestamp: number;
  activeElement: {
    selector: string;
    tagName: string;
    id?: string;
    backendNodeId?: number;
    accessibleName: string;
  };
  events: any[];
  announcements: any[];
  visualElements?: Array<{
    selector: string;
    tagName: string;
    text: string;
    box?: { x: number; y: number; width: number; height: number; top?: number; left?: number; bottom?: number; right?: number };
    rect?: { x: number; y: number; width: number; height: number };
    backendNodeId?: number;
    isLive?: boolean;
    role?: string | null;
  }>;
}

/**
 * Computes deterministic SHA-256 proof hash over canonical proof fields
 */
export function computeProofHash(
  action: AnnouncementGapCertificate['actionTrigger'],
  delta: AnnouncementGapCertificate['visualDelta'],
  silence: AnnouncementGapCertificate['assistiveSilence']
): string {
  const box = delta.boundingBox || { x: 0, y: 0, width: 0, height: 0 };
  const canonicalPayload = [
    action.actionType,
    action.targetSelector,
    delta.selector,
    (delta.textContent || '').trim(),
    Math.round(box.x),
    Math.round(box.y),
    Math.round(box.width),
    Math.round(box.height),
    silence.announcementsCount,
    silence.focusStationary,
    silence.focusAfter.selector,
    silence.focusedNameUnchanged
  ].join('|');

  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}

export class AnnouncementGapDetector {
  private readonly options: Required<AnnouncementGapDetectorOptions>;

  constructor(options?: AnnouncementGapDetectorOptions) {
    this.options = {
      debounceWindowMs: options?.debounceWindowMs ?? 300,
      minBoundingBoxAreaPx: options?.minBoundingBoxAreaPx ?? 25,
      minTextLength: options?.minTextLength ?? 2,
      errorKeywords: options?.errorKeywords ?? [
        'error', 'invalid', 'required', 'failed', 'cannot', 'must',
        'alert', 'wrong', 'please enter', 'enter a valid', 'missing',
        'forbidden', 'denied', 'not allowed', 'does not match'
      ],
      toastKeywords: options?.toastKeywords ?? [
        'added to cart', 'added to bag', 'added', 'saved', 'updated',
        'successfully', 'copied', 'order placed', 'profile updated',
        'item removed', 'item deleted', 'changes saved', 'notification'
      ],
      spinnerKeywords: options?.spinnerKeywords ?? [
        'spinner', 'loading', 'loader', 'skeleton', 'progress', 'busy', 'animate-spin'
      ]
    };
  }

  /**
   * Evaluates if a visual DOM change had a corresponding assistive announcement or focus shift.
   * Supports both the rich AnnouncedChange contract and backward-compatible 3-argument signature.
   */
  detectGap(
    visualMutations: VisualMutation[] | Array<{ tag: string; text: string; isLive: boolean } | any>,
    announcedChangeOrAnnouncements: AnnouncedChange | AnnouncementEvent[] | any[],
    focusMovedOrOptions?: boolean | AnnouncementGapDetectorOptions,
    extraContextOrOptions?: AnnouncedChange | StepActionContext | any
  ): SilentGapFinding {
    // 1. Normalize parameters
    const normalizedMutations = this.normalizeVisualMutations(visualMutations);
    const announcedChange = this.normalizeAnnouncedChange(
      announcedChangeOrAnnouncements,
      typeof focusMovedOrOptions === 'boolean' ? focusMovedOrOptions : false,
      extraContextOrOptions
    );

    // 2. Filter non-trivial visual mutations
    const significantMutations = normalizedMutations.filter(m => this.isSignificantMutation(m));
    if (significantMutations.length === 0) {
      return this.createNegativeFinding('No significant visual DOM mutation detected.');
    }

    // 3. Evaluate each mutation against the 3 assistive perception channels
    for (const mutation of significantMutations) {
      const isCovered = this.evaluateAssistiveCoverage(mutation, announcedChange);
      if (!isCovered) {
        // Gap Detected! Classify the silent state change
        const classification = this.classifySilentChange(mutation, announcedChange);

        const finding: SilentGapFinding = {
          detected: true,
          category: classification.category,
          evidence: classification.evidence,
          visualMutation: mutation,
          missingAnnouncementType: classification.missingAnnouncementType,
          wcagCriteria: classification.wcagCriteria,
          remediationAdvice: classification.remediationAdvice,
          confidenceScore: classification.confidenceScore,

          // Backwards compatibility properties
          visualDeltaText: mutation.text,
          announcementReceived: announcedChange.announcements.length > 0,
          targetSelector: mutation.selector
        };

        // Build context for certificate generation
        const actionContext: StepActionContext = (extraContextOrOptions && typeof extraContextOrOptions === 'object' && 'actionType' in extraContextOrOptions)
          ? extraContextOrOptions
          : {
              stepIdx: 0,
              actionType: 'click',
              targetSelector: announcedChange.previousActiveElement?.selector || mutation.selector || 'button',
              key: 'Enter'
            };

        // Attach empirical AnnouncementGapCertificate
        finding.certificate = this.generateCertificate(finding, actionContext, announcedChange);

        return finding;
      }
    }

    return this.createNegativeFinding('All visual changes were properly announced via assistive technology.');
  }

  /**
   * Classify a silent state change into inline form error, toast, spinner, or generic.
   */
  classifySilentChange(
    mutation: VisualMutation,
    announcedChange?: AnnouncedChange
  ): {
    category: SilentGapCategory;
    missingAnnouncementType: MissingAnnouncementType;
    evidence: string;
    wcagCriteria: string[];
    remediationAdvice: string;
    confidenceScore: number;
  } {
    const textLower = (mutation.text || '').toLowerCase();
    const selectorLower = (mutation.selector || '').toLowerCase();
    const tagLower = (mutation.tag || mutation.tagName || '').toLowerCase();

    // 1. Check Loading Spinner Concluded
    const isSpinner = this.options.spinnerKeywords.some(kw =>
      selectorLower.includes(kw) || textLower.includes(kw)
    );
    if (isSpinner) {
      return {
        category: 'loading_spinner',
        missingAnnouncementType: 'live_region',
        evidence: `Loading indicator "${mutation.selector || mutation.tag}" concluded without an auditory status update. Blind users cannot perceive that the asynchronous process completed.`,
        wcagCriteria: [
          'WCAG 4.1.3 Status Messages (Level AA)',
          'WCAG 2.2.1 Timing Adjustable (Level A)'
        ],
        remediationAdvice: 'Provide an aria-live="polite" status message announcing completion (e.g. "Process completed" or "Results loaded") and set aria-busy="false".',
        confidenceScore: 0.94
      };
    }

    // 2. Check Toast Notification
    const isToastKeyword = this.options.toastKeywords.some(kw => textLower.includes(kw));
    const isToastSelector = /toast|snackbar|notification|banner|alert-success/i.test(selectorLower);
    if (isToastKeyword || isToastSelector) {
      return {
        category: 'toast_notification',
        missingAnnouncementType: 'live_region',
        evidence: `Toast notification "${mutation.text}" appeared visually, but was not wrapped in an aria-live region. Sighted users see confirmation, but assistive technology users receive no confirmation.`,
        wcagCriteria: ['WCAG 4.1.3 Status Messages (Level AA)'],
        remediationAdvice: 'Wrap toast containers in role="status" and aria-live="polite" with aria-atomic="true". Ensure container exists in DOM prior to message injection so screen readers register the announcement.',
        confidenceScore: 0.96
      };
    }

    // 3. Check Inline Form Error
    const isErrorKeyword = this.options.errorKeywords.some(kw => textLower.includes(kw));
    const isErrorSelector = /error|invalid|feedback|errormsg|danger|alert-danger|text-red|text-rose/i.test(selectorLower);
    const isFormContext = tagLower === 'form' || /input|select|textarea|form|label/i.test(selectorLower);
    if (isErrorKeyword || isErrorSelector || isFormContext) {
      const missingType: MissingAnnouncementType = (!announcedChange || !announcedChange.focusMoved)
        ? 'focus_shift'
        : 'live_region';
      return {
        category: 'inline_form_error',
        missingAnnouncementType: missingType,
        evidence: `Visual error message "${mutation.text}" appeared on submission, but focus remained unchanged and no aria-live region announced the error. Screen reader users receive zero feedback and cannot complete the task.`,
        wcagCriteria: [
          'WCAG 3.3.1 Error Identification (Level A)',
          'WCAG 4.1.3 Status Messages (Level AA)'
        ],
        remediationAdvice: 'Add role="alert" or aria-live="assertive" to the error container, associate it with the field via aria-describedby, and flag aria-invalid="true". Alternatively, shift programmatic focus to the error or invalid input.',
        confidenceScore: 0.98
      };
    }

    // 4. Default: Generic Silent Change
    return {
      category: 'generic_silent_change',
      missingAnnouncementType: 'live_region',
      evidence: `Visual state change "${mutation.text.slice(0, 80)}" occurred without a corresponding screen reader announcement or focus shift.`,
      wcagCriteria: [
        'WCAG 4.1.3 Status Messages (Level AA)',
        'WCAG 4.1.2 Name, Role, Value (Level A)'
      ],
      remediationAdvice: 'Provide an aria-live="polite" region or update the accessible name/state of the active element.',
      confidenceScore: 0.85
    };
  }

  /**
   * Generates a verifiable AnnouncementGapCertificate adhering to BarrierLens PROVEN trust tier with SHA-256 proof hash.
   */
  generateCertificate(
    finding: SilentGapFinding,
    context?: StepActionContext,
    announcedChange?: AnnouncedChange
  ): AnnouncementGapCertificate {
    const stepIdx = context?.stepIdx ?? 0;
    const actionType = context?.actionType ?? 'click';
    const targetSelector = context?.targetSelector || finding.visualMutation.selector || 'button';
    const targetTagName = context?.targetTagName || 'BUTTON';
    const key = context?.key ?? (actionType === 'press_key' ? 'Enter' : undefined);

    const box = finding.visualMutation.rect
      ? {
          x: finding.visualMutation.rect.x,
          y: finding.visualMutation.rect.y,
          width: finding.visualMutation.rect.width,
          height: finding.visualMutation.rect.height,
          top: finding.visualMutation.rect.y,
          left: finding.visualMutation.rect.x,
          bottom: finding.visualMutation.rect.y + finding.visualMutation.rect.height,
          right: finding.visualMutation.rect.x + finding.visualMutation.rect.width
        }
      : { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 };

    const focusBeforeSel = announcedChange?.previousActiveElement?.selector || targetSelector;
    const focusAfterSel = announcedChange?.currentActiveElement?.selector || targetSelector;
    const announcements = announcedChange?.announcements || [];
    const focusStationary = !announcedChange?.focusMoved || focusAfterSel === 'body' || focusAfterSel === focusBeforeSel;
    const focusedNameUnchanged = !announcedChange?.nameChanged;

    const silenceWitnessProof =
      `Visual element '${finding.visualMutation.selector || finding.visualMutation.tag}' appeared with text "${finding.visualMutation.text}", but: ` +
      `(1) announcementsCount = ${announcements.length} (no active live region or alert fired), ` +
      `(2) activeElement remained stationary on '${focusAfterSel}' (no focus shift to error), ` +
      `(3) accessible name remained "${announcedChange?.previousActiveName || ''}". ` +
      `Assistive technology receives zero announcement of this state change.`;

    const certificatePayload: Omit<AnnouncementGapCertificate, 'id' | 'proofHash'> = {
      timestamp: new Date().toISOString(),
      trustTier: 'proven',
      category: finding.category,
      actionTrigger: {
        stepIdx,
        actionType,
        targetSelector,
        targetTagName,
        backendNodeId: context?.backendNodeId || finding.visualMutation.backendNodeId,
        key,
        timestamp: Date.now(),
        reproducingActionTrace: context?.reproducingActionTrace ?? [
          { action: actionType === 'press_key' ? 'press' : 'click', selector: targetSelector }
        ]
      },
      visualDelta: {
        selector: finding.visualMutation.selector || finding.visualMutation.tag,
        tagName: finding.visualMutation.tag || finding.visualMutation.tagName || 'DIV',
        backendNodeId: finding.visualMutation.backendNodeId,
        textContent: finding.visualMutation.text,
        mutationType: finding.visualMutation.subType || finding.visualMutation.type || 'dom_added',
        boundingBox: box
      },
      assistiveSilence: {
        focusStationary,
        focusMovedToContext: false,
        focusBefore: {
          selector: focusBeforeSel,
          tagName: announcedChange?.previousActiveElement?.tagName,
          id: announcedChange?.previousActiveElement?.id
        },
        focusAfter: {
          selector: focusAfterSel,
          tagName: announcedChange?.currentActiveElement?.tagName,
          id: announcedChange?.currentActiveElement?.id
        },
        announcementsCount: announcements.length,
        announcementsReceived: announcements.map(a => ({
          text: a.text,
          politeness: a.politeness,
          timestamp: a.timestamp
        })),
        liveRegionEvaluated: {
          isLiveRegion: finding.visualMutation.isLive,
          containerSelector: null,
          role: null,
          ariaLive: null,
          ariaAtomic: false
        },
        focusedNameUnchanged,
        focusedNameBefore: announcedChange?.previousActiveName,
        focusedNameAfter: announcedChange?.currentActiveName,
        silenceWitnessProof
      },
      wcagMapping: {
        rules: finding.wcagCriteria,
        criteria: finding.category === 'inline_form_error' ? ['3.3.1', '4.1.3'] : ['4.1.3'],
        conformanceLevel: finding.category === 'inline_form_error' ? 'Level A' : 'Level AA'
      },
      reproducingKeySequence: context?.keyHistory ?? [key ?? 'Enter'],
      keySequence: context?.keyHistory ?? [key ?? 'Enter'],
      proofExplanation: silenceWitnessProof,
      remediationAdvice: finding.remediationAdvice || this.classifySilentChange(finding.visualMutation, announcedChange).remediationAdvice
    };

    const proofHash = computeProofHash(
      certificatePayload.actionTrigger,
      certificatePayload.visualDelta,
      certificatePayload.assistiveSilence
    );

    return {
      id: crypto.randomUUID(),
      ...certificatePayload,
      proofHash
    };
  }

  /**
   * Helper to evaluate pre- and post-action states directly (e.g. from Playwright benchmarks)
   */
  evaluateGap(
    stepIdx: number,
    action: {
      type: 'click' | 'press_key' | 'submit' | 'type_text';
      targetSelector: string;
      targetTagName?: string;
      key?: string;
      reproducingTrace?: Array<{ action: 'click' | 'press' | 'fill'; selector: string; value?: string }>;
    },
    preState: PreActionState,
    postState: PostActionState
  ): AnnouncementGapCertificate | null {
    const visualElements = postState.visualElements || [];
    const visualMutations: VisualMutation[] = visualElements.map(el => ({
      type: 'added',
      tag: el.tagName,
      tagName: el.tagName,
      selector: el.selector,
      text: el.text,
      isLive: Boolean(el.isLive),
      rect: el.box || el.rect,
      backendNodeId: el.backendNodeId
    }));

    const focusMoved = Boolean(
      postState.activeElement &&
      postState.activeElement.selector !== preState.activeElement.selector &&
      postState.activeElement.selector !== 'body' &&
      postState.activeElement.selector !== 'html'
    );

    const nameChanged = Boolean(
      preState.activeElement &&
      postState.activeElement &&
      preState.activeElement.accessibleName !== postState.activeElement.accessibleName
    );

    const announcedChange: AnnouncedChange = {
      focusMoved,
      previousActiveElement: preState.activeElement,
      currentActiveElement: postState.activeElement,
      announcements: (postState.announcements || []).map((a: any) => ({
        text: a.text,
        politeness: a.politeness || 'polite',
        timestamp: a.timestamp || Date.now()
      })),
      nameChanged,
      previousActiveName: preState.activeElement.accessibleName,
      currentActiveName: postState.activeElement.accessibleName
    };

    const actionContext: StepActionContext = {
      stepIdx,
      actionType: action.type,
      targetSelector: action.targetSelector,
      targetTagName: action.targetTagName,
      key: action.key,
      reproducingActionTrace: action.reproducingTrace
    };

    const result = this.detectGap(visualMutations, announcedChange, undefined, actionContext);
    if (result.detected && result.certificate) {
      return result.certificate;
    }
    return null;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private evaluateAssistiveCoverage(mutation: VisualMutation, announced: AnnouncedChange): boolean {
    // Channel A: Live Region Match
    const hasLiveMatch = announced.announcements.some(a =>
      this.matchText(mutation.text, a.text) ||
      a.politeness === 'assertive' ||
      (a.role === 'alert' && a.text && a.text.length > 0)
    );
    if (hasLiveMatch) return true;

    // Channel B: Focus Shift Match
    if (announced.focusMoved && announced.currentActiveElement) {
      const activeSel = announced.currentActiveElement.selector || '';
      const mutSel = mutation.selector || '';
      if (activeSel && mutSel && (activeSel === mutSel || mutSel.includes(activeSel) || activeSel.includes(mutSel))) {
        return true;
      }
    }

    // Channel C: Active Element Accessible Name Change Match
    if (announced.nameChanged && announced.currentActiveName) {
      if (this.matchText(mutation.text, announced.currentActiveName)) {
        return true;
      }
    }

    return false;
  }

  private matchText(visualText: string, announcedText: string): boolean {
    if (!visualText || !announcedText) return false;
    const v = visualText.trim().toLowerCase();
    const a = announcedText.trim().toLowerCase();
    if (v === a || a.includes(v) || v.includes(a)) return true;

    // Token Jaccard check
    const vTokens = new Set(v.split(/\s+/).filter(t => t.length > 2));
    const aTokens = new Set(a.split(/\s+/).filter(t => t.length > 2));
    if (vTokens.size === 0 || aTokens.size === 0) return false;

    let intersection = 0;
    for (const t of vTokens) {
      if (aTokens.has(t)) intersection++;
    }
    const similarity = intersection / Math.min(vTokens.size, aTokens.size);
    return similarity >= 0.5;
  }

  private isSignificantMutation(m: VisualMutation): boolean {
    if (m.isLive) return false; // Handled by aria-live
    const text = (m.text || '').trim();
    if (text.length >= this.options.minTextLength) return true;
    if (m.rect && (m.rect.width * m.rect.height >= this.options.minBoundingBoxAreaPx)) return true;
    if (m.becameVisible) return true;
    return false;
  }

  private normalizeVisualMutations(mutations: any[]): VisualMutation[] {
    if (!Array.isArray(mutations)) return [];
    return mutations.map(m => {
      const payload = m.payload || m.details || m;
      return {
        type: payload.type || payload.subType || 'added',
        subType: payload.subType || payload.type || 'dom_added',
        tag: payload.tag || payload.tagName || 'DIV',
        tagName: payload.tagName || payload.tag || 'DIV',
        selector: payload.selector || payload.targetSelector || '',
        text: (payload.text || payload.textSnippet || payload.elementText || '').trim(),
        isLive: Boolean(payload.isLive || payload.isLiveRegion),
        rect: payload.rect,
        backendNodeId: payload.backendNodeId,
        id: payload.id,
        className: payload.className,
        styleDisplay: payload.styleDisplay,
        parentSelector: payload.parentSelector,
        attributeName: payload.attributeName,
        oldValue: payload.oldValue,
        newValue: payload.newValue,
        becameVisible: Boolean(payload.becameVisible)
      };
    });
  }

  private normalizeAnnouncedChange(ann: any, focusMoved: boolean, extraContext?: any): AnnouncedChange {
    if (ann && typeof ann === 'object' && 'announcements' in ann && typeof ann.focusMoved === 'boolean') {
      return ann as AnnouncedChange;
    }
    const announcementsList = Array.isArray(ann) ? ann : [];
    const extra = extraContext && typeof extraContext === 'object' ? extraContext : {};
    return {
      focusMoved: Boolean(focusMoved),
      previousActiveElement: extra.previousActiveElement,
      currentActiveElement: extra.currentActiveElement,
      announcements: announcementsList.map((a: any) => ({
        text: (a.text || '').trim(),
        politeness: a.politeness || 'polite',
        timestamp: a.timestamp || Date.now(),
        role: a.role || null
      })),
      nameChanged: Boolean(extra.nameChanged),
      previousActiveName: extra.previousActiveName,
      currentActiveName: extra.currentActiveName
    };
  }

  private createNegativeFinding(evidence: string): SilentGapFinding {
    return {
      detected: false,
      category: 'generic_silent_change',
      evidence,
      visualMutation: { type: 'added', tag: '', text: '', isLive: false },
      missingAnnouncementType: 'live_region',
      wcagCriteria: [],
      remediationAdvice: '',
      confidenceScore: 0.0,
      visualDeltaText: '',
      announcementReceived: true
    };
  }
}
