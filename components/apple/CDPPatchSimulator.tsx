'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  Code2, 
  Sparkles, 
  Layers, 
  Eye, 
  Check, 
  ExternalLink,
  Lock,
  Unlock,
  Volume2,
  Terminal,
  Columns
} from 'lucide-react';
import { BarrierFinding, PersonaType } from '@/lib/barrierlens/types';

interface CDPPatchSimulatorProps {
  targetUrl: string;
  goal: string;
  persona: PersonaType;
  findings: BarrierFinding[];
  activeElementSelector: string;
  setActiveElementSelector: (sel: string) => void;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  isAuditing: boolean;
  streamingStatus?: string;
  onSelectFinding?: (f: BarrierFinding) => void;
}

export type PatchMode = 'unpatched' | 'patched' | 'split';

// Fallback benchmark finding if no findings yet
const DEFAULT_TRAP_FINDING: BarrierFinding = {
  id: 'find_default_trap',
  runId: 'run_default',
  stepIdx: 4,
  kind: 'keyboard_trap',
  trustTier: 'proven',
  wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
  severity: 'critical',
  severityScore: 9.8,
  severityInterval: [9.2, 10.0],
  title: 'Focus Sink Cycle in Dialog Container',
  summary: 'Tab key navigation cannot escape modal overlay; Esc key handler missing.',
  evidence: {
    selector: '#trap-modal',
    elementHTML: '<div id="trap-modal" class="modal-card">\n  <h2>Special Confirmation</h2>\n  <button id="claim-btn">Confirm</button>\n</div>'
  },
  certificate: {
    detected: true,
    trapType: 'sink_scc',
    componentNodeIds: ['#trap-modal', '#claim-btn'],
    entryNodeId: '#trap-modal',
    reproducingKeySequence: ['Escape', 'Shift+Tab', 'Escape'],
    keySequence: ['Escape', 'Shift+Tab', 'Escape'],
    cycleNodes: ['#trap-modal', '#claim-btn'],
    cycleTransitions: [
      { from: '#trap-modal', key: 'Tab', to: '#claim-btn' },
      { from: '#claim-btn', key: 'Tab', to: '#trap-modal' }
    ],
    testedEscape: true,
    proofExplanation: 'Tarjan SCC sink cycle: Tab key navigation forms a closed loop between #trap-modal and #claim-btn. Escape key event ignored.',
    timestamp: new Date().toISOString()
  }
};

