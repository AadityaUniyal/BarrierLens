'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Terminal, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Compass, 
  Eye, 
  ShieldAlert, 
  Layers, 
  ArrowRight, 
  CornerDownRight, 
  Sparkles, 
  X, 
  ChevronRight, 
  Info, 
  Sliders,
  ExternalLink
} from 'lucide-react';
import { FocusNode, FocusEdge, KendallTauMetric, TrapCertificate } from '@/lib/barrierlens/types';

export interface FocusMapViewProps {
  nodes?: FocusNode[];
  edges?: FocusEdge[];
  kendallTau?: KendallTauMetric;
  trapCertificate?: TrapCertificate | null;
  trapCertificates?: TrapCertificate[];
  unreachableNodes?: FocusNode[];
  focusLossEvents?: any[];
}

type PresetId = 'fixture-a' | 'fixture-b' | 'fixture-c' | 'live';

interface VisualNode {
  id: string;
  selector: string;
  label: string;
  role: string;
  tabIndex: number;
  x: number;
  y: number;
  isTrapped?: boolean;
  isUnreachable?: boolean;
  isFocusLoss?: boolean;
  isModal?: boolean;
  readingOrderRank?: number;
  tabOrderRank?: number;
}

interface VisualEdge {
  fromId: string;
  toId: string;
  key: string;
  isTrapCycle?: boolean;
  isFocusLoss?: boolean;
  isEscapeRestore?: boolean;
}

interface ReplayStep {
  stepIndex: number;
  fromNodeId?: string;
  toNodeId: string;
  keyDispatched: string;
  description: string;
  isViolation?: boolean;
}

// Built-in Pre-computed Presets
const PRESET_FIXTURE_A = {
  id: 'fixture-a' as PresetId,
  title: 'Fixture A: Keyboard Trap (Sink SCC)',
  subtitle: 'Modal dialog sink SCC trap with cyclic Tab transitions and disabled Escape handler',
  tau: 0.85,
  inversions: 1,
  concordantPairs: 9,
  concordantCount: 9,
  discordantCount: 1,
  totalPairs: 10,
  isAcceptable: true,
  nodes: [
    { id: 'open-modal-trigger', selector: '#open-modal-trigger', label: 'Open Promo Modal', role: 'button', tabIndex: 0, x: 130, y: 100, readingOrderRank: 1, tabOrderRank: 1 },
    { id: 'promo-input', selector: '#promo-input', label: 'Promo Code Input', role: 'textbox', tabIndex: 0, x: 380, y: 200, isTrapped: true, isModal: true, readingOrderRank: 2, tabOrderRank: 2 },
    { id: 'promo-apply-btn', selector: '#promo-apply-btn', label: 'Apply Discount', role: 'button', tabIndex: 0, x: 570, y: 200, isTrapped: true, isModal: true, readingOrderRank: 3, tabOrderRank: 3 },
    { id: 'promo-cancel-btn', selector: '#promo-cancel-btn', label: 'Cancel / Dismiss', role: 'button', tabIndex: 0, x: 475, y: 290, isTrapped: true, isModal: true, readingOrderRank: 4, tabOrderRank: 4 },
    { id: 'footer-terms-link', selector: '#footer-terms-link', label: 'Terms & Conditions', role: 'link', tabIndex: 0, x: 130, y: 380, readingOrderRank: 5, tabOrderRank: 5 },
  ] as VisualNode[],
  edges: [
    { fromId: 'open-modal-trigger', toId: 'promo-input', key: 'Tab' },
    { fromId: 'promo-input', toId: 'promo-apply-btn', key: 'Tab' },
    { fromId: 'promo-apply-btn', toId: 'promo-cancel-btn', key: 'Tab' },
    { fromId: 'promo-cancel-btn', toId: 'promo-input', key: 'Tab', isTrapCycle: true },
    { fromId: 'promo-input', toId: 'promo-cancel-btn', key: 'Shift+Tab', isTrapCycle: true },
  ] as VisualEdge[],
  replaySteps: [
    { stepIndex: 0, toNodeId: 'open-modal-trigger', keyDispatched: 'Initial', description: 'Page loads; initial focus placed on primary trigger' },
    { stepIndex: 1, fromNodeId: 'open-modal-trigger', toNodeId: 'promo-input', keyDispatched: 'Tab', description: 'Focus enters promo dialog onto first input' },
    { stepIndex: 2, fromNodeId: 'promo-input', toNodeId: 'promo-apply-btn', keyDispatched: 'Tab', description: 'Tab advances to Apply Discount button' },
    { stepIndex: 3, fromNodeId: 'promo-apply-btn', toNodeId: 'promo-cancel-btn', keyDispatched: 'Tab', description: 'Tab advances to Cancel button' },
    { stepIndex: 4, fromNodeId: 'promo-cancel-btn', toNodeId: 'promo-input', keyDispatched: 'Tab', description: 'CRITICAL TRAP: Tab cycles back to first input inside closed SCC', isViolation: true },
    { stepIndex: 5, fromNodeId: 'promo-input', toNodeId: 'promo-cancel-btn', keyDispatched: 'Shift+Tab', description: 'CRITICAL TRAP: Shift+Tab reverses to Cancel button, trapped in 3-node cycle', isViolation: true },
    { stepIndex: 6, fromNodeId: 'promo-cancel-btn', toNodeId: 'promo-cancel-btn', keyDispatched: 'Escape', description: 'Escape dispatched; handler suppressed by e.preventDefault(), zero exit edges!', isViolation: true },
  ] as ReplayStep[],
  trapCertificate: {
    detected: true,
    trapType: 'sink_scc' as const,
    componentNodeIds: ['#promo-input', '#promo-apply-btn', '#promo-cancel-btn'],
    entryNodeId: '#promo-input',
    reproducingKeySequence: ['Tab', 'Enter', 'Tab', 'Tab', 'Tab', 'Escape'],
    keySequence: ['Tab', 'Enter', 'Tab', 'Tab', 'Tab', 'Escape'],
    cycleNodes: ['#promo-input', '#promo-apply-btn', '#promo-cancel-btn'],
    cycleTransitions: [
      { from: '#promo-input', key: 'Tab', to: '#promo-apply-btn' },
      { from: '#promo-apply-btn', key: 'Tab', to: '#promo-cancel-btn' },
      { from: '#promo-cancel-btn', key: 'Tab', to: '#promo-input' }
    ],
    testedEscape: true,
    escapeResult: 'ignored',
    proofExplanation: "Tarjan's Strongly Connected Components algorithm isolated sink SCC {#promo-input, #promo-apply-btn, #promo-cancel-btn} having 0 outgoing transitions to the rest of the document. Escape key handler is disabled, making keyboard exit mathematically impossible and violating WCAG 2.1.2 (No Keyboard Trap).",
    timestamp: '2026-10-30T04:25:00.000Z'
  }
};

