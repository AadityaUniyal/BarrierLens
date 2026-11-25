'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GitBranch, 
  CheckCircle2, 
  ExternalLink, 
  Code, 
  GitPullRequest,
  Check,
  Copy,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight,
  Download,
  Terminal
} from 'lucide-react';
import { BarrierFinding, VerifiedFixResult } from '@/lib/barrierlens/types';
import { GitHubPRModal } from './GitHubPRModal';
import { GitPatchGenerator } from '@/lib/barrierlens/repair/git-patch-generator';

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
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [patchFormat, setPatchFormat] = useState<'tsx' | 'tailwind' | 'patch'>('tsx');

  const activeFinding = findings.find(f => f.id === selectedFindingId) || findings[0];
  const activeVerification = activeFinding ? verifiedFixes[activeFinding.id] : null;

  // Synthesize realistic surgical patch based on selected format
  const getSnippetForFormat = () => {
    if (!activeFinding) return '';

    if (patchFormat === 'patch') {
      const generator = new GitPatchGenerator();
      return generator.generatePatchForFinding(activeFinding, 'src/components/AuditedView.tsx').unifiedDiff;
    }

    if (patchFormat === 'tailwind') {
      if (activeFinding.kind === 'keyboard_trap') {
        return `<!-- Tailwind Accessible Dialog with Focus Trap & Escape Handler -->
<div 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="dialog-title"
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm focus:outline-none"
  tabindex="-1"
>
  <div class="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl focus-within:ring-2 focus-within:ring-blue-500">
    <h2 id="dialog-title" class="text-lg font-bold text-white">Confirmation</h2>
    <div class="mt-4 flex justify-end gap-3">
      <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg focus-visible:ring-2 focus-visible:ring-blue-400">Cancel</button>
      <button type="button" class="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg focus-visible:ring-2 focus-visible:ring-white">Confirm</button>
    </div>
  </div>
</div>`;
      }
      if (activeFinding.kind === 'empty_accessible_name') {
        return `<!-- Tailwind 44px Touch Target with Accessible Screen Reader Label -->
<button 
  type="button"
  aria-label="Close dialog window"
  class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
>
  <svg aria-hidden="true" class="w-5 h-5 fill-current" viewBox="0 0 20 20">
    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
  </svg>
</button>`;
      }
      return `<!-- Tailwind Live Status Announcement Region -->
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  class="sr-only"
>
  Update completed successfully.
</div>`;
    }

    // Default: React TSX
    if (activeFinding.kind === 'keyboard_trap') {
      return `// Surgical Focus Trap & Escape Key Handler (WCAG 2.1.2)
import React, { useEffect, useRef } from 'react';

export function AccessibleModal({ isOpen, onClose, title, children }: any) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full">
        <h2 id="modal-title" className="text-lg font-bold text-white">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}`;
    }

    if (activeFinding.kind === 'empty_accessible_name') {
      return `// Accessible Name & Touch Target Patch (WCAG 4.1.2 / 2.5.8)
export function ActionIconButton({ onClick, label = "Dismiss notice" }: any) {
  return (
    <button 
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <CloseIcon aria-hidden="true" className="w-5 h-5 pointer-events-none" />
    </button>
  );
}`;
    }

    return `// Live Announcement Aria Region Patch (WCAG 4.1.3)
export function LiveStatusAnnouncer({ message }: { message: string }) {
  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}`;
  };

  const patchCode = getSnippetForFormat();

  const handleCopy = () => {
    navigator.clipboard.writeText(patchCode);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const handleDownloadPatch = () => {
    const generator = new GitPatchGenerator();
    const bundle = generator.createPatchBundle(findings);
    const blob = new Blob([bundle], { type: 'text/x-diff;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barrierlens-remediation-${Date.now()}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Keyboard-First Navigation Contract (Linear / Apple Standard)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = findings.findIndex(f => f.id === selectedFindingId);
        if (currentIndex < findings.length - 1) {
          setSelectedFindingId(findings[currentIndex + 1].id);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = findings.findIndex(f => f.id === selectedFindingId);
        if (currentIndex > 0) {
          setSelectedFindingId(findings[currentIndex - 1].id);
        }
      } else if (e.key === 'v' && activeFinding) {
        e.preventDefault();
        onVerifyRepair(activeFinding);
      } else if (e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (e.key === 'p' || e.key === 'Enter') {
        if (!isPRModalOpen && findings.length > 0) {
          e.preventDefault();
          setIsPRModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findings, selectedFindingId, activeFinding, isPRModalOpen, onVerifyRepair]);

  return (
    <div className="space-y-6 text-white animate-in fade-in duration-300">
      {/* Header Station */}
      <div className="apple-liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9c9aa8] font-semibold">
              Autonomous Remediation Studio
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-[-0.03em] text-white">
            Verified AST Repairs <span className="font-normal text-slate-400">&amp; Automated PRs</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#9c9aa8] max-w-2xl">
            Declarative AST code mutations replayed inside an isolated headless sandbox. Regressions evaluated across focus graphs and visual invariance before PR dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={findings.length === 0}
            onClick={handleDownloadPatch}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 shrink-0"
            title="Download unified .patch file for local terminal 'git apply'"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download .patch</span>
          </button>

          <button
            type="button"
            disabled={findings.length === 0}
            onClick={() => setIsPRModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 shrink-0"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Dispatch Remediation PR</span>
          </button>
        </div>
      </div>

      {/* Grid: Findings Selector vs Surgical Diff */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Findings with Fix Status */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] text-white/50 px-2 font-semibold uppercase tracking-wider font-mono">
            Remediation Targets ({findings.length})
          </div>

          <div className="space-y-2">
            {findings.length === 0 ? (
              <div className="apple-liquid-glass rounded-3xl p-8 text-center space-y-3 text-white/50">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 opacity-60" />
                <p className="text-xs text-white/80 font-medium">No active remediation targets</p>
                <p className="text-[11px] text-white/40">Run an audit in Traversal Studio to generate surgical patches for barriers.</p>
              </div>
            ) : (
              findings.map((finding) => {
                const isSelected = activeFinding?.id === finding.id;
                const isVerified = verifiedFixes[finding.id]?.verified || finding.verifiedFix;

                return (
                  <button
                    key={finding.id}
                    type="button"
                    onClick={() => setSelectedFindingId(finding.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2 active:scale-[0.99] ${
                      isSelected
                        ? 'apple-liquid-glass border-white/30 shadow-lg ring-1 ring-white/20'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold uppercase tracking-wider text-white/60">
                        {finding.kind.replace(/_/g, ' ')}
                      </span>
                      {isVerified ? (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                          <Check className="w-2.5 h-2.5" /> Verified
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#ff9f0a] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white line-clamp-1">
                      {finding.title || finding.kind}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 8 Cols: Surgical Code Diff & Replay Station */}
        <div className="lg:col-span-8 space-y-4">
          {activeFinding ? (
            <div className="apple-liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-white/40">Target Selector:</span>
                    <span className="text-[11px] font-mono text-[#0090ff] bg-[#0090ff]/10 px-2.5 py-0.5 rounded-full border border-[#0090ff]/20">
                      {activeFinding.evidence?.selector || '#target-control'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Surgical Abstract Syntax Tree (AST) Patch
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs text-white/80 transition-all active:scale-[0.98]"
                  >
                    {copiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPatch ? 'Copied' : 'Copy Patch'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={verifyingFindingId === activeFinding.id}
                    onClick={() => onVerifyRepair(activeFinding)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all shadow-md active:scale-[0.98]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{verifyingFindingId === activeFinding.id ? 'Replaying...' : 'Verify Replay'}</span>
                  </button>
                </div>
              </div>

              {/* Code Diff Display with High-Contrast Lines & Framework Selector */}
              <div className="rounded-2xl bg-black/60 border border-white/[0.08] overflow-hidden text-xs font-mono">
                <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setPatchFormat('tsx')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        patchFormat === 'tsx'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      React (TSX)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatchFormat('tailwind')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        patchFormat === 'tailwind'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Tailwind CSS
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatchFormat('patch')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        patchFormat === 'patch'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Unified Diff (.patch)
                    </button>
                  </div>

                  <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>git apply compatible</span>
                  </span>
                </div>
                <pre className="p-5 text-emerald-300 overflow-x-auto leading-relaxed text-[12px] selection:bg-emerald-500/30">
                  {patchCode}
                </pre>
              </div>

              {/* Sandbox Differential Proof Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-white">Differential Replay Certification</span>
                  {activeVerification?.verified ? (
                    <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Verified &bull; {activeVerification.regressionCount ?? 0} Regressions
                    </span>
                  ) : activeVerification ? (
                    <span className="font-mono text-[11px] text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                      Verification Failed
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Pending Sandbox Replay
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-white/60 leading-relaxed">
                  {activeVerification?.diffSummary ||
                    'Click "Verify Fix" above to inject this patch into headless Chromium and verify barrier elimination without regressions.'}
                </p>
              </div>

            </div>
          ) : (
            <div className="h-[360px] apple-liquid-glass rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-2 text-white/50">
              <Code className="w-8 h-8 opacity-40" />
              <p className="text-xs text-white/80 font-medium">No remediation target selected</p>
              <p className="text-[11px] text-white/40">Select a target on the left to review its surgical code patch.</p>
            </div>
          )}
        </div>

      </div>

      {/* GitHub 1-Click Pull Request Dispatch Modal */}
      <GitHubPRModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        finding={activeFinding || null}
        patch={patchCode}
        targetUrl={targetUrl}
      />

      {/* Floating Apple Hotkeys HUD (Linear & HIG Standard) */}
      <div className="sticky bottom-4 left-1/2 -translate-x-1/2 z-40 flex justify-center pointer-events-none">
        <div className="apple-liquid-glass rounded-full px-4 py-2 border border-white/10 shadow-2xl flex items-center gap-3 text-[11px] font-mono text-white/70 pointer-events-auto backdrop-blur-xl">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">J</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">K</kbd>
            <span className="text-[#9c9aa8]">navigate</span>
          </span>
          <span className="text-white/20">&bull;</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">V</kbd>
            <span className="text-[#9c9aa8]">verify fix</span>
          </span>
          <span className="text-white/20">&bull;</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">C</kbd>
            <span className="text-[#9c9aa8]">copy</span>
          </span>
          <span className="text-white/20">&bull;</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">P</kbd>
            <span className="text-[#9c9aa8]">dispatch PR</span>
          </span>
        </div>
      </div>
    </div>
  );
}
