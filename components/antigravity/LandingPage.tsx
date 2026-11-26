'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Cpu,
  FileCheck2,
  GitBranch,
  GitPullRequest,
  Keyboard,
  Layers,
  ShieldCheck,
  Terminal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { KineticButton } from '@/components/ui/KineticButton';
import { AuthModal, UserSession } from './AuthModal';
import { authClient } from '@/lib/auth-client';

const BENCHMARKS = [
  {
    id: 'bench-main',
    title: 'Unified WCAG Benchmark',
    url: '/benchmark',
    goal: 'Navigate modal, test keyboard trap escape, and verify form labels',
    persona: 'keyboard',
    wcag: 'WCAG 2.1.2 · 4.1.2',
  },
  {
    id: 'bench-trap',
    title: 'Modal Focus Sink Trap',
    url: '/fixtures/keyboard-trap',
    goal: 'Open dialog and verify Escape / Shift+Tab exit path',
    persona: 'keyboard',
    wcag: 'WCAG 2.1.2 (Level A)',
  },
  {
    id: 'bench-order',
    title: 'Disordered Reading Grid',
    url: '/fixtures/disordered-unreachable',
    goal: 'Verify visual-to-DOM reading order via Kendall Tau',
    persona: 'screen_reader',
    wcag: 'WCAG 1.3.2 (Level A)',
  },
  {
    id: 'bench-focus',
    title: 'Focus Loss on Item Delete',
    url: '/fixtures/focus-loss',
    goal: 'Delete item and verify focus does not reset to document.body',
    persona: 'keyboard',
    wcag: 'WCAG 2.4.3 (Level A)',
  },
  {
    id: 'bench-accname',
    title: 'AccName Provenance Suite',
    url: '/fixtures/accname-wcag',
    goal: 'Inspect icon buttons and compute W3C AccName 1.2 tree',
    persona: 'screen_reader',
    wcag: 'WCAG 4.1.2 (Level A)',
  },
];

const FAQS = [
  {
    q: 'How is BarrierLens different from axe-core or Lighthouse?',
    a: 'Static linters inspect dead DOM snapshots. BarrierLens launches headless Chromium over CDP, presses real Tab/Enter/Escape keys, models closed focus sinks using Tarjan Strongly Connected Components, and verifies patches with differential replay.',
  },
  {
    q: 'Does BarrierLens modify my production codebase automatically?',
    a: 'Never without review. Every patch is synthesized via parse5 HTML5 AST surgery, re-tested in an isolated browser replay to confirm zero regressions, and dispatched as a reviewable unified diff or GitHub Pull Request.',
  },
  {
    q: 'Can I test authenticated staging flows?',
    a: 'Yes. Pass session cookies or custom bearer headers in the Studio launcher or via the BarrierLens CLI (npx tsx scripts/barrierlens-ci.mjs) inside your CI pipeline.',
  },
];

