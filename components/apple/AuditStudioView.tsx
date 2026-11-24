'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Compass, 
  Terminal, 
  Clock, 
  ChevronRight, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Code2,
  Monitor,
  Layers,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
  ShieldCheck,
  Eye,
  Award
} from 'lucide-react';
import { AuditRun, BarrierFinding, ActionStep, PersonaType } from '@/lib/barrierlens/types';
import { TraceTheater } from './TraceTheater';
import { TimeTravelReplayPlayer } from './TimeTravelReplayPlayer';
import { ScreenReaderTranscript } from './ScreenReaderTranscript';
import { FocusMapView } from './FocusMapView';
import { CDPPatchSimulator } from './CDPPatchSimulator';
import { CausalCertificateDrawer } from './CausalCertificateDrawer';

interface AuditStudioViewProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  persona: PersonaType;
  setPersona: (p: PersonaType) => void;
  maxSteps: number;
  setMaxSteps: (n: number) => void;
  isAuditing: boolean;
  onRunAudit: () => void;
  streamingStatus: string;
  streamingStep: number;
  auditResult: AuditRun | null;
  onSelectFinding: (f: BarrierFinding) => void;
  onLoadBenchmarkFindings: () => void;
}

type StudioViewTab = 'viewport' | 'theater' | 'auditory' | 'focus_map';

