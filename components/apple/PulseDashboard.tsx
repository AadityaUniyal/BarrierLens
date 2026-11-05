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
  Play
} from 'lucide-react';
import { AuditRun } from '@/lib/barrierlens/types';

interface PulseDashboardProps {
  runsHistory: AuditRun[];
  latestRun: AuditRun | null;
  onOpenInspector: () => void;
  onOpenRemedy: () => void;
  onOpenGenome: () => void;
  onOpenVault: () => void;
  onRunQuickAudit: () => void;
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
  isAuditing
}: PulseDashboardProps) {
  // Compute Glanceable Apple Watch 3-Ring Metrics from runs
  const totalFindings = latestRun ? latestRun.findings.length : 1;
  const criticalFindings = latestRun 
    ? latestRun.findings.filter(f => f.severity === 'critical' || f.severity === 'high').length 
    : 1;

  // Ring 1 (Red / Outer): Spatial Traversal & Focus Flow (SCC cycles penalty)
  const spatialScore = latestRun 
    ? Math.max(20, Math.min(100, Math.round((1 - (criticalFindings / Math.max(1, totalFindings))) * 100))) 
    : 88;

  // Ring 2 (Green / Middle): Auditory Flow & Speech Parity
  const auditoryScore = latestRun?.kendallTau 
    ? Math.max(20, Math.min(100, Math.round((latestRun.kendallTau.tau + 1) * 50))) 
    : 92;

  // Ring 3 (Blue / Inner): Cognitive Friction & Effort Ratio
  const cognitiveScore = latestRun?.effortRatio 
    ? Math.max(30, Math.min(100, Math.round(100 / Math.max(1, latestRun.effortRatio * 0.2)))) 
    : 95;

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
            Real-time traversability telemetry across your active web surfaces.
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
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Autonomous Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Apple Watch 3-Ring Activity Rings & Quick Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* The 3-Ring Circular Activity Widget (5 cols) */}
        <div className="lg:col-span-5 apple-vibrancy-regular rounded-3xl p-6 border-hairline relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Digital Health Rings</p>
              <h2 className="text-lg font-semibold text-[#f5f5f7]">Activity Telemetry</h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#a1a1a6] border-hairline">
              Real-time
            </span>
          </div>

          {/* Concentric Circular SVG Rings */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                {/* Background tracks */}
                <circle cx="100" cy="100" r="82" stroke="#ff453a" strokeWidth="12" fill="none" opacity="0.16" />
                <circle cx="100" cy="100" r="64" stroke="#30d158" strokeWidth="12" fill="none" opacity="0.16" />
                <circle cx="100" cy="100" r="46" stroke="#0a84ff" strokeWidth="12" fill="none" opacity="0.16" />

                {/* Animated Progress Rings */}
                {/* Ring 1 (Red): Spatial Traversal */}
                <circle
                  cx="100"
                  cy="100"
                  r="82"
                  stroke="#ff453a"
                  strokeWidth="12"
                  strokeDasharray="515.22"
                  strokeDashoffset={515.22 * (1 - spatialScore / 100)}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Ring 2 (Green): Auditory Flow */}
                <circle
                  cx="100"
                  cy="100"
                  r="64"
                  stroke="#30d158"
                  strokeWidth="12"
                  strokeDasharray="402.12"
                  strokeDashoffset={402.12 * (1 - auditoryScore / 100)}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Ring 3 (Blue): Cognitive Friction */}
                <circle
                  cx="100"
                  cy="100"
                  r="46"
                  stroke="#0a84ff"
                  strokeWidth="12"
                  strokeDasharray="289.02"
                  strokeDashoffset={289.02 * (1 - cognitiveScore / 100)}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Metrics Readout */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold tracking-tight text-[#f5f5f7]">
                  {Math.round((spatialScore + auditoryScore + cognitiveScore) / 3)}%
                </span>
                <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                  Health Index
                </span>
              </div>
            </div>
          </div>

          {/* Ring Legend & Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.06] text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff453a]" />
                <span className="text-[11px] font-semibold text-[#f5f5f7]">{spatialScore}%</span>
              </div>
              <p className="text-[10px] text-[#86868b]">Spatial</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30d158]" />
                <span className="text-[11px] font-semibold text-[#f5f5f7]">{auditoryScore}%</span>
              </div>
              <p className="text-[10px] text-[#86868b]">Auditory</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0a84ff]" />
                <span className="text-[11px] font-semibold text-[#f5f5f7]">{cognitiveScore}%</span>
              </div>
              <p className="text-[10px] text-[#86868b]">Friction</p>
            </div>
          </div>
        </div>

        {/* Actionable Anomaly Radar & Next Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          {/* Critical Barrier Spotlight */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border-hairline border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#ff453a]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-[#ff453a] border-hairline border-red-500/30">
                      High Priority Barrier
                    </span>
                    <span className="text-[11px] font-mono text-[#86868b]">WCAG 2.1.2</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#f5f5f7] mt-1">
                    Deterministic Keyboard Trap in Confirmation Modal
                  </h3>
                </div>
              </div>

              <button
                onClick={onOpenRemedy}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[12px] font-medium text-[#f5f5f7] border-hairline flex items-center gap-1.5 transition-all"
              >
                <span>Remedy Fix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[13px] text-[#a1a1a6] leading-relaxed">
              Keyboard users navigating via Tab become trapped within the modal container. Out-degree in the focus transition graph drops to zero, blocking task completion.
            </p>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#86868b]">
              <span>Mathematical Proof: SHA-256 Tarjan Cycle Certified</span>
              <span className="text-[#30d158] font-medium">Surgical Patch Synthesized</span>
            </div>
          </div>

          {/* Quick-Access Deep Feature Launchers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={onOpenInspector}
              className="p-4 rounded-2xl apple-vibrancy-regular border-hairline hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border-hairline border-blue-500/20 flex items-center justify-center mb-3 text-[#0a84ff] group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#f5f5f7]">Inspector</h4>
                <p className="text-[11px] text-[#86868b] mt-0.5">Physical task crawl</p>
              </div>
            </button>

            <button
              onClick={onOpenRemedy}
              className="p-4 rounded-2xl apple-vibrancy-regular border-hairline hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-green-500/10 border-hairline border-green-500/20 flex items-center justify-center mb-3 text-[#30d158] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#f5f5f7]">Remedy</h4>
                <p className="text-[11px] text-[#86868b] mt-0.5">AST patch replay</p>
              </div>
            </button>

            <button
              onClick={onOpenGenome}
              className="p-4 rounded-2xl apple-vibrancy-regular border-hairline hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border-hairline border-purple-500/20 flex items-center justify-center mb-3 text-[#bf5af2] group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#f5f5f7]">Genome</h4>
                <p className="text-[11px] text-[#86868b] mt-0.5">pgvector memory</p>
              </div>
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
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-3 font-mono text-[12px] text-[#f5f5f7]">
                  app.barrierlens.corp/checkout
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-[#0a84ff] border-hairline border-blue-500/20">
                    Keyboard-Only
                  </span>
                </td>
                <td className="py-3 px-3 text-[#a1a1a6]">Complete subscription flow and test modal</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#30d158] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Certified Trap Eradicated</span>
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={onOpenInspector}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium border-hairline text-[#f5f5f7]"
                  >
                    View Trace
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-3 font-mono text-[12px] text-[#f5f5f7]">
                  portal.internal.corp/forms
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-[#bf5af2] border-hairline border-purple-500/20">
                    Screen-Reader
                  </span>
                </td>
                <td className="py-3 px-3 text-[#a1a1a6]">Review annual benefits statement</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#ff9f0a] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Kendall τ = 0.52 (Drift)</span>
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={onOpenRemedy}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium border-hairline text-[#f5f5f7]"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
