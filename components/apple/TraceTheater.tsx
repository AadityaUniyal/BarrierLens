'use client';

import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { ActionStep, BarrierFinding } from '@/lib/barrierlens/types';

interface TraceTheaterProps {
  steps: ActionStep[];
  findings: BarrierFinding[];
  targetUrl: string;
}

export function TraceTheater({ steps, findings, targetUrl }: TraceTheaterProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(Math.max(0, steps.length - 1));
  const currentStep = steps[currentStepIndex] || steps[0];

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 0:
        return { label: 'Tier 0: Rule', color: 'bg-emerald-500/10 text-[#30d158] border-emerald-500/20' };
      case 1:
        return { label: 'Tier 1: Ranker', color: 'bg-purple-500/10 text-[#bf5af2] border-purple-500/20' };
      case 2:
        return { label: 'Tier 2: Groq LLaMA', color: 'bg-blue-500/10 text-[#0a84ff] border-blue-500/20' };
      case 3:
        return { label: 'Tier 3: Gemini Flash', color: 'bg-amber-500/10 text-[#ff9f0a] border-amber-500/20' };
      default:
        return { label: 'Tier 0', color: 'bg-white/10 text-white border-white/20' };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f5f5f7] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0a84ff]" />
            Trace Theater & Live Replay
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Step-by-step physical key execution with animated focus rings and decision hierarchy
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#86868b]">
          <span>Step {currentStepIndex + 1} of {steps.length || 1}</span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulated Browser Frame + Focus Ring Overlay + Keycaps HUD (7 cols) */}
        <div className="lg:col-span-7 apple-card rounded-3xl overflow-hidden flex flex-col justify-between border border-white/[0.08] shadow-2xl">
          {/* Browser Window Chrome */}
          <div className="px-4 py-3 bg-[#1c1c1e] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>

            <div className="px-4 py-1 rounded-lg bg-black/40 text-[11px] font-mono text-[#86868b] border border-white/[0.05] max-w-xs truncate">
              {targetUrl}
            </div>

            <div className="text-[11px] font-mono text-[#30d158]">
              CDP Active
            </div>
          </div>

          {/* Interactive Screen Viewport */}
          <div className="relative min-h-[360px] p-8 bg-[#090a0f] flex flex-col items-center justify-center">
            {/* Target element highlight with animated Apple focus ring */}
            <div className="relative p-6 rounded-2xl bg-[#161618] border border-white/10 max-w-sm w-full shadow-2xl text-center space-y-3">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-[#0a84ff] border border-blue-500/20">
                Focused Control
              </span>
              <div className="text-sm font-semibold text-white">
                {currentStep?.activeElementAfter || currentStep?.activeElementBefore || 'document.body'}
              </div>
              <p className="text-xs text-[#86868b]">
                {currentStep?.reasoning || 'Advancing focus traversal sequence toward checkout target'}
              </p>

              {/* Animated 2px Focus Ring */}
              <div className="absolute -inset-1.5 rounded-3xl border-2 border-[#0a84ff] animate-pulse pointer-events-none" />
            </div>

            {/* Live On-Screen Keycaps HUD */}
            <div className="absolute bottom-6 flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#86868b] uppercase">Dispatched Key:</span>
              <div className="apple-keycap px-4 py-2 text-sm text-white shadow-xl">
                {currentStep?.key || currentStep?.actionType || 'Tab'}
              </div>
            </div>
          </div>

          {/* Bottom Timeline Scrubber */}
          <div className="p-4 bg-[#1c1c1e] border-t border-white/[0.08] flex items-center gap-4">
            <button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white disabled:opacity-30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(0, steps.length - 1)}
              value={currentStepIndex}
              onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
              className="w-full h-1.5 bg-[#2c2c2e] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
            />

            <span className="text-xs font-mono text-[#86868b] min-w-[50px] text-right">
              {currentStepIndex + 1}/{steps.length}
            </span>
          </div>
        </div>

        {/* Right: Vertical Step Timeline (5 cols) */}
        <div className="lg:col-span-5 apple-card rounded-3xl p-6 flex flex-col justify-between max-h-[500px] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Step Execution Hierarchy
            </h3>
            <span className="text-[11px] font-mono text-[#30d158]">
              {steps.length} Traced Events
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1">
            {steps.map((step, idx) => {
              const isSelected = idx === currentStepIndex;
              const tier = getTierBadge(step.tier);

              return (
                <button
                  key={step.idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-full p-3 rounded-2xl text-left transition-all border flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#2c2c2e] border-white/20 shadow-md'
                      : 'bg-[#1c1c1e]/60 border-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <span className="text-xs font-mono text-[#6e6e73] font-semibold mt-0.5 w-5">
                    #{step.idx}
                  </span>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="apple-keycap px-2 py-0.5 text-[11px] text-white">
                        {step.key || step.actionType}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#86868b] truncate max-w-[220px]">
                      {step.reasoning}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
