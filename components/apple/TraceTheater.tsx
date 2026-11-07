'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Eye, 
  Cpu, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  Lock,
  ArrowRight,
  Monitor,
  Maximize2,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ActionStep, BarrierFinding } from '@/lib/barrierlens/types';

interface TraceTheaterProps {
  steps: ActionStep[];
  findings: BarrierFinding[];
  targetUrl: string;
}

export function TraceTheater({ steps, findings, targetUrl }: TraceTheaterProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(Math.max(0, steps.length - 1));
  const [isPlaying, setIsPlaying] = useState(false);
  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  // Keyboard navigation (Left / Right / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault();
        setCurrentStepIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steps.length]);

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 0:
        return { label: 'Tier 0: Rule Engine', color: 'bg-emerald-500/10 text-[#30d158] border-emerald-500/20' };
      case 1:
        return { label: 'Tier 1: Ranker', color: 'bg-purple-500/10 text-[#bf5af2] border-purple-500/20' };
      case 2:
        return { label: 'Tier 2: Groq LLaMA', color: 'bg-blue-500/10 text-[#0a84ff] border-blue-500/20' };
      case 3:
        return { label: 'Tier 3: Gemini Flash', color: 'bg-amber-500/10 text-[#ff9f0a] border-amber-500/20' };
      default:
        return { label: 'Tier 0: Rule', color: 'bg-white/10 text-[#f4f5f6] border-white/20' };
    }
  };

  const hasFindingAtStep = findings.some(f => 
    f.stepIdx === currentStep?.idx ||
    (f.evidence?.targetSelector && currentStep?.activeElementAfter?.includes(f.evidence.targetSelector))
  );

  return (
    <div className="w-full space-y-5">
      {/* 1. Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#23262a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9ba1a6]">
              Execution Trace Replay
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f5f6] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#5e6ad2]" />
            Trace Theater & Browser Telemetry
          </h2>
          <p className="text-[13px] text-[#9ba1a6] mt-0.5">
            Deterministic step-by-step physical key traversal with computed accessibility tree snapshots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#9ba1a6]">
            <span className="px-2.5 py-1 rounded-md bg-[#141517] border border-[#23262a]">
              Step <strong className="text-[#f4f5f6]">{currentStepIndex + 1}</strong> / {steps.length || 1}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#62676d]">
            <span className="apple-keycap px-1.5 py-0.5 text-[10px]">←</span>
            <span className="apple-keycap px-1.5 py-0.5 text-[10px]">→</span>
            <span>traverse</span>
            <span className="apple-keycap px-1.5 py-0.5 text-[10px] ml-1">Space</span>
            <span>play</span>
          </div>
        </div>
      </div>

      {/* 2. Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Simulated Browser Frame + Focus Ring Overlay + Keycaps HUD (7 cols) */}
        <div className="lg:col-span-7 bg-[#141517] rounded-xl overflow-hidden flex flex-col justify-between border border-[#23262a] shadow-xl">
          {/* Browser Window Chrome */}
          <div className="px-4 py-2.5 bg-[#181a1d] border-b border-[#23262a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>

            <div className="px-3 py-0.5 rounded bg-[#0c0d0e] text-[11px] font-mono text-[#9ba1a6] border border-[#23262a] max-w-sm truncate flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#30d158]" />
              <span>{targetUrl}</span>
            </div>

            <div className="text-[11px] font-mono text-[#30d158] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
              <span>CDP Session</span>
            </div>
          </div>

          {/* Interactive Screen Viewport */}
          <div className="relative min-h-[380px] p-8 bg-[#0c0d0e] flex flex-col items-center justify-center overflow-hidden">
            {/* Grid line background overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{
                backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Target element highlight with animated focus ring */}
            <div className="relative p-6 rounded-xl bg-[#141517] border border-[#23262a] max-w-md w-full shadow-2xl text-center space-y-3 z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20 font-medium">
                  Active Focus Node
                </span>
                {hasFindingAtStep && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-[#ff9f0a] border border-amber-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Barrier Detected</span>
                  </span>
                )}
              </div>

              <div className="text-sm font-mono font-semibold text-[#f4f5f6] bg-[#0c0d0e] p-2.5 rounded border border-[#23262a] text-left break-all">
                {currentStep?.activeElementAfter || currentStep?.activeElementBefore || 'document.body'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-left pt-1">
                <div className="p-2 rounded bg-[#181a1d] border border-[#23262a]">
                  <span className="text-[10px] text-[#62676d] uppercase block">Action Dispatched</span>
                  <span className="text-[#f4f5f6] font-semibold">{currentStep?.actionType || 'Keypress'}</span>
                </div>
                <div className="p-2 rounded bg-[#181a1d] border border-[#23262a]">
                  <span className="text-[10px] text-[#62676d] uppercase block">Decision Tier</span>
                  <span className="text-[#5e6ad2] font-semibold">{getTierBadge(currentStep?.tier ?? 0).label}</span>
                </div>
              </div>

              <p className="text-[12px] text-[#9ba1a6] text-left leading-relaxed pt-1 border-t border-[#23262a]">
                <strong className="text-[#f4f5f6]">Reasoning: </strong>
                {currentStep?.reasoning || 'Advancing focus traversal sequence along accessible DOM order'}
              </p>

              {/* High-contrast Linear focus ring indicator */}
              <div className="absolute -inset-1 rounded-2xl border-2 border-[#5e6ad2] pointer-events-none opacity-80" />
            </div>

            {/* Live On-Screen Keycaps HUD */}
            <div className="absolute bottom-5 flex items-center gap-3 z-10">
              <span className="text-[10px] font-mono text-[#9ba1a6] uppercase tracking-wider">Physical Keystroke:</span>
              <div className="apple-keycap px-3.5 py-1.5 text-xs text-[#f4f5f6] shadow-lg">
                {currentStep?.key || currentStep?.actionType || 'Tab'}
              </div>
            </div>
          </div>

          {/* Bottom Timeline Scrubber */}
          <div className="p-3.5 bg-[#181a1d] border-t border-[#23262a] flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-md bg-[#141517] hover:bg-[#23262a] text-[#f4f5f6] border border-[#23262a] transition-all"
              title={isPlaying ? 'Pause replay' : 'Play replay'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#ff9f0a]" /> : <Play className="w-3.5 h-3.5 text-[#30d158]" />}
            </button>

            <button
              onClick={() => setCurrentStepIndex(0)}
              className="p-1.5 rounded-md bg-[#141517] hover:bg-[#23262a] text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#23262a] transition-all"
              title="Reset to step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(0, steps.length - 1)}
              value={currentStepIndex}
              onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
              className="w-full h-1.5 bg-[#23262a] rounded-lg appearance-none cursor-pointer accent-[#5e6ad2]"
            />

            <span className="text-xs font-mono text-[#9ba1a6] min-w-[50px] text-right">
              {currentStepIndex + 1}/{steps.length}
            </span>
          </div>
        </div>

        {/* Right: Vertical Step Timeline (5 cols) */}
        <div className="lg:col-span-5 bg-[#141517] rounded-xl p-4 flex flex-col justify-between max-h-[500px] border border-[#23262a] shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#9ba1a6]">
              Execution Hierarchy
            </h3>
            <span className="text-[10px] font-mono text-[#30d158] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {steps.length} Actions Logged
            </span>
          </div>

          <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 py-3">
            {steps.map((step, idx) => {
              const isSelected = idx === currentStepIndex;
              const tier = getTierBadge(step.tier);

              return (
                <button
                  key={step.idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-full p-2.5 rounded-lg text-left border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-[#181a1d] border-[#5e6ad2] shadow-sm'
                      : 'bg-[#141517] border-[#23262a] hover:bg-[#181a1d]'
                  }`}
                >
                  <span className="text-xs font-mono text-[#62676d] font-semibold mt-0.5 w-5">
                    #{step.idx}
                  </span>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="apple-keycap px-2 py-0.5 text-[10px] text-[#f4f5f6]">
                        {step.key || step.actionType}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#9ba1a6] truncate max-w-[240px]">
                      {step.reasoning}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#23262a] flex items-center justify-between text-[11px] text-[#9ba1a6] font-mono">
            <span>Playwright CDP v1.42</span>
            <span className="text-[#30d158] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Stream
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
