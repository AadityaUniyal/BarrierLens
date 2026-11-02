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
          <h2 className="text-[22px] font-bold tracking-[-0.017em] text-[#f5f5f7] flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#0a84ff]" />
            Trace Theater & Live Replay
          </h2>
          <p className="text-[13px] text-[#86868b] tracking-[0.005em] mt-0.5">
            Step-by-step physical key execution with animated focus rings and decision hierarchy
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#86868b]">
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border-hairline">
            Step {currentStepIndex + 1} of {steps.length || 1}
          </span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulated Browser Frame + Focus Ring Overlay + Keycaps HUD (7 cols) */}
        <div className="lg:col-span-7 apple-vibrancy-regular rounded-3xl overflow-hidden flex flex-col justify-between border-hairline shadow-2xl">
          {/* Browser Window Chrome */}
          <div className="px-5 py-3.5 bg-black/40 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>

            <div className="px-4 py-1 rounded-xl bg-black/50 text-[11px] font-mono text-[#86868b] border-hairline max-w-xs truncate">
              {targetUrl}
            </div>

            <div className="text-[11px] font-mono text-[#30d158] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
              CDP Active
            </div>
          </div>

          {/* Interactive Screen Viewport */}
          <div className="relative min-h-[360px] p-8 bg-gradient-to-b from-[#090a0f] to-[#040407] flex flex-col items-center justify-center">
            {/* Target element highlight with animated Apple focus ring */}
            <div className="relative p-6 rounded-2xl bg-[#161618]/90 border-hairline max-w-sm w-full shadow-2xl text-center space-y-3">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0a84ff] border-hairline border-blue-500/30 font-semibold">
                Focused Control
              </span>
              <div className="text-[15px] font-semibold tracking-[-0.005em] text-white">
                {currentStep?.activeElementAfter || currentStep?.activeElementBefore || 'document.body'}
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">
                {currentStep?.reasoning || 'Advancing focus traversal sequence toward checkout target'}
              </p>

              {/* Animated 2px Focus Ring */}
              <div className="absolute -inset-1.5 rounded-3xl border-2 border-[#0a84ff] animate-pulse pointer-events-none" />
            </div>

            {/* Live On-Screen Keycaps HUD */}
            <div className="absolute bottom-6 flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#86868b] uppercase tracking-wider">Dispatched Key:</span>
              <div className="apple-keycap px-4 py-2 text-sm text-white shadow-xl active:translate-y-[1px]">
                {currentStep?.key || currentStep?.actionType || 'Tab'}
              </div>
            </div>
          </div>

          {/* Bottom Timeline Scrubber */}
          <div className="p-4 bg-black/40 border-t border-hairline flex items-center gap-4">
            <button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white disabled:opacity-30 border-hairline active:scale-[0.98] transition-all duration-150 ease-spring"
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
        <div className="lg:col-span-5 apple-vibrancy-regular rounded-3xl p-6 flex flex-col justify-between max-h-[500px] overflow-y-auto space-y-3 border-hairline shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider font-mono">
              Step Execution Hierarchy
            </h3>
            <span className="text-[11px] font-mono text-[#30d158] bg-emerald-500/10 px-2 py-0.5 rounded-full border-hairline border-emerald-500/30">
              {steps.length} Traced Events
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1">
            {steps.map((step, idx) => {
              const isSelected = idx === currentStepIndex;
              const tier = getTierBadge(step.tier);

              return (
                <button
                  key={step.idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-full p-3 rounded-2xl text-left border-hairline flex items-start gap-3 active:scale-[0.98] transition-all duration-150 ease-spring ${
                    isSelected
                      ? 'bg-white/[0.10] border-white/30 shadow-md ring-hairline ring-white/10'
                      : 'bg-black/20 hover:bg-white/[0.04]'
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
