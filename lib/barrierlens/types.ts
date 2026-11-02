export type PersonaType = 'keyboard' | 'screen_reader' | 'low_vision' | 'mouse_unconstrained';

export type TrustTier = 'proven' | 'observed' | 'suspected';

export type FindingKind = 
  | 'keyboard_trap'
  | 'unreachable_control'
  | 'silent_state_change'
  | 'low_kendall_tau'
  | 'empty_accessible_name'
  | 'misleading_accessible_name'
  | 'focus_loss'
  | 'color_contrast_violation'
  | 'target_size_violation'
  | 'axe_violation';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FocusNode {
  id: string; // generated ID or selector
  selector: string;
  tagName: string;
  role: string;
  accessibleName: string;
  tabIndex: number;
  box: BoundingBox;
  isModal: boolean;
  isInert: boolean;
  backendDOMNodeId?: number;
  isVirtualDescendant?: boolean;
  parentCompositeRole?: string;
  parentCompositeSelector?: string;
}

export interface FocusEdge {
  fromId: string;
  toId: string;
  key: 'Tab' | 'Shift+Tab' | 'ArrowDown' | 'ArrowUp' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' | 'PageUp' | 'PageDown' | 'Escape' | 'Enter' | 'Space';
  modifiers?: ('Shift' | 'Control' | 'Alt')[];
  timestamp: number;
  latencyMs?: number;
  isDefaultPrevented?: boolean;
}

export interface TrapCertificate {
  detected: boolean;
  trapType: 'sink_scc' | 'modal_deadlock' | 'focus_loss' | 'unreachable_control';
  componentNodeIds: string[];
  entryNodeId: string;
  reproducingKeySequence: string[]; // e.g. ['Tab', 'Tab', 'Tab']
  keySequence: string[]; // Backwards compatibility alias
  cycleNodes: string[];
  cycleTransitions: Array<{ from: string; key: string; to: string }>;
  testedEscape: boolean;
  escapeResult?: 'ignored' | 'focus_lost_to_body' | 'escaped_to_trigger' | string;
  unreachableNodeCount?: number;
  unreachableNodeIds?: string[];
  proofExplanation: string;
  timestamp: string;
}

export interface KendallTauMetric {
  tau: number; // -1 to 1 (1 = perfect visual-to-focus match, < 0.6 = disorienting)
  focusOrder: string[];
  visualOrder: string[];
  inversionCount: number;
  totalPairs: number;
  concordantCount: number;
  discordantCount: number;
  concordantPairs?: number;
  discordantPairs?: number;
  isAcceptable: boolean;
  explanation: string;
}

export interface TraversalOptions {
  maxSteps?: number;
  stepDelayMs?: number;
  exploreCompositeWidgets?: boolean;
  probeShiftTab?: boolean;
  rootSelector?: string;
  detectLoss?: boolean;
}

export interface UnreachableControlFinding {
  nodeId: string;
  backendDOMNodeId?: number;
  role: string;
  accessibleName: string;
  selector: string;
  reason: 'negative_tabindex' | 'not_in_tab_order' | 'dom_disconnected' | 'blocked_by_trap' | string;
}

export interface FocusLossFinding {
  detected: boolean;
  elementBefore: string;
  elementAfter: string;
  triggerKey?: string;
  actionDescription?: string;
  timestamp: string;
  proofExplanation: string;
}

export interface AnnouncementEvent {
  timestamp: number;
  type: 'live_region' | 'focus_change' | 'title_change' | 'alert';
  text: string;
  politeness?: 'polite' | 'assertive';
}

export interface SilentErrorFinding {
  detected: boolean;
  visualDeltaText: string;
  announcementReceived: boolean;
  targetSelector?: string;
  evidence: string;
}

// ---------------------------------------------------------------------------
// Week 4 Announcement-Gap Detector & Assistive Silence Interfaces (Milestone 1)
// ---------------------------------------------------------------------------

export type SilentGapCategory =
  | 'inline_form_error'
  | 'toast_notification'
  | 'loading_spinner'
  | 'generic_silent_change';

export type MissingAnnouncementType =
  | 'live_region'
  | 'focus_shift'
  | 'accessible_name';

export interface VisualMutation {
  type: 'added' | 'text' | 'attribute' | 'visibility';
  tag: string;
  tagName?: string;
  selector?: string;
  text: string;
  isLive: boolean;
  rect?: { x: number; y: number; width: number; height: number };
  backendNodeId?: number;
  id?: string;
  className?: string;
  styleDisplay?: string;
  parentSelector?: string;
  subType?: string;
  attributeName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  becameVisible?: boolean;
}

export interface AnnouncedChange {
  focusMoved: boolean;
  previousActiveElement?: { tagName?: string; id?: string; selector?: string };
  currentActiveElement?: { tagName?: string; id?: string; selector?: string };
  announcements: Array<{
    text: string;
    politeness: 'polite' | 'assertive';
    timestamp: number;
    role?: string | null;
  }>;
  nameChanged?: boolean;
  previousActiveName?: string;
  currentActiveName?: string;
}

