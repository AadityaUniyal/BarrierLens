'use client';

import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Key, 
  Volume2, 
  VolumeX,
  Terminal, 
  RotateCcw,
  CheckCircle2, 
  AlertTriangle,
  Compass,
  Sliders,
  Code2,
  FileDiff,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface LandingStoryProps {
  onEnterStudio: () => void;
  onOpenAuth: () => void;
}

export function LandingStory({ onEnterStudio, onOpenAuth }: LandingStoryProps) {
  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
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
  const [trialPersona, setTrialPersona] = useState<'keyboard' | 'screen_reader'>('keyboard');

  // Metamorphic Effort Ratio Slider state
  const [effortMultiplier, setEffortMultiplier] = useState<number>(4.2);
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
        setActiveNode(3); // Closed sink loop!
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

  const speakText = (text: string) => {
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
    };
    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen text-[#f4f5f6] space-y-24 py-8">
      
      {/* 1. Hero Section (Linear Style: Typography-first, no fluffy gradients) */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181a1d] border border-[#26292d] text-xs font-mono text-[#9ba1a6]">
          <span className="w-2 h-2 rounded-full bg-[#30a46c]" />
          <span>v2.0 Task-Conditioned Autonomous Accessibility</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f4f5f6] leading-[1.12]">
          Accessibility audits without <br />
          <span className="text-[#9ba1a6]">the false positives.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#9ba1a6] max-w-2xl mx-auto leading-relaxed">
          Static scanners only check static HTML tags. BarrierLens executes real multi-step user journeys under physical keyboard and assistive constraints to mathematically prove what locks disabled users out.
        </p>

        {/* Instant Auditor Bar (Center Stage) */}
        <div className="pt-4 max-w-2xl mx-auto">
          <div className="p-2 rounded-xl bg-[#141517] border border-[#2d3137] shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a]">
                <Compass className="w-4 h-4 text-[#6b7280] shrink-0" />
                <input
                  type="text"
                  value={trialUrl}
                  onChange={(e) => setTrialUrl(e.target.value)}
                  placeholder="https://your-domain.com or /benchmark"
                  className="w-full bg-transparent text-sm text-[#f4f5f6] placeholder-[#6b7280] focus:outline-none font-mono"
                />
              </div>

              {/* Persona Selector */}
              <div className="flex items-center bg-[#0c0d0e] p-1 rounded-lg border border-[#23262a] w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setTrialPersona('keyboard')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    trialPersona === 'keyboard' 
                      ? 'bg-[#1f2226] text-[#f4f5f6] shadow-sm' 
                      : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                  }`}
                >
                  Keyboard
                </button>
                <button
                  type="button"
                  onClick={() => setTrialPersona('screen_reader')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    trialPersona === 'screen_reader' 
                      ? 'bg-[#1f2226] text-[#f4f5f6] shadow-sm' 
                      : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                  }`}
                >
                  Screen Reader
                </button>
              </div>

              <button
                type="button"
                onClick={onEnterStudio}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
              >
                <span>Audit Target</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center justify-between text-xs px-2 text-[#9ba1a6]">
              <span className="text-[11px] text-[#6b7280]">Verified Ground Truth Presets:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTrialUrl('/benchmark')}
                  className="hover:text-[#f4f5f6] underline underline-offset-4 font-mono text-[11px]"
                >
                  Modal Trap Benchmark
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setTrialUrl('/fixtures/keyboard-trap')}
                  className="hover:text-[#f4f5f6] underline underline-offset-4 font-mono text-[11px]"
                >
                  Focus Loss Fixture
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The 3 Superpowers (Linear Precision Cards) */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#f4f5f6] tracking-tight">
            The Three Invariants of Real-World Accessibility
          </h2>
          <p className="text-sm text-[#9ba1a6] max-w-xl mx-auto">
            Traditional scanners return 400 warnings with high false-positive rates. BarrierLens produces evidence developers cannot argue with.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Superpower 1: Tarjan SCC Keyboard Trap Proof */}
          <div className="p-6 rounded-2xl bg-[#141517] border border-[#23262a] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1c1e] border border-[#2d3137] flex items-center justify-center text-[#e5484d]">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#f4f5f6]">
                1. Tarjan SCC Trap Certificates
              </h3>
              <p className="text-xs text-[#9ba1a6] leading-relaxed">
                Applies Tarjan’s Strongly Connected Components algorithm over real focus transitions. If a user enters a dialog and out-degree equals zero, it produces a mathematical proof of the trap.
              </p>
            </div>

            {/* Interactive Graph Widget */}
            <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                <span>State Graph Topology</span>
                <span className={tarjanCycleFound ? 'text-[#e5484d] font-semibold' : 'text-[#30a46c]'}>
                  {tarjanCycleFound ? '● SINK CYCLE DETECTED' : '○ UNCONSTRAINED'}
                </span>
              </div>

              {/* Node Flow */}
              <div className="flex items-center justify-between gap-1 font-mono text-[11px] py-2">
                <div className={`px-2 py-1 rounded border ${activeNode === 1 ? 'border-[#0090ff] bg-[#0090ff]/10 text-[#f4f5f6]' : 'border-[#23262a] text-[#6b7280]'}`}>
                  #nav
                </div>
                <span>➔</span>
                <div className={`px-2 py-1 rounded border ${activeNode === 2 ? 'border-[#0090ff] bg-[#0090ff]/10 text-[#f4f5f6]' : 'border-[#23262a] text-[#6b7280]'}`}>
                  #open-btn
                </div>
                <span>➔</span>
                <div className={`px-2 py-1 rounded border ${activeNode === 3 ? 'border-[#e5484d] bg-[#e5484d]/10 text-[#e5484d] font-bold' : 'border-[#23262a] text-[#6b7280]'}`}>
                  #dialog
                </div>
                <span className={tarjanCycleFound ? 'text-[#e5484d] font-bold' : ''}>⇄</span>
                <div className={`px-2 py-1 rounded border ${activeNode === 4 ? 'border-[#e5484d] bg-[#e5484d]/10 text-[#e5484d] font-bold' : 'border-[#23262a] text-[#6b7280]'}`}>
                  #submit
                </div>
              </div>

              {/* Interactive Keystroke Trigger */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#23262a]">
                <button
                  type="button"
                  onClick={handleStepFocus}
                  className="px-3 py-1.5 rounded bg-[#1f2226] hover:bg-[#25282e] text-[#f4f5f6] text-[11px] font-mono border border-[#34383e] transition-all"
                >
                  Press [Tab Key] ⇥
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTrapBroken(true);
                    setTarjanCycleFound(false);
                    setActiveNode(5);
                  }}
                  className="text-[11px] text-[#30a46c] hover:underline"
                >
                  Inject Escape Fix
                </button>
              </div>
            </div>
          </div>

          {/* Superpower 2: Announcement-Gap Detector */}
          <div className="p-6 rounded-2xl bg-[#141517] border border-[#23262a] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1c1e] border border-[#2d3137] flex items-center justify-center text-[#f76808]">
                <Volume2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#f4f5f6]">
                2. The Announcement-Gap Detector
              </h3>
              <p className="text-xs text-[#9ba1a6] leading-relaxed">
                Catches silent state changes: intercepting DOM visual changes (error toasts, cart increments) and verifying whether assistive technology was actually notified via <code className="text-[#f4f5f6]">aria-live</code>.
              </p>
            </div>

            {/* Interactive Audio Widget */}
            <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                <span>Visual vs Assistive Reality</span>
                <span className="text-[#f76808] font-semibold">WCAG 4.1.3 Gap</span>
              </div>

              <div className="space-y-2">
                <div className="p-2 rounded bg-[#1f2226] border border-[#34383e] flex items-center justify-between">
                  <span className="text-[11px] text-[#f4f5f6]">Visual: "Payment Card Expired" banner</span>
                  <span className="text-[10px] text-[#30a46c] font-mono">VISIBLE</span>
                </div>

                <div className="p-2 rounded bg-[#181a1d] border border-[#e5484d]/30 text-[#e5484d] font-mono text-[11px]">
                  Audio: [SILENT - Missing aria-live]
                </div>
              </div>

              <button
                type="button"
                onClick={() => speakText("Warning: Payment failed. Form requires expiration date correction.")}
                className="w-full py-1.5 rounded bg-[#1f2226] hover:bg-[#25282e] text-[#f4f5f6] text-[11px] font-medium border border-[#34383e] flex items-center justify-center gap-1.5 transition-all"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#f76808]" />
                <span>Hear Assistive Stream with Patch</span>
              </button>
            </div>
          </div>

          {/* Superpower 3: Metamorphic Effort Ratio */}
          <div className="p-6 rounded-2xl bg-[#141517] border border-[#23262a] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1c1e] border border-[#2d3137] flex items-center justify-center text-[#0090ff]">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#f4f5f6]">
                3. Metamorphic Effort Ratio
              </h3>
              <p className="text-xs text-[#9ba1a6] leading-relaxed">
                Executes the exact same goal under a mouse persona vs a keyboard/screen-reader persona. Quantifies cognitive and physical friction into one clear metric: <code className="text-[#f4f5f6]">4.2x harder</code>.
              </p>
            </div>

            {/* Interactive Slider Widget */}
            <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6b7280]">Effort Multiplier</span>
                <span className="font-mono text-base font-bold text-[#0090ff]">
                  {effortMultiplier.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.2"
                value={effortMultiplier}
                onChange={(e) => setEffortMultiplier(parseFloat(e.target.value))}
                className="w-full accent-[#0090ff] cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-[#9ba1a6] pt-1">
                <span>Mouse: 1 Click</span>
                <span>Keyboard: {keyboardSteps} Keystrokes</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Verified Closed-Loop AST Fixes */}
      <section className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#f4f5f6] tracking-tight">
            Fixes Backed by Sandbox Verification
          </h2>
          <p className="text-sm text-[#9ba1a6] max-w-xl mx-auto">
            BarrierLens doesn't guess code fixes. It patches the DOM in a sandboxed headless replay, repeats the exact blocked key sequence, and confirms zero regressions.
          </p>
        </div>

        {/* Clean Code Diff Component */}
        <div className="rounded-xl bg-[#141517] border border-[#23262a] overflow-hidden shadow-xl text-xs font-mono">
          <div className="px-4 py-2.5 bg-[#181a1d] border-b border-[#23262a] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#9ba1a6]">
              <Code2 className="w-4 h-4" />
              <span>components/ModalDialog.tsx (Surgical AST Patch)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#30a46c]/10 text-[#30a46c] border border-[#30a46c]/30 font-semibold text-[10px]">
              VERIFIED REPLAY: PASS
            </span>
          </div>

          <div className="p-4 space-y-1 overflow-x-auto text-[12px] leading-relaxed">
            <div className="text-[#6b7280]">  &lt;div className="modal-container"&gt;</div>
            <div className="bg-[#e5484d]/10 text-[#e5484d] px-2 py-0.5 rounded">
              -   &lt;div className="dialog-body"&gt;
            </div>
            <div className="bg-[#30a46c]/10 text-[#30a46c] px-2 py-0.5 rounded">
              {'+   <div className="dialog-body" role="dialog" aria-modal="true" onKeyDown={handleEscape}>'}
            </div>
            <div className="text-[#6b7280]">      &lt;h2&gt;Confirm Subscription&lt;/h2&gt;</div>
            <div className="text-[#6b7280]">      &lt;button id="claim-btn"&gt;Confirm&lt;/button&gt;</div>
            <div className="text-[#6b7280]">  &lt;/div&gt;</div>
          </div>
        </div>
      </section>

      {/* 4. Final Call to Action */}
      <section className="max-w-3xl mx-auto px-4 text-center space-y-6 pt-8 pb-16">
        <h2 className="text-3xl font-bold text-[#f4f5f6]">
          Ready to verify your mission-critical flows?
        </h2>
        <p className="text-sm text-[#9ba1a6] max-w-lg mx-auto">
          Start auditing with one command. Test your checkout, onboarding, and modal journeys under real assistive physics.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onEnterStudio}
            className="px-6 py-2.5 rounded-lg bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] font-semibold text-xs transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
          >
            <span>Launch Audit Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-5 py-2.5 rounded-lg bg-[#141517] hover:bg-[#1f2226] text-[#f4f5f6] border border-[#2d3137] font-medium text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
          >
            <span>Sign In / Workspace</span>
          </button>
        </div>
      </section>

    </div>
  );
}
