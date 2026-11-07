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
  GitPullRequest
} from 'lucide-react';
import { BarrierFinding, AuditRun, VerifiedFixResult } from '@/lib/barrierlens/types';
import { FocusMapView } from './FocusMapView';
import { ScreenReaderTranscript, SpeechTranscriptItem } from './ScreenReaderTranscript';
import { BarrierGenomeViz } from './BarrierGenomeViz';
import { CausalDiffView } from './CausalDiffView';
import { GitHubPRModal } from './GitHubPRModal';

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

  // Active Deep-Inspection Tab: focus-map | speech | genome | causal-diff
  const [inspectionTab, setInspectionTab] = useState<'focus-map' | 'speech' | 'genome' | 'causal-diff'>('focus-map');

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
      // Ignore if user is inside an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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
          <p className="text-xs text-[#9ba1a6]">
            Every barrier classified by mathematical certainty tier. Press <kbd className="px-1 py-0.2 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-[#9ba1a6]">J</kbd> / <kbd className="px-1 py-0.2 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-[#9ba1a6]">K</kbd> to navigate, <kbd className="px-1 py-0.2 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-[#9ba1a6]">X</kbd> to select.
          </p>
        </div>

        {/* Trust Tier Filter Segmented Control */}
        <div className="flex items-center bg-[#0c0d0e] p-1 rounded-lg border border-[#23262a]">
          {(['all', 'proven', 'observed', 'suspected'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filterTier === tier
                  ? 'bg-[#1f2226] text-[#f4f5f6] border border-[#34383f]'
                  : 'text-[#9ba1a6] hover:text-[#f4f5f6] border border-transparent'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
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
              <div className="p-8 rounded-xl bg-[#141517] border border-[#23262a] text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-[#30a46c] mx-auto opacity-70" />
                <p className="text-xs text-[#9ba1a6]">No findings matching current filter tier.</p>
                <button
                  type="button"
                  onClick={onLoadBenchmarkFindings}
                  className="px-4 py-2 rounded-lg bg-[#f4f5f6] text-[#0c0d0e] text-xs font-semibold hover:bg-white transition-all"
                >
                  Load Benchmark Sample Proofs
                </button>
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
                    className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 relative cursor-pointer ${
                      isActive
                        ? 'bg-[#1a1c22] border-[#5e6ad2] shadow-md ring-1 ring-[#5e6ad2]/30'
                        : isChecked
                        ? 'bg-[#181a1f] border-[#3d4250]'
                        : 'bg-[#141517] border-[#23262a] hover:bg-[#181a1d] hover:border-[#34383e]'
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
                            <Square className="w-4 h-4 text-[#5a626a] hover:text-[#9ba1a6]" />
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
            <div className="rounded-xl bg-[#141517] border border-[#23262a] p-6 shadow-xl space-y-6">
              
              {/* Active Finding Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#23262a]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b7280]">
                      Deep Proof Inspector
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
                    <span className="text-[11px] font-mono text-[#5e6ad2]">
                      {activeFinding.kind}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#f4f5f6]">
                    {activeFinding.title || activeFinding.kind}
                  </h3>
                </div>

                {/* Actions: Verify Fix & Dispatch PR */}
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    disabled={verifyingFindingId === activeFinding.id}
                    onClick={() => onVerifyRepair(activeFinding)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#30a46c] hover:bg-[#2b9a66] text-[#0c0d0e] text-xs font-bold transition-all shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{verifyingFindingId === activeFinding.id ? 'Replaying...' : 'Verify Fix (V)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPRModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] border border-[#282c32] text-xs font-medium text-[#f4f5f6] transition-colors"
                    title="Dispatch 1-Click Remediation Pull Request"
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    <span>Dispatch PR</span>
                  </button>
                </div>
              </div>

              {/* Segmented Diagnostic Tabs */}
              <div className="flex items-center bg-[#0c0d0e] p-1 rounded-lg border border-[#23262a] overflow-x-auto">
                {[
                  { id: 'focus-map', label: 'Tarjan Proof', icon: Terminal },
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
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#1f2226] text-[#f4f5f6] border border-[#34383e]'
                          : 'text-[#9ba1a6] hover:text-[#f4f5f6] border border-transparent'
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
                    kendallTau={auditResult?.kendallTau}
                    trapCertificate={activeFinding.certificate}
                    trapCertificates={activeFinding.certificate ? [activeFinding.certificate] : []}
                  />
                )}

                {inspectionTab === 'speech' && (
                  <ScreenReaderTranscript />
                )}

                {inspectionTab === 'genome' && (
                  <BarrierGenomeViz />
                )}

                {inspectionTab === 'causal-diff' && (
                  <CausalDiffView
                    finding={activeFinding}
                    allFindings={findings}
                    onSelectFinding={onSelectFinding}
                    onFixVerified={(id, res) => onVerifyRepair(activeFinding)}
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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-[#181a1d] border border-[#34383f] rounded-xl px-4 py-2.5 shadow-2xl shadow-black/80 flex items-center gap-4 text-xs animate-in slide-in-from-bottom-3 duration-150">
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
