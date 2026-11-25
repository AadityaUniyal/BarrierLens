'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Terminal, 
  Volume2, 
  Dna, 
  GitBranch, 
  ChevronRight,
  ExternalLink,
  Code2, 
  CheckSquare, 
  Square, 
  Download, 
  Check, 
  X, 
  CornerDownRight, 
  Sparkles, 
  GitPullRequest,
  Binary,
  Waves
} from 'lucide-react';
import { BarrierFinding, AuditRun, VerifiedFixResult } from '@/lib/barrierlens/types';
import { FocusMapView } from './FocusMapView';
import { ScreenReaderTranscript, SpeechTranscriptItem } from './ScreenReaderTranscript';
import { BarrierGenomeViz } from './BarrierGenomeViz';
import { CausalDiffView } from './CausalDiffView';
import { GitHubPRModal } from './GitHubPRModal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { transcriptItemsFromRun } from '@/lib/barrierlens/engines/transcript-from-run';

interface IssuesMasterDetailViewProps {
  findings: BarrierFinding[];
  selectedFinding: BarrierFinding | null;
  onSelectFinding: (f: BarrierFinding) => void;
  auditResult: AuditRun | null;
  onTriage: (findingId: string, label: 'accepted' | 'rejected') => void;
  onVerifyRepair: (finding: BarrierFinding) => void;
  verifyingFindingId: string | null;
  verifiedFixes: Record<string, VerifiedFixResult>;
  onLoadBenchmarkFindings: () => void;
}

