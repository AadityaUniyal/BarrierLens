export type PersonaType = 'keyboard' | 'screen_reader' | 'low_vision' | 'mouse_unconstrained';

export type TrustTier = 'proven' | 'observed' | 'suspected';

export type FindingKind = 
  | 'keyboard_trap'
  | 'unreachable_control'
  | 'silent_state_change'
  | 'low_kendall_tau'
  | 'empty_accessible_name'
  | 'misleading_accessible_name'
  | 'focus_loss';

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
}

export interface FocusEdge {
  fromId: string;
  toId: string;
  key: 'Tab' | 'Shift+Tab' | 'ArrowDown' | 'ArrowUp' | 'Escape' | 'Enter' | 'Space';
  timestamp: number;
}

export interface TrapCertificate {
  detected: boolean;
  trapType: 'sink_scc' | 'modal_deadlock' | 'focus_loss';
  componentNodeIds: string[];
  keySequence: string[]; // e.g. ['Tab', 'Tab', 'Enter', 'Tab x 6']
  proofExplanation: string;
  timestamp: string;
}

export interface KendallTauMetric {
  tau: number; // -1 to 1 (1 = perfect visual-to-focus match, < 0.6 = disorienting)
  focusOrder: string[];
  visualOrder: string[];
  inversionCount: number;
  totalPairs: number;
  isAcceptable: boolean;
  explanation: string;
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
