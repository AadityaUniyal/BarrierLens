'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ScreenId } from '@/components/apple/Navbar';
import { CommandPalette } from '@/components/apple/CommandPalette';
import { PulseDashboard } from '@/components/apple/PulseDashboard';
import { VaultAdminView } from '@/components/apple/VaultAdminView';
import { WebsitesManagerView } from '@/components/apple/WebsitesManagerView';
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
import { authClient } from '@/lib/auth-client';
import { AuditRun, BarrierFinding, PersonaType, VerifiedFixResult } from '@/lib/barrierlens/types';

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('pulse');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Authenticated User Session (Starts as null; loaded from real session or demo selection)
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Load real session on mount
  useEffect(() => {
    async function loadActiveSession() {
      try {
        const sessionRes = await authClient.getSession();
        if (sessionRes?.data?.user) {
          const user = sessionRes.data.user;
          setUserSession({
            id: user.id,
            name: user.name || user.email?.split('@')[0] || 'Authenticated User',
            email: user.email || 'user@barrierlens.com',
            authMethod: 'session',
            organization: 'Personal Workspace',
            role: 'Auditor',
            awsRegion: 'us-east-1',
            bedrockQuota: 'Standard Tier',
            verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setActiveScreen('pulse');
        }
      } catch (err) {
        console.warn('Session check note:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }
    loadActiveSession();
  }, []);

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
  const [selectedFindingForRemedy, setSelectedFindingForRemedy] = useState<BarrierFinding | null>(null);
  const [historicalFindings, setHistoricalFindings] = useState<BarrierFinding[]>([]);
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
        if (data.findings && data.findings.length > 0) {
          const mapped: BarrierFinding[] = data.findings.map((f: any) => ({
            id: f.id,
            runId: f.run_id,
            stepIdx: 1,
            kind: f.kind,
            trustTier: (f.trust_tier === 'observed' || f.trust_tier === 'suspected') ? f.trust_tier : 'proven',
            wcagRules: f.wcag || ['WCAG 2.1.2'],
            severity: f.severity > 8 ? 'critical' : f.severity > 5 ? 'high' : 'medium',
            severityScore: f.severity || 8.5,
            severityInterval: [f.severity_lo || 7.0, f.severity_hi || 9.5],
            title: `${f.kind.replace(/_/g, ' ').toUpperCase()} Detected`,
            summary: f.certificate?.summary || `Autonomous inspector detected ${f.kind} during user journey.`,
            evidence: f.evidence || {},
            certificate: f.certificate || undefined
          }));
          setHistoricalFindings(mapped);
          setSelectedFindingForRemedy(mapped[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleLoadBenchmarkFindings = () => {
    const samples: BarrierFinding[] = [
      {
        id: 'find_sample_trap_01',
        runId: 'run_sample_01',
        stepIdx: 3,
        kind: 'keyboard_trap',
        trustTier: 'proven',
        wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
        severity: 'critical',
        severityScore: 9.8,
        severityInterval: [9.2, 10.0],
        title: 'Focus Sink Cycle in Dialog Container',
        summary: 'Tab key navigation cannot escape modal overlay; Esc key handler missing.',
        evidence: {
          selector: '#trap-modal',
          elementHTML: '<div id="trap-modal" class="modal-card">\n  <h2>Special Confirmation</h2>\n  <button id="claim-btn">Confirm</button>\n</div>'
        }
      },
      {
        id: 'find_sample_accname_02',
        runId: 'run_sample_01',
        stepIdx: 2,
        kind: 'empty_accessible_name',
        trustTier: 'proven',
        wcagRules: ['WCAG 4.1.2 Name, Role, Value (Level A)'],
        severity: 'high',
        severityScore: 7.5,
        severityInterval: [6.8, 8.2],
        title: 'Unlabeled Dismiss Button in Drawer',
        summary: 'SVG icon button has empty accessible name in CDP accessibility tree.',
        evidence: {
          selector: 'button.close-btn',
          elementHTML: '<button class="close-btn">\n  <svg width="16" height="16"><path d="..."/></svg>\n</button>'
        }
      },
      {
        id: 'find_sample_tau_03',
        runId: 'run_sample_01',
        stepIdx: 4,
        kind: 'low_kendall_tau',
        trustTier: 'observed',
        wcagRules: ['WCAG 1.3.2 Meaningful Sequence (Level A)'],
        severity: 'medium',
        severityScore: 6.0,
        severityInterval: [5.2, 6.8],
        title: 'Reading Order Inversion Detected (Kendall τ = 0.52)',
        summary: 'Visual flow sequence diverges from DOM accessibility tree traversal order.',
        evidence: {
          selector: '.grid-container',
          elementHTML: '<div class="grid-container" style="display:flex; flex-direction:row-reverse">\n  <div>Step 1</div><div>Step 2</div>\n</div>'
        }
      }
    ];
    setHistoricalFindings(samples);
    setSelectedFindingForRemedy(samples[0]);
  };

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
        {/* 1. Overview (Pulse Dashboard with Apple Watch Activity Rings) */}
        {(activeScreen === 'overview' || activeScreen === 'pulse') && (
          <PulseDashboard
            runsHistory={runsHistory}
            latestRun={auditResult}
            onOpenInspector={() => setActiveScreen('audits')}
            onOpenRemedy={() => setActiveScreen('fixes')}
            onOpenGenome={() => setActiveScreen('genome')}
            onOpenVault={() => setActiveScreen('settings')}
            onRunQuickAudit={handleRunAudit}
            onSelectRun={(run) => {
              if (run.findings) {
                setAuditResult(run);
                setSelectedFindingForRemedy(run.findings[0] || null);
              }
              setActiveScreen('audits');
            }}
            isAuditing={isAuditing}
          />
        )}

        {/* 2. Websites (Websites & Environment Management) */}
        {activeScreen === 'websites' && (
          <WebsitesManagerView
            onStartAuditForSite={(url, siteGoal) => {
              setTargetUrl(url);
              if (siteGoal) setGoal(siteGoal);
              setActiveScreen('audits');
            }}
          />
        )}

        {/* 3. Audits (Autonomous Task Crawl, Keycaps & Live Replay) */}
        {(activeScreen === 'audits' || activeScreen === 'inspector') && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <LiveMissionControl
              onOpenGenome={() => setActiveScreen('genome')}
              onOpenCausalDiff={() => setActiveScreen('fixes')}
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

        {/* 4. Issues (Findings Intelligence & Review Queue) */}
        {(activeScreen === 'issues' || activeScreen === 'triage') && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <ReviewQueueView
              findings={auditResult?.findings?.length ? auditResult.findings : historicalFindings}
              onTriage={handleTriage}
              onRemediateFinding={(f) => {
                setSelectedFindingForRemedy(f);
                setActiveScreen('fixes');
              }}
              onLoadBenchmarkFindings={handleLoadBenchmarkFindings}
            />
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

        {/* 5. Fixes (Causal AST Repair & Headless Replay Verifier) */}
        {(activeScreen === 'fixes' || activeScreen === 'remedy') && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <CausalDiffView
              finding={selectedFindingForRemedy || auditResult?.findings?.[0] || historicalFindings?.[0] || null}
              allFindings={auditResult?.findings?.length ? auditResult.findings : historicalFindings}
              onSelectFinding={(f) => setSelectedFindingForRemedy(f)}
              targetUrl={targetUrl}
              onFixVerified={(findingId, result) => {
                setVerifiedFixes(prev => ({ ...prev, [findingId]: result }));
                if (auditResult) {
                  setAuditResult({
                    ...auditResult,
                    findings: auditResult.findings.map(f => f.id === findingId ? { ...f, verifiedFix: true } : f)
                  });
                }
                setHistoricalFindings(prev => prev.map(f => f.id === findingId ? { ...f, verifiedFix: true } : f));
              }}
            />
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

        {/* 6. Reports (Executive Summary, Scorecards & Compliance Dossiers) */}
        {(activeScreen === 'reports' || activeScreen === 'scorecard') && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {auditResult ? (
              <ExecutiveReport
                auditRun={auditResult}
                onVerifyRepair={handleVerifyRepair}
                verifyingFindingId={verifyingFindingId}
                verifiedFixes={verifiedFixes}
              />
            ) : (
              <div className="apple-vibrancy-regular rounded-3xl p-8 border-hairline text-center space-y-3">
                <h3 className="text-lg font-semibold text-[#f5f5f7]">No Audit Selected for Reporting</h3>
                <p className="text-[13px] text-[#86868b] max-w-md mx-auto">
                  Run an audit in the Audits tab or select a previous run from the Overview to generate executive and engineering compliance reports.
                </p>
                <button
                  onClick={() => setActiveScreen('audits')}
                  className="px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] transition-all"
                >
                  Go to Audits
                </button>
              </div>
            )}
            <TrendsView runs={runsHistory} />
            <PublicScorecardView auditRun={auditResult} />
          </div>
        )}

        {/* 7. Settings (Dedicated Admin, Team RBAC, API Keys, Webhooks) */}
        {(activeScreen === 'settings' || activeScreen === 'vault') && (
          <VaultAdminView
            userSession={userSession}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Specialist Diagnostic Sub-Views */}
        {activeScreen === 'genome' && <BarrierGenomeViz />}
        {activeScreen === 'arena' && <StressTestDashboard />}
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
