'use client';

import React, { useState, useEffect } from 'react';
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
  Code2
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
    <div className="space-y-6 text-[#f4f5f6]">
      
      {/* 1. Header & Configuration Station (Linear Slate) */}
      <div className="p-6 rounded-2xl bg-[#141517] border border-[#23262a] shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
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
                className="px-3.5 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#1f2226] text-xs font-medium text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#2d3137] transition-all"
              >
                Inspect Benchmark Proofs
              </button>
            )}
            <button
              type="button"
              disabled={isAuditing}
              onClick={onRunAudit}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                isAuditing 
                  ? 'bg-[#1f2226] text-[#9ba1a6] cursor-wait border border-[#2d3137]' 
                  : 'bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]'
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Target URL */}
          <div className="md:col-span-6 space-y-1">
            <label className="text-[11px] font-medium text-[#9ba1a6] uppercase tracking-wider">
              Target URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com or /benchmark"
              className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs text-[#f4f5f6] font-mono focus:outline-none focus:border-[#0090ff]"
            />
          </div>

          {/* User Goal */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-medium text-[#9ba1a6] uppercase tracking-wider">
              Task Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Subscribe to newsletter and test confirmation"
              className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs text-[#f4f5f6] focus:outline-none focus:border-[#0090ff]"
            />
          </div>

          {/* Persona Constraint */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-medium text-[#9ba1a6] uppercase tracking-wider">
              Persona
            </label>
            <div className="flex bg-[#0c0d0e] p-1 rounded-lg border border-[#23262a]">
              <button
                type="button"
                onClick={() => setPersona('keyboard')}
                className={`flex-1 py-1 text-xs rounded transition-all ${
                  persona === 'keyboard' 
                    ? 'bg-[#1f2226] text-[#f4f5f6] font-medium' 
                    : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                }`}
              >
                Keyboard
              </button>
              <button
                type="button"
                onClick={() => setPersona('screen_reader')}
                className={`flex-1 py-1 text-xs rounded transition-all ${
                  persona === 'screen_reader' 
                    ? 'bg-[#1f2226] text-[#f4f5f6] font-medium' 
                    : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                }`}
              >
                VoiceOver
              </button>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1c1e22]">
          <span className="text-[11px] text-[#6b7280]">Quick Target Scenarios:</span>
          {benchmarkPresets.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => {
                setTargetUrl(preset.url);
                setGoal(preset.goal);
              }}
              className="px-2.5 py-0.5 rounded bg-[#181a1d] hover:bg-[#1f2226] border border-[#26292d] text-[11px] text-[#9ba1a6] hover:text-[#f4f5f6] transition-all font-mono"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Cockpit Split-View (Linear Precision Canvas & Trace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Viewport & Mechanical Keystroke Visualizer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-[#141517] border border-[#23262a] overflow-hidden shadow-xl flex flex-col h-[520px]">
            
            {/* Viewport Header */}
            <div className="px-4 py-2.5 bg-[#101113] border-b border-[#23262a] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#30a46c]" />
                <span className="text-[#9ba1a6] truncate max-w-[320px]">
                  {targetUrl}
                </span>
              </div>
              <span className="text-[11px] text-[#6b7280]">
                Playwright CDP Active
              </span>
            </div>

            {/* Sandbox Viewport Canvas */}
            <div className="flex-1 bg-[#0c0d0e] p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-full max-w-md p-5 rounded-xl bg-[#141517] border border-[#23262a] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                    Current Focus Element
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0090ff]/10 text-[#0090ff] border border-[#0090ff]/30">
                    {activeElementSelector}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#1f2226] space-y-1">
                  <div className="text-xs text-[#f4f5f6] font-medium">
                    Goal: {goal}
                  </div>
                  <div className="text-[11px] text-[#9ba1a6]">
                    Traversal Space: <span className="text-[#f4f5f6] font-mono capitalize">{persona} only</span>
                  </div>
                </div>

                {/* Focus Ring Indicator */}
                <div className="p-2.5 rounded-lg border border-[#0090ff] bg-[#0090ff]/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0090ff]" />
                    <span className="font-mono text-[11px] text-[#f4f5f6]">
                      Target: {activeElementSelector}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9ba1a6] font-mono">WCAG 2.4.7</span>
                </div>
              </div>

              {/* Streaming Status Overlay */}
              {isAuditing && (
                <div className="absolute bottom-4 left-4 right-4 px-4 py-2.5 rounded-xl bg-[#141517] border border-[#2d3137] text-xs text-[#f4f5f6] flex items-center gap-2.5 shadow-2xl">
                  <div className="w-2 h-2 rounded-full bg-[#0090ff] animate-ping" />
                  <span className="truncate">{streamingStatus || 'Auditor executing next action...'}</span>
                </div>
              )}
            </div>

            {/* Bottom: Mechanical Physical Keystroke Visualizer */}
            <div className="p-4 bg-[#101113] border-t border-[#23262a] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#9ba1a6]">
                <span className="font-semibold uppercase tracking-wider text-[#6b7280]">
                  Physical Keystroke Visualizer
                </span>
                <span>Actions constrained to physical keys</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {physicalKeycaps.map((kc) => {
                  const isActive = activeKey?.toLowerCase().includes(kc.key.toLowerCase());
                  return (
                    <div
                      key={kc.key}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all duration-100 flex items-center gap-1.5 select-none ${
                        isActive
                          ? 'bg-[#0090ff] text-white shadow-[0_0_12px_rgba(0,144,255,0.4)] translate-y-0.5 border border-white/30'
                          : 'bg-[#181a1d] text-[#9ba1a6] border border-[#26292d]'
                      }`}
                    >
                      <span>{kc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Streaming Action Timeline & Findings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-[#141517] border border-[#23262a] p-5 shadow-xl flex flex-col h-[520px]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9ba1a6]" />
                <span className="text-xs font-bold text-[#f4f5f6] tracking-tight">
                  Action Execution Trace
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#9ba1a6]">
                {auditResult?.steps?.length || streamingStep} Steps Executed
              </span>
            </div>

            {/* Steps & Findings Stream List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              
              {/* Empty state */}
              {(!auditResult?.steps || auditResult.steps.length === 0) && !isAuditing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#6b7280]">
                  <Compass className="w-6 h-6 text-[#6b7280]/60" />
                  <p className="text-xs text-[#9ba1a6]">No active execution trace.</p>
                  <p className="text-[11px] text-[#6b7280]">
                    Click "Run Autonomous Audit" or "Inspect Benchmark Proofs" to start.
                  </p>
                </div>
              )}

              {/* Steps List */}
              {auditResult?.steps?.map((step: ActionStep) => (
                <div
                  key={step.idx}
                  className="p-3 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1.5 text-xs hover:border-[#34383e] transition-all"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#9ba1a6]">Step {step.idx}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#181a1d] text-[#9ba1a6] border border-[#23262a]">
                      Tier {step.tier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#f4f5f6]">
                      {step.actionType === 'press_key' ? `Press [${step.key}]` : `Type text`}
                    </span>
                    <span className="font-mono text-[11px] text-[#6b7280] truncate max-w-[160px]">
                      {step.activeElementAfter || 'body'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Finding Cards Alert */}
              {auditResult?.findings?.map((finding: BarrierFinding) => (
                <div
                  key={finding.id}
                  onClick={() => onSelectFinding(finding)}
                  className="p-3 rounded-xl bg-[#e5484d]/5 border border-[#e5484d]/30 space-y-1 text-xs cursor-pointer hover:bg-[#e5484d]/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#e5484d] font-bold">
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
                    <ChevronRight className="w-3 h-3 text-[#e5484d]" />
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
