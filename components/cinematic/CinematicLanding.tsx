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

  // Interactive Audio Waveform Animation State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(true);
  const [isMutedGap, setIsMutedGap] = useState<boolean>(true);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const pricingTiers = [
    {
      name: 'Developer Sandbox',
      price: '$0',
      period: 'free forever',
      desc: 'Engineered for indie engineers and open-source teams verifying interactive user journeys.',
      features: [
        '10 autonomous user journey audits / month',
        'Interactive keyboard trap detection (Tarjan SCC)',
        'Pre-loaded benchmark testbed access',
        'Visual DOM and code diff previews',
        'Community documentation & guides'
      ],
      cta: 'Start Free Sandbox',
      popular: false,
      highlight: false
    },
    {
      name: 'Team Pro',
      price: '$79',
      period: 'per month',
      desc: 'Continuous accessibility verification, automated GitHub pull requests, and real-time CI/CD gates.',
      features: [
        'Unlimited autonomous user journey audits',
        'Automated code fixes & 1-click GitHub PRs',
        'Screen reader voice synthesis simulation',
        'Visual vs. assistive reading order checks',
        'Slack & Webhook instant alert channels',
        'Full WCAG 2.2 & EAA 2025 compliance reports'
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'tailored SLA',
      desc: 'For high-velocity engineering organizations requiring dedicated environments and statutory legal ledgers.',
      features: [
        'Dedicated isolated cloud environment',
        'Custom assistive persona journey training',
        'SAML 2.0 / Okta / Azure AD SSO',
        'Certified VPAT® 2.5 & Section 508 ledgers',
        '99.99% uptime SLA & dedicated engineering support',
        'Custom enterprise CI/CD integration'
      ],
      cta: 'Talk to Engineering Team',
      popular: false,
      highlight: false
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
      <section className="relative z-10 pt-24 pb-16 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        
        {/* Release Pill Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 text-xs font-mono uppercase tracking-widest text-white/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span className="text-[#10b981] font-bold">( Autonomous Verification )</span>
            <span className="text-white/40">&bull;</span>
            <span className="text-white/80">BarrierLens &times; Enterprise</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/40">
            <span className="text-white/60">PLAYWRIGHT CDP</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AWS BEDROCK NOVA ACTIVE
            </span>
          </div>
        </div>

        {/* Master Headline: Large, Monolithic, Shimmering */}
        <div className="space-y-6">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-[-0.04em] text-white leading-[0.94]">
            Where legacy scanners guess, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#0090ff] to-[#10b981]">
              BarrierLens proves.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/70 max-w-3xl leading-relaxed">
            Over 60% of critical barriers—keyboard traps, reading-order dissonance, and silent dynamic dropouts—slip past static linters. BarrierLens navigates interactive user journeys, proving failures with deterministic recordings and verified code fixes.
          </p>

          {/* Quick Capability Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
            {['Playwright CDP Traversal', 'Tarjan SCC Graph Cycles', 'Kendall’s Tau-b Spatial', 'Live Voice Synthesizer', 'Causal AST Patches', 'Certified VPAT® 2.5'].map((tag, i) => (
              <span 
                key={i} 
                className="px-3 py-1 bg-white/[0.04] border border-white/10 text-white/80 rounded-md backdrop-blur-sm"
              >
                [ {tag} ]
              </span>
            ))}
          </div>
        </div>

        {/* Dual CTA Actions & Live URL Audit Omnibar */}
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-2xl bg-[#0c0d10]/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-3 max-w-4xl">
            <div className="flex-1 w-full flex items-center gap-2.5 px-4 py-2.5 bg-[#07080b] rounded-xl border border-white/10">
              <Compass className="w-4 h-4 text-[#0090ff] shrink-0" />
              <input
                type="text"
                value={trialUrl}
                onChange={(e) => setTrialUrl(e.target.value)}
                placeholder="Enter URL to test (e.g. https://your-site.com or /benchmark)"
                className="w-full bg-transparent text-xs sm:text-sm font-mono text-white placeholder-white/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <SegmentedControl<PersonaType>
                options={[
                  { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
                  { id: 'screen_reader', label: 'VoiceOver', icon: Volume2 },
                ]}
                value={trialPersona}
                onChange={setTrialPersona}
                size="sm"
              />

              <button
                type="button"
                onClick={() => onLaunchStudio(trialUrl, trialGoal, trialPersona, true)}
                className="px-6 py-2.5 bg-white hover:bg-white/90 active:scale-[0.98] text-black text-xs font-mono font-bold tracking-wider uppercase rounded-xl shrink-0 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-black fill-black" />
                <span>RUN AUDIT</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/50 pl-1">
            <span>Instant Benchmark Testbeds:</span>
            <button 
              type="button"
              onClick={() => { setTrialUrl('/fixtures/keyboard-trap'); onLaunchStudio('/fixtures/keyboard-trap', 'Test modal keyboard focus escape', 'keyboard', true); }}
              className="text-white hover:text-[#0090ff] underline flex items-center gap-1 transition-colors"
            >
              /fixtures/keyboard-trap
            </button>
            <span>&bull;</span>
            <button 
              type="button"
              onClick={() => { setTrialUrl('/fixtures/accname-wcag'); onLaunchStudio('/fixtures/accname-wcag', 'Test accessible name calculation', 'screen_reader', true); }}
              className="text-white hover:text-[#10b981] underline flex items-center gap-1 transition-colors"
            >
              /fixtures/accname-wcag
            </button>
          </div>
        </div>

        {/* High-Impact Metric Transformation Ribbons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-6 bg-[#0c0d10] border border-white/10 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block">Production Traps</span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black text-rose-400 line-through">98%</span>
              <span className="text-xs font-mono text-white/40">&rarr;</span>
              <span className="text-3xl font-black text-emerald-400">0%</span>
            </div>
            <p className="text-xs text-white/60 pt-2">Tarjan SCC graph cycle elimination</p>
          </div>

          <div className="p-6 bg-[#0c0d10] border border-white/10 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0090ff]/10 rounded-full blur-2xl group-hover:bg-[#0090ff]/20 transition-all" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block">Remediation MTTR</span>
            <div className="text-3xl font-black text-white pt-1">12x Faster</div>
            <p className="text-xs text-white/60 pt-2">Automated AST Git pull requests</p>
          </div>

          <div className="p-6 bg-[#0c0d10] border border-white/10 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block">Code Regressions</span>
            <div className="text-3xl font-black text-emerald-400 pt-1">0 Regressions</div>
            <p className="text-xs text-white/60 pt-2">Shadow-DOM replay verification</p>
          </div>

          <div className="p-6 bg-[#0c0d10] border border-white/10 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block">Statutory Conformance</span>
            <div className="text-3xl font-black text-white pt-1">100% Proven</div>
            <p className="text-xs text-white/60 pt-2">Certified VPAT® 2.5 &amp; EAA 2025 ledgers</p>
          </div>
        </div>

      </section>

      {/* 2. THE VISUAL PROBLEM VS. SOLUTION SHOWCASE (Interactive Scroll Gallery) */}
      <section className="relative z-10 py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/10 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#0090ff]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>( VISUAL VERIFICATION LAB )</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              See what static linters miss. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400">
                Experience the difference live.
              </span>
            </h2>
          </div>

          {/* Stage Switcher Tabs */}
          <div className="flex items-center p-1 bg-[#121316] border border-white/10 rounded-xl text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveStage(0)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeStage === 0 
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold shadow-lg' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-rose-400" />
              <span>01. The Trap</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStage(1)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeStage === 1 
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold shadow-lg' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>02. Speech Silence</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStage(2)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeStage === 2 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-lg' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
              <span>03. The AST Fix</span>
            </button>
          </div>
        </div>

        {/* STAGE 01: THE INVISIBLE KEYBOARD TRAP (Interactive Simulator) */}
        {activeStage === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0c0d10] border border-white/10 p-8 sm:p-12 rounded-3xl relative overflow-hidden">
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

            {/* Generated Cinematic Image with Glowing HUD */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0c0d10] border border-white/10 p-8 sm:p-12 rounded-3xl relative overflow-hidden">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold rounded">
                  PROBLEM 02 &bull; WCAG 4.1.3 LEVEL AA
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

            {/* Generated Cinematic Image */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0c0d10] border border-white/10 p-8 sm:p-12 rounded-3xl relative overflow-hidden">
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

            {/* Generated Cinematic Image */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
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

      {/* 3. ASYMMETRICAL ARCHITECTURAL BENTO GRID (Visual Tech Depth) */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-white/10 space-y-12">
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            ( DEEP ARCHITECTURE )
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Engineered for high-consequence interfaces.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1 (Large - Col 8): Tarjan SCC Graph Cycle Visualizer */}
          <div className="md:col-span-8 p-8 rounded-3xl bg-[#0c0d10] border border-white/10 space-y-6 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0090ff]/10 border border-[#0090ff]/30 flex items-center justify-center text-[#0090ff]">
                  <Binary className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tarjan SCC Directed Graph Engine</h3>
                  <p className="text-xs font-mono text-white/50">WCAG 2.1.2 Closed-Loop Cycle Invariant</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-emerald-400">
                O(V + E) Line Time
              </span>
            </div>

            <p className="text-sm text-white/70 leading-relaxed max-w-xl">
              Focus is modeled as a directed graph $G = (V, E)$. When a user tabs into a modal, the engine detects Strongly Connected Components ($SCC$) containing multiple focus nodes without an exit path back to root $v_0$.
            </p>

            {/* Visual SVG Directed Graph Node Animation */}
            <div className="h-44 bg-[#07080b] border border-white/5 rounded-2xl flex items-center justify-around px-8 relative overflow-hidden">
              <div className="text-center space-y-1 z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-xs font-mono text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  v0: root
                </div>
                <span className="text-[10px] font-mono text-white/40">Document</span>
              </div>

              <div className="w-12 h-0.5 bg-emerald-500/40 relative">
                <div className="absolute -top-1 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400 rotate-45" />
              </div>

              <div className="text-center space-y-1 z-10">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-xs font-mono text-rose-300 font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
                  v1: modal
                </div>
                <span className="text-[10px] font-mono text-rose-400 font-bold">TRAP CYCLE</span>
              </div>

              <div className="w-12 h-0.5 bg-rose-500/60 relative">
                <div className="absolute -top-1 right-0 w-2 h-2 border-t-2 border-r-2 border-rose-400 rotate-45" />
              </div>

              <div className="text-center space-y-1 z-10">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-xs font-mono text-rose-300 font-bold">
                  v2: input
                </div>
                <span className="text-[10px] font-mono text-white/40">Inescapable</span>
              </div>
            </div>
          </div>

          {/* Card 2 (Col 4): Kendall’s Tau-b Spatial Concordance */}
          <div className="md:col-span-4 p-8 rounded-3xl bg-[#0c0d10] border border-white/10 space-y-6 flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Kendall’s Tau-b Correlation</h3>
                <p className="text-xs font-mono text-purple-400">Visual vs. Tab Order $\tau_b &gt; 0.85$</p>
              </div>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Detects CSS flex-direction reversals and grid re-orderings where reading order inverts the visible UI layout.
              </p>
            </div>

            <div className="p-3 bg-[#07080b] rounded-xl border border-white/5 font-mono text-xs text-white/60 flex justify-between items-center">
              <span>Concordance Score:</span>
              <span className="text-emerald-400 font-bold">0.96 / 1.00 (CONGRUENT)</span>
            </div>
          </div>

          {/* Card 3 (Col 5): Shadow DOM Replay Verification */}
          <div className="md:col-span-5 p-8 rounded-3xl bg-[#0c0d10] border border-white/10 space-y-6 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Zero Regression Replay</h3>
              <p className="text-xs font-mono text-emerald-400">Isolated Headless CDP Verification</p>
            </div>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Every synthesized AST code patch is spun up in an isolated shadow container. The exact traversal path is re-executed to guarantee no other element broke.
            </p>
          </div>

          {/* Card 4 (Col 7): Statutory VPAT® 2.5 Conformance */}
          <div className="md:col-span-7 p-8 rounded-3xl bg-[#0c0d10] border border-white/10 space-y-6 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-xs font-mono text-amber-300 rounded">
                Executive Legal Defense
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Statutory Conformance Ledgers</h3>
              <p className="text-xs font-mono text-white/50">VPAT® 2.5 &bull; EAA 2025 &bull; Section 508</p>
            </div>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Generate court-admissible audit ledgers mapped line-by-line to statutory requirements. Every finding links to cryptographic Playwright video captures and DOM trace logs.
            </p>
          </div>

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

      {/* 5. TRANSPARENT PRICING & TIERS */}
      <section id="pricing" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16 border-t border-white/10">
        
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            ( COMMERCIAL TIERS )
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Predictable plans for teams of any size.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, idx) => (
            <div 
              key={idx}
              className={`p-8 rounded-3xl border flex flex-col justify-between space-y-8 ${
                tier.highlight 
                  ? 'bg-[#14161b] border-white/30 shadow-2xl relative' 
                  : 'bg-[#0c0d10] border-white/10'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#10b981] text-black text-[10px] font-bold uppercase tracking-wider font-mono">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white uppercase font-mono">{tier.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white tracking-tight">{tier.price}</span>
                  <span className="text-xs text-white/50 font-mono">/ {tier.period}</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {tier.desc}
                </p>

                <div className="pt-6 border-t border-white/10 space-y-3 text-xs text-white/80">
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else onLaunchStudio('/benchmark', 'Run default benchmark audit', 'keyboard');
                }}
                className={`w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                  tier.highlight
                    ? 'bg-white text-black hover:bg-white/90 shadow-lg'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {tier.cta}
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

      {/* 7. FINAL HIGH-CONVERTING CALL TO ACTION */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="p-10 sm:p-16 rounded-3xl bg-[#0c0d10] border border-white/15 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
              ( PRODUCTION READINESS )
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              Make your web application provably accessible to every human.
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Start auditing your web application in seconds. Zero credit card or complex setup required.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else onLaunchStudio(trialUrl, trialGoal, trialPersona);
              }}
              className="px-8 py-3.5 bg-white hover:bg-white/90 text-black text-xs font-mono font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl"
            >
              <span>ACCESS AUDIT COCKPIT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onLaunchStudio('/benchmark', 'Test modal keyboard focus escape', 'keyboard')}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold tracking-wider uppercase rounded-xl border border-white/10 transition-all"
            >
              EXPLORE BENCHMARKS
            </button>
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
            <span>ENTERPRISE SOC2 READY</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
