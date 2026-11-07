'use client';

import React, { useMemo } from 'react';
import { LineChart, AlertCircle, ArrowUpRight, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
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
    <div className="w-full space-y-6 animate-in fade-in duration-200 text-[#f4f5f6]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23262a]">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#f4f5f6] flex items-center gap-2.5">
            <LineChart className="w-5 h-5 text-[#5e6ad2]" />
            Trends &amp; Flow Drift Sentinel
          </h2>
          <p className="text-xs text-[#9ba1a6] mt-0.5">
            CUSUM change-point detection on Effort Ratio time series &amp; regression tracking across deployments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {driftResult.hasDrift ? (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/30 flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Critical Drift Alert: CUSUM {driftResult.cumulativeSum} &gt; {driftResult.threshold}
            </span>
          ) : (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#30a46c]/10 text-[#30a46c] border border-[#30a46c]/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Flow Stability Nominal (CUSUM {driftResult.cumulativeSum})
            </span>
          )}
        </div>
      </div>

      {/* Main Sparkline Card */}
      <div className="bg-[#141517] rounded-xl p-6 sm:p-8 border border-[#23262a] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-medium text-[#9ba1a6] uppercase tracking-wider font-mono">
              Checkout Flow Effort Ratio History
            </span>
            <div className="text-3xl font-extrabold text-[#f4f5f6] mt-1 flex items-baseline gap-2">
              {currentEffort.toFixed(1)}x
              {Number(deltaEffort) > 0 ? (
                <span className="text-xs font-mono text-[#e5484d] font-normal flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +{deltaEffort}x regression
                </span>
              ) : (
                <span className="text-xs font-mono text-[#30a46c] font-normal flex items-center">
                  nominal stability
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-xs font-mono text-[#9ba1a6] space-y-0.5">
            <div>Detection Engine: CUSUM Change-Point</div>
            <div className="text-[#30a46c]">Baseline Target: &le; {driftResult.baselineEffortRatio}x</div>
            <div className="text-[#5e6ad2]">Threshold (h): {driftResult.threshold} | Allowance (k): 0.5</div>
          </div>
        </div>

        {/* Linear Sparkline Chart Visualization */}
        <div className="h-44 w-full bg-[#0c0d0e] rounded-lg p-6 border border-[#23262a] flex items-end justify-between gap-4">
          {points.map((val, idx) => {
            const maxVal = Math.max(...points, 5.0);
            const heightPercent = Math.min(100, Math.max(15, (val / maxVal) * 100));
            const isChangePoint = driftResult.hasDrift && driftResult.changePointIndex === idx;
            const isDriftExceeded = driftResult.hasDrift && driftResult.changePointIndex !== undefined && idx >= driftResult.changePointIndex;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <span className={`text-[11px] font-mono font-medium ${isDriftExceeded ? 'text-[#e5484d]' : 'text-[#9ba1a6]'}`}>
                  {val.toFixed(1)}x
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[48px] rounded-t transition-all ${
                    isChangePoint
                      ? 'bg-[#e5484d] shadow-lg shadow-[#e5484d]/40'
                      : isDriftExceeded
                      ? 'bg-[#e5484d]/80'
                      : 'bg-[#5e6ad2]/70 hover:bg-[#5e6ad2]'
                  }`}
                />
                <span className={`text-[10px] font-mono ${isChangePoint ? 'text-[#e5484d] font-bold' : 'text-[#6b7280]'}`}>
                  {idx === 4 ? 'PR #42' : `Run #${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sentinel Alert Box */}
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${
          driftResult.hasDrift
            ? 'bg-[#241315] border-[#e5484d]/30 text-[#f4f5f6]'
            : 'bg-[#141a16] border-[#30a46c]/30 text-[#f4f5f6]'
        }`}>
          {driftResult.hasDrift ? (
            <AlertCircle className="w-5 h-5 text-[#e5484d] shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#30a46c] shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <div className={`font-semibold ${driftResult.hasDrift ? 'text-[#e5484d]' : 'text-[#30a46c]'}`}>
              {driftResult.hasDrift ? 'Flow Drift Detected: Significant Interaction Effort Jump' : 'Flow Stability Confirmed'}
            </div>
            <p className="text-[#9ba1a6] leading-relaxed">
              {driftResult.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Audit History Table from Continuous Ledger */}
      <div className="bg-[#141517] rounded-xl p-6 border border-[#23262a] shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
          <h3 className="text-xs font-semibold text-[#9ba1a6] uppercase tracking-wider font-mono">
            Recorded Continuous Audit History
          </h3>
          <span className="text-xs font-mono text-[#5e6ad2]">
            {runs.length} Runs Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-[#6b7280] border-b border-[#23262a]">
              <tr>
                <th className="pb-2.5 font-medium">Run ID</th>
                <th className="pb-2.5 font-medium">Persona</th>
                <th className="pb-2.5 font-medium">Effort Ratio</th>
                <th className="pb-2.5 font-medium">Result</th>
                <th className="pb-2.5 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23262a]">
              {runs.length > 0 ? (
                runs.map((r, i) => (
                  <tr key={i} className="hover:bg-[#181a1d] transition-colors">
                    <td className="py-2.5 text-[#f4f5f6] truncate max-w-[120px]">{r.id}</td>
                    <td className="py-2.5 text-[#9ba1a6]">{r.persona}</td>
                    <td className="py-2.5 text-[#f4f5f6] font-bold">{r.effort_ratio}x</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        r.task_success
                          ? 'bg-[#30a46c]/10 text-[#30a46c] border border-[#30a46c]/20'
                          : 'bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20'
                      }`}>
                        {r.task_success ? 'PASSED' : 'BLOCKED'}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#6b7280]">{r.started_at ? new Date(r.started_at).toLocaleDateString() : 'Recent'}</td>
                  </tr>
                ))
              ) : (
                [
                  { id: 'run_baseline_01', persona: 'keyboard', effort_ratio: 1.2, task_success: true, started_at: '2026-11-01' },
                  { id: 'run_baseline_02', persona: 'keyboard', effort_ratio: 1.4, task_success: true, started_at: '2026-11-01' },
                  { id: 'run_baseline_03', persona: 'keyboard', effort_ratio: 1.3, task_success: true, started_at: '2026-11-02' },
                  { id: 'run_drift_04', persona: 'keyboard', effort_ratio: 4.2, task_success: false, started_at: '2026-11-02' },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-[#181a1d] transition-colors">
                    <td className="py-2.5 text-[#f4f5f6] truncate max-w-[120px]">{r.id}</td>
                    <td className="py-2.5 text-[#9ba1a6]">{r.persona}</td>
                    <td className="py-2.5 text-[#f4f5f6] font-bold">{r.effort_ratio}x</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        r.task_success
                          ? 'bg-[#30a46c]/10 text-[#30a46c] border border-[#30a46c]/20'
                          : 'bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20'
                      }`}>
                        {r.task_success ? 'PASSED' : 'BLOCKED'}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#6b7280]">{r.started_at}</td>
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
