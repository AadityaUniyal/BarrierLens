'use client';

import React, { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { 
  ArrowRight, 
  ArrowUpRight,
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  Volume2, 
  Layers, 
  Compass, 
  ExternalLink,
  Code2,
  FileCheck,
  ChevronRight,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';
import { PersonaType } from '@/lib/barrierlens/types';

interface CinematicLandingProps {
  onLaunchStudio: (targetUrl?: string, goal?: string, persona?: PersonaType) => void;
  onSelectBenchmark: (url: string, goal: string) => void;
}

export function CinematicLanding({ onLaunchStudio, onSelectBenchmark }: CinematicLandingProps) {
  // Lenis smooth scroll
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
  const [trialGoal, setTrialGoal] = useState<string>('Verify modal escape and keyboard focus traversal');
  const [trialPersona, setTrialPersona] = useState<PersonaType>('keyboard');

  // Featured Slide State (1/5)
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Index List vs Grid View Toggle
  const [indexView, setIndexView] = useState<'list' | 'grid'>('list');

  // Interactive Tarjan SCC Demo
  const [tarjanStep, setTarjanStep] = useState<number>(1);
  const [trapEscaped, setTrapEscaped] = useState<boolean>(false);

  const handleNextTarjan = () => {
    if (tarjanStep === 1) setTarjanStep(2);
    else if (tarjanStep === 2) setTarjanStep(3);
    else if (tarjanStep === 3) {
      if (trapEscaped) {
        setTarjanStep(5); // Escaped to document root!
      } else {
        setTarjanStep(4); // Into trap modal
      }
    } else if (tarjanStep === 4) {
      if (trapEscaped) {
        setTarjanStep(5);
      } else {
        setTarjanStep(3); // Closed loop cycle!
      }
    } else {
      setTarjanStep(1);
    }
  };

  const featureSlides = [
    {
      num: '01',
      chunks: ['TAR', 'JAN', 'SCC'],
      title: 'Tarjan SCC Focus Sink Proofs',
      italicTag: 'Directed cycle detection over CDP tab transitions.',
      desc: 'Static linters cannot know if focus ever leaves an element. BarrierLens models the entire DOM tab sequence as a directed graph G=(V,E) and computes Strongly Connected Components. Any terminal sink with zero out-degree is mathematically proven to be a trap with zero false positives.',
      metric: '0 False Positives',
      metricLabel: 'Mathematical Proof vs Heuristics',
      badge: 'WCAG 2.1.2 Level A',
      actionUrl: '/fixtures/keyboard-trap',
      actionGoal: 'Prove modal keyboard focus sink cycle'
    },
    {
      num: '02',
      chunks: ['KEN', 'DALL', 'TAU'],
      title: 'Kendall’s Tau (τ) Reading Discordance',
      italicTag: 'Spatial 2D visual layout vs DOM accessibility tree.',
      desc: 'CSS grid and flexbox frequently invert visual reading sequence relative to screen reader traversal order. BarrierLens evaluates the rank concordance between 2D (Y, X) coordinate order and accessibility tree indices. Drops below τ = 0.70 flag severe disorientation barriers.',
      metric: 'τ = 0.52 Inversion',
      metricLabel: 'Kendall Concordance Threshold',
      badge: 'WCAG 1.3.2 Level A',
      actionUrl: '/fixtures/disordered-unreachable',
      actionGoal: 'Detect reading order inversion and unreachable controls'
    },
    {
      num: '03',
      chunks: ['VOICE', 'OVER', 'GAP'],
      title: 'VoiceOver Acoustic Stream Gaps',
      italicTag: 'Real-time speech mutation silence detector.',
      desc: 'When an asynchronous cart total updates or an inline validation error triggers without aria-live, blind users are completely unalerted. BarrierLens measures the acoustic delta between DOM state mutations and screen reader speech synthesis buffers.',
      metric: '0.00ms Announced',
      metricLabel: 'Assistive Silence Detection',
      badge: 'WCAG 4.1.3 Level AA',
      actionUrl: '/benchmark',
      actionGoal: 'Verify live announcement of dynamic validation updates'
    },
    {
      num: '04',
      chunks: ['CAU', 'SAL', 'SCM'],
      title: 'Pearl SCM Causal AST Certificates',
      italicTag: 'Cryptographic do-calculus counterfactual verification.',
      desc: 'We do not generate arbitrary AI advice. Applying Judea Pearl’s Structural Causal Models, BarrierLens simulates interventions do(X = x*), compiles minimal surgical AST patches, and produces a SHA-256 signed certificate proving the barrier is eradicated with zero side-effect regressions.',
      metric: 'SHA-256 Signed',
      metricLabel: 'Counterfactual Proof Certificate',
      badge: 'Automated Pull Requests',
      actionUrl: '/fixtures/accname-wcag',
      actionGoal: 'Synthesize verified ARIA attribute injection patch'
    },
    {
      num: '05',
      chunks: ['GEN', 'OME', '768'],
      title: '768-d Barrier Genome Embeddings',
      italicTag: 'Cross-site zero-shot transfer learning via pgvector.',
      desc: 'Every barrier discovered across enterprise audits is vectorized into a 768-dimensional normalized embedding space stored in Neon Serverless PostgreSQL with HNSW cosine indexes. Similar visual and structural traps are predicted zero-shot before tests run.',
      metric: '768-d Cosine HNSW',
      metricLabel: 'Vector Knowledge Base',
      badge: 'pgvector Multi-Tenant',
      actionUrl: '/benchmark',
      actionGoal: 'Vectorize barrier signature into genome embedding space'
    }
  ];

  const proofItems = [
    {
      id: '01',
      name: 'Modal Dialog Keyboard Focus Sink',
      italic: 'Escape key unbound; Tab cycles indefinitely',
      wcag: 'WCAG 2.1.2 Level A',
      severity: 9.8,
      proof: 'Tarjan SCC Sink Cycle Verified',
      url: '/fixtures/keyboard-trap',
      goal: 'Trap focus in newsletter modal and attempt escape'
    },
    {
      id: '02',
      name: 'Unlabeled Dismiss Icon Button',
      italic: 'Empty accessible name in CDP accessibility tree',
      wcag: 'WCAG 4.1.2 Level A',
      severity: 7.5,
      proof: 'Name/Role/Value Tree Extraction',
      url: '/fixtures/accname-wcag',
      goal: 'Identify and activate icon drawer dismiss controls'
    },
    {
      id: '03',
      name: 'Flexbox Reverse Reading Inversion',
      italic: 'Visual reading flow diverges from DOM accessibility tree',
      wcag: 'WCAG 1.3.2 Level A',
      severity: 6.0,
      proof: 'Kendall Tau τ = 0.52 (Threshold < 0.70)',
      url: '/fixtures/disordered-unreachable',
      goal: 'Evaluate reading order concordance across responsive grid'
    },
    {
      id: '04',
      name: 'Silent Asynchronous Validation Failure',
      italic: 'Server response injects error without speech announcement',
      wcag: 'WCAG 4.1.3 Level AA',
      severity: 8.4,
      proof: 'Acoustic Speech Gap Delta = 0ms',
      url: '/benchmark',
      goal: 'Submit invalid payload and verify screen reader announcement'
    },
    {
      id: '05',
      name: 'Focus Loss on Offcanvas Drawer Close',
      italic: 'Closing drawer dumps focus onto document root body',
      wcag: 'WCAG 2.4.3 Level A',
      severity: 6.8,
      proof: 'Focus Restoration Invariant Failed',
      url: '/fixtures/focus-loss',
      goal: 'Open slide-out drawer, close it, and check focus return'
    },
    {
      id: '06',
      name: '320px Viewport Horizontal Reflow Overflow',
      italic: 'Fixed width container triggers horizontal scroll on mobile',
      wcag: 'WCAG 1.4.10 Level AA',
      severity: 7.2,
      proof: 'Viewport Reflow Geometry Collision',
      url: '/benchmark',
      goal: 'Simulate mobile viewport reflow at 320px width'
    },
    {
      id: '07',
      name: 'APCA Low Contrast Text Over Media',
      italic: 'Light text over background video stream fails Lc 45',
      wcag: 'WCAG 1.4.3 Level AA',
      severity: 5.5,
      proof: 'APCA Perceptual Luminance Contrast',
      url: '/benchmark',
      goal: 'Measure perceptual APCA contrast over dynamic canvas'
    },
    {
      id: '08',
      name: 'Parkinson Motor Tremor Target Miss',
      italic: 'Interactive touch targets smaller than 24x24px',
      wcag: 'WCAG 2.5.8 Level AA',
      severity: 8.0,
      proof: 'Physical Fitts Law Tremor Simulation',
      url: '/benchmark',
      goal: 'Simulate motor tremor perturbation on compact controls'
    }
  ];

  const journalArticles = [
    {
      id: 'RFC-104',
      title: 'Graph-Theoretic Focus Traps: Proving Focus Sinks via Tarjan’s SCC Algorithm',
      category: 'ALGORITHMS',
      date: 'NOVEMBER 2026',
      desc: 'Why heuristic tab timers fail and how directed graph strongly connected components yield mathematical proofs of accessibility lockouts.'
    },
    {
      id: 'ANALYSIS',
      title: 'The Legal Flaw of Surface Overlay Widgets in Federal ADA Lawsuits',
      category: 'LEGAL & REGULATORY',
      date: 'OCTOBER 2026',
      desc: 'Examining recent court rulings where cosmetic JS overlay widgets aggravated rather than resolved web accessibility liability.'
    },
    {
      id: 'BENCHMARK',
      title: 'Evaluating Kendall’s Tau Rank Concordance on the Top 1,000 E-Commerce Checkouts',
      category: 'EMPIRICAL RESEARCH',
      date: 'OCTOBER 2026',
      desc: 'How modern CSS grid styling inadvertently creates high disorientation rates for low-vision and screen reader users.'
    },
    {
      id: 'INFRASTRUCTURE',
      title: 'Sub-100ms Surgical Remediation Patches via Amazon Bedrock Nova Micro',
      category: 'AI ARCHITECTURE',
      date: 'SEPTEMBER 2026',
      desc: 'Routing tiered foundation models through AWS SigV4 authentication to synthesize verified AST pull requests in real time.'
    },
    {
      id: 'COMPLIANCE',
      title: 'European Accessibility Act (EAA 2025): Technical Enforcement Guidelines',
      category: 'STANDARDS',
      date: 'AUGUST 2026',
      desc: 'The technical differences between WCAG 2.1 AA and the new EAA mandates facing digital products operating in the EU.'
    },
    {
      id: 'VECTOR-ML',
      title: '768-Dimensional Barrier Genome: Vector Space Clustering with Neon pgvector',
      category: 'MACHINE LEARNING',
      date: 'AUGUST 2026',
      desc: 'Clustering structural accessibility failure patterns across millions of DOM nodes for instant zero-shot remediation.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ffffff] font-sans selection:bg-white selection:text-black">
      
      {/* 5.1 HERO SECTION (design.md: 3-4 giant stacked lines, full-bleed, editorial) */}
      <section className="min-h-screen relative flex flex-col justify-between pt-20 pb-12 px-6 sm:px-12 border-hairline-b">
        
        {/* Top Metadata Header Line */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono uppercase tracking-widest text-[rgba(255,255,255,0.6)] pt-4 pb-8 border-hairline-b">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#10b981]" />
            <span className="text-white font-bold">BARRIERLENS 2.0</span>
            <span>·</span>
            <span>AUTONOMOUS AGENTIC VERIFICATION</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden md:inline">AMAZON BEDROCK NOVA LIVE</span>
            <span className="hidden md:inline">NEON PGVECTOR INDEXED</span>
            <span className="text-white">STATUS: OPERATIONAL</span>
          </div>
        </div>

        {/* 4 Giant Stacked Headline Lines */}
        <div className="my-auto py-12 space-y-1 sm:space-y-2">
          <div className="overflow-hidden">
            <h1 className="headline-giant text-[clamp(2.75rem,8.5vw,10.5rem)] text-white">
              PROVE WHAT
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1 className="headline-giant text-[clamp(2.75rem,8.5vw,10.5rem)] text-white">
              LOCKS THEM
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1 className="headline-giant text-[clamp(2.75rem,8.5vw,10.5rem)] text-white">
              <span className="font-editorial-italic font-normal lowercase tracking-normal text-white">out.</span>
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1 className="headline-giant text-[clamp(2.75rem,8.5vw,10.5rem)] text-[rgba(255,255,255,0.7)]">
              SEAL THE CODE.
            </h1>
          </div>
        </div>

        {/* Subcopy & Interactive Omnibar */}
        <div className="space-y-8 pt-6 border-hairline-t">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            
            {/* Subcopy text */}
            <div className="lg:col-span-5 space-y-4">
              <p className="text-sm sm:text-base text-[rgba(255,255,255,0.65)] leading-relaxed max-w-lg">
                Traditional static linters only inspect static HTML markup. BarrierLens launches real headless Chromium sessions via the Chrome DevTools Protocol, traverses multi-step user journeys under physical assistive constraints, and mathematically proves focus sink cycles using <strong className="text-white">Tarjan SCC graph algorithms</strong>.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[rgba(255,255,255,0.5)]">
                <span>[01] 0% FALSE POSITIVES</span>
                <span>[02] CAUSAL SCM PROOFS</span>
                <span>[03] LIVE CHROMIUM CDP</span>
              </div>
            </div>

            {/* Live Audit Quick Launcher Omnibar */}
            <div className="lg:col-span-7">
              <div className="p-3 bg-[#121316] border-hairline space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center gap-2 px-3 py-2.5 bg-[#0a0a0a] border-hairline">
                    <Compass className="w-4 h-4 text-[rgba(255,255,255,0.4)] shrink-0" />
                    <input
                      type="text"
                      value={trialUrl}
                      onChange={(e) => setTrialUrl(e.target.value)}
                      placeholder="https://your-domain.com or /benchmark"
                      className="w-full bg-transparent text-xs font-mono text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none"
                    />
                  </div>

                  {/* Persona Selector */}
                  <div className="flex items-center bg-[#0a0a0a] p-1 border-hairline w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setTrialPersona('keyboard')}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                        trialPersona === 'keyboard'
                          ? 'bg-white text-black font-bold'
                          : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                      }`}
                    >
                      Keyboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrialPersona('screen_reader')}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                        trialPersona === 'screen_reader'
                          ? 'bg-white text-black font-bold'
                          : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                      }`}
                    >
                      VoiceOver
                    </button>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    onClick={() => onLaunchStudio(trialUrl, trialGoal, trialPersona)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-[rgba(255,255,255,0.85)] text-black text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shrink-0"
                  >
                    <span>AUDIT TARGET</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Ground-Truth Quick Presets */}
                <div className="flex flex-wrap items-center justify-between text-xs px-1 text-[rgba(255,255,255,0.5)] font-mono">
                  <span className="text-[11px] uppercase tracking-wider">Ground Truth Benchmarks:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTrialUrl('/benchmark');
                        onLaunchStudio('/benchmark', 'Subscribe to newsletter and test confirmation modal', 'keyboard');
                      }}
                      className="hover:text-white underline underline-offset-4 text-[11px]"
                    >
                      [Modal Trap Cycle]
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrialUrl('/fixtures/keyboard-trap');
                        onLaunchStudio('/fixtures/keyboard-trap', 'Navigate into modal and escape back to main page', 'keyboard');
                      }}
                      className="hover:text-white underline underline-offset-4 text-[11px]"
                    >
                      [Focus Loss Fixture]
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrialUrl('/fixtures/accname-wcag');
                        onLaunchStudio('/fixtures/accname-wcag', 'Identify and activate icon action buttons', 'screen_reader');
                      }}
                      className="hover:text-white underline underline-offset-4 text-[11px]"
                    >
                      [Unlabeled SVG AccName]
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 5.2 STATEMENT / INTRO SECTION (design.md: 3 big stacked statements + hairline dividers) */}
      <section className="py-24 px-6 sm:px-12 border-hairline-b space-y-16">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-[rgba(255,255,255,0.5)] border-hairline-b pb-4">
            <span>[SECTION 02] THE BEHAVIORAL IMPERATIVE</span>
            <span>EMPIRICAL WCAG 2.2 AAA VERIFICATION</span>
          </div>

          <div className="space-y-4">
            <h2 className="headline-giant text-[clamp(2rem,5.5vw,5.5rem)] text-white">
              STATIC SCANNERS CHECK HTML TAGS.
            </h2>
            <h2 className="headline-giant text-[clamp(2rem,5.5vw,5.5rem)] text-white">
              <span className="font-editorial-italic font-normal lowercase tracking-normal text-white">
                real humans navigate behavior.
              </span>
            </h2>
            <h2 className="headline-giant text-[clamp(2rem,5.5vw,5.5rem)] text-[rgba(255,255,255,0.5)]">
              PROVE THE TRAP BEFORE PRODUCTION.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 border-hairline-t">
            <div className="md:col-span-6 space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                Over 96.8% of top websites fail basic accessibility guidelines.
              </h3>
              <p className="text-sm text-[rgba(255,255,255,0.65)] leading-relaxed">
                Passive linters (Axe, Lighthouse) return hundreds of false-positive warnings that development teams ignore. Meanwhile, cosmetic JavaScript overlay widgets create immense federal ADA and European Accessibility Act (EAA 2025) compliance liabilities. BarrierLens bridges this chasm by generating mathematically irrefutable causal proofs.
              </p>
            </div>

            <div className="md:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#121316] border-hairline space-y-1">
                <div className="text-3xl font-mono font-bold text-white">30-40%</div>
                <div className="text-xs uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Linter Defect Detection Limit</div>
                <p className="text-[11px] text-[rgba(255,255,255,0.4)] pt-2">Linters miss asynchronous state mutations, keyboard sinks, and disordered reading flows.</p>
              </div>
              <div className="p-4 bg-[#121316] border-hairline space-y-1">
                <div className="text-3xl font-mono font-bold text-[#10b981]">100%</div>
                <div className="text-xs uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Mathematical Determinism</div>
                <p className="text-[11px] text-[rgba(255,255,255,0.4)] pt-2">Tarjan SCC algorithm proves directed cycle closure with zero heuristic estimation.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5.3 FEATURED SHOWCASE (design.md: 5 slides with letter-chunk split + counter 1/5) */}
      <section className="py-24 px-6 sm:px-12 border-hairline-b space-y-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Section Header with 1/5 Counter */}
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-white uppercase tracking-widest font-bold">
                [03] CORE ARCHITECTURAL INVARIANTS
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[rgba(255,255,255,0.5)]">EXHIBIT</span>
              <span className="text-white font-bold">{featureSlides[activeSlide].num} / 05</span>
            </div>
          </div>

          {/* Slide Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {featureSlides.map((slide, idx) => (
              <button
                key={slide.num}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`p-3 text-left border-hairline transition-all ${
                  activeSlide === idx
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#121316] text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[#1a1c20]'
                }`}
              >
                <div className="text-[10px] font-mono opacity-60">{slide.num}</div>
                <div className="text-xs uppercase tracking-tight truncate">{slide.title.split(' ')[0]} {slide.title.split(' ')[1]}</div>
              </button>
            ))}
          </div>

          {/* Active Featured Slide Exhibit */}
          <div className="p-8 sm:p-12 bg-[#121316] border-hairline space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-hairline-b pb-8">
              
              {/* Giant Letter-Chunk Title Split */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  {featureSlides[activeSlide].chunks.map((chunk, i) => (
                    <span key={i} className="headline-giant text-4xl sm:text-6xl text-white tracking-wider">
                      {chunk}
                      {i < featureSlides[activeSlide].chunks.length - 1 && (
                        <span className="text-[rgba(255,255,255,0.3)] ml-4">/</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="text-xl sm:text-2xl font-editorial-italic text-[rgba(255,255,255,0.85)]">
                  {featureSlides[activeSlide].italicTag}
                </div>
              </div>

              {/* Metric Card */}
              <div className="p-4 bg-[#0a0a0a] border-hairline min-w-[220px] space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.5)]">
                  {featureSlides[activeSlide].metricLabel}
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {featureSlides[activeSlide].metric}
                </div>
                <div className="text-[10px] font-mono text-[#10b981] pt-1">
                  {featureSlides[activeSlide].badge}
                </div>
              </div>

            </div>

            {/* Exhibit Description & Interactive Sandbox Callout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <p className="text-sm sm:text-base text-[rgba(255,255,255,0.7)] leading-relaxed">
                  {featureSlides[activeSlide].desc}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onLaunchStudio(featureSlides[activeSlide].actionUrl, featureSlides[activeSlide].actionGoal, 'keyboard')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-[rgba(255,255,255,0.85)] transition-all"
                  >
                    <span>TEST THIS INVARIANT IN AUDIT STUDIO</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Mini-Simulation Graphic */}
              <div className="lg:col-span-5 p-6 bg-[#0a0a0a] border-hairline space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[rgba(255,255,255,0.5)]">
                  <span>LIVE PROOF TOPOLOGY</span>
                  <span className={tarjanStep === 3 || tarjanStep === 4 ? 'text-[#f43f5e]' : 'text-[#10b981]'}>
                    {tarjanStep === 3 || tarjanStep === 4 ? '● SINK SCC LOCKED' : '○ UNCONSTRAINED'}
                  </span>
                </div>

                {/* Node Sequence */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className={`p-2 border-hairline ${tarjanStep === 1 ? 'bg-white text-black font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    ROOT
                  </div>
                  <div className={`p-2 border-hairline ${tarjanStep === 2 ? 'bg-white text-black font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    NAV
                  </div>
                  <div className={`p-2 border-hairline ${tarjanStep === 3 ? 'bg-[#f43f5e] text-white font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    MODAL
                  </div>
                  <div className={`p-2 border-hairline ${tarjanStep === 4 ? 'bg-[#f43f5e] text-white font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    BUTTON
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleNextTarjan}
                    className="px-3 py-1.5 bg-[#17181c] hover:bg-[#202228] text-xs font-mono text-white border-hairline flex items-center gap-1.5"
                  >
                    <span>STEP TAB KEY</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrapEscaped(!trapEscaped)}
                    className={`px-3 py-1.5 text-xs font-mono border-hairline transition-all ${
                      trapEscaped ? 'bg-[#10b981] text-black font-bold' : 'bg-[#17181c] text-[rgba(255,255,255,0.6)]'
                    }`}
                  >
                    {trapEscaped ? 'ESCAPE BINDING: FIXED' : 'ESCAPE BINDING: MISSING'}
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 5.4 INDEX (LIST ⇄ GRID VIEW) (design.md: 8 proof items, list/grid toggle, hover states) */}
      <section className="py-24 px-6 sm:px-12 border-hairline-b space-y-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header & Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-hairline-b pb-4">
            <div>
              <div className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
                [SECTION 04] GROUND-TRUTH BENCHMARK SUITE
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                Proved Behavioral Accessibility Invariants
              </h2>
            </div>

            {/* List ⇄ Grid View Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#121316] border-hairline font-mono text-xs">
              <button
                type="button"
                onClick={() => setIndexView('list')}
                className={`px-3 py-1 uppercase tracking-wider transition-all ${
                  indexView === 'list'
                    ? 'bg-white text-black font-bold'
                    : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                }`}
              >
                LIST
              </button>
              <button
                type="button"
                onClick={() => setIndexView('grid')}
                className={`px-3 py-1 uppercase tracking-wider transition-all ${
                  indexView === 'grid'
                    ? 'bg-white text-black font-bold'
                    : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                }`}
              >
                GRID
              </button>
            </div>
          </div>

          {/* List View */}
          {indexView === 'list' ? (
            <div className="divide-y divide-[rgba(255,255,255,0.14)] border-hairline">
              {proofItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLaunchStudio(item.url, item.goal, 'keyboard')}
                  className="group py-5 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#121316] transition-all cursor-pointer"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <span className="font-mono text-xs text-[rgba(255,255,255,0.4)] group-hover:text-white">
                      {item.id}
                    </span>
                    <div>
                      <div className="font-bold text-base text-white group-hover:translate-x-2 transition-transform">
                        {item.name}
                      </div>
                      <div className="font-editorial-italic text-sm text-[rgba(255,255,255,0.65)]">
                        {item.italic}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="px-2 py-0.5 bg-[#0a0a0a] border-hairline text-[rgba(255,255,255,0.6)]">
                      {item.wcag}
                    </span>
                    <span className="px-2 py-0.5 bg-red-500/10 text-[#f43f5e] border border-red-500/20 font-bold">
                      SEV {item.severity}
                    </span>
                    <span className="hidden lg:inline text-[rgba(255,255,255,0.4)]">
                      {item.proof}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {proofItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLaunchStudio(item.url, item.goal, 'keyboard')}
                  className="p-6 bg-[#121316] border-hairline hover:border-white transition-all cursor-pointer space-y-4 group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-xs text-[rgba(255,255,255,0.4)]">
                      <span>{item.id}</span>
                      <span className="text-[#f43f5e] font-bold">SEV {item.severity}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-white transition-colors">
                      {item.name}
                    </h3>
                    <p className="font-editorial-italic text-xs text-[rgba(255,255,255,0.65)] leading-relaxed">
                      {item.italic}
                    </p>
                  </div>

                  <div className="pt-4 border-hairline-t flex items-center justify-between text-[11px] font-mono text-[rgba(255,255,255,0.5)]">
                    <span>{item.wcag}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 5.5 JOURNAL / ENGINEERING RFCS (design.md: 6 news items, category tags, hairline dividers) */}
      <section className="py-24 px-6 sm:px-12 border-hairline-b space-y-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <span className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
              [SECTION 05] ENGINEERING JOURNAL & RFCS
            </span>
            <span className="text-xs font-mono text-white">
              6 ARTICLES PUBLISHED
            </span>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.14)] border-hairline">
            {journalArticles.map((article) => (
              <div
                key={article.id}
                className="py-6 px-6 hover:bg-[#121316] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-xs font-mono text-[rgba(255,255,255,0.4)]">
                    <span>{article.id}</span>
                    <span>·</span>
                    <span>{article.date}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:translate-x-1.5 transition-transform">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[rgba(255,255,255,0.6)] max-w-2xl leading-relaxed">
                    {article.desc}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-[#0a0a0a] border-hairline text-xs font-mono text-white">
                    {article.category}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5.6 INFINITE KINETIC MARQUEE (design.md: 2 rows of giant words looping infinitely) */}
      <section className="py-16 border-hairline-b overflow-hidden space-y-4 bg-[#0a0a0a]">
        
        {/* Row 1: Forward Marquee */}
        <div className="animate-marquee whitespace-nowrap">
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.85)] tracking-wider">
            AMAZON BEDROCK NOVA MICRO &bull; PLAYWRIGHT CDP CHROME &bull; NEON PGVECTOR 768-D &bull; TARJAN SCC DIRECTED GRAPH &bull; KENDALL TAU CONCORDANCE &bull; PEARL SCM DO-CALCULUS &bull; WCAG 2.2 AAA INVARIANTS &bull;&nbsp;
          </span>
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.85)] tracking-wider">
            AMAZON BEDROCK NOVA MICRO &bull; PLAYWRIGHT CDP CHROME &bull; NEON PGVECTOR 768-D &bull; TARJAN SCC DIRECTED GRAPH &bull; KENDALL TAU CONCORDANCE &bull; PEARL SCM DO-CALCULUS &bull; WCAG 2.2 AAA INVARIANTS &bull;&nbsp;
          </span>
        </div>

        {/* Row 2: Reverse Marquee */}
        <div className="animate-marquee-reverse whitespace-nowrap">
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.35)] tracking-wider">
            VOICEOVER ACOUSTIC STREAM &bull; PARKINSON MOTOR TREMOR SIMULATOR &bull; CRYPTOGRAPHIC CAUSAL CERTIFICATES &bull; AWS S3 EVIDENCE VAULT &bull; SURGICAL AST REPAIR DIFFS &bull;&nbsp;
          </span>
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.35)] tracking-wider">
            VOICEOVER ACOUSTIC STREAM &bull; PARKINSON MOTOR TREMOR SIMULATOR &bull; CRYPTOGRAPHIC CAUSAL CERTIFICATES &bull; AWS S3 EVIDENCE VAULT &bull; SURGICAL AST REPAIR DIFFS &bull;&nbsp;
          </span>
        </div>

      </section>

      {/* 5.7 FOOTER (design.md: giant edge-to-edge split wordmark, legal, contact) */}
      <footer className="pt-20 pb-12 px-6 sm:px-12 space-y-16">
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-hairline-b pb-16">
          
          {/* Col 1: Mission statement */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#10b981]" />
              <span className="font-bold text-sm tracking-tight text-white uppercase">BarrierLens AI</span>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.65)] leading-relaxed max-w-md">
              The autonomous accessibility verification platform mathematically proving web barriers before production code ships. Deployed natively on Amazon Web Services.
            </p>
            <div className="text-[11px] font-mono text-[rgba(255,255,255,0.4)]">
              HOSTED AT: 43.205.254.136 (AWS AP-SOUTH-1)
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <div className="text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Workspaces</div>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/benchmark', 'Run default benchmark suite', 'keyboard')}
                  className="text-white hover:underline"
                >
                  &gt; Audit Studio Cockpit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/fixtures/keyboard-trap', 'Inspect Tarjan focus graph', 'keyboard')}
                  className="text-[rgba(255,255,255,0.7)] hover:text-white"
                >
                  &gt; Evidence & Tarjan Proofs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/fixtures/accname-wcag', 'Inspect Causal AST Patches', 'screen_reader')}
                  className="text-[rgba(255,255,255,0.7)] hover:text-white"
                >
                  &gt; Verified Causal Fixes
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Engineering Documentation */}
          <div className="md:col-span-4 space-y-3 font-mono text-xs">
            <div className="text-[rgba(255,255,255,0.4)] uppercase tracking-wider">System Specifications</div>
            <ul className="space-y-2">
              <li>
                <a href="/api/aws/status" target="_blank" rel="noreferrer" className="text-[rgba(255,255,255,0.7)] hover:text-white flex items-center gap-1.5">
                  <span>&gt; AWS Bedrock Telemetry API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/api/health" target="_blank" rel="noreferrer" className="text-[rgba(255,255,255,0.7)] hover:text-white flex items-center gap-1.5">
                  <span>&gt; Neon Postgres Health API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/api/backend/health" target="_blank" rel="noreferrer" className="text-[rgba(255,255,255,0.7)] hover:text-white flex items-center gap-1.5">
                  <span>&gt; Python ML FastAPI (:8000)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Giant Edge-to-Edge Split Wordmark (design.md: 5.7) */}
        <div className="max-w-7xl mx-auto overflow-hidden">
          <div className="flex flex-col sm:flex-row items-baseline justify-between select-none">
            <span className="headline-giant text-[clamp(4.5rem,14vw,14rem)] text-white leading-none">
              BARRIER
            </span>
            <span className="headline-giant text-[clamp(4.5rem,14vw,14rem)] text-[rgba(255,255,255,0.35)] leading-none">
              LENS
            </span>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[rgba(255,255,255,0.4)] pt-4 border-hairline-t">
          <div>
            &copy; 2026 Aaditya Uniyal. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>WCAG 2.2 LEVEL AAA</span>
            <span>EAA 2025 COMPLIANT</span>
            <span>AWS CLOUD NATIVE</span>
          </div>
        </div>

      </footer>

    </div>
  );
}
