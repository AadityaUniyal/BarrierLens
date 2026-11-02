'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Activity, 
  Sliders, 
  Layers, 
  Eye, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Cpu
} from 'lucide-react';

export type SimulatorPersona = 'keyboard' | 'voiceover' | 'tremor';
export type VisionFilterMode = 'normal' | 'blur' | 'protanopia' | 'contrast';

interface FocusNodeCoord {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isTrapped?: boolean;
}

export function VisualTwinSimulator() {
  const [activePersona, setActivePersona] = useState<SimulatorPersona>('keyboard');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTrapFixed, setIsTrapFixed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [tremorIntensity, setTremorIntensity] = useState<number>(0); // 0 = off, 1 = mild, 2 = severe
  const [contrastMode, setContrastMode] = useState(false);
  const [visionFilter, setVisionFilter] = useState<VisionFilterMode>('normal');
  const [reflow320, setReflow320] = useState(false);

  // Live Speech buffer & waveform state
  const [currentSpeechText, setCurrentSpeechText] = useState('VoiceOver ready. Press Play to begin traversal.');
  const [speechBufferHistory, setSpeechBufferHistory] = useState<string[]>([]);
  const [waveformActive, setWaveformActive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 180, y: 120 });
  const [tremorOffset, setTremorOffset] = useState({ x: 0, y: 0 });

  // DOM node definitions for our e-commerce checkout visual twin
  const nodes: FocusNodeCoord[] = [
    { id: 'node-search', name: 'Search Store', role: 'searchbox', x: 28, y: 18, w: 140, h: 28 },
    { id: 'node-nav-bag', name: 'Review Bag (2 Items)', role: 'button', x: 260, y: 18, w: 130, h: 28 },
    { id: 'node-item-pro', name: 'MacBook Pro 16" - Space Black', role: 'link', x: 28, y: 85, w: 220, h: 36 },
    { id: 'node-item-qty', name: 'Quantity: 1', role: 'combobox', x: 260, y: 88, w: 90, h: 30 },
    { id: 'node-checkout-btn', name: 'Proceed to Checkout', role: 'button', x: 28, y: 140, w: 180, h: 36 },
    // Modal Trap Nodes (Active when isModalOpen = true)
    { id: 'node-modal-email', name: 'Modal: Enter Apple Account Email', role: 'textbox', x: 80, y: 220, w: 240, h: 34, isTrapped: !isTrapFixed },
    { id: 'node-modal-continue', name: 'Modal: Continue with Apple ID', role: 'button', x: 80, y: 270, w: 240, h: 36, isTrapped: !isTrapFixed },
    { id: 'node-modal-cancel', name: 'Modal: Cancel & Dismiss', role: 'button', x: 80, y: 320, w: 110, h: 32, isTrapped: !isTrapFixed },
    // Escape target node (only reachable when trap is fixed)
    { id: 'node-order-summary', name: 'Order Total: $2,499.00', role: 'region', x: 28, y: 390, w: 320, h: 40 },
  ];

  // Key navigation step sequence
  // If trap is not fixed, steps 5 -> 6 -> 7 -> 5 repeat indefinitely (Tarjan SCC Trap)
  const traversalSteps = isTrapFixed
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8] // Escapes cleanly to Order Summary
    : [0, 1, 2, 3, 4, 5, 6, 7, 5, 6, 7, 5]; // Cyclic focus loop on modal!

  const activeNodeIndex = traversalSteps[currentStep % traversalSteps.length];
  const activeNode = nodes[activeNodeIndex];

  // Synthesize VoiceOver Speech using Web Speech API
  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined') return;
    try {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15; // Fast, natural screen reader cadence
      utterance.pitch = 1.05;
      utterance.onstart = () => setWaveformActive(true);
      utterance.onend = () => setWaveformActive(false);
      window.speechSynthesis?.speak(utterance);
    } catch {}
  };

  // Motor tremor jitter animation effect
  useEffect(() => {
    if (tremorIntensity === 0) {
      setTremorOffset({ x: 0, y: 0 });
      return;
    }
    const interval = setInterval(() => {
      const maxJitter = tremorIntensity === 1 ? 4 : 14;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * maxJitter;
      setTremorOffset({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      });
    }, 60);
    return () => clearInterval(interval);
  }, [tremorIntensity]);

  // Stepping automation
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        const targetNode = nodes[traversalSteps[next % traversalSteps.length]];
        
        // Announce speech
        const speechPhrase = `${targetNode.name}, ${targetNode.role}`;
        setCurrentSpeechText(speechPhrase);
        setSpeechBufferHistory((hist) => [speechPhrase, ...hist.slice(0, 5)]);
        speakText(speechPhrase);

        // Move cursor smoothly
        setCursorPos({
          x: targetNode.x + targetNode.w / 2,
          y: targetNode.y + targetNode.h / 2,
        });

        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isPlaying, isTrapFixed, speechEnabled]);

  // Check if current node is inside the Tarjan Focus Trap loop
  const isCurrentlyInTrap = !isTrapFixed && currentStep >= 7;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Cupertino Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl apple-glass border-hairline border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border-hairline border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2">
              <span>Interactive Visual Twin Simulator</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Playwright CDP Live
              </span>
            </div>
            <div className="text-xs text-[#86868b] font-mono">
              https://store.apple.com/shop/checkout • SVG Focus Graph • Web Audio
            </div>
          </div>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-black/40 border-hairline border-white/10">
          {[
            { id: 'keyboard' as const, label: 'Keyboard User' },
            { id: 'voiceover' as const, label: 'VoiceOver Blind' },
            { id: 'tremor' as const, label: 'Motor Tremor' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePersona(p.id);
                if (p.id === 'tremor') setTremorIntensity(2);
                else setTremorIntensity(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activePersona === p.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split-Screen Main Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Interactive Visual Twin with SVG Focus Path Overlay (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative rounded-3xl p-6 apple-glass border-hairline border-white/10 shadow-2xl overflow-hidden min-h-[500px]">
            {/* Visual Twin Window Controls Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#86868b]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Viewport: 420px × 460px</span>
              </div>

              {/* Simulation Stepper Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play Traversal'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(0);
                    setCurrentSpeechText('Traversal reset. Press Play to begin.');
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#86868b] hover:text-white border-hairline border-white/10 active:scale-95 transition-all"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Application Mock Viewport Container */}
            <div
              style={{
                filter: visionFilter === 'blur'
                  ? 'blur(3.5px)'
                  : visionFilter === 'protanopia'
                  ? 'url(#protanopia-filter)'
                  : undefined
              }}
              className={`relative rounded-2xl p-5 border transition-all duration-300 min-h-[440px] ${
                contrastMode || visionFilter === 'contrast'
                  ? 'bg-black text-yellow-300 border-yellow-400'
                  : 'bg-[#18181a] text-[#f5f5f7] border-white/5'
              } ${reflow320 ? 'max-w-[320px] mx-auto' : 'w-full'}`}
            >
              {/* E-Commerce App Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div
                  id="node-search"
                  className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                    activeNodeIndex === 0
                      ? 'border-blue-400 ring-2 ring-blue-500/50 bg-blue-500/20'
                      : 'border-white/10 bg-black/40 text-[#86868b]'
                  }`}
                >
                  🔍 Search Store
                </div>

                <div
                  id="node-nav-bag"
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    activeNodeIndex === 1
                      ? 'border-blue-400 ring-2 ring-blue-500/50 bg-blue-500/20'
                      : 'border-white/10 bg-black/40 text-[#86868b]'
                  }`}
                >
                  🛍️ Review Bag (2)
                </div>
              </div>

              {/* Product Card */}
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div
                  id="node-item-pro"
                  className={`text-xs font-medium transition-all p-1.5 rounded-lg ${
                    activeNodeIndex === 2 ? 'bg-blue-500/20 ring-2 ring-blue-500 text-blue-300' : 'text-[#f5f5f7]'
                  }`}
                >
                  MacBook Pro 16&quot; (M3 Max)
                </div>

                <div
                  id="node-item-qty"
                  className={`text-xs px-2 py-1 rounded-lg border font-mono transition-all ${
                    activeNodeIndex === 3 ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-500' : 'border-white/10 text-[#86868b]'
                  }`}
                >
                  Qty: 1 ▾
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="mt-4">
                <button
                  id="node-checkout-btn"
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeNodeIndex === 4
                      ? 'bg-blue-600 text-white ring-4 ring-blue-400/40 shadow-lg'
                      : 'bg-gradient-to-r from-[#0071e3] to-[#42a5f5] text-white hover:brightness-110'
                  }`}
                >
                  Proceed to Checkout ($2,499.00)
                </button>
              </div>

              {/* Modal Dialog (The Tarjan Trap Suspect) */}
              {isModalOpen && (
                <div
                  className={`mt-6 p-4 rounded-2xl border transition-all duration-300 relative ${
                    isCurrentlyInTrap
                      ? 'bg-red-950/20 border-red-500/60 shadow-2xl shadow-red-500/10'
                      : 'bg-black/60 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#f5f5f7]">Sign in with Apple ID</span>
                    {isCurrentlyInTrap && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                        ⚠️ Tarjan SCC Loop
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      id="node-modal-email"
                      type="text"
                      readOnly
                      value="aaditya@apple.com"
                      className={`w-full px-3 py-1.5 rounded-xl text-xs bg-black/60 border font-mono transition-all ${
                        activeNodeIndex === 5
                          ? isCurrentlyInTrap
                            ? 'border-red-500 ring-2 ring-red-500/50 bg-red-500/10'
                            : 'border-blue-400 ring-2 ring-blue-500/50'
                          : 'border-white/10 text-[#86868b]'
                      }`}
                    />

                    <div className="flex gap-2">
                      <button
                        id="node-modal-continue"
                        className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          activeNodeIndex === 6
                            ? isCurrentlyInTrap
                              ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-lg'
                              : 'bg-blue-600 text-white ring-2 ring-blue-400'
                            : 'bg-white/10 text-[#f5f5f7]'
                        }`}
                      >
                        Continue
                      </button>

                      <button
                        id="node-modal-cancel"
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          activeNodeIndex === 7
                            ? isCurrentlyInTrap
                              ? 'border-red-500 text-red-400 ring-2 ring-red-500/50'
                              : 'border-blue-400 text-blue-400 ring-2 ring-blue-400/50'
                            : 'border-white/10 text-[#86868b]'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary Node (Escape destination) */}
              <div
                id="node-order-summary"
                className={`mt-4 p-3 rounded-xl border transition-all ${
                  activeNodeIndex === 8
                    ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-500 text-emerald-300'
                    : 'border-white/5 bg-black/20 text-[#86868b]'
                }`}
              >
                <div className="text-[11px] font-medium">Order Total &amp; Tax: $2,698.92</div>
              </div>

              {/* Dynamic SVG Focus Traversal Overlay Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <defs>
                  <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
                  </filter>
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.9" />
                  </filter>
                  <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.9" />
                  </filter>
                  <filter id="protanopia-filter" colorInterpolationFilters="sRGB">
                    <feColorMatrix
                      type="matrix"
                      values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
                    />
                  </filter>
                </defs>

                {/* Animated Traversal Polyline */}
                {traversalSteps.slice(0, currentStep + 1).map((nodeIdx, i, arr) => {
                  if (i === 0) return null;
                  const prev = nodes[arr[i - 1]];
                  const curr = nodes[nodeIdx];
                  const isCycle = !isTrapFixed && i >= 7;

                  return (
                    <g key={i}>
                      <line
                        x1={prev.x + prev.w / 2}
                        y1={prev.y + prev.h / 2}
                        x2={curr.x + curr.w / 2}
                        y2={curr.y + curr.h / 2}
                        stroke={isTrapFixed ? '#10b981' : isCycle ? '#ef4444' : '#f59e0b'}
                        strokeWidth={isCycle ? '3' : '2'}
                        strokeDasharray={isCycle ? '4 2' : 'none'}
                        filter={isCycle ? 'url(#glow-red)' : isTrapFixed ? 'url(#glow-emerald)' : 'url(#glow-gold)'}
                        className={isCycle ? 'animate-pulse' : ''}
                      />
                    </g>
                  );
                })}

                {/* Current Active Focus Ring Halo */}
                {activeNode && (
                  <rect
                    x={activeNode.x - 4}
                    y={activeNode.y - 4}
                    width={activeNode.w + 8}
                    height={activeNode.h + 8}
                    rx="12"
                    fill="none"
                    stroke={isCurrentlyInTrap ? '#ef4444' : isTrapFixed ? '#10b981' : '#3b82f6'}
                    strokeWidth="2.5"
                    filter={isCurrentlyInTrap ? 'url(#glow-red)' : isTrapFixed ? 'url(#glow-emerald)' : 'url(#glow-gold)'}
                    className="transition-all duration-300"
                  />
                )}
              </svg>

              {/* Motor Tremor Cursor Simulator */}
              {tremorIntensity > 0 && (
                <div
                  className="absolute pointer-events-none z-30 transition-all duration-75"
                  style={{
                    left: `${cursorPos.x + tremorOffset.x}px`,
                    top: `${cursorPos.y + tremorOffset.y}px`,
                  }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-purple-400 bg-purple-500/30 shadow-lg shadow-purple-500/50 animate-ping" />
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 absolute top-1.5 left-1.5" />
                </div>
              )}
            </div>

            {/* In-Canvas Tarjan Trap Callout Alert */}
            {isCurrentlyInTrap && (
              <div className="mt-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-between text-xs text-red-200 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Tarjan SCC Keyboard Trap:</strong> Cycle period = 3 nodes (Email ⇄ Continue ⇄ Cancel). Escape key blocked.
                  </span>
                </div>
                <button
                  onClick={() => setIsTrapFixed(true)}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-[11px]"
                >
                  Apply Causal Fix
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Mission Control HUD & Speech Synthesizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: VoiceOver Screen Reader Speech Synthesizer */}
          <div className="p-6 rounded-3xl apple-glass border-hairline border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#f5f5f7]">
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span>VoiceOver Speech Synthesizer</span>
              </div>
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  speechEnabled
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
              >
                {speechEnabled ? 'Speech: ON' : 'Speech: OFF'}
              </button>
            </div>

            {/* Real-Time Waveform Visualizer Canvas */}
            <div className="h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center px-4 gap-1 overflow-hidden">
              {[12, 28, 44, 20, 36, 52, 18, 30, 48, 22, 40, 16, 32, 50, 24, 14, 38].map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    waveformActive
                      ? 'bg-gradient-to-t from-blue-500 to-cyan-300'
                      : 'bg-white/10'
                  }`}
                  style={{
                    height: waveformActive ? `${Math.max(6, Math.sin(i + currentStep) * h + 24)}px` : '4px',
                  }}
                />
              ))}
            </div>

            {/* Live Virtual Speech Buffer */}
            <div>
              <div className="text-[11px] text-[#86868b] mb-1">Active Speech Announcement:</div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-blue-300 min-h-[44px]">
                &quot;{currentSpeechText}&quot;
              </div>
            </div>

            {/* Kendall Tau Reading Sequence Metric */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-[#86868b]">Kendall&apos;s Tau Order:</span>
              <span className={`font-mono font-semibold ${isTrapFixed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isTrapFixed ? 'τ = 0.98 (Concordant)' : 'τ = 0.32 (Discordant)'}
              </span>
            </div>
          </div>

          {/* Card 2: Motor Tremor & Chaos Red-Team Controls */}
          <div className="p-6 rounded-3xl apple-glass border-hairline border-purple-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Chaos &amp; Tremor Parameters</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Adversarial
              </span>
            </div>

            {/* Tremor Intensity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#86868b]">
                <span>Parkinson&apos;s Tremor Amplitude</span>
                <span className="font-mono text-[#f5f5f7]">
                  {tremorIntensity === 0 ? 'Off (0px)' : tremorIntensity === 1 ? 'Mild (4px)' : 'Severe (14px)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={tremorIntensity}
                onChange={(e) => setTremorIntensity(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Vision Impairment Simulation Controls */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-[#86868b]">
                <span>Vision Impairment Simulation</span>
                <span className="font-mono text-[#f5f5f7] capitalize">
                  {visionFilter === 'blur' ? 'Low-Vision Blur (3.5px)' : visionFilter === 'protanopia' ? 'Protanopia (Red-Blind)' : visionFilter === 'contrast' ? 'High Contrast AA' : 'Standard'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'normal', label: 'Normal Vision' },
                  { id: 'blur', label: 'Low-Vision Blur' },
                  { id: 'protanopia', label: 'Protanopia' },
                  { id: 'contrast', label: 'High Contrast' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setVisionFilter(mode.id as VisionFilterMode);
                      if (mode.id === 'contrast') setContrastMode(true);
                      else setContrastMode(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      visionFilter === mode.id
                        ? 'bg-purple-600/30 text-purple-200 border-purple-500/60 shadow-sm'
                        : 'bg-white/5 border-white/10 text-[#86868b] hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Environmental 320px Reflow Toggle */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#86868b]">Mobile Reflow (WCAG 1.4.10)</span>
              <button
                onClick={() => setReflow320(!reflow320)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                  reflow320 ? 'bg-purple-600/20 text-purple-300 border-purple-500/40' : 'bg-white/5 border-white/10 text-[#86868b]'
                }`}
              >
                {reflow320 ? '320px Active' : 'Default Viewport'}
              </button>
            </div>
          </div>

          {/* Card 3: Causal Certificate Generator */}
          <div className="p-6 rounded-3xl apple-glass border-hairline border-emerald-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Causal Counterfactual Status</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isTrapFixed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isTrapFixed ? 'Fixed & Verified' : 'Vulnerable'}
              </span>
            </div>

            <p className="text-xs text-[#86868b]">
              {isTrapFixed
                ? 'Minimal do(X = x\') AST intervention active: Focus escapes modal dialog to Order Total with 0 regressions.'
                : 'Tarjan SCC cycle detected. Click the button below to synthesize and hot-patch the minimal causal intervention.'}
            </p>

            <button
              onClick={() => {
                setIsTrapFixed(!isTrapFixed);
                setCurrentStep(0);
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                isTrapFixed
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-600/20 hover:brightness-110'
              }`}
            >
              {isTrapFixed ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Revert to Unfixed State</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize &amp; Apply Causal Fix</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
