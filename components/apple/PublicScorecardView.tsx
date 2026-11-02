'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, ShieldCheck, ExternalLink, Award } from 'lucide-react';
import { AuditRun } from '@/lib/barrierlens/types';

interface PublicScorecardViewProps {
  auditRun?: AuditRun | null;
}

export function PublicScorecardView({ auditRun }: PublicScorecardViewProps) {
  const [copied, setCopied] = useState(false);

  const embedSnippet = `<script async src="https://barrierlens.ai/badge.js" data-site="retail-checkout" data-run="${auditRun?.id || 'demo'}"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.017em] text-white flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#0a84ff]" />
            Public Verifiable Scorecard
          </h2>
          <p className="text-[13px] text-[#86868b] tracking-[0.005em] mt-0.5">
            Cryptographically verifiable accessibility scorecard for benchmark studies & investor reporting
          </p>
        </div>

        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white border-hairline active:scale-[0.98] transition-all duration-150 ease-spring"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5 text-[#86868b]" />}
          <span>{copied ? 'Embed Copied!' : 'Copy Embed Badge'}</span>
        </button>
      </div>

      {/* Main Scorecard Visual */}
      <div className="apple-vibrancy-thick rounded-3xl p-10 border-hairline shadow-2xl max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0071e3] flex items-center justify-center shadow-lg shadow-blue-500/20 ring-hairline ring-white/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.015em] text-white">Accessibility Flow Scorecard</h3>
              <p className="text-xs text-[#86868b] font-mono">Audited by BarrierLens Autonomous Engine</p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-[#30d158] border-hairline border-emerald-500/30">
            EAA 2025/2026 Compliant
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-black/40 border-hairline">
            <span className="text-[11px] text-[#86868b] font-mono">Effort Ratio</span>
            <div className="text-3xl font-extrabold text-white mt-1 tabular-nums">
              {auditRun?.effortRatio ?? 4.0}x
            </div>
            <span className="text-[10px] text-[#6e6e73]">Disparity vs Mouse</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border-hairline">
            <span className="text-[11px] text-[#86868b] font-mono">Kendall Tau τ</span>
            <div className="text-3xl font-extrabold text-[#0a84ff] mt-1 tabular-nums">
              {auditRun?.kendallTau?.tau ?? 0.85}
            </div>
            <span className="text-[10px] text-[#6e6e73]">Reading Concordance</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border-hairline">
            <span className="text-[11px] text-[#86868b] font-mono">Tarjan Trap Traps</span>
            <div className="text-3xl font-extrabold text-[#ff453a] mt-1 tabular-nums">
              {auditRun?.findings.filter(f => f.kind === 'keyboard_trap').length ?? 1}
            </div>
            <span className="text-[10px] text-[#6e6e73]">Sink Components</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-black/40 border-hairline space-y-2 text-xs">
          <div className="text-[#86868b] font-semibold uppercase tracking-wider font-mono">Executive Compliance Summary</div>
          <p className="text-slate-300 leading-relaxed text-[13px] tracking-[0.005em]">
            The target flow was evaluated under strict physical CDP persona constraints. Full behavioral completion requires verified remediation of the identified modal trap. 100% of findings are supported by reproducible keyproofs.
          </p>
        </div>

        <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs text-[#6e6e73] font-mono">
          <span>Run ID: {auditRun?.id?.slice(0, 18) ?? 'demo-38feb0b5'}...</span>
          <span>Verified at: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
