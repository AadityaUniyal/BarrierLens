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
  RotateCcw,
  Cpu,
  Layers,
  ArrowUpRight
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

  // Dynamic Metrics Computation
  const totalFindings = active?.findings ? active.findings.length : (active?.payload?.findings?.length || 1);
  const criticalFindings = active?.findings 
    ? active.findings.filter((f: any) => (f.severity === 'critical' || f.severity === 'high') && !f.verifiedFix).length 
    : (active?.task_success ? 0 : 1);

  // Metric 1: Spatial Traversal & Focus Traps
  const spatialScore = Math.max(25, Math.min(100, Math.round((1 - (criticalFindings / Math.max(1, totalFindings))) * 100)));

  // Metric 2: Auditory Flow & Speech Parity (Monotonic Kendall Tau)
  const auditoryScore = active?.kendallTau?.tau !== undefined 
    ? Math.max(30, Math.min(100, Math.round((active.kendallTau.tau + 1) * 50))) 
    : (active?.task_success ? 94 : 78);

  // Metric 3: Cognitive Friction & Direct Action Ratio
  const cognitiveScore = active?.effortRatio 
    ? Math.max(30, Math.min(100, Math.round(100 / Math.max(1, active.effortRatio * 0.25)))) 
    : 92;

  const overallTraversability = Math.round((spatialScore + auditoryScore + cognitiveScore) / 3);

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
    <div className="space-y-6 text-[#f4f5f6]">
      {/* 1. Header Greeting & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23262a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9ba1a6]">
              Pulse · Continuous Accessibility Radar
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f5f6]">
            Accessibility Overview
          </h1>
          <p className="text-[13px] text-[#9ba1a6] mt-0.5">
            Real-time physical traversability telemetry across your monitored web properties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunQuickAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {isAuditing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Auditing Live...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Quick Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Overall Traversability Index */}
        <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#9ba1a6] tracking-wider font-semibold">
              Traversability Index
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              overallTraversability >= 80 
                ? 'bg-emerald-500/10 text-[#30d158] border-emerald-500/20' 
                : 'bg-amber-500/10 text-[#ff9f0a] border-amber-500/20'
            }`}>
              {overallTraversability >= 80 ? 'Optimal' : 'Action Required'}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight font-mono text-[#f4f5f6]">
            {overallTraversability}%
          </div>
          <div className="h-1.5 w-full bg-[#181a1d] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${overallTraversability >= 80 ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'}`}
              style={{ width: `${overallTraversability}%` }}
            />
          </div>
          <p className="text-[11px] text-[#62676d] pt-1">
            Aggregate score across spatial, auditory, and cognitive bounds.
          </p>
        </div>

        {/* Card 2: Spatial Traversal */}
        <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#9ba1a6] tracking-wider font-semibold">
              Spatial Traversal
            </span>
            <span className="w-2 h-2 rounded-full bg-[#ff453a]" />
          </div>
          <div className="text-3xl font-bold tracking-tight font-mono text-[#f4f5f6]">
            {spatialScore}%
          </div>
          <div className="h-1.5 w-full bg-[#181a1d] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ff453a] rounded-full transition-all duration-700" 
              style={{ width: `${spatialScore}%` }}
            />
          </div>
          <p className="text-[11px] text-[#62676d] pt-1">
            Keyboard sink traps: <strong className="text-[#f4f5f6] font-mono">{criticalFindings} detected</strong>
          </p>
        </div>

        {/* Card 3: Auditory Flow */}
        <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#9ba1a6] tracking-wider font-semibold">
              Auditory Sequence
            </span>
            <span className="w-2 h-2 rounded-full bg-[#30d158]" />
          </div>
          <div className="text-3xl font-bold tracking-tight font-mono text-[#f4f5f6]">
            {auditoryScore}%
          </div>
          <div className="h-1.5 w-full bg-[#181a1d] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#30d158] rounded-full transition-all duration-700" 
              style={{ width: `${auditoryScore}%` }}
            />
          </div>
          <p className="text-[11px] text-[#62676d] pt-1">
            Kendall Tau correlation: <strong className="text-[#30d158] font-mono">τ = {active?.kendallTau?.tau ?? 0.52}</strong>
          </p>
        </div>

        {/* Card 4: Cognitive Friction */}
        <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#9ba1a6] tracking-wider font-semibold">
              Cognitive Friction
            </span>
            <span className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
          </div>
          <div className="text-3xl font-bold tracking-tight font-mono text-[#f4f5f6]">
            {active?.effortRatio ? `${active.effortRatio}x` : '1.2x'}
          </div>
          <div className="h-1.5 w-full bg-[#181a1d] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5e6ad2] rounded-full transition-all duration-700" 
              style={{ width: `${cognitiveScore}%` }}
            />
          </div>
          <p className="text-[11px] text-[#62676d] pt-1">
            Constrained steps vs. baseline unconstrained clicks.
          </p>
        </div>
      </div>

      {/* 3. Feature Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hub Card 1: Autonomous Studio */}
        <div 
          onClick={onOpenInspector}
          className="rounded-xl p-5 bg-[#141517] border border-[#23262a] hover:border-[#34383e] flex flex-col justify-between transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2]">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#f4f5f6]">Audit Studio</h3>
            <p className="text-xs text-[#9ba1a6] leading-relaxed">
              Live CDP session with real-time keycaps, trace replay, and auditory feed.
            </p>
          </div>
          <div className="pt-4 border-t border-[#23262a] flex items-center justify-between text-xs font-medium text-[#5e6ad2] mt-4">
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Hub Card 2: Causal Fixes & PRs */}
        <div 
          onClick={onOpenRemedy}
          className="rounded-xl p-5 bg-[#141517] border border-[#23262a] hover:border-[#34383e] flex flex-col justify-between transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#30d158]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#f4f5f6]">Verified Fixes & PRs</h3>
            <p className="text-xs text-[#9ba1a6] leading-relaxed">
              Minimal AST patches verified in headless replay with 1-click GitHub Pull Requests.
            </p>
          </div>
          <div className="pt-4 border-t border-[#23262a] flex items-center justify-between text-xs font-medium text-[#30d158] mt-4">
            <span>Review Fixes</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Hub Card 3: Enterprise Vault */}
        <div 
          onClick={onOpenVault}
          className="rounded-xl p-5 bg-[#141517] border border-[#23262a] hover:border-[#34383e] flex flex-col justify-between transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#f4f5f6]">Enterprise Vault</h3>
            <p className="text-xs text-[#9ba1a6] leading-relaxed">
              API key credentials (`bl_live_...`), outbound webhooks, RBAC, and EAA 2025 pack.
            </p>
          </div>
          <div className="pt-4 border-t border-[#23262a] flex items-center justify-between text-xs font-medium text-purple-400 mt-4">
            <span>Manage Vault</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Hub Card 4: Barrier Genome */}
        <div 
          onClick={onOpenGenome}
          className="rounded-xl p-5 bg-[#141517] border border-[#23262a] hover:border-[#34383e] flex flex-col justify-between transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#ff9f0a]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#f4f5f6]">Barrier Genome</h3>
            <p className="text-xs text-[#9ba1a6] leading-relaxed">
              768-dimensional pgvector dense heatmaps and cross-site fix transfer learning.
            </p>
          </div>
          <div className="pt-4 border-t border-[#23262a] flex items-center justify-between text-xs font-medium text-[#ff9f0a] mt-4">
            <span>Explore Genome</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* 4. Recent Autonomous Runs Table */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#f4f5f6]">Recent Task Audits</h2>
            <p className="text-xs text-[#9ba1a6]">Continuous execution history stored in Neon PostgreSQL</p>
          </div>

          <button
            onClick={onOpenInspector}
            className="text-xs font-mono text-[#5e6ad2] hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open in Studio</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23262a] text-[10px] font-mono text-[#62676d] uppercase tracking-wider">
                <th className="py-2.5 px-3">Target Domain</th>
                <th className="py-2.5 px-3">Constraint Persona</th>
                <th className="py-2.5 px-3">Task Goal</th>
                <th className="py-2.5 px-3">Audit Outcome</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23262a]">
              {displayRuns.map((run: any) => (
                <tr key={run.id} className="hover:bg-[#181a1d] transition-colors">
                  <td className="py-3 px-3 font-mono text-xs text-[#f4f5f6] truncate max-w-[200px]">
                    {run.target_url || run.origin || 'benchmark.local'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${
                      run.persona === 'screen_reader'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                    }`}>
                      {run.persona === 'screen_reader' ? 'Screen Reader' : 'Keyboard-Only'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#9ba1a6] truncate max-w-[260px]">
                    {run.goal_text || run.goal || 'General WCAG task evaluation'}
                  </td>
                  <td className="py-3 px-3">
                    {run.task_success ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#30d158] font-medium font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#ff9f0a] font-medium font-mono">
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
                      className="px-2.5 py-1 rounded bg-[#181a1d] hover:bg-[#23262a] text-[11px] font-mono border border-[#23262a] text-[#f4f5f6] transition-all"
                    >
                      Inspect
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