export interface AnnouncementGapCertificate {
  id: string; // UUID v4
  timestamp: string; // ISO-8601
  trustTier: 'proven';
  proofHash: string; // SHA-256 hex digest
  category: SilentGapCategory;
  actionTrigger: {
    stepIdx: number;
    actionType: 'click' | 'press_key' | 'submit' | 'type_text';
    targetSelector: string;
    targetTagName?: string;
    backendNodeId?: number;
    key?: string;
    timestamp: number;
    reproducingActionTrace?: Array<{
      action: 'click' | 'press' | 'fill';
      selector: string;
      value?: string;
    }>;
  };
  visualDelta: {
    selector: string;
    tagName: string;
    backendNodeId?: number;
    textContent: string;
    mutationType: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
      top?: number;
      left?: number;
      bottom?: number;
      right?: number;
    };
    styleDiff?: {
      property: string;
      before: string;
      after: string;
    };
  };
  assistiveSilence: {
    focusStationary: boolean;
    focusMovedToContext: boolean;
    focusBefore: {
      selector: string;
      tagName?: string;
      id?: string;
      backendNodeId?: number;
    };
    focusAfter: {
      selector: string;
      tagName?: string;
      id?: string;
      backendNodeId?: number;
    };
    announcementsCount: number;
    announcementsReceived: Array<{
      text: string;
      politeness: 'polite' | 'assertive';
      timestamp: number;
      targetSelector?: string;
    }>;
    liveRegionEvaluated?: {
      isLiveRegion: boolean;
      containerSelector?: string | null;
      role?: string | null;
      ariaLive?: string | null;
      ariaAtomic?: boolean;
    };
    focusedNameUnchanged: boolean;
    focusedNameBefore?: string;
    focusedNameAfter?: string;
    silenceWitnessProof: string;
  };
  wcagMapping: {
    rules: string[];
    criteria: string[];
    conformanceLevel?: 'Level A' | 'Level AA';
  };
  reproducingKeySequence: string[];
  keySequence: string[];
  proofExplanation: string;
  remediationAdvice: string;
  suggestedPatchSnippet?: string;
}

export interface SilentGapFinding {
  detected: boolean;
  category: SilentGapCategory;
  evidence: string;
  visualMutation: VisualMutation;
  missingAnnouncementType: MissingAnnouncementType;
  wcagCriteria: string[];
  remediationAdvice?: string;
  confidenceScore?: number;
  certificate?: AnnouncementGapCertificate;
  // Backwards compatibility properties matching SilentErrorFinding
  visualDeltaText: string;
  announcementReceived: boolean;
  targetSelector?: string;
}

export interface ActionStep {
  idx: number;
  persona: PersonaType;
  actionType: 'press_key' | 'type_text' | 'wait' | 'click_unconstrained';
  key?: string;
  text?: string;
  targetSelector?: string;
  tier: 0 | 1 | 2 | 3; // 0=Rule, 1=Ranker, 2=Groq, 3=Gemini
  activeElementBefore?: string;
  activeElementAfter?: string;
  timestamp: number;
  screenshot?: string;
  reasoning?: string;
}

export interface BarrierFinding {
  id: string;
  runId: string;
  stepIdx: number;
  kind: FindingKind;
  trustTier: TrustTier;
  wcagRules: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityScore: number; // 0.0 - 10.0
  severityInterval: [number, number]; // Conformal prediction 80% coverage interval [lo, hi]
  title: string;
  summary: string;
  evidence: Record<string, any>;
  certificate?: TrapCertificate;
  gapCertificate?: AnnouncementGapCertificate;
  patchProposal?: string;
  verifiedFix?: boolean;
}

export interface AuditRun {
  id: string;
  targetUrl: string;
  goal: string;
  persona: PersonaType;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  taskSuccess: boolean;
  effortRatio: number; // (Constrained steps / Unconstrained steps)
  steps: ActionStep[];
  findings: BarrierFinding[];
  kendallTau?: KendallTauMetric;
  tierMix: {
    tier0Rules: number;
    tier1Ranker: number;
    tier2Groq: number;
    tier3Gemini: number;
  };
}

