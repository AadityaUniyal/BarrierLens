'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Check, 
  X, 
  ArrowDown, 
  ArrowUp, 
  Sparkles, 
  ShieldCheck, 
  Wrench, 
  Code2, 
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { BarrierFinding } from '@/lib/barrierlens/types';

interface ReviewQueueViewProps {
  findings: BarrierFinding[];
  onTriage: (findingId: string, label: 'accepted' | 'rejected') => void;
  onRemediateFinding?: (finding: BarrierFinding) => void;
  onLoadBenchmarkFindings?: () => void;
}

export function ReviewQueueView({ 
  findings, 
  onTriage, 
  onRemediateFinding,
  onLoadBenchmarkFindings 
}: ReviewQueueViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = findings[currentIndex] || findings[0];

  // J/K / A/R keyboard triage shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        setCurrentIndex((prev) => Math.min(findings.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'a' && current) {
        onTriage(current.id, 'accepted');
        setCurrentIndex((prev) => Math.min(findings.length - 1, prev + 1));
      } else if (e.key === 'r' && current) {
        onTriage(current.id, 'rejected');
        setCurrentIndex((prev) => Math.min(findings.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findings, currentIndex, current, onTriage]);

  if (!current) {
    return (
      <div className="apple-vibrancy-regular rounded-3xl p-12 text-center border-hairline max-w-xl mx-auto space-y-4">
        <CheckSquare className="w-10 h-10 text-[#30d158] mx-auto opacity-70" />
        <h3 className="text-lg font-semibold text-[#f5f5f7]">Review Queue Up to Date</h3>
        <p className="text-xs text-[#86868b] leading-relaxed">
          All findings from current audits have been triaged by human engineers. Run an audit on a website or journey to detect new barriers.
        </p>
        {onLoadBenchmarkFindings && (
          <button
            onClick={onLoadBenchmarkFindings}
            className="px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] transition-all shadow-md shadow-blue-500/20"
          >
            Load WCAG Benchmark Finding Set
          </button>
        )}
      </div>
    );
  }

  const evidenceHTML = current.evidence?.elementHTML || current.evidence?.outerHTML || current.evidence?.selector || null;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0a84ff]" />
            <span className="text-[12px] font-semibold tracking-wider uppercase text-[#86868b]">
              Issues · Active Learning Triage
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
            Accessibility Issues & Review
          </h1>
          <p className="text-[14px] text-[#86868b] mt-0.5">
            Rapid keyboard-driven human verification. High-uncertainty margin samples retrain local ML models.
          </p>
        </div>

        {/* Keyboard shortcut hints */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#86868b] bg-white/[0.04] px-3.5 py-1.5 rounded-xl border-hairline">
          <span className="apple-keycap px-2 py-0.5 text-xs text-white">J</span>
          <span className="apple-keycap px-2 py-0.5 text-xs text-white">K</span>
          <span>Navigate</span>
          <span className="apple-keycap px-2 py-0.5 text-xs text-[#30d158] border-emerald-500/30">A</span>
          <span>Accept</span>
          <span className="apple-keycap px-2 py-0.5 text-xs text-[#ff453a] border-rose-500/30">R</span>
          <span>Reject</span>
        </div>
      </div>

      {/* Main Split Grid: Issues Drawer (Left) + Detail & Action Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Findings Sidebar List (4 cols) */}
        <div className="lg:col-span-4 apple-vibrancy-regular rounded-3xl p-4 border-hairline flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
              Queue ({findings.length} Barriers)
            </span>
            <span className="text-xs font-mono text-[#0a84ff]">
              #{currentIndex + 1} Selected
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {findings.map((f, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <div
                  key={f.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-white/[0.08] border-white/25 shadow-md'
                      : 'bg-white/[0.02] border-hairline hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                      f.severity === 'critical'
                        ? 'bg-red-500/10 text-[#ff453a] border-hairline border-red-500/20'
                        : 'bg-amber-500/10 text-[#ff9f0a] border-hairline border-amber-500/20'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="text-[10px] font-mono text-[#86868b]">{f.kind}</span>
                  </div>
                  <h4 className="text-xs font-medium text-[#f5f5f7] line-clamp-1">{f.title}</h4>
                  <p className="text-[11px] text-[#86868b] line-clamp-2">{f.summary}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Issue Triage & Remedy Card (8 cols) */}
        <div className="lg:col-span-8 apple-vibrancy-regular rounded-3xl p-8 border-hairline shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#86868b]">
                Finding ID: <strong className="text-[#f5f5f7]">{current.id}</strong>
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-[#0a84ff] border-hairline border-blue-500/30 font-semibold">
                Trust Tier: {current.trustTier?.toUpperCase() || 'DETERMINISTIC'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[#ff9f0a] border-hairline border-amber-500/30 font-bold">
                  {current.severity}
                </span>
                {current.wcagRules?.map((rule, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#a1a1a6]">
                    {rule}
                  </span>
                ))}
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white pt-1">
                {current.title}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed pt-1">
                {current.summary}
              </p>
            </div>

            {/* Evidence HTML Preview */}
            {evidenceHTML && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase text-[#86868b] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[#0a84ff]" />
                  <span>Inspected Element Evidence</span>
                </span>
                <pre className="p-3.5 rounded-2xl bg-black/50 border-hairline text-xs font-mono text-[#a1a1a6] overflow-x-auto whitespace-pre-wrap">
                  {evidenceHTML}
                </pre>
              </div>
            )}

            {/* Conformal Prediction Metric */}
            {current.severityInterval && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border-hairline flex items-center justify-between text-xs text-[#86868b]">
                <span>Conformal Severity Interval (80% coverage):</span>
                <span className="font-mono text-[#f5f5f7]">
                  [{current.severityInterval[0].toFixed(1)}, {current.severityInterval[1].toFixed(1)}]
                </span>
              </div>
            )}
          </div>

          {/* Action Triage & Remediation Buttons */}
          <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  onTriage(current.id, 'rejected');
                  setCurrentIndex((prev) => Math.min(findings.length - 1, prev + 1));
                }}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-rose-950/20 hover:bg-rose-900/30 text-[#ff453a] border-hairline border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
                <span className="apple-keycap px-1 py-0.2 text-[9px] text-white">R</span>
              </button>

              <button
                onClick={() => {
                  onTriage(current.id, 'accepted');
                  setCurrentIndex((prev) => Math.min(findings.length - 1, prev + 1));
                }}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-emerald-950/20 hover:bg-emerald-900/30 text-[#30d158] border-hairline border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept</span>
                <span className="apple-keycap px-1 py-0.2 text-[9px] text-white">A</span>
              </button>
            </div>

            {onRemediateFinding && (
              <button
                onClick={() => onRemediateFinding(current)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Synthesize Causal Remedy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
