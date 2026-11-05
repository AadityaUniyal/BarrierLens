'use client';

import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Compass, 
  Volume2, 
  Key, 
  ExternalLink,
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react';
import { AuditRun } from '@/lib/barrierlens/types';

interface PulseDashboardProps {
  runsHistory: any[];
  latestRun: AuditRun | null;
  onOpenInspector: () => void;
  onOpenRemedy: () => void;
  onOpenGenome: () => void;
  onOpenVault: () => void;
  onRunQuickAudit: () => void;
  onSelectRun?: (run: any) => void;
  isAuditing: boolean;
}

export function PulseDashboard({
  runsHistory,
  latestRun,
  onOpenInspector,
  onOpenRemedy,
  onOpenGenome,
  onOpenVault,
  onRunQuickAudit,
  onSelectRun,
  isAuditing
}: PulseDashboardProps) {
  // Derive active run (either live latestRun or most recent historical run)
  const active = latestRun || (runsHistory.length > 0 ? runsHistory[0] : null);

  // Dynamic 3-Ring Computations
  const totalFindings = active?.findings ? active.findings.length : (active?.payload?.findings?.length || 1);
  const criticalFindings = active?.findings 
    ? active.findings.filter((f: any) => (f.severity === 'critical' || f.severity === 'high') && !f.verifiedFix).length 
    : (active?.task_success ? 0 : 1);

  // Ring 1 (Red / Outer): Spatial Traversal & Focus Traps (100% when no traps or all fixed)
  const spatialScore = Math.max(25, Math.min(100, Math.round((1 - (criticalFindings / Math.max(1, totalFindings))) * 100)));

  // Ring 2 (Green / Middle): Auditory Flow & Speech Parity (Monotonic Kendall Tau)
  const auditoryScore = active?.kendallTau?.tau !== undefined 
    ? Math.max(30, Math.min(100, Math.round((active.kendallTau.tau + 1) * 50))) 
    : (active?.task_success ? 94 : 78);

  // Ring 3 (Blue / Inner): Cognitive Friction & Direct Action Ratio
  const cognitiveScore = active?.effortRatio 
    ? Math.max(30, Math.min(100, Math.round(100 / Math.max(1, active.effortRatio * 0.25)))) 
    : 92;

  // Table rows to display
  const displayRuns = runsHistory.length > 0 ? runsHistory : [
    {
      id: 'run_sample_benchmark_01',
      target_url: 'https://barrierlens-seven.vercel.app/benchmark',
      persona: 'keyboard',
      goal_text: 'Navigate accessible catalog & trigger modal dialog',
      task_success: true,
      started_at: '15 mins ago'
    },
    {
      id: 'run_sample_checkout_02',
      target_url: 'https://barrierlens-seven.vercel.app',
      persona: 'screen_reader',
      goal_text: 'Complete passkey sign-in with live voice announcement',
      task_success: true,
      started_at: '1 hour ago'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Greeting & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <span className="text-[12px] font-semibold tracking-wider uppercase text-[#86868b]">
              Pulse · Continuous Accessibility Radar
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
            Accessibility Overview
          </h1>
          <p className="text-[14px] text-[#86868b] mt-0.5">
            Real-time traversability telemetry across your verified web properties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunQuickAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-[13px] font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {isAuditing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Auditing Live...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Quick Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Apple Watch 3-Ring Activity Widget & Live Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Apple Watch 3-Ring Widget (5 Columns) */}
        <div className="lg:col-span-5 apple-vibrancy-regular rounded-3xl p-6 border-hairline flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b] block">
                Activity Scorecard
              </span>
              <h2 className="text-lg font-semibold text-[#f5f5f7]">Physical Traversability</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border-hairline text-[11px] text-[#a1a1a6]">
              <Activity className="w-3.5 h-3.5 text-[#30d158]" />
              <span>Live Pulse</span>
            </div>
          </div>

          {/* 3-Ring SVG Concentric Visualizer */}
          <div className="flex items-center justify-center my-4 relative">
            <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Outer Ring Background (Red / Spatial) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ff453a" strokeOpacity="0.15" strokeWidth="6" />
              {/* Outer Ring Progress */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#ff453a"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - spatialScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />

              {/* Middle Ring Background (Green / Auditory) */}
              <circle cx="50" cy="50" r="32" fill="transparent" stroke="#30d158" strokeOpacity="0.15" strokeWidth="6" />
              {/* Middle Ring Progress */}
              <circle
                cx="50"
                cy="50"
                r="32"
                fill="transparent"
                stroke="#30d158"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - auditoryScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />

              {/* Inner Ring Background (Blue / Cognitive) */}
              <circle cx="50" cy="50" r="24" fill="transparent" stroke="#0a84ff" strokeOpacity="0.15" strokeWidth="6" />
              {/* Inner Ring Progress */}
              <circle
                cx="50"
                cy="50"
                r="24"
                fill="transparent"
                stroke="#0a84ff"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - cognitiveScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Central Score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold tracking-tight text-[#f5f5f7]">
                {Math.round((spatialScore + auditoryScore + cognitiveScore) / 3)}%
              </span>
              <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold">Traversable</span>
            </div>
          </div>

          {/* Legend Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.06] text-center">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff453a]" />
                <span className="text-[11px] text-[#86868b]">Spatial</span>
              </div>
              <p className="text-sm font-semibold text-[#f5f5f7]">{spatialScore}%</p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#30d158]" />
                <span className="text-[11px] text-[#86868b]">Auditory</span>
              </div>
              <p className="text-sm font-semibold text-[#f5f5f7]">{auditoryScore}%</p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0a84ff]" />
                <span className="text-[11px] text-[#86868b]">Cognitive</span>
              </div>
              <p className="text-sm font-semibold text-[#f5f5f7]">{cognitiveScore}%</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights & Direct Navigation (7 Columns) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Inspector Autonomous Traversal */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border-hairline border-blue-500/20 flex items-center justify-center text-[#0a84ff]">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7]">Autonomous Inspector</h3>
                <p className="text-[12px] text-[#86868b] mt-1">
                  Evaluates interactive task flows using physical keyboard keycaps and CDP accessibility trees.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenInspector}
              className="mt-6 flex items-center justify-between text-[12px] text-[#0a84ff] font-medium pt-3 border-t border-white/[0.06] group"
            >
              <span>Launch Live Inspector</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Card 2: Remedy Causal AST Repair */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border-hairline border-emerald-500/20 flex items-center justify-center text-[#30d158]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7]">Causal Remedy</h3>
                <p className="text-[12px] text-[#86868b] mt-1">
                  Synthesizes minimal surgical AST diffs and verifies fix stability in a headless Playwright sandbox.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenRemedy}
              className="mt-6 flex items-center justify-between text-[12px] text-[#30d158] font-medium pt-3 border-t border-white/[0.06] group"
            >
              <span>Review Surgical Fixes</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Card 3: Enterprise Vault & Team RBAC */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border-hairline border-purple-500/20 flex items-center justify-center text-[#bf5af2]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7]">Enterprise Vault</h3>
                <p className="text-[12px] text-[#86868b] mt-1">
                  Manage scoped API keys, cryptographic webhooks, and Bedrock model quotas.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenVault}
              className="mt-6 flex items-center justify-between text-[12px] text-[#bf5af2] font-medium pt-3 border-t border-white/[0.06] group"
            >
              <span>Manage Administration</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Card 4: Genome Intelligence */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border-hairline border-amber-500/20 flex items-center justify-center text-[#ff9f0a]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f5f5f7]">Genome Memory</h3>
                <p className="text-[12px] text-[#86868b] mt-1">
                  768-dimensional normalized barrier vector embeddings stored in Neon pgvector.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenGenome}
              className="mt-6 flex items-center justify-between text-[12px] text-[#ff9f0a] font-medium pt-3 border-t border-white/[0.06] group"
            >
              <span>Explore Genome Viz</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Recent Autonomous Runs Table */}
      <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#f5f5f7]">Recent Task Audits</h2>
            <p className="text-[12px] text-[#86868b]">Continuous monitoring runs saved in Neon PostgreSQL</p>
          </div>

          <button
            onClick={onOpenInspector}
            className="text-[12px] text-[#0a84ff] hover:underline flex items-center gap-1 font-medium"
          >
            <span>View all in Inspector</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                <th className="py-2.5 px-3">Target Domain</th>
                <th className="py-2.5 px-3">Persona</th>
                <th className="py-2.5 px-3">Task Goal</th>
                <th className="py-2.5 px-3">Cert Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-[13px]">
              {displayRuns.map((run: any) => (
                <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-mono text-[12px] text-[#f5f5f7] truncate max-w-[200px]">
                    {run.target_url || run.origin || 'benchmark.local'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border-hairline ${
                      run.persona === 'screen_reader'
                        ? 'bg-purple-500/10 text-[#bf5af2] border-purple-500/20'
                        : 'bg-blue-500/10 text-[#0a84ff] border-blue-500/20'
                    }`}>
                      {run.persona === 'screen_reader' ? 'Screen Reader' : 'Keyboard-Only'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#a1a1a6] truncate max-w-[280px]">
                    {run.goal_text || run.goal || 'General WCAG task evaluation'}
                  </td>
                  <td className="py-3 px-3">
                    {run.task_success ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#30d158] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Task Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#ff9f0a] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Barrier Detected</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        if (onSelectRun) {
                          onSelectRun(run);
                        } else {
                          onOpenInspector();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium border-hairline text-[#f5f5f7] transition-all"
                    >
                      Inspect Run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
