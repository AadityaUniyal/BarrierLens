'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, CheckCircle2, GitPullRequest, GitBranch } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

function IssuesInner() {
  const searchParams = useSearchParams();
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [findings, setFindings] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [triageStatus, setTriageStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/runs/list')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.runs) ? d.runs : [];
        setRuns(list);
        const paramId = searchParams.get('runId');
        const initialId = paramId || list[0]?.id || '';
        if (initialId) setSelectedRunId(initialId);
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (!selectedRunId) return;
    fetch(`/api/runs/${selectedRunId}`)
      .then((r) => r.json())
      .then((d) => {
        setFindings(Array.isArray(d?.findings) ? d.findings : []);
        setSelectedIdx(0);
      })
      .catch(() => setFindings([]));
  }, [selectedRunId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
      if (findings.length === 0) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % findings.length);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + findings.length) % findings.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [findings]);

  const activeFinding = findings[selectedIdx];

  const handleTriage = async (findingId: string, label: 'confirmed' | 'false_positive') => {
    setTriageStatus((prev) => ({ ...prev, [findingId]: 'saving' }));
    try {
      await fetch('/api/findings/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, label }),
      });
      setTriageStatus((prev) => ({ ...prev, [findingId]: label }));
    } catch {
      setTriageStatus((prev) => ({ ...prev, [findingId]: 'error' }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
            Master-Detail Proof Inspector
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Issues &amp; Proofs</h1>
        </div>

        <select
          aria-label="Select audit run"
          value={selectedRunId}
          onChange={(e) => setSelectedRunId(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-[#0b0d13] border border-white/[0.1] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
        >
          {runs.length === 0 && <option value="">No persisted runs</option>}
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.target_url} ({r.findings_count ?? 0} findings)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SpotlightCard className="lg:col-span-5 p-4 space-y-2">
          <p className="text-[11px] font-mono text-slate-400 px-2 pb-1">
            Findings ({findings.length})
          </p>
          {findings.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No findings recorded for this run.</p>
          ) : (
            findings.map((f, idx) => {
              const active = idx === selectedIdx;
              return (
                <button
                  key={f.id || idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    active
                      ? 'bg-[#0090ff]/12 border-[#0090ff]/40 text-white'
                      : 'bg-[#07080b] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{f.kind}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300">
                      {f.severity ?? 'high'}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                    {Array.isArray(f.wcag) ? f.wcag.join(', ') : 'WCAG 2.2'}
                  </p>
                </button>
              );
            })
          )}
        </SpotlightCard>

        <SpotlightCard className="lg:col-span-7 p-6 space-y-5">
          {!activeFinding ? (
            <p className="text-xs text-slate-400 py-12 text-center">Select a finding to inspect its mathematical proof.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#0090ff]">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>{activeFinding.trust_tier || 'proven'}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-white mt-1">{activeFinding.kind}</h2>
                </div>
                <Link
                  href={`/dashboard/fixes?runId=${selectedRunId}&findingId=${activeFinding.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-semibold text-white transition-colors shrink-0"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Fix &amp; Verify</span>
                </Link>
              </div>

              {activeFinding.certificate && (
                <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08] space-y-2">
                  <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Mathematical Proof Certificate</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    {activeFinding.certificate.proofExplanation || 'Cycle detected in focus graph.'}
                  </p>
                  {Array.isArray(activeFinding.certificate.keySequence) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeFinding.certificate.keySequence.map((k: string, i: number) => (
                        <kbd key={i} className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono text-[10px] text-slate-200">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeFinding.evidence && (
                <pre className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08] text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(activeFinding.evidence, null, 2)}
                </pre>
              )}

              <div className="flex items-center gap-2.5 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleTriage(activeFinding.id, 'confirmed')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs text-emerald-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Barrier</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriage(activeFinding.id, 'false_positive')}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300"
                >
                  Mark False Positive
                </button>
                {triageStatus[activeFinding.id] && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Status: {triageStatus[activeFinding.id]}
                  </span>
                )}
              </div>
            </>
          )}
        </SpotlightCard>
      </div>

      {/* Keyboard-first Hotkeys HUD */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-[#0b0d13]/90 backdrop-blur-md border border-white/[0.1] text-[11px] font-mono text-slate-400 shadow-xl">
        <span><kbd className="text-white">j/k</kbd> navigate</span>
        <span><kbd className="text-white">⌘K</kbd> palette</span>
        <span><kbd className="text-white">1-6</kbd> switch tab</span>
      </div>
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-400">Loading Issues...</div>}>
      <IssuesInner />
    </Suspense>
  );
}