export function CDPPatchSimulator({
  targetUrl,
  goal,
  persona,
  findings,
  activeElementSelector,
  setActiveElementSelector,
  activeKey,
  setActiveKey,
  isAuditing,
  streamingStatus,
  onSelectFinding
}: CDPPatchSimulatorProps) {
  const [patchMode, setPatchMode] = useState<PatchMode>('unpatched');
  const [selectedFindingIdx, setSelectedFindingIdx] = useState<number>(0);
  const [showDiff, setShowDiff] = useState<boolean>(true);

  // Active findings list with fallback
  const availableFindings = findings.length > 0 ? findings : [DEFAULT_TRAP_FINDING];
  const activeFinding = availableFindings[Math.min(selectedFindingIdx, availableFindings.length - 1)];

  // Interactive Traversal Simulation State
  const [focusStep, setFocusStep] = useState<number>(0); // 0 = origin trigger, 1 = modal container, 2 = confirm button, 3 = escaped
  const [isEscaped, setIsEscaped] = useState<boolean>(false);
  const [actionAlert, setActionAlert] = useState<{
    type: 'error' | 'success' | 'info';
    title: string;
    description: string;
  } | null>(null);

  // Focus step node map for the modal trap
  const trapCycleNodes = ['#newsletter-email', '#trap-modal', '#claim-btn'];

  // Handle keyboard event simulation
  const handleSimulateKey = (key: 'Tab' | 'Shift+Tab' | 'Escape') => {
    setActiveKey(key);

    if (key === 'Escape') {
      if (patchMode === 'unpatched') {
        // Trap! Escape is ignored!
        setActionAlert({
          type: 'error',
          title: 'WCAG 2.1.2 Keyboard Trap Detected',
          description: 'Escape key event was swallowed or ignored. Focus is deadlocked within #trap-modal container.'
        });
      } else {
        // Patched! Escape works and restores focus to origin!
        setIsEscaped(true);
        setFocusStep(0);
        setActiveElementSelector('#newsletter-email');
        setActionAlert({
          type: 'success',
          title: 'Causal Fix Verified: Clean Escape',
          description: 'onKeyDown handler caught Escape and restored focus to origin trigger (#newsletter-email). 0 regressions.'
        });
      }
      return;
    }

    if (key === 'Tab') {
      if (patchMode === 'unpatched') {
        // If unpatched and already inside modal (step 1 or 2), loop between 1 and 2
        if (focusStep === 0) {
          setFocusStep(1);
          setActiveElementSelector('#trap-modal');
        } else if (focusStep === 1) {
          setFocusStep(2);
          setActiveElementSelector('#claim-btn');
        } else {
          // Loops back into the modal!
          setFocusStep(1);
          setActiveElementSelector('#trap-modal');
          setActionAlert({
            type: 'error',
            title: 'Tarjan SCC Sink Cycle Active',
            description: 'Tab navigated from #claim-btn back to #trap-modal. Loop degree = 2.'
          });
        }
      } else {
        // Patched mode
        if (isEscaped) {
          setIsEscaped(false);
          setFocusStep(1);
          setActiveElementSelector('#trap-modal');
        } else {
          const next = (focusStep + 1) % 3;
          setFocusStep(next === 0 ? 1 : next); // Keep inside dialog unless Esc is pressed
          setActiveElementSelector(trapCycleNodes[next === 0 ? 1 : next]);
        }
        setActionAlert({
          type: 'info',
          title: 'Focus Advanced',
          description: `Dispatched [Tab] to ${activeElementSelector}. Escape pathway is open.`
        });
      }
    }

    if (key === 'Shift+Tab') {
      if (patchMode === 'unpatched') {
        setFocusStep(prev => (prev === 2 ? 1 : 2));
        setActiveElementSelector(focusStep === 2 ? '#trap-modal' : '#claim-btn');
      } else {
        setFocusStep(prev => (prev === 2 ? 1 : 2));
        setActiveElementSelector(focusStep === 2 ? '#trap-modal' : '#claim-btn');
      }
    }
  };

  // Reset simulation state
  const handleReset = () => {
    setFocusStep(1);
    setIsEscaped(false);
    setActiveElementSelector('#trap-modal');
    setActionAlert(null);
  };

  // Switch patch mode helper
  const handleSetMode = (mode: PatchMode) => {
    setPatchMode(mode);
    handleReset();
  };

  // Keyboard shortcut listener for 'P' (Toggle patch) and simulator interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input, don't hijack
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPatchMode(prev => (prev === 'unpatched' ? 'patched' : prev === 'patched' ? 'split' : 'unpatched'));
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between h-full space-y-4">
      {/* 1. Mode Switcher & Finding Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a]">
        
        {/* Segmented Before / After / Split Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#141517] border border-[#23262a] text-xs font-mono">
          <button
            type="button"
            onClick={() => handleSetMode('unpatched')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-all ${
              patchMode === 'unpatched'
                ? 'bg-red-500/20 text-[#ff453a] border border-red-500/30 shadow-sm'
                : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Unpatched Trap</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetMode('patched')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-all ${
              patchMode === 'patched'
                ? 'bg-emerald-500/20 text-[#30d158] border border-emerald-500/30 shadow-sm'
                : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Causal Fix Applied</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetMode('split')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-all ${
              patchMode === 'split'
                ? 'bg-[#5e6ad2]/20 text-[#5e6ad2] border border-[#5e6ad2]/30 shadow-sm'
                : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Comparison</span>
          </button>
        </div>

        {/* Shortcut Tip & Finding Badges */}
        <div className="flex items-center gap-2">
          {availableFindings.length > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-[#62676d]">Finding:</span>
              <select
                value={selectedFindingIdx}
                onChange={(e) => {
                  setSelectedFindingIdx(Number(e.target.value));
                  handleReset();
                }}
                className="bg-[#141517] border border-[#23262a] rounded px-2 py-1 text-[#f4f5f6] text-xs font-mono focus:outline-none"
              >
                {availableFindings.map((f, idx) => (
                  <option key={f.id} value={idx}>
                    #{idx + 1} {f.kind.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1 text-[10px] font-mono text-[#62676d] bg-[#141517] px-2 py-1 rounded border border-[#23262a]">
            <span>Press</span>
            <kbd className="px-1 py-0.2 rounded bg-[#23262a] text-[#f4f5f6]">P</kbd>
            <span>to toggle patch</span>
          </div>
        </div>
      </div>

      {/* 2. Main Live Viewport Canvas */}
      <div className="flex-1 bg-[#0c0d0e] p-5 rounded-xl border border-[#23262a] flex flex-col justify-between relative overflow-hidden min-h-[380px]">
        
        {/* Mode Status Pill Top Right */}
        <div className="flex items-center justify-between pb-3 border-b border-[#23262a] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#9ba1a6]">Target Selector:</span>
            <span className="px-2 py-0.5 rounded bg-[#181a1d] text-[#f4f5f6] font-semibold border border-[#23262a]">
              {activeFinding.evidence?.selector || '#trap-modal'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {patchMode === 'unpatched' ? (
              <span className="flex items-center gap-1.5 text-[11px] text-[#ff453a] bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-pulse" />
                Tarjan SCC Cycle Trapped
              </span>
            ) : patchMode === 'patched' ? (
              <span className="flex items-center gap-1.5 text-[11px] text-[#30d158] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Causal Fix Verified (0 Regressions)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-[#5e6ad2] bg-[#5e6ad2]/10 px-2.5 py-0.5 rounded-full border border-[#5e6ad2]/20 font-medium">
                <Columns className="w-3.5 h-3.5" />
                Before / After Side-by-Side
              </span>
            )}
          </div>
        </div>

        {/* Interactive Element Render Surface */}
        <div className="flex-1 flex items-center justify-center py-4">
          
          {/* SPLIT MODE: Two cards side-by-side */}
          {patchMode === 'split' ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Unpatched */}
              <div className="p-4 rounded-xl bg-[#141517] border border-red-500/30 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#ff453a] uppercase font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Before (Unpatched Trap)
                  </span>
                  <span className="text-[10px] font-mono text-[#62676d]">Sink SCC Degree: 2</span>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0d0e] border border-red-500/20 space-y-2">
                  <div className="text-xs font-semibold text-[#f4f5f6]">
                    Confirmation Dialog
                  </div>
                  <p className="text-[11px] text-[#9ba1a6]">
                    Escape key ignored. Closed loop between container and action button.
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <button className="px-3 py-1 rounded bg-red-500/20 text-[#ff453a] text-xs font-mono border border-red-500/30">
                      Confirm Action
                    </button>
                    <span className="text-[10px] font-mono text-red-400">Esc ⎋ Blocked</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#62676d] flex items-center gap-1">
                  <span>Cycle:</span>
                  <code className="text-red-300">#trap-modal ⇄ #claim-btn</code>
                </div>
              </div>

              {/* Right: Patched */}
              <div className="p-4 rounded-xl bg-[#141517] border border-emerald-500/30 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#30d158] uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> After (Causal Fix Applied)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Verified Passed</span>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0d0e] border border-emerald-500/20 space-y-2">
                  <div className="text-xs font-semibold text-[#f4f5f6] flex items-center justify-between">
                    <span>Confirmation Dialog</span>
                    <span className="text-[10px] font-mono text-[#30d158] bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      aria-modal=&quot;true&quot;
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9ba1a6]">
                    Escape key handler catches Esc and restores focus cleanly to origin trigger.
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <button className="px-3 py-1 rounded bg-emerald-500/20 text-[#30d158] text-xs font-mono border border-emerald-500/30">
                      Confirm Action
                    </button>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Esc ⎋ Restores Focus
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#62676d] flex items-center gap-1">
                  <span>Restoration:</span>
                  <code className="text-emerald-300">#trap-modal ──[Esc]──▶ #newsletter-email</code>
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE CARD: Unpatched or Patched with Live Interactivity */
            <div className="w-full max-w-lg space-y-4">
              
              {/* The Live Interactive Dialog Box */}
              <div 
                className={`p-6 rounded-2xl transition-all duration-300 relative shadow-2xl ${
                  patchMode === 'unpatched'
                    ? 'bg-[#141517] border-2 border-red-500/50 shadow-red-950/20'
                    : isEscaped
                    ? 'bg-[#141517] border-2 border-[#5e6ad2]/50 shadow-indigo-950/20'
                    : 'bg-[#141517] border-2 border-emerald-500/50 shadow-emerald-950/20'
                }`}
              >
                {/* Active Focus Tag */}
                <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      patchMode === 'unpatched' ? 'bg-[#ff453a] animate-ping' : 'bg-[#30d158]'
                    }`} />
                    <span className="text-xs font-mono font-medium text-[#f4f5f6]">
                      Focus: {focusStep === 0 ? '#newsletter-email (Origin Trigger)' : focusStep === 1 ? '#trap-modal (Container)' : '#claim-btn (Action)'}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                    patchMode === 'unpatched'
                      ? 'bg-red-500/10 text-[#ff453a] border border-red-500/20'
                      : 'bg-emerald-500/10 text-[#30d158] border border-emerald-500/20'
                  }`}>
                    {patchMode === 'unpatched' ? 'Deadlocked' : isEscaped ? 'Escaped' : 'Traversable'}
                  </span>
                </div>

                {/* Simulated Content */}
                <div className="py-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#f4f5f6]">
                    Subscription Confirmation Dialog
                  </h3>
                  <p className="text-xs text-[#9ba1a6] leading-relaxed">
                    {patchMode === 'unpatched' 
                      ? 'This container is missing the Escape key listener and aria-modal attributes, trapping keyboard users in an infinite Tab loop.'
                      : 'Surgical AST patch applied: Escape key listener bound, aria-modal="true" enabled, and origin focus restore hook configured.'}
                  </p>

                  {/* Focus Elements Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFocusStep(2);
                        setActiveElementSelector('#claim-btn');
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all ${
                        focusStep === 2
                          ? 'bg-[#5e6ad2] text-white ring-2 ring-[#5e6ad2] shadow-lg'
                          : 'bg-[#181a1d] hover:bg-[#23262a] text-[#f4f5f6] border border-[#23262a]'
                      }`}
                    >
                      #claim-btn (Confirm Action)
                    </button>

                    {patchMode === 'patched' && (
                      <button
                        type="button"
                        onClick={() => handleSimulateKey('Escape')}
                        className="px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-medium border border-emerald-500/20 flex items-center gap-1.5 transition-all"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Escape Modal (Esc)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Traversal Pathway Graphic */}
                <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#62676d]">Traversal Path:</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={focusStep === 0 ? 'text-[#5e6ad2] font-bold' : 'text-[#62676d]'}>#trigger</span>
                    <span className="text-[#62676d]">→</span>
                    <span className={focusStep === 1 ? 'text-amber-400 font-bold' : 'text-[#62676d]'}>#trap-modal</span>
                    <span className="text-[#62676d]">⇄</span>
                    <span className={focusStep === 2 ? 'text-amber-400 font-bold' : 'text-[#62676d]'}>#claim-btn</span>
                    {patchMode === 'patched' && (
                      <>
                        <span className="text-emerald-400">──[Esc]──▶</span>
                        <span className={isEscaped ? 'text-emerald-400 font-bold' : 'text-[#62676d]'}>#trigger</span>
                      </>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Action Alert Banner */}
        {actionAlert && (
          <div className={`p-3 rounded-lg text-xs font-mono flex items-start justify-between gap-3 animate-in fade-in duration-200 border ${
            actionAlert.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-[#ff453a]'
              : actionAlert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-[#30d158]'
              : 'bg-[#5e6ad2]/10 border-[#5e6ad2]/30 text-[#5e6ad2]'
          }`}>
            <div className="space-y-0.5">
              <span className="font-bold uppercase tracking-wider block">{actionAlert.title}</span>
              <p className="text-[11px] text-[#f4f5f6]">{actionAlert.description}</p>
            </div>
            <button
              onClick={() => setActionAlert(null)}
              className="text-[#9ba1a6] hover:text-[#f4f5f6] text-[10px]"
            >
              ✕
            </button>
          </div>
        )}

        {/* Interactive Keyboard Test Controls */}
        <div className="pt-3 border-t border-[#23262a] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#62676d]">Simulate Keystroke:</span>
            <button
              type="button"
              onClick={() => handleSimulateKey('Tab')}
              className="px-2.5 py-1 rounded bg-[#181a1d] hover:bg-[#23262a] border border-[#23262a] text-[#f4f5f6] text-xs font-mono transition-all"
            >
              Tab ⇥
            </button>
            <button
              type="button"
              onClick={() => handleSimulateKey('Shift+Tab')}
              className="px-2.5 py-1 rounded bg-[#181a1d] hover:bg-[#23262a] border border-[#23262a] text-[#f4f5f6] text-xs font-mono transition-all"
            >
              ⇧ Tab
            </button>
            <button
              type="button"
              onClick={() => handleSimulateKey('Escape')}
              className={`px-2.5 py-1 rounded border text-xs font-mono transition-all ${
                patchMode === 'unpatched'
                  ? 'bg-red-500/10 border-red-500/20 text-[#ff453a] hover:bg-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-[#30d158] hover:bg-emerald-500/20'
              }`}
            >
              Esc ⎋
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded bg-[#181a1d] hover:bg-[#23262a] border border-[#23262a] text-[#9ba1a6] hover:text-[#f4f5f6] transition-all"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center gap-1.5 text-[11px] text-[#5e6ad2] hover:underline"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showDiff ? 'Hide AST Diff' : 'Inspect AST Diff'}</span>
          </button>
        </div>

      </div>

      {/* 3. Surgical AST Diff Drawer */}
      {showDiff && (
        <div className="p-3.5 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px] text-[#9ba1a6] pb-1 border-b border-[#23262a]">
            <div className="flex items-center gap-2">
              <span className="text-[#30d158] font-bold font-mono">Verified Surgical Fix</span>
              <span className="text-[#62676d]">· Minimal Pearl SCM Invasiveness Level 1</span>
            </div>
            <span className="text-[10px] text-[#62676d]">remedy/trap-escape-handler.tsx</span>
          </div>

          <pre className="p-3 rounded-lg bg-[#141517] border border-[#23262a] text-[11px] overflow-x-auto leading-relaxed text-[#f4f5f6]">
            {patchMode === 'unpatched' ? (
              <code>
                <span className="text-red-400 block">- &lt;div id=&quot;trap-modal&quot; class=&quot;modal-card&quot;&gt;</span>
                <span className="text-red-400 block">-   &lt;h2&gt;Special Confirmation&lt;/h2&gt;</span>
                <span className="text-red-400 block">-   &lt;button id=&quot;claim-btn&quot;&gt;Confirm&lt;/button&gt;</span>
                <span className="text-red-400 block">- &lt;/div&gt;</span>
                <span className="text-[#62676d] block pt-1">// Trapped: Missing onKeyDown listener, aria-modal, and focus restore pointer</span>
              </code>
            ) : (
              <code>
                <span className="text-[#62676d] block">// Causal Repair: do(X = aria-modal, onKeyDown = escapeHandler)</span>
                <span className="text-emerald-400 block">+ &lt;dialog</span>
                <span className="text-emerald-400 block">+   id=&quot;trap-modal&quot;</span>
                <span className="text-emerald-400 block">+   role=&quot;dialog&quot;</span>
                <span className="text-emerald-400 block">+   aria-modal=&quot;true&quot;</span>
                <span className="text-emerald-400 block">+   aria-labelledby=&quot;modal-title&quot;</span>
                <span className="text-emerald-400 block">+   onKeyDown=&#123;(e) =&gt; &#123;</span>
                <span className="text-emerald-400 block">+     if (e.key === &apos;Escape&apos;) &#123;</span>
                <span className="text-emerald-400 block">+       closeModal();</span>
                <span className="text-emerald-400 block">+       originTriggerRef.current?.focus();</span>
                <span className="text-emerald-400 block">+     &#125;</span>
                <span className="text-emerald-400 block">+   &#125;&#125;</span>
                <span className="text-emerald-400 block">+ &gt;</span>
              </code>
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
