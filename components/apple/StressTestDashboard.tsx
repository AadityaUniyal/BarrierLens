'use client';

import React, { useState } from 'react';
import { StressTestResult, LatentBarrier } from '@/lib/barrierlens/adversarial/stress-agent';
import { Flame, ShieldAlert, Activity, Gauge, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';

interface StressTestDashboardProps {
  onRunStressTest?: (config: { chaosLevel: 'mild' | 'moderate' | 'extreme'; enableMotorTremor: boolean }) => void;
  isTesting?: boolean;
  result?: StressTestResult | null;
}

export function StressTestDashboard({
  onRunStressTest,
  isTesting = false,
  result
}: StressTestDashboardProps) {
  const [chaosLevel, setChaosLevel] = useState<'mild' | 'moderate' | 'extreme'>('moderate');
  const [enableMotorTremor, setEnableMotorTremor] = useState(true);

  // Demo fallback data if standalone
  const activeResult: StressTestResult = result || {
    id: 'stress_run_981a',
    targetUrl: 'https://demo.barrierlens.ai',
    totalSteps: 25,
    statesExplored: 18,
    uniqueBarriersFound: 3,
    latentBarriers: [
      {
        id: 'latent_01',
        runId: 'stress_run_981a',
        stepIdx: 14,
        kind: 'keyboard_trap',
        trustTier: 'proven',
        wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
        severity: 'critical',
        severityScore: 9.4,
        severityInterval: [8.8, 9.9],
        title: 'Latent Focus Lockup under Rapid Escape Jitter',
        summary: 'Dialog animation race condition traps keyboard focus in backdrop when Escape key is pressed during transition.',
        evidence: { activeChaos: 'Stretched Async Transitions' },
        triggerCondition: 'Stretched Async Transitions (2000ms delay)',
        chaosLevel: 'moderate',
        onlyUnderStress: true,
        stressCategory: 'timing'
      },
      {
        id: 'latent_02',
        runId: 'stress_run_981a',
        stepIdx: 19,
        kind: 'target_size_violation',
        trustTier: 'proven',
        wcagRules: ['WCAG 2.2 2.5.8 Target Size (Minimum)'],
        severity: 'high',
        severityScore: 7.9,
        severityInterval: [7.2, 8.5],
        title: 'Touch Target Collapse under 320px Viewport',
        summary: 'Action buttons collapse into 18x18px targets under mobile narrow reflow, failing target size threshold.',
        evidence: { condition: 'Mobile Narrow Viewport (320px)' },
        triggerCondition: 'Mobile Narrow Viewport (320px)',
        chaosLevel: 'moderate',
        onlyUnderStress: true,
        stressCategory: 'viewport'
      }
    ],
    standardBarriers: [],
    coverageMetrics: {
      totalInteractiveElements: 24,
      elementsReached: 22,
      coveragePercent: 92,
      statesExplored: 18,
      maxDepthReached: 6,
      uniqueKeySequences: 34,
      personasTested: ['keyboard', 'screen_reader'],
      chaosConditionsTested: ['Mobile Narrow Viewport (320px)', 'Stretched Async Transitions', 'Windows High Contrast Mode']
    },
    chaosConditionsApplied: ['Mobile Narrow Viewport (320px)', 'Stretched Async Transitions', 'Windows High Contrast Mode'],
    durationMs: 4200,
    timestamp: new Date().toISOString()
  };

  return (
    <div className="space-y-5">
      {/* 1. Top Banner */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f4f5f6]">Adversarial Accessibility Stress Testing (AAST)</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  Red-Team AI
                </span>
              </div>
              <p className="text-[12px] text-[#9ba1a6]">
                Autonomous chaos injection, motor tremor simulation, and novelty-maximizing state exploration.
              </p>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            type="button"
            disabled={isTesting}
            onClick={() => onRunStressTest?.({ chaosLevel, enableMotorTremor })}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2 shadow-sm ${
              isTesting
                ? 'bg-rose-500/20 text-rose-300 cursor-not-allowed border border-rose-500/30'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Stress Test in Progress...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" /> Launch Stress Test
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Control Panel & Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chaos Level Selector */}
        <div className="rounded-xl p-4 bg-[#141517] border border-[#23262a] space-y-2.5">
          <span className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider block">
            Chaos Severity Level
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['mild', 'moderate', 'extreme'] as const).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setChaosLevel(lvl)}
                className={`py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${
                  chaosLevel === lvl
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-sm'
                    : 'bg-[#181a1d] text-[#9ba1a6] border-[#23262a] hover:bg-[#23262a]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#9ba1a6]">
            {chaosLevel === 'mild' && 'Low-probability timing jitter and minor viewport shifts.'}
            {chaosLevel === 'moderate' && 'Includes 320px viewport, Windows High Contrast Mode, and 3G throttle.'}
            {chaosLevel === 'extreme' && 'Full layout thrashing, rapid reflow, animation stripping, and severe tremor.'}
          </p>
        </div>

        {/* Motor Tremor Toggle */}
        <div className="rounded-xl p-4 bg-[#141517] border border-[#23262a] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider">
              Motor Tremor Simulation
            </span>
            <input
              type="checkbox"
              checked={enableMotorTremor}
              onChange={e => setEnableMotorTremor(e.target.checked)}
              className="accent-rose-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-[#9ba1a6]">
            Injects 50-380ms timing jitter, accidental repeat presses, and neighbor key slips (Tab ↔ Shift+Tab).
          </p>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3 h-3" /> Parkinson&apos;s &amp; Essential Tremor active
          </div>
        </div>

        {/* Coverage Radial Metric */}
        <div className="rounded-xl p-4 bg-[#141517] border border-[#23262a] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider block">
              Exploration Coverage
            </span>
            <span className="text-3xl font-semibold font-mono text-[#f4f5f6]">
              {activeResult.coverageMetrics.coveragePercent}%
            </span>
            <p className="text-[11px] text-[#9ba1a6]">
              {activeResult.coverageMetrics.elementsReached} of {activeResult.coverageMetrics.totalInteractiveElements} controls reached
            </p>
          </div>

          <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-mono text-rose-400 font-semibold text-xs">
            A* MCTS
          </div>
        </div>
      </div>

      {/* 3. Latent Barriers Discovered */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#f4f5f6] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Latent Barriers Discovered (Only Manifest Under Stress)
            </h3>
            <p className="text-[12px] text-[#9ba1a6] mt-0.5">
              Critical vulnerabilities that evade static linters and only trigger under human constraints.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-400 font-semibold">
            {activeResult.latentBarriers.length} Latent Barriers
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {activeResult.latentBarriers.map((barrier, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-[#181a1d] hover:bg-[#1c1f23] transition-colors border border-[#23262a] space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <h4 className="text-xs font-medium text-[#f4f5f6]">
                    {barrier.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Severity {barrier.severityScore}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {barrier.stressCategory} stress
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
                {barrier.summary}
              </p>

              <div className="p-2 rounded bg-[#0c0d0e] border border-[#23262a] text-[10px] font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[#62676d]">
                  Trigger: <span className="text-[#f4f5f6]">{barrier.triggerCondition}</span>
                </span>
                <span className="text-rose-400 font-semibold">
                  LATENT ONLY (0% static detection)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