export interface VerifiedFixResult {
  findingId: string;
  originalFindingKind: FindingKind;
  patch: string;
  verified: boolean;
  replayTaskSuccess: boolean;
  regressionCount: number;
  diffSummary: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// W3C Accessible Name & Provenance Engine Types (Milestone 1)
// ---------------------------------------------------------------------------

export type AccNameTraversalSource = 'direct' | 'labelledby' | 'contents' | 'embedded_control';

export interface ProvenanceStep {
  step: string; // e.g. "2A", "2B", "2C", "2D", "2E", "2F", "2G"
  description: string;
  matched: boolean;
  source?: 'aria-labelledby' | 'aria-label' | 'native-label' | 'contents' | 'title' | 'placeholder' | 'none';
  yieldedText?: string;
  diagnostic?: string; // e.g. "no aria-label, no text content", "image has no alt", "parent link wraps only an icon", "aria-labelledby refers to missing ID"
  candidateSource?: string;
  status?: 'matched' | 'skipped' | 'empty' | 'missing_ref' | 'loop_prevented' | 'pruned';
  explanation?: string;
  elementSelector?: string;
}

export interface AccNameProvenanceStep {
  step: '2A' | '2B' | '2C' | '2D' | '2E' | '2F' | '2I';
  source: 'aria-labelledby' | 'aria-label' | 'native-markup' | 'subtree-contents' | 'title' | 'hidden-check';
  candidateText?: string;
  evaluated: boolean;
  success: boolean;
  reason?: string;
  referencedIds?: string[];
  missingIds?: string[];
}

export type DiagnosticCode =
  | 'MISSING_LABEL_NO_SOURCES'
  | 'UNLABELED_ICON_ONLY'
  | 'BROKEN_ARIA_LABELLEDBY'
  | 'GENERIC_NON_DESCRIPTIVE'
  | 'EMPTY_IMAGE_NO_ALT'
  | 'SUPERSEDED_NAME'
  | 'NAME_PROHIBITED_ON_ELEMENT'
  | 'EMPTY_ACCESSIBLE_NAME'
  | 'UNLABELED_ICON'
  | 'IMAGE_MISSING_ALT'
  | 'MISSING_LABELLEDBY_TARGET'
  | 'EMPTY_LABELLEDBY_TARGET'
  | 'LABEL_WRAPS_ONLY_ICON'
  | 'PLACEHOLDER_ONLY_LABEL'
  | 'REDUNDANT_ROLE_IN_NAME'
  | 'GENERIC_NON_DESCRIPTIVE_NAME'
  | 'LABEL_IN_NAME_MISMATCH';

export interface AccNameDiagnostic {
  code: DiagnosticCode;
  severity: 'low' | 'medium' | 'high' | 'critical';
  wcagRules?: string[];
  message: string;
  remedy?: string;
  remediationAdvice?: string;
}

export interface AccNameResult {
  name: string;
  source: string;
  steps: ProvenanceStep[];
  diagnostics: string[];
  isPoorOrEmpty: boolean;
  remediationAdvice?: string;
  detailedDiagnostics?: AccNameDiagnostic[];
  elementSelector?: string;
  role?: string;
}

export type ComparisonStatus =
  | 'EXACT_MATCH'
  | 'CASE_INSENSITIVE_MATCH'
  | 'SUBSET_MATCH'
  | 'CUSTOM_FOUND_CDP_EMPTY'
  | 'CDP_FOUND_CUSTOM_EMPTY'
  | 'VALUE_MISMATCH';

export interface AccNameCDPComparison {
  w3cName: string;
  cdpName: string;
  agreement: boolean;
  discrepancyReason?: string;
  status?: ComparisonStatus;
  agreementRate?: number;
  selector?: string;
  backendDOMNodeId?: number;
  provenanceTrace?: ProvenanceStep[];
}

export interface AccNameEvaluation {
  selector: string;
  role: string;
  computedName: string;
  provenanceTree: AccNameProvenanceStep[];
  winningSource?: AccNameProvenanceStep;
  diagnostic?: AccNameDiagnostic;
  cdpComparison?: {
    cdpName: string;
    agrees: boolean;
    discrepancyCode?: 'MATCH' | 'DISAGREEMENT' | 'CDP_EMPTY' | 'ENGINE_EMPTY';
    details?: string;
  };
  // Backwards compatibility fields
  elementSelector?: string;
  isAdequate?: boolean;
  reason?: 'missing_label' | 'non_descriptive_placeholder' | 'unlabeled_icon' | 'good' | string;
  provenanceExplanation: string;
  steps?: ProvenanceStep[];
  diagnostics?: string[];
}

// ---------------------------------------------------------------------------
// Static WCAG 2.2 Checks Interfaces (Milestone 2)
// ---------------------------------------------------------------------------

export interface ContrastResult {
  selector: string;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number; // 1.0 to 21.0
  fontSizePx: number;
  isLargeText: boolean;
  passesAA: boolean; // >= 4.5:1 (or 3.0:1 for large)
  passesAAA: boolean; // >= 7.0:1 (or 4.5:1 for large)
  indeterminate?: boolean;
}

export interface TargetSizeResult {
  selector: string;
  width: number;
  height: number;
  passesBaseSize: boolean; // >= 24x24 px
  passesSpacingException: boolean; // 24px diameter clearance circle without neighbor intersection
  isInlineException: boolean;
  compliant: boolean;
  closestNeighborDistancePx?: number;
}

// ---------------------------------------------------------------------------
// axe-core Baseline Runner Interface (Milestone 2)
// ---------------------------------------------------------------------------

export interface AxeEvaluationResult {
  ruleId: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: {
    target: string[];
    html: string;
    failureSummary: string;
  }[];
}


