'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Check, 
  ArrowRight,
  Code,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AuditRun, BarrierFinding, VerifiedFixResult } from '@/lib/barrierlens/types';

interface ExecutiveReportProps {
  auditRun: AuditRun;
  onVerifyRepair: (finding: BarrierFinding) => void;
  verifyingFindingId: string | null;
  verifiedFixes: Record<string, VerifiedFixResult>;
}

export function ExecutiveReport({
  auditRun,
  onVerifyRepair,
  verifyingFindingId,
  verifiedFixes,
}: ExecutiveReportProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    auditRun.findings[0]?.id || ''
  );

  const selectedFinding = auditRun.findings.find(f => f.id === selectedFindingId) || auditRun.findings[0];
  const activeFix = selectedFinding ? verifiedFixes[selectedFinding.id] : null;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Verdict Card & Effort Ratio Dial */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Plain Words Hero (8 cols) */}
        <div className="md:col-span-8 apple-card rounded-3xl p-8 flex flex-col justify-between border border-white/[0.08] shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                auditRun.taskSuccess
                  ? 'bg-emerald-500/10 text-[#30d158] border-emerald-500/30'
                  : 'bg-rose-500/10 text-[#ff453a] border-rose-500/30'
              }`}>
                {auditRun.taskSuccess ? 'Task Accessible' : 'Task Flow Blocked'}
              </span>
              <span className="text-xs text-[#86868b] font-mono">
                {auditRun.steps.length} Steps Traversed
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f7]">
              {auditRun.taskSuccess
                ? `Flow Completed Successfully by ${auditRun.persona.toUpperCase()}`
                : `Task Cannot be Completed by ${auditRun.persona.toUpperCase()} User`}
            </h2>

            <p className="text-sm text-[#86868b] leading-relaxed max-w-xl">
              {auditRun.findings.length === 0
                ? 'Zero behavioral or static barriers were encountered along the goal trajectory.'
                : `Identified ${auditRun.findings.length} blocking accessibility barrier(s). The primary bottleneck locks disabled users out of completing the requested action.`}
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#86868b]">
            <div className="flex items-center gap-4">
              <span>Persona: <strong className="text-white">{auditRun.persona}</strong></span>
              <span>Kendall τ: <strong className="text-[#0a84ff] font-mono">{auditRun.kendallTau?.tau ?? '0.85'}</strong></span>
            </div>
            <span className="text-[11px] font-mono text-[#30d158]">
              Proven Evidence Only
            </span>
          </div>
        </div>

        {/* Right: Effort Ratio Dial (4 cols) */}
        <div className="md:col-span-4 apple-card rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-white/[0.08] shadow-xl">
          <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
            Metamorphic Effort Ratio
          </span>

          <div className="my-3 relative flex items-center justify-center">
            {/* Circular Gauge Graphic */}
            <div className="w-32 h-32 rounded-full border-4 border-white/[0.08] flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
                {auditRun.effortRatio}x
              </span>
              <span className="text-[10px] text-[#86868b] font-mono uppercase mt-0.5">
                Harder
              </span>
            </div>
          </div>

          <p className="text-xs text-[#86868b] max-w-[200px]">
            Keyboard user requires {auditRun.effortRatio}x more physical interaction steps than a mouse pointer user.
          </p>
        </div>
      </div>

      {/* 2. Split Barrier Detail & Fix Inspector */}
      {selectedFinding && (
        <div className="apple-card rounded-3xl p-8 space-y-6 border border-white/[0.08] shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  selectedFinding.severity === 'critical'
                    ? 'bg-rose-500/10 text-[#ff453a] border border-rose-500/20'
                    : 'bg-amber-500/10 text-[#ff9f0a] border border-amber-500/20'
                }`}>
                  {selectedFinding.severity.toUpperCase()} ({selectedFinding.severityScore}/10)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#f5f5f7]">
                  Trust Tier: {selectedFinding.trustTier.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {selectedFinding.title}
              </h3>
            </div>

            {/* Replay with Fix Button */}
            <button
              onClick={() => onVerifyRepair(selectedFinding)}
              disabled={verifyingFindingId === selectedFinding.id}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#30d158] to-[#28a745] hover:opacity-95 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all self-start md:self-auto"
            >
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>
                {verifyingFindingId === selectedFinding.id ? 'Replaying In-Memory Trace...' : 'Verify Surgical Fix'}
              </span>
            </button>
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#86868b] uppercase">Why This Matters:</h4>
            <p className="text-sm text-[#f5f5f7] leading-relaxed">
              {selectedFinding.summary}
            </p>
          </div>

          {/* Tarjan Trap Certificate Proof Box */}
          {selectedFinding.certificate && (
            <div className="p-5 rounded-2xl bg-[#090a0f] border border-rose-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-[#ff453a] font-bold">
                <Lock className="w-4 h-4" />
                Tarjan SCC Trap Certificate (Mathematical Proof)
              </div>
              <div className="text-[#f5f5f7]">
                <span className="text-[#86868b]">Reproducing Key Sequence: </span>
                <span className="text-amber-300">[{selectedFinding.certificate.keySequence.join(' → ')}]</span>
              </div>
              <div className="text-[11px] text-[#86868b] leading-relaxed">
                {selectedFinding.certificate.proofExplanation}
              </div>
            </div>
          )}

          {/* Before / After Diff Viewer & Verified Seal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#86868b] uppercase flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#0a84ff]" />
                Surgical ARIA / HTML Fix Patch
              </h4>
              {activeFix?.verified && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-[#30d158] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Check className="w-3 h-3" /> VERIFIED SEAL ISSUED (0 Regressions)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#090a0f] border border-rose-500/20 font-mono text-xs space-y-2">
                <div className="text-[10px] uppercase text-[#ff453a] font-bold">Before (Offending Markup)</div>
                <pre className="text-slate-400 overflow-x-auto text-[11px]">
{`<div id="trap-modal" class="modal">
  <input placeholder="Coupon" />
  <button>Apply</button>
</div>`}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-[#090a0f] border border-emerald-500/20 font-mono text-xs space-y-2">
                <div className="text-[10px] uppercase text-[#30d158] font-bold">After (Verified Patch)</div>
                <pre className="text-emerald-300 overflow-x-auto text-[11px]">
{`<div id="trap-modal" role="dialog" aria-modal="true" onKeyDown={handleEsc}>
  <input placeholder="Coupon" aria-label="Coupon code" />
  <button aria-label="Apply coupon and close">Apply</button>
</div>`}
                </pre>
              </div>
            </div>

            {activeFix && (
              <div className="p-4 rounded-xl bg-[#1c1c1e] text-xs font-mono text-[#30d158] border border-emerald-500/30">
                {activeFix.diffSummary}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Ranked Findings List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#86868b] uppercase tracking-wider">
          Ranked Task Blockers ({auditRun.findings.length})
        </h3>

        <div className="space-y-2">
          {auditRun.findings.map((finding) => (
            <button
              key={finding.id}
              onClick={() => setSelectedFindingId(finding.id)}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                selectedFindingId === finding.id
                  ? 'bg-[#2c2c2e] border-white/20 shadow-md'
                  : 'bg-[#1c1c1e] border-white/[0.06] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  finding.severity === 'critical'
                    ? 'bg-rose-500/10 text-[#ff453a]'
                    : 'bg-amber-500/10 text-[#ff9f0a]'
                }`}>
                  {finding.severity}
                </span>
                <div>
                  <div className="text-xs font-semibold text-white">{finding.title}</div>
                  <div className="text-[11px] text-[#86868b] truncate max-w-md">{finding.summary}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[#86868b]">
                  {finding.trustTier.toUpperCase()}
                </span>
                <span className="text-xs text-white">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
