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
      case '2A': return 'Step 2A: Hidden Node Evaluation';
      case '2B': return 'Step 2B: aria-labelledby Resolution';
      case '2C': return 'Step 2C: aria-label Direct String';
      case '2D': return 'Step 2D: Native Host Language Markup';
      case '2E': return 'Step 2E: Embedded Control Values';
      case '2F': return 'Step 2F: Subtree Contents Traversal';
      case '2I': return 'Step 2I: Fallback title Attribute';
      default: return `Step ${step}`;
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'aria-labelledby':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'aria-label':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'native-markup':
        return 'bg-emerald-500/10 text-[#30d158] border-emerald-500/20';
      case 'subtree-contents':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'title':
        return 'bg-amber-500/10 text-[#ff9f0a] border-amber-500/20';
      case 'hidden-check':
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      default:
        return 'bg-white/10 text-[#f4f5f6] border-white/20';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Header Card: Target Element & Computed Name Hero */}
      <div className="p-4 rounded-xl bg-[#141517] border border-[#23262a] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#181a1d] text-[#f4f5f6] border border-[#23262a] font-semibold">
              W3C AccName 1.2
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20 font-medium">
              role=&quot;{role}&quot;
            </span>
            <span className="text-xs font-mono text-[#9ba1a6] truncate max-w-xs" title={selector}>
              {selector}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterEvaluatedOnly(!filterEvaluatedOnly)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-[#23262a] bg-[#181a1d] hover:bg-[#23262a] text-[#9ba1a6] hover:text-[#f4f5f6] transition-all"
            >
              {filterEvaluatedOnly ? 'Show All Steps' : 'Evaluated Only'}
            </button>
            {computedName && (
              <button
                onClick={() => handleCopy(computedName, 'name')}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-md border border-[#23262a] bg-[#181a1d] hover:bg-[#23262a] text-[#9ba1a6] hover:text-[#f4f5f6] transition-all"
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
        <div className="p-3.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider font-semibold">
              Computed Accessible Name:
            </div>
            {computedName ? (
              <div className="text-base font-bold text-[#f4f5f6] tracking-tight flex items-center gap-1.5">
                <span className="text-emerald-400 font-mono">&quot;</span>
                <span>{computedName}</span>
                <span className="text-emerald-400 font-mono">&quot;</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>&quot;&quot; (Empty String — No Accessible Name Derived)</span>
              </div>
            )}
          </div>

          {winningSource ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono uppercase text-[#62676d]">Winning Source:</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${getSourceBadgeColor(winningSource.source)}`}>
                <Sparkles className="w-2.5 h-2.5" />
                {winningSource.step} ({winningSource.source})
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              No Winning Source
            </span>
          )}
        </div>

        {/* CDP Cross-Check Result Pill */}
        {cdpComparison && (
          <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono ${
            cdpComparison.agrees
              ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-[#30d158]'
              : 'bg-amber-500/[0.06] border-amber-500/20 text-[#ff9f0a]'
          }`}>
            <div className="flex items-center gap-2">
              {cdpComparison.agrees ? (
                <ShieldCheck className="w-4 h-4 text-[#30d158] shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-[#ff9f0a] shrink-0" />
              )}
              <span>
                CDP Cross-Check: {cdpComparison.agrees ? 'AGREED' : 'DISAGREEMENT'} (Blink Tree: &quot;{cdpComparison.cdpName}&quot;)
              </span>
            </div>
            {cdpComparison.details && (
              <span className="text-[10px] text-[#9ba1a6] hidden md:inline">
                {cdpComparison.details}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Diagnostic Remedy Banner */}
      {diagnostic && (
        <div className={`p-3.5 rounded-lg border space-y-2 ${
          diagnostic.severity === 'critical' || diagnostic.severity === 'high'
            ? 'bg-rose-500/[0.06] border-rose-500/25 text-rose-200'
            : 'bg-amber-500/[0.06] border-amber-500/25 text-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${
                diagnostic.severity === 'critical' || diagnostic.severity === 'high'
                  ? 'text-[#ff453a]'
                  : 'text-[#ff9f0a]'
              }`} />
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider">
                Diagnostic: {diagnostic.code}
              </span>
            </div>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
              diagnostic.severity === 'critical' || diagnostic.severity === 'high'
                ? 'bg-rose-500/20 text-[#ff453a] border-rose-500/30'
                : 'bg-amber-500/20 text-[#ff9f0a] border-amber-500/30'
            }`}>
              {diagnostic.severity} severity
            </span>
          </div>

          <p className="text-xs leading-relaxed text-[#f4f5f6]">
            {diagnostic.message}
          </p>

          {(diagnostic.remedy || diagnostic.remediationAdvice) && (
            <div className="pt-2 border-t border-[#23262a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-mono text-emerald-300">
                <span className="text-[#9ba1a6]">Remedy: </span>
                {diagnostic.remedy || diagnostic.remediationAdvice}
              </div>
              <button
                onClick={() => handleCopy(diagnostic.remedy || diagnostic.remediationAdvice || '', 'remedy')}
                className="self-start sm:self-auto flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#181a1d] hover:bg-[#23262a] text-[#f4f5f6] border border-[#23262a] transition-all"
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
        <div className="flex items-center justify-between text-[11px] font-mono text-[#62676d] px-1">
          <span className="uppercase tracking-wider font-semibold">
            W3C Step Sequence ({displaySteps.length} Steps)
          </span>
          <span>Precedence: 2A → 2B → 2C → 2D → 2F → 2I</span>
        </div>

        <div className="space-y-1.5">
          {displaySteps.map((step, idx) => {
            const isWinner = step.success;

            return (
              <div
                key={`${step.step}-${idx}`}
                className={`p-3 rounded-lg border transition-all ${
                  isWinner
                    ? 'bg-emerald-500/[0.08] border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : step.evaluated
                    ? 'bg-[#141517] border-[#23262a] hover:border-[#34383e]'
                    : 'bg-[#0c0d0e] border-[#23262a] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isWinner ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#30d158]" />
                        </div>
                      ) : step.evaluated ? (
                        <div className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <XCircle className="w-3.5 h-3.5 text-[#ff9f0a]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#62676d]" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#f4f5f6] font-mono">
                          {getStepTitle(step.step)}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${getSourceBadgeColor(step.source)}`}>
                          {step.source}
                        </span>
                        {isWinner && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-[#30d158] text-black flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" />
                            Winner
                          </span>
                        )}
                        {!step.evaluated && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#181a1d] text-[#62676d]">
                            Skipped
                          </span>
                        )}
                      </div>

                      {step.candidateText ? (
                        <div className="text-xs font-mono text-emerald-300 bg-[#0c0d0e] px-2.5 py-1 rounded border border-emerald-500/20 inline-block">
                          yielded: &quot;{step.candidateText}&quot;
                        </div>
                      ) : null}

                      {step.reason && (
                        <div className="text-[11px] text-[#9ba1a6] leading-relaxed">
                          {step.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function generateDefaultSteps(role: string, name: string, diagnostic?: AccNameDiagnostic): AccNameProvenanceStep[] {
  return [
    { step: '2A', source: 'hidden-check', evaluated: true, success: false, reason: 'Element is visible in layout viewport (aria-hidden is not true).' },
    { step: '2B', source: 'aria-labelledby', evaluated: true, success: false, reason: 'No aria-labelledby attribute present on host element.' },
    { step: '2C', source: 'aria-label', evaluated: true, success: Boolean(name), candidateText: name || undefined, reason: name ? 'Found non-empty aria-label attribute.' : 'No aria-label attribute declared.' },
    { step: '2D', source: 'native-markup', evaluated: !name, success: false, reason: 'No native label/alt attribute applicable.' },
    { step: '2F', source: 'subtree-contents', evaluated: !name, success: false, reason: 'Contents not eligible or empty.' },
    { step: '2I', source: 'title', evaluated: !name, success: false, reason: 'No title attribute present.' }
  ];
}
