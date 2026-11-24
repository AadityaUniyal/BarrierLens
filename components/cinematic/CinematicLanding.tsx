'use client';

import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { 
  ArrowRight, 
  ArrowUpRight, 
  ShieldCheck, 
  Volume2, 
  Layers, 
  Compass, 
  ChevronDown, 
  CheckCircle2, 
  GitPullRequest, 
  Check, 
  Keyboard, 
  ShieldAlert, 
  GitBranch,
  VolumeX,
  Code2,
  Cpu,
  Activity,
  FileCheck2
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

  // Live Keyboard Traversal Simulator State
  const [simStep, setSimStep] = useState<number>(1);
  const [simTrapped, setSimTrapped] = useState<boolean>(true);
  const [simEscaped, setSimEscaped] = useState<boolean>(false);
  const [simPatchApplied, setSimPatchApplied] = useState<boolean>(false);

  // Interactive Diagnostic Cockpit Tab State
  const [cockpitTab, setCockpitTab] = useState<'trap' | 'diff' | 'audio' | 'order'>('trap');

  // Interactive Audio Waveform Animation State
  const [isMutedGap, setIsMutedGap] = useState<boolean>(true);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [indexView, setIndexView] = useState<'list' | 'grid'>('list');

  // Terminal Contact Inquiry State (#contact)
  const [inquiryUrl, setInquiryUrl] = useState<string>('');
  const [inquiryCookies, setInquiryCookies] = useState<string>('');
  const [inquiryGoal, setInquiryGoal] = useState<string>('');

  // Keyboard simulator handler
  const handleSimTab = () => {
    if (simPatchApplied) {
      if (simStep === 1) setSimStep(2);
      else if (simStep === 2) setSimStep(3);
      else setSimStep(1);
    } else {
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
      setSimTrapped(true);
      setTimeout(() => setSimTrapped(false), 1400);
    }
  };

  const handleTogglePatch = () => {
    setSimPatchApplied(!simPatchApplied);
    setSimStep(1);
  };

  // Pricing Tiers (Swiss Transparent Specs)
  const pricingTiers = [
    {
      name: 'Developer Free',
      price: '$0',
      period: 'free forever',
      desc: 'Ideal for personal projects, indie developers, and testing interactive accessibility verification.',
      features: [
        '10 autonomous user journey audits / month',
        'Interactive keyboard trap detection (Tarjan SCC)',
        'Pre-loaded benchmark testbeds (/benchmark)',
        'Visual DOM and AST diff previews',
        'Community documentation & guides'
      ],
      cta: 'Explore Live Sandbox',
      popular: false,
      highlight: false
    },
    {
      name: 'Team Pro',
      price: '$79',
      period: 'per month',
      desc: 'Continuous accessibility testing, automated GitHub pull requests, and real-time team alerts.',
      features: [
        'Unlimited autonomous user journey audits',
        'Automated code fixes & 1-click GitHub PRs',
        'Screen reader voice synthesis simulation',
        'Visual vs. assistive reading order checks (Kendall τ)',
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
      period: 'annual billing',
      desc: 'Dedicated verification infrastructure, custom security SLAs, and statutory legal defense.',
      features: [
        'Self-hosted or dedicated AWS Bedrock tenant',
        'Signed PoA-DAG cryptographic compliance ledgers',
        'Certified VPAT® 2.5 statutory legal defense',
        'Custom SSO / SAML & Hardware Passkey Vault',
        'Dedicated compliance officer support & SLAs'
      ],
      cta: 'Contact Architecture Team',
      popular: false,
      highlight: false
    }
  ];

  const testbeds = [
    {
      id: 'tb_trap',
      title: 'Modal Keyboard Trap',
      category: 'WCAG 2.1.2 Level A',
      url: '/fixtures/keyboard-trap',
      goal: 'Navigate into modal and escape back to main page',
      severity: 'Critical (Blocker)',
      desc: 'Tab key forms a terminal strongly connected component (SCC) loop between confirmation buttons with no Esc escape key handler.'
    },
    {
      id: 'tb_accname',
      title: 'Empty Accessible Name',
      category: 'WCAG 4.1.2 Level A',
      url: '/fixtures/accname-wcag',
      goal: 'Identify and activate all icon action buttons',
      severity: 'High Severity',
      desc: 'Icon-only buttons missing aria-label or accessible text inside accessibility tree computation.'
    },
    {
      id: 'tb_focus_loss',
      title: 'Focus Loss on Dialog Dismissal',
      category: 'WCAG 2.4.3 Level A',
      url: '/fixtures/focus-loss',
      goal: 'Open drawer, close it, and resume reading order',
      severity: 'Medium Severity',
      desc: 'Closing the side navigation drawer drops document focus back to document.body, disorienting assistive users.'
    },
    {
      id: 'tb_benchmark',
      title: 'Comprehensive WCAG Suite',
      category: 'Ground Truth Suite',
      url: '/benchmark',
      goal: 'Verify primary interaction flow and keyboard accessibility without traps',
      severity: 'Full Battery',
      desc: 'Multi-step end-to-end user journey across interactive inputs, dynamic dropdowns, and modal dialogs.'
    }
  ];

  // The 5 Decisions (Inspired by sbwebdesign.ch: "Eine Website ist tausend kleine Entscheidungen")
  const swissDecisions = [
    {
      step: '01/05',
      title: 'Perception Mesh',
      subtitle: 'Playwright CDP Assistive Driver',
      desc: 'Simulates real human interaction vectors: humanized keyboard tab sequences, voiceover speech calculation, and motor tremor modeling across dynamic DOM states.',
      metrics: ['Sub-pixel Pointer Drift', 'CDP Tree Traversal', 'Synthetic Voice Synthesis'],
      badge: 'Perception Agent'
    },
    {
      step: '02/05',
      title: 'Proof Engine',
      subtitle: 'Tarjan SCC & Kendall τ Verification',
      desc: 'Applies formal graph theory to prove keyboard traps as inescapable strongly connected components and measure visual order concordance with mathematical certainty.',
      metrics: ['Tarjan SCC Cycles', 'Kendall τ Metric', 'CMSD Entropy Fields'],
      badge: 'Formal Verifier'
    },
    {
      step: '03/05',
      title: 'Cross-Modal Speech Telemetry',
      subtitle: 'Dynamic UI Audio Parity',
      desc: 'Detects silent UI updates where sighted users see visual toasts or error badges, but screen reader users hear complete silence due to missing aria-live events.',
      metrics: ['Speech Synthesizer Stream', 'Live Mutation Observer', 'Silence Gap Flagging'],
      badge: 'Audio Verifier'
    },
    {
      step: '04/05',
      title: 'AST Causal Surgery',
      subtitle: 'Zero-Regression Code Patching',
      desc: 'Parses component AST syntax trees, synthesizes exact repairs, verifies shadow-DOM rendering (SSIM >= 0.999), and submits GitHub PRs with zero layout regressions.',
      metrics: ['Babel AST Surgery', 'Shadow-DOM Verification', '1-Click GitHub PRs'],
      badge: 'Remediation Agent'
    },
    {
      step: '05/05',
      title: 'Cryptographic Ledger',
      subtitle: 'Statutory Defense & VPAT® 2.5',
      desc: 'Every audit run produces an immutable Merkle DAG with SHA-256 state commitments, certified under Section 508, EAA 2025, and ADA Title III statutory requirements.',
      metrics: ['SHA-256 State Roots', 'PoA-DAG Ledger', 'Certified VPAT® 2.5 Export'],
      badge: 'Compliance Officer'
    }
  ];

  const faqs = [
    {
      q: 'How does BarrierLens catch bugs that static tools miss?',
      a: 'Traditional linters only inspect static HTML strings at the moment a page loads. They never press the Tab key, open a modal dialog, or submit a form. BarrierLens launches an autonomous interactive session that navigates real user journeys—testing keyboard focus escape, screen reader announcements, and dynamic UI state changes just like a real user with assistive needs would.'
    },
    {
      q: 'Does BarrierLens modify my production code automatically?',
      a: 'BarrierLens synthesizes clean, minimal Abstract Syntax Tree (AST) patches and verifies them in a headless shadow browser. You inspect the exact diff and can export it directly as a 1-click GitHub Pull Request for your engineering team to review.'
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
      q: 'What compliance standards are supported in the statutory report?',
      a: 'BarrierLens audits against W3C WCAG 2.2 (Levels A, AA, AAA), the European Accessibility Act (EAA 2025), Americans with Disabilities Act (ADA Title III), and Revised Section 508. Conformance is certified with downloadable VPAT® 2.5 documentation.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#0A0A0A] text-[#121212] dark:text-[#F8FAFC] font-sans antialiased selection:bg-[#0055FF]/15 selection:text-[#0055FF]">
      
      {/* Subtle Swiss Architectural Grid Hairlines */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(18, 18, 18, 0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* 1. HERO SECTION: Swiss Editorial Minimalist Standard (sbwebdesign.ch) */}
      <section className="relative z-10 pt-20 sm:pt-28 pb-16 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        
        {/* Architectural Release Pill & Technical Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-5 text-xs font-mono text-[#6E6E6E] dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#121212] dark:text-white font-semibold tracking-tight">BarrierLens 2.0</span>
            <span className="text-black/20 dark:text-white/20">&bull;</span>
            <span className="text-[#6E6E6E] dark:text-slate-300">DETERMINISTIC GRAPH ENGINE</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#6E6E6E] dark:text-slate-400">
            <span className="px-2 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-[#121212] dark:text-slate-300">PLAYWRIGHT CDP</span>
            <span>&bull;</span>
            <span>TARJAN SCC</span>
            <span>&bull;</span>
            <span>KENDALL TAU</span>
            <span>&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">VERIFIED STATE COMMIT</span>
          </div>
        </div>

        {/* Master Headline: Swiss Editorial Bricolage Typography */}
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-[#121212] dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--swiss-orange, #FF4D00)' }} />
            <span>00/05 &bull; MANIFESTO &bull; INTERACTIVE BEHAVIORAL VERIFICATION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-bold tracking-[-0.035em] text-[#121212] dark:text-white leading-[1.02]">
            Prove what locks them out. <br />
            <span className="text-[#6E6E6E] dark:text-slate-400 font-normal">
              Fix it before you ship.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#6E6E6E] dark:text-slate-300 max-w-3xl font-normal leading-relaxed">
            Eine Website ist tausend kleine Entscheidungen. Static linters only inspect dead HTML strings—they can&apos;t press Tab, navigate dynamic dialogs, or detect broken assistive reading orders. BarrierLens traverses interactive user journeys, models closed focus sinks with Tarjan graph cycles, and delivers verified source-code repairs.
          </p>

          {/* Quick Capability Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
            {['Playwright CDP Traversal', 'ATL* Game Model Checking', 'CMSD Entropy Field', 'SSIM >= 0.999 AST Surgery', 'PoA-DAG Merkle Ledger', 'Certified VPAT® 2.5'].map((tag, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.08] text-[#121212] dark:text-slate-300 rounded-md transition-all cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Dual CTA Actions & Live URL Audit Omnibar */}
        <div className="space-y-4 pt-2">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex flex-col md:flex-row items-center gap-2 max-w-4xl">
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2.5 bg-[#F7F7F5] dark:bg-[#181818] rounded-xl border border-black/[0.06] dark:border-white/[0.06] focus-within:border-[#0055FF] focus-within:ring-1 focus-within:ring-[#0055FF]/20 transition-all">
              <Compass className="w-4 h-4 text-[#0055FF] shrink-0" />
              <input
                type="text"
                value={trialUrl}
                onChange={(e) => setTrialUrl(e.target.value)}
                placeholder="Enter URL to test (e.g. https://your-site.com or /benchmark)"
                className="w-full bg-transparent text-xs sm:text-sm font-mono text-[#121212] dark:text-white placeholder-[#8A8A8A] focus:outline-none"
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

              <button
                type="button"
                onClick={() => onLaunchStudio(trialUrl, trialGoal, trialPersona, true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#121212] dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-semibold shadow-sm transition-all shrink-0 min-h-[38px]"
              >
                <span>Run Autonomous Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E6E6E] dark:text-white/50 pl-1 font-mono">
            <button
              type="button"
              onClick={() => onLaunchStudio('/benchmark', 'Verify primary interaction flow without traps', 'keyboard', false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0055FF] hover:bg-[#0044CC] text-white font-medium transition-all shadow-sm"
            >
              <span>Explore Live Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[#8A8A8A]">Pre-built Fixtures:</span>
            <button 
              type="button" 
              onClick={() => { setTrialUrl('/fixtures/keyboard-trap'); onLaunchStudio('/fixtures/keyboard-trap', 'Test modal keyboard focus escape', 'keyboard', true); }}
              className="px-2 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[#0055FF]/10 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#0055FF]/40 text-[#121212] dark:text-white/80 hover:text-[#0055FF] transition-all"
            >
              /fixtures/keyboard-trap
            </button>
            <button 
              type="button" 
              onClick={() => { setTrialUrl('/fixtures/accname-wcag'); onLaunchStudio('/fixtures/accname-wcag', 'Test accessible name calculation', 'screen_reader', true); }}
              className="px-2 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.04] hover:bg-emerald-500/10 border border-black/[0.08] dark:border-white/[0.08] hover:border-emerald-500/40 text-[#121212] dark:text-white/80 hover:text-emerald-600 transition-all"
            >
              /fixtures/accname-wcag
            </button>
            <button 
              type="button" 
              onClick={() => { setTrialUrl('/benchmark'); onLaunchStudio('/benchmark', 'Run comprehensive WCAG suite', 'keyboard', true); }}
              className="px-2 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[#0055FF]/10 border border-black/[0.08] dark:border-white/[0.08] hover:border-[#0055FF]/40 text-[#121212] dark:text-white/80 hover:text-[#0055FF] transition-all"
            >
              /benchmark
            </button>
          </div>
        </div>

        {/* INTERACTIVE DIAGNOSTIC PROOF COCKPIT (Swiss Minimalist Standard) */}
        <div id="proofs" className="relative rounded-2xl bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] shadow-sm overflow-hidden scroll-mt-24">
          
          {/* Cockpit Window Titlebar & Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-[#F7F7F5] dark:bg-[#181818] border-b border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-mono text-[#6E6E6E] dark:text-slate-400 font-medium">
                Interactive Verification Cockpit <span className="text-black/30 dark:text-white/30">/</span> <span className="text-[#121212] dark:text-slate-200">{trialUrl}</span>
              </span>
            </div>

            {/* Segmented Cockpit Tabs */}
            <div className="flex items-center p-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-xs font-mono overflow-x-auto">
              <button
                type="button"
                onClick={() => setCockpitTab('trap')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  cockpitTab === 'trap' 
                    ? 'bg-[#121212] dark:bg-white text-white dark:text-black font-semibold shadow-sm' 
                    : 'text-[#6E6E6E] dark:text-slate-400 hover:text-[#121212] dark:hover:text-white'
                }`}
              >
                <Keyboard className="w-3 h-3" />
                <span>Keyboard Path</span>
              </button>
              <button
                type="button"
                onClick={() => setCockpitTab('diff')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  cockpitTab === 'diff' 
                    ? 'bg-[#121212] dark:bg-white text-white dark:text-black font-semibold shadow-sm' 
                    : 'text-[#6E6E6E] dark:text-slate-400 hover:text-[#121212] dark:hover:text-white'
                }`}
              >
                <GitPullRequest className="w-3 h-3" />
                <span>Code Fix PR</span>
              </button>
              <button
                type="button"
                onClick={() => setCockpitTab('audio')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  cockpitTab === 'audio' 
                    ? 'bg-[#121212] dark:bg-white text-white dark:text-black font-semibold shadow-sm' 
                    : 'text-[#6E6E6E] dark:text-slate-400 hover:text-[#121212] dark:hover:text-white'
                }`}
              >
                <Volume2 className="w-3 h-3" />
                <span>Voice Transcript</span>
              </button>
              <button
                type="button"
                onClick={() => setCockpitTab('order')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  cockpitTab === 'order' 
                    ? 'bg-[#121212] dark:bg-white text-white dark:text-black font-semibold shadow-sm' 
                    : 'text-[#6E6E6E] dark:text-slate-400 hover:text-[#121212] dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Compliance Score</span>
              </button>
            </div>
          </div>

          {/* Cockpit Content Viewports */}
          <div className="p-6 sm:p-8">
            {/* TAB 1: FOCUS TRAP (TARJAN SCC) */}
            {cockpitTab === 'trap' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left: Interactive Simulated Dialog */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#6E6E6E] dark:text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0055FF]" />
                      SIMULATED DOM VIEWPORT &bull; #newsletter-modal
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                      simPatchApplied 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {simPatchApplied ? '✓ AST PATCH ACTIVE: CYCLE BROKEN' : '🔴 CLOSED FOCUS SINK DETECTED'}
                    </span>
                  </div>

                  {/* Visual Node Sequence */}
                  <div className="p-5 rounded-xl bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] space-y-4">
                    <div className="text-[11px] font-mono text-[#6E6E6E] dark:text-slate-500 flex items-center justify-between">
                      <span>KEYBOARD TAB TRAVERSAL SEQUENCE</span>
                      <span className="tabular-nums">ACTIVE STEP: {simStep} / 3</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                      <div className={`p-3 rounded-lg border transition-all ${
                        simStep === 1 
                          ? 'bg-[#0055FF]/10 border-[#0055FF] text-[#0055FF] font-bold shadow-sm' 
                          : 'bg-white dark:bg-[#121212] border-black/[0.06] dark:border-white/[0.06] text-[#6E6E6E] dark:text-slate-400'
                      }`}>
                        <div className="text-[10px] text-[#8A8A8A] mb-1">N1</div>
                        #nav-bar
                      </div>
                      <div className={`p-3 rounded-lg border transition-all ${
                        simStep === 2 
                          ? simPatchApplied 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' 
                            : 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold shadow-sm' 
                          : 'bg-white dark:bg-[#121212] border-black/[0.06] dark:border-white/[0.06] text-[#6E6E6E] dark:text-slate-400'
                      }`}>
                        <div className="text-[10px] text-[#8A8A8A] mb-1">N2</div>
                        #modal-input
                      </div>
                      <div className={`p-3 rounded-lg border transition-all ${
                        simStep === 3 
                          ? simPatchApplied 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' 
                            : 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold shadow-sm' 
                          : 'bg-white dark:bg-[#121212] border-black/[0.06] dark:border-white/[0.06] text-[#6E6E6E] dark:text-slate-400'
                      }`}>
                        <div className="text-[10px] text-[#8A8A8A] mb-1">N3</div>
                        #submit-button
                      </div>
                    </div>

                    {/* Notification State */}
                    {simTrapped && !simPatchApplied && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-mono text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Closed loop cycle: Focus jumps between N2 and N3 indefinitely. Escape key unhandled.</span>
                      </div>
                    )}

                    {simEscaped && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Escape key intercepted! Focus cleanly returned to document root trigger.</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSimTab}
                      className="px-4 py-2 bg-[#121212] dark:bg-white text-white dark:text-black text-xs font-mono font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Press [Tab]</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSimEscape}
                      className="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.06] text-[#121212] dark:text-slate-200 border border-black/[0.08] dark:border-white/10 text-xs font-mono font-medium rounded-lg hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all"
                    >
                      Press [Escape]
                    </button>
                    <button
                      type="button"
                      onClick={handleTogglePatch}
                      className={`px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-all ml-auto ${
                        simPatchApplied 
                          ? 'bg-black/[0.05] dark:bg-white/[0.06] text-[#121212] dark:text-slate-300 border border-black/[0.08] dark:border-white/10' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                      }`}
                    >
                      {simPatchApplied ? "Revert to Unpatched State" : "Apply AST Fix PR"}
                    </button>
                  </div>
                </div>

                {/* Right: Mathematical Proof Telemetry */}
                <div className="lg:col-span-5 p-5 rounded-xl bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.08] dark:border-white/[0.08] text-[#6E6E6E] dark:text-slate-400">
                    <span className="font-semibold text-[#121212] dark:text-white">TARJAN SCC PROOF</span>
                    <span className="text-[#8A8A8A]">O(V + E)</span>
                  </div>

                  <div className="space-y-2 text-[#121212] dark:text-slate-300 leading-relaxed text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#6E6E6E] dark:text-slate-500">Graph Vertices (V):</span>
                      <span className="tabular-nums">3 (Dialog, Input, Button)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E6E] dark:text-slate-500">Directed Edges (E):</span>
                      <span className="tabular-nums">{simPatchApplied ? '4 (Linear + Esc Return)' : '3 (Closed Cycle)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E6E] dark:text-slate-500">SCC Sink Component:</span>
                      <span className={simPatchApplied ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                        {simPatchApplied ? 'None (Acyclic DAG)' : '{N2, N3} Trapped'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E6E] dark:text-slate-500">WCAG 2.1.2 Conformance:</span>
                      <span className={simPatchApplied ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                        {simPatchApplied ? 'PASS (Level A)' : 'FAIL (Critical Trap)'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] space-y-1.5 text-[11px]">
                    <span className="text-[#6E6E6E] dark:text-slate-500 block font-semibold">EVALUATION METRIC:</span>
                    <p className="text-[#6E6E6E] dark:text-slate-300 font-mono text-[10px] leading-relaxed">
                      {simPatchApplied 
                        ? 'AST Transformation injected onKeyDown handler. Escape event propagates focus to prior activeElement. SSIM >= 0.999 verified.'
                        : 'Tab index trap detected in #newsletter-modal. No key listener mapped to Escape keycode 27.'}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: AST CAUSAL DIFF */}
            {cockpitTab === 'diff' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-[#6E6E6E] dark:text-slate-400 pb-2 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <span className="font-semibold text-[#121212] dark:text-white">components/NewsletterModal.tsx</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    REPLAY PROOF: VERIFIED PASSED
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] overflow-x-auto text-[11px] leading-relaxed space-y-1">
                  <div className="text-[#8A8A8A]">// Line 42: Modal Dialog Declaration</div>
                  <div className="text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    - &lt;div id=&quot;newsletter-modal&quot; className=&quot;modal-overlay&quot;&gt;
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    + &lt;div id=&quot;newsletter-modal&quot; role=&quot;dialog&quot; aria-modal=&quot;true&quot; onKeyDown=&#123;handleEscape&#125;&gt;
                  </div>
                  <div className="text-[#6E6E6E] dark:text-slate-400 pl-4">    &lt;h2&gt;Subscribe to updates&lt;/h2&gt;</div>
                  <div className="text-[#6E6E6E] dark:text-slate-400 pl-4">    &lt;input type=&quot;email&quot; placeholder=&quot;Enter your email&quot; /&gt;</div>
                  <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    +   &lt;button type=&quot;button&quot; aria-label=&quot;Close dialog&quot; onClick=&#123;onClose&#125;&gt;
                  </div>
                  <div className="text-[#6E6E6E] dark:text-slate-400 pl-4">    &lt;button type=&quot;submit&quot;&gt;Confirm&lt;/button&gt;</div>
                  <div className="text-[#6E6E6E] dark:text-slate-400">  &lt;/div&gt;</div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#6E6E6E] dark:text-slate-400 pt-2">
                  <span>Target Framework: React 19 / Next.js 15</span>
                  <span className="text-[#121212] dark:text-slate-300">Layout Invariance: SSIM = 1.000 (0.0px shift)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">1-Click PR #142 Ready</span>
                </div>
              </div>
            )}

            {/* TAB 3: SCREEN READER TELEMETRY */}
            {cockpitTab === 'audio' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-[#6E6E6E] dark:text-slate-400 pb-2 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <span className="font-semibold text-[#121212] dark:text-white">SYNTHESIZED SPEECH TELEMETRY STREAM</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">WCAG 4.1.3 &bull; CROSS-MODAL DIVERGENCE (CMSD)</span>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] space-y-3 text-[11px]">
                  <div className="flex items-start gap-4">
                    <span className="text-[#8A8A8A] tabular-nums">00:00.120</span>
                    <span className="text-[#121212] dark:text-slate-300">Focus moved to #newsletter-modal &rarr; &quot;Subscribe to updates, dialog&quot;</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-[#8A8A8A] tabular-nums">00:01.405</span>
                    <span className="text-[#121212] dark:text-slate-300">User entered email text &rarr; &quot;alex@company.com&quot;</span>
                  </div>
                  <div className="flex items-start gap-4 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                    <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">00:01.980</span>
                    <span>MUTED SPEECH GAP: DOM updated with discount confirmation but 0 aria-live events emitted. Sighted user sees toast, blind user hears silence.</span>
                  </div>
                  <div className="flex items-start gap-4 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">00:02.050</span>
                    <span>REMEDIED: aria-live=&quot;polite&quot; injected. Speech output: &quot;Discount code applied successfully.&quot;</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: READING ORDER (KENDALL TAU) */}
            {cockpitTab === 'order' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-[#6E6E6E] dark:text-slate-400 pb-2 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <span className="font-semibold text-[#121212] dark:text-white">2D VISUAL LAYOUT VS DOM STREAM CONCORDANCE</span>
                  <span className="text-[#0055FF] font-semibold">WCAG 1.3.2 &bull; MEANINGFUL SEQUENCE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] space-y-2 text-[11px]">
                    <div className="text-[#121212] dark:text-slate-300 font-semibold">2D Visual Flow (Left-to-Right, Top-to-Bottom)</div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="p-2 rounded bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] text-[#121212] dark:text-white font-medium">Item 1</span>
                      <span>&rarr;</span>
                      <span className="p-2 rounded bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] text-[#121212] dark:text-white font-medium">Item 2</span>
                      <span>&rarr;</span>
                      <span className="p-2 rounded bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] text-[#121212] dark:text-white font-medium">Item 3</span>
                    </div>
                    <div className="text-[#8A8A8A] pt-2 tabular-nums">Visual coordinate rank: [1, 2, 3]</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] space-y-2 text-[11px]">
                    <div className="text-[#121212] dark:text-slate-300 font-semibold">Screen Reader DOM Traversal Sequence</div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-medium">Item 3</span>
                      <span>&rarr;</span>
                      <span className="p-2 rounded bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] text-[#121212] dark:text-white font-medium">Item 2</span>
                      <span>&rarr;</span>
                      <span className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-medium">Item 1</span>
                    </div>
                    <div className="text-rose-600 dark:text-rose-400 pt-2 font-semibold tabular-nums">
                      Divergence detected: flex-direction: row-reverse inverted traversal order (τ = 0.52).
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>BarrierLens AST Fix: Normalizes DOM elements and preserves visual design via CSS grid layout.</span>
                  <span className="font-bold tabular-nums">τ Concordance: 1.00 (Perfect)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High-Impact Metric Transformation Ribbons (Linear / Apple Tier-1 Engineering Standard) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="p-5 bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-mono text-[#6E6E6E] dark:text-slate-400 uppercase tracking-wider block font-medium">Production Traps</span>
            <div className="flex items-baseline gap-2 pt-2 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-rose-400/50 line-through tabular-nums">98%</span>
              <span className="text-xs text-[#8A8A8A]">&rarr;</span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">0%</span>
            </div>
            <p className="text-xs text-[#6E6E6E] dark:text-slate-400 pt-2 font-mono">Tarjan SCC graph cycle elimination</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-mono text-[#6E6E6E] dark:text-slate-400 uppercase tracking-wider block font-medium">Remediation MTTR</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#121212] dark:text-white pt-2 flex items-baseline gap-2 tabular-nums">
              12x <span className="text-xs font-mono text-[#0055FF] font-normal uppercase">Faster</span>
            </div>
            <p className="text-xs text-[#6E6E6E] dark:text-slate-400 pt-2 font-mono">Automated AST Git pull requests</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-mono text-[#6E6E6E] dark:text-slate-400 uppercase tracking-wider block font-medium">Code Regressions</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 pt-2 flex items-baseline gap-2 tabular-nums">
              0 <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-normal uppercase">Verified</span>
            </div>
            <p className="text-xs text-[#6E6E6E] dark:text-slate-400 pt-2 font-mono">Shadow-DOM replay verification</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-mono text-[#6E6E6E] dark:text-slate-400 uppercase tracking-wider block font-medium">Statutory Conformance</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#121212] dark:text-white pt-2 flex items-baseline gap-2 tabular-nums">
              100% <span className="text-xs font-mono text-[#0055FF] font-normal uppercase">Proven</span>
            </div>
            <p className="text-xs text-[#6E6E6E] dark:text-slate-400 pt-2 font-mono">Certified VPAT® 2.5 &amp; EAA 2025</p>
          </div>
        </div>

      </section>

      {/* 2. THE FIVE DECISIONS: PINNED EDITORIAL STORYTELLING (#how-it-works) */}
      <section id="how-it-works" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16 border-t border-black/[0.08] dark:border-white/[0.08]">
        
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-[#121212] dark:text-slate-300">
            <Layers className="w-3.5 h-3.5 text-[#0055FF]" />
            <span>01/05 &rarr; 05/05 &bull; ARCHITECTURAL METHODOLOGY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#121212] dark:text-white leading-tight">
            Eine Website ist tausend kleine Entscheidungen.
          </h2>
          <p className="text-base text-[#6E6E6E] dark:text-slate-400 font-normal leading-relaxed">
            Every user interaction is a deliberate decision. Here is how BarrierLens autonomously proves, verifies, and remedies accessibility barriers through mathematical rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {swissDecisions.map((decision, idx) => (
            <div 
              key={idx}
              className="p-8 rounded-2xl bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 text-[#121212] dark:text-slate-300">
                    {decision.badge}
                  </span>
                  <span className="text-xl font-mono font-bold text-[#8A8A8A] tabular-nums">{decision.step}</span>
                </div>

                <h3 className="text-xl font-bold text-[#121212] dark:text-white tracking-tight">{decision.title}</h3>
                <p className="text-xs font-mono text-[#0055FF]">{decision.subtitle}</p>
                <p className="text-xs text-[#6E6E6E] dark:text-slate-300 leading-relaxed font-normal">
                  {decision.desc}
                </p>

                <div className="pt-4 border-t border-black/[0.06] dark:border-white/10 space-y-2 text-xs text-[#121212] dark:text-white/80 font-mono">
                  {decision.metrics.map((metric, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLaunchStudio('/benchmark', 'Run default benchmark audit', 'keyboard')}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.08] dark:border-white/10 text-[#121212] dark:text-white flex items-center justify-center gap-2"
              >
                <span>Inspect Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0055FF]" />
              </button>
            </div>
          ))}
        </div>

      </section>

      {/* 3. MINIMALIST ARCHITECTURAL AUTONOMY (#comparison - NO COMPETITOR ATTACKS) */}
      <section id="comparison" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12 border-t border-black/[0.08] dark:border-white/[0.08]">
        
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-[#121212] dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ARCHITECTURAL INTEGRITY &bull; ZERO COMPROMISE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#121212] dark:text-white leading-tight">
            How BarrierLens compares: Pure Architectural Autonomy.
          </h2>
          <p className="text-base text-[#6E6E6E] dark:text-slate-400 font-normal leading-relaxed">
            We do not compromise on technical rigor. Here are the three non-negotiable verification benchmarks that drive the BarrierLens platform.
          </p>
        </div>

        {/* Minimalist Editorial Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#121212] shadow-sm">
          <table className="w-full text-left font-sans text-xs sm:text-sm divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            <thead>
              <tr className="bg-[#F7F7F5] dark:bg-[#181818] text-[#6E6E6E] dark:text-slate-400 text-xs font-mono uppercase tracking-wider">
                <th className="p-4 sm:p-5 font-semibold">Verification Benchmark</th>
                <th className="p-4 sm:p-5 font-semibold text-[#121212] dark:text-white">Active Autonomous Standard</th>
                <th className="p-4 sm:p-5 font-semibold text-[#6E6E6E] dark:text-slate-400">Formal Mathematical Guarantee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <td className="p-4 sm:p-5 font-medium text-[#121212] dark:text-white">01. Interactive State Traversal</td>
                <td className="p-4 sm:p-5 text-emerald-600 dark:text-emerald-400 font-semibold">Playwright CDP Headless Session</td>
                <td className="p-4 sm:p-5 text-[#6E6E6E] dark:text-slate-400">Real browser event dispatching (Tab, Esc, Enter)</td>
              </tr>
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <td className="p-4 sm:p-5 font-medium text-[#121212] dark:text-white">02. Focus Sink Detection</td>
                <td className="p-4 sm:p-5 text-emerald-600 dark:text-emerald-400 font-semibold">Tarjan Directed Cycle Proofs</td>
                <td className="p-4 sm:p-5 text-[#6E6E6E] dark:text-slate-400">O(V + E) linear-time trap certificate</td>
              </tr>
              <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <td className="p-4 sm:p-5 font-medium text-[#121212] dark:text-white">03. Code Remediation Invariance</td>
                <td className="p-4 sm:p-5 text-emerald-600 dark:text-emerald-400 font-semibold">Causal AST Patch Synthesis</td>
                <td className="p-4 sm:p-5 text-[#6E6E6E] dark:text-slate-400">SSIM &gt;= 0.999 shadow-DOM verified pull requests</td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      {/* 4. GROUND-TRUTH BENCHMARKS (#benchmarks) */}
      <section id="benchmarks" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12 border-t border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-[#121212] dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>GROUND-TRUTH TESTBEDS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#121212] dark:text-white font-sans">
              Common accessibility barriers you can test right now.
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#181818] rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono shadow-sm">
            <button
              type="button"
              onClick={() => setIndexView('list')}
              className={`px-3 py-1 rounded-md transition-all ${
                indexView === 'list' 
                  ? 'bg-[#121212] dark:bg-white text-white dark:text-black font-semibold' 
                  : 'text-[#6E6E6E] dark:text-white/60 hover:text-[#121212] dark:hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setIndexView('grid')}
              className={`px-3 py-1 rounded-md transition-all ${
                indexView === 'grid' 
                  ? 'bg-[#121212] dark:bg-white text-white dark:text-black font-semibold' 
                  : 'text-[#6E6E6E] dark:text-white/60 hover:text-[#121212] dark:hover:text-white'
              }`}
            >
              Grid View
            </button>
          </div>
        </div>

        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06] rounded-2xl bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shadow-sm">
          {testbeds.map((item) => (
            <div
              key={item.id}
              onClick={() => onLaunchStudio(item.url, item.goal, 'keyboard')}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-all cursor-pointer group"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">{item.category}</span>
                  <span className="text-black/20 dark:text-white/20">&bull;</span>
                  <span className="text-xs font-mono text-[#6E6E6E] dark:text-slate-400">{item.severity}</span>
                </div>
                <h3 className="text-base font-semibold text-[#121212] dark:text-white group-hover:text-[#0055FF] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[#6E6E6E] dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-[#6E6E6E] dark:text-slate-400 group-hover:text-[#121212] dark:group-hover:text-white transition-colors">
                  Launch Testbed
                </span>
                <ArrowRight className="w-4 h-4 text-[#8A8A8A] group-hover:translate-x-1 group-hover:text-[#0055FF] transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRICING SECTION (#pricing) */}
      <section id="pricing" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16 border-t border-black/[0.08] dark:border-white/[0.08]">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-[#121212] dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
            <span>TRANSPARENT SPECIFICATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#121212] dark:text-white font-sans">
            Predictable plans for teams of any size.
          </h2>
          <p className="text-sm text-[#6E6E6E] dark:text-slate-400 leading-relaxed font-normal">
            Start free with local fixtures, verify your first user journey, and upgrade when your team needs automated GitHub pull requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, idx) => (
            <div 
              key={idx}
              className={`p-8 rounded-2xl border flex flex-col justify-between space-y-8 bg-white dark:bg-[#121212] ${
                tier.highlight 
                  ? 'border-[#0055FF] shadow-lg relative' 
                  : 'border-black/[0.08] dark:border-white/[0.08] shadow-sm'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#0055FF] text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#121212] dark:text-white uppercase font-mono">{tier.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#121212] dark:text-white tracking-tight tabular-nums">{tier.price}</span>
                  <span className="text-xs text-[#8A8A8A] font-mono">/ {tier.period}</span>
                </div>
                <p className="text-xs text-[#6E6E6E] dark:text-slate-400 leading-relaxed">
                  {tier.desc}
                </p>

                <div className="pt-6 border-t border-black/[0.08] dark:border-white/[0.08] space-y-3 text-xs text-[#121212] dark:text-slate-300 font-sans">
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
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
                className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  tier.highlight 
                    ? 'bg-[#0055FF] hover:bg-[#0044CC] text-white shadow-md' 
                    : 'bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#121212] dark:text-white border border-black/[0.08] dark:border-white/10'
                }`}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS (#faq) */}
      <section id="faq" className="py-24 px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto space-y-12 border-t border-black/[0.08] dark:border-white/[0.08]">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-[#121212] dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
            <span>COMMON INQUIRIES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#121212] dark:text-white leading-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#121212] overflow-hidden shadow-sm transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 text-sm font-semibold text-[#121212] dark:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#8A8A8A] shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>

              {openFaq === idx && (
                <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#6E6E6E] dark:text-slate-300 leading-relaxed border-t border-black/[0.06] dark:border-white/10">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-[#121212] dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
            <span>DIRECT AUDIT SPECIFICATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#121212] dark:text-white leading-tight">
            Schedule an Autonomous CUJ Verification
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E6E] dark:text-slate-400 leading-relaxed max-w-2xl mx-auto font-normal">
            Submit your staging credentials or target endpoint. The multi-persona engine evaluates under real physical keyboard &amp; assistive constraints with mathematical proofs.
          </p>
        </div>

        {/* Terminal Inquiry Box */}
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left relative overflow-hidden">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.08] dark:border-white/[0.08] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[#6E6E6E] dark:text-slate-400 ml-2">audit_runner.sh</span>
            </div>
            <span className="text-[#0055FF] font-medium text-[11px]">MODE: AST_VERIFY</span>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#121212] dark:text-slate-300 mb-1.5">
                Target Domain / Endpoint URL
              </label>
              <input
                type="text"
                value={inquiryUrl}
                onChange={(e) => setInquiryUrl(e.target.value)}
                placeholder="https://app.acme.corp/checkout"
                className="w-full bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#121212] dark:text-white placeholder-[#8A8A8A] focus:border-[#0055FF] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#121212] dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Custom Authentication / Staging Cookies</span>
                <span className="text-[10px] text-[#8A8A8A] font-normal">Optional JSON or Bearer</span>
              </label>
              <input
                type="text"
                value={inquiryCookies}
                onChange={(e) => setInquiryCookies(e.target.value)}
                placeholder='{"session_id": "stg_9f8a...", "role": "buyer"}'
                className="w-full bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#121212] dark:text-white placeholder-[#8A8A8A] focus:border-[#0055FF] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#121212] dark:text-slate-300 mb-1.5">
                Journey Goal Specification
              </label>
              <textarea
                rows={3}
                value={inquiryGoal}
                onChange={(e) => setInquiryGoal(e.target.value)}
                placeholder="e.g. Verify keyboard focus trap and dynamic aria-live feedback on checkout modal"
                className="w-full bg-[#F7F7F5] dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#121212] dark:text-white placeholder-[#8A8A8A] focus:border-[#0055FF] focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Submission Trigger */}
          <div className="pt-2 space-y-3">
            <KineticButton
              text="REQUEST CUSTOM CUJ AUDIT"
              variant="primary"
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else onLaunchStudio(inquiryUrl || trialUrl, inquiryGoal || trialGoal, trialPersona);
              }}
              className="w-full justify-center text-xs bg-[#121212] text-white hover:bg-black"
            />

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onLaunchStudio('/benchmark', 'Test modal keyboard focus escape', 'keyboard')}
                className="text-[11px] font-mono text-[#6E6E6E] dark:text-slate-400 hover:text-[#121212] dark:hover:text-white transition-colors underline underline-offset-4"
              >
                Or launch with standard ground-truth benchmarks &rarr;
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-[#8A8A8A] border-t border-black/[0.06] dark:border-white/[0.06]">
            <span>✓ Cryptographic Causal Proofs</span>
            <span>Zero False Alarms</span>
          </div>
        </div>
      </section>

      {/* 8. EDITORIAL ENTERPRISE FOOTER */}
      <footer className="pt-16 pb-12 px-6 sm:px-8 lg:px-12 border-t border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#121212] text-xs text-[#6E6E6E] dark:text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-black/[0.08] dark:border-white/[0.08]">
          
          <div className="md:col-span-5 space-y-3">
            <BrandLogo size="md" showBadge={true} />
            <p className="text-xs text-[#6E6E6E] dark:text-white/60 leading-relaxed max-w-sm">
              The automated accessibility verification platform testing web applications like real humans with assistive needs do—delivering verified code fixes with zero false alarms.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="font-semibold text-[#121212] dark:text-white font-mono uppercase tracking-wider">Product</p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/benchmark', 'Run default benchmark suite', 'keyboard')}
                  className="hover:text-[#121212] dark:hover:text-white transition-colors"
                >
                  Audit Studio Cockpit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/fixtures/keyboard-trap', 'Inspect focus trap path', 'keyboard')}
                  className="hover:text-[#121212] dark:hover:text-white transition-colors"
                >
                  Issues &amp; Evidence Inspector
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onLaunchStudio('/fixtures/accname-wcag', 'Inspect Causal AST Patches', 'screen_reader')}
                  className="hover:text-[#121212] dark:hover:text-white transition-colors"
                >
                  Verified Code Fixes
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <p className="font-semibold text-[#121212] dark:text-white font-mono uppercase tracking-wider">Compliance Standards</p>
            <ul className="space-y-1.5 text-[#6E6E6E] dark:text-white/60">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>W3C WCAG 2.2 Level A, AA, AAA</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>European Accessibility Act (EAA 2025)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Americans with Disabilities Act (ADA Title III)</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p>&copy; 2026 BarrierLens Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[#8A8A8A] font-mono text-[11px]">
            <span>WCAG 2.2 LEVEL AAA</span>
            <span>EAA 2025 COMPLIANT</span>
            <span>MERKLE AUDIT LEDGER</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
