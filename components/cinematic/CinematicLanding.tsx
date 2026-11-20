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
  ExternalLink,
  Code2,
  FileCheck,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Lock,
  GitPullRequest,
  Check,
  Keyboard,
  Eye,
  Sliders,
  MousePointerClick
} from 'lucide-react';
import { PersonaType } from '@/lib/barrierlens/types';

interface CinematicLandingProps {
  onLaunchStudio: (targetUrl?: string, goal?: string, persona?: PersonaType) => void;
  onSelectBenchmark: (url: string, goal: string) => void;
  onOpenAuth?: () => void;
}

export function CinematicLanding({ 
  onLaunchStudio, 
  onSelectBenchmark,
  onOpenAuth 
}: CinematicLandingProps) {
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
  const [trialGoal, setTrialGoal] = useState<string>('Test keyboard navigation and modal escape flow');
  const [trialPersona, setTrialPersona] = useState<PersonaType>('keyboard');

  // Hero Proof Preview Active Tab
  const [heroProofTab, setHeroProofTab] = useState<'focus' | 'diff' | 'screenreader' | 'report'>('focus');

  // Featured Slide State (1/5)
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Index List vs Grid View Toggle
  const [indexView, setIndexView] = useState<'list' | 'grid'>('list');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive Focus Trap Demo State
  const [focusStep, setFocusStep] = useState<number>(1);
  const [isTrapEscaped, setIsTrapEscaped] = useState<boolean>(false);

  const handleNextFocusStep = () => {
    if (focusStep === 1) setFocusStep(2);
    else if (focusStep === 2) setFocusStep(3);
    else if (focusStep === 3) {
      if (isTrapEscaped) {
        setFocusStep(5); // Clean escape back to root
      } else {
        setFocusStep(4); // Into trap button
      }
    } else if (focusStep === 4) {
      if (isTrapEscaped) {
        setFocusStep(5);
      } else {
        setFocusStep(3); // Trapped in closed loop!
      }
    } else {
      setFocusStep(1);
    }
  };

  const featureSlides = [
    {
      num: '01',
      chunks: ['KEY', 'BOARD', 'TRAP'],
      title: 'Interactive Keyboard Trap Detection',
      italicTag: 'Verify that modal overlays, drawers, and menus can be escaped.',
      desc: 'Static code scanners cannot tell whether a user can actually tab out of an element. BarrierLens navigates interactive web pages like a keyboard-only user, testing modal dialogs, slide-out carts, and responsive menus to guarantee that focus is never permanently trapped.',
      metric: '0 False Alarms',
      metricLabel: 'Verified Behavioral Evidence',
      badge: 'WCAG 2.1.2 Level A',
      actionUrl: '/fixtures/keyboard-trap',
      actionGoal: 'Verify modal keyboard escape flow'
    },
    {
      num: '02',
      chunks: ['FLOW', 'CONCORD', 'ANCE'],
      title: 'Visual vs. Assistive Reading Order',
      italicTag: 'Ensure responsive CSS layouts match screen reader reading flow.',
      desc: 'Modern CSS flexbox and grid layouts frequently display content in one visual sequence while screen readers read it in a completely inverted order. BarrierLens detects spatial reading order disconnects so all users experience a coherent narrative.',
      metric: 'Rank Aligned',
      metricLabel: 'Reading Order Integrity',
      badge: 'WCAG 1.3.2 Level A',
      actionUrl: '/fixtures/disordered-unreachable',
      actionGoal: 'Check reading order concordance on responsive layouts'
    },
    {
      num: '03',
      chunks: ['VOICE', 'LIVE', 'SPEECH'],
      title: 'Screen Reader Voice Simulation',
      italicTag: 'Catch silent form errors and unannounced checkout updates.',
      desc: 'When a shopping cart total updates or an inline validation message appears dynamically without live region announcements, blind and low-vision users receive zero feedback. BarrierLens simulates the screen reader voice output to catch assistive silences.',
      metric: 'Real-Time Alert',
      metricLabel: 'Dynamic Change Announcement',
      badge: 'WCAG 4.1.3 Level AA',
      actionUrl: '/benchmark',
      actionGoal: 'Verify live announcements of dynamic errors'
    },
    {
      num: '04',
      chunks: ['AUTO', 'CODE', 'FIXES'],
      title: 'Verified Code Fixes & GitHub Pull Requests',
      italicTag: 'Surgical React and HTML patches ready to merge with one click.',
      desc: 'Traditional accessibility audits give you hundreds of confusing error tickets. BarrierLens synthesizes clean, minimal code patches (e.g., adding missing ARIA tags, restoring escape key handlers) and tests them before opening a ready-to-merge GitHub pull request.',
      metric: '1-Click Merge',
      metricLabel: 'Zero Regression Code Patches',
      badge: 'GitHub Native Integration',
      actionUrl: '/fixtures/accname-wcag',
      actionGoal: 'Review verified accessibility code diff'
    },
    {
      num: '05',
      chunks: ['CI/CD', 'GUARD', 'RAILS'],
      title: 'Continuous CI/CD Compliance Guardrails',
      italicTag: 'Catch accessibility regressions in staging before production deploy.',
      desc: 'Integrate BarrierLens directly into your GitHub Actions or deployment pipeline. Every new pull request is automatically tested across simulated user journeys, ensuring your web application stays permanently compliant as your product evolves.',
      metric: 'Pre-Merge Gate',
      metricLabel: 'Continuous Compliance Ledger',
      badge: 'EAA 2025 & WCAG 2.2 Ready',
      actionUrl: '/benchmark',
      actionGoal: 'Run automated compliance pipeline test'
    }
  ];

  const proofItems = [
    {
      id: '01',
      name: 'Modal Dialog Keyboard Trap',
      italic: 'Escape key ignored; Tab navigation loops inside overlay indefinitely',
      wcag: 'WCAG 2.1.2 Level A',
      severity: 'Critical',
      impact: 'Blocks keyboard-only users from continuing',
      url: '/fixtures/keyboard-trap',
      goal: 'Test newsletter modal escape and keyboard focus return'
    },
    {
      id: '02',
      name: 'Unlabeled Icon Action Button',
      italic: 'Interactive SVG button has no accessible text name',
      wcag: 'WCAG 4.1.2 Level A',
      severity: 'High',
      impact: 'Screen readers announce &quot;Button&quot; with no purpose',
      url: '/fixtures/accname-wcag',
      goal: 'Identify and test unlabeled drawer dismiss icon buttons'
    },
    {
      id: '03',
      name: 'Visual vs. Assistive Reading Inversion',
      italic: 'CSS flex-direction reverses visual cards while DOM order is backward',
      wcag: 'WCAG 1.3.2 Level A',
      severity: 'Medium',
      impact: 'Low-vision and screen reader users hear content in wrong order',
      url: '/fixtures/disordered-unreachable',
      goal: 'Evaluate reading order concordance across responsive grid'
    },
    {
      id: '04',
      name: 'Silent Form Validation Error',
      italic: 'Error banner appears dynamically without screen reader alert',
      wcag: 'WCAG 4.1.3 Level AA',
      severity: 'High',
      impact: 'User cannot tell why submit button was disabled',
      url: '/benchmark',
      goal: 'Submit invalid payload and verify screen reader announcement'
    },
    {
      id: '05',
      name: 'Focus Drop on Modal Close',
      italic: 'Closing slide-out cart dumps focus onto the document root',
      wcag: 'WCAG 2.4.3 Level A',
      severity: 'Medium',
      impact: 'Keyboard users lose their place on the page',
      url: '/fixtures/focus-loss',
      goal: 'Open slide-out drawer, close it, and check focus return'
    },
    {
      id: '06',
      name: 'Small Touch & Click Target Size',
      italic: 'Action button smaller than 24x24px minimum touch boundary',
      wcag: 'WCAG 2.5.8 Level AA',
      severity: 'Medium',
      impact: 'Causes missed taps for users with motor tremors or mobile screens',
      url: '/benchmark',
      goal: 'Measure touch target bounding boxes against accessibility criteria'
    }
  ];

  const comparisonRows = [
    {
      feature: 'Keyboard Trap Detection (Modals & Drawers)',
      barrierlens: 'Interactive User Journey Simulation',
      linters: 'Checks static HTML only (Misses real traps)',
      overlays: 'Fails to fix (often adds more traps)'
    },
    {
      feature: 'Visual vs Screen Reader Reading Order',
      barrierlens: 'Automated 2D Layout Concordance Check',
      linters: 'Not supported',
      overlays: 'Not supported'
    },
    {
      feature: 'Screen Reader Speech Voice Verification',
      barrierlens: 'Live Speech Synthesizer Simulation',
      linters: 'Checks static aria-live attribute text',
      overlays: 'Superficial text-to-speech widget'
    },
    {
      feature: 'False Positive Ratio',
      barrierlens: 'Zero false alarms on verified user flows',
      linters: '30% – 50% warning noise that slows teams',
      overlays: 'Creates user confusion & breaks UI'
    },
    {
      feature: 'Automated Code Fixes & GitHub PRs',
      barrierlens: 'Surgical code diffs with 1-click merge',
      linters: 'Generic documentation links only',
      overlays: 'Temporary runtime JS patches only'
    },
    {
      feature: 'EAA 2025 & ADA Legal Defense',
      barrierlens: 'Full source-code compliance documentation',
      linters: 'Insufficient for legal compliance',
      overlays: 'Rejected in US & EU federal courts'
    }
  ];

  const pricingTiers = [
    {
      name: 'Developer Sandbox',
      price: '$0',
      period: 'free forever',
      desc: 'Test your personal projects and explore interactive accessibility verification.',
      features: [
        '10 autonomous user journey audits / mo',
        'Interactive keyboard focus trap testing',
        'Ground-truth benchmark testbeds',
        'Visual DOM and code diff previews',
        'Community support & documentation'
      ],
      cta: 'Start Free Sandbox',
      popular: false,
      highlight: false
    },
    {
      name: 'Team Pro',
      price: '$79',
      period: 'per month',
      desc: 'Continuous accessibility testing, automated GitHub pull requests, and compliance alerts.',
      features: [
        'Unlimited autonomous user journey audits',
        'Automated code fixes & 1-click GitHub PRs',
        'Screen reader voice synthesis simulation',
        'Visual vs assistive reading order analysis',
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
      desc: 'For enterprise engineering organizations requiring dedicated environments and custom SLAs.',
      features: [
        'Dedicated isolated cloud environment',
        'Custom assistive persona training',
        'SAML 2.0 / Okta / Azure AD SSO',
        'Executive legal compliance audit ledgers',
        '99.99% uptime SLA & dedicated solutions team',
        'Custom enterprise CI/CD integration'
      ],
      cta: 'Contact Sales',
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#ffffff] font-sans selection:bg-white selection:text-black">
      
      {/* 1. HERO SECTION: Value proposition, punchy editorial headline, and Quick Audit Omnibar */}
      <section className="min-h-screen relative flex flex-col justify-between pt-16 pb-12 px-6 sm:px-12 border-hairline-b">
        
        {/* Top Metadata Header Line */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono uppercase tracking-widest text-[rgba(255,255,255,0.6)] pt-4 pb-8 border-hairline-b">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#10b981]" />
            <span className="text-white font-bold">BARRIERLENS 2.0</span>
            <span>&middot;</span>
            <span>AUTONOMOUS ACCESSIBILITY VERIFICATION</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden md:inline">WCAG 2.2 LEVEL AAA</span>
            <span className="hidden md:inline">EAA 2025 COMPLIANT</span>
            <span className="text-white">STATUS: OPERATIONAL</span>
          </div>
        </div>

        {/* 4 Stacked Headline Lines */}
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
              BEFORE YOU SHIP.
            </h1>
          </div>
        </div>

        {/* Subcopy & Interactive Omnibar */}
        <div className="space-y-8 pt-6 border-hairline-t">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            
            {/* Subcopy text */}
            <div className="lg:col-span-5 space-y-4">
              <p className="text-sm sm:text-base text-[rgba(255,255,255,0.65)] leading-relaxed max-w-lg">
                Traditional linters only inspect static HTML tags and miss over 60% of real accessibility barriers. BarrierLens tests your product like real humans with assistive needs do—detecting keyboard traps, screen reader dropouts, and reading order disconnects—then generates verified code fixes.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[rgba(255,255,255,0.5)]">
                <span>[01] REAL INTERACTIVE TESTING</span>
                <span>[02] 0% FALSE ALARMS</span>
                <span>[03] 1-CLICK GITHUB PRS</span>
              </div>
            </div>

            {/* Live Audit Quick Launcher Omnibar */}
            <div className="lg:col-span-7">
              <div className="p-4 bg-[#121316] border-hairline space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center gap-2 px-3 py-2.5 bg-[#0a0a0a] border-hairline">
                    <Compass className="w-4 h-4 text-[rgba(255,255,255,0.4)] shrink-0" />
                    <input
                      type="text"
                      value={trialUrl}
                      onChange={(e) => setTrialUrl(e.target.value)}
                      placeholder="Enter target URL (e.g. https://your-site.com or /benchmark)"
                      className="w-full bg-transparent text-xs font-mono text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none"
                    />
                  </div>

                  {/* Persona Selector */}
                  <div className="flex items-center bg-[#0a0a0a] p-1 border-hairline w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setTrialPersona('keyboard')}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        trialPersona === 'keyboard'
                          ? 'bg-white text-black font-bold'
                          : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                      }`}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Keyboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrialPersona('screen_reader')}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        trialPersona === 'screen_reader'
                          ? 'bg-white text-black font-bold'
                          : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>VoiceOver</span>
                    </button>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    onClick={() => onLaunchStudio(trialUrl, trialGoal, trialPersona)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-[rgba(255,255,255,0.85)] text-black text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shrink-0"
                  >
                    <span>TEST SITE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Ground-Truth Quick Presets */}
                <div className="flex flex-wrap items-center justify-between text-xs px-1 text-[rgba(255,255,255,0.5)] font-mono">
                  <span className="text-[11px] uppercase tracking-wider">Try Interactive Testbeds:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTrialUrl('/benchmark');
                        onLaunchStudio('/benchmark', 'Test modal keyboard focus escape', 'keyboard');
                      }}
                      className="hover:text-white underline underline-offset-4 text-[11px]"
                    >
                      [Modal Dialog Trap]
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrialUrl('/fixtures/accname-wcag');
                        onLaunchStudio('/fixtures/accname-wcag', 'Find unlabeled action buttons', 'screen_reader');
                      }}
                      className="hover:text-white underline underline-offset-4 text-[11px]"
                    >
                      [Unlabeled Action Button]
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrialUrl('/fixtures/disordered-unreachable');
                        onLaunchStudio('/fixtures/disordered-unreachable', 'Check responsive reading order', 'keyboard');
                      }}
                      className="hover:text-white underline underline-offset-4 text-[11px]"
                    >
                      [Reading Order Inversion]
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 2. INTERACTIVE PRODUCT COCKPIT PREVIEW (Show What the User Actually Sees) */}
      <section className="py-16 px-6 sm:px-12 border-hairline-b bg-[#07080a]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-hairline-b pb-4">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-widest text-[#10b981] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span>Interactive Audit Cockpit</span>
              </div>
              <h2 className="text-xl font-bold font-mono uppercase text-white">
                How BarrierLens Verifies Your Product
              </h2>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#121316] border-hairline font-mono text-xs">
              <button
                type="button"
                onClick={() => setHeroProofTab('focus')}
                className={`px-3 py-1 uppercase tracking-wider transition-all ${
                  heroProofTab === 'focus' ? 'bg-white text-black font-bold' : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                }`}
              >
                Keyboard Path
              </button>
              <button
                type="button"
                onClick={() => setHeroProofTab('diff')}
                className={`px-3 py-1 uppercase tracking-wider transition-all ${
                  heroProofTab === 'diff' ? 'bg-white text-black font-bold' : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                }`}
              >
                Code Fix PR
              </button>
              <button
                type="button"
                onClick={() => setHeroProofTab('screenreader')}
                className={`px-3 py-1 uppercase tracking-wider transition-all ${
                  heroProofTab === 'screenreader' ? 'bg-white text-black font-bold' : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                }`}
              >
                Voice Transcript
              </button>
              <button
                type="button"
                onClick={() => setHeroProofTab('report')}
                className={`px-3 py-1 uppercase tracking-wider transition-all ${
                  heroProofTab === 'report' ? 'bg-white text-black font-bold' : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                }`}
              >
                Audit Report
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="p-6 bg-[#0e1013] border-hairline font-mono text-xs space-y-4">
            
            {/* Tab 1: Keyboard Path */}
            {heroProofTab === 'focus' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] text-[rgba(255,255,255,0.5)]">
                  <span>LIVE KEYBOARD NAVIGATION TRAVERSAL</span>
                  <span className="text-[#f43f5e] font-bold">FOCUS TRAP DETECTED: #newsletter-modal</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-4 bg-[#14161b] border-hairline">
                    <div className="text-[10px] text-[rgba(255,255,255,0.4)]">STEP 1</div>
                    <div className="font-bold text-white mt-1">#nav-link</div>
                    <div className="text-[10px] text-[#10b981] mt-1">Tab &rarr; Next Input</div>
                  </div>
                  <div className="p-4 bg-[#14161b] border-hairline">
                    <div className="text-[10px] text-[rgba(255,255,255,0.4)]">STEP 2</div>
                    <div className="font-bold text-white mt-1">#open-modal-btn</div>
                    <div className="text-[10px] text-[#10b981] mt-1">Enter &rarr; Opens Modal</div>
                  </div>
                  <div className="p-4 bg-red-950/30 border border-red-500/40">
                    <div className="text-[10px] text-red-400 font-bold">STEP 3 (TRAPPED)</div>
                    <div className="font-bold text-white mt-1">#newsletter-modal</div>
                    <div className="text-[10px] text-red-400 mt-1">Tab &rarr; #confirm-btn</div>
                  </div>
                  <div className="p-4 bg-red-950/30 border border-red-500/40">
                    <div className="text-[10px] text-red-400 font-bold">STEP 4 (CLOSED LOOP)</div>
                    <div className="font-bold text-white mt-1">#confirm-btn</div>
                    <div className="text-[10px] text-red-400 mt-1">Escape key is ignored!</div>
                  </div>
                </div>
                <div className="p-3 bg-[#0a0a0a] border-hairline text-[11px] text-[rgba(255,255,255,0.6)] flex items-center justify-between">
                  <span>Tested Keystrokes: [Tab &rarr; Tab &rarr; Enter &rarr; Tab &rarr; Escape]</span>
                  <button 
                    type="button"
                    onClick={() => onLaunchStudio('/fixtures/keyboard-trap', 'Test modal keyboard focus escape', 'keyboard')}
                    className="text-white hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Run in Audit Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Code Diff PR */}
            {heroProofTab === 'diff' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[rgba(255,255,255,0.5)]">
                  <span>AUTOMATED CODE FIX &middot; READY TO MERGE</span>
                  <span className="text-[#10b981] font-bold">ZERO REGRESSION CONFIRMED</span>
                </div>
                <div className="bg-[#0a0a0a] p-4 border-hairline overflow-x-auto text-[11px] leading-relaxed">
                  <div className="text-red-400">- &lt;div id=&quot;newsletter-modal&quot; className=&quot;modal-overlay&quot;&gt;</div>
                  <div className="text-[#10b981]">+ &lt;div id=&quot;newsletter-modal&quot; role=&quot;dialog&quot; aria-modal=&quot;true&quot; onKeyDown=&#123;handleEscapeKey&#125; className=&quot;modal-overlay&quot;&gt;</div>
                  <div className="text-[rgba(255,255,255,0.4)]">    &lt;h2&gt;Sign Up for Updates&lt;/h2&gt;</div>
                  <div className="text-red-400">-   &lt;button id=&quot;close-btn&quot;&gt;&lt;CloseIcon /&gt;&lt;/button&gt;</div>
                  <div className="text-[#10b981]">+   &lt;button id=&quot;close-btn&quot; aria-label=&quot;Close dialog and return focus&quot;&gt;&lt;CloseIcon /&gt;&lt;/button&gt;</div>
                  <div className="text-[rgba(255,255,255,0.4)]">  &lt;/div&gt;</div>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[rgba(255,255,255,0.5)]">Fixes WCAG 2.1.2 (Keyboard Trap) &amp; WCAG 4.1.2 (Name/Role/Value)</span>
                  <button
                    type="button"
                    onClick={() => onLaunchStudio('/fixtures/accname-wcag', 'Review verified accessibility code diff', 'screen_reader')}
                    className="text-white hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Inspect Full Diff in Fixes</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Screen Reader Speech */}
            {heroProofTab === 'screenreader' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] text-[rgba(255,255,255,0.5)]">
                  <span>SCREEN READER SPEECH OUTPUT TRANSCRIPT</span>
                  <span className="text-amber-400 font-bold">SPEECH DROPOUT DETECTED</span>
                </div>
                <div className="p-4 bg-[#0a0a0a] border-hairline space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Volume2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <div className="text-[rgba(255,255,255,0.8)]">
                        <strong className="text-white">&quot;Navigation menu, 4 items.&quot;</strong> &rarr; User pressed Tab.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Volume2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <div className="text-[rgba(255,255,255,0.8)]">
                        <strong className="text-white">&quot;Special Promotion, dialog open.&quot;</strong> &rarr; Modal appeared.
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 bg-red-950/20 border border-red-500/20">
                      <Volume2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="text-red-400">
                        <strong>[Silence]</strong> Dynamic discount price changed from $100 to $80, but no speech announcement was triggered. Blind users remain unaware of applied discount.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Audit Report */}
            {heroProofTab === 'report' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[rgba(255,255,255,0.5)]">
                  <span>COMPLIANCE AUDIT CERTIFICATE</span>
                  <span className="text-[#10b981] font-bold">WCAG 2.2 AAA &middot; EAA 2025 READY</span>
                </div>
                <div className="p-4 bg-[#0a0a0a] border-hairline space-y-2 text-[11px]">
                  <div className="flex justify-between border-hairline-b pb-1.5">
                    <span className="text-[rgba(255,255,255,0.5)]">Audited Application</span>
                    <span className="text-white">Checkout &amp; Onboarding Flow</span>
                  </div>
                  <div className="flex justify-between border-hairline-b pb-1.5">
                    <span className="text-[rgba(255,255,255,0.5)]">Verified Invariants</span>
                    <span className="text-[#10b981]">14 Passed &middot; 0 Traps Remaining</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.5)]">Legal Protection</span>
                    <span className="text-white">Audit trail ready for EU European Accessibility Act compliance</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. TRUST & SOCIAL PROOF METRICS */}
      <section className="py-12 px-6 sm:px-12 border-hairline-b bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white">0%</div>
            <div className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.5)]">False Alarms</div>
            <p className="text-[11px] text-[rgba(255,255,255,0.4)]">Only real behavioral bugs that affect actual users.</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#10b981]">96.8%</div>
            <div className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Interactive Bug Catch Rate</div>
            <p className="text-[11px] text-[rgba(255,255,255,0.4)]">Versus 38% for legacy static code scanners.</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white">3.8x</div>
            <div className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Faster Resolution</div>
            <p className="text-[11px] text-[rgba(255,255,255,0.4)]">With automated, ready-to-merge GitHub pull requests.</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#10b981]">100%</div>
            <div className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Source Code Remediation</div>
            <p className="text-[11px] text-[rgba(255,255,255,0.4)]">No fragile cosmetic runtime overlay widgets.</p>
          </div>
        </div>
      </section>

      {/* 4. THE CORE CONTRAST: WHY PASSIVE SCANNERS FAIL */}
      <section className="py-24 px-6 sm:px-12 border-hairline-b space-y-16">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-[rgba(255,255,255,0.5)] border-hairline-b pb-4">
            <span>[SECTION 02] THE BEHAVIORAL DIFFERENCE</span>
            <span>WHY TRADITIONAL TOOLS MISS THE MARK</span>
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
              TEST WHAT YOUR USERS ACTUALLY EXPERIENCE.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 border-hairline-t">
            <div className="md:col-span-6 space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                Over 96% of the top 1,000,000 websites fail accessibility standards.
              </h3>
              <p className="text-sm text-[rgba(255,255,255,0.65)] leading-relaxed">
                Passive scanners inundate engineering teams with hundreds of low-priority warning flags, but miss critical interactive flaws like keyboard focus traps in modal dialogs, reversed responsive reading sequences, and silent error states. BarrierLens focuses on genuine user interaction to ensure your product is truly accessible.
              </p>
            </div>

            <div className="md:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#121316] border-hairline space-y-1">
                <div className="text-3xl font-mono font-bold text-white">30-40%</div>
                <div className="text-xs uppercase tracking-wider text-[rgba(255,255,255,0.5)] font-mono">Static Linter Detection Limit</div>
                <p className="text-[11px] text-[rgba(255,255,255,0.4)] pt-2">Linters miss dynamic state changes, modal traps, and disordered reading flows.</p>
              </div>
              <div className="p-4 bg-[#121316] border-hairline space-y-1">
                <div className="text-3xl font-mono font-bold text-[#10b981]">100%</div>
                <div className="text-xs uppercase tracking-wider text-[rgba(255,255,255,0.5)] font-mono">Interactive Coverage</div>
                <p className="text-[11px] text-[rgba(255,255,255,0.4)] pt-2">Tests actual user actions across complex SPAs, drawers, and form journeys.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. CORE PRODUCT CAPABILITIES (5 FEATURE EXHIBITS) */}
      <section id="proofs" className="py-24 px-6 sm:px-12 border-hairline-b space-y-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-white uppercase tracking-widest font-bold">
                [03] CORE PRODUCT CAPABILITIES
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[rgba(255,255,255,0.5)]">FEATURE</span>
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
                <div className="text-xs uppercase tracking-tight truncate font-mono">{slide.title.split(' ')[0]} {slide.title.split(' ')[1]}</div>
              </button>
            ))}
          </div>

          {/* Active Featured Slide Exhibit */}
          <div className="p-8 sm:p-12 bg-[#121316] border-hairline space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-hairline-b pb-8">
              
              {/* Letter-Chunk Title Split */}
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
                    <span>LAUNCH THIS TEST IN AUDIT STUDIO</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Mini-Simulation Graphic */}
              <div className="lg:col-span-5 p-6 bg-[#0a0a0a] border-hairline space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[rgba(255,255,255,0.5)]">
                  <span>KEYBOARD NAVIGATION STEPPER</span>
                  <span className={focusStep === 3 || focusStep === 4 ? 'text-[#f43f5e]' : 'text-[#10b981]'}>
                    {focusStep === 3 || focusStep === 4 ? '● FOCUS LOCKED IN MODAL' : '○ NAVIGATION CLEAN'}
                  </span>
                </div>

                {/* Node Sequence */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className={`p-2 border-hairline ${focusStep === 1 ? 'bg-white text-black font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    PAGE
                  </div>
                  <div className={`p-2 border-hairline ${focusStep === 2 ? 'bg-white text-black font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    NAV
                  </div>
                  <div className={`p-2 border-hairline ${focusStep === 3 ? 'bg-[#f43f5e] text-white font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    MODAL
                  </div>
                  <div className={`p-2 border-hairline ${focusStep === 4 ? 'bg-[#f43f5e] text-white font-bold' : 'bg-[#121316] text-[rgba(255,255,255,0.6)]'}`}>
                    BUTTON
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleNextFocusStep}
                    className="px-3 py-1.5 bg-[#17181c] hover:bg-[#202228] text-xs font-mono text-white border-hairline flex items-center gap-1.5"
                  >
                    <span>PRESS TAB KEY</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTrapEscaped(!isTrapEscaped)}
                    className={`px-3 py-1.5 text-xs font-mono border-hairline transition-all ${
                      isTrapEscaped ? 'bg-[#10b981] text-black font-bold' : 'bg-[#17181c] text-[rgba(255,255,255,0.6)]'
                    }`}
                  >
                    {isTrapEscaped ? 'ESCAPE KEY: FIXED' : 'ESCAPE KEY: UNBOUND'}
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. HOW IT WORKS: 3 SIMPLE STEPS */}
      <section id="how-it-works" className="py-24 px-6 sm:px-12 border-hairline-b bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <span className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
              [SECTION 04] HOW IT WORKS
            </span>
            <span className="text-xs font-mono text-white">FROM URL TO VERIFIED CODE FIX</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#121316] border-hairline space-y-4">
              <div className="text-xs font-mono font-bold text-[#10b981]">STEP 01</div>
              <h3 className="text-lg font-bold text-white font-mono uppercase">Enter URL or Connect Repo</h3>
              <p className="text-xs text-[rgba(255,255,255,0.65)] leading-relaxed">
                Connect your staging URL, production website, or GitHub repository. Choose the assistive personas you want to test—Keyboard users, Screen Reader VoiceOver, or Motor Tremors.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[rgba(255,255,255,0.4)]">
                &bull; Zero complex setup required<br />
                &bull; Works with React, Vue, Next.js, and static sites
              </div>
            </div>

            <div className="p-6 bg-[#121316] border-hairline space-y-4">
              <div className="text-xs font-mono font-bold text-[#10b981]">STEP 02</div>
              <h3 className="text-lg font-bold text-white font-mono uppercase">Autonomous Interactive Traversal</h3>
              <p className="text-xs text-[rgba(255,255,255,0.65)] leading-relaxed">
                BarrierLens navigates multi-step user journeys: clicking accordions, opening modal dialogues, and filling checkout forms. It verifies keyboard escape paths and listens for speech synthesis announcements.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[rgba(255,255,255,0.4)]">
                &bull; Tests real interactive states<br />
                &bull; Eliminates false-positive noise
              </div>
            </div>

            <div className="p-6 bg-[#121316] border-hairline space-y-4">
              <div className="text-xs font-mono font-bold text-[#10b981]">STEP 03</div>
              <h3 className="text-lg font-bold text-white font-mono uppercase">Verified Code Fixes &amp; PRs</h3>
              <p className="text-xs text-[rgba(255,255,255,0.65)] leading-relaxed">
                Review verified code diffs with complete context. BarrierLens re-tests the fix in the background to ensure no regressions were introduced, and opens a ready-to-merge GitHub pull request.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[rgba(255,255,255,0.4)]">
                &bull; 1-click GitHub Pull Requests<br />
                &bull; Certified compliance audit ledger
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. GROUND-TRUTH TESTBEDS (LIST ⇄ GRID VIEW) */}
      <section id="benchmarks" className="py-24 px-6 sm:px-12 border-hairline-b space-y-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header & Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-hairline-b pb-4">
            <div>
              <div className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
                [SECTION 05] COMMON ACCESSIBILITY BARRIERS
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white font-mono">
                Interactive Test Cases You Can Audit
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
                      <div className="font-bold text-base text-white group-hover:translate-x-2 transition-transform font-mono">
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
                      {item.severity}
                    </span>
                    <span className="hidden lg:inline text-[rgba(255,255,255,0.4)]">
                      {item.impact}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proofItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLaunchStudio(item.url, item.goal, 'keyboard')}
                  className="p-6 bg-[#121316] border-hairline hover:border-white transition-all cursor-pointer space-y-4 group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-xs text-[rgba(255,255,255,0.4)]">
                      <span>{item.id}</span>
                      <span className="text-[#f43f5e] font-bold">{item.severity}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-white transition-colors font-mono">
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

      {/* 8. FEATURE COMPARISON MATRIX (BARRIERLENS VS LEGACY SCANNERS) */}
      <section id="comparison" className="py-24 px-6 sm:px-12 border-hairline-b bg-[#07080a]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <span className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
              [SECTION 06] PRODUCT COMPARISON
            </span>
            <span className="text-xs font-mono text-white">WHY ENGINEERING TEAMS CHOOSE BARRIERLENS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-hairline divide-y divide-[rgba(255,255,255,0.1)]">
              <thead>
                <tr className="bg-[#121316] text-[rgba(255,255,255,0.7)] uppercase tracking-wider text-[11px]">
                  <th className="p-4 border-hairline-r">Accessibility Capability</th>
                  <th className="p-4 bg-white text-black font-black border-hairline-r">BarrierLens 2.0</th>
                  <th className="p-4 border-hairline-r">Static Linters (Axe/Lighthouse)</th>
                  <th className="p-4">Cosmetic Overlay Widgets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.08)] bg-[#0a0a0a]">
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="hover:bg-[#121316] transition-colors">
                    <td className="p-4 font-bold text-white border-hairline-r">{row.feature}</td>
                    <td className="p-4 bg-white/5 font-bold text-[#10b981] border-hairline-r">{row.barrierlens}</td>
                    <td className="p-4 text-[rgba(255,255,255,0.6)] border-hairline-r">{row.linters}</td>
                    <td className="p-4 text-red-400">{row.overlays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* 9. TRANSPARENT PRICING & TIERS */}
      <section id="pricing" className="py-24 px-6 sm:px-12 border-hairline-b space-y-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <span className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
              [SECTION 07] TRANSPARENT PRICING
            </span>
            <span className="text-xs font-mono text-white">SIMPLE PLANS FOR TEAMS OF ALL SIZES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div 
                key={idx}
                className={`p-8 border-hairline flex flex-col justify-between space-y-8 ${
                  tier.highlight ? 'bg-[#14161b] border-white' : 'bg-[#121316]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold uppercase font-mono text-white">{tier.name}</h3>
                    {tier.popular && (
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-[#10b981] text-black font-bold uppercase">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-xs text-[rgba(255,255,255,0.5)]">/ {tier.period}</span>
                  </div>
                  <p className="text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
                    {tier.desc}
                  </p>

                  <div className="pt-4 border-hairline-t space-y-3 font-mono text-xs">
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                        <span className="text-[rgba(255,255,255,0.7)]">{feat}</span>
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
                  className={`w-full py-3 text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                    tier.highlight
                      ? 'bg-white text-black hover:bg-[rgba(255,255,255,0.85)] shadow-md'
                      : 'bg-[#17181c] text-white hover:bg-[#202228] border-hairline'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-24 px-6 sm:px-12 border-hairline-b bg-[#07080a]">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between border-hairline-b pb-4">
            <span className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
              [SECTION 08] FREQUENTLY ASKED QUESTIONS
            </span>
            <span className="text-xs font-mono text-white">EVERYTHING YOU NEED TO KNOW</span>
          </div>

          <div className="space-y-4 font-mono">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-hairline bg-[#121316] transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 text-xs font-bold text-white hover:bg-[#16181d] transition-colors"
                >
                  <span className="uppercase">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[rgba(255,255,255,0.65)] leading-relaxed border-hairline-t">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 11. INFINITE KINETIC MARQUEE: Value & Compliance Standards (No Backend Leaks) */}
      <section className="py-16 border-hairline-b overflow-hidden space-y-4 bg-[#0a0a0a]">
        
        {/* Row 1: Forward Marquee */}
        <div className="animate-marquee whitespace-nowrap">
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.85)] tracking-wider">
            KEYBOARD FOCUS VERIFICATION &bull; SCREEN READER SPEECH SIMULATION &bull; WCAG 2.2 LEVEL AAA &bull; EUROPEAN ACCESSIBILITY ACT 2025 &bull; 0% FALSE POSITIVES &bull; AUTOMATED GITHUB PULL REQUESTS &bull;&nbsp;
          </span>
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.85)] tracking-wider">
            KEYBOARD FOCUS VERIFICATION &bull; SCREEN READER SPEECH SIMULATION &bull; WCAG 2.2 LEVEL AAA &bull; EUROPEAN ACCESSIBILITY ACT 2025 &bull; 0% FALSE POSITIVES &bull; AUTOMATED GITHUB PULL REQUESTS &bull;&nbsp;
          </span>
        </div>

        {/* Row 2: Reverse Marquee */}
        <div className="animate-marquee-reverse whitespace-nowrap">
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.35)] tracking-wider">
            SURGICAL CODE DIFFS &bull; CONTINUOUS CI/CD GUARDRAILS &bull; VISUAL READING ORDER CONCORDANCE &bull; ZERO REGRESSION ASSURANCE &bull; AUDIT COMPLIANCE CERTIFICATES &bull;&nbsp;
          </span>
          <span className="headline-giant text-4xl sm:text-6xl text-[rgba(255,255,255,0.35)] tracking-wider">
            SURGICAL CODE DIFFS &bull; CONTINUOUS CI/CD GUARDRAILS &bull; VISUAL READING ORDER CONCORDANCE &bull; ZERO REGRESSION ASSURANCE &bull; AUDIT COMPLIANCE CERTIFICATES &bull;&nbsp;
          </span>
        </div>

      </section>

      {/* 12. CLEAN ENTERPRISE FOOTER (No IP leaks, no port leaks) */}
      <footer className="pt-20 pb-12 px-6 sm:px-12 space-y-16">
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-hairline-b pb-16">
          
          {/* Col 1: Mission statement */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#10b981]" />
              <span className="font-bold text-sm tracking-tight text-white uppercase font-mono">BarrierLens</span>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.65)] leading-relaxed max-w-md">
              The autonomous accessibility verification platform that tests web applications like real humans with assistive needs do—delivering automated code fixes with zero false alarms.
            </p>
            <div className="text-[11px] font-mono text-[rgba(255,255,255,0.4)]">
              WCAG 2.2 LEVEL AAA &middot; EAA 2025 &middot; ADA TITLE III
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <div className="text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Product Workspaces</div>
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
                  onClick={() => onLaunchStudio('/fixtures/keyboard-trap', 'Inspect focus trap path', 'keyboard')}
                  className="text-[rgba(255,255,255,0.7)] hover:text-white"
                >
                  &gt; Issues &amp; Proof Inspector
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/fixtures/accname-wcag', 'Inspect Causal AST Patches', 'screen_reader')}
                  className="text-[rgba(255,255,255,0.7)] hover:text-white"
                >
                  &gt; Verified Code Fixes
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Legal */}
          <div className="md:col-span-4 space-y-3 font-mono text-xs">
            <div className="text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Compliance &amp; Standards</div>
            <ul className="space-y-2 text-[rgba(255,255,255,0.7)]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>W3C WCAG 2.2 Specification (Level A, AA, AAA)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>European Accessibility Act (Directive 2019/882)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>US Americans with Disabilities Act (ADA Title III)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Giant Edge-to-Edge Split Wordmark */}
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
            &copy; 2026 BarrierLens Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>WCAG 2.2 LEVEL AAA</span>
            <span>EAA 2025 COMPLIANT</span>
            <span>ENTERPRISE SOC2 READY</span>
          </div>
        </div>

      </footer>

    </div>
  );
}
