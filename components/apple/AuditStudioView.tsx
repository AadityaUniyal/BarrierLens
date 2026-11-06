'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Compass, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  ExternalLink,
  Layers,
  ChevronRight,
  Sliders,
  Flame,
  Volume2
} from 'lucide-react';
import { AuditRun, BarrierFinding, ActionStep, PersonaType } from '@/lib/barrierlens/types';

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
  // Benchmark scenarios quick-pick
  const benchmarkPresets = [
    { label: 'Full Store Benchmark', url: '/benchmark', goal: 'Subscribe to newsletter and test confirmation modal' },
    { label: 'Keyboard Trap Modal', url: '/fixtures/keyboard-trap', goal: 'Navigate into modal and escape back to main page' },
    { label: 'Unlabeled AccName', url: '/fixtures/accname-wcag', goal: 'Identify and activate all icon action buttons' },
    { label: 'Focus Loss on Close', url: '/fixtures/focus-loss', goal: 'Open drawer, close it, and resume reading order' },
  ];

  // Active key state for on-screen physical keycaps
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeElementSelector, setActiveElementSelector] = useState<string>('body');

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
    }
  }, [auditResult, streamingStep]);

  const physicalKeycaps = [
    { key: 'Tab', label: 'Tab ⇥' },
    { key: 'Shift+Tab', label: '⇧ Tab' },
    { key: 'Enter', label: 'Enter ↵' },
    { key: 'Space', label: 'Space ␣' },
    { key: 'Escape', label: 'Esc ⎋' },
    { key: 'Type', label: 'Type Text' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Config Station */}
      <div className="rounded-3xl bg-[#121215]/90 border border-white/[0.08] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#0071e3]/10 via-[#30d158]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#30d158] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#30d158]">
                Dual-Mode Autonomous Cockpit
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Task-Conditioned Audit Studio
            </h2>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Dispatches multi-agent personas into an isolated Chromium CDP sandbox. Zero simulated mouse clicks. Evaluates real task completion under physical assistive constraints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!auditResult && (
              <button
                type="button"
                onClick={onLoadBenchmarkFindings}
                className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white border border-white/[0.08] transition-all"
              >
                Load Benchmark Ground Truth
              </button>
            )}
            <button
              type="button"
              disabled={isAuditing}
              onClick={onRunAudit}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white shadow-lg transition-all ${
                isAuditing 
                  ? 'bg-[#0071e3]/50 cursor-wait' 
                  : 'bg-[#0071e3] hover:bg-[#0077ed] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isAuditing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Auditing... (Step {streamingStep})</span>
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

        {/* Input Parameters Grid */}
        <div className="mt-6 pt-6 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Target URL */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
              Target Web Application URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. /benchmark or https://myapp.com"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-mono"
            />
          </div>

          {/* Goal Statement */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
              User Task Milestone Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What should a user be able to accomplish?"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>

          {/* Max Steps Slider */}
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                Max Steps
              </label>
              <span className="text-xs font-mono text-white">{maxSteps}</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={maxSteps}
              onChange={(e) => setMaxSteps(Number(e.target.value))}
              className="w-full accent-[#0071e3] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer mt-3"
            />
          </div>
        </div>

        {/* Benchmark Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#86868b] mr-1">Quick Presets:</span>
          {benchmarkPresets.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => {
                setTargetUrl(preset.url);
                setGoal(preset.goal);
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-[11px] text-[#d1d1d6] transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Cockpit Dual-View (Live Browser Canvas vs Streaming Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive Browser Viewport & Keycaps */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-[#121215]/95 border border-white/[0.08] overflow-hidden shadow-2xl flex flex-col h-[560px]">
            {/* Viewport Top Bar */}
            <div className="px-4 py-3 bg-[#0a0a0c] border-b border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[11px] font-mono text-[#86868b] ml-2 truncate max-w-[280px]">
                  {targetUrl}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-mono text-[#86868b]">
                  CDP Isolation
                </span>
                <span className="w-2 h-2 rounded-full bg-[#30d158] animate-ping" />
              </div>
            </div>

            {/* Viewport Canvas */}
            <div className="flex-1 bg-[#050507] p-6 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Virtual Target Focus Overlay */}
              <div className="w-full max-w-md p-6 rounded-2xl bg-[#1c1c20] border border-white/[0.1] shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                    Active Sandbox Target
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0071e3]/20 text-[#0071e3] border border-[#0071e3]/30">
                    Focused: {activeElementSelector}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                  <div className="text-xs text-[#f5f5f7] font-medium">
                    {goal}
                  </div>
                  <div className="text-[11px] text-[#86868b] flex items-center justify-between">
                    <span>Persona constraint:</span>
                    <span className="font-mono text-white capitalize">{persona}-only</span>
                  </div>
                </div>

                {/* Simulated Focus Ring Indicator */}
                <div className="p-3 rounded-xl border-2 border-dashed border-[#0071e3] bg-[#0071e3]/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
                    <span className="font-mono text-[11px] text-white">Focus Target: {activeElementSelector}</span>
                  </div>
                  <span className="text-[10px] text-[#86868b]">Level A</span>
                </div>
              </div>

              {/* Status Message Overlay */}
              {isAuditing && (
                <div className="absolute bottom-4 left-4 right-4 px-4 py-2.5 rounded-xl bg-[#121215]/90 backdrop-blur-xl border border-white/[0.1] text-xs text-white flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0071e3] animate-spin" />
                  <span className="truncate">{streamingStatus || 'Auditor executing next action...'}</span>
                </div>
              )}
            </div>

            {/* Viewport Bottom Controls: Physical On-Screen Keycaps */}
            <div className="p-4 bg-[#0a0a0c] border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                <span className="font-semibold uppercase tracking-wider">Physical Keystroke Visualizer</span>
                <span>Actions restricted to real keyboard input</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {physicalKeycaps.map((kc) => {
                  const isActive = activeKey?.toLowerCase().includes(kc.key.toLowerCase());
                  return (
                    <div
                      key={kc.key}
                      className={`px-3.5 py-2 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-150 flex items-center gap-1.5 select-none ${
                        isActive
                          ? 'bg-[#0071e3] text-white shadow-[0_0_16px_rgba(0,113,227,0.6)] scale-105 border border-white/20'
                          : 'bg-white/[0.05] text-[#86868b] border border-white/[0.06]'
                      }`}
                    >
                      <span>{kc.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Streaming Action Timeline & Findings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-[#121215]/95 border border-white/[0.08] p-5 shadow-2xl flex flex-col h-[560px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0071e3]" />
                <span className="text-xs font-bold text-white tracking-tight">Streaming Action Timeline</span>
              </div>
              <span className="text-[11px] font-mono text-[#86868b]">
                {auditResult?.steps?.length || streamingStep} Steps Executed
              </span>
            </div>

            {/* Steps & Findings Stream List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
              {/* If no steps yet */}
              {(!auditResult?.steps || auditResult.steps.length === 0) && !isAuditing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#86868b]">
                  <Compass className="w-8 h-8 text-[#86868b]/40 animate-pulse" />
                  <p className="text-xs">No active execution trace.</p>
                  <p className="text-[11px] text-[#86868b]/70">
                    Click "Run Autonomous Audit" or "Load Benchmark" to stream actions in real time.
                  </p>
                </div>
              )}

              {/* Steps List */}
              {auditResult?.steps?.map((step: ActionStep) => (
                <div
                  key={step.idx}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-1.5 text-xs hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center font-mono text-[10px] text-white">
                        {step.idx}
                      </span>
                      <span className="font-semibold text-white capitalize">{step.actionType.replace('_', ' ')}</span>
                      {step.key && (
                        <span className="px-1.5 py-0.5 rounded bg-[#0071e3]/20 text-[#0071e3] font-mono text-[10px]">
                          {step.key}
                        </span>
                      )}
                    </div>
                    {/* Tier badge */}
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                      Tier {step.tier ?? 1}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#86868b] leading-relaxed">
                    {step.reasoning || `Focus shifted to ${step.activeElementAfter || 'element'}`}
                  </p>
                </div>
              ))}

              {/* Live Findings Discovered */}
              {auditResult?.findings && auditResult.findings.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                    Discovered Barriers ({auditResult.findings.length})
                  </div>
                  {auditResult.findings.map((f: BarrierFinding) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFinding(f)}
                      className="w-full text-left p-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 hover:border-red-500/40 transition-all space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-400 group-hover:text-red-300">
                          {f.title || f.kind}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-red-400/60 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-[#86868b] line-clamp-1">{f.summary}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
