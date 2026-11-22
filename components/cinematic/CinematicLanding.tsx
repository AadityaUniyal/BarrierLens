'use client';

import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { 
  ArrowRight, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles, 
  Volume2, 
  Layers, 
  Compass, 
  Code2, 
  FileCheck, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Lock, 
  GitPullRequest, 
  Check, 
  Keyboard, 
  Eye, 
  Terminal,
  ExternalLink,
  Laptop,
  CheckCheck,
  XCircle,
  HelpCircle
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
  const [trialGoal, setTrialGoal] = useState<string>('Test keyboard navigation and modal escape flow');
  const [trialPersona, setTrialPersona] = useState<PersonaType>('keyboard');

  // Hero Preview Active Tab
  const [previewTab, setPreviewTab] = useState<'keyboard' | 'diff' | 'voiceover' | 'report'>('keyboard');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive Focus Step Simulator
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isFixed, setIsFixed] = useState<boolean>(false);

  const handleNextStep = () => {
    if (activeStep === 1) setActiveStep(2);
    else if (activeStep === 2) setActiveStep(3);
    else if (activeStep === 3) {
      if (isFixed) setActiveStep(5); // Escaped cleanly!
      else setActiveStep(4); // Trapped in modal!
    } else if (activeStep === 4) {
      if (isFixed) setActiveStep(5);
      else setActiveStep(3); // Closed loop trap!
    } else {
      setActiveStep(1);
    }
  };

  const capabilities = [
    {
      icon: Keyboard,
      title: 'Interactive Keyboard Trap Testing',
      tag: 'WCAG 2.1.2 Level A',
      desc: 'Static scanners only check HTML attributes. BarrierLens navigates interactive pages like a real keyboard user, testing modals, drawers, and menus to ensure users are never trapped in a closed focus loop.',
      highlight: 'Zero false alarms on real focus paths'
    },
    {
      icon: Volume2,
      title: 'Screen Reader Voice Simulation',
      tag: 'WCAG 4.1.3 Level AA',
      desc: 'When a cart total updates or dynamic form validation fails without aria-live announcements, blind users receive zero feedback. BarrierLens simulates speech synthesizer output to catch assistive silences.',
      highlight: 'Catches dynamic unannounced errors'
    },
    {
      icon: Eye,
      title: 'Visual vs. Reading Order Concordance',
      tag: 'WCAG 1.3.2 Level A',
      desc: 'Responsive CSS flexbox and grid layouts often reverse visual cards while screen readers read them in the opposite sequence. BarrierLens detects reading order disconnects so all users experience a clear flow.',
      highlight: 'Layout concordance verification'
    },
    {
      icon: GitPullRequest,
      title: 'Automated Code Fixes & GitHub PRs',
      tag: 'GitHub Native Integration',
      desc: 'Instead of handing you a ticket with 100 vague warnings, BarrierLens generates surgical React and HTML code patches, automatically tests them for regressions, and opens a ready-to-merge GitHub pull request.',
      highlight: '1-click pull requests ready to merge'
    },
    {
      icon: ShieldCheck,
      title: 'Continuous CI/CD Guardrails',
      tag: 'EAA 2025 & ADA Compliant',
      desc: 'Integrate into GitHub Actions or GitLab CI. Every pull request is automatically tested across simulated assistive user journeys, preventing accessibility regressions before code merges into main.',
      highlight: 'Automated pre-merge compliance gates'
    },
    {
      icon: Layers,
      title: 'Certified Compliance Audit Trail',
      tag: 'Executive Legal Protection',
      desc: 'Generate comprehensive, timestamped compliance audit ledgers mapped to WCAG 2.2 Level AAA, the European Accessibility Act (EAA 2025), and Section 508 for your legal and compliance teams.',
      highlight: 'Audit-ready legal documentation'
    }
  ];

  const comparisonRows = [
    {
      feature: 'Keyboard Trap Detection in Modals & Drawers',
      barrierlens: 'Interactive Traversal (Tests Escape & Tab)',
      linters: 'Checks static HTML tags only (Misses real traps)',
      overlays: 'Fails to fix (often introduces new traps)'
    },
    {
      feature: 'Visual vs. Screen Reader Reading Order',
      barrierlens: '2D Layout Concordance Analysis',
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
      barrierlens: 'Surgical code diffs with 1-click GitHub PR',
      linters: 'Generic documentation links only',
      overlays: 'Temporary runtime JS DOM monkey-patching'
    },
    {
      feature: 'Legal Compliance (EAA 2025 & ADA)',
      barrierlens: 'Source-code audit documentation',
      linters: 'Insufficient for legal defense',
      overlays: 'Rejected in US & EU federal courts'
    }
  ];

  const pricingTiers = [
    {
      name: 'Developer Sandbox',
      price: '$0',
      period: 'free forever',
      desc: 'Ideal for personal projects, indie hackers, and exploring interactive accessibility testing.',
      features: [
        '10 autonomous user journey audits / month',
        'Interactive keyboard trap detection',
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
      desc: 'Continuous accessibility testing, automated GitHub pull requests, and real-time alerts.',
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
      desc: 'For high-scale engineering organizations requiring dedicated environments and custom SLAs.',
      features: [
        'Dedicated isolated cloud environment',
        'Custom assistive persona journey training',
        'SAML 2.0 / Okta / Azure AD SSO',
        'Executive legal compliance audit ledgers',
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
      
      {/* Subtle Ambient Radial Lighting */}
      <div className="ambient-mesh pointer-events-none" />

      {/* 1. HERO SECTION: Airy, balanced, confident */}
      <section className="relative pt-24 pb-20 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto text-center space-y-8">
        
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121316] border border-white/10 text-xs font-mono text-[rgba(255,255,255,0.7)] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-white font-medium">BarrierLens 2.0</span>
          <span className="text-white/30">&bull;</span>
          <span>Automated Accessibility Verification</span>
        </div>

        {/* Master Headline: Large, legible, balanced */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] font-display">
            Prove what locks them out. <br />
            <span className="font-editorial-italic font-normal text-[rgba(255,255,255,0.75)]">
              Fix it before you ship.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[rgba(255,255,255,0.65)] max-w-2xl mx-auto leading-relaxed">
            Over 60% of critical accessibility barriers—from modal keyboard traps to silent screen reader errors—slip past static linters. BarrierLens tests your product like real humans with assistive needs do, and generates verified code fixes with zero false alarms.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              if (onOpenAuth) onOpenAuth();
              else onLaunchStudio(trialUrl, trialGoal, trialPersona);
            }}
            className="w-full sm:w-auto px-7 py-3 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onLaunchStudio('/benchmark', 'Test modal keyboard focus escape', 'keyboard', true)}
            className="w-full sm:w-auto px-6 py-3 bg-[#121316] hover:bg-[#1a1c20] text-white text-sm font-medium rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-all"
          >
            <span>Explore Live Sandbox</span>
          </button>
        </div>

        {/* Live URL Audit Omnibar */}
        <div className="pt-6 max-w-2xl mx-auto">
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#121316]/90 border border-white/10 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-[#07080b] rounded-lg border border-white/5">
              <Compass className="w-4 h-4 text-white/40 shrink-0" />
              <input
                type="text"
                value={trialUrl}
                onChange={(e) => setTrialUrl(e.target.value)}
                placeholder="Enter URL to test (e.g. https://your-site.com or /benchmark)"
                className="w-full bg-transparent text-xs sm:text-sm font-mono text-white placeholder-white/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Persona Switcher with sliding pill physics */}
              <SegmentedControl<PersonaType>
                options={[
                  { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
                  { id: 'screen_reader', label: 'VoiceOver', icon: Volume2 },
                ]}
                value={trialPersona}
                onChange={setTrialPersona}
                size="sm"
              />

              {/* Run Audit Button */}
              <button
                type="button"
                onClick={() => onLaunchStudio(trialUrl, trialGoal, trialPersona, true)}
                className="px-5 py-2 bg-white hover:bg-white/90 active:scale-[0.98] text-black text-xs font-semibold rounded-lg shrink-0 transition-all shadow-sm"
              >
                Test
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* 2. PRODUCT PREVIEW WINDOW: High-fidelity, calm, glassmorphic cockpit */}
      <section className="px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto pb-24">
        <div className="rounded-2xl border border-white/10 bg-[#0c0d10] shadow-2xl overflow-hidden">
          
          {/* Window Chrome Header */}
          <div className="px-4 py-3 bg-[#121316] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-xs font-mono text-white/50 ml-2">Interactive Verification Cockpit</span>
            </div>

            {/* Window Tabs */}
            <div className="flex items-center gap-1 bg-[#07080b] p-1 rounded-lg border border-white/5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setPreviewTab('keyboard')}
                className={`px-3 py-1 rounded-md transition-all ${
                  previewTab === 'keyboard'
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Keyboard Path
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('diff')}
                className={`px-3 py-1 rounded-md transition-all ${
                  previewTab === 'diff'
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Code Fix PR
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('voiceover')}
                className={`px-3 py-1 rounded-md transition-all ${
                  previewTab === 'voiceover'
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Voice Transcript
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('report')}
                className={`px-3 py-1 rounded-md transition-all ${
                  previewTab === 'report'
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Compliance Score
              </button>
            </div>
          </div>

          {/* Window Canvas Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Tab 1: Keyboard Path */}
            {previewTab === 'keyboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-mono text-white/60 border-b border-white/5 pb-3">
                  <span>LIVE TRAVERSAL: MODAL DIALOG FOCUS</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    KEYBOARD TRAP DETECTED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-[#121316] border border-white/5 space-y-1 text-center">
                    <span className="text-[10px] font-mono text-white/40">STEP 1</span>
                    <p className="text-sm font-semibold text-white">#nav-link</p>
                    <span className="text-xs text-emerald-400 font-mono">Tab &rarr; Next</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#121316] border border-white/5 space-y-1 text-center">
                    <span className="text-[10px] font-mono text-white/40">STEP 2</span>
                    <p className="text-sm font-semibold text-white">#open-modal-btn</p>
                    <span className="text-xs text-emerald-400 font-mono">Enter &rarr; Open</span>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1 text-center">
                    <span className="text-[10px] font-mono text-rose-400 font-semibold">STEP 3 (TRAPPED)</span>
                    <p className="text-sm font-semibold text-white">#newsletter-modal</p>
                    <span className="text-xs text-rose-400 font-mono">Tab &rarr; #claim-btn</span>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1 text-center">
                    <span className="text-[10px] font-mono text-rose-400 font-semibold">STEP 4 (LOOP)</span>
                    <p className="text-sm font-semibold text-white">#claim-btn</p>
                    <span className="text-xs text-rose-400 font-mono">Escape key ignored!</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121316] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/70">
                  <span className="font-mono">Tested Keystroke Path: [Tab &rarr; Tab &rarr; Enter &rarr; Tab &rarr; Escape]</span>
                  <button
                    type="button"
                    onClick={() => onLaunchStudio('/fixtures/keyboard-trap', 'Test modal keyboard focus escape', 'keyboard')}
                    className="text-white hover:underline font-semibold flex items-center gap-1.5"
                  >
                    <span>Run in Audit Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Code Diff PR */}
            {previewTab === 'diff' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-white/60 border-b border-white/5 pb-3">
                  <span>AUTOMATED CODE FIX &middot; ZERO REGRESSION</span>
                  <span className="text-emerald-400 font-semibold">READY TO MERGE</span>
                </div>

                <div className="p-4 rounded-xl bg-[#07080b] border border-white/5 font-mono text-xs leading-relaxed overflow-x-auto space-y-1">
                  <div className="text-rose-400">- &lt;div id=&quot;newsletter-modal&quot; className=&quot;modal-overlay&quot;&gt;</div>
                  <div className="text-emerald-400">+ &lt;div id=&quot;newsletter-modal&quot; role=&quot;dialog&quot; aria-modal=&quot;true&quot; onKeyDown=&#123;handleEscape&#125; className=&quot;modal-overlay&quot;&gt;</div>
                  <div className="text-white/40">    &lt;h2&gt;Subscribe for News&lt;/h2&gt;</div>
                  <div className="text-rose-400">-   &lt;button id=&quot;close-btn&quot;&gt;&lt;CloseIcon /&gt;&lt;/button&gt;</div>
                  <div className="text-emerald-400">+   &lt;button id=&quot;close-btn&quot; aria-label=&quot;Close dialog and restore focus&quot;&gt;&lt;CloseIcon /&gt;&lt;/button&gt;</div>
                  <div className="text-white/40">  &lt;/div&gt;</div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/60 pt-1">
                  <span>Fixes WCAG 2.1.2 (Keyboard Trap) and WCAG 4.1.2 (Name/Role/Value)</span>
                  <button
                    type="button"
                    onClick={() => onLaunchStudio('/fixtures/accname-wcag', 'Review verified code diff', 'screen_reader')}
                    className="text-white hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Export to GitHub PR</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Voice Transcript */}
            {previewTab === 'voiceover' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-white/60 border-b border-white/5 pb-3">
                  <span>SCREEN READER SIMULATION TRANSCRIPT</span>
                  <span className="text-amber-400 font-semibold">SPEECH GAP DETECTED</span>
                </div>

                <div className="p-4 rounded-xl bg-[#07080b] border border-white/5 space-y-3 text-xs leading-relaxed">
                  <div className="flex items-start gap-3">
                    <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">&quot;Special Promotion, dialog opened.&quot;</strong> &mdash; User activated button.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
                    <Volume2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>[Assistive Silence]:</strong> Dynamic discount applied, total changed from $100 to $80. Because aria-live is absent, screen reader users receive zero speech announcement.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Compliance Report */}
            {previewTab === 'report' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-white/60 border-b border-white/5 pb-3">
                  <span>AUDIT SUMMARY &middot; EXECUTIVE REPORT</span>
                  <span className="text-emerald-400 font-semibold">14/14 INVARIANTS CHECKED</span>
                </div>

                <div className="p-4 rounded-xl bg-[#07080b] border border-white/5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">Target Journey</span>
                    <span className="text-white font-medium">Checkout &amp; Onboarding Flow</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">Compliance Rating</span>
                    <span className="text-emerald-400 font-semibold">WCAG 2.2 Level AAA Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Legal Jurisdiction</span>
                    <span className="text-white">European Accessibility Act (EAA 2025) &amp; ADA §508</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 3. TRUST & STANDARDS BAR: Subtle, calm, credible */}
      <section className="py-12 border-y border-white/5 bg-[#0a0a0d]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <p className="text-xs uppercase tracking-widest font-mono text-white/40">
            Engineered to meet international accessibility mandates &amp; legal standards
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-mono text-white/70">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
              W3C WCAG 2.2 (A, AA, AAA)
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
              European Accessibility Act (EAA 2025)
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
              ADA Title III &amp; Section 508
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
              Zero False Alarms Guarantee
            </span>
          </div>
        </div>
      </section>

      {/* 4. THE CORE PROBLEM VS SOLUTION: Clean 2-column contrast */}
      <section className="py-28 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-16">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            Why Traditional Tools Fail
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Linters inspect code tags. <br />
            Real humans navigate interactive states.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Over 96% of top websites fail accessibility guidelines because passive tools cannot simulate actual keyboard and screen reader behavior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Traditional Linters */}
          <div className="p-8 rounded-2xl bg-[#121316] border border-rose-500/20 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase tracking-wider">
                Traditional Linters &amp; Overlays
              </span>
              <h3 className="text-xl font-bold text-white">Passive HTML Scanners</h3>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-white/70">
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Only inspects static HTML strings; misses dynamic modals and SPAs.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Over 40% false-alarm noise that exhausts engineering teams.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Cannot press keys, verify escape handlers, or hear voice output.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Leaves your business exposed to EAA 2025 legal compliance fines.</span>
              </li>
            </ul>
          </div>

          {/* Card 2: BarrierLens Solution */}
          <div className="p-8 rounded-2xl bg-[#121316] border border-emerald-500/30 space-y-6 relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[#10b981] font-semibold uppercase tracking-wider">
                The BarrierLens Advantage
              </span>
              <h3 className="text-xl font-bold text-white">Autonomous Behavioral Verification</h3>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-white/70">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                <span>Navigates full interactive user journeys under real assistive constraints.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                <span>Zero false alarms: every report is backed by reproducible keystroke evidence.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                <span>Automatically synthesizes verified React &amp; HTML code fixes.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                <span>Opens ready-to-merge GitHub pull requests with full test re-verification.</span>
              </li>
            </ul>
          </div>

        </div>

      </section>

      {/* 5. BENTO GRID OF CORE CAPABILITIES */}
      <section id="proofs" className="py-24 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-16">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            Comprehensive Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Built for modern engineering teams.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            From single-page applications to enterprise design systems, BarrierLens automates accessibility at every stage of development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div 
                key={i}
                className="p-8 rounded-2xl bg-[#121316] border border-white/5 hover:border-white/15 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-wider">
                      {cap.tag}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {cap.title}
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-white/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span>{cap.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* 6. HOW IT WORKS: 3 SIMPLE STEPS */}
      <section id="how-it-works" className="py-24 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-16 border-t border-white/5">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            Simple Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            From URL to verified code fix in minutes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
            <span className="text-xs font-mono font-bold text-[#10b981]">STEP 01</span>
            <h3 className="text-lg font-bold text-white">Connect URL or Repository</h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Enter any staging or production domain, or install the BarrierLens GitHub App. Select the assistive personas you want to evaluate.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
            <span className="text-xs font-mono font-bold text-[#10b981]">STEP 02</span>
            <h3 className="text-lg font-bold text-white">Autonomous Traversal</h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              BarrierLens navigates multi-step flows: testing modals, forms, and responsive drawers for focus traps and speech dropouts.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
            <span className="text-xs font-mono font-bold text-[#10b981]">STEP 03</span>
            <h3 className="text-lg font-bold text-white">Merge 1-Click Code Fixes</h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Review verified React and HTML code diffs. Each fix is tested for zero regressions and ready to merge directly in GitHub.
            </p>
          </div>
        </div>

      </section>



      {/* 8. FEATURE COMPARISON MATRIX */}
      <section id="comparison" className="py-24 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-12 border-t border-white/5">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            Detailed Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            How BarrierLens compares to alternatives
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#121316]">
          <table className="w-full text-left font-sans text-xs sm:text-sm divide-y divide-white/5">
            <thead>
              <tr className="bg-[#181a1d] text-white/70 text-xs uppercase tracking-wider font-mono">
                <th className="p-5 font-semibold">Capability</th>
                <th className="p-5 bg-white text-black font-bold">BarrierLens 2.0</th>
                <th className="p-5 font-semibold text-white/70">Static Linters</th>
                <th className="p-5 font-semibold text-white/70">Overlay Widgets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
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

      {/* 9. TRANSPARENT PRICING & TIERS */}
      <section id="pricing" className="py-24 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-16 border-t border-white/5">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Predictable plans for teams of any size.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Start free, verify your first user journey, and upgrade when your team needs automated GitHub pull requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, idx) => (
            <div 
              key={idx}
              className={`p-8 rounded-2xl border flex flex-col justify-between space-y-8 ${
                tier.highlight 
                  ? 'bg-[#14161b] border-white/30 shadow-2xl relative' 
                  : 'bg-[#121316] border-white/5'
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

                <div className="pt-6 border-t border-white/5 space-y-3 text-xs text-white/80">
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
                className={`w-full py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
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

      {/* 10. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-24 px-6 sm:px-8 lg:px-12 max-w-4xl mx-auto space-y-12 border-t border-white/5">
        
        <div className="text-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Common questions about BarrierLens
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-xl border border-white/5 bg-[#121316] overflow-hidden transition-colors"
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
                <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* 11. FINAL HIGH-CONVERTING CTA BANNER */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#14161b] to-[#0e1013] border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
              Make your web app accessible to every human.
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Start auditing your web application in seconds. Zero credit card required.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else onLaunchStudio(trialUrl, trialGoal, trialPersona);
              }}
              className="px-8 py-3.5 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onLaunchStudio('/benchmark', 'Test modal keyboard focus escape', 'keyboard')}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-all"
            >
              Explore Sandbox
            </button>
          </div>
        </div>
      </section>

      {/* 12. CLEAN, AIRY ENTERPRISE FOOTER */}
      <footer className="pt-16 pb-12 px-6 sm:px-8 lg:px-12 border-t border-white/5 bg-[#0a0a0d] text-xs text-white/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/5">
          
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

        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
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
