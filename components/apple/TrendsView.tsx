'use client';

import React, { useMemo } from 'react';
import { LineChart, AlertCircle, ArrowUpRight, CheckCircle2, GitCommit, ShieldAlert, Activity } from 'lucide-react';
import { DriftSentinelEngine, CUSUMResult } from '@/lib/barrierlens/engines/drift-sentinel';

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
  const driftSentinel = useMemo(() => new DriftSentinelEngine(), []);

  // Use recorded effort ratios if available; otherwise use benchmark effort history
  const points = useMemo(() => {
    if (runs && runs.length >= 2) {
      return runs.map(r => Number(r.effort_ratio) || 1.0);
    }
    return [1.2, 1.4, 1.3, 1.5, 4.2, 4.0];
  }, [runs]);

  // Execute CUSUM Statistical Change-Point Analysis
  const driftResult: CUSUMResult = useMemo(() => {
    return driftSentinel.detectDrift(points);
  }, [driftSentinel, points]);

  const currentEffort = points[points.length - 1] ?? 4.0;
  const initialEffort = points[0] ?? 1.2;
  const deltaEffort = (currentEffort - initialEffort).toFixed(1);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.017em] text-white flex items-center gap-2.5">
            <LineChart className="w-5 h-5 text-[#0a84ff]" />
            Trends &amp; Flow Drift Sentinel
          </h2>
          <p className="text-[13px] text-[#86868b] tracking-[0.005em] mt-0.5">
            CUSUM change-point detection on Effort Ratio time series &amp; regression tracking across deployments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {driftResult.hasDrift ? (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-rose-500/10 text-[#ff453a] border-hairline border-rose-500/30 flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Critical Drift Alert: CUSUM {driftResult.cumulativeSum} &gt; {driftResult.threshold}
            </span>
          ) : (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-[#30d158] border-hairline border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Flow Stability Nominal (CUSUM {driftResult.cumulativeSum})
            </span>
          )}
        </div>
      </div>

      {/* Main Sparkline Card */}
      <div className="apple-vibrancy-regular rounded-3xl p-8 border-hairline shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider font-mono">
              Checkout Flow Effort Ratio History
            </span>
            <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
              {currentEffort.toFixed(1)}x
              {Number(deltaEffort) > 0 ? (
                <span className="text-xs font-mono text-[#ff453a] font-normal flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +{deltaEffort}x regression
                </span>
              ) : (
                <span className="text-xs font-mono text-[#30d158] font-normal flex items-center">
                  nominal stability
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-xs font-mono text-[#86868b] space-y-0.5">
            <div>Detection Engine: CUSUM Change-Point</div>
            <div className="text-[#30d158]">Baseline Target: &le; {driftResult.baselineEffortRatio}x</div>
            <div className="text-[#0a84ff]">Threshold (h): {driftResult.threshold} | Allowance (k): 0.5</div>
          </div>
        </div>

        {/* CSS Sparkline Visualization */}
        <div className="h-44 w-full bg-[#090a0f] rounded-2xl p-6 border border-white/[0.05] flex items-end justify-between gap-4">
          {points.map((val, idx) => {
            const maxVal = Math.max(...points, 5.0);
            const heightPercent = Math.min(100, Math.max(15, (val / maxVal) * 100));
            const isChangePoint = driftResult.hasDrift && driftResult.changePointIndex === idx;
            const isDriftExceeded = driftResult.hasDrift && driftResult.changePointIndex !== undefined && idx >= driftResult.changePointIndex;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <span className={`text-[11px] font-mono font-semibold ${isDriftExceeded ? 'text-[#ff453a]' : 'text-slate-400'}`}>
                  {val.toFixed(1)}x
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[48px] rounded-t-lg transition-all ${
                    isChangePoint
                      ? 'bg-gradient-to-t from-rose-950 via-rose-600 to-rose-400 border-t-2 border-rose-300 shadow-xl shadow-rose-500/40 ring-1 ring-rose-400'
                      : isDriftExceeded
                      ? 'bg-gradient-to-t from-rose-950 to-rose-500 border-t-2 border-rose-400 shadow-lg shadow-rose-500/20'
                      : 'bg-gradient-to-t from-[#1c1c1e] to-[#0a84ff]/60 border-t-2 border-[#0a84ff]'
                  }`}
                />
                <span className={`text-[10px] font-mono ${isChangePoint ? 'text-rose-400 font-bold' : 'text-[#6e6e73]'}`}>
                  {idx === 4 ? 'PR #42' : `Run #${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sentinel Alert Box */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
          driftResult.hasDrift
            ? 'bg-rose-950/30 border-rose-500/30'
            : 'bg-emerald-950/20 border-emerald-500/30'
        }`}>
          {driftResult.hasDrift ? (
            <AlertCircle className="w-5 h-5 text-[#ff453a] shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#30d158] shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <div className={`font-semibold ${driftResult.hasDrift ? 'text-rose-300' : 'text-emerald-300'}`}>
              {driftResult.hasDrift ? 'Flow Drift Detected: Significant Interaction Effort Jump' : 'Flow Stability Confirmed'}
            </div>
            <p className="text-slate-400 leading-relaxed">
              {driftResult.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Audit History Table from Neon Postgres */}
      <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-hairline">
          <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider font-mono">
            Recorded Audit History (Neon Postgres)
          </h3>
          <span className="text-[11px] font-mono text-[#0a84ff]">
            {runs.length} Runs Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-[#6e6e73] border-b border-hairline">
              <tr>
                <th className="pb-3 font-medium">Run ID</th>
                <th className="pb-3 font-medium">Persona</th>
                <th className="pb-3 font-medium">Effort Ratio</th>
                <th className="pb-3 font-medium">Result</th>
                <th className="pb-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {runs.length > 0 ? (
                runs.map((r, i) => (
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
                ))
              ) : (
                [
                  { id: 'run_baseline_01', persona: 'keyboard', effort_ratio: 1.2, task_success: true, started_at: '2026-11-01' },
                  { id: 'run_baseline_02', persona: 'keyboard', effort_ratio: 1.4, task_success: true, started_at: '2026-11-01' },
                  { id: 'run_baseline_03', persona: 'keyboard', effort_ratio: 1.3, task_success: true, started_at: '2026-11-02' },
                  { id: 'run_drift_04', persona: 'keyboard', effort_ratio: 4.2, task_success: false, started_at: '2026-11-02' },
                ].map((r, i) => (
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
                    <td className="py-3 text-[#6e6e73]">{r.started_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