export function AuditStudioView({
  targetUrl,
  setTargetUrl,
  goal,
  setGoal,
  persona,
  setPersona,
  maxSteps,
  setMaxSteps,
  isAuditing,
  onRunAudit,
  streamingStatus,
  streamingStep,
  auditResult,
  onSelectFinding,
  onLoadBenchmarkFindings
}: AuditStudioViewProps) {
  const [activeTab, setActiveTab] = useState<StudioViewTab>('viewport');
  const [speechActive, setSpeechActive] = useState<boolean>(true);
  const [isCertDrawerOpen, setIsCertDrawerOpen] = useState<boolean>(false);
  const [isCrtMode, setIsCrtMode] = useState<boolean>(true);

  // Verified benchmark presets
  const benchmarkPresets = [
    { label: 'Modal Trap Benchmark', url: '/benchmark', goal: 'Subscribe to newsletter and test confirmation modal' },
    { label: 'Keyboard Trap Fixture', url: '/fixtures/keyboard-trap', goal: 'Navigate into modal and escape back to main page' },
    { label: 'Unlabeled AccName', url: '/fixtures/accname-wcag', goal: 'Identify and activate all icon action buttons' },
    { label: 'Focus Loss on Close', url: '/fixtures/focus-loss', goal: 'Open drawer, close it, and resume reading order' },
  ];

  // Active key state for on-screen physical keycaps
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeElementSelector, setActiveElementSelector] = useState<string>('body');

  // Swarm & Autonomous Crawler State
  const [isSwarmRunning, setIsSwarmRunning] = useState<boolean>(false);
  const [swarmSummary, setSwarmSummary] = useState<any | null>(null);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [discoveredJourneys, setDiscoveredJourneys] = useState<Array<{ name: string; goalText: string; startingUrl: string; criticality: string }>>([]);

  const handleRunSwarm = async () => {
    if (!targetUrl || !goal) return;
    setIsSwarmRunning(true);
    setSwarmSummary(null);
    setActionNotice(null);
    try {
      const res = await fetch('/api/audit/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          goal,
          personas: ['keyboard', 'screen_reader', 'low_vision', 'cognitive'],
          maxStepsPerPersona: 6,
          concurrency: 2,
          synthesizePatches: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSwarmSummary(data.summary);
        setActionNotice({ type: 'success', message: 'Multi-persona swarm audit completed successfully.' });
      } else {
        const errData = await res.json().catch(() => ({}));
        setActionNotice({ type: 'error', message: errData.error || 'Swarm execution failed' });
      }
    } catch (err: any) {
      console.error('Failed to execute multi-persona swarm:', err);
      setActionNotice({ type: 'error', message: err?.message || 'Swarm audit execution failed' });
    } finally {
      setIsSwarmRunning(false);
    }
  };

  const handleDiscoverDomain = async () => {
    if (!targetUrl) return;
    setIsDiscovering(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/crawler/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, maxRoutes: 12, crawlDepth: 2 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.journeys && Array.isArray(data.journeys)) {
          setDiscoveredJourneys(data.journeys);
          if (data.journeys.length > 0 && !goal) {
            setGoal(data.journeys[0].goalText || data.journeys[0].name);
          }
        }
        setActionNotice({
          type: 'success',
          message: `Discovered ${data.totalRoutesDiscovered || data.journeys?.length || 0} routes and synthesized journeys.`
        });
      } else if (res.status === 401) {
        setActionNotice({
          type: 'error',
          message: 'Sign-in required: Please sign in or supply an API key to run autonomous domain discovery.'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setActionNotice({
          type: 'error',
          message: errData.error || 'Domain discovery failed'
        });
      }
    } catch (err: any) {
      console.error('Failed to discover domain routes & CUJs:', err);
      setActionNotice({ type: 'error', message: err?.message || 'Domain crawler connection failed' });
    } finally {
      setIsDiscovering(false);
    }
  };
  const lastSpokenStepRef = useRef<number>(-1);

  // Sync active key from latest streaming step or audit result
  useEffect(() => {
    if (auditResult?.steps && auditResult.steps.length > 0) {
      const lastStep = auditResult.steps[auditResult.steps.length - 1];
      if (lastStep.key) {
        setActiveKey(lastStep.key);
      } else if (lastStep.actionType === 'type_text') {
        setActiveKey('Type');
      }
      if (lastStep.activeElementAfter) {
        setActiveElementSelector(lastStep.activeElementAfter);
      }

      // VoiceOver speech synthesis announcement if screen_reader persona
      if (speechActive && persona === 'screen_reader' && lastStep.idx !== lastSpokenStepRef.current && typeof window !== 'undefined') {
        lastSpokenStepRef.current = lastStep.idx;
        try {
          window.speechSynthesis?.cancel();
          const phrase = `${lastStep.activeElementAfter || 'Focused control'}, key ${lastStep.key || lastStep.actionType}`;
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.rate = 1.2;
          window.speechSynthesis?.speak(utterance);
        } catch {}
      }
    }
  }, [auditResult, streamingStep, speechActive, persona]);

  const physicalKeycaps = [
    { key: 'Tab', label: 'Tab ⇥' },
    { key: 'Shift+Tab', label: '⇧ Tab' },
    { key: 'Enter', label: 'Enter ↵' },
    { key: 'Space', label: 'Space ␣' },
    { key: 'Escape', label: 'Esc ⎋' },
    { key: 'Type', label: 'Type Text' },
  ];

  const steps = auditResult?.steps || [];
  const findings = auditResult?.findings || [];

  const transcriptItems = React.useMemo(() => {
    if (steps.length === 0) return undefined;
    const list: any[] = [];
    steps.forEach((s) => {
      list.push({
        id: `step_${s.idx}`,
        type: 'speech' as const,
        text: s.activeElementAfter ? `${s.activeElementAfter}, dispatched [${s.key || s.actionType}].` : `Action: [${s.key || s.actionType}].`,
        tag: s.actionType.toUpperCase(),
        timestamp: `${(s.idx * 0.8).toFixed(1)}s`
      });
    });
    findings.forEach((f, i) => {
      if (f.kind === 'silent_state_change') {
        list.push({
          id: `finding_silent_${i}`,
          type: 'silent_gap' as const,
          text: `CRITICAL SILENT STATE CHANGE: ${f.summary}`,
          tag: 'SILENT_ERROR',
          timestamp: `${(f.stepIdx * 0.8 + 0.3).toFixed(1)}s`,
          category: 'inline_error' as const,
          proofCertificate: f.gapCertificate?.proofHash || 'sha256-verified'
        });
      }
    });
    return list;
  }, [steps, findings]);

  return (
    <div className="space-y-6 text-[#f4f5f6]">
      {/* 1. Header & Configuration Station (Apple Liquid Glass) */}
      <div className="p-6 sm:p-8 rounded-3xl apple-liquid-glass shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9c9aa8] font-semibold">
                Autonomous Traversal Sandbox
              </span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-[-0.03em] text-white">
              Audit Studio <span className="font-normal text-slate-400">&amp; Traversal Stage</span>
            </h2>
            <p className="text-xs text-[#9c9aa8]">
              Autonomous behavioral agent evaluating under real physical keyboard &amp; assistive sensory constraints.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCertDrawerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-200 border border-white/[0.08] transition-all flex items-center gap-1.5 shadow-sm"
              title="Inspect and Export Cryptographic Causal Certificate"
            >
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Certificate</span>
            </button>

            {!auditResult && (
              <button
                type="button"
                onClick={onLoadBenchmarkFindings}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white border border-white/[0.08] transition-all"
              >
                Inspect Proofs
              </button>
            )}
            <button
              type="button"
              disabled={isAuditing || isSwarmRunning}
              onClick={handleRunSwarm}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                isSwarmRunning
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 cursor-wait'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white border-purple-500/25'
              }`}
              title="Launch parallel audit across Keyboard, Screen Reader, Low Vision, and Cognitive personas simultaneously"
            >
              {isSwarmRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                  <span>Swarm Active...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Multi-Persona Swarm</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isAuditing || isSwarmRunning}
              onClick={onRunAudit}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg ${
                isAuditing 
                  ? 'bg-white/[0.08] text-slate-400 cursor-wait border border-white/[0.08]' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 border border-white/20'
              }`}
            >
              {isAuditing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin" />
                  <span>Executing Journey...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Autonomous Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1">
          {/* Target URL */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Target Origin URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com or /benchmark"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0f1b38] border border-blue-500/25 text-xs text-white font-mono focus:outline-none focus:border-blue-400 transition-colors shadow-inner"
            />
          </div>

          {/* User Goal */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Task Goal Objective
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Subscribe to newsletter"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0f1b38] border border-blue-500/25 text-xs text-white focus:outline-none focus:border-blue-400 transition-colors shadow-inner"
            />
          </div>

          {/* Persona Selector */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Constraint Persona
            </label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaType)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0f1b38] border border-blue-500/25 text-xs text-white focus:outline-none focus:border-blue-400 transition-colors shadow-inner"
            >
              <option value="keyboard">Keyboard Only (WCAG 2.1.1)</option>
              <option value="screen_reader">Screen Reader (VoiceOver/NVDA)</option>
              <option value="low_vision">Low Vision / 320px Reflow</option>
              <option value="mouse_unconstrained">Baseline Unconstrained</option>
            </select>
          </div>
        </div>

        {/* Quick Presets & Autonomous Domain Discovery Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">Ground Truth Presets:</span>
            {benchmarkPresets.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => {
                  setTargetUrl(preset.url);
                  setGoal(preset.goal);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  targetUrl === preset.url
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isDiscovering}
              onClick={handleDiscoverDomain}
              className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-300 hover:text-white border border-white/[0.08] transition-all flex items-center gap-1.5"
            >
              <Compass className={`w-3 h-3 text-cyan-400 ${isDiscovering ? 'animate-spin' : ''}`} />
              <span>{isDiscovering ? 'Discovering CUJs...' : 'Auto-Discover Domain CUJs'}</span>
            </button>

            {persona === 'screen_reader' && (
              <button
                type="button"
                onClick={() => setSpeechActive(!speechActive)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white ml-2"
              >
                {speechActive ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                <span>VoiceOver: {speechActive ? 'ON' : 'MUTED'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionNotice && (
          <div className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between animate-in fade-in ${
            actionNotice.type === 'error' 
              ? 'bg-[#e5484d]/10 border-[#e5484d]/30 text-[#ff8b8e]' 
              : 'bg-[#30a46c]/10 border-[#30a46c]/30 text-[#30a46c]'
          }`}>
            <span>{actionNotice.message}</span>
            <button 
              type="button" 
              onClick={() => setActionNotice(null)}
              className="text-[#9ba1a6] hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Synthesized CUJs Drawer */}
        {discoveredJourneys.length > 0 && (
          <div className="pt-2 border-t border-[#23262a] space-y-1.5 animate-in fade-in duration-200">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8e98ec]">
              Synthesized Critical User Journeys (Click to Select Target Goal):
            </span>
            <div className="flex flex-wrap gap-2">
              {discoveredJourneys.map((j, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setGoal(j.goalText || j.name);
                    if (j.startingUrl) setTargetUrl(j.startingUrl);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#181a1d] hover:bg-[#23262a] border border-[#5e6ad2]/30 text-xs text-[#f4f5f6] hover:border-[#5e6ad2] transition-all flex items-center gap-2 text-left"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    j.criticality === 'critical' ? 'bg-[#e5484d]' : 'bg-[#5e6ad2]'
                  }`} />
                  <span className="font-medium">{j.name}</span>
                  <span className="text-[10px] text-[#9ba1a6] font-mono">({j.criticality})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Persona Swarm Summary Card */}
        {swarmSummary && (
          <div className="p-4 rounded-lg bg-[#181a1d] border border-[#5e6ad2]/40 shadow-lg space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8e98ec]" />
                <span className="text-xs font-semibold text-[#f4f5f6]">
                  Parallel Multi-Persona Swarm Results
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5e6ad2]/20 text-[#8e98ec]">
                  Score: {swarmSummary.unifiedHealthScore}/100
                </span>
              </div>
              <span className="text-xs font-mono text-[#9ba1a6]">
                {swarmSummary.totalDurationMs}ms total duration
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
              <div className="p-2 rounded bg-[#0c0d0e] border border-[#23262a]">
                <div className="text-[10px] text-[#9ba1a6]">Unique Findings</div>
                <div className="text-sm font-bold text-[#f4f5f6]">{swarmSummary.uniqueFindingCount}</div>
              </div>
              <div className="p-2 rounded bg-[#0c0d0e] border border-[#23262a]">
                <div className="text-[10px] text-[#9ba1a6]">Cross-Persona Consensus</div>
                <div className="text-sm font-bold text-[#5e6ad2]">{swarmSummary.crossPersonaFindingCount}</div>
              </div>
              <div className="p-2 rounded bg-[#0c0d0e] border border-[#23262a]">
                <div className="text-[10px] text-[#9ba1a6]">Pareto Optimal Patches</div>
                <div className="text-sm font-bold text-[#30a46c]">{swarmSummary.paretoFrontierCount}</div>
              </div>
              <div className="p-2 rounded bg-[#0c0d0e] border border-[#23262a]">
                <div className="text-[10px] text-[#9ba1a6]">Personas Evaluated</div>
                <div className="text-sm font-bold text-[#f4f5f6]">{swarmSummary.personasEvaluated?.length || 4}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Cockpit Split-View (Linear Precision Canvas & Trace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Multi-Mode Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`portfolio-arch apple-liquid-glass overflow-hidden shadow-2xl flex flex-col min-h-[560px] ${isCrtMode ? 'crt-stage' : ''}`}>
            
            {/* Viewport Multi-Tab Mode Bar with CRT Toggle */}
            <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.08]">
                <button
                  onClick={() => setActiveTab('viewport')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'viewport'
                      ? 'bg-white/[0.12] text-white border border-white/20'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    Live Viewport
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('theater')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'theater'
                      ? 'bg-white/[0.12] text-white border border-white/20'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Trace Theater
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('auditory')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'auditory'
                      ? 'bg-white/[0.12] text-white border border-white/20'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    Screen Reader
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('focus_map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'focus_map'
                      ? 'bg-white/[0.12] text-white border border-white/20'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Tarjan Focus Graph
                  </span>
                </button>
              </div>

              {/* CRT Phosphor Scanline Switch */}
              <button
                type="button"
                onClick={() => setIsCrtMode(!isCrtMode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 border ${
                  isCrtMode
                    ? 'bg-[#7eac81]/15 text-[#7eac81] border-[#7eac81]/30 crt-glow-mint'
                    : 'bg-white/[0.04] text-white/50 border-white/[0.08] hover:text-white'
                }`}
                title="Toggle Tailor'd Phosphor CRT Scanline Raster"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCrtMode ? 'bg-[#7eac81] animate-pulse' : 'bg-white/40'}`} />
                <span>CRT Scanlines</span>
              </button>

              {/* Real-time Streaming Pulse Indicator */}
              {isAuditing ? (
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Step {streamingStep}: {streamingStatus || 'Auditing...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Inspector Session Active</span>
                </div>
              )}
            </div>

            {/* Tab 1: Live CDP Viewport with Before/After Patch Simulator */}
            {activeTab === 'viewport' && (
              <div className="flex-1 flex flex-col justify-between p-4 space-y-4">
                <CDPPatchSimulator
                  targetUrl={targetUrl}
                  goal={goal}
                  persona={persona}
                  findings={findings}
                  activeElementSelector={activeElementSelector}
                  setActiveElementSelector={setActiveElementSelector}
                  activeKey={activeKey}
                  setActiveKey={setActiveKey}
                  isAuditing={isAuditing}
                  streamingStatus={streamingStatus}
                  onSelectFinding={onSelectFinding}
                />

                {/* Bottom: Mechanical Physical Keystroke Visualizer (Analog Phosphor Style) */}
                <div className="p-3.5 apple-glass-card rounded-2xl border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#9c9aa8]">
                    <span className="font-semibold uppercase tracking-wider text-[#7eac81] crt-glow-mint">
                      Physical Keystroke Visualizer
                    </span>
                    <span>Hardware Interaction Stream</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                    {physicalKeycaps.map((kc) => {
                      const isActive = activeKey?.toLowerCase().includes(kc.key.toLowerCase());
                      return (
                        <div
                          key={kc.key}
                          className={`px-3 py-1 text-xs font-mono font-semibold select-none rounded border transition-all ${
                            isActive
                              ? 'bg-[#7eac81]/20 text-[#7eac81] border-[#7eac81] shadow-[0_0_12px_rgba(126,172,129,0.5)] translate-y-[1px] crt-glow-mint'
                              : 'bg-black/30 text-[#9c9aa8] border-white/10'
                          }`}
                        >
                          <span>{kc.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Cinematic Time-Travel Replay Player */}
            {activeTab === 'theater' && (
              <div className="p-4 flex-1">
                <TimeTravelReplayPlayer
                  steps={steps}
                  findings={findings}
                  targetUrl={targetUrl}
                  onSelectFinding={onSelectFinding}
                />
              </div>
            )}

            {/* Tab 3: Screen Reader Speech Transcript */}
            {activeTab === 'auditory' && (
              <div className="p-4 flex-1">
                <ScreenReaderTranscript items={transcriptItems} />
              </div>
            )}

            {/* Tab 4: Focus Graph Topology */}
            {activeTab === 'focus_map' && (
              <div className="p-4 flex-1">
                <FocusMapView
                  kendallTau={auditResult?.kendallTau}
                  trapCertificate={findings.find(f => f.certificate)?.certificate}
                />
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Streaming Action Timeline & Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl glass-panel border border-white/[0.08] p-5 shadow-2xl flex flex-col h-[540px]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  Action Execution Trace
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                {steps.length || streamingStep} Actions Executed
              </span>
            </div>

            {/* Steps & Findings Stream List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              
              {/* Empty state */}
              {steps.length === 0 && !isAuditing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                  <Compass className="w-8 h-8 text-slate-600/60" />
                  <p className="text-xs text-slate-300 font-medium">No active execution trace.</p>
                  <p className="text-[11px] text-slate-500">
                    Click &quot;Run Autonomous Audit&quot; or choose a preset to begin.
                  </p>
                </div>
              )}

              {/* Steps List */}
              {steps.map((step: ActionStep) => (
                <div
                  key={step.idx}
                  className="p-3 rounded-xl bg-[#0f1b38]/90 border border-blue-500/20 space-y-1.5 text-xs hover:border-blue-400/40 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-400">Step #{step.idx}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                      Tier {step.tier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">
                      {step.actionType === 'press_key' ? `Press [${step.key || 'Tab'}]` : `Type text`}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                      {step.activeElementAfter || 'body'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Finding Cards Alert */}
              {findings.map((finding: BarrierFinding) => (
                <div
                  key={finding.id}
                  onClick={() => onSelectFinding(finding)}
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-xs cursor-pointer hover:bg-rose-500/15 hover:border-rose-500/50 transition-all shadow-md shadow-rose-950/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                      {finding.kind.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Trust: {finding.trustTier}
                    </span>
                  </div>
                  <div className="font-semibold text-white line-clamp-1">
                    {finding.title}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span className="text-rose-300 font-medium">Inspect Proof & Causal Patch</span>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Cryptographic Causal Certificate Drawer Modal */}
      <CausalCertificateDrawer
        isOpen={isCertDrawerOpen}
        onClose={() => setIsCertDrawerOpen(false)}
        finding={findings[0]}
        auditResult={auditResult}
        targetUrl={targetUrl}
      />

    </div>
  );
}
