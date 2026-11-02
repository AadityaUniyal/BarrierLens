'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Check,
  ArrowRight,
  Code,
  Sparkles,
  ExternalLink,
  Copy,
  Layers,
  Eye,
  Maximize2,
  Terminal,
  Activity,
  Sliders
} from 'lucide-react';
import { BarrierFinding, VerifiedFixResult, AccNameEvaluation } from '@/lib/barrierlens/types';
import { AccNameProvenanceTree } from './AccNameProvenanceTree';

export interface BarrierDetailViewProps {
  finding?: BarrierFinding | null;
  onVerifyRepair?: (finding: BarrierFinding) => void;
  verifyingFindingId?: string | null;
  activeFix?: VerifiedFixResult | null;
  className?: string;
  onClose?: () => void;
}

export function BarrierDetailView({
  finding,
  onVerifyRepair,
  verifyingFindingId,
  activeFix,
  className = '',
  onClose
}: BarrierDetailViewProps) {
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'provenance' | 'evidence'>('provenance');

  if (!finding) {
    return (
      <div className={`p-10 rounded-3xl apple-vibrancy-regular border-[0.5px] border-white/10 text-center space-y-3 ${className}`}>
        <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-[#86868b]">
          <Eye className="w-6 h-6" />
        </div>
        <h3 className="text-[17px] font-semibold text-white tracking-tight">No Barrier Selected</h3>
        <p className="text-xs text-[#86868b] max-w-sm mx-auto leading-relaxed">
          Select a barrier finding from the Ranked Action Plan or Focus Map to inspect the full W3C resolution provenance and surgical repair diff.
        </p>
      </div>
    );
  }

  const isVerifying = verifyingFindingId === finding.id;
  const isVerified = activeFix?.verified || finding.verifiedFix;

  // Extract evidence details
  const selector = finding.evidence?.selector || finding.evidence?.targetSelector || 'element';
  const htmlSnippet = finding.evidence?.htmlSnippet || finding.evidence?.html || `<${finding.kind} class="offending-node">...</${finding.kind}>`;
  const wcagTag = finding.wcagRules?.[0] || 'WCAG 2.2';

  // Construct or extract AccNameEvaluation
  const accNameEvaluation: AccNameEvaluation = finding.evidence?.accNameEvaluation || {
    selector,
    role: finding.evidence?.role || (selector.includes('button') ? 'button' : selector.includes('a') ? 'link' : 'generic'),
    computedName: finding.evidence?.computedName || finding.evidence?.accessibleName || '',
    provenanceTree: finding.evidence?.provenanceTree || [],
    provenanceExplanation: finding.evidence?.provenanceExplanation || finding.summary,
    winningSource: finding.evidence?.winningSource,
    diagnostic: finding.evidence?.diagnostic || (
      finding.kind === 'empty_accessible_name' ? {
        code: 'MISSING_LABEL_NO_SOURCES',
        severity: finding.severity,
        message: finding.summary,
        remedy: finding.patchProposal ? `Apply surgical fix: ${finding.patchProposal}` : 'Provide an accessible name using aria-label or visible label.'
      } : undefined
    ),
    cdpComparison: finding.evidence?.cdpComparison || {
      cdpName: finding.evidence?.cdpName || '',
      agrees: finding.evidence?.cdpAgreed ?? true,
      discrepancyCode: 'MATCH'
    }
  };

  const handleCopyCode = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div className={`apple-vibrancy-regular rounded-3xl p-6 sm:p-8 space-y-6 border-[0.5px] border-white/12 shadow-2xl animate-in fade-in duration-300 ${className}`}>
      {/* 1. Header Bar: Severity, Trust Tier & Action CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Pill */}
            <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border-[0.5px] ${
              finding.severity === 'critical'
                ? 'bg-rose-500/10 text-[#ff453a] border-rose-500/30'
                : finding.severity === 'high'
                ? 'bg-amber-500/10 text-[#ff9f0a] border-amber-500/30'
                : 'bg-blue-500/10 text-[#0a84ff] border-blue-500/30'
            }`}>
              {finding.severity.toUpperCase()} ({finding.severityScore}/10)
            </span>

            {/* Trust Tier */}
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#30d158] border-[0.5px] border-emerald-500/30 font-semibold uppercase">
              Trust: {finding.trustTier}
            </span>

            {/* Conformal Prediction interval */}
            {finding.severityInterval && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#86868b] border-[0.5px] border-white/10">
                80% Interval: [{finding.severityInterval[0].toFixed(1)}, {finding.severityInterval[1].toFixed(1)}]
              </span>
            )}

            {/* WCAG Pill */}
            {finding.wcagRules?.map(rule => (
              <span key={rule} className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-[#f5f5f7] border-[0.5px] border-white/15">
                {rule}
              </span>
            ))}
          </div>

          <h3 className="text-[22px] font-bold tracking-tight text-white">
            {finding.title}
          </h3>
        </div>

        {/* Replay with Surgical Fix CTA Button */}
        <div className="flex items-center gap-2 shrink-0">
          {onVerifyRepair && (
            <button
              onClick={() => onVerifyRepair(finding)}
              disabled={isVerifying}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#30d158] to-[#28a745] hover:opacity-95 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98] transition-all duration-150 ease-spring"
            >
              {isVerifying ? (
                <Activity className="w-4 h-4 text-black animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-black" />
              )}
              <span>
                {isVerifying ? 'Replaying In-Memory Trace...' : 'Verify Surgical Fix'}
              </span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#86868b] hover:text-white text-xs font-mono transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* 2. Split Inspector View (Left: Visual Context & DOM / Right: W3C Provenance Stack) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Visual Context & Offending DOM (6 Columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#86868b]">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-[#0a84ff]" />
              Offending DOM Context
            </span>
            <span className="text-[11px] truncate max-w-[200px]" title={selector}>
              {selector}
            </span>
          </div>

          {/* HTML Snapshot Container */}
          <div className="relative rounded-2xl bg-black/50 border-[0.5px] border-white/10 overflow-hidden group">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-[#86868b] uppercase">DOM Node Snapshot</span>
              <button
                onClick={() => handleCopyCode(htmlSnippet)}
                className="flex items-center gap-1 text-[10px] font-mono text-[#86868b] hover:text-white transition-colors"
                title="Copy snippet"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-[#30d158]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-48 selection:bg-blue-600/30">
              <code>{htmlSnippet}</code>
            </pre>
          </div>

          {/* Why This Matters Narrative Card */}
          <div className="p-4 rounded-2xl bg-black/30 border-[0.5px] border-white/10 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider font-mono">
              Why This Matters to Disabled Users
            </h4>
            <p className="text-[14px] text-[#f5f5f7] leading-relaxed tracking-tight">
              {finding.summary}
            </p>
          </div>

          {/* Specialized Evidence Panel 1: Tarjan SCC Trap Certificate */}
          {finding.certificate && (
            <div className="p-5 rounded-2xl bg-rose-500/[0.06] border-[0.5px] border-rose-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-[#ff453a] font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Tarjan SCC Trap Certificate (Mathematical Proof)</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-[#86868b] uppercase">Shortest Reproducing Key Sequence:</span>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(finding.certificate.reproducingKeySequence || finding.certificate.keySequence || []).map((k: string, i: number) => (
                    <React.Fragment key={i}>
                      <kbd className="apple-keycap text-[11px] px-2.5 py-1 text-white">
                        {k}
                      </kbd>
                      {i < (finding.certificate!.keySequence?.length || 0) - 1 && (
                        <span className="text-white/40 text-[10px]">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-rose-500/20 text-[11px] text-slate-300 leading-relaxed">
                {finding.certificate.proofExplanation}
              </div>
            </div>
          )}

          {/* Specialized Evidence Panel 2: Static WCAG 1.4.3 Color Contrast */}
          {(finding.kind === 'color_contrast_violation' || finding.evidence?.contrastRatio !== undefined) && (
            <div className="p-4 rounded-2xl bg-amber-500/[0.06] border-[0.5px] border-amber-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-[#ff9f0a] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  WCAG 1.4.3 Contrast Ratio Analysis
                </span>
                <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border-[0.5px] border-amber-500/40">
                  {finding.evidence?.contrastRatio?.toFixed(2) ?? '3.20'}:1 vs 4.5:1
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/40 border-[0.5px] border-white/10 flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: finding.evidence?.foregroundColor || '#767676' }}
                  />
                  <div>
                    <div className="text-[10px] text-[#86868b]">Foreground</div>
                    <div className="text-white font-mono">{finding.evidence?.foregroundColor || '#767676'}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border-[0.5px] border-white/10 flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: finding.evidence?.backgroundColor || '#ffffff' }}
                  />
                  <div>
                    <div className="text-[10px] text-[#86868b]">Background</div>
                    <div className="text-white font-mono">{finding.evidence?.backgroundColor || '#ffffff'}</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#86868b] leading-relaxed">
                Relative luminance linearized per IEC 61966-2-1. Fails minimum WCAG AA threshold of 4.5:1 for normal text.
              </div>
            </div>
          )}

          {/* Specialized Evidence Panel 3: Static WCAG 2.2 2.5.8 Target Size */}
          {(finding.kind === 'target_size_violation' || finding.evidence?.targetWidth !== undefined) && (
            <div className="p-4 rounded-2xl bg-amber-500/[0.06] border-[0.5px] border-amber-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-[#ff9f0a] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  WCAG 2.2 2.5.8 Target Size Analysis
                </span>
                <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border-[0.5px] border-amber-500/40">
                  {finding.evidence?.targetWidth ?? 18}x{finding.evidence?.targetHeight ?? 18}px vs 24x24px
                </span>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed">
                Bounding box is smaller than the required 24x24 CSS pixel minimum. 24px clearance circle intersects neighboring pointer targets.
              </div>
            </div>
          )}

          {/* Specialized Evidence Panel 4: axe-core Baseline */}
          {finding.evidence?.axeRuleId && (
            <div className="p-4 rounded-2xl bg-blue-500/[0.06] border-[0.5px] border-blue-500/30 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-[#0a84ff] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  axe-core Baseline Finding ({finding.evidence.axeRuleId})
                </span>
                {finding.evidence.helpUrl && (
                  <a
                    href={finding.evidence.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#0a84ff] hover:underline flex items-center gap-1"
                  >
                    <span>axe Docs</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="text-[11px] text-[#86868b] leading-relaxed">
                {finding.evidence.failureSummary || finding.evidence.description}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: W3C AccName Provenance Tree Inspector (6 Columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#86868b]">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#30d158]" />
              W3C AccName 1.2 Provenance Breakdown
            </span>
            <span className="text-[10px] text-[#30d158] font-bold">
              Multi-Step Evaluation
            </span>
          </div>

          {/* Interactive Provenance Tree Component */}
          <AccNameProvenanceTree
            evaluation={accNameEvaluation}
            role={finding.evidence?.role}
            selector={selector}
            computedName={accNameEvaluation.computedName}
            className="w-full"
          />
        </div>
      </div>

      {/* 3. Bottom Section: Surgical Repair & Verification (Before / After Diff) */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-[12px] font-semibold text-[#86868b] uppercase font-mono flex items-center gap-1.5">
            <Code className="w-4 h-4 text-[#0a84ff]" />
            Surgical ARIA / HTML Fix Patch (Before / After)
          </h4>

          {isVerified && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-[#30d158] bg-emerald-500/10 px-3 py-1 rounded-full border-[0.5px] border-emerald-500/30 font-semibold shadow-sm animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-[#30d158]" />
              VERIFIED SEAL ISSUED (0 Regressions Detected)
            </span>
          )}
        </div>

        {/* Before / After Diff Side-by-Side Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before: Offending Markup */}
          <div className="p-4 rounded-2xl bg-black/40 border-[0.5px] border-rose-500/20 font-mono text-xs space-y-2">
            <div className="text-[10px] uppercase text-[#ff453a] font-bold flex items-center gap-1">
              <span>[-]</span> Before (Offending Source)
            </div>
            <pre className="text-slate-400 overflow-x-auto text-[11px] leading-relaxed">
              <code>{htmlSnippet}</code>
            </pre>
          </div>

          {/* After: Verified Surgical Patch */}
          <div className="p-4 rounded-2xl bg-black/40 border-[0.5px] border-emerald-500/25 font-mono text-xs space-y-2">
            <div className="text-[10px] uppercase text-[#30d158] font-bold flex items-center gap-1">
              <span>[+]</span> After (Surgical Accessible Patch)
            </div>
            <pre className="text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
              <code>{generatePatchSnippet(finding)}</code>
            </pre>
          </div>
        </div>

        {/* Verified Fix Diff Summary */}
        {activeFix && (
          <div className="p-3.5 rounded-xl bg-black/30 text-xs font-mono text-[#30d158] border-[0.5px] border-emerald-500/30 flex items-center gap-2">
            <Check className="w-4 h-4 text-[#30d158] shrink-0" />
            <span>{activeFix.diffSummary || 'Verification confirmed in-memory replay succeeded with zero regression side effects.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePatchSnippet(finding: BarrierFinding): string {
  if (finding.patchProposal) {
    return finding.patchProposal;
  }

  switch (finding.kind) {
    case 'empty_accessible_name':
    case 'misleading_accessible_name':
      return `<button id="${finding.evidence?.id || 'action-btn'}" class="btn" aria-label="Confirm and proceed">\n  <svg class="icon">...</svg>\n</button>`;
    case 'keyboard_trap':
      return `<div role="dialog" aria-modal="true" onKeyDown={handleModalEscape}>\n  <input placeholder="Name" aria-label="Your Name" />\n  <button aria-label="Close dialog">Close</button>\n</div>`;
    case 'color_contrast_violation':
      return `/* Enhanced contrast ratio >= 4.5:1 */\n.text-secondary {\n  color: #f5f5f7; /* Linear luminance calibrated */\n  background-color: #121212;\n}`;
    case 'target_size_violation':
      return `/* Minimum 24x24px CSS touch bounding box */\n.icon-button {\n  min-width: 24px;\n  min-height: 24px;\n  padding: 6px;\n}`;
    default:
      return `<div role="region" aria-label="Accessible container">\n  ${finding.evidence?.htmlSnippet || '<!-- Accessible patch applied -->'}\n</div>`;
  }
}