export function LandingPage() {
  const router = useRouter();
  const [cockpitTab, setCockpitTab] = useState<'trap' | 'diff' | 'audio' | 'score'>('trap');
  const [simStep, setSimStep] = useState<1 | 2 | 3>(1);
  const [simPatched, setSimPatched] = useState(false);
  const [simNotice, setSimNotice] = useState<string | null>(null);
  const [benchView, setBenchView] = useState<'grid' | 'list'>('grid');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  const [targetUrl, setTargetUrl] = useState('/benchmark');
  const [goal, setGoal] = useState('Test modal keyboard focus escape and verify accessible names');
  const [cookies, setCookies] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealthOk(d.status === 'ok'))
      .catch(() => setHealthOk(false));

    (authClient as any)
      .getSession()
      .then((res: any) => {
        if (res?.data?.user) {
          const u = res.data.user;
          setUser({
            id: u.id,
            name: u.name || u.email?.split('@')[0] || 'Auditor',
            email: u.email,
            avatarUrl: u.image,
          });
        }
      })
      .catch(() => {});
  }, []);

  const launchStudio = (url: string, g: string, persona = 'keyboard', auto = true) => {
    if (cookies.trim()) {
      try {
        sessionStorage.setItem('barrierlens_launch_cookies', cookies.trim());
      } catch {}
    }
    const params = new URLSearchParams({
      url,
      goal: g,
      persona,
      auto: auto ? '1' : '0',
    });
    router.push(`/dashboard/studio?${params.toString()}`);
  };

  const handleSimTab = () => {
    setSimNotice(null);
    if (simPatched) {
      setSimStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 1));
    } else {
      // Trap cycles between 2 and 3
      setSimStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 2));
    }
  };

  const handleSimEscape = () => {
    if (simPatched) {
      setSimStep(1);
      setSimNotice('Escaped cleanly — focus restored to #open-modal-btn.');
    } else {
      setSimNotice('TRAP PROVEN: Escape had no handler. Tarjan SCC = {#confirm-btn, #cancel-btn}.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating Antigravity Top Nav */}
      <header className="sticky top-0 z-40 bg-[#07080b]/75 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <BrandLogo size="md" showBadge={true} />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-xs text-slate-400">
            <a href="#proof-cockpit" className="hover:text-white transition-colors">Proof Engine</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#benchmarks" className="hover:text-white transition-colors">Benchmarks</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-slate-300">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  healthOk === true ? 'bg-emerald-400' : healthOk === false ? 'bg-amber-400' : 'bg-slate-500 animate-pulse'
                }`}
              />
              <span>{healthOk === true ? 'All Systems Operational' : healthOk === false ? 'Degraded' : 'Checking'}</span>
            </div>

            {user ? (
              <Link
                href="/dashboard"
                className="px-3.5 py-2 rounded-full bg-white text-black hover:bg-slate-200 text-xs font-semibold transition-colors"
              >
                Open Cockpit
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="px-3 py-2 rounded-full text-xs text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 rounded-full bg-white text-black hover:bg-slate-200 text-xs font-semibold transition-colors"
                >
                  Open Cockpit
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0090ff] animate-pulse" />
            <span>Live: Tarjan SCC Keyboard Trap Engine &amp; parse5 AST Surgery</span>
          </div>

          <div className="max-w-4xl mx-auto space-y-5">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#f8fafc] leading-[1.05]">
              Prove what locks them out.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0090ff] to-emerald-400">
                Fix it before you ship.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#cbd5e1] max-w-2xl mx-auto leading-relaxed">
              Static linters only inspect dead HTML strings. BarrierLens drives real headless Chromium journeys,
              proves focus traps and reading-order inversions mathematically, and verifies code patches via replay.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <KineticButton
              variant="primary"
              onClick={() => launchStudio('/benchmark', 'Test modal keyboard focus escape', 'keyboard', true)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Launch Audit Studio
            </KineticButton>
            <a
              href="#proof-cockpit"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs sm:text-sm font-medium text-white transition-all"
            >
              Interactive Proof Cockpit
            </a>
          </div>
        </section>

        {/* Interactive Proof Cockpit */}
        <section id="proof-cockpit" className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
          <SpotlightCard className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
                  Interactive Proof Cockpit
                </p>
                <h2 className="text-lg font-semibold text-white mt-0.5">
                  Test a Keyboard Trap &amp; Verified Patch Live
                </h2>
              </div>
              <SegmentedControl
                value={cockpitTab}
                onChange={(v) => setCockpitTab(v as any)}
                options={[
                  { id: 'trap', label: 'Keyboard Path' },
                  { id: 'diff', label: 'Code Fix PR' },
                  { id: 'audio', label: 'Voice Transcript' },
                  { id: 'score', label: 'Compliance Score' },
                ]}
              />
            </div>

            {cockpitTab === 'trap' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="p-5 rounded-xl bg-[#07080b] border border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Simulated DOM Dialog</span>
                    <span className={simPatched ? 'text-emerald-400' : 'text-rose-400'}>
                      {simPatched ? 'PATCHED (Esc enabled)' : 'TRAPPED (SCC Sink)'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { step: 1, id: '#open-modal-btn', label: 'Trigger Button (Origin)' },
                      { step: 2, id: '#confirm-btn', label: 'Modal: Confirm Action' },
                      { step: 3, id: '#cancel-btn', label: 'Modal: Cancel Action' },
                    ].map((node) => (
                      <div
                        key={node.step}
                        className={`px-3.5 py-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition-all ${
                          simStep === node.step
                            ? 'bg-[#0090ff]/15 border-[#0090ff]/50 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                        }`}
                      >
                        <span>{node.id}</span>
                        <span className="text-[11px]">{simStep === node.step ? 'FOCUSED' : node.label}</span>
                      </div>
                    ))}
                  </div>

                  {simNotice && (
                    <div
                      role="status"
                      className={`p-3 rounded-lg text-xs font-mono border ${
                        simPatched
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {simNotice}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] border border-white/10">Tab</kbd> to
                    traverse focus. Without the AST patch, focus cycles endlessly between <code className="text-rose-300">#confirm-btn</code> and{' '}
                    <code className="text-rose-300">#cancel-btn</code>. Apply the patch to inject <code className="text-emerald-300">aria-modal=&quot;true&quot;</code> and an{' '}
                    <code className="text-emerald-300">Escape</code> restore handler.
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleSimTab}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-white"
                    >
                      Press Tab
                    </button>
                    <button
                      type="button"
                      onClick={handleSimEscape}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-white"
                    >
                      Press Escape
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimPatched((v) => !v);
                        setSimStep(1);
                        setSimNotice(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        simPatched
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-[#0090ff] hover:bg-[#007be0] text-white'
                      }`}
                    >
                      {simPatched ? 'Revert AST Patch' : 'Apply parse5 AST Patch'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cockpitTab === 'diff' && (
              <pre className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed">
{`--- a/src/components/CheckoutModal.tsx
+++ b/src/components/CheckoutModal.tsx
@@ -1,3 +1,3 @@
-<div id="trap-modal" class="modal-card">
+<div id="trap-modal" class="modal-card" role="dialog" aria-modal="true" tabindex="-1" onkeydown="if (event.key === 'Escape') { this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true })); }">
   <h2>Special Confirmation</h2>
   <button id="confirm-btn">Confirm</button>
 </div>`}
              </pre>
            )}

            {cockpitTab === 'audio' && (
              <div className="p-5 rounded-xl bg-[#07080b] border border-white/[0.08] space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-rose-300">
                  <VolumeX className="w-4 h-4" />
                  <span>PRE-PATCH: Form error banner rendered visually, 0ms ARIA live speech emitted (CMSD = 1.0).</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <Volume2 className="w-4 h-4" />
                  <span>POST-PATCH: &quot;Status: Please enter a valid billing postal code.&quot; (role=&quot;status&quot; aria-live=&quot;polite&quot;).</span>
                </div>
              </div>
            )}

            {cockpitTab === 'score' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08]">
                  <p className="text-[11px] font-mono text-slate-400">WCAG 2.2 Level AA</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">100% Proven</p>
                </div>
                <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08]">
                  <p className="text-[11px] font-mono text-slate-400">Keyboard Effort Ratio</p>
                  <p className="text-2xl font-bold text-white mt-1 font-mono">1.08x</p>
                </div>
                <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08]">
                  <p className="text-[11px] font-mono text-slate-400">VPAT 2.5 Export</p>
                  <p className="text-2xl font-bold text-[#0090ff] mt-1">Ready</p>
                </div>
              </div>
            )}
          </SpotlightCard>
        </section>

        {/* Asymmetrical 6-Card Bento Grid */}
        <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-8">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
              Deterministic Verification Engine
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Six mathematical engines. Zero heuristic guesswork.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SpotlightCard className="md:col-span-2 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#0090ff]">
                <Layers className="w-4 h-4" />
                <span>KENDALL&apos;S TAU RANK CORRELATION</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Visual vs. DOM Reading Order</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Computes exact rank correlation between visual bounding-box reading order and CDP accessibility tree traversal order to catch CSS flex/grid inversions.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <GitBranch className="w-4 h-4" />
                <span>TARJAN SCC</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Directed Cycle Trap Proof</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Finds closed strongly-connected sink components in the focus graph and outputs the exact reproducing key sequence.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <Volume2 className="w-4 h-4" />
                <span>CMSD DETECTOR</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Assistive Silence Detection</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Detects visible DOM state mutations (errors, toasts, drawers) that emit zero ARIA live-region announcements.
              </p>
            </SpotlightCard>

            <SpotlightCard className="md:col-span-2 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#0090ff]">
                <GitPullRequest className="w-4 h-4" />
                <span>PARSE5 AST + DIFFERENTIAL REPLAY</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Verified Code Fixes &amp; 1-Click GitHub PRs</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Mutates HTML5 AST nodes cleanly, injects the candidate patch into headless Chromium, replays the failing trace, and certifies zero layout shift before opening a PR.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Keyboard className="w-4 h-4" />
                <span>MULTI-PERSONA SWARM</span>
              </div>
              <h3 className="text-lg font-semibold text-white">5 Assistive Constraints</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Tests keyboard-only, screen reader, low vision, motor tremor, and cognitive constraints in parallel.
              </p>
            </SpotlightCard>

            <SpotlightCard className="md:col-span-2 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <FileCheck2 className="w-4 h-4 text-[#0090ff]" />
                <span>STATUTORY COMPLIANCE VAULT</span>
              </div>
              <h3 className="text-lg font-semibold text-white">VPAT 2.5, EAA 2025 &amp; ADA Title III Export</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Generates signed compliance bundles, public scorecards, and CI/CD JUnit gatekeeper reports ready for legal and enterprise procurement.
              </p>
            </SpotlightCard>
          </div>
        </section>

        {/* Benchmarks */}
        <section id="benchmarks" className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
                Ground-Truth Testbeds
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Run 1-Click Audits Against Built-In Fixtures
              </h2>
            </div>
            <SegmentedControl
              value={benchView}
              onChange={(v) => setBenchView(v as 'grid' | 'list')}
              options={[
                { id: 'grid', label: 'Grid View' },
                { id: 'list', label: 'List View' },
              ]}
            />
          </div>

          <div className={benchView === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'space-y-2.5'}>
            {BENCHMARKS.map((b) => (
              <SpotlightCard
                key={b.id}
                className={`p-5 ${benchView === 'list' ? 'flex flex-col sm:flex-row sm:items-center justify-between gap-4' : 'space-y-3'}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{b.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                      {b.wcag}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">{b.goal}</p>
                </div>
                <button
                  type="button"
                  onClick={() => launchStudio(b.url, b.goal, b.persona, true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-[#0090ff] text-xs font-medium text-white transition-colors shrink-0"
                >
                  <span>Run Audit</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">Pricing</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Transparent Engineering Tiers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: 'Community',
                price: '$0',
                desc: 'Open-source CLI, local Playwright runner, and benchmark fixtures.',
                items: ['CLI & GitHub Action', 'Tarjan SCC & Kendall Tau', 'Local AST diff generation'],
              },
              {
                name: 'Growth',
                price: '$149/mo',
                desc: 'Continuous staging audits, differential replay, and GitHub PR bot.',
                items: ['100 verified journeys/mo', 'Auto-verified PRs', 'VPAT 2.5 HTML & JSON exports'],
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                desc: 'Dedicated VPC workers, SSO/Passkeys, and multi-persona swarms.',
                items: ['Unlimited domains & workers', 'AWS Bedrock / Private SLM', 'Cryptographic compliance ledger'],
              },
            ].map((tier) => (
              <SpotlightCard
                key={tier.name}
                className={`p-6 space-y-5 ${tier.highlight ? 'border-[#0090ff]/40' : ''}`}
              >
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400">{tier.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{tier.price}</p>
                  <p className="text-xs text-[#94a3b8] mt-2">{tier.desc}</p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    tier.highlight
                      ? 'bg-[#0090ff] hover:bg-[#007be0] text-white'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white'
                  }`}
                >
                  Get Started
                </button>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Direct Audit Launcher & FAQ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#0b0d13] border border-white/[0.08] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left text-xs font-semibold text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[#94a3b8] leading-relaxed border-t border-white/[0.06] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <SpotlightCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0090ff]">
              <Terminal className="w-4 h-4" />
              <span>DIRECT CUJ AUDIT LAUNCHER</span>
            </div>
            <div>
              <label htmlFor="launch-url" className="block text-[11px] font-mono text-slate-400 mb-1">
                Target URL or Fixture
              </label>
              <input
                id="launch-url"
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="launch-goal" className="block text-[11px] font-mono text-slate-400 mb-1">
                Journey Goal
              </label>
              <input
                id="launch-goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white focus:border-[#0090ff] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="launch-cookies" className="block text-[11px] font-mono text-slate-400 mb-1">
                Optional Staging Cookies (JSON)
              </label>
              <input
                id="launch-cookies"
                type="text"
                value={cookies}
                onChange={(e) => setCookies(e.target.value)}
                placeholder='{"session": "..."}'
                className="w-full px-3.5 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white placeholder-slate-600 focus:border-[#0090ff] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => launchStudio(targetUrl || '/benchmark', goal, 'keyboard', true)}
              className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-semibold transition-colors"
            >
              Launch Autonomous Verification
            </button>
          </SpotlightCard>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showBadge={false} />
            <span>© 2026 BarrierLens Inc.</span>
          </div>
          <div className="flex items-center gap-5 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> WCAG 2.2 AA/AAA</span>
            <span className="inline-flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-[#0090ff]" /> EAA 2025</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={(u) => {
          setUser(u);
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
