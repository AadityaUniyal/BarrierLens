'use client';

import React, { useState } from 'react';
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
  Code2
} from 'lucide-react';
import { BarrierFinding, AuditRun, VerifiedFixResult } from '@/lib/barrierlens/types';
import { FocusMapView } from './FocusMapView';
import { ScreenReaderTranscript, SpeechTranscriptItem } from './ScreenReaderTranscript';
import { BarrierGenomeViz } from './BarrierGenomeViz';
import { CausalDiffView } from './CausalDiffView';

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

  const filteredFindings = findings.filter(f => {
    if (filterTier === 'all') return true;
    return f.trustTier === filterTier;
  });

  const activeFinding = selectedFinding || filteredFindings[0] || null;

  return (
    <div className="space-y-6 text-[#f4f5f6]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141517] border border-[#23262a] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f76808]" />
            <h2 className="text-xl font-bold tracking-tight text-[#f4f5f6]">
              Evidence & Mathematical Proofs
            </h2>
          </div>
          <p className="text-xs text-[#9ba1a6]">
            Every barrier classified by mathematical certainty tier. Zero false accusations.
          </p>
        </div>

        {/* Trust Tier Filter Segmented Control */}
        <div className="flex items-center bg-[#0c0d0e] p-1 rounded-lg border border-[#23262a]">
          {(['all', 'proven', 'observed', 'suspected'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                filterTier === tier
                  ? 'bg-[#1f2226] text-[#f4f5f6] shadow-sm border border-[#34383e]'
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
            <span>Discovered Barriers ({filteredFindings.length})</span>
            {filteredFindings.length === 0 && (
              <button
                type="button"
                onClick={onLoadBenchmarkFindings}
                className="text-[#0090ff] hover:underline"
              >
                Load Benchmark Set
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredFindings.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#141517] border border-[#23262a] text-center space-y-3">
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
                const isSelected = activeFinding?.id === finding.id;
                const isVerified = verifiedFixes[finding.id]?.verified || finding.verifiedFix;

                return (
                  <button
                    key={finding.id}
                    type="button"
                    onClick={() => onSelectFinding(finding)}
                    className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 relative ${
                      isSelected
                        ? 'bg-[#1f2226] border-[#0090ff] shadow-md'
                        : 'bg-[#141517] border-[#23262a] hover:bg-[#181a1d] hover:border-[#34383e]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Trust Tier Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          finding.trustTier === 'proven' 
                            ? 'bg-[#30a46c]/15 text-[#30a46c] border border-[#30a46c]/30'
                            : finding.trustTier === 'observed'
                            ? 'bg-[#0090ff]/15 text-[#0090ff] border border-[#0090ff]/30'
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
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-[#0090ff] translate-x-0.5' : 'text-[#6b7280]'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Cols: Deep-Inspection Split-Sheet */}
        <div className="lg:col-span-7 space-y-4">
          {activeFinding ? (
            <div className="rounded-2xl bg-[#141517] border border-[#23262a] p-6 shadow-xl space-y-6">
              
              {/* Active Finding Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#23262a]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b7280]">
                      Deep Proof Inspector
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0090ff]" />
                    <span className="text-[11px] font-mono text-[#0090ff]">
                      {activeFinding.kind}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#f4f5f6]">
                    {activeFinding.title || activeFinding.kind}
                  </h3>
                </div>

                {/* Quick Verify Fix Trigger */}
                <button
                  type="button"
                  disabled={verifyingFindingId === activeFinding.id}
                  onClick={() => onVerifyRepair(activeFinding)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#30a46c] hover:bg-[#2b9a66] text-[#0c0d0e] text-xs font-bold transition-all shadow-md self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{verifyingFindingId === activeFinding.id ? 'Replaying...' : 'Verify Fix in Sandbox'}</span>
                </button>
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
            <div className="h-[400px] rounded-2xl bg-[#141517] border border-[#23262a] flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#6b7280]">
              <AlertTriangle className="w-8 h-8 opacity-40" />
              <p className="text-xs text-[#9ba1a6]">No barrier selected for inspection.</p>
              <p className="text-[11px] text-[#6b7280]">Select a finding on the left to inspect its mathematical proof.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
