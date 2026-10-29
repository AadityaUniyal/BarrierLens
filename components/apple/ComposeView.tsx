'use client';

import React from 'react';
import { 
  Keyboard, 
  Volume2, 
  Eye, 
  Play, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Shield,
  Layers
} from 'lucide-react';
import { PersonaType } from '@/lib/barrierlens/types';

interface ComposeViewProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  persona: PersonaType;
  setPersona: (p: PersonaType) => void;
  maxSteps: number;
  setMaxSteps: (steps: number) => void;
  isAuditing: boolean;
  onRunAudit: () => void;
}

export function ComposeView({
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
}: ComposeViewProps) {
  const goalPresets = [
    'Subscribe to newsletter and test confirmation modal',
    'Complete guest checkout without using mouse cursor',
    'Open settings dialog and dismiss via physical Escape key',
    'Navigate multi-column data dashboard in logical visual order',
  ];

  const estimatedLLMCalls = Math.min(Math.round(maxSteps * 0.4), 10);
  const estimatedSeconds = Math.round(maxSteps * 2.2);

  return (
    <div className="w-full apple-card rounded-3xl p-8 space-y-8">
      {/* Target URL & Large Goal Prompt */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#86868b] tracking-wider uppercase">
            Audit Objective & Target
          </label>
          <span className="text-[11px] font-mono text-[#0a84ff] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            Task-Conditioned Cascade
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What should a person be able to do on this page?"
            className="w-full text-xl font-semibold bg-[#1c1c1e] text-[#f5f5f7] placeholder-[#6e6e73] px-5 py-4 rounded-2xl border border-white/[0.08] focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/30 focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* Goal Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-[#6e6e73] font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
          </span>
          {goalPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setGoal(preset)}
              className="px-3 py-1 rounded-full text-xs bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#86868b] hover:text-[#f5f5f7] border border-white/[0.06] transition-all"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Target URL input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#86868b]">
          Target Web App URL
        </label>
        <div className="flex items-center">
          <span className="px-3.5 py-2.5 rounded-l-xl bg-[#1c1c1e] border border-r-0 border-white/[0.08] text-xs font-mono text-[#6e6e73]">
            URL
          </span>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full bg-[#1c1c1e] text-xs font-mono text-[#f5f5f7] px-4 py-2.5 rounded-r-xl border border-white/[0.08] focus:border-[#0a84ff] focus:outline-none"
          />
        </div>
      </div>

      {/* Persona Segmented Control & Budget Slider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/[0.06]">
        {/* Persona Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-[#86868b]">
            Physical Persona Constraint
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[#1c1c1e] border border-white/[0.06]">
            {[
              { id: 'keyboard', label: 'Keyboard', icon: Keyboard, tag: 'Physical CDP' },
              { id: 'screen_reader', label: 'Screen Reader', icon: Volume2, tag: 'Auditory FIFO' },
              { id: 'low_vision', label: '400% Zoom', icon: Eye, tag: 'Foveated Crop' },
            ].map((item) => {
              const Icon = item.icon;
              const active = persona === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPersona(item.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all ${
                    active
                      ? 'bg-[#2c2c2e] text-[#f5f5f7] shadow-md border border-white/10'
                      : 'text-[#86868b] hover:text-[#f5f5f7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${active ? 'text-[#0a84ff]' : 'text-current'}`} />
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-[9px] text-[#6e6e73] font-mono mt-0.5">{item.tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Slider */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-[#86868b]">
              Per-Run Budget & Safety Constraints
            </label>
            <span className="font-mono text-[#0a84ff] font-semibold">{maxSteps} steps max</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] space-y-3">
            <input
              type="range"
              min={4}
              max={25}
              value={maxSteps}
              onChange={(e) => setMaxSteps(Number(e.target.value))}
              className="w-full h-1.5 bg-[#2c2c2e] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-[#86868b]">
              <span>~{estimatedLLMCalls} max LLM calls</span>
              <span>Est. time: ~{estimatedSeconds}s</span>
              <span className="text-[#30d158]">75% non-LLM steps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onRunAudit}
        disabled={isAuditing}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0071e3] to-[#0a84ff] hover:from-[#0077ed] hover:to-[#1e90ff] text-white font-semibold text-sm shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 active:scale-[0.99]"
      >
        {isAuditing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span>Autonomous Agent Auditing Flow with Chromium CDP...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current text-white" />
            <span>Run Task-Conditioned Audit</span>
          </>
        )}
      </button>
    </div>
  );
}
