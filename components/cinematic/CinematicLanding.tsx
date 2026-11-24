'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Lenis from 'lenis';
import { 
  ArrowRight, 
  ArrowUpRight, 
  ShieldCheck, 
  Volume2, 
  Layers, 
  Compass, 
  Code2, 
  ChevronDown, 
  CheckCircle2, 
  Zap, 
  GitPullRequest, 
  Check, 
  Keyboard, 
  Eye, 
  Terminal,
  XCircle,
  Binary,
  Cpu,
  Scale,
  Activity,
  FileCheck2,
  GitBranch,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  VolumeX,
  Radio
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { PersonaType } from '@/lib/barrierlens/types';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { KineticButton } from '@/components/ui/KineticButton';

interface CinematicLandingProps {
  onLaunchStudio: (targetUrl?: string, goal?: string, persona?: PersonaType, autoStart?: boolean) => void;
  onSelectBenchmark: (url: string, goal: string) => void;
  onOpenAuth?: () => void;
}

export function CinematicLanding({ 
  onLaunchStudio, 
  onSelectBenchmark,
  onOpenAuth 
}: CinematicLandingProps) {
  // Smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Quick Trial Input State
  const [trialUrl, setTrialUrl] = useState<string>('/benchmark');
  const [trialGoal, setTrialGoal] = useState<string>('Test modal keyboard focus escape and trap loops');
  const [trialPersona, setTrialPersona] = useState<PersonaType>('keyboard');

  // Interactive Problem-to-Proof Stages (Visual Showcase)
  const [activeStage, setActiveStage] = useState<0 | 1 | 2>(0);

  // Live Keyboard Traversal Simulator State
  const [simStep, setSimStep] = useState<number>(1);
  const [simTrapped, setSimTrapped] = useState<boolean>(true);
  const [simEscaped, setSimEscaped] = useState<boolean>(false);
  const [simPatchApplied, setSimPatchApplied] = useState<boolean>(false);

  // Antigravity Zero-G Barrier Sandbox State
  const [gravityRemediated, setGravityRemediated] = useState<boolean>(false);

  // Interactive Audio Waveform Animation State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(true);
  const [isMutedGap, setIsMutedGap] = useState<boolean>(true);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Terminal Contact Inquiry State (#contact)
  const [inquiryUrl, setInquiryUrl] = useState<string>('');
  const [inquiryCookies, setInquiryCookies] = useState<string>('');
  const [inquiryGoal, setInquiryGoal] = useState<string>('');

  // Keyboard simulator handler
  const handleSimTab = () => {
    if (simPatchApplied) {
      // With AST patch applied, clean linear progression
      if (simStep === 1) setSimStep(2);
      else if (simStep === 2) setSimStep(3);
      else if (simStep === 3) setSimStep(4);
      else setSimStep(1);
    } else {
      // Unfixed: Closed loop trap in modal!
      if (simStep === 1) setSimStep(2);
      else if (simStep === 2) setSimStep(3);
      else if (simStep === 3) setSimStep(2); // Loop between 2 and 3!
      else setSimStep(1);
    }
  };

  const handleSimEscape = () => {
    if (simPatchApplied) {
      setSimEscaped(true);
      setSimStep(1);
      setTimeout(() => setSimEscaped(false), 2500);
    } else {
      // Trap ignored escape
      setSimTrapped(true);
      setTimeout(() => setSimTrapped(false), 1200);
    }
  };

  const handleTogglePatch = () => {
    setSimPatchApplied(!simPatchApplied);
    setSimStep(1);
  };

  const comparisonRows = [
    {
      feature: 'Keyboard Trap Detection in Modals & Drawers',
      barrierlens: 'Interactive Traversal (Tests Escape & Tab)',
      linters: 'Checks static HTML tags only (Misses real traps)',
      overlays: 'Fails to fix (often introduces new traps)'
    },
    {
      feature: 'Visual vs. Screen Reader Reading Order',
      barrierlens: 'Kendall’s Tau-b Spatial Correlation',
      linters: 'Not supported',
      overlays: 'Not supported'
    },
    {
      feature: 'Screen Reader Voice Speech Verification',
      barrierlens: 'Live Speech Synthesizer Simulation',
      linters: 'Static aria-live attribute check only',
      overlays: 'Superficial text-to-speech toolbar widget'
    },
    {
      feature: 'False Positive Warning Noise',
      barrierlens: 'Zero false alarms on verified user flows',
      linters: '30% – 50% warning noise that slows teams',
      overlays: 'Creates UI glitches and user complaints'
    },
    {
      feature: 'Automated Code Fixes & Pull Requests',
      barrierlens: 'Surgical AST diffs with 1-click GitHub PR',
      linters: 'Generic documentation links only',
      overlays: 'Temporary runtime JS DOM monkey-patching'
    },
    {
      feature: 'Legal Compliance (EAA 2025 & ADA Title III)',
      barrierlens: 'Source-code audit ledgers & VPAT® 2.5',
      linters: 'Insufficient for legal defense',
      overlays: 'Rejected in US & EU federal courts'
    }
  ];

  const agentPillars = [
    {
      step: '01',
      title: 'Perception Mesh',
      subtitle: 'Playwright CDP Assistive Driver',
      desc: 'Simulates real human interaction vectors: humanized keyboard tab sequences, voiceover speech calculation, and motor tremor modeling.',
      metrics: ['Sub-pixel Pointer Drift', 'CDP Tree Traversal', 'Synthetic Voice Synthesis'],
      badge: 'Perception Agent',
      color: 'border-blue-500/30 text-blue-400 bg-blue-950/20'
    },
    {
      step: '02',
      title: 'Proof Engine',
      subtitle: 'Tarjan SCC & Kendall τ Verification',
      desc: 'Applies formal graph theory to prove keyboard traps as inescapable strongly connected components and measure visual order concordance.',
      metrics: ['Tarjan SCC Cycles', 'Kendall τ Metric', 'CMSD Entropy Fields'],
      badge: 'Formal Verifier',
      color: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20'
    },
    {
      step: '03',
      title: 'AST Causal Surgery',
      subtitle: 'Zero-Regression Code Patching',
      desc: 'Parses component AST syntax trees, synthesizes exact repairs, verifies shadow-DOM rendering (SSIM >= 0.999), and submits GitHub PRs.',
      metrics: ['Babel AST Surgery', 'Shadow-DOM Verification', '1-Click GitHub PRs'],
      badge: 'Remediation Agent',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20'
    }
  ];

  const faqs = [
    {
      q: 'How does BarrierLens catch bugs that Axe and Lighthouse miss?',
      a: 'Traditional linters (like Axe-core or Google Lighthouse) only inspect static HTML strings at the moment a page loads. They never press the Tab key, open a modal dialog, or submit a form. BarrierLens launches an autonomous interactive session that navigates real user journeys—testing keyboard focus escape, screen reader announcements, and dynamic UI state changes just like a real user with assistive needs would.'
    },
    {
      q: 'Why are third-party overlay widgets risky for compliance?',
      a: 'Third-party JavaScript overlay widgets (such as cosmetic toolbar plug-ins) only manipulate the rendered visual layer without repairing the underlying source code. Landmark rulings in US Federal courts and upcoming European Accessibility Act (EAA 2025) audits have repeatedly established that cosmetic overlays fail to provide legal accessibility compliance. BarrierLens fixes the actual code upstream in your repository.'
    },
    {
      q: 'Does BarrierLens work with modern Single Page Applications (SPAs)?',
      a: 'Yes. BarrierLens is designed specifically for modern dynamic web frameworks including React, Next.js, Vue, Angular, Svelte, and static sites. It handles client-side routing, asynchronous data fetching, animated modals, and complex design systems.'
    },
    {
      q: 'Can I use BarrierLens during pull requests in CI/CD?',
      a: 'Absolutely. BarrierLens integrates directly into GitHub Actions, GitLab CI, or any CI/CD runner. You can set it to automatically audit pull requests, block accessibility regressions before merging, and receive automated PRs with ready-to-merge code fixes.'
    },
    {
      q: 'How does the automated GitHub code fix feature work?',
      a: 'When an accessibility issue (such as a missing accessible name or an unescapable modal) is detected, BarrierLens generates a clean, minimal code patch that addresses the root cause. It re-tests the fix automatically to ensure no regressions were introduced, and opens a GitHub Pull Request with a clear explanation for your review.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] font-sans antialiased selection:bg-white selection:text-black">
      
      {/* Subtle Ambient Radial Lighting with dot-matrix watermark */}
      <div className="ambient-mesh pointer-events-none" />
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* 1. HERO SECTION: Cinematic, High-Impact & Visually Gripping */}
      <section className="relative z-10 pt-20 sm:pt-28 pb-16 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        
        {/* Release Pill Badge & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6 text-xs font-mono uppercase tracking-widest text-white/50">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="text-cyan-400 font-semibold tracking-wider">AUTONOMOUS VERIFICATION ENGINE</span>
            <span className="text-white/20">&bull;</span>
            <span className="text-white/80 font-medium">BARRIERLENS 2.0</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/40">
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-white/70">PLAYWRIGHT CDP 1.48</span>
            <span>&bull;</span>
            <span className="text-cyan-400 font-medium flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              NEURAL VERIFICATION CORE ACTIVE
            </span>
          </div>
        </div>

        {/* Master Headline: Antigravity-Inspired High-Vibrancy Typography */}
        <div className="space-y-6 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-500/30 text-xs font-mono text-cyan-300 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Accessibility Engine &middot; The Agent-First Era</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-sans font-extrabold tracking-[-0.04em] text-white leading-[0.96]">
            Prove what locks them out. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 drop-shadow-[0_0_35px_rgba(59,130,246,0.35)]">
              Repair it before you ship.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl font-normal leading-relaxed tracking-tight">
            Over 60% of critical accessibility barriers—closed-loop keyboard traps, reading-order dissonance, and silent state dropouts—slip past static linters. BarrierLens autonomously executes real user journeys, proving failures with deterministic recordings and verified source-code repairs.
          </p>

          {/* Quick Capability Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
            {['Playwright CDP Traversal', 'ATL* Game Model Checking', 'CMSD Entropy Field', 'SSIM >= 0.999 AST Surgery', 'PoA-DAG Merkle Ledger', 'Certified VPAT® 2.5'].map((tag, i) => (
              <span 
                key={i} 
                className="px-3 py-1 bg-white/[0.03] hover:bg-blue-500/10 border border-white/[0.08] hover:border-blue-400/40 text-white/70 hover:text-cyan-200 rounded-full transition-all cursor-default backdrop-blur-md shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Dual CTA Actions & Live URL Audit Omnibar */}
        <div className="space-y-4 pt-4">
          <div className="p-2 sm:p-2.5 rounded-full apple-liquid-glass shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] border border-white/[0.12] flex flex-col md:flex-row items-center gap-2 max-w-4xl ring-1 ring-white/[0.05]">
            <div className="flex-1 w-full flex items-center gap-3 px-5 py-2.5 bg-black/50 rounded-full border border-white/[0.08] focus-within:border-[#0090ff]/60 focus-within:ring-1 focus-within:ring-[#0090ff]/30 transition-all">
              <Compass className="w-4 h-4 text-[#0090ff] shrink-0 animate-pulse" />
              <input
                type="text"
                value={trialUrl}
                onChange={(e) => setTrialUrl(e.target.value)}
                placeholder="Enter URL to test (e.g. https://your-site.com or /benchmark)"
                className="w-full bg-transparent text-xs sm:text-sm font-mono text-white placeholder-white/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <SegmentedControl<PersonaType>
                options={[
                  { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
                  { id: 'screen_reader', label: 'VoiceOver', icon: Volume2 },
                ]}
                value={trialPersona}
                onChange={setTrialPersona}
                size="sm"
              />

              <KineticButton
                type="button"
                onClick={() => onLaunchStudio(trialUrl, trialGoal, trialPersona, true)}
                text="Run Autonomous Audit"
                variant="antigravity"
                className="shrink-0 font-sans"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 pl-4 font-mono">
            <span className="text-white/40">Pre-built Fixtures:</span>
            <button 
              type="button"
              onClick={() => { setTrialUrl('/fixtures/keyboard-trap'); onLaunchStudio('/fixtures/keyboard-trap', 'Test modal keyboard focus escape', 'keyboard', true); }}
              className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-blue-500/10 border border-white/[0.08] hover:border-blue-400/40 text-white/80 hover:text-cyan-300 transition-all"
            >
              /fixtures/keyboard-trap
            </button>
            <button 
              type="button"
              onClick={() => { setTrialUrl('/fixtures/accname-wcag'); onLaunchStudio('/fixtures/accname-wcag', 'Test accessible name calculation', 'screen_reader', true); }}
              className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-400/40 text-white/80 hover:text-emerald-300 transition-all"
            >
              /fixtures/accname-wcag
            </button>
            <button 
              type="button"
              onClick={() => { setTrialUrl('/benchmark'); onLaunchStudio('/benchmark', 'Run comprehensive WCAG suite', 'keyboard', true); }}
              className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-indigo-500/10 border border-white/[0.08] hover:border-indigo-400/40 text-white/80 hover:text-indigo-300 transition-all"
            >
              /benchmark
            </button>
          </div>
        </div>

        {/* UNIQUE ZERO-G ANTIGRAVITY HERO PLAYGROUND */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-blue-950/30 via-[#0d0f17]/90 to-[#08090d]/95 border border-blue-500/30 shadow-[0_0_60px_-15px_rgba(59,130,246,0.3)] overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-semibold">
                  Zero-G Interactive Simulator
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Real-Time Barrier Physics &amp; AST Remediation
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Observe how digital accessibility barriers float without constraints across user journeys, and watch autonomous agents magnetically resolve them into mathematically proven states.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setGravityRemediated(!gravityRemediated)}
              className={`px-5 py-2.5 rounded-full text-xs font-mono font-semibold tracking-wide uppercase transition-all duration-300 flex items-center gap-2 shrink-0 ${
                gravityRemediated 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:bg-emerald-500/30' 
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:scale-105'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>{gravityRemediated ? '↺ Reset to Floating Zero-G' : '⚡ Trigger Autonomous Repair'}</span>
            </button>
          </div>

          {/* 4 Barrier Cards: Zero-G Float vs Magnetically Remediated Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 relative z-10">
            
            {/* Card 1: Keyboard Trap */}
            <div className={`p-5 rounded-2xl border transition-all duration-500 backdrop-blur-xl relative overflow-hidden ${
              gravityRemediated 
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-100' 
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300 animate-float-1 shadow-[0_0_25px_rgba(244,63,94,0.15)]'
            }`}>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {gravityRemediated ? 'Graph Cycle Resolved' : 'Closed Focus Sink'}
                </span>
                <span className={`w-2 h-2 rounded-full ${gravityRemediated ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
              </div>
              <h4 className="font-semibold text-sm text-white">{gravityRemediated ? '✓ Escape Key Focus Return' : 'Inescapable Modal Trap'}</h4>
              <p className="text-xs text-slate-400 pt-1.5 leading-relaxed font-mono">
                {gravityRemediated 
                  ? 'Tarjan SCC confirms cycle broken. Keydown Escape handler restores focus to origin.'
                  : '#dialog-modal: Tab and Shift+Tab form an inescapable loop. Escape ignored.'}
              </p>
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className={gravityRemediated ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {gravityRemediated ? 'PR #104 Ready' : 'WCAG 2.1.2 FAIL'}
                </span>
                <span className="text-white/40">{gravityRemediated ? 'Verified' : 'Cycle Loop'}</span>
              </div>
            </div>

            {/* Card 2: Reading Order */}
            <div className={`p-5 rounded-2xl border transition-all duration-500 backdrop-blur-xl relative overflow-hidden ${
              gravityRemediated 
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-100' 
                : 'bg-amber-950/20 border-amber-500/30 text-amber-300 animate-float-2 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
            }`}>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {gravityRemediated ? 'Order Conformance' : 'Reading Sequence'}
                </span>
                <span className={`w-2 h-2 rounded-full ${gravityRemediated ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              </div>
              <h4 className="font-semibold text-sm text-white">{gravityRemediated ? '✓ Kendall τ = 1.00 Concordance' : 'Assistive Order Inversion'}</h4>
              <p className="text-xs text-slate-400 pt-1.5 leading-relaxed font-mono">
                {gravityRemediated 
                  ? 'DOM node order aligned with visual layout stream. Zero assistive disconnect.'
                  : 'CSS flex-direction: row-reverse causes DOM traversal order divergence (τ = 0.52).'}
              </p>
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className={gravityRemediated ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {gravityRemediated ? 'Deterministic' : 'WCAG 1.3.2 WARN'}
                </span>
                <span className="text-white/40">{gravityRemediated ? 'SSIM 0.999' : 'Tau 0.52'}</span>
              </div>
            </div>

            {/* Card 3: Missing Accessible Name */}
            <div className={`p-5 rounded-2xl border transition-all duration-500 backdrop-blur-xl relative overflow-hidden ${
              gravityRemediated 
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-100' 
                : 'bg-purple-950/20 border-purple-500/30 text-purple-300 animate-float-3 shadow-[0_0_25px_rgba(168,85,247,0.15)]'
            }`}>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {gravityRemediated ? 'Synthetic Speech' : 'Assistive Speech'}
                </span>
                <span className={`w-2 h-2 rounded-full ${gravityRemediated ? 'bg-emerald-400' : 'bg-purple-400 animate-pulse'}`} />
              </div>
              <h4 className="font-semibold text-sm text-white">{gravityRemediated ? '✓ VoiceOver Announcement' : 'Silent Action Element'}</h4>
              <p className="text-xs text-slate-400 pt-1.5 leading-relaxed font-mono">
                {gravityRemediated 
                  ? 'Synthesized aria-label="Confirm Transaction" injected into AST.'
                  : 'Icon-only button has empty accessible name string in Chrome CDP tree.'}
              </p>
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className={gravityRemediated ? 'text-emerald-400 font-bold' : 'text-purple-400'}>
                  {gravityRemediated ? 'VoiceOver OK' : 'WCAG 4.1.2 FAIL'}
                </span>
                <span className="text-white/40">{gravityRemediated ? 'Verified' : 'Silent Node'}</span>
              </div>
            </div>

            {/* Card 4: Color Contrast */}
            <div className={`p-5 rounded-2xl border transition-all duration-500 backdrop-blur-xl relative overflow-hidden ${
              gravityRemediated 
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-100' 
                : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300 animate-float-1 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
            }`}>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {gravityRemediated ? 'Photometric Contrast' : 'Contrast Ratio'}
                </span>
                <span className={`w-2 h-2 rounded-full ${gravityRemediated ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
              </div>
              <h4 className="font-semibold text-sm text-white">{gravityRemediated ? '✓ 7.2:1 Level AAA Certified' : 'Low Contrast 2.1:1'}</h4>
              <p className="text-xs text-slate-400 pt-1.5 leading-relaxed font-mono">
                {gravityRemediated 
                  ? 'Luminance algorithm recalibrates foreground palette preserving design token semantics.'
                  : 'Muted grey on dark slate fails minimum 4.5:1 ratio requirement.'}
              </p>
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className={gravityRemediated ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
                  {gravityRemediated ? 'AAA Compliant' : 'WCAG 1.4.3 FAIL'}
                </span>
                <span className="text-white/40">{gravityRemediated ? 'Pass' : '2.1:1'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* High-Impact Metric Transformation Ribbons (Linear / Apple Tier-1 Bento) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
          <div className="p-6 bg-[#0c0d12]/90 border border-white/[0.08] rounded-2xl relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/25 transition-all duration-500" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block font-medium">Production Traps</span>
            <div className="flex items-baseline gap-2.5 pt-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-rose-400/60 line-through decoration-rose-500/50">98%</span>
              <span className="text-xs font-mono text-white/40">&rarr;</span>
              <span className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400">0%</span>
            </div>
            <p className="text-xs text-white/60 pt-2 font-mono">Tarjan SCC graph cycle elimination</p>
          </div>

          <div className="p-6 bg-[#0c0d12]/90 border border-white/[0.08] rounded-2xl relative overflow-hidden group hover:border-[#0090ff]/40 transition-all duration-300 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#0090ff]/10 rounded-full blur-3xl group-hover:bg-[#0090ff]/25 transition-all duration-500" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block font-medium">Remediation MTTR</span>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white pt-2 flex items-baseline gap-2">
              12x <span className="text-xs font-mono text-[#0090ff] font-normal uppercase">Faster</span>
            </div>
            <p className="text-xs text-white/60 pt-2 font-mono">Automated AST Git pull requests</p>
          </div>

          <div className="p-6 bg-[#0c0d12]/90 border border-white/[0.08] rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition-all duration-500" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block font-medium">Code Regressions</span>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400 pt-2 flex items-baseline gap-2">
              0 <span className="text-xs font-mono text-emerald-300/70 font-normal uppercase">Verified</span>
            </div>
            <p className="text-xs text-white/60 pt-2 font-mono">Shadow-DOM replay verification</p>
          </div>

          <div className="p-6 bg-[#0c0d12]/90 border border-white/[0.08] rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/25 transition-all duration-500" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block font-medium">Statutory Conformance</span>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white pt-2 flex items-baseline gap-2">
              100% <span className="text-xs font-mono text-[#bb7bfc] font-normal uppercase">Proven</span>
            </div>
            <p className="text-xs text-white/60 pt-2 font-mono">Certified VPAT® 2.5 &amp; EAA 2025</p>
          </div>
        </div>

      </section>

      {/* 2. THE VISUAL PROBLEM VS. SOLUTION SHOWCASE (Interactive Scroll Gallery) */}
      <section className="relative z-10 py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/10 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#7eac81]">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#7eac81]" />
              <span className="crt-glow-mint">( SENSORY VERIFICATION LAB )</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-white leading-tight">
              See what static linters miss. <br />
              <span className="italic font-normal text-[#bb7bfc] crt-glow-lavender">
                Experience the behavioral difference live.
              </span>
            </h2>
          </div>

          {/* Stage Switcher Tabs (Apple Segmented Sliding Pill) */}
          <div className="flex items-center p-1.5 apple-liquid-glass rounded-full text-xs border border-white/[0.1] shadow-lg ring-1 ring-white/[0.05]">
            <button
              type="button"
              onClick={() => setActiveStage(0)}
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeStage === 0 
                  ? 'bg-white text-black font-semibold shadow-md active:scale-[0.98]' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>01. The Trap</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStage(1)}
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeStage === 1 
                  ? 'bg-white text-black font-semibold shadow-md active:scale-[0.98]' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>02. Speech Silence</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStage(2)}
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeStage === 2 
                  ? 'bg-white text-black font-semibold shadow-md active:scale-[0.98]' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>03. The AST Fix</span>
            </button>
          </div>
        </div>

        {/* STAGE 01: THE INVISIBLE KEYBOARD TRAP (Interactive Simulator inside Tailor'd Arch) */}
        {activeStage === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center portfolio-arch apple-liquid-glass p-8 sm:p-12 relative overflow-hidden crt-stage animate-fade-in-up">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold rounded">
                  PROBLEM 01 &bull; WCAG 2.1.2 LEVEL A
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  The Closed-Loop Keyboard Trap
                </h3>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  Static linters inspect HTML tags and give it 100% green. But when a real keyboard user opens a modal, focus gets trapped in a cycle and the Escape key is silently ignored.
                </p>
              </div>

              {/* Hands-On Interactive Stepper */}
              <div className="p-5 bg-[#121316] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/60">HANDS-ON SIMULATOR</span>
                  <span className={simPatchApplied ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {simPatchApplied ? "STATUS: AST PATCH ACTIVE" : "STATUS: TRAPPED FOCUS LOOP"}
                  </span>
                </div>

                {/* Simulated Focus Ring Nodes */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep === 1 
                      ? 'bg-[#0090ff]/20 border-[#0090ff] text-white shadow-[0_0_15px_rgba(0,144,255,0.4)]' 
                      : 'bg-[#07080b] border-white/5 text-white/40'
                  }`}>
                    1. #nav-bar
                  </div>
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep === 2 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                      : 'bg-[#07080b] border-white/5 text-white/40'
                  }`}>
                    2. #modal-input
                  </div>
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep === 3 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                      : 'bg-[#07080b] border-white/5 text-white/40'
                  }`}>
                    3. #submit-btn
                  </div>
                </div>

                {/* Trapped Alert Banner */}
                {simTrapped && !simPatchApplied && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300 flex items-center gap-2 animate-bounce">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Escape key ignored! User cannot leave the modal dialog.</span>
                  </div>
                )}

                {simEscaped && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Focus cleanly escaped back to document root!</span>
                  </div>
                )}

                {/* Interactive Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSimTab}
                    className="px-4 py-2 bg-white text-black text-xs font-mono font-bold rounded-lg hover:bg-white/90 transition-all flex items-center gap-1.5"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>PRESS TAB KEY</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSimEscape}
                    className="px-4 py-2 bg-[#17181c] text-white border border-white/10 text-xs font-mono font-bold rounded-lg hover:bg-white/10 transition-all"
                  >
                    PRESS ESCAPE
                  </button>
                  <button
                    type="button"
                    onClick={handleTogglePatch}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-lg hover:bg-emerald-500/30 transition-all ml-auto"
                  >
                    {simPatchApplied ? "REVERT TO BUGGY" : "APPLY AST PATCH"}
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Cinematic Image with Glowing HUD & Tailor'd Phosphor Shader */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group crt-filter-blue">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/keyboard-trap-problem.jpg"
                  alt="Keyboard trap circular focus lockout visualization"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-xs font-mono text-white/80 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Tarjan Cycle Detected in #newsletter-modal
                </span>
                <span className="text-white/40">Step 3 &rarr; Step 2</span>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 02: SCREEN READER SILENCE (Audio Equalizer Visualizer) */}
        {activeStage === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center apple-liquid-glass p-8 sm:p-12 rounded-3xl relative overflow-hidden animate-fade-in-up">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold rounded">
                  INVENTION 02 &bull; WCAG 4.1.3 &bull; CROSS-MODAL DIVERGENCE (CMSD)
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Assistive Silence &amp; Dynamic Mutations
                </h3>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  When discounts apply, items delete, or form validation fails, sighted users instantly see UI text change. Blind users receive zero feedback unless aria-live is dynamically triggered.
                </p>
              </div>

              {/* Dynamic Soundwave Equalizer */}
              <div className="p-5 bg-[#121316] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/60">LIVE SPEECH SYNTHESIZER TELEMETRY</span>
                  <span className={isMutedGap ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                    {isMutedGap ? "SPEECH GAP: 0 EVENTS" : "SPEECH ANNOUNCED"}
                  </span>
                </div>

                {/* Animated Audio Equalizer Bars */}
                <div className="h-16 bg-[#07080b] border border-white/5 rounded-xl flex items-center justify-center gap-1.5 px-4 overflow-hidden">
                  {[24, 45, 12, 60, 32, 18, 55, 40, 28, 50, 15, 38, 48, 20, 58, 30, 44, 22].map((height, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full transition-all duration-300 ${
                        isMutedGap 
                          ? i > 7 ? 'h-1 bg-rose-500/40' : 'h-3 bg-white/20' 
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                      style={{ height: isMutedGap && i > 7 ? '2px' : `${height}px` }}
                    />
                  ))}
                </div>

                <div className="p-3 bg-black/60 rounded-xl border border-white/5 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-white/50">
                    <span>DOM Visual Mutation:</span>
                    <span className="text-emerald-400 font-bold">Total: $120.00 &rarr; $96.00 (-20%)</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Synthesizer Audio Event:</span>
                    <span className={isMutedGap ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      {isMutedGap ? "[SILENCE] (aria-live missing)" : "\"Discount applied. Total is now $96.00\""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsMutedGap(!isMutedGap)}
                    className="px-4 py-2 bg-white text-black text-xs font-mono font-bold rounded-lg hover:bg-white/90 transition-all flex items-center gap-2"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isMutedGap ? "ADD ARIA-LIVE (HEAR SPEECH)" : "REMOVE ARIA-LIVE (TEST GAP)"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Cinematic Image with Tailor'd Phosphor Shader */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group crt-filter-blue">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/screen-reader-silence.jpg"
                  alt="Speech synthesizer gap and screen reader flatline silence"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-xs font-mono text-white/80 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Dynamic Mutation without aria-live announcement
                </span>
                <span className="text-amber-400">WCAG 4.1.3</span>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 03: THE AST PROOF ENGINE & AUTOMATED REPAIR */}
        {activeStage === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center apple-liquid-glass p-8 sm:p-12 rounded-3xl relative overflow-hidden animate-fade-in-up">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold rounded">
                  SOLUTION 03 &bull; CAUSAL AST PATCH SYNTHESIS
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  1-Click Verified Code Fixes
                </h3>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  BarrierLens doesn’t just output a PDF of complaints. It parses your source-code Abstract Syntax Tree, generates the exact React/HTML diff, re-runs the traversal in a shadow browser to prove zero regressions, and opens a GitHub PR.
                </p>
              </div>

              {/* Code Diff Box */}
              <div className="p-5 bg-[#121316] border border-white/10 rounded-2xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-white/50 border-b border-white/5 pb-2">
                  <span>components/NewsletterModal.tsx</span>
                  <span className="text-emerald-400 font-bold">REPLAY PROOF: PASSED</span>
                </div>

                <div className="p-3 bg-[#07080b] rounded-lg border border-white/5 space-y-1 overflow-x-auto text-[11px] leading-relaxed">
                  <div className="text-rose-400">- &lt;div id=&quot;newsletter-modal&quot; className=&quot;modal&quot;&gt;</div>
                  <div className="text-emerald-400">+ &lt;div id=&quot;newsletter-modal&quot; role=&quot;dialog&quot; aria-modal=&quot;true&quot; onKeyDown=&#123;handleEscape&#125;&gt;</div>
                  <div className="text-white/40">    &lt;h2&gt;Sign up for updates&lt;/h2&gt;</div>
                  <div className="text-rose-400">-   &lt;button id=&quot;close-btn&quot;&gt;&lt;X /&gt;&lt;/button&gt;</div>
                  <div className="text-emerald-400">+   &lt;button id=&quot;close-btn&quot; aria-label=&quot;Close dialog&quot;&gt;&lt;X /&gt;&lt;/button&gt;</div>
                  <div className="text-white/40">  &lt;/div&gt;</div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-white/40 text-[11px]">Fixes WCAG 2.1.2 &amp; 4.1.2</span>
                  <button
                    type="button"
                    onClick={() => onLaunchStudio('/fixtures/accname-wcag', 'Review verified AST diff', 'keyboard', true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>EXPORT GITHUB PR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Cinematic Image with Tailor'd Phosphor Shader */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group crt-filter-blue">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/proof-engine-remediation.jpg"
                  alt="3D node graph and AST code remediation diff"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-xs font-mono text-white/80 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  AST Node Mutation Replay: 0 Regressions
                </span>
                <span className="text-emerald-400 font-bold">100% PASS</span>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* 3. TAILOR'D 9-BLOCK TECHNICAL CAPABILITIES MATRIX (01 - 09) */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/10 space-y-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#7eac81]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#7eac81]" />
            <span className="crt-glow-mint">( TECHNICAL ARCHITECTURE • 01 - 09 )</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-white leading-tight">
            Engineered for high-consequence interfaces. <br />
            <span className="italic font-normal text-[#bb7bfc] crt-glow-lavender">
              Surgical verification at every layer.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              index: '01',
              title: 'Autonomous Traversal Engine',
              category: 'Playwright CDP Agent',
              desc: 'Active assistive agent navigating dynamic interactive states—modals, nested drawers, and checkout funnels under true keyboard constraints.',
              borderClass: 'border-[#7eac81]/30 hover:border-[#7eac81]',
              accentColor: 'text-[#7eac81]',
              glowClass: 'crt-glow-mint'
            },
            {
              index: '02',
              title: 'Tarjan Directed Cycle Proofs',
              category: 'WCAG 2.1.2 Level A',
              desc: 'Linear-time graph cycle verification detecting closed focus sinks (SCC) where users cannot escape interactive dialogs.',
              borderClass: 'border-rose-500/30 hover:border-rose-500',
              accentColor: 'text-rose-400',
              glowClass: ''
            },
            {
              index: '03',
              title: 'Kendall Tau Monotonicity',
              category: 'WCAG 1.3.2 Reading Order',
              desc: 'Calculates rank correlation between 2D visual layout coordinates and screen reader DOM reading sequence.',
              borderClass: 'border-[#bb7bfc]/30 hover:border-[#bb7bfc]',
              accentColor: 'text-[#bb7bfc]',
              glowClass: 'crt-glow-lavender'
            },
            {
              index: '04',
              title: 'ARIA Live Mutation Gaps',
              category: 'WCAG 4.1.3 Assistive Silence',
              desc: 'Detects dynamic visual UI updates (toasts, validation errors, cart totals) that lack corresponding live audio announcements.',
              borderClass: 'border-[#dad45e]/30 hover:border-[#dad45e]',
              accentColor: 'text-[#dad45e]',
              glowClass: 'crt-glow-amber'
            },
            {
              index: '05',
              title: 'Causal AST Code Surgery',
              category: 'SSIM >= 0.999 Invariance',
              desc: 'Synthesizes minimal Abstract Syntax Tree code mutations. Pre-verifies 0.0px layout shifts in an isolated shadow browser.',
              borderClass: 'border-[#7eac81]/30 hover:border-[#7eac81]',
              accentColor: 'text-[#7eac81]',
              glowClass: 'crt-glow-mint'
            },
            {
              index: '06',
              title: '1-Click GitHub PR Dispatch',
              category: 'Automated Code Repair',
              desc: 'Dispatches surgically tested React, Vue, and HTML fixes directly into GitHub Pull Requests with cryptographic verification proofs.',
              borderClass: 'border-[#bb7bfc]/30 hover:border-[#bb7bfc]',
              accentColor: 'text-[#bb7bfc]',
              glowClass: 'crt-glow-lavender'
            },
            {
              index: '07',
              title: 'PoA-DAG Merkle Ledger',
              category: 'Statutory Defense',
              desc: 'Every audit run produces an immutable Merkle DAG with SHA-256 state commitments, court-admissible under ADA Title III.',
              borderClass: 'border-[#7eac81]/30 hover:border-[#7eac81]',
              accentColor: 'text-[#7eac81]',
              glowClass: 'crt-glow-mint'
            },
            {
              index: '08',
              title: 'Certified VPAT® 2.5 Export',
              category: 'Section 508 & EAA 2025',
              desc: 'Instant generation of formal VPAT 2.5 (Revised Section 508 / EN 301 549) accessibility conformance documentation.',
              borderClass: 'border-[#dad45e]/30 hover:border-[#dad45e]',
              accentColor: 'text-[#dad45e]',
              glowClass: 'crt-glow-amber'
            },
            {
              index: '09',
              title: 'Multi-Persona Swarm Arena',
              category: 'Assistive Concurrency',
              desc: 'Parallel multi-agent testing across 4 simultaneous constraint models: Keyboard-Only, Screen Reader, Low Vision, and Cognitive.',
              borderClass: 'border-[#bb7bfc]/30 hover:border-[#bb7bfc]',
              accentColor: 'text-[#bb7bfc]',
              glowClass: 'crt-glow-lavender'
            }
          ].map((item) => (
            <div
              key={item.index}
              className={`p-7 rounded-3xl apple-glass-card border ${item.borderClass} space-y-5 group transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold tracking-widest ${item.accentColor} ${item.glowClass}`}>
                    [ {item.index} ]
                  </span>
                  <span className="text-[10px] font-mono text-white/50 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06] uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-white tracking-tight leading-tight group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-[13px] font-mono text-[#9c9aa8] leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/40">
                <span className="group-hover:text-white/80 transition-colors">Verified Module</span>
                <span className={`${item.accentColor}`}>&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. THE UNCOMPROMISING CONTRAST MATRIX */}
      <section id="comparison" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12 border-t border-white/10">
        
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            ( COMPETITIVE ARCHITECTURE )
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            How BarrierLens compares to alternatives.
          </h2>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0c0d10]">
          <table className="w-full text-left font-sans text-xs sm:text-sm divide-y divide-white/10">
            <thead>
              <tr className="bg-[#121316] text-white/70 text-xs uppercase tracking-wider font-mono">
                <th className="p-5 font-semibold">Capability</th>
                <th className="p-5 bg-white text-black font-bold">BarrierLens 2.0</th>
                <th className="p-5 font-semibold text-white/70">Static Linters</th>
                <th className="p-5 font-semibold text-white/70">Overlay Widgets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {comparisonRows.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5 font-medium text-white">{row.feature}</td>
                  <td className="p-5 bg-white/5 font-semibold text-[#10b981]">{row.barrierlens}</td>
                  <td className="p-5 text-white/60">{row.linters}</td>
                  <td className="p-5 text-rose-400">{row.overlays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>

      {/* 5. THE AUTONOMOUS AGENT ARCHITECTURE */}
      <section id="architecture" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16 border-t border-white/10">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Core Pillars</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            How BarrierLens Works: The Verification Loop
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            A tripartite agent architecture executing continuous perception, formal mathematical graph verification, and surgical AST code repair.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {agentPillars.map((pillar, idx) => (
            <div 
              key={idx}
              className={`p-8 rounded-3xl border flex flex-col justify-between space-y-8 bg-[#0c0d12]/90 ${pillar.color} shadow-2xl relative overflow-hidden backdrop-blur-xl group hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    {pillar.badge}
                  </span>
                  <span className="text-2xl font-mono font-bold opacity-30 text-white">{pillar.step}</span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">{pillar.title}</h3>
                <p className="text-xs font-mono text-cyan-300/80">{pillar.subtitle}</p>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {pillar.desc}
                </p>

                <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs text-white/80 font-mono">
                  {pillar.metrics.map((metric, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLaunchStudio('/benchmark', 'Run default benchmark audit', 'keyboard')}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2 group-hover:border-cyan-400/40"
              >
                <span>Inspect Engine</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>

      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-24 px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto space-y-12 border-t border-white/10">
        
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            ( COMMON INQUIRIES )
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-white/10 bg-[#0c0d10] overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 text-sm font-semibold text-white hover:bg-white/[0.02] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/50 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>

              {openFaq === idx && (
                <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/10">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* 7. TERMINAL DIRECT INQUIRY CONSOLE (#contact) */}
      <section id="contact" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#dad45e] crt-glow-amber">
            ( 07 &bull; AUTONOMOUS AUDIT COCKPIT )
          </span>
          <h2 className="text-4xl sm:text-6xl font-serif tracking-tight text-white leading-tight font-normal">
            Initiate Autonomous Verification <span className="italic text-[#dad45e] crt-glow-amber">&amp; AST Remediation</span>
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
            Submit your staging credentials or target endpoint. The autonomous multi-persona swarm evaluates under real physical keyboard &amp; assistive sensory constraints, uncovering barriers with zero false alarms.
          </p>
        </div>

        {/* Tailor'd Styled Terminal Inquiry Box */}
        <div className="w-full max-w-xl mx-auto bg-[#181717] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.85)] space-y-6 text-left relative overflow-hidden">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#2a2a2a] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <span className="text-white/40 ml-2">inquiry_terminal.sh</span>
            </div>
            <span className="text-[#dad45e] font-semibold text-[11px] crt-glow-amber">MODE: AST_VERIFY</span>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                Target Domain / Endpoint URL
              </label>
              <input
                type="text"
                value={inquiryUrl}
                onChange={(e) => setInquiryUrl(e.target.value)}
                placeholder="https://app.acme.corp/checkout"
                className="w-full bg-[#232323] border border-[#333333] rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:border-[#dad45e] focus:ring-1 focus:ring-[#dad45e]/40 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5 flex items-center justify-between">
                <span>Custom Authentication / Staging Cookies</span>
                <span className="text-[10px] text-white/40 font-normal">Optional JSON or Bearer</span>
              </label>
              <input
                type="text"
                value={inquiryCookies}
                onChange={(e) => setInquiryCookies(e.target.value)}
                placeholder='{"session_id": "stg_9f8a...", "role": "buyer"}'
                className="w-full bg-[#232323] border border-[#333333] rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:border-[#dad45e] focus:ring-1 focus:ring-[#dad45e]/40 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                Journey Goal Specification
              </label>
              <textarea
                rows={3}
                value={inquiryGoal}
                onChange={(e) => setInquiryGoal(e.target.value)}
                placeholder="e.g. Verify keyboard focus trap and dynamic aria-live feedback on checkout modal"
                className="w-full bg-[#232323] border border-[#333333] rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:border-[#dad45e] focus:ring-1 focus:ring-[#dad45e]/40 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Submission Trigger */}
          <div className="pt-2 space-y-3">
            <KineticButton
              text="REQUEST CUSTOM CUJ AUDIT"
              variant="amber"
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else onLaunchStudio(inquiryUrl || trialUrl, inquiryGoal || trialGoal, trialPersona);
              }}
              className="w-full justify-center text-xs"
            />

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onLaunchStudio('/benchmark', 'Test modal keyboard focus escape', 'keyboard')}
                className="text-[11px] font-mono text-white/50 hover:text-white transition-colors underline underline-offset-4"
              >
                Or launch with standard ground-truth benchmarks &rarr;
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-white/40 border-t border-[#2a2a2a]">
            <span>✓ Cryptographic Causal Proofs</span>
            <span>Zero False Alarms</span>
          </div>
        </div>
      </section>

      {/* 8. EDITORIAL ENTERPRISE FOOTER */}
      <footer className="pt-16 pb-12 px-6 sm:px-8 lg:px-12 border-t border-white/10 bg-[#07080b] text-xs text-white/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/10">
          
          <div className="md:col-span-5 space-y-3">
            <BrandLogo size="md" showBadge={true} />
            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
              The automated accessibility verification platform testing web applications like real humans with assistive needs do—delivering verified code fixes with zero false alarms.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="font-semibold text-white font-mono uppercase tracking-wider">Product</p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/benchmark', 'Run default benchmark suite', 'keyboard')}
                  className="hover:text-white transition-colors"
                >
                  Audit Studio Cockpit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/fixtures/keyboard-trap', 'Inspect focus trap path', 'keyboard')}
                  className="hover:text-white transition-colors"
                >
                  Issues &amp; Evidence Inspector
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/fixtures/accname-wcag', 'Inspect Causal AST Patches', 'screen_reader')}
                  className="hover:text-white transition-colors"
                >
                  Verified Code Fixes
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <p className="font-semibold text-white font-mono uppercase tracking-wider">Compliance Standards</p>
            <ul className="space-y-1.5 text-white/60">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10b981]" />
                <span>W3C WCAG 2.2 Level A, AA, AAA</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10b981]" />
                <span>European Accessibility Act (EAA 2025)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Americans with Disabilities Act (ADA Title III)</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p>&copy; 2026 BarrierLens Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-white/40 font-mono text-[11px]">
            <span>WCAG 2.2 LEVEL AAA</span>
            <span>EAA 2025 COMPLIANT</span>
            <span>MERKLE AUDIT LEDGER</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
