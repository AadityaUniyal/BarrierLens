'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ScreenId } from '@/components/apple/Navbar';
import { CommandPalette } from '@/components/apple/CommandPalette';
import { PulseDashboard } from '@/components/apple/PulseDashboard';
import { VaultAdminView } from '@/components/apple/VaultAdminView';
import { ComposeView } from '@/components/apple/ComposeView';
import { TraceTheater } from '@/components/apple/TraceTheater';
import { ExecutiveReport } from '@/components/apple/ExecutiveReport';
import { FocusMapView } from '@/components/apple/FocusMapView';
import { ScreenReaderTranscript } from '@/components/apple/ScreenReaderTranscript';
import { TrendsView } from '@/components/apple/TrendsView';
import { ReviewQueueView } from '@/components/apple/ReviewQueueView';
import { PublicScorecardView } from '@/components/apple/PublicScorecardView';
import { BarrierGenomeViz } from '@/components/apple/BarrierGenomeViz';
import { CausalDiffView } from '@/components/apple/CausalDiffView';
import { StressTestDashboard } from '@/components/apple/StressTestDashboard';
import { MultiAgentMeshView } from '@/components/apple/MultiAgentMeshView';
import { AWSBridgeConsole } from '@/components/apple/AWSBridgeConsole';
import { LiveMissionControl } from '@/components/apple/LiveMissionControl';
import { VisualTwinSimulator } from '@/components/apple/VisualTwinSimulator';
import { LandingStory } from '@/components/apple/LandingStory';
import { AppleAuthModal, UserSession } from '@/components/apple/AppleAuthModal';
import { AuditRun, BarrierFinding, PersonaType, VerifiedFixResult } from '@/lib/barrierlens/types';

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('pulse');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Authenticated User Session (Defaults to active Cupertino engineer session)
  const [userSession, setUserSession] = useState<UserSession | null>({
    id: 'usr_apple_9841',
    name: 'Sarah Chen',
    email: 'sarah.chen@apple-id.corp',
    authMethod: 'apple_passkey',
    organization: 'Cupertino Design Systems',
    role: 'Staff Frontend Engineer',
    awsRegion: 'us-east-1 (N. Virginia)',
    bedrockQuota: '1,000,000 tokens/hr (Enterprise Tier)',
    verifiedAt: '10:45 AM'
  });

  // Audit parameters
  const [targetUrl, setTargetUrl] = useState('/benchmark');
  const [shareUrl, setShareUrl] = useState('');
  const [goal, setGoal] = useState('Subscribe to newsletter and test confirmation modal');
  const [persona, setPersona] = useState<PersonaType>('keyboard');
  const [maxSteps, setMaxSteps] = useState(8);
  const [isAuditing, setIsAuditing] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [streamingStep, setStreamingStep] = useState<number>(0);

  // Active run & verification state
  const [auditResult, setAuditResult] = useState<AuditRun | null>(null);
  const [verifyingFindingId, setVerifyingFindingId] = useState<string | null>(null);
  const [verifiedFixes, setVerifiedFixes] = useState<Record<string, VerifiedFixResult>>({});

  // Neon DB runs history & health
  const [runsHistory, setRunsHistory] = useState<any[]>([]);
  const [servicesHealth, setServicesHealth] = useState({ operational: 7, total: 7 });

  useEffect(() => {
    if (typeof window !== 'undefined' && targetUrl === '/benchmark') {
      setTargetUrl(`${window.location.origin}/benchmark`);
    }
  }, [targetUrl]);

  // Initial data load
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setServicesHealth({
          operational: data.audit?.available ? 1 : 0,
          total: 1,
        });
      })
      .catch(() => {});

    fetch('/api/runs/list')
      .then(res => res.json())
      .then(data => {
        setRunsHistory(data.runs || []);
      })
      .catch(() => {});
  }, []);

  // Run Task Audit with SSE Live Streaming (/api/audit/stream)
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setStreamingStatus('Initializing Chromium CDP session and Accessibility domain...');
    setStreamingStep(0);

    try {
      const response = await fetch('/api/audit/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, goal, persona, maxSteps })
      });

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const accumulatedSteps: any[] = [];
      const accumulatedFindings: any[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;
          const match = rawEvent.match(/^data:\s*(.+)$/m);
          if (!match) continue;

          try {
            const data = JSON.parse(match[1]);

            if (data.type === 'status') {
              setStreamingStatus(data.message);
            } else if (data.type === 'step') {
              setStreamingStep(data.step.idx);
              setStreamingStatus(`Step ${data.step.idx}: Persona ${data.step.persona} -> ${data.step.actionType}`);
              accumulatedSteps.push(data.step);
            } else if (data.type === 'finding') {
              accumulatedFindings.push(data.finding);
            } else if (data.type === 'complete') {
              setAuditResult(data.auditRun);
              setShareUrl(data.shareUrl || '');
              if (data.auditRun?.findings) {
                setRunsHistory(prev => [data.auditRun, ...prev]);
              }
            }
          } catch (parseErr) {
            console.error('Error parsing SSE message', parseErr);
          }
        }
      }
    } catch (err) {
      console.warn('Streaming failed, attempting fallback API', err);
      try {
        const fallbackRes = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl, goal, persona, maxSteps })
        });
        const fallbackData = await fallbackRes.json();
        setAuditResult(fallbackData.auditRun);
        setShareUrl(fallbackData.shareUrl || '');
      } catch (fallbackErr) {
        console.error('Audit run failed', fallbackErr);
      }
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

  // STRICT ACCESS BARRIER: Unauthenticated users only see the Story Landing Page
  if (!userSession) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col font-sans selection:bg-[#0071e3] selection:text-white">
        <Navbar
          activeScreen="story"
          setActiveScreen={setActiveScreen}
          openPalette={() => setIsPaletteOpen(true)}
          servicesCount={servicesHealth}
          userSession={null}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <AppleAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentSession={null}
          onAuthenticate={(session) => {
            setUserSession(session);
            setActiveScreen('pulse');
          }}
          onSignOut={() => setUserSession(null)}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <LandingStory
            onEnterStudio={() => setIsAuthModalOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        </main>
        <footer className="border-t border-white/[0.06] py-6 px-6 text-center text-xs text-[#6e6e73]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>BarrierLens Inc. — Designed with Apple Precision</span>
            <span className="font-mono text-[11px]">EAA Directive (EU) 2019/882 & WCAG 2.2 Ready</span>
          </div>
        </footer>
      </div>
    );
  }

  // PROTECTED APP WORKSPACE: Authenticated user experience
  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col font-sans selection:bg-[#0071e3] selection:text-white">
      {/* 1. Sticky Apple Glass Navbar */}
      <Navbar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        openPalette={() => setIsPaletteOpen(true)}
        servicesCount={servicesHealth}
        userSession={userSession}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 2. Apple Passkey & Enterprise IAM Auth Sheet */}
      <AppleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentSession={userSession}
        onAuthenticate={(session) => setUserSession(session)}
        onSignOut={() => setUserSession(null)}
      />

      {/* 3. Global Spotlight Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectScreen={setActiveScreen}
        onRunAudit={handleRunAudit}
      />

      {/* 4. Main Protected Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Pulse: Apple Watch Circular Activity Rings & Overview */}
        {activeScreen === 'pulse' && (
          <PulseDashboard
            runsHistory={runsHistory}
            latestRun={auditResult}
            onOpenInspector={() => setActiveScreen('inspector')}
            onOpenRemedy={() => setActiveScreen('remedy')}
            onOpenGenome={() => setActiveScreen('genome')}
            onOpenVault={() => setActiveScreen('vault')}
            onRunQuickAudit={handleRunAudit}
            isAuditing={isAuditing}
          />
        )}

        {/* Inspector: Autonomous Physical Task Auditor */}
        {activeScreen === 'inspector' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <LiveMissionControl
              onOpenGenome={() => setActiveScreen('genome')}
              onOpenCausalDiff={() => setActiveScreen('remedy')}
              onOpenAwsConsole={() => setActiveScreen('aws-bridge')}
              onOpenVisualTwin={() => setActiveScreen('visual-twin')}
            />

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
              streamingStatus={streamingStatus}
              streamingStep={streamingStep}
            />

            {shareUrl && (
              <div className="apple-vibrancy-regular rounded-2xl p-4 border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wide">Share this run</p>
                  <p className="text-[13px] font-mono text-[#f5f5f7] break-all">{shareUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-sm border-hairline hover:bg-white/16"
                >
                  Copy link
                </button>
              </div>
            )}

            {auditResult && (
              <TraceTheater
                steps={auditResult.steps}
                findings={auditResult.findings}
                targetUrl={targetUrl}
              />
            )}

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

        {/* Remedy: Causal AST Repair & Headless Replay Verifier */}
        {activeScreen === 'remedy' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <CausalDiffView />
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

        {/* Genome: 768-dim Vector Intelligence Map */}
        {activeScreen === 'genome' && (
          <BarrierGenomeViz />
        )}

        {/* Arena: Red-Team Adversarial Stress Arena */}
        {activeScreen === 'arena' && (
          <StressTestDashboard />
        )}

        {/* Vault: Dedicated Admin & Policy Console */}
        {activeScreen === 'vault' && (
          <VaultAdminView
            userSession={userSession}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Secondary Deep Diagnostics */}
        {activeScreen === 'visual-twin' && <VisualTwinSimulator />}
        {activeScreen === 'multi-agent' && <MultiAgentMeshView />}
        {activeScreen === 'aws-bridge' && <AWSBridgeConsole />}
        {activeScreen === 'focus-map' && (
          <FocusMapView
            kendallTau={auditResult?.kendallTau}
            trapCertificate={auditResult?.findings?.find(f => f.certificate)?.certificate}
            trapCertificates={auditResult?.findings?.filter(f => f.certificate).map(f => f.certificate!) || []}
          />
        )}
        {activeScreen === 'screen-reader' && <ScreenReaderTranscript />}
        {activeScreen === 'trends' && <TrendsView runs={runsHistory} />}
        {activeScreen === 'scorecard' && <PublicScorecardView auditRun={auditResult} />}
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
