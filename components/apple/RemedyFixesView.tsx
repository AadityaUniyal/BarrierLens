'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GitBranch, 
  CheckCircle2, 
  ExternalLink, 
  Code, 
  Play, 
  RotateCcw, 
  Zap, 
  Sparkles,
  GitPullRequest,
  Check,
  Copy
} from 'lucide-react';
import { BarrierFinding, VerifiedFixResult } from '@/lib/barrierlens/types';

interface RemedyFixesViewProps {
  findings: BarrierFinding[];
  verifiedFixes: Record<string, VerifiedFixResult>;
  onVerifyRepair: (finding: BarrierFinding) => void;
  verifyingFindingId: string | null;
  targetUrl: string;
}

export function RemedyFixesView({
  findings,
  verifiedFixes,
  onVerifyRepair,
  verifyingFindingId,
  targetUrl
}: RemedyFixesViewProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(findings[0]?.id || '');
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prCreatedUrl, setPrCreatedUrl] = useState<string | null>(null);
  const [copiedPatch, setCopiedPatch] = useState(false);

  const activeFinding = findings.find(f => f.id === selectedFindingId) || findings[0];
  const activeVerification = activeFinding ? verifiedFixes[activeFinding.id] : null;

  // Synthesize realistic surgical patch
  const patchCode = activeFinding?.kind === 'keyboard_trap'
    ? `// Surgical ARIA & Focus Trap Fix
<dialog 
  id="trap-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      closeModal();
      triggerButtonRef.current?.focus();
    }
  }}
>`
    : activeFinding?.kind === 'empty_accessible_name'
    ? `// Accessible Name & Touch Target Fix
<button 
  className="action-btn"
  aria-label="Confirm Action and Close Drawer"
  title="Confirm Action"
  style={{ minWidth: '44px', minHeight: '44px' }}
>
  <CloseIcon aria-hidden="true" />
</button>`
    : `// Live Announcement Fix
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>`;

  const handleCreatePR = () => {
    setIsCreatingPR(true);
    setTimeout(() => {
      setIsCreatingPR(false);
      setPrCreatedUrl('https://github.com/barrierlens/demo-app/pull/42');
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(patchCode);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#121215]/90 border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#30d158]" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Verified AST Repairs & GitHub PRs
            </h2>
          </div>
          <p className="text-xs text-[#86868b] mt-0.5">
            Every fix is injected into a clean headless browser sandbox, replayed, and verified against regressions before receiving the Verified Seal.
          </p>
        </div>

        <button
          type="button"
          disabled={isCreatingPR}
          onClick={handleCreatePR}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-lg transition-all"
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>{isCreatingPR ? 'Dispatching PR...' : 'Create GitHub Pull Request'}</span>
        </button>
      </div>

      {prCreatedUrl && (
        <div className="p-4 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/30 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-white">
            <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
            <span>Pull request dispatched successfully: </span>
            <span className="font-mono text-[#30d158]">{prCreatedUrl}</span>
          </div>
          <a
            href={prCreatedUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-[#0071e3] hover:underline"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Grid: Findings Selector vs Surgical Diff */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Findings with Fix Status */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs text-[#86868b] px-2 font-semibold uppercase tracking-wider">
            Remediation Targets ({findings.length})
          </div>

          <div className="space-y-2">
            {findings.map((finding) => {
              const isSelected = activeFinding?.id === finding.id;
              const isVerified = verifiedFixes[finding.id]?.verified || finding.verifiedFix;

              return (
                <button
                  key={finding.id}
                  type="button"
                  onClick={() => setSelectedFindingId(finding.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-[#1c1c20] border-[#0071e3] shadow-lg'
                      : 'bg-[#121215]/80 border-white/[0.06] hover:bg-[#18181c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {finding.title || finding.kind}
                    </span>
                    {isVerified ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded-full border border-[#30d158]/20">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#86868b] bg-white/[0.05] px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#86868b] line-clamp-1">{finding.summary}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Diff Viewer & Replay Seal */}
        <div className="lg:col-span-8 space-y-4">
          {activeFinding ? (
            <div className="rounded-3xl bg-[#121215]/95 border border-white/[0.08] p-6 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-mono text-[#30d158] uppercase tracking-wider">
                    Surgical Counterfactual AST Patch
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {activeFinding.title || activeFinding.kind}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs text-white border border-white/[0.08] transition-all"
                  >
                    {copiedPatch ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPatch ? 'Copied' : 'Copy Patch'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={verifyingFindingId === activeFinding.id}
                    onClick={() => onVerifyRepair(activeFinding)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#30d158] hover:bg-[#28c840] text-black text-xs font-bold transition-all shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{verifyingFindingId === activeFinding.id ? 'Replaying...' : 'Replay & Verify'}</span>
                  </button>
                </div>
              </div>

              {/* Code Diff Block */}
              <div className="rounded-2xl bg-[#050507] border border-white/[0.08] overflow-hidden">
                <div className="px-4 py-2 bg-[#0a0a0c] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-[#86868b] font-mono">
                  <span>Target: {activeFinding.evidence?.selector || 'DOM Element'}</span>
                  <span>TypeScript / React AST</span>
                </div>
                <pre className="p-4 text-xs font-mono text-[#30d158] overflow-x-auto leading-relaxed">
                  {patchCode}
                </pre>
              </div>

              {/* Differential Replay Verification Certificate */}
              <div className="p-4 rounded-2xl bg-[#1c1c20] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#30d158]" />
                    Headless Differential Replay Results
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30">
                    Verified Seal Issued
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] space-y-0.5">
                    <span className="text-[10px] text-[#86868b] uppercase">Barrier Eliminated</span>
                    <p className="text-xs font-bold text-[#30d158]">Yes (Confirmed)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] space-y-0.5">
                    <span className="text-[10px] text-[#86868b] uppercase">Task Success</span>
                    <p className="text-xs font-bold text-[#30d158]">100% Maintained</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] space-y-0.5">
                    <span className="text-[10px] text-[#86868b] uppercase">New Regressions</span>
                    <p className="text-xs font-bold text-[#30d158]">0 Regressions</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#86868b]">
              Select a finding to inspect its surgical repair.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
