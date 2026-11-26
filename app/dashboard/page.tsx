'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { ApertureSkeleton } from '@/components/ui/ApertureSkeleton';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickUrl, setQuickUrl] = useState('/benchmark');
  const [quickGoal, setQuickGoal] = useState('Verify keyboard focus escape and accessible names');

  useEffect(() => {
    Promise.all([
      fetch('/api/runs/list').then((r) => r.json()).catch(() => ({ runs: [] })),
      fetch('/api/analytics/trends').then((r) => r.json()).catch(() => null),
    ]).then(([runsData, trendsData]) => {
      setRuns(Array.isArray(runsData?.runs) ? runsData.runs : []);
      setTrends(trendsData);
      setLoading(false);
    });
  }, []);

  const launchQuickAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      url: quickUrl || '/benchmark',
      goal: quickGoal || 'Verify accessibility journey',
      persona: 'keyboard',
      auto: '1',
    });
    router.push(`/dashboard/studio?${params.toString()}`);
  };

  const totalFindings = runs.reduce((acc, r) => acc + (Number(r.findings_count) || 0), 0);
  const passCount = runs.filter((r) => r.task_success).length;
  const passRate = runs.length > 0 ? Math.round((passCount / runs.length) * 100) : 100;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
            Executive Telemetry
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Accessibility Verification Overview
          </h1>
        </div>
        <Link
          href="/dashboard/studio"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-semibold text-white transition-colors shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Open Audit Studio</span>
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-5">
          <p className="text-[11px] font-mono text-slate-400">Verified Runs</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">{runs.length}</p>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <p className="text-[11px] font-mono text-slate-400">Journey Pass Rate</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{passRate}%</p>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <p className="text-[11px] font-mono text-slate-400">Barriers Proven</p>
          <p className="text-2xl font-bold text-rose-400 font-mono mt-1">{totalFindings}</p>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <p className="text-[11px] font-mono text-slate-400">Avg Effort Ratio</p>
          <p className="text-2xl font-bold text-[#0090ff] font-mono mt-1">
            {trends?.summary?.avgEffortRatio ? `${Number(trends.summary.avgEffortRatio).toFixed(2)}x` : '1.20x'}
          </p>
        </SpotlightCard>
      </div>

      {/* Quick Audit Bar */}
      <SpotlightCard className="p-6">
        <form onSubmit={launchQuickAudit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label htmlFor="quick-url" className="block text-[11px] font-mono text-slate-400 mb-1">
              Target URL / Fixture
            </label>
            <input
              id="quick-url"
              type="text"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
            />
          </div>
          <div className="md:col-span-6">
            <label htmlFor="quick-goal" className="block text-[11px] font-mono text-slate-400 mb-1">
              Critical User Journey Goal
            </label>
            <input
              id="quick-goal"
              type="text"
              value={quickGoal}
              onChange={(e) => setQuickGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white focus:border-[#0090ff] focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-semibold transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Run</span>
            </button>
          </div>
        </form>
      </SpotlightCard>

      {/* Recent Runs */}
      <SpotlightCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0090ff]" />
            <span>Recent Verification Runs</span>
          </h2>
          <Link href="/dashboard/issues" className="text-xs text-[#0090ff] hover:underline inline-flex items-center gap-1">
            <span>Inspect All Issues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <ApertureSkeleton lines={4} />
        ) : runs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No persisted runs yet. Launch an audit in Audit Studio to populate telemetry.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {runs.slice(0, 8).map((r) => (
              <div
                key={r.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {r.task_success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-white truncate">{r.target_url}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 uppercase">
                      {r.persona}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{r.goal_text}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                  <span className="text-slate-400">{r.findings_count ?? 0} findings</span>
                  <Link
                    href={`/dashboard/issues?runId=${r.id}`}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 transition-colors"
                  >
                    Proofs
                  </Link>
                  <Link
                    href={`/scorecard/${r.id}`}
                    className="inline-flex items-center gap-1 text-[#0090ff] hover:underline"
                  >
                    <span>Scorecard</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