const PRESET_FIXTURE_B = {
  id: 'fixture-b' as PresetId,
  title: 'Fixture B: Disordered Order & Unreachable',
  subtitle: 'Scrambled positive tabindexes yielding τ = -0.47 < 0.60, plus an orphaned interactive button in AX-tree',
  tau: -0.47,
  inversions: 11,
  concordantPairs: 4,
  concordantCount: 4,
  discordantCount: 11,
  totalPairs: 15,
  isAcceptable: false,
  nodes: [
    { id: 'field-first-name', selector: '#field-first-name', label: 'First Name (tabindex=3)', role: 'textbox', tabIndex: 3, x: 140, y: 110, readingOrderRank: 1, tabOrderRank: 3 },
    { id: 'field-last-name', selector: '#field-last-name', label: 'Last Name (tabindex=5)', role: 'textbox', tabIndex: 5, x: 380, y: 110, readingOrderRank: 2, tabOrderRank: 5 },
    { id: 'field-email', selector: '#field-email', label: 'Email (tabindex=2)', role: 'textbox', tabIndex: 2, x: 620, y: 110, readingOrderRank: 3, tabOrderRank: 2 },
    { id: 'field-phone', selector: '#field-phone', label: 'Phone (tabindex=6)', role: 'textbox', tabIndex: 6, x: 140, y: 230, readingOrderRank: 4, tabOrderRank: 6 },
    { id: 'field-city', selector: '#field-city', label: 'City (tabindex=4)', role: 'textbox', tabIndex: 4, x: 380, y: 230, readingOrderRank: 5, tabOrderRank: 4 },
    { id: 'field-zip', selector: '#field-zip', label: 'Zip Code (tabindex=1)', role: 'textbox', tabIndex: 1, x: 620, y: 230, readingOrderRank: 6, tabOrderRank: 1 },
    { id: 'orphaned-export-btn', selector: '#orphaned-export-btn', label: 'Export Audit Log', role: 'button', tabIndex: -1, x: 380, y: 350, isUnreachable: true, readingOrderRank: 7, tabOrderRank: -1 },
  ] as VisualNode[],
  edges: [
    { fromId: 'field-zip', toId: 'field-email', key: 'Tab' },
    { fromId: 'field-email', toId: 'field-first-name', key: 'Tab' },
    { fromId: 'field-first-name', toId: 'field-city', key: 'Tab' },
    { fromId: 'field-city', toId: 'field-last-name', key: 'Tab' },
    { fromId: 'field-last-name', toId: 'field-phone', key: 'Tab' },
  ] as VisualEdge[],
  replaySteps: [
    { stepIndex: 0, toNodeId: 'field-zip', keyDispatched: 'Initial', description: 'Tab jumps directly to tabindex=1 in bottom-right corner' },
    { stepIndex: 1, fromNodeId: 'field-zip', toNodeId: 'field-email', keyDispatched: 'Tab', description: 'Tab leaps vertically upward to tabindex=2 (Email)', isViolation: true },
    { stepIndex: 2, fromNodeId: 'field-email', toNodeId: 'field-first-name', keyDispatched: 'Tab', description: 'Tab leaps horizontally across row to tabindex=3 (First Name)', isViolation: true },
    { stepIndex: 3, fromNodeId: 'field-first-name', toNodeId: 'field-city', keyDispatched: 'Tab', description: 'Tab jumps diagonally to tabindex=4 (City)', isViolation: true },
    { stepIndex: 4, fromNodeId: 'field-city', toNodeId: 'field-last-name', keyDispatched: 'Tab', description: 'Tab jumps vertically upward to tabindex=5 (Last Name)', isViolation: true },
    { stepIndex: 5, fromNodeId: 'field-last-name', toNodeId: 'field-phone', keyDispatched: 'Tab', description: 'Tab jumps diagonally across to tabindex=6 (Phone)', isViolation: true },
    { stepIndex: 6, fromNodeId: 'field-phone', toNodeId: 'orphaned-export-btn', keyDispatched: 'Tab', description: 'Button #orphaned-export-btn bypassed! Zero incoming edges from keyboard walk', isViolation: true },
  ] as ReplayStep[],
  trapCertificate: {
    detected: true,
    trapType: 'unreachable_control' as const,
    componentNodeIds: ['#orphaned-export-btn'],
    entryNodeId: '#field-zip',
    reproducingKeySequence: ['Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab'],
    keySequence: ['Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab'],
    cycleNodes: [],
    cycleTransitions: [],
    testedEscape: false,
    unreachableNodeCount: 1,
    unreachableNodeIds: ['#orphaned-export-btn'],
    proofExplanation: "Kendall's tau correlation τ = -0.47 (< 0.60 threshold) proves severe reading order discordance caused by scrambled positive tabindexes (1 to 6) with 11 inversions out of 15 pairs. In addition, interactive control '#orphaned-export-btn' detected in the CDP AX-tree is completely unreachable from all sequential Tab walks.",
    timestamp: '2026-10-30T04:26:00.000Z'
  }
};

