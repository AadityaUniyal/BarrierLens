'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  AccNameEvaluation,
  AccNameProvenanceStep,
  AccNameDiagnostic,
  ProvenanceStep
} from '@/lib/barrierlens/types';

export interface AccNameProvenanceTreeProps {
  evaluation?: AccNameEvaluation | null;
  computedName?: string;
  role?: string;
  selector?: string;
  provenanceTree?: AccNameProvenanceStep[];
  winningSource?: AccNameProvenanceStep;
  diagnostic?: AccNameDiagnostic;
  cdpComparison?: {
    cdpName: string;
    agrees: boolean;
    discrepancyCode?: 'MATCH' | 'DISAGREEMENT' | 'CDP_EMPTY' | 'ENGINE_EMPTY';
    details?: string;
  };
  className?: string;
  compact?: boolean;
}

export function AccNameProvenanceTree({
  evaluation,
  computedName: propComputedName,
  role: propRole,
  selector: propSelector,
  provenanceTree: propProvenanceTree,
  winningSource: propWinningSource,
  diagnostic: propDiagnostic,
  cdpComparison: propCdpComparison,
  className = '',
  compact = false
}: AccNameProvenanceTreeProps) {
  const [filterEvaluatedOnly, setFilterEvaluatedOnly] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null);

  // Extract or synthesize values
  const selector = evaluation?.selector || evaluation?.elementSelector || propSelector || 'button';
  const role = evaluation?.role || propRole || 'button';
  const computedName = (evaluation?.computedName !== undefined ? evaluation.computedName : propComputedName) ?? '';

  // Canonical standard steps fallback if tree is empty
  const rawTree: AccNameProvenanceStep[] = evaluation?.provenanceTree?.length
    ? evaluation.provenanceTree
    : (propProvenanceTree?.length ? propProvenanceTree : generateDefaultSteps(role, computedName, evaluation?.diagnostic || propDiagnostic));

  const winningSource = evaluation?.winningSource || propWinningSource || rawTree.find(s => s.success);
  const diagnostic = evaluation?.diagnostic || propDiagnostic;
  const cdpComparison = evaluation?.cdpComparison || propCdpComparison;

  const displaySteps = filterEvaluatedOnly
    ? rawTree.filter(step => step.evaluated)
    : rawTree;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const getStepTitle = (step: string): string => {
    switch (step) {
      case '2A': return 'Step 2A: Hidden Node Check';
      case '2B': return 'Step 2B: aria-labelledby IDREFs';
      case '2C': return 'Step 2C: aria-label Attribute';
      case '2D': return 'Step 2D: Native Host Language Markup';
      case '2E': return 'Step 2E: Embedded Control Values';
      case '2F': return 'Step 2F: Subtree Contents (Name From: contents)';
      case '2I': return 'Step 2I: Fallback title Attribute';
      default: return `Step ${step}`;
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'aria-labelledby':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'aria-label':
        return 'bg-blue-500/10 text-[#0a84ff] border-blue-500/30';
      case 'native-markup':
        return 'bg-emerald-500/10 text-[#30d158] border-emerald-500/30';
      case 'subtree-contents':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'title':
        return 'bg-amber-500/10 text-[#ff9f0a] border-amber-500/30';
      case 'hidden-check':
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30';
      default:
        return 'bg-white/10 text-[#f5f5f7] border-white/20';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Header Card: Target Element & Computed Name Hero */}
      <div className="p-4 rounded-2xl bg-black/40 border-[0.5px] border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#f5f5f7] border-[0.5px] border-white/15 font-semibold">
              W3C AccName 1.2
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0a84ff] border-[0.5px] border-blue-500/30 font-medium">
              role=&quot;{role}&quot;
            </span>
            <span className="text-xs font-mono text-[#86868b] truncate max-w-xs" title={selector}>
              {selector}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterEvaluatedOnly(!filterEvaluatedOnly)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border-[0.5px] border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-[#86868b] hover:text-white transition-all duration-150 active:scale-[0.98]"
            >
              {filterEvaluatedOnly ? 'Show All Steps (6)' : 'Evaluated Only'}
            </button>
            {computedName && (
              <button
                onClick={() => handleCopy(computedName, 'name')}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg border-[0.5px] border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-[#86868b] hover:text-white transition-all duration-150 active:scale-[0.98]"
                title="Copy computed name"
              >
                {copiedText === 'name' ? (
                  <Check className="w-3 h-3 text-[#30d158]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedText === 'name' ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Computed Name Banner */}
        <div className="p-3.5 rounded-xl bg-black/60 border-[0.5px] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#86868b] tracking-wider font-semibold">
              Computed Accessible Name:
            </div>
            {computedName ? (
              <div className="text-[16px] font-bold text-white tracking-tight flex items-center gap-2">
                <span className="text-emerald-400 font-mono">&quot;</span>
                <span className="text-white">{computedName}</span>
                <span className="text-emerald-400 font-mono">&quot;</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-semibold">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>&quot;&quot; (Empty String — No Name Derived)</span>
              </div>
            )}
          </div>

          {winningSource ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono uppercase text-[#86868b]">Winning Source:</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border-[0.5px] flex items-center gap-1 ${getSourceBadgeColor(winningSource.source)}`}>
                <Sparkles className="w-2.5 h-2.5" />
                {winningSource.step} ({winningSource.source})
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border-[0.5px] border-rose-500/30 shrink-0">
              No Winning Source
            </span>
          )}
        </div>

        {/* CDP Cross-Check Result Pill */}
        {cdpComparison && (
          <div className={`p-2.5 rounded-xl border-[0.5px] flex items-center justify-between text-xs font-mono ${
            cdpComparison.agrees
              ? 'bg-emerald-500/[0.06] border-emerald-500/25 text-[#30d158]'
              : 'bg-amber-500/[0.06] border-amber-500/25 text-[#ff9f0a]'
          }`}>
            <div className="flex items-center gap-2">
              {cdpComparison.agrees ? (
                <ShieldCheck className="w-4 h-4 text-[#30d158] shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-[#ff9f0a] shrink-0" />
              )}
              <span>
                CDP Cross-Check: {cdpComparison.agrees ? 'AGREED' : 'DISAGREEMENT'} (Chromium Blink Name: &quot;{cdpComparison.cdpName}&quot;)
              </span>
            </div>
            {cdpComparison.details && (
              <span className="text-[10px] text-[#86868b] hidden md:inline">
                {cdpComparison.details}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Diagnostic Remedy Banner (If Diagnostic exists) */}
      {diagnostic && (
        <div className={`p-4 rounded-2xl border-[0.5px] space-y-2.5 ${
          diagnostic.severity === 'critical' || diagnostic.severity === 'high'
            ? 'bg-rose-500/[0.07] border-rose-500/30 text-rose-200'
            : 'bg-amber-500/[0.07] border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${
                diagnostic.severity === 'critical' || diagnostic.severity === 'high'
                  ? 'text-[#ff453a]'
                  : 'text-[#ff9f0a]'
              }`} />
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider">
                AccName Diagnostic: {diagnostic.code}
              </span>
            </div>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border-[0.5px] ${
              diagnostic.severity === 'critical' || diagnostic.severity === 'high'
                ? 'bg-rose-500/20 text-[#ff453a] border-rose-500/40'
                : 'bg-amber-500/20 text-[#ff9f0a] border-amber-500/40'
            }`}>
              {diagnostic.severity} severity
            </span>
          </div>

          <p className="text-[13px] leading-relaxed text-[#f5f5f7]">
            {diagnostic.message}
          </p>

          {(diagnostic.remedy || diagnostic.remediationAdvice) && (
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-mono text-emerald-300">
                <span className="text-[#86868b]">Remedy: </span>
                {diagnostic.remedy || diagnostic.remediationAdvice}
              </div>
              <button
                onClick={() => handleCopy(diagnostic.remedy || diagnostic.remediationAdvice || '', 'remedy')}
                className="self-start sm:self-auto flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-all active:scale-[0.98]"
              >
                {copiedText === 'remedy' ? <Check className="w-2.5 h-2.5 text-[#30d158]" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedText === 'remedy' ? 'Copied' : 'Copy Advice'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Step-by-Step Provenance Resolution Stack */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#86868b] px-1">
          <span className="uppercase tracking-wider font-semibold">
            W3C Step Sequence ({displaySteps.length} Steps)
          </span>
          <span>Order of Precedence: 2A → 2B → 2C → 2D → 2F → 2I</span>
        </div>

        <div className="space-y-2">
          {displaySteps.map((step, idx) => {
            const isWinner = step.success;
            const isExpanded = expandedStepIndex === idx;

            return (
              <div
                key={`${step.step}-${idx}`}
                className={`p-3.5 rounded-xl border-[0.5px] transition-all duration-200 ease-spring ${
                  isWinner
                    ? 'bg-emerald-500/[0.08] border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                    : step.evaluated
                    ? 'bg-black/30 border-white/10 hover:border-white/20'
                    : 'bg-black/15 border-white/[0.06] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Step Icon */}
                    <div className="mt-0.5 shrink-0">
                      {isWinner ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#30d158]" />
                        </div>
                      ) : step.evaluated ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                          <XCircle className="w-3.5 h-3.5 text-[#ff9f0a]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {getStepTitle(step.step)}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border-[0.5px] ${getSourceBadgeColor(step.source)}`}>
                          {step.source}
                        </span>
                        {isWinner && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-extrabold bg-[#30d158] text-black flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" />
                            Winner
                          </span>
                        )}
                        {!step.evaluated && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#86868b]">
                            Skipped
                          </span>
                        )}
                      </div>

                      {/* Candidate Text or Failure Reason */}
                      {step.candidateText ? (
                        <div className="text-xs font-mono text-emerald-300 bg-black/40 px-2.5 py-1 rounded-lg border-[0.5px] border-emerald-500/20 inline-block">
                          yielded: &quot;{step.candidateText}&quot;
                        </div>
                      ) : null}

                      {step.reason && (
                        <div className="text-[12px] text-[#86868b] leading-relaxed">
                          {step.reason}
                        </div>
                      )}

                      {/* Broken IDREF callout */}
                      {step.missingIds && step.missingIds.length > 0 && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border-[0.5px] border-rose-500/30 text-rose-300 font-mono text-[11px] space-y-1">
                          <div className="font-bold flex items-center gap-1 text-[#ff453a]">
                            <AlertTriangle className="w-3 h-3" />
                            Missing Target Element(s):
                          </div>
                          <div className="pl-4">
                            {step.missingIds.map(id => (
                              <div key={id}>• Element ID &quot;#{id}&quot; does not exist in the DOM document.</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand / Details toggle */}
                  {(step.referencedIds?.length || step.reason) && (
                    <button
                      onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                      className="p-1 rounded-lg hover:bg-white/10 text-[#86868b] hover:text-white transition-colors"
                      title="Toggle step details"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-[11px] font-mono text-[#86868b] space-y-1.5 pl-8">
                    {step.referencedIds && step.referencedIds.length > 0 && (
                      <div>
                        <span className="text-white">Referenced IDREFs: </span>
                        [{step.referencedIds.map(id => `#${id}`).join(', ')}]
                      </div>
                    )}
                    <div>
                      <span className="text-white">Evaluation State: </span>
                      {step.evaluated ? 'Evaluated against DOM context' : 'Skipped / Source attribute not present'}
                    </div>
                    <div>
                      <span className="text-white">W3C Precedence: </span>
                      {step.step === '2A' && 'Step 2A (Check if hidden)'}
                      {step.step === '2B' && 'Step 2B (Takes precedence over aria-label and contents)'}
                      {step.step === '2C' && 'Step 2C (Takes precedence over contents if role permits)'}
                      {step.step === '2D' && 'Step 2D (Host markup label/alt)'}
                      {step.step === '2F' && 'Step 2F (Recursive inner text from subtree)'}
                      {step.step === '2I' && 'Step 2I (Lowest priority advisory fallback)'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback Step Synthesizer
// ---------------------------------------------------------------------------

function generateDefaultSteps(
  role: string,
  computedName: string,
  diagnostic?: AccNameDiagnostic
): AccNameProvenanceStep[] {
  const isNameEmpty = !computedName || computedName.trim().length === 0;

  return [
    {
      step: '2A',
      source: 'hidden-check',
      evaluated: true,
      success: true,
      reason: 'Element is visible in render tree and not hidden via CSS or HTML inert attributes.'
    },
    {
      step: '2B',
      source: 'aria-labelledby',
      evaluated: diagnostic?.code === 'BROKEN_ARIA_LABELLEDBY',
      success: false,
      reason: diagnostic?.code === 'BROKEN_ARIA_LABELLEDBY'
        ? 'Attribute aria-labelledby references DOM element IDs that do not exist.'
        : 'Attribute aria-labelledby not specified on element.',
      missingIds: diagnostic?.code === 'BROKEN_ARIA_LABELLEDBY' ? ['target-label-id'] : undefined
    },
    {
      step: '2C',
      source: 'aria-label',
      evaluated: !isNameEmpty && computedName.length > 0,
      success: !isNameEmpty,
      candidateText: !isNameEmpty ? computedName : undefined,
      reason: !isNameEmpty
        ? `Valid aria-label found with non-empty string "${computedName}".`
        : 'Attribute aria-label is missing or contains only whitespace.'
    },
    {
      step: '2D',
      source: 'native-markup',
      evaluated: false,
      success: false,
      reason: 'No native host markup label (<label>, alt, or legend) is associated with this element.'
    },
    {
      step: '2F',
      source: 'subtree-contents',
      evaluated: isNameEmpty,
      success: false,
      reason: isNameEmpty
        ? 'Subtree contains only SVG or graphic elements with no accessible text nodes or title.'
        : 'Subtree evaluation superseded by higher-priority ARIA label.'
    },
    {
      step: '2I',
      source: 'title',
      evaluated: isNameEmpty,
      success: false,
      reason: 'No fallback title attribute is defined on the element.'
    }
  ];
}
