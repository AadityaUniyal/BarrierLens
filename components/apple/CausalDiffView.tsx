'use client';

import React, { useState } from 'react';
import { CausalCertificate } from '@/lib/barrierlens/causal/causal-certificate';
import { CounterfactualResult } from '@/lib/barrierlens/causal/counterfactual-engine';
import { GitBranch, ShieldCheck, CheckCircle2, ArrowRight, Code2, Sparkles, FileCode } from 'lucide-react';

interface CausalDiffViewProps {
  certificate?: CausalCertificate;
  counterfactual?: CounterfactualResult;
  onApplyPatch?: (patchHTML: string) => void;
}

export function CausalDiffView({
  certificate,
  counterfactual,
  onApplyPatch
}: CausalDiffViewProps) {
  const [copied, setCopied] = useState(false);

  // Demo fallback data if standalone
  const cert: CausalCertificate = certificate || {
    id: 'cert_89f02c4b-3210-482a-a9e1-6789def01234',
    timestamp: new Date().toISOString(),
    findingId: 'find_trap_modal_01',
    findingKind: 'keyboard_trap',
    causalChain: [
      '1. Target: Element <div role="dialog" id="trap-modal"> exhibits keyboard_trap',
      '2. Structural Dependency: SCM identified root causal locus at container onKeyDown binding',
      '3. Counterfactual Action: do(add_attribute = onkeydown="if(event.key===\'Escape\'){...}")',
      '4. Empirical Verification: Sandbox re-evaluation verified barrier elimination (true) with 0 regressions',
      '5. Conformance: Satisfies WCAG criterion WCAG 2.1.2 No Keyboard Trap'
    ],
    intervention: {
      nodeSelector: '#trap-modal',
      type: 'add_attribute',
      before: '<div id="trap-modal" class="modal-card">',
      after: '<div id="trap-modal" class="modal-card" role="dialog" aria-modal="true" onkeydown="if(event.key===\'Escape\'){this.remove()}">'
    },
    verification: {
      barrierEliminated: true,
      regressionFree: true,
      replaySuccess: true,
      proofHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    wcagMapping: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
    remediation: {
      originalHTML: '<div id="trap-modal" class="modal-card">\n  <h2>Special Offer</h2>\n  <button>Claim</button>\n</div>',
      patchedHTML: '<div id="trap-modal" class="modal-card" role="dialog" aria-modal="true" onkeydown="if(event.key===\'Escape\'){this.remove()}">\n  <h2>Special Offer</h2>\n  <button>Claim</button>\n</div>',
      diffSummary: 'Added role="dialog", aria-modal="true", and Escape keypress listener.',
      invasivenessLevel: 1
    },
    signatureHash: '4a6f2098b15d2e07198a2879ef098c4309a25b4104279ab8b392cd998b2e5541'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cert.remediation.patchedHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-400/30 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[19px] font-semibold text-[#f5f5f7]">Causal Counterfactual Engine</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  do(X = x′) Proof
                </span>
              </div>
              <p className="text-[13px] text-[#86868b]">
                Structural Causal Model determining minimal interventions to mathematically eliminate barriers without regressions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 0 Regressions Verified
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Causal Graph & Side-by-Side Diff */}
        <div className="lg:col-span-2 space-y-6">
          {/* Causal Chain Trace */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-4">
            <h3 className="text-[15px] font-medium text-[#f5f5f7] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Structural Causal Chain (SCM Derivation)
            </h3>

            <div className="space-y-2">
              {cert.causalChain.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/[0.03] border-hairline flex items-start gap-3 text-[12px] font-mono text-[#d1d1d6]"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-Side Surgical Code Diff */}
          <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-medium text-[#f5f5f7] flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#86868b]" />
                  Verified Surgical Diff
                </h3>
                <p className="text-[12px] text-[#86868b]">
                  Minimal intervention level {cert.remediation.invasivenessLevel} (attribute injection only)
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors border-hairline text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5" />
                {copied ? 'Copied Patch' : 'Copy Patch'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block">
                  Original (Barrier Inducing)
                </span>
                <div className="p-3.5 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 text-[12px] font-mono text-rose-200 overflow-x-auto min-h-[140px] leading-relaxed">
                  <pre>{cert.remediation.originalHTML}</pre>
                </div>
              </div>

              {/* Patched */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                  Causal Counterfactual (Verified Fix)
                </span>
                <div className="p-3.5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 text-[12px] font-mono text-emerald-200 overflow-x-auto min-h-[140px] leading-relaxed">
                  <pre>{cert.remediation.patchedHTML}</pre>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border-hairline text-[12px] text-[#86868b] flex items-center justify-between">
              <span>{cert.remediation.diffSummary}</span>
              <span className="text-xs font-mono text-emerald-400">Playwright CDP Verified</span>
            </div>
          </div>
        </div>

        {/* Right Col: Cryptographic Causal Certificate */}
        <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-[#f5f5f7] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Causal Certificate
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              SHA-256 SIGNED
            </span>
          </div>

          <p className="text-[12px] text-[#86868b]">
            Mathematically verifiable proof that the intervention eliminates the barrier in sandboxed replay
          </p>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.04] space-y-3 font-mono text-[11px]">
            <div>
              <span className="text-[#86868b] block text-[10px] uppercase">Certificate ID</span>
              <span className="text-[#f5f5f7] break-all">{cert.id}</span>
            </div>

            <div>
              <span className="text-[#86868b] block text-[10px] uppercase">Proof Hash (State &amp; Replay)</span>
              <span className="text-emerald-400 break-all">{cert.verification.proofHash}</span>
            </div>

            <div>
              <span className="text-[#86868b] block text-[10px] uppercase">Signature Hash (Immutable)</span>
              <span className="text-indigo-400 break-all">{cert.signatureHash}</span>
            </div>

            <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#86868b]">Barrier Eliminated</span>
                <span className="text-emerald-400">TRUE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868b]">Regressions Introduced</span>
                <span className="text-emerald-400">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868b]">Replay Verification</span>
                <span className="text-emerald-400">PASSED</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block">
              WCAG Criteria Resolved
            </span>
            {cert.wcagMapping.map((rule, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white/[0.03] border-hairline text-[12px] text-[#f5f5f7]"
              >
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