const PRESET_FIXTURE_C = {
  id: 'fixture-c' as PresetId,
  title: 'Fixture C: Focus Loss & Accessible Modal',
  subtitle: 'Dynamic node removal dropping focus to body, composite tablist arrow navigation, and intentional modal with Esc dismissal',
  tau: 0.94,
  inversions: 1,
  concordantPairs: 14,
  concordantCount: 14,
  discordantCount: 1,
  totalPairs: 15,
  isAcceptable: true,
  nodes: [
    { id: 'delete-item-btn', selector: '#delete-item-btn', label: 'Delete Item #3', role: 'button', tabIndex: 0, x: 160, y: 90, readingOrderRank: 1, tabOrderRank: 1 },
    { id: 'document-body', selector: 'body', label: 'document.body (Collapsed)', role: 'generic', tabIndex: -1, x: 480, y: 90, isFocusLoss: true, readingOrderRank: 2, tabOrderRank: 2 },
    { id: 'tab-general', selector: '#tab-general', label: 'Tab: General', role: 'tab', tabIndex: 0, x: 180, y: 215, readingOrderRank: 3, tabOrderRank: 3 },
    { id: 'tab-security', selector: '#tab-security', label: 'Tab: Security', role: 'tab', tabIndex: -1, x: 380, y: 215, readingOrderRank: 4, tabOrderRank: 4 },
    { id: 'tab-privacy', selector: '#tab-privacy', label: 'Tab: Privacy', role: 'tab', tabIndex: -1, x: 580, y: 215, readingOrderRank: 5, tabOrderRank: 5 },
    { id: 'open-acc-modal', selector: '#open-acc-modal', label: 'Open Compliant Modal', role: 'button', tabIndex: 0, x: 180, y: 345, readingOrderRank: 6, tabOrderRank: 6 },
    { id: 'modal-close-btn', selector: '#modal-close-btn', label: 'Modal Close Button', role: 'button', tabIndex: 0, x: 500, y: 345, isModal: true, readingOrderRank: 7, tabOrderRank: 7 },
  ] as VisualNode[],
  edges: [
    { fromId: 'delete-item-btn', toId: 'document-body', key: 'Enter', isFocusLoss: true },
    { fromId: 'tab-general', toId: 'tab-security', key: 'ArrowRight' },
    { fromId: 'tab-security', toId: 'tab-privacy', key: 'ArrowRight' },
    { fromId: 'tab-privacy', toId: 'tab-general', key: 'ArrowRight' },
    { fromId: 'open-acc-modal', toId: 'modal-close-btn', key: 'Tab' },
    { fromId: 'modal-close-btn', toId: 'open-acc-modal', key: 'Escape', isEscapeRestore: true },
  ] as VisualEdge[],
  replaySteps: [
    { stepIndex: 0, toNodeId: 'delete-item-btn', keyDispatched: 'Initial', description: 'Focus sits on removable cart item' },
    { stepIndex: 1, fromNodeId: 'delete-item-btn', toNodeId: 'document-body', keyDispatched: 'Enter', description: 'FOCUS LOSS: Element unmounted immediately; focus collapsed to document.body', isViolation: true },
    { stepIndex: 2, fromNodeId: 'document-body', toNodeId: 'tab-general', keyDispatched: 'Tab', description: 'Recovery Tab moves to composite tablist active tab' },
    { stepIndex: 3, fromNodeId: 'tab-general', toNodeId: 'tab-security', keyDispatched: 'ArrowRight', description: 'Composite widget: ArrowRight transitions between ARIA tabs' },
    { stepIndex: 4, fromNodeId: 'tab-security', toNodeId: 'tab-privacy', keyDispatched: 'ArrowRight', description: 'Composite widget: ArrowRight transitions to third tab' },
    { stepIndex: 5, fromNodeId: 'tab-privacy', toNodeId: 'open-acc-modal', keyDispatched: 'Tab', description: 'Tab exits composite tablist and focuses modal trigger' },
    { stepIndex: 6, fromNodeId: 'open-acc-modal', toNodeId: 'modal-close-btn', keyDispatched: 'Enter', description: 'Modal dialog opens, focus constrained inside dialog' },
    { stepIndex: 7, fromNodeId: 'modal-close-btn', toNodeId: 'open-acc-modal', keyDispatched: 'Escape', description: 'Escape key probe: Modal dismissed and focus correctly restored to trigger (0 false positives)' },
  ] as ReplayStep[],
  trapCertificate: {
    detected: true,
    trapType: 'focus_loss' as const,
    componentNodeIds: ['#delete-item-btn', 'BODY'],
    entryNodeId: '#delete-item-btn',
    reproducingKeySequence: ['Tab', 'Enter'],
    keySequence: ['Tab', 'Enter'],
    cycleNodes: [],
    cycleTransitions: [],
    testedEscape: true,
    escapeResult: 'escaped_to_trigger',
    proofExplanation: "Activating '#delete-item-btn' deleted the active element without refocusing a surviving neighbor. Focus collapsed directly to document.body, resetting the screen reader virtual cursor to page top. In contrast, '#accessible-modal' intercepted Escape key and properly restored focus to '#open-acc-modal', passing intentional modal criteria with 0 false positives.",
    timestamp: '2026-10-30T04:27:00.000Z'
  }
};

