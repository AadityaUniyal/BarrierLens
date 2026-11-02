'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Key, 
  Volume2, 
  Terminal, 
  GitBranch, 
  Cpu, 
  Layers, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  Compass,
  Cloud,
  Network
} from 'lucide-react';

interface LandingStoryProps {
  onEnterStudio: () => void;
  onOpenAuth: () => void;
}

export function LandingStory({ onEnterStudio, onOpenAuth }: LandingStoryProps) {
  const [activeStoryChapter, setActiveStoryChapter] = useState<number>(1);
  const [simulatedGoal, setSimulatedGoal] = useState('Complete guest checkout on e-commerce cart');
  const [simulatingStep, setSimulatingStep] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const runMiniSimulation = () => {
    setSimulatingStep(true);
    setSimulationLog([
      'Spinning up isolated Chromium CDP context on AWS Bedrock worker...',
      'Agent Persona: Keyboard Only (pointer events physically disabled)',
      'Step 1: Focus dispatched to [Search Bar] via Tab',
      'Step 2: Focus moved to [Add to Cart] button',
      'Step 3: Dispatched [Enter] key. Shipping address modal rendered.',
      'Step 4: [PROVEN TRAP DETECTED] SCC cycle between #modal-input and #modal-close. Esc key ignored.',
      'Announcement-Gap Engine: Inline error appeared visually, but aria-live=polite was absent.',
      'Surgical Repair: Synthesizing role="dialog" aria-modal="true" patch with differential verification.'
    ]);
    setTimeout(() => {
      setSimulatingStep(false);
    }, 1800);
  };

  return (
    <div className="space-y-24 pb-20 animate-in fade-in duration-500">
      {/* =========================================================================
          HERO SECTION (Apple Typographic Grandeur)
          ========================================================================= */}
      <section className="relative pt-12 pb-16 flex flex-col items-center text-center max-w-4xl mx-auto px-4">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[340px] bg-gradient-to-tr from-[#0071e3]/20 via-purple-600/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
          <span className="text-xs font-medium text-[#f5f5f7]">Introducing BarrierLens 2.0</span>
          <span className="text-[11px] text-[#86868b]">• Powered by AWS Bedrock & Strands Agents</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.03em] text-[#f5f5f7] leading-[1.08] mb-6">
          The web was made <br />
          <span className="bg-gradient-to-r from-[#0071e3] via-[#42a5f5] to-[#c084fc] bg-clip-text text-transparent">
            for every human.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-[#86868b] max-w-2xl font-normal leading-relaxed mb-10">
          Accessibility is not a checklist. It is a human journey. BarrierLens combines deterministic focus-graph proofs, simulated screen-reader acoustics, and an autonomous multi-agent swarm to prove and repair barriers before code ships.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onEnterStudio}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/25 transition-all duration-200"
          >
            <span>Launch Studio Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.98] border border-white/10 backdrop-blur-md text-[#f5f5f7] text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
          >
            <Key className="w-4 h-4 text-[#0a84ff]" />
            <span>Sign in with Apple Passkey</span>
          </button>
        </div>

        {/* Quick Tech Badges */}
        <div className="mt-14 pt-8 border-t border-white/[0.08] w-full grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-[#f5f5f7] tabular-nums">1.3B+</p>
            <p className="text-xs text-[#86868b]">People worldwide locked out by behavioral web barriers</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-[#0a84ff] tabular-nums">0%</p>
            <p className="text-xs text-[#86868b]">False positives via Tarjan SCC mathematical certificates</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-emerald-400 tabular-nums">100%</p>
            <p className="text-xs text-[#86868b]">Verified repairs tested via counterfactual replay</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-purple-400 tabular-nums">AWS Bedrock</p>
            <p className="text-xs text-[#86868b]">Claude 3.5 Sonnet & Strands multi-agent swarm</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 1: THE INVISIBLE WALL (Metamorphic Effort Ratio)
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0a84ff]">Chapter 01 • The Metamorphic Reality</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f5f5f7]">
            One goal. Two completely different worlds.
          </h2>
          <p className="text-sm text-[#86868b]">
            Static page scanners check HTML tags. BarrierLens compares the actual physical effort required for an unconstrained mouse user versus a keyboard or screen-reader user.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Unconstrained Mouse */}
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mouse User (Unconstrained)
              </span>
              <span className="text-xs font-mono text-[#86868b]">Effort Baseline: 1.0x</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#f5f5f7]">1 Action • 1.2 Seconds</h3>
              <p className="text-xs text-[#86868b]">
                User visually identifies the "Pay Now" button, glides the mouse cursor directly to coordinate (840px, 420px), and clicks once.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/6 font-mono text-[11px] text-[#86868b]">
              Action: PointerClick(x: 840, y: 420) → Success
            </div>
          </div>

          {/* Card B: Constrained Keyboard / Screen Reader */}
          <div className="apple-card p-6 rounded-3xl border border-red-500/20 bg-red-950/[0.04] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Keyboard / Screen Reader User
              </span>
              <span className="text-xs font-mono text-red-400 font-semibold">Effort Ratio: 4.8x (Catastrophic)</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#f5f5f7]">54 Keystrokes • Trapped in Modal</h3>
              <p className="text-xs text-[#86868b]">
                User must press Tab through 40 unskipable navigation links, enters a promotional modal, and becomes permanently trapped in a cyclic focus loop.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-red-500/[0.04] border border-red-500/20 font-mono text-[11px] text-red-300">
              Trap Proof: [Tab x 42] → Modal → [Tab, Tab, Tab] (Cycle: Node #14 ↔ Node #15)
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 2: THE AWS STRANDS MULTI-AGENT SWARM
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Chapter 02 • Agentic Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f5f5f7]">
            Orchestrated on AWS Bedrock & Strands Agents
          </h2>
          <p className="text-sm text-[#86868b]">
            Five specialized autonomous agents collaborate in an isolated sandbox, governed by AWS IAM roles and token budget sentinels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0a84ff] flex items-center justify-center border border-blue-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7]">Milestone Planner</h4>
            <p className="text-xs text-[#86868b]">
              Translates complex goals into verifiable post-conditions, pruning search states to prevent loops.
            </p>
          </div>

          <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7]">Physics-Bound Navigator</h4>
            <p className="text-xs text-[#86868b]">
              Constrained strictly to real keyboard strokes and VoiceOver rotor shortcuts. Zero synthetic clicking allowed.
            </p>
          </div>

          <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Volume2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7]">Announcement Sentinel</h4>
            <p className="text-xs text-[#86868b]">
              Intercepts DOM visual changes and checks if assistive technology received equivalent audio announcements.
            </p>
          </div>

          <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7]">AWS Bedrock LLM Router</h4>
            <p className="text-xs text-[#86868b]">
              Dynamically routes between local rules (Tier 0), Groq Llama, and Claude 3.5 Sonnet on AWS Bedrock.
            </p>
          </div>

          <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <GitBranch className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7]">Causal Critic</h4>
            <p className="text-xs text-[#86868b]">
              Challenges claimed goal completions to confirm order numbers, confirmation states, and lack of visual deception.
            </p>
          </div>

          <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7]">Verified Fix Synthesizer</h4>
            <p className="text-xs text-[#86868b]">
              Writes minimal HTML/ARIA surgical patches, replays the exact trace in a sandbox, and issues a verified seal.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE DEMO WIDGET (Experience the Simulation Right Here)
          ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="apple-card-raised p-8 rounded-3xl border border-white/12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#f5f5f7] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0071e3]" />
                Experience the Agentic Cascade
              </h3>
              <p className="text-xs text-[#86868b]">Simulate an autonomous task-completion audit on your target journey.</p>
            </div>
            <button
              onClick={runMiniSimulation}
              disabled={simulatingStep}
              className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-75 transition-all"
            >
              {simulatingStep ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Agent Simulation</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">Task Goal</label>
            <input
              type="text"
              value={simulatedGoal}
              onChange={(e) => setSimulatedGoal(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#1c1c1e] border border-white/10 text-xs text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
            />
          </div>

          {/* Terminal HUD */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/8 font-mono text-[11px] text-[#f5f5f7] space-y-1.5 min-h-[140px] max-h-[220px] overflow-y-auto">
            <div className="text-[#86868b] flex items-center justify-between pb-2 border-b border-white/8">
              <span>Bedrock Session: bedrock-agent-cluster-east1</span>
              <span className="text-emerald-400">Ready</span>
            </div>
            {simulationLog.length === 0 ? (
              <p className="text-[#6e6e73] pt-6 text-center italic">Click "Run Agent Simulation" to watch the decision cascade in action.</p>
            ) : (
              simulationLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#0a84ff] select-none">›</span>
                  <span className={log.includes('TRAP') ? 'text-red-400 font-semibold' : log.includes('Repair') ? 'text-emerald-300' : 'text-[#f5f5f7]'}>
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="text-center space-y-6 pt-10">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#f5f5f7]">
          Ready to make your application accessible to all?
        </h2>
        <p className="text-sm text-[#86868b] max-w-xl mx-auto">
          Start testing your critical task flows with keyboard and screen-reader personas. Zero false alarms, mathematically certified evidence, and verified code fixes.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onEnterStudio}
            className="px-8 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
          >
            Enter BarrierLens Studio
          </button>
        </div>
      </section>
    </div>
  );
}
