'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Compass,
  Flame,
  Play,
  ShieldAlert,
  CheckCircle2,
  Users,
  ArrowRight,
} from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

function StudioInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'stream' | 'swarm' | 'arena'>('stream');
  const [targetUrl, setTargetUrl] = useState(() => searchParams.get('url') || '/benchmark');
  const [goal, setGoal] = useState(
    () => searchParams.get('goal') || 'Navigate modal, test keyboard trap escape, and verify form labels'
  );
  const [persona, setPersona] = useState(() => searchParams.get('persona') || 'keyboard');
  const [running, setRunning] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [completedRun, setCompletedRun] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  const runAuditStream = async (urlOverride?: string, goalOverride?: string, personaOverride?: string) => {
    setRunning(true);
    setErrorMsg(null);
    setStatusLog(['Initializing Playwright Chromium & CDP session...']);
    setSteps([]);
    setFindings([]);
    setCompletedRun(null);

    let sessionCookies: any = undefined;
    try {
      const rawCookies = sessionStorage.getItem('barrierlens_launch_cookies');
      if (rawCookies) sessionCookies = JSON.parse(rawCookies);
    } catch {}

    try {
      const res = await fetch('/api/audit/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: urlOverride ?? targetUrl,
          goal: goalOverride ?? goal,
          persona: personaOverride ?? persona,
          maxSteps: 10,
          cookies: sessionCookies,
        }),
      });

      if (!res.body) throw new Error('Streaming response body unavailable');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const chunk of events) {
          const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const payload = JSON.parse(dataLine.slice(6));
            if (payload.type === 'status' && payload.message) {
              setStatusLog((prev) => [...prev.slice(-12), payload.message]);
            } else if (payload.type === 'step' && payload.step) {
              setSteps((prev) => [...prev, payload.step]);
            } else if (payload.type === 'finding' && payload.finding) {
              setFindings((prev) => [...prev, payload.finding]);
            } else if (payload.type === 'complete' && payload.auditRun) {
              setCompletedRun(payload.auditRun);
              if (Array.isArray(payload.auditRun.findings)) {
                setFindings(payload.auditRun.findings);
              }
              setStatusLog((prev) => [...prev, 'Audit completed and persisted.']);
            } else if (payload.type === 'error') {
              setErrorMsg(payload.error || 'Audit failed');
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to execute audit stream');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('auto') === '1' && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      const timer = setTimeout(() => {
        runAuditStream(
          searchParams.get('url') || '/benchmark',
          searchParams.get('goal') || 'Navigate modal, test keyboard trap escape, and verify form labels',
          searchParams.get('persona') || 'keyboard'
        );
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const runSwarm = async () => {
    setRunning(true);
    setErrorMsg(null);
    setStatusLog(['Dispatching parallel multi-persona swarm...']);
    setFindings([]);
    try {
      const res = await fetch('/api/audit/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          goal,
          personas: ['keyboard', 'screen_reader'],
          maxStepsPerPersona: 6,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Swarm execution failed');
      setFindings(data.findings || []);
      setCompletedRun({ id: data.swarmId, targetUrl, effortRatio: 1.5, taskSuccess: (data.findings || []).length === 0 });
      setStatusLog((prev) => [...prev, `Swarm completed: ${data.summary?.uniqueFindingCount ?? 0} unique barriers.`]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Swarm failed');
    } finally {
      setRunning(false);
    }
  };

  const runArena = async () => {
    setRunning(true);
    setErrorMsg(null);
    setStatusLog(['Injecting metamorphic chaos & motor-tremor perturbations...']);
    try {
      const res = await fetch('/api/adversarial/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, chaosLevel: 'moderate', maxSteps: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adversarial stress test failed');
      setStatusLog((prev) => [...prev, `Arena completed: ${JSON.stringify(data.result?.summary || data.result || 'OK')}`]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Arena failed');
    } finally {
      setRunning(false);
    }
  };

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'stream') runAuditStream();
    else if (mode === 'swarm') runSwarm();
    else runArena();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
            Autonomous Traversal Sandbox
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Audit Studio</h1>
        </div>
        <SegmentedControl
          value={mode}
          onChange={(v) => setMode(v as any)}
          options={[
            { id: 'stream', label: 'Live SSE Audit' },
            { id: 'swarm', label: 'Multi-Persona Swarm' },
            { id: 'arena', label: 'Adversarial Arena' },
          ]}
        />
      </div>

      <SpotlightCard className="p-6">
        <form onSubmit={handleRun} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label htmlFor="studio-url" className="block text-[11px] font-mono text-slate-400 mb-1">
              Target URL or Built-In Fixture
            </label>
            <input
              id="studio-url"
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
            />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="studio-goal" className="block text-[11px] font-mono text-slate-400 mb-1">
              Journey Goal
            </label>
            <input
              id="studio-goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white focus:border-[#0090ff] focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="studio-persona" className="block text-[11px] font-mono text-slate-400 mb-1">
              Persona
            </label>
            <select
              id="studio-persona"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white focus:border-[#0090ff] focus:outline-none"
            >
              <option value="keyboard">Keyboard Only</option>
              <option value="screen_reader">Screen Reader</option>
              <option value="low_vision">Low Vision</option>
              <option value="motor">Motor Tremor</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={running}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-semibold text-white transition-colors disabled:opacity-50"
            >
              {mode === 'stream' ? <Play className="w-3.5 h-3.5" /> : mode === 'swarm' ? <Users className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
              <span>{running ? 'Running...' : 'Execute'}</span>
            </button>
          </div>
        </form>
      </SpotlightCard>

      {errorMsg && (
        <div role="alert" className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpotlightCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#0090ff]" />
            <span>Execution Telemetry &amp; Steps ({steps.length})</span>
          </h2>
          <div className="p-3.5 rounded-xl bg-[#07080b] border border-white/[0.06] font-mono text-[11px] text-slate-400 space-y-1 max-h-48 overflow-y-auto">
            {statusLog.length === 0 ? (
              <p>Ready to launch headless Chromium CDP session.</p>
            ) : (
              statusLog.map((line, i) => <p key={i}>&gt; {line}</p>)
            )}
          </div>
          {steps.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {steps.map((s, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#07080b] border border-white/[0.06] text-xs flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-300 truncate">
                    Step {s.stepIdx ?? i + 1}: {s.action || s.key || 'inspect'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">{s.focusedSelector || ''}</span>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>

        <SpotlightCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Proven Findings ({findings.length})</span>
            </h2>
            {completedRun?.id && (
              <Link
                href={`/dashboard/issues?runId=${completedRun.id}`}
                className="text-xs text-[#0090ff] hover:underline inline-flex items-center gap-1"
              >
                <span>Open Proofs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {findings.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {running ? 'Traversing DOM and accessibility tree...' : 'No barriers reported yet.'}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {findings.map((f, idx) => (
                <div key={f.id || idx} className="p-3.5 rounded-xl bg-[#07080b] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{f.title || f.kind}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 uppercase">
                      {f.severity || 'high'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{f.summary}</p>
                </div>
              ))}
            </div>
          )}

          {completedRun && (
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Run Complete
              </span>
              <Link href="/dashboard/fixes" className="text-[#0090ff] hover:underline font-medium">
                Synthesize AST Patches &rarr;
              </Link>
            </div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}

export default function AuditStudioPage() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-400">Loading Audit Studio...</div>}>
      <StudioInner />
    </Suspense>
  );
}
