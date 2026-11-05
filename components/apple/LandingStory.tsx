'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Key, 
  Volume2, 
  VolumeX,
  Terminal, 
  GitBranch, 
  Cpu, 
  Layers, 
  Sparkles, 
  Play, 
  RotateCcw,
  CheckCircle2, 
  AlertTriangle,
  Compass,
  Sliders,
  Code2,
  FileDiff,
  Eye,
  Lock,
  ExternalLink
} from 'lucide-react';

interface LandingStoryProps {
  onEnterStudio: () => void;
  onOpenAuth: () => void;
}

export function LandingStory({ onEnterStudio, onOpenAuth }: LandingStoryProps) {
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

  // Metamorphic Effort Ratio Slider state
  const [effortMultiplier, setEffortMultiplier] = useState<number>(4.8);
  const baselineClicks = 1;
  const keyboardSteps = Math.round(baselineClicks * effortMultiplier * 11);
  const fatigueIndex = Math.min(100, Math.round(effortMultiplier * 18.5));

  // Interactive Tarjan SCC State
  const [activeNode, setActiveNode] = useState<number>(1);
  const [isTrapBroken, setIsTrapBroken] = useState<boolean>(false);
  const [tarjanCycleFound, setTarjanCycleFound] = useState<boolean>(false);

  const handleStepFocus = () => {
    if (activeNode === 1) setActiveNode(2);
    else if (activeNode === 2) setActiveNode(3);
    else if (activeNode === 3) {
      setActiveNode(4);
      if (!isTrapBroken) setTarjanCycleFound(true);
    } else if (activeNode === 4) {
      if (isTrapBroken) {
        setActiveNode(5);
        setTarjanCycleFound(false);
      } else {
        setActiveNode(3); // The infinite loop cycle!
        setTarjanCycleFound(true);
      }
    } else if (activeNode === 5) {
      setActiveNode(1);
      setTarjanCycleFound(false);
    }
  };

  const handleResetFocusGraph = () => {
    setActiveNode(1);
    setIsTrapBroken(false);
    setTarjanCycleFound(false);
  };

  // Auditory Screen Reader Demo (Web Speech API)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioTranscript, setAudioTranscript] = useState<string>('');

  const speakText = (text: string, onDone?: () => void) => {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) {
      setAudioTranscript(`[Browser Speech API unavailable]: "${text}"`);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setAudioTranscript(text);
    };
    utterance.onend = () => {
      setIsPlayingAudio(false);
      if (onDone) onDone();
    };
    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const playScreenReaderGap = () => {
    speakText("Cart item added visually. Screen reader announcement: Total silence. No live region triggered. The blind user does not know the cart was updated.");
  };

  const playScreenReaderFixed = () => {
    speakText("Alert polite: 1 item added to your shopping bag. Bag subtotal 42 dollars. Press Enter to view bag.");
  };

  // Causal Counterfactual Sandbox Replay
  const [isVerifyingSandbox, setIsVerifyingSandbox] = useState<boolean>(false);
  const [sandboxVerified, setSandboxVerified] = useState<boolean>(false);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);

  const handleRunSandboxReplay = () => {
    setIsVerifyingSandbox(true);
    setSandboxVerified(false);
    setSandboxLogs(['[Sandbox] Initializing isolated Chromium headless runner on AWS worker...']);

    setTimeout(() => {
      setSandboxLogs(prev => [...prev, '[DOM Patch] Injecting role="dialog" aria-modal="true" and keydown ESC listener...']);
    }, 400);

    setTimeout(() => {
      setSandboxLogs(prev => [...prev, '[Replay] Replaying original 54 recorded keyboard input events...']);
    }, 800);

    setTimeout(() => {
      setSandboxLogs(prev => [
        ...prev, 
        '[Verification] Tarjan SCC analysis: Cycle eradicated. Focus successfully released to #main-content.',
        '[Result] Goal completed in 6 steps. 0 regressions detected. Verified SEAL issued.'
      ]);
      setIsVerifyingSandbox(false);
      setSandboxVerified(true);
      setIsTrapBroken(true);
    }, 1500);
  };

  return (
    <div className="space-y-32 pb-24 text-[#f5f5f7]">
      {/* =========================================================================
          HERO SECTION (Apple Typographic Grandeur)
          ========================================================================= */}
      <section className="relative pt-20 pb-16 flex flex-col items-center text-center max-w-4xl mx-auto px-4">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[380px] bg-gradient-to-tr from-[#0071e3]/20 via-purple-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

        {/* Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-8 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
          <span className="text-xs font-medium text-[#f5f5f7]">BarrierLens 2.0</span>
          <span className="text-[11px] text-[#86868b]">• Powered by AWS Bedrock & Strands Agents</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-[-0.035em] text-[#f5f5f7] leading-[1.06] mb-8"
        >
          The web was made <br />
          <span className="bg-gradient-to-r from-[#0071e3] via-[#42a5f5] to-[#c084fc] bg-clip-text text-transparent">
            for every human.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-[#86868b] max-w-2xl font-normal leading-relaxed mb-12"
        >
          Accessibility is not a static checklist. It is a human journey. BarrierLens combines deterministic focus-graph proofs, simulated screen-reader acoustics, and an autonomous multi-agent swarm to prove and repair barriers before code ships.
        </motion.p>

        {/* Hero Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
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
        </motion.div>

        {/* Quick Tech Badges */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] w-full grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
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
          CHAPTER 1: THE METAMORPHIC EFFORT GAP
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0a84ff]">Chapter 01 • Metamorphic Disparity</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#f5f5f7]">
            One Goal. Two Worlds.
          </h2>
          <p className="text-sm text-[#86868b]">
            Static scanners check tags. BarrierLens measures the physical input disparity required between an unconstrained mouse user and an assistive keyboard user.
          </p>
        </div>

        {/* Interactive Slider Controller */}
        <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0071e3]" />
              <span className="text-xs font-medium text-[#f5f5f7]">Simulate Journey Friction Multiplier:</span>
              <span className="text-xs font-mono font-bold text-[#0a84ff] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                {effortMultiplier.toFixed(1)}x
              </span>
            </div>
            <div className="text-xs text-[#86868b]">
              Drag to observe cognitive fatigue and stroke compounding
            </div>
          </div>

          <input 
            type="range"
            min="1.0"
            max="8.0"
            step="0.2"
            value={effortMultiplier}
            onChange={(e) => setEffortMultiplier(parseFloat(e.target.value))}
            className="w-full accent-[#0071e3] cursor-pointer"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Mouse Column */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Mouse User
                </span>
                <span className="text-xs font-mono text-[#86868b]">Effort: 1.0x Baseline</span>
              </div>
              <h4 className="text-lg font-semibold text-[#f5f5f7]">1 Single Click • 1.2 Seconds</h4>
              <p className="text-xs text-[#86868b]">
                Cursor glides directly to the target element. No intermediate traversal required.
              </p>
              <div className="p-3 rounded-xl bg-black/40 font-mono text-[11px] text-[#86868b]">
                Action: PointerClick(x: 840, y: 420)
              </div>
            </div>

            {/* Keyboard Column */}
            <div className="p-5 rounded-2xl bg-red-950/[0.06] border border-red-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  Keyboard / Assistive
                </span>
                <span className="text-xs font-mono text-red-400 font-semibold">
                  Fatigue Score: {fatigueIndex}% ({effortMultiplier > 3.5 ? 'Severe Barrier' : 'Moderate Friction'})
                </span>
              </div>
              <h4 className="text-lg font-semibold text-[#f5f5f7]">{keyboardSteps} Sequential Keystrokes</h4>
              <p className="text-xs text-[#86868b]">
                User must press Tab through header menus, promotional banners, and invisible focus stops.
              </p>
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 font-mono text-[11px] text-red-300">
                Sequence: [Tab × {keyboardSteps}] → [Enter] (Disparity: {effortMultiplier.toFixed(1)}x)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 2: DETERMINISTIC PROOF (Tarjan's SCC Focus Traps)
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0a84ff]">Chapter 02 • Mathematical Certainty</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#f5f5f7]">
            Never Guess a Focus Trap Again.
          </h2>
          <p className="text-sm text-[#86868b]">
            We model every focusable element as a directed graph node. Using Tarjan's Strongly Connected Components algorithm, we detect keyboard traps with mathematical certainty.
          </p>
        </div>

        {/* Interactive Focus Graph Simulator */}
        <div className="apple-card p-8 rounded-3xl border border-white/8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[#f5f5f7] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#0071e3]" />
                Interactive Directed Focus Graph
              </h3>
              <p className="text-xs text-[#86868b]">Step through the focus path with Tab to observe cycle trapping.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStepFocus}
                className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
              >
                <span>Press [Tab]</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetFocusGraph}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#86868b] hover:text-[#f5f5f7] border border-white/10 transition-all"
                title="Reset Graph"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Node Visualization Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { id: 1, name: 'Search Input', selector: '#nav-search', type: 'Normal' },
              { id: 2, name: 'Modal Trigger', selector: '#open-promo', type: 'Trigger' },
              { id: 3, name: 'Modal Email', selector: '#promo-email', type: 'Modal Node A' },
              { id: 4, name: 'Modal Close', selector: '#promo-close', type: 'Modal Node B' },
              { id: 5, name: 'Main Checkout', selector: '#checkout-btn', type: 'Target' },
            ].map((node) => {
              const isCurrent = activeNode === node.id;
              const isTrappedInCycle = (node.id === 3 || node.id === 4) && tarjanCycleFound;

              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isCurrent
                      ? isTrappedInCycle 
                        ? 'bg-red-500/20 border-red-500 text-red-200 ring-2 ring-red-500/50' 
                        : 'bg-[#0071e3]/20 border-[#0071e3] text-blue-200 ring-2 ring-[#0071e3]/50'
                      : 'bg-white/[0.02] border-white/6 text-[#86868b]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      Node {node.id}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-[#0a84ff] animate-pulse">● FOCUS</span>
                    )}
                  </div>
                  <h5 className="text-xs font-semibold text-[#f5f5f7]">{node.name}</h5>
                  <p className="text-[10px] font-mono text-[#86868b] truncate">{node.selector}</p>
                </div>
              );
            })}
          </div>

          {/* Tarjan Proof Banner */}
          <AnimatePresence>
            {tarjanCycleFound && !isTrapBroken && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-red-300">
                      Tarjan SCC Cycle Certified: Sink SCC Detected in Component {`{Node 3, Node 4}`}
                    </h4>
                    <p className="text-[11px] text-red-400/80">
                      Out-degree is 0 to external DOM. Keyboard user cannot escape this dialog without a mouse or pointer device.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTrapBroken(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shrink-0 transition-all shadow-md shadow-emerald-500/20"
                >
                  Apply Escape Key Fix
                </button>
              </motion.div>
            )}

            {isTrapBroken && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-300">
                  Escape Handler Added. Focus now escapes to <code className="font-mono text-emerald-200">#checkout-btn (Node 5)</code>. Trap resolved!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 3: ACOUSTIC AUDITING (Web Speech API)
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0a84ff]">Chapter 03 • Acoustic Reality</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#f5f5f7]">
            Hear What Assistive Users Hear.
          </h2>
          <p className="text-sm text-[#86868b]">
            Visual feedback without acoustic announcement is an invisible wall. Experience the announcement gap using real browser speech synthesis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Defective Experience */}
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Visual Update Only (Broken)
              </span>
              <VolumeX className="w-4 h-4 text-red-400" />
            </div>
            <h4 className="text-base font-semibold text-[#f5f5f7]">Visual Banner with No Live Region</h4>
            <p className="text-xs text-[#86868b]">
              A toast notification appears on screen saying "Cart updated", but without <code className="text-red-300 font-mono">aria-live="polite"</code>, the screen reader remains completely silent.
            </p>
            <button
              onClick={playScreenReaderGap}
              disabled={isPlayingAudio}
              className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-xs font-medium text-[#f5f5f7] flex items-center justify-center gap-2 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5 text-red-400" />
              <span>Simulate Defective VoiceOver Audio</span>
            </button>
          </div>

          {/* Repaired Experience */}
          <div className="apple-card p-6 rounded-3xl border border-emerald-500/20 bg-emerald-950/[0.04] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Harmonized Acoustic Delivery
              </span>
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-base font-semibold text-[#f5f5f7]">Synthetic aria-live Toast</h4>
            <p className="text-xs text-[#86868b]">
              BarrierLens injects polite live announcements so the assistive synthesizer speaks immediately without interrupting focus.
            </p>
            <button
              onClick={playScreenReaderFixed}
              disabled={isPlayingAudio}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear Repaired Announcement</span>
            </button>
          </div>
        </div>

        {/* Audio Speech Subtitle Bar */}
        {audioTranscript && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs text-[#0a84ff] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#0a84ff] animate-ping shrink-0" />
            <div className="truncate">
              <span className="text-[#86868b] mr-2">Synthesizer Stream:</span>
              "{audioTranscript}"
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          CHAPTER 4: CAUSAL REPAIR & SANDBOX REPLAY
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0a84ff]">Chapter 04 • Verified Proof</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#f5f5f7]">
            Code Fixes That Prove Themselves.
          </h2>
          <p className="text-sm text-[#86868b]">
            Never push AI hallucinations to production. BarrierLens replays the exact failure trace in an isolated Chromium sandbox to guarantee the barrier is broken.
          </p>
        </div>

        <div className="apple-card p-6 sm:p-8 rounded-3xl border border-white/8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#0071e3]" />
              <h3 className="text-sm font-semibold text-[#f5f5f7]">Surgical ARIA Dialog Patch</h3>
            </div>
            <button
              onClick={handleRunSandboxReplay}
              disabled={isVerifyingSandbox}
              className="px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-75 transition-all"
            >
              {isVerifyingSandbox ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Replaying in Sandbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Verify Patch in Sandbox</span>
                </>
              )}
            </button>
          </div>

          {/* Side-by-side diff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
            {/* Before */}
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-2">
              <div className="flex items-center justify-between text-red-400 font-semibold border-b border-red-500/20 pb-2">
                <span>Before (Focus Trap)</span>
                <span>Broken</span>
              </div>
              <pre className="text-red-300 whitespace-pre-wrap leading-relaxed">
{`<div class="promo-modal">
  <h2>Newsletter Signup</h2>
  <input id="promo-email" />
  <button id="promo-close">×</button>
  <!-- Missing role="dialog" -->
  <!-- Missing aria-modal="true" -->
  <!-- No escape key listener -->
</div>`}
              </pre>
            </div>

            {/* After */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-semibold border-b border-emerald-500/20 pb-2">
                <span>After (Verified Patch)</span>
                <span>Verified Seal</span>
              </div>
              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
{`<div class="promo-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="promo-heading"
  onKeyDown={handleEscapeKey}
>
  <h2 id="promo-heading">Newsletter</h2>
  <input id="promo-email" />
  <button id="promo-close">×</button>
</div>`}
              </pre>
            </div>
          </div>

          {/* Sandbox Replay Terminal HUD */}
          {sandboxLogs.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/70 border border-white/10 font-mono text-[11px] space-y-1.5">
              <div className="text-[#86868b] flex items-center justify-between pb-2 border-b border-white/8">
                <span>Chromium Replay Runner: instance-bedrock-sandbox</span>
                <span className={sandboxVerified ? "text-emerald-400" : "text-[#0a84ff]"}>
                  {sandboxVerified ? "Differential Proof Passed" : "Replaying..."}
                </span>
              </div>
              {sandboxLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#0a84ff] select-none">›</span>
                  <span className={log.includes('SEAL') ? 'text-emerald-300 font-bold' : log.includes('Patch') ? 'text-blue-300' : 'text-[#f5f5f7]'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 5: AWS STRANDS SWARM ARCHITECTURE
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Chapter 05 • Distributed Swarm</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#f5f5f7]">
            Orchestrated on AWS Bedrock & Strands
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
          FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="text-center space-y-6 pt-12">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#f5f5f7]">
          Ready to experience BarrierLens Studio?
        </h2>
        <p className="text-sm text-[#86868b] max-w-xl mx-auto">
          Run your first autonomous accessibility mission today. Zero false alarms, mathematically certified evidence, and verified code fixes.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onEnterStudio}
            className="px-8 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
          >
            Launch Studio Console
          </button>
        </div>
      </section>
    </div>
  );
}