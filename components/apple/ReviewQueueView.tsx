'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, X, ArrowDown, ArrowUp, Sparkles, ShieldCheck } from 'lucide-react';
import { BarrierFinding } from '@/lib/barrierlens/types';

interface ReviewQueueViewProps {
  findings: BarrierFinding[];
  onTriage: (findingId: string, label: 'accepted' | 'rejected') => void;
}

export function ReviewQueueView({ findings, onTriage }: ReviewQueueViewProps) {
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
      <div className="apple-card rounded-3xl p-12 text-center text-slate-400 space-y-3">
        <CheckSquare className="w-8 h-8 text-[#30d158] mx-auto" />
        <h3 className="text-base font-semibold text-white">Review Queue Clear</h3>
        <p className="text-xs">All model-flagged findings have been triaged by human auditors.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#0a84ff]" />
            Review Queue & Active Learning (M6)
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Rapid keyboard-driven human verification. High-uncertainty margin samples retrain the local ML models.
          </p>
        </div>

        {/* Keyboard shortcut hints */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#86868b]">
          <span className="px-2 py-1 rounded bg-[#1c1c1e] border border-white/10 text-white">J/K</span>
          <span>Navigate</span>
          <span className="px-2 py-1 rounded bg-[#1c1c1e] border border-white/10 text-[#30d158]">A</span>
          <span>Accept</span>
          <span className="px-2 py-1 rounded bg-[#1c1c1e] border border-white/10 text-[#ff453a]">R</span>
          <span>Reject</span>
        </div>
      </div>

      {/* Triage Card */}
      <div className="apple-card rounded-3xl p-8 border border-white/[0.08] shadow-2xl max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[#86868b]">
            Finding {currentIndex + 1} of {findings.length}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-[#0a84ff] border border-blue-500/20">
            Model Margin Uncertainty: 0.18 (High Priority)
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-[#ff9f0a] border border-amber-500/20 font-bold">
              {current.severity}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white">
              Trust Tier: {current.trustTier.toUpperCase()}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white">
            {current.title}
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed pt-1">
            {current.summary}
          </p>
        </div>

        {/* Action Triage Buttons */}
        <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between gap-4">
          <button
            onClick={() => {
              onTriage(current.id, 'rejected');
              setCurrentIndex((prev) => Math.min(findings.length - 1, prev + 1));
            }}
            className="flex-1 py-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/40 text-[#ff453a] border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <X className="w-4 h-4" />
            <span>Reject False Positive [R]</span>
          </button>

          <button
            onClick={() => {
              onTriage(current.id, 'accepted');
              setCurrentIndex((prev) => Math.min(findings.length - 1, prev + 1));
            }}
            className="flex-1 py-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 text-[#30d158] border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            <span>Accept Ground Truth [A]</span>
          </button>
        </div>
      </div>
    </div>
  );
}
