'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ScreenId } from '@/components/apple/Navbar';
import { CommandPalette } from '@/components/apple/CommandPalette';
import { ComposeView } from '@/components/apple/ComposeView';
import { TraceTheater } from '@/components/apple/TraceTheater';
import { ExecutiveReport } from '@/components/apple/ExecutiveReport';
import { FocusMapView } from '@/components/apple/FocusMapView';
import { ScreenReaderTranscript } from '@/components/apple/ScreenReaderTranscript';
import { TrendsView } from '@/components/apple/TrendsView';
import { ReviewQueueView } from '@/components/apple/ReviewQueueView';
import { PublicScorecardView } from '@/components/apple/PublicScorecardView';
import { AuditRun, BarrierFinding, PersonaType, VerifiedFixResult } from '@/lib/barrierlens/types';

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('studio');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Audit parameters
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000/benchmark');
  const [goal, setGoal] = useState('Subscribe to newsletter and test confirmation modal');
  const [persona, setPersona] = useState<PersonaType>('keyboard');
  const [maxSteps, setMaxSteps] = useState(8);
  const [isAuditing, setIsAuditing] = useState(false);

  // Active run & verification state
  const [auditResult, setAuditResult] = useState<AuditRun | null>(null);
  const [verifyingFindingId, setVerifyingFindingId] = useState<string | null>(null);
  const [verifiedFixes, setVerifiedFixes] = useState<Record<string, VerifiedFixResult>>({});

  // Neon DB runs history & health
  const [runsHistory, setRunsHistory] = useState<any[]>([]);
  const [servicesHealth, setServicesHealth] = useState({ operational: 7, total: 7 });

  // Initial data load
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        const total = data.services?.length || 7;
        const op = data.services?.filter((s: any) => s.status === 'operational').length || total;
        setServicesHealth({ operational: op, total });
      })
      .catch(() => {});

    fetch('/api/runs/list')
      .then(res => res.json())
      .then(data => {
        setRunsHistory(data.runs || []);
      })
      .catch(() => {});
  }, []);

  // Run Task Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, goal, persona, maxSteps })
      });
      const data = await res.json();
      setAuditResult(data);
      // Refresh run history
      fetch('/api/runs/list')
        .then(r => r.json())
        .then(d => setRunsHistory(d.runs || []));
    } catch (err) {
      console.error('Audit run failed', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Verify Surgical Repair Replay
  const handleVerifyRepair = async (finding: BarrierFinding) => {
    setVerifyingFindingId(finding.id);
    try {
      const res = await fetch('/api/repair/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          findingId: finding.id,
          findingKind: finding.kind,
          patch: 'aria-modal="true" role="dialog" onKeyDown={handleEsc}'
        })
      });
      const data: VerifiedFixResult = await res.json();
      setVerifiedFixes(prev => ({ ...prev, [finding.id]: data }));
    } catch (err) {
      console.error('Repair verification error', err);
    } finally {
      setVerifyingFindingId(null);
    }
  };

  // Triage Action (Active Learning M6)
  const handleTriage = async (findingId: string, label: 'accepted' | 'rejected') => {
    try {
      await fetch('/api/findings/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, label })
      });
    } catch (err) {
      console.error('Triage error', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col font-sans selection:bg-[#0071e3] selection:text-white">
      {/* 1. Sticky Apple Glass Navbar */}
      <Navbar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        openPalette={() => setIsPaletteOpen(true)}
        servicesCount={servicesHealth}
      />

      {/* 2. Global Spotlight Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectScreen={setActiveScreen}
        onRunAudit={handleRunAudit}
      />

      {/* 3. Main Screen Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {activeScreen === 'studio' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Compose Console */}
            <ComposeView
              targetUrl={targetUrl}
              setTargetUrl={setTargetUrl}
              goal={goal}
              setGoal={setGoal}
              persona={persona}
              setPersona={setPersona}
              maxSteps={maxSteps}
              setMaxSteps={setMaxSteps}
              isAuditing={isAuditing}
              onRunAudit={handleRunAudit}
            />

            {/* Trace Theater (Live Replay & Keycaps) */}
            {auditResult && (
              <TraceTheater
                steps={auditResult.steps}
                findings={auditResult.findings}
                targetUrl={targetUrl}
              />
            )}

            {/* Executive Report & Barrier Inspector */}
            {auditResult && (
              <ExecutiveReport
                auditRun={auditResult}
                onVerifyRepair={handleVerifyRepair}
                verifyingFindingId={verifyingFindingId}
                verifiedFixes={verifiedFixes}
              />
            )}
          </div>
        )}

        {activeScreen === 'focus-map' && (
          <FocusMapView
            kendallTau={auditResult?.kendallTau}
            trapCertificate={auditResult?.findings?.find(f => f.certificate)?.certificate}
          />
        )}

        {activeScreen === 'screen-reader' && (
          <ScreenReaderTranscript />
        )}

        {activeScreen === 'trends' && (
          <TrendsView runs={runsHistory} />
        )}

        {activeScreen === 'triage' && (
          <ReviewQueueView
            findings={auditResult?.findings || []}
            onTriage={handleTriage}
          />
        )}

        {activeScreen === 'scorecard' && (
          <PublicScorecardView auditRun={auditResult} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 px-6 text-center text-xs text-[#6e6e73]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BarrierLens Inc. — Advanced Agentic Accessibility Verification</span>
          <span className="font-mono text-[11px]">European Accessibility Act (EAA) & WCAG 2.2 Ready</span>
        </div>
      </footer>
    </div>
  );
}
