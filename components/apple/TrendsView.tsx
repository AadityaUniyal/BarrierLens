'use client';

import React from 'react';
import { LineChart, AlertCircle, ArrowUpRight, CheckCircle2, GitCommit, ShieldAlert } from 'lucide-react';

interface RunRecord {
  id: string;
  persona: string;
  status: string;
  task_success: boolean;
  effort_ratio: number;
  started_at: string;
}

interface TrendsViewProps {
  runs: RunRecord[];
}

export function TrendsView({ runs }: TrendsViewProps) {
  // Sparkline data points
  const points = [1.2, 1.4, 1.3, 1.5, 4.2, 4.0];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-[#0a84ff]" />
            Trends & Flow Drift Sentinel
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            CUSUM change-point detection on Effort Ratio time series & regression tracking across deployments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-rose-500/10 text-[#ff453a] border border-rose-500/20 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            1 Drift Alert Detected (PR #42)
          </span>
        </div>
      </div>

      {/* Main Sparkline Card */}
      <div className="apple-card rounded-3xl p-8 border border-white/[0.08] shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#86868b] uppercase">Checkout Flow Effort Ratio History</span>
            <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
              4.0x
              <span className="text-xs font-mono text-[#ff453a] font-normal flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +2.7x regression
              </span>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-[#86868b]">
            <div>Detection Method: CUSUM Changepoint</div>
            <div className="text-[#30d158]">Baseline Target: &lt; 1.5x</div>
          </div>
        </div>

        {/* CSS Sparkline Visualization */}
        <div className="h-44 w-full bg-[#090a0f] rounded-2xl p-6 border border-white/[0.05] flex items-end justify-between gap-4">
          {points.map((val, idx) => {
            const heightPercent = (val / 4.5) * 100;
            const isSpike = val >= 4.0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <span className={`text-[11px] font-mono font-semibold ${isSpike ? 'text-[#ff453a]' : 'text-slate-400'}`}>
                  {val}x
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[48px] rounded-t-lg transition-all ${
                    isSpike
                      ? 'bg-gradient-to-t from-rose-950 to-rose-500 border-t-2 border-rose-400 shadow-lg shadow-rose-500/20'
                      : 'bg-gradient-to-t from-[#1c1c1e] to-[#0a84ff]/60 border-t-2 border-[#0a84ff]'
                  }`}
                />
                <span className="text-[10px] font-mono text-[#6e6e73]">
                  {idx === 4 ? 'PR #42' : `v1.${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sentinel Alert Box */}
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#ff453a] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-rose-300">Flow Drift Detected: Significant Effort Jump</div>
            <p className="text-slate-400 leading-relaxed">
              Commit <code className="text-white font-mono">feat(checkout): add modal newsletter step</code> caused the keyboard effort ratio to spike from 1.3x to 4.2x due to an introduced un-escapable modal dialog.
            </p>
          </div>
        </div>
      </div>

      {/* Audit History Table from Neon Postgres */}
      <div className="apple-card rounded-3xl p-6 border border-white/[0.08] shadow-xl space-y-4">
        <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
          Recorded Audit History (Neon Postgres)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-[#6e6e73] border-b border-white/[0.08]">
              <tr>
                <th className="pb-3 font-medium">Run ID</th>
                <th className="pb-3 font-medium">Persona</th>
                <th className="pb-3 font-medium">Effort Ratio</th>
                <th className="pb-3 font-medium">Result</th>
                <th className="pb-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {runs.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 text-white truncate max-w-[120px]">{r.id}</td>
                  <td className="py-3 text-[#86868b]">{r.persona}</td>
                  <td className="py-3 text-white font-bold">{r.effort_ratio}x</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      r.task_success
                        ? 'bg-emerald-500/10 text-[#30d158]'
                        : 'bg-rose-500/10 text-[#ff453a]'
                    }`}>
                      {r.task_success ? 'PASSED' : 'BLOCKED'}
                    </span>
                  </td>
                  <td className="py-3 text-[#6e6e73]">{r.started_at ? new Date(r.started_at).toLocaleDateString() : 'Recent'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