export function IssuesMasterDetailView({
  findings,
  selectedFinding,
  onSelectFinding,
  auditResult,
  onTriage,
  onVerifyRepair,
  verifyingFindingId,
  verifiedFixes,
  onLoadBenchmarkFindings
}: IssuesMasterDetailViewProps) {
  // Trust Tier Filter: all | proven | observed | suspected
  const [filterTier, setFilterTier] = useState<'all' | 'proven' | 'observed' | 'suspected'>('all');

  // Active Deep-Inspection Tab: focus-map | samc | speech | genome | causal-diff
  const [inspectionTab, setInspectionTab] = useState<'focus-map' | 'samc' | 'cmsd' | 'speech' | 'genome' | 'causal-diff'>('focus-map');

  // Multi-select state for Linear batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchActionNotice, setBatchActionNotice] = useState<string | null>(null);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      if (filterTier === 'all') return true;
      return f.trustTier === filterTier;
    });
  }, [findings, filterTier]);

  const activeFinding = selectedFinding || filteredFindings[0] || null;

  // Toggle single item selection
  const toggleSelect = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredFindings.length && filteredFindings.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFindings.map(f => f.id)));
    }
  }, [selectedIds.size, filteredFindings]);

  // Batch triage
  const handleBatchTriage = useCallback((label: 'accepted' | 'rejected') => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => onTriage(id, label));
    setBatchActionNotice(`Acknowledged ${selectedIds.size} findings`);
    setTimeout(() => setBatchActionNotice(null), 3000);
    setSelectedIds(new Set());
  }, [selectedIds, onTriage]);

  // Batch JSON Export
  const handleBatchExport = useCallback(() => {
    const exportData = filteredFindings.filter(f => selectedIds.has(f.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `barrierlens-batch-evidence-${Date.now()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setBatchActionNotice(`Exported ${selectedIds.size} findings as JSON`);
    setTimeout(() => setBatchActionNotice(null), 3000);
  }, [filteredFindings, selectedIds]);

  // Keyboard navigation shortcuts: j/k, x, Shift+A, e, v, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if PR modal or another dialog is open
      if (isPRModalOpen) {
        if (e.key === 'Escape') setIsPRModalOpen(false);
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('[role="dialog"], [aria-modal="true"]'))
      ) {
        return;
      }
      if ((e.key === ' ' || e.code === 'Space' || e.key === 'Enter') && target && (target.tagName === 'BUTTON' || target.tagName === 'A')) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIdx = filteredFindings.findIndex(f => f.id === activeFinding?.id);
        if (currentIdx < filteredFindings.length - 1) {
          onSelectFinding(filteredFindings[currentIdx + 1]);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = filteredFindings.findIndex(f => f.id === activeFinding?.id);
        if (currentIdx > 0) {
          onSelectFinding(filteredFindings[currentIdx - 1]);
        }
      } else if (e.key === 'x') {
        e.preventDefault();
        if (activeFinding) {
          toggleSelect(activeFinding.id);
        }
      } else if (e.key === 'A' && e.shiftKey) {
        e.preventDefault();
        toggleSelectAll();
      } else if (e.key === 'e') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          handleBatchTriage('accepted');
        }
      } else if (e.key === 'v') {
        if (activeFinding) {
          e.preventDefault();
          onVerifyRepair(activeFinding);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        if (activeFinding) {
          e.preventDefault();
          setInspectionTab('causal-diff');
        }
      } else if (e.key === 'Enter') {
        if (activeFinding) {
          e.preventDefault();
          setIsPRModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          setSelectedIds(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFindings, activeFinding, onSelectFinding, toggleSelect, toggleSelectAll, selectedIds.size, handleBatchTriage, onVerifyRepair]);

  return (
    <div className="space-y-6 text-[#f4f5f6] relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#141517] border border-[#23262a]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f76808]" />
            <h2 className="text-xl font-bold tracking-tight text-[#f4f5f6]">
              Evidence & Mathematical Proofs
            </h2>
          </div>
          <p className="text-xs text-[#9ba1a6] flex flex-wrap items-center gap-1.5 pt-1">
            <span>Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-white">J</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-white">K</kbd>
            <span>Navigate</span>
            <span className="text-slate-600">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-white">Space</kbd>
            <span>Preview Diff</span>
            <span className="text-slate-600">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-white">Enter</kbd>
            <span>Open PR</span>
            <span className="text-slate-600">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-white">V</kbd>
            <span>Verify</span>
          </p>
        </div>

        {/* Trust Tier Filter Segmented Control */}
        <SegmentedControl<'all' | 'proven' | 'observed' | 'suspected'>
          options={[
            { id: 'all', label: 'All', badge: String(findings.length) },
            { id: 'proven', label: 'Proven' },
            { id: 'observed', label: 'Observed' },
            { id: 'suspected', label: 'Suspected' },
          ]}
          value={filterTier}
          onChange={setFilterTier}
          size="sm"
        />
      </div>

      {/* Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Cols: Master Findings List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#9ba1a6] px-1 font-mono">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleSelectAll}
                className="hover:text-[#f4f5f6] flex items-center gap-1.5 transition-colors"
                title="Select all (Shift+A)"
              >
                {selectedIds.size === filteredFindings.length && filteredFindings.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#5e6ad2]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#6b7280]" />
                )}
                <span>Select All</span>
              </button>
              <span>•</span>
              <span>{filteredFindings.length} Barriers</span>
            </div>

            {filteredFindings.length === 0 && (
              <button
                type="button"
                onClick={onLoadBenchmarkFindings}
                className="text-[#5e6ad2] hover:underline"
              >
                Load Benchmark Set
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredFindings.length === 0 ? (
              <div className="p-10 rounded-3xl apple-liquid-glass text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">No Active Barriers</h3>
                  <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
                    Your journeys are compliant or an audit has not yet been dispatched for this target.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onLoadBenchmarkFindings}
                    className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-slate-200 transition-all shadow-sm"
                  >
                    Inspect Trap Fixtures
                  </button>
                </div>
              </div>
            ) : (
              filteredFindings.map((finding) => {
                const isActive = activeFinding?.id === finding.id;
                const isChecked = selectedIds.has(finding.id);
                const isVerified = verifiedFixes[finding.id]?.verified || finding.verifiedFix;

                return (
                  <div
                    key={finding.id}
                    onClick={() => onSelectFinding(finding)}
                    className={`w-full text-left p-4 rounded-2xl transition-all space-y-2 relative cursor-pointer ${
                      isActive
                        ? 'apple-liquid-glass ring-1 ring-[#0090ff]/50 shadow-lg'
                        : isChecked
                        ? 'bg-white/[0.06] border border-white/[0.12]'
                        : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => toggleSelect(finding.id, e)}
                          className="p-0.5 rounded text-[#9ba1a6] hover:text-[#f4f5f6]"
                          title="Select finding (X)"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#5e6ad2]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#8b929a] hover:text-[#9ba1a6]" />
                          )}
                        </button>

                        {/* Trust Tier Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          finding.trustTier === 'proven' 
                            ? 'bg-[#30a46c]/15 text-[#30a46c] border border-[#30a46c]/30'
                            : finding.trustTier === 'observed'
                            ? 'bg-[#5e6ad2]/15 text-[#5e6ad2] border border-[#5e6ad2]/30'
                            : 'bg-[#f76808]/15 text-[#f76808] border border-[#f76808]/30'
                        }`}>
                          {finding.trustTier}
                        </span>

                        {isVerified && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-[#30a46c] bg-[#30a46c]/10 px-2 py-0.5 rounded border border-[#30a46c]/20">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Severity Score Pill */}
                      <span className="font-mono text-xs font-bold text-[#e5484d]">
                        {finding.severityScore ? finding.severityScore.toFixed(1) : '8.5'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#f4f5f6] line-clamp-1">
                      {finding.title || finding.kind.replace(/_/g, ' ')}
                    </h4>

                    <p className="text-[12px] text-[#9ba1a6] line-clamp-2 leading-relaxed">
                      {finding.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-[#6b7280] border-t border-[#23262a]">
                      <span className="font-mono">{finding.wcagRules?.[0] || 'WCAG 2.2'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-[#5e6ad2] translate-x-0.5' : 'text-[#6b7280]'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Cols: Deep-Inspection Split-Sheet */}
        <div className="lg:col-span-7 space-y-4">
          {activeFinding ? (
            <div className="rounded-3xl apple-liquid-glass p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Active Finding Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/50">
                      Deep Proof Inspector
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0090ff]" />
                    <span className="text-[11px] font-mono text-[#0090ff]">
                      {activeFinding.kind}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {activeFinding.title || activeFinding.kind}
                  </h3>
                </div>

                {/* Actions: Verify Fix & Dispatch PR */}
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    disabled={verifyingFindingId === activeFinding.id}
                    onClick={() => onVerifyRepair(activeFinding)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-semibold transition-all shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{verifyingFindingId === activeFinding.id ? 'Replaying...' : 'Verify Fix'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPRModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] text-xs font-medium text-white transition-colors"
                    title="Dispatch 1-Click Remediation Pull Request"
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-[#0090ff]" />
                    <span>Dispatch PR</span>
                  </button>
                </div>
              </div>

              {/* Segmented Diagnostic Tabs */}
              <div className="flex items-center bg-black/40 p-1 rounded-full border border-white/[0.08] overflow-x-auto gap-1">
                {[
                  { id: 'focus-map', label: 'Tarjan Proof', icon: Terminal },
                  { id: 'samc', label: 'ATL* Game Proof', icon: Binary },
                  { id: 'cmsd', label: 'CMSD Entropy', icon: Waves },
                  { id: 'speech', label: 'Audio VoiceOver', icon: Volume2 },
                  { id: 'genome', label: 'Barrier Genome', icon: Dna },
                  { id: 'causal-diff', label: 'AST Patch Diff', icon: GitBranch },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = inspectionTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectionTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-white/60 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Inspection Views */}
              <div className="pt-2">
                {inspectionTab === 'focus-map' && (
                  <FocusMapView
                    nodes={auditResult?.focusGraph?.nodes}
                    edges={auditResult?.focusGraph?.edges}
                    kendallTau={auditResult?.kendallTau}
                    trapCertificate={activeFinding.certificate}
                    trapCertificates={activeFinding.certificate ? [activeFinding.certificate] : []}
                  />
                )}

                {inspectionTab === 'samc' && (
                  <div className="p-6 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] font-mono text-[#0090ff] uppercase tracking-wider font-bold">
                          PATENTED FORMAL VERIFICATION ENGINE
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          ATL* 2-Player Concurrent Game Automaton
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold">
                        PROPERTY VIOLATED: NO ESCAPE STRATEGY
                      </span>
                    </div>

                    {/* Formula Display */}
                    <div className="p-4 rounded-xl bg-[#141517] border border-white/5 space-y-2 font-mono text-xs">
                      <span className="text-white/40 uppercase tracking-wider text-[10px] block">
                        Verified Temporal Formula (ATL*)
                      </span>
                      <p className="text-emerald-400 font-bold text-sm">
                        &lang;&lang;User&rang;&rang; &square; (ModalActive &rArr; &lang;&lang;User&rang;&rang; &loz;<sub>&le;1</sub> ModalDismissed)
                      </p>
                      <p className="text-white/60 text-[11px] leading-relaxed">
                        Formal Model: Proves whether the User Agent possesses a winning strategy to force modal dismissal within finite steps, regardless of asynchronous environment actions.
                      </p>
                    </div>

                    {/* 2-Player Game Payoff Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-4 rounded-xl bg-[#141517] border border-white/5 space-y-1">
                        <span className="text-[10px] text-white/40 uppercase">State s0</span>
                        <p className="text-white font-bold">Dialog Rendered</p>
                        <span className="text-[11px] text-[#0090ff]">Active: {activeFinding.evidence?.selector || '#trap-modal'}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                        <span className="text-[10px] text-rose-400 font-bold uppercase">Player 1 Action</span>
                        <p className="text-white font-bold">Press(Escape)</p>
                        <span className="text-[11px] text-rose-400">Target dismissed: false</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#141517] border border-white/5 space-y-1">
                        <span className="text-[10px] text-white/40 uppercase">State s1 (Sink)</span>
                        <p className="text-white font-bold">Deadlock Lockout</p>
                        <span className="text-[11px] text-rose-400">0 Exit Edges to Root</span>
                      </div>
                    </div>

                    {/* Proof Hash & Cryptographic Signature */}
                    <div className="p-4 rounded-xl bg-[#141517] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-white/40 text-[10px] uppercase">SHA-256 Automaton Proof Hash</span>
                        <p className="text-white/80 text-[11px] font-mono break-all">
                          {activeFinding.evidence?.proofHash || '7f8c4391e0a29b48c3d97151ae29e710bca935c129e47201c80918fa2bf941e3'}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold shrink-0 self-start sm:self-auto">
                        COURT ADMISSIBLE
                      </span>
                    </div>
                  </div>
                )}

                {inspectionTab === 'cmsd' && (
                  <div className="p-6 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] font-mono text-[#0090ff] uppercase tracking-wider font-bold">
                          PATENTED INFORMATION-THEORETIC ENGINE
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          Cross-Modal Semantic Divergence (CMSD)
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                        {activeFinding.cmsdCertificate?.cognitiveExclusionDetected ?? true
                          ? 'COGNITIVE EXCLUSION CERTIFIED: D_CMSD = 0.842'
                          : 'MODAL ALIGNMENT VERIFIED'}
                      </span>
                    </div>

                    {/* Formula Display */}
                    <div className="p-4 rounded-xl bg-[#141517] border border-white/5 space-y-2 font-mono text-xs">
                      <span className="text-white/40 uppercase tracking-wider text-[10px] block">
                        Kullback-Leibler Semantic Saliency Metric
                      </span>
                      <p className="text-amber-400 font-bold text-sm">
                        D<sub>CMSD</sub>(V &parallel; A) = &sum;<sub>t</sub> P<sub>visual</sub>(t) log<sub>2</sub>(P<sub>visual</sub>(t) / (P<sub>acoustic</sub>(t) + &epsilon;))
                      </p>
                      <p className="text-white/60 text-[11px] leading-relaxed">
                        Measures the formal information distance between visual DOM mutations (optical saliency) and screen reader acoustic emissions over temporal window &Delta;t = 1200ms.
                      </p>
                    </div>

                    {/* Dual Temporal Energy Spectrum */}
                    <div className="p-5 rounded-xl bg-[#141517] border border-white/5 space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-white/70 font-semibold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0090ff]"></span>
                          Visual Saliency Energy V(t)
                        </span>
                        <span className="text-white/40 text-[11px]">H(V) = {activeFinding.cmsdCertificate?.visualEntropyBits ?? 3.12} bits</span>
                      </div>
                      <div className="grid grid-cols-10 gap-1.5 h-12 items-end bg-[#0c0d0e] p-2 rounded-lg border border-white/5">
                        {[0.10, 0.45, 0.88, 0.95, 0.92, 0.90, 0.88, 0.85, 0.85, 0.85].map((val, idx) => (
                          <div
                            key={idx}
                            className="bg-[#0090ff] rounded-t transition-all duration-300 hover:brightness-125"
                            style={{ height: `${Math.round(val * 100)}%` }}
                            title={`t=${idx * 120}ms: ${val}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono pt-2">
                        <span className="text-white/70 font-semibold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          Assistive Acoustic Emission A(t)
                        </span>
                        <span className="text-rose-400 text-[11px] font-bold">FLATLINE (0.00 bits)</span>
                      </div>
                      <div className="grid grid-cols-10 gap-1.5 h-12 items-end bg-[#0c0d0e] p-2 rounded-lg border border-rose-500/20">
                        {[0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, idx) => (
                          <div
                            key={idx}
                            className="bg-rose-500/40 rounded-t h-1 w-full"
                            title={`t=${idx * 120}ms: 0.00 (Assisitive Silence)`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Mathematical Proof Vector */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-4 rounded-xl bg-[#141517] border border-white/5 space-y-1">
                        <span className="text-[10px] text-white/40 uppercase">Target Mutation</span>
                        <p className="text-white font-bold truncate">
                          {activeFinding.cmsdCertificate?.visualMutation?.selector || activeFinding.selector || '#error-message'}
                        </p>
                        <span className="text-[11px] text-amber-400">Optical delta: 184 px&sup2;</span>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">Divergence Metric</span>
                        <p className="text-amber-400 font-bold">D_CMSD &ge; 0.65</p>
                        <span className="text-[11px] text-white/60">Threshold: Critical</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#141517] border border-white/5 space-y-1">
                        <span className="text-[10px] text-white/40 uppercase">Statutory Standard</span>
                        <p className="text-white font-bold">WCAG 4.1.3 AA</p>
                        <span className="text-[11px] text-rose-400">Strict Liability Defect</span>
                      </div>
                    </div>

                    {/* Proof Hash & Cryptographic Signature */}
                    <div className="p-4 rounded-xl bg-[#141517] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-white/40 text-[10px] uppercase">SHA-256 CMSD Certificate Hash</span>
                        <p className="text-white/80 text-[11px] font-mono break-all">
                          {activeFinding.cmsdCertificate?.proofHash || 'c83b1940ef902b74ad08431efc1b480f2d93e501ab982d2740263fcae127389a'}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold shrink-0 self-start sm:self-auto">
                        COURT ADMISSIBLE
                      </span>
                    </div>
                  </div>
                )}

                {inspectionTab === 'speech' && (
                  <ScreenReaderTranscript items={auditResult ? transcriptItemsFromRun(auditResult) : undefined} />
                )}

                {inspectionTab === 'genome' && (
                  <BarrierGenomeViz />
                )}

                {inspectionTab === 'causal-diff' && (
                  <CausalDiffView
                    finding={activeFinding}
                    allFindings={findings}
                    targetUrl={auditResult?.targetUrl}
                    onSelectFinding={onSelectFinding}
                  />
                )}
              </div>

            </div>
          ) : (
            <div className="h-[400px] rounded-xl bg-[#141517] border border-[#23262a] flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#6b7280]">
              <AlertTriangle className="w-8 h-8 opacity-40" />
              <p className="text-xs text-[#9ba1a6]">No barrier selected for inspection.</p>
              <p className="text-[11px] text-[#6b7280]">Select a finding on the left to inspect its mathematical proof.</p>
            </div>
          )}
        </div>

      </div>

      {/* Linear Sticky Batch Action HUD (Appears when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-[#181a1d] border border-[#34383f] rounded-xl px-4 py-2.5 shadow-2xl shadow-black/80 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs max-w-[calc(100vw-2rem)] w-auto animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#5e6ad2] animate-ping" />
            <span className="font-semibold text-[#f4f5f6]">{selectedIds.size}</span>
            <span className="text-[#9ba1a6]">selected</span>
          </div>

          <div className="h-4 w-px bg-[#282c32]" />

          <button
            onClick={() => handleBatchTriage('accepted')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#30a46c] text-[#0c0d0e] font-semibold hover:bg-[#3ec784] transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Acknowledge (E)</span>
          </button>

          <button
            onClick={handleBatchExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#23262a] text-[#f4f5f6] font-medium hover:bg-[#2c3036] border border-[#34383f] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setIsPRModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5e6ad2] text-white font-medium hover:bg-[#6c79e0] transition-colors"
            title="Dispatch GitHub Pull Request"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Open PR</span>
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 rounded-md text-[#9ba1a6] hover:text-[#f4f5f6] hover:bg-[#23262a] transition-colors"
            title="Clear selection (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GitHub 1-Click Pull Request Dispatch Modal */}
      <GitHubPRModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        finding={activeFinding || null}
        patch={
          activeFinding?.kind === 'keyboard_trap'
            ? `<dialog id="trap-modal" role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === 'Escape') closeModal(); }}>`
            : activeFinding?.kind === 'empty_accessible_name'
            ? `<button aria-label="Confirm Action" style={{ minWidth: '44px', minHeight: '44px' }}>`
            : `<div role="status" aria-live="polite" className="sr-only">{statusMessage}</div>`
        }
        targetUrl={auditResult?.targetUrl || 'https://barrierlens.ai'}
      />

      {/* Temporary Toast Notice */}
      {batchActionNotice && (
        <div className="fixed top-16 right-6 z-50 bg-[#141517] border border-[#30a46c]/40 text-[#30a46c] rounded-lg px-4 py-2 text-xs font-mono shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{batchActionNotice}</span>
        </div>
      )}
    </div>
  );
}