export function FocusMapView({
  nodes: propNodes,
  edges: propEdges,
  kendallTau: propKendallTau,
  trapCertificate: propTrapCert,
  trapCertificates: propTrapCerts,
  unreachableNodes: propUnreachable,
  focusLossEvents: propFocusLoss,
}: FocusMapViewProps) {
  // Determine if live props exist
  const hasLiveProps = Boolean(
    (propNodes && propNodes.length > 0) || 
    propKendallTau || 
    propTrapCert || 
    (propTrapCerts && propTrapCerts.length > 0)
  );

  // Active Preset State (defaults to Fixture A, or Live if live audit data was passed)
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(
    hasLiveProps ? 'live' : 'fixture-a'
  );

  // Replay Scrubber State
  const [replayStep, setReplayStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step

  // Selected element for inspection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);

  // Active dataset derived from current preset
  const activeDataset = useMemo(() => {
    if (selectedPreset === 'fixture-a') return PRESET_FIXTURE_A;
    if (selectedPreset === 'fixture-b') return PRESET_FIXTURE_B;
    if (selectedPreset === 'fixture-c') return PRESET_FIXTURE_C;

    // Live mode
    const liveTau = propKendallTau?.tau ?? 0.85;
    const liveNodes: VisualNode[] = (propNodes || []).map((n, idx) => {
      // Map bounding box or fallback grid
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      return {
        id: n.id || `node-${idx}`,
        selector: n.selector || `element-${idx}`,
        label: n.accessibleName || n.tagName.toLowerCase(),
        role: n.role || 'element',
        tabIndex: n.tabIndex ?? 0,
        x: n.box ? Math.min(680, Math.max(80, n.box.x + n.box.width / 2)) : 140 + col * 240,
        y: n.box ? Math.min(380, Math.max(60, n.box.y + n.box.height / 2)) : 100 + row * 120,
        isTrapped: propTrapCert?.componentNodeIds?.includes(n.id) || propTrapCert?.componentNodeIds?.includes(n.selector),
        isUnreachable: propUnreachable?.some(u => u.id === n.id || u.selector === n.selector),
        isModal: n.isModal,
        readingOrderRank: idx + 1,
        tabOrderRank: idx + 1
      };
    });

    const liveEdges: VisualEdge[] = (propEdges || []).map(e => ({
      fromId: e.fromId,
      toId: e.toId,
      key: e.key,
      isTrapCycle: propTrapCert?.componentNodeIds?.includes(e.fromId) && propTrapCert?.componentNodeIds?.includes(e.toId)
    }));

    const liveCert = propTrapCert || (propTrapCerts && propTrapCerts[0]) || null;

    return {
      id: 'live' as PresetId,
      title: 'Live Traversal Audit',
      subtitle: liveNodes.length > 0 
        ? `Real-time empirical focus graph from active audit (${liveNodes.length} nodes, ${liveEdges.length} transitions)`
        : 'Awaiting active audit data from studio run',
      tau: liveTau,
      inversions: propKendallTau?.inversionCount ?? 0,
      concordantPairs: (propKendallTau?.totalPairs ?? 10) - (propKendallTau?.inversionCount ?? 0),
      totalPairs: propKendallTau?.totalPairs ?? 10,
      isAcceptable: (propKendallTau?.tau ?? 0.85) >= 0.60,
      nodes: liveNodes,
      edges: liveEdges,
      replaySteps: liveNodes.map((n, idx) => ({
        stepIndex: idx,
        fromNodeId: idx > 0 ? liveNodes[idx - 1].id : undefined,
        toNodeId: n.id,
        keyDispatched: idx === 0 ? 'Initial' : 'Tab',
        description: `Sequential focus onto ${n.label} (${n.role})`,
        isViolation: n.isTrapped || n.isUnreachable
      })),
      trapCertificate: liveCert
    };
  }, [selectedPreset, propNodes, propEdges, propKendallTau, propTrapCert, propTrapCerts, propUnreachable]);

  // Reset replay step when switching preset
  useEffect(() => {
    setReplayStep(0);
    setIsPlaying(false);
    setSelectedNodeId(null);
  }, [selectedPreset]);

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setReplayStep(prev => {
          if (prev >= activeDataset.replaySteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, activeDataset.replaySteps.length]);

  const currentReplay = activeDataset.replaySteps[replayStep] || activeDataset.replaySteps[0];
  const activeFocusNodeId = currentReplay?.toNodeId;

  // Selected node details
  const selectedNode = activeDataset.nodes.find(n => n.id === selectedNodeId) ||
                       activeDataset.nodes.find(n => n.id === activeFocusNodeId) ||
                       activeDataset.nodes[0];

  // Kendall Tau Math & Geometry
  const tau = activeDataset.tau;
  const isHealthy = tau >= 0.60;
  // Normalized tau (-1 to 1 => 0 to 1)
  const normalizedTau = Math.max(0, Math.min(1, (tau + 1.0) / 2.0));
  // 240 deg arc from 150 deg to 390 deg. Radius = 70.
  const arcLength = (240 / 360) * 2 * Math.PI * 70; // ~293.2
  const arcOffset = arcLength * (1 - normalizedTau);

  // Helper to compute smooth SVG bezier paths between two nodes
  const renderEdgePath = (edge: VisualEdge, index: number) => {
    const from = activeDataset.nodes.find(n => n.id === edge.fromId);
    const to = activeDataset.nodes.find(n => n.id === edge.toId);

    if (!from || !to) return null;

    let pathD = '';
    const isSelfLoop = edge.fromId === edge.toId;

    if (isSelfLoop) {
      pathD = `M ${from.x - 20} ${from.y - 25} C ${from.x - 45} ${from.y - 75}, ${from.x + 45} ${from.y - 75}, ${from.x + 20} ${from.y - 25}`;
    } else if (edge.isTrapCycle) {
      // Loop under or over to visually highlight Tarjan SCC cycle
      const midX = (from.x + to.x) / 2;
      const midY = Math.max(from.y, to.y) + 70;
      pathD = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
    } else if (edge.isEscapeRestore) {
      // Curve above for Esc restoration
      const midX = (from.x + to.x) / 2;
      const midY = Math.min(from.y, to.y) - 60;
      pathD = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
    } else {
      // Standard smooth cubic bezier
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const cx1 = from.x + dx * 0.4;
      const cy1 = from.y;
      const cx2 = from.x + dx * 0.6;
      const cy2 = to.y;
      pathD = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
    }

    // Determine color and markers
    let strokeColor = '#0a84ff'; // Apple Blue (Tab)
    let markerId = 'marker-tab';
    let strokeDasharray = 'none';

    if (edge.key === 'Shift+Tab') {
      strokeColor = '#64d2ff'; // Cyan
      markerId = 'marker-shift-tab';
      strokeDasharray = '4 4';
    } else if (edge.key.startsWith('Arrow')) {
      strokeColor = '#bf5af2'; // Purple
      markerId = 'marker-arrow';
      strokeDasharray = '3 3';
    } else if (edge.isEscapeRestore) {
      strokeColor = '#30d158'; // Green
      markerId = 'marker-esc';
      strokeDasharray = '4 2';
    } else if (edge.isTrapCycle) {
      strokeColor = '#ff453a'; // Red
      markerId = 'marker-trap';
    } else if (edge.isFocusLoss) {
      strokeColor = '#ff9f0a'; // Amber
      markerId = 'marker-loss';
      strokeDasharray = '4 4';
    }

    return (
      <g key={`edge-${index}-${edge.fromId}-${edge.toId}`}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={edge.isTrapCycle ? 2.5 : 2}
          strokeDasharray={strokeDasharray}
          markerEnd={`url(#${markerId})`}
          className={edge.isTrapCycle ? 'animate-pulse' : ''}
          opacity={0.85}
        />
      </g>
    );
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Cupertino Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center shadow-md shadow-blue-500/20 ring-hairline ring-white/20">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[26px] font-bold tracking-[-0.02em] text-[#f5f5f7]">
              Focus Map & Kendall's Tau Concordance
            </h2>
          </div>
          <p className="text-[13px] text-[#86868b] tracking-[0.005em] mt-1">
            Empirical physical keyboard traversal graph with Tarjan SCC cycle analysis, unreachable control diffing, and Kendall's τ concordance.
          </p>
        </div>

        {/* Global Concordance & Trap Status Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border-hairline ${
            isHealthy
              ? 'bg-emerald-500/10 text-[#30d158] border-emerald-500/30'
              : 'bg-rose-500/10 text-[#ff453a] border-rose-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-[#30d158]' : 'bg-[#ff453a] animate-ping'}`} />
            τ = {tau >= 0 ? `+${tau.toFixed(2)}` : tau.toFixed(2)} ({isHealthy ? 'CONCORDANT' : 'DISORIENTING'})
          </span>

          {activeDataset.trapCertificate && (
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-[#ff453a] text-xs font-mono font-semibold border-hairline border-rose-500/40 active:scale-[0.98] transition-all duration-150 ease-spring"
            >
              <Lock className="w-3.5 h-3.5 text-[#ff453a]" />
              <span>Trap Certificate Available</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Switcher: Segmented Cupertino Control */}
      <div className="p-1.5 rounded-2xl bg-[#1c1c1e]/80 backdrop-blur-xl border-hairline shadow-inner flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#86868b] px-3 font-semibold">
          Audit Fixtures:
        </span>

        {[
          { id: 'fixture-a', label: 'Fixture A: Keyboard Trap (Sink SCC)' },
          { id: 'fixture-b', label: 'Fixture B: Disordered Order & Unreachable' },
          { id: 'fixture-c', label: 'Fixture C: Focus Loss & Accessible Modal' },
          { id: 'live', label: 'Live Traversal Audit' },
        ].map(preset => {
          const active = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id as PresetId)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 ease-spring flex items-center gap-1.5 ${
                active
                  ? 'bg-[#2c2c2e] text-[#f5f5f7] shadow-sm shadow-black/50 ring-hairline ring-white/15'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
            >
              {preset.id === 'fixture-a' && <Lock className="w-3.5 h-3.5 text-[#ff453a]" />}
              {preset.id === 'fixture-b' && <AlertTriangle className="w-3.5 h-3.5 text-[#ff9f0a]" />}
              {preset.id === 'fixture-c' && <ShieldAlert className="w-3.5 h-3.5 text-[#bf5af2]" />}
              {preset.id === 'live' && <Compass className="w-3.5 h-3.5 text-[#0a84ff]" />}
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtitle description of active preset */}
      <div className="px-1 text-xs text-[#86868b] flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[#0a84ff]" />
        <span>{activeDataset.subtitle}</span>
      </div>

      {/* Main Grid: Interactive 2D Focus Canvas (8 cols) & Kendall Tau Meter (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 2D Focus Graph Canvas */}
        <div className="lg:col-span-8 apple-vibrancy-regular rounded-3xl p-6 border-hairline shadow-2xl space-y-5 flex flex-col justify-between">
          
          {/* Canvas Sub-header & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline text-xs">
            <div className="flex items-center gap-2 text-[#f5f5f7] font-semibold">
              <Layers className="w-4 h-4 text-[#0a84ff]" />
              <span>2D Focus Path Geometry & State Engine</span>
            </div>

            {/* Path Key Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#86868b]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1 rounded-full bg-[#0a84ff]" /> Tab
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1 rounded-full bg-[#64d2ff]" /> Shift+Tab
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1 rounded-full bg-[#bf5af2]" /> Arrow Keys
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1 rounded-full bg-[#ff453a] animate-pulse" /> Tarjan SCC Trap
              </span>
            </div>
          </div>

          {/* Interactive SVG & HTML Node Canvas */}
          <div className="relative w-full h-[440px] bg-gradient-to-b from-[#0a0b10] to-[#040407] rounded-2xl border-hairline overflow-hidden shadow-inner select-none">
            
            {/* Background Retina Grid Lines */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />

            {/* Fixture Boundary Frames (e.g. Modal boundaries) */}
            {selectedPreset === 'fixture-a' && (
              <div 
                className="absolute rounded-2xl border-2 border-dashed border-rose-500/30 bg-rose-950/15 pointer-events-none"
                style={{ left: '260px', top: '135px', width: '450px', height: '215px' }}
              >
                <span className="absolute top-2 left-3 text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-400" />
                  Trap Modal Dialog (#promo-trap-dialog) — 0 Exit Edges
                </span>
              </div>
            )}

            {selectedPreset === 'fixture-c' && (
              <div 
                className="absolute rounded-2xl border border-dashed border-purple-500/30 bg-purple-950/10 pointer-events-none"
                style={{ left: '90px', top: '165px', width: '580px', height: '95px' }}
              >
                <span className="absolute top-2 left-3 text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Composite ARIA Tablist Widget (Arrow Navigation)
                </span>
              </div>
            )}

            {/* SVG Vector Edge Overlay */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 760 440"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Tab marker */}
                <marker id="marker-tab" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#0a84ff" />
                </marker>
                {/* Shift+Tab marker */}
                <marker id="marker-shift-tab" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#64d2ff" />
                </marker>
                {/* Arrow navigation marker */}
                <marker id="marker-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#bf5af2" />
                </marker>
                {/* Trap loop marker */}
                <marker id="marker-trap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#ff453a" />
                </marker>
                {/* Escape restore marker */}
                <marker id="marker-esc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#30d158" />
                </marker>
                {/* Focus Loss marker */}
                <marker id="marker-loss" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#ff9f0a" />
                </marker>
              </defs>

              {/* Render computed curved edges */}
              {activeDataset.edges.map((edge, idx) => renderEdgePath(edge, idx))}
            </svg>

            {/* Interactive HTML Node Cards */}
            {activeDataset.nodes.map((node) => {
              const isActive = node.id === activeFocusNodeId;
              const isSelected = node.id === selectedNodeId;

              // Node styling based on state
              let cardStyle = 'bg-[#1c1c1e]/90 text-[#f5f5f7] border-white/10 hover:border-white/25';
              let badgeStyle = 'bg-[#0a84ff] text-white';

              if (node.isTrapped) {
                cardStyle = 'bg-rose-950/85 text-rose-200 border-rose-500/60 shadow-[0_0_20px_rgba(255,69,58,0.35)]';
                badgeStyle = 'bg-[#ff453a] text-white';
              } else if (node.isUnreachable) {
                cardStyle = 'bg-amber-950/70 text-amber-200 border-2 border-dashed border-amber-500/60 shadow-lg';
                badgeStyle = 'bg-[#ff9f0a] text-black';
              } else if (node.isFocusLoss) {
                cardStyle = 'bg-orange-950/80 text-orange-200 border-orange-500/60';
                badgeStyle = 'bg-[#ff9f0a] text-white';
              }

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    left: `${(node.x / 760) * 100}%`,
                    top: `${(node.y / 440) * 100}%`,
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ease-spring ${
                    isActive ? 'scale-110 z-30 ring-2 ring-[#0a84ff] shadow-[0_0_24px_rgba(10,132,255,0.7)]' : 'z-10'
                  } ${isSelected ? 'ring-2 ring-white/50' : ''}`}
                >
                  <div className={`px-3 py-2 rounded-2xl border-hairline backdrop-blur-md flex items-center gap-2 text-xs font-mono font-medium shadow-xl ${cardStyle}`}>
                    {/* Index badge */}
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${badgeStyle}`}>
                      {node.isTrapped ? <Lock className="w-3 h-3" /> : (node.readingOrderRank ?? '•')}
                    </span>

                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[12px] truncate max-w-[150px]">
                        {node.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#86868b]">
                        <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-white/5 border border-white/10">
                          {node.role}
                        </span>
                        {node.tabIndex !== undefined && (
                          <span className={`font-mono ${node.tabIndex > 0 ? 'text-amber-400 font-bold' : ''}`}>
                            tabindex={node.tabIndex}
                          </span>
                        )}
                      </div>
                    </div>

                    {node.isUnreachable && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        Unreachable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State when in Live mode with 0 nodes */}
            {selectedPreset === 'live' && activeDataset.nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#0a0b10]/95 backdrop-blur-md">
                <Compass className="w-10 h-10 text-[#0a84ff] animate-pulse" />
                <h4 className="text-base font-bold text-white">No Live Audit Graph Recorded</h4>
                <p className="text-xs text-[#86868b] max-w-md">
                  Run a task audit in the Studio & Theater screen to build the real-time empirical focus graph, or inspect the built-in Fixture Presets (A, B, C) above.
                </p>
                <button
                  onClick={() => setSelectedPreset('fixture-a')}
                  className="px-4 py-1.5 rounded-xl bg-[#0a84ff] text-white text-xs font-medium active:scale-[0.98] transition-transform"
                >
                  Load Fixture A (Keyboard Trap)
                </button>
              </div>
            )}
          </div>

          {/* Focus Traversal Replay Scrubber HUD */}
          <div className="p-4 rounded-2xl bg-black/40 border-hairline space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#86868b] font-mono text-[11px] uppercase tracking-wider">Focus Replay Scrubber:</span>
                <span className="font-mono font-bold text-white">
                  Step {replayStep + 1} of {Math.max(1, activeDataset.replaySteps.length)}
                </span>
              </div>

              {/* Physical Keycap Announcement */}
              <div className="flex items-center gap-2">
                <span className="text-[#86868b] text-[11px] font-mono">Dispatched Key:</span>
                <span className="apple-keycap px-2.5 py-1 text-xs text-white shadow-sm font-mono active:translate-y-0.5">
                  {currentReplay?.keyDispatched || 'Tab'}
                </span>
                {currentReplay?.isViolation && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-[#ff453a] text-[10px] font-mono border border-rose-500/30">
                    Defect Injected
                  </span>
                )}
              </div>
            </div>

            {/* Scrubber Range Slider with Spring Physics */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={Math.max(0, activeDataset.replaySteps.length - 1)}
                value={replayStep}
                onChange={(e) => {
                  setReplayStep(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1.5 bg-[#2c2c2e] rounded-lg appearance-none cursor-pointer accent-[#0a84ff]"
              />
            </div>

            {/* Playback Controls & Action Step Description */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Playback Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReplayStep(0)}
                  disabled={replayStep === 0}
                  className="p-1.5 rounded-lg bg-[#2c2c2e]/70 hover:bg-[#3a3a3c] text-white disabled:opacity-40 active:scale-[0.98] transition-all"
                  title="Reset to beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setReplayStep(prev => Math.max(0, prev - 1))}
                  disabled={replayStep === 0}
                  className="p-1.5 rounded-lg bg-[#2c2c2e]/70 hover:bg-[#3a3a3c] text-white disabled:opacity-40 active:scale-[0.98] transition-all"
                  title="Step Backward"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white font-medium text-xs active:scale-[0.98] transition-all shadow-md shadow-blue-500/20"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Replay Traversal</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setReplayStep(prev => Math.min(activeDataset.replaySteps.length - 1, prev + 1))}
                  disabled={replayStep >= activeDataset.replaySteps.length - 1}
                  className="p-1.5 rounded-lg bg-[#2c2c2e]/70 hover:bg-[#3a3a3c] text-white disabled:opacity-40 active:scale-[0.98] transition-all"
                  title="Step Forward"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step Annotation Description */}
              <div className="text-xs text-[#86868b] font-mono truncate max-w-md">
                <span className="text-white font-medium">{currentReplay?.description}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Kendall's Tau Concordance Meter & Certificate Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* Card 1: Kendall's Tau Circular Arc Concordance Meter */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline shadow-2xl space-y-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider font-mono">
                  Kendall's Tau (τ) Rank Concordance
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border-hairline ${
                  isHealthy 
                    ? 'bg-emerald-500/10 text-[#30d158] border-emerald-500/30' 
                    : 'bg-rose-500/10 text-[#ff453a] border-rose-500/30'
                }`}>
                  {isHealthy ? 'CONCORDANT' : 'DISORIENTING'}
                </span>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Measures the statistical rank correlation between sequential Tab index order and 2D visual screen coordinates.
              </p>
            </div>

            {/* Circular Arc SVG Meter */}
            <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
              <svg className="w-48 h-36" viewBox="0 0 200 150">
                {/* Background Arc Track */}
                <path
                  d="M 39.38 135 A 70 70 0 1 1 160.62 135"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Dynamic Colored Arc Value */}
                <path
                  d="M 39.38 135 A 70 70 0 1 1 160.62 135"
                  fill="none"
                  stroke={isHealthy ? '#30d158' : '#ff453a'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${arcLength} ${arcLength}`}
                  strokeDashoffset={arcOffset}
                  className="transition-all duration-700 ease-spring"
                />
              </svg>

              {/* Center Tabular Numerals Display */}
              <div className="absolute top-12 flex flex-col items-center text-center">
                <span className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
                  {tau >= 0 ? `+${tau.toFixed(2)}` : tau.toFixed(2)}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#86868b] mt-0.5">
                  Threshold: τ ≥ 0.60
                </span>
              </div>

              {/* Status Pill below Arc */}
              <div className="mt-1 text-center">
                <span className={`text-xs font-semibold ${isHealthy ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                  {isHealthy ? 'Meets WCAG 2.4.3 Focus Order' : 'DISORIENTING FOCUS ORDER (τ < 0.60)'}
                </span>
              </div>
            </div>

            {/* Statistical Pairs Breakdown Table */}
            <div className="p-4 rounded-2xl bg-black/40 border-hairline text-xs font-mono space-y-2.5 text-[#86868b]">
              <div className="flex justify-between items-center">
                <span>Concordant Pairs (C):</span>
                <span className="text-white font-bold">{activeDataset.concordantPairs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discordant Inversions (D):</span>
                <span className={`font-bold ${activeDataset.inversions > 0 ? 'text-[#ff453a]' : 'text-emerald-400'}`}>
                  {activeDataset.inversions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Evaluated Pairs n(n-1)/2:</span>
                <span className="text-white">{activeDataset.totalPairs}</span>
              </div>
              <div className="hairline-divider my-1" />
              <div className="flex justify-between items-center text-[11px]">
                <span>Formula:</span>
                <span className="text-[#0a84ff] font-semibold">τ = (C - D) / Total</span>
              </div>
            </div>

            {/* Visual Reading Order vs Tab Order Pair List */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[#86868b] uppercase tracking-wider font-semibold">
                Sequence Concordance:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activeDataset.nodes.map((node, idx) => {
                  const isInverted = node.tabOrderRank !== undefined && 
                                     node.readingOrderRank !== undefined && 
                                     node.tabOrderRank !== node.readingOrderRank;
                  return (
                    <div
                      key={node.id}
                      className={`px-3 py-1.5 rounded-xl border-hairline text-[11px] font-mono flex items-center justify-between ${
                        isInverted
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-white/[0.03] border-white/5 text-[#86868b]'
                      }`}
                    >
                      <span className="truncate max-w-[130px] text-white">
                        {node.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>Visual #{node.readingOrderRank}</span>
                        <ArrowRight className="w-3 h-3 text-[#6e6e73]" />
                        <span className={isInverted ? 'text-amber-400 font-bold' : 'text-[#30d158]'}>
                          Tab #{node.tabOrderRank === -1 ? 'None' : node.tabOrderRank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Trap Certificate Summary Card */}
          {activeDataset.trapCertificate && (
            <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                    <Lock className="w-4 h-4 text-[#ff453a]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Trap Certificate Engine
                    </h4>
                    <span className="text-[10px] text-[#ff453a] font-mono">
                      Type: {activeDataset.trapCertificate.trapType.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCertificateOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[#ff453a] text-[11px] font-medium border border-rose-500/40 active:scale-[0.98] transition-all"
                >
                  Inspect Sheet
                </button>
              </div>

              {/* Minimal Keycaps Preview */}
              <div className="p-3 rounded-2xl bg-black/40 border-hairline space-y-2">
                <span className="text-[10px] font-mono text-[#86868b] uppercase">Shortest Key Sequence:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeDataset.trapCertificate.keySequence.map((key, kIdx) => (
                    <React.Fragment key={kIdx}>
                      <span className="apple-keycap px-2 py-0.5 text-[11px] text-white">
                        {key}
                      </span>
                      {kIdx < activeDataset.trapCertificate!.keySequence.length - 1 && (
                        <span className="text-[10px] text-[#6e6e73]">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-[#86868b] leading-relaxed line-clamp-2">
                {activeDataset.trapCertificate.proofExplanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cupertino Trap Certificate Inspection Sheet (Slide-over / Modal) */}
      {isCertificateOpen && activeDataset.trapCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl apple-card-raised rounded-3xl p-8 border-hairline shadow-2xl space-y-6 text-left relative animate-in zoom-in-95 duration-200"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsCertificateOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#86868b] hover:text-white transition-all active:scale-[0.98]"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Sheet Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Lock className="w-6 h-6 text-[#ff453a]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Keyboard Trap Certificate
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-[#ff453a] text-[10px] font-mono font-bold border border-rose-500/30">
                    PROVEN
                  </span>
                </div>
                <p className="text-xs text-[#86868b] font-mono mt-0.5">
                  Deterministic Proof of WCAG 2.1.2 & 2.4.3 Violation
                </p>
              </div>
            </div>

            {/* Proof Details */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border-hairline space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#86868b]">
                  Shortest Reproducible Key Sequence:
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeDataset.trapCertificate.keySequence.map((key, idx) => (
                    <React.Fragment key={idx}>
                      <span className="apple-keycap px-3 py-1.5 text-xs text-white shadow-md active:translate-y-0.5 cursor-pointer">
                        {key}
                      </span>
                      {idx < activeDataset.trapCertificate!.keySequence.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-[#6e6e73]" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#86868b]">
                  Algorithmic Proof Explanation:
                </span>
                <p className="text-xs text-[#d1d1d6] leading-relaxed p-4 rounded-2xl bg-white/[0.03] border-hairline">
                  {activeDataset.trapCertificate.proofExplanation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-black/30 border-hairline space-y-1">
                  <span className="text-[#86868b] text-[10px] uppercase">Trap Type:</span>
                  <div className="font-bold text-[#ff453a]">{activeDataset.trapCertificate.trapType.toUpperCase()}</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/30 border-hairline space-y-1">
                  <span className="text-[#86868b] text-[10px] uppercase">Component Nodes:</span>
                  <div className="text-white font-bold">{activeDataset.trapCertificate.componentNodeIds.length} Nodes Involved</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCertificateOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white text-xs font-semibold active:scale-[0.98] transition-all"
              >
                Dismiss Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
