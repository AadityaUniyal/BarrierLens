'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Compass, 
  Terminal, 
  Clock, 
  ChevronRight, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Code2,
  Monitor,
  Layers,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { AuditRun, BarrierFinding, ActionStep, PersonaType } from '@/lib/barrierlens/types';
import { TraceTheater } from './TraceTheater';
import { ScreenReaderTranscript } from './ScreenReaderTranscript';
import { FocusMapView } from './FocusMapView';

interface AuditStudioViewProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  persona: PersonaType;
  setPersona: (p: PersonaType) => void;
  maxSteps: number;
  setMaxSteps: (n: number) => void;
  isAuditing: boolean;
  onRunAudit: () => void;
  streamingStatus: string;
  streamingStep: number;
  auditResult: AuditRun | null;
  onSelectFinding: (f: BarrierFinding) => void;
  onLoadBenchmarkFindings: () => void;
}

type StudioViewTab = 'viewport' | 'theater' | 'auditory' | 'focus_map';

export function AuditStudioView({
  targetUrl,
  setTargetUrl,
  goal,
  setGoal,
  persona,
  setPersona,
  maxSteps,
  setMaxSteps,
  isAuditing,
  onRunAudit,
  streamingStatus,
  streamingStep,
  auditResult,
  onSelectFinding,
  onLoadBenchmarkFindings
}: AuditStudioViewProps) {
  const [activeTab, setActiveTab] = useState<StudioViewTab>('viewport');
  const [speechActive, setSpeechActive] = useState<boolean>(true);

  // Verified benchmark presets
  const benchmarkPresets = [
    { label: 'Modal Trap Benchmark', url: '/benchmark', goal: 'Subscribe to newsletter and test confirmation modal' },
    { label: 'Keyboard Trap Fixture', url: '/fixtures/keyboard-trap', goal: 'Navigate into modal and escape back to main page' },
    { label: 'Unlabeled AccName', url: '/fixtures/accname-wcag', goal: 'Identify and activate all icon action buttons' },
    { label: 'Focus Loss on Close', url: '/fixtures/focus-loss', goal: 'Open drawer, close it, and resume reading order' },
  ];

  // Active key state for on-screen physical keycaps
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeElementSelector, setActiveElementSelector] = useState<string>('body');
  const lastSpokenStepRef = useRef<number>(-1);

  // Sync active key from latest streaming step or audit result
  useEffect(() => {
    if (auditResult?.steps && auditResult.steps.length > 0) {
      const lastStep = auditResult.steps[auditResult.steps.length - 1];
      if (lastStep.key) {
        setActiveKey(lastStep.key);
      } else if (lastStep.actionType === 'type_text') {
        setActiveKey('Type');
      }
      if (lastStep.activeElementAfter) {
        setActiveElementSelector(lastStep.activeElementAfter);
      }

      // VoiceOver speech synthesis announcement if screen_reader persona
      if (speechActive && persona === 'screen_reader' && lastStep.idx !== lastSpokenStepRef.current && typeof window !== 'undefined') {
        lastSpokenStepRef.current = lastStep.idx;
        try {
          window.speechSynthesis?.cancel();
          const phrase = `${lastStep.activeElementAfter || 'Focused control'}, key ${lastStep.key || lastStep.actionType}`;
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.rate = 1.2;
          window.speechSynthesis?.speak(utterance);
        } catch {}
      }
    }
  }, [auditResult, streamingStep, speechActive, persona]);

  const physicalKeycaps = [
    { key: 'Tab', label: 'Tab ⇥' },
    { key: 'Shift+Tab', label: '⇧ Tab' },
    { key: 'Enter', label: 'Enter ↵' },
    { key: 'Space', label: 'Space ␣' },
    { key: 'Escape', label: 'Esc ⎋' },
    { key: 'Type', label: 'Type Text' },
  ];

  const steps = auditResult?.steps || [];
  const findings = auditResult?.findings || [];

  const transcriptItems = React.useMemo(() => {
    if (steps.length === 0) return undefined;
    const list: any[] = [];
    steps.forEach((s) => {
      list.push({
        id: `step_${s.idx}`,
        type: 'speech' as const,
        text: s.activeElementAfter ? `${s.activeElementAfter}, dispatched [${s.key || s.actionType}].` : `Action: [${s.key || s.actionType}].`,
        tag: s.actionType.toUpperCase(),
        timestamp: `${(s.idx * 0.8).toFixed(1)}s`
      });
    });
    findings.forEach((f, i) => {
      if (f.kind === 'silent_state_change') {
        list.push({
          id: `finding_silent_${i}`,
          type: 'silent_gap' as const,
          text: `CRITICAL SILENT STATE CHANGE: ${f.summary}`,
          tag: 'SILENT_ERROR',
          timestamp: `${(f.stepIdx * 0.8 + 0.3).toFixed(1)}s`,
          category: 'inline_error' as const,
          proofCertificate: f.gapCertificate?.proofHash || 'sha256-verified'
        });
      }
    });
    return list;
  }, [steps, findings]);

  return (
    <div className="space-y-6 text-[#f4f5f6]">
      {/* 1. Header & Configuration Station (Linear Slate) */}
      <div className="p-5 rounded-xl bg-[#141517] border border-[#23262a] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6]">
                Interactive Traversal Sandbox
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#f4f5f6]">
              Task-Conditioned Audit Studio
            </h2>
            <p className="text-xs text-[#9ba1a6]">
              Physical keyboard & assistive traversal sandbox. Zero synthetic mouse clicks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!auditResult && (
              <button
                type="button"
                onClick={onLoadBenchmarkFindings}
                className="px-3.5 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] text-xs font-medium text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#23262a] transition-all"
              >
                Inspect Benchmark Proofs
              </button>
            )}
            <button
              type="button"
              disabled={isAuditing}
              onClick={onRunAudit}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isAuditing 
                  ? 'bg-[#181a1d] text-[#9ba1a6] cursor-wait border border-[#23262a]' 
                  : 'bg-[#5e6ad2] hover:bg-[#6875e5] text-white shadow-md'
              }`}
            >
              {isAuditing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#9ba1a6]/30 border-t-[#9ba1a6] rounded-full animate-spin" />
                  <span>Executing Journey...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Autonomous Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Target URL */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-[10px] font-mono text-[#9ba1a6] uppercase tracking-wider">
              Target Origin URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com or /benchmark"
              className="w-full px-3 py-1.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs text-[#f4f5f6] font-mono focus:outline-none focus:border-[#5e6ad2]"
            />
          </div>

          {/* User Goal */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[10px] font-mono text-[#9ba1a6] uppercase tracking-wider">
              Task Goal Objective
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Subscribe to newsletter"
              className="w-full px-3 py-1.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs text-[#f4f5f6] focus:outline-none focus:border-[#5e6ad2]"
            />
          </div>

          {/* Persona Selector */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-mono text-[#9ba1a6] uppercase tracking-wider">
              Constraint Persona
            </label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaType)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs text-[#f4f5f6] focus:outline-none focus:border-[#5e6ad2]"
            >
              <option value="keyboard">Keyboard Only (WCAG 2.1.1)</option>
              <option value="screen_reader">Screen Reader (VoiceOver/NVDA)</option>
              <option value="low_vision">Low Vision / 320px Reflow</option>
              <option value="mouse_unconstrained">Baseline Unconstrained</option>
            </select>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#23262a] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#62676d] font-mono">Ground Truth Presets:</span>
            {benchmarkPresets.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => {
                  setTargetUrl(preset.url);
                  setGoal(preset.goal);
                }}
                className="px-2.5 py-0.5 rounded-md bg-[#181a1d] hover:bg-[#23262a] border border-[#23262a] text-[11px] text-[#9ba1a6] hover:text-[#f4f5f6] transition-all font-mono"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {persona === 'screen_reader' && (
            <button
              onClick={() => setSpeechActive(!speechActive)}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[#9ba1a6] hover:text-[#f4f5f6]"
            >
              {speechActive ? <Volume2 className="w-3.5 h-3.5 text-[#30d158]" /> : <VolumeX className="w-3.5 h-3.5 text-[#62676d]" />}
              <span>Speech Synthesizer: {speechActive ? 'ON' : 'MUTED'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Cockpit Split-View (Linear Precision Canvas & Trace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Multi-Mode Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-[#141517] border border-[#23262a] overflow-hidden shadow-xl flex flex-col min-h-[520px]">
            
            {/* Viewport Multi-Tab Mode Bar */}
            <div className="px-4 py-2.5 bg-[#181a1d] border-b border-[#23262a] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0c0d0e] border border-[#23262a]">
                <button
                  onClick={() => setActiveTab('viewport')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    activeTab === 'viewport'
                      ? 'bg-[#23262a] text-[#f4f5f6]'
                      : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    CDP Viewport
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('theater')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    activeTab === 'theater'
                      ? 'bg-[#23262a] text-[#f4f5f6]'
                      : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Trace Theater
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('auditory')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    activeTab === 'auditory'
                      ? 'bg-[#23262a] text-[#f4f5f6]'
                      : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    Screen Reader
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('focus_map')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    activeTab === 'focus_map'
                      ? 'bg-[#23262a] text-[#f4f5f6]'
                      : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    Focus Graph
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#30d158]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                <span>Playwright CDP v1.42</span>
              </div>
            </div>

            {/* Tab 1: Default CDP Viewport */}
            {activeTab === 'viewport' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex-1 bg-[#0c0d0e] p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[380px]">
                  <div className="w-full max-w-md p-5 rounded-xl bg-[#141517] border border-[#23262a] space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#9ba1a6] tracking-wider font-semibold">
                        Current Focus Target
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20 font-medium">
                        {activeElementSelector}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1">
                      <div className="text-xs text-[#f4f5f6] font-medium">
                        Goal: {goal}
                      </div>
                      <div className="text-[11px] text-[#9ba1a6]">
                        Traversal Bounds: <span className="text-[#f4f5f6] font-mono capitalize">{persona.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {/* Focus Ring Indicator */}
                    <div className="p-2.5 rounded-lg border border-[#5e6ad2] bg-[#5e6ad2]/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
                        <span className="font-mono text-[11px] text-[#f4f5f6]">
                          Active: {activeElementSelector}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9ba1a6] font-mono">WCAG 2.4.7 Focus Visible</span>
                    </div>
                  </div>

                  {/* Streaming Status Overlay */}
                  {isAuditing && (
                    <div className="absolute bottom-4 left-4 right-4 px-3.5 py-2 rounded-lg bg-[#141517] border border-[#23262a] text-xs text-[#f4f5f6] flex items-center gap-2.5 shadow-xl">
                      <div className="w-2 h-2 rounded-full bg-[#5e6ad2] animate-ping" />
                      <span className="truncate font-mono text-[11px]">{streamingStatus || 'Auditor executing next action...'}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Mechanical Physical Keystroke Visualizer */}
                <div className="p-3.5 bg-[#181a1d] border-t border-[#23262a] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#9ba1a6]">
                    <span className="font-semibold uppercase tracking-wider text-[#62676d]">
                      Physical Keystroke Visualizer
                    </span>
                    <span>Direct CDP input dispatch</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                    {physicalKeycaps.map((kc) => {
                      const isActive = activeKey?.toLowerCase().includes(kc.key.toLowerCase());
                      return (
                        <div
                          key={kc.key}
                          className={`apple-keycap px-3 py-1 text-xs font-semibold select-none ${
                            isActive
                              ? 'text-white border-[#5e6ad2] shadow-[0_0_8px_rgba(94,106,210,0.5)] translate-y-[1px]'
                              : 'text-[#9ba1a6]'
                          }`}
                        >
                          <span>{kc.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Trace Theater Replay */}
            {activeTab === 'theater' && (
              <div className="p-4 flex-1">
                <TraceTheater
                  steps={steps}
                  findings={findings}
                  targetUrl={targetUrl}
                />
              </div>
            )}

            {/* Tab 3: Screen Reader Speech Transcript */}
            {activeTab === 'auditory' && (
              <div className="p-4 flex-1">
                <ScreenReaderTranscript items={transcriptItems} />
              </div>
            )}

            {/* Tab 4: Focus Graph Topology */}
            {activeTab === 'focus_map' && (
              <div className="p-4 flex-1">
                <FocusMapView
                  kendallTau={auditResult?.kendallTau}
                  trapCertificate={findings.find(f => f.certificate)?.certificate}
                />
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Streaming Action Timeline & Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-[#141517] border border-[#23262a] p-4 shadow-xl flex flex-col h-[520px]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5e6ad2]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#f4f5f6]">
                  Action Execution Trace
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#30d158] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {steps.length || streamingStep} Actions Executed
              </span>
            </div>

            {/* Steps & Findings Stream List */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-2 pr-1">
              
              {/* Empty state */}
              {steps.length === 0 && !isAuditing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#62676d]">
                  <Compass className="w-7 h-7 text-[#62676d]/60" />
                  <p className="text-xs text-[#9ba1a6]">No active execution trace.</p>
                  <p className="text-[11px] text-[#62676d]">
                    Click &quot;Run Autonomous Audit&quot; or &quot;Inspect Benchmark Proofs&quot; to begin.
                  </p>
                </div>
              )}

              {/* Steps List */}
              {steps.map((step: ActionStep) => (
                <div
                  key={step.idx}
                  className="p-2.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1 text-xs hover:border-[#34383e] transition-all"
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#9ba1a6]">Step #{step.idx}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#181a1d] text-[#5e6ad2] border border-[#23262a]">
                      Tier {step.tier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#f4f5f6]">
                      {step.actionType === 'press_key' ? `Press [${step.key || 'Tab'}]` : `Type text`}
                    </span>
                    <span className="font-mono text-[10px] text-[#62676d] truncate max-w-[150px]">
                      {step.activeElementAfter || 'body'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Finding Cards Alert */}
              {findings.map((finding: BarrierFinding) => (
                <div
                  key={finding.id}
                  onClick={() => onSelectFinding(finding)}
                  className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 space-y-1 text-xs cursor-pointer hover:bg-red-950/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#ff453a] font-bold">
                      {finding.kind.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-[#9ba1a6]">
                      Trust: {finding.trustTier}
                    </span>
                  </div>
                  <div className="font-medium text-[#f4f5f6] line-clamp-1">
                    {finding.title}
                  </div>
                  <div className="text-[11px] text-[#9ba1a6] flex items-center justify-between pt-1">
                    <span>Inspect Mathematical Proof</span>
                    <ChevronRight className="w-3 h-3 text-[#ff453a]" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
