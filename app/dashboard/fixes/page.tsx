'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GitPullRequest, Play, CheckCircle2, Code2, AlertTriangle } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

function FixesInner() {
  const searchParams = useSearchParams();
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [findings, setFindings] = useState<any[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [patchResult, setPatchResult] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [repo, setRepo] = useState('owner/repo');
  const [prStatus, setPrStatus] = useState<string | null>(null);
  const [loadingPatch, setLoadingPatch] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch('/api/runs/list')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.runs) ? d.runs : [];
        setRuns(list);
        const paramRun = searchParams.get('runId');
        setSelectedRunId(paramRun || list[0]?.id || '');
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (!selectedRunId) return;
    fetch(`/api/runs/${selectedRunId}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.findings) ? d.findings : [];
        setFindings(list);
        const paramFinding = searchParams.get('findingId');
        const match = list.find((f: any) => f.id === paramFinding) || list[0] || null;
        setSelectedFinding(match);
      })
      .catch(() => {});
  }, [selectedRunId, searchParams]);

  const synthesizePatch = async () => {
    if (!selectedFinding) return;
    setLoadingPatch(true);
    setPatchResult(null);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/repair/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding: selectedFinding }),
      });
      const data = await res.json();
      setPatchResult(data);
    } finally {
      setLoadingPatch(false);
    }
  };

  const verifyReplay = async () => {
    if (!selectedFinding) return;
    setVerifying(true);
    setVerifyResult(null);
    const activeRun = runs.find((r) => r.id === selectedRunId);
    try {
      const res = await fetch('/api/repair/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: activeRun?.target_url || '/benchmark',
          findingId: selectedFinding.id,
          findingKind: selectedFinding.kind,
          patch: patchResult?.unifiedDiff || 'role="dialog" aria-modal="true"',
          selector: selectedFinding.evidence?.selector,
        }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } finally {
      setVerifying(false);
    }
  };

  const dispatchPR = async () => {
    if (!patchResult?.unifiedDiff) return;
    setPrStatus('Dispatching PR...');
    try {
      const res = await fetch('/api/integrations/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          branch: 'main',
          findingId: selectedFinding?.id,
          unifiedDiff: patchResult.unifiedDiff,
        }),
      });
      const data = await res.json();
      setPrStatus(data.prUrl ? `PR created: ${data.prUrl}` : data.message || data.error || 'Done');
    } catch (err: any) {
      setPrStatus(err?.message || 'PR dispatch failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
            parse5 AST Surgery &amp; Differential Replay
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Fixes &amp; PRs</h1>
        </div>
        <select
          aria-label="Select finding"
          value={selectedFinding?.id || ''}
          onChange={(e) => setSelectedFinding(findings.find((f) => f.id === e.target.value) || null)}
          className="px-3.5 py-2 rounded-xl bg-[#0b0d13] border border-white/[0.1] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
        >
          {findings.length === 0 && <option value="">No findings available</option>}
          {findings.map((f) => (
            <option key={f.id} value={f.id}>
              {f.kind} ({f.id.slice(0, 8)})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SpotlightCard className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#0090ff]" />
              <span>Unified AST Patch</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!selectedFinding || loadingPatch}
                onClick={synthesizePatch}
                className="px-3.5 py-2 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-semibold text-white disabled:opacity-50"
              >
                {loadingPatch ? 'Synthesizing...' : 'Synthesize AST Patch'}
              </button>
              <button
                type="button"
                disabled={!selectedFinding || verifying}
                onClick={verifyReplay}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-white disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{verifying ? 'Replaying...' : 'Verify via Replay'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-slate-300 overflow-x-auto min-h-[180px]">
            {patchResult?.unifiedDiff || 'Select a finding and click "Synthesize AST Patch" to generate a parse5-verified unified diff.'}
          </pre>

          {verifyResult && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                verifyResult.verified
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {verifyResult.verified ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{verifyResult.verified ? 'Patch Verified in Headless Chromium' : 'Verification Failed'}</p>
                <p className="mt-0.5 opacity-90">{verifyResult.diffSummary || verifyResult.error}</p>
              </div>
            </div>
          )}
        </SpotlightCard>

        <SpotlightCard className="lg:col-span-4 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
            <span>Dispatch GitHub PR</span>
          </h2>
          <div>
            <label htmlFor="pr-repo" className="block text-[11px] font-mono text-slate-400 mb-1">
              Target Repository (owner/repo)
            </label>
            <input
              id="pr-repo"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
            />
          </div>
          <button
            type="button"
            disabled={!patchResult?.unifiedDiff}
            onClick={dispatchPR}
            className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-semibold disabled:opacity-40"
          >
            Open Pull Request
          </button>
          {prStatus && (
            <p className="text-xs font-mono text-slate-300 break-all">{prStatus}</p>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}

export default function FixesPage() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-400">Loading Fixes...</div>}>
      <FixesInner />
    </Suspense>
  );
}
