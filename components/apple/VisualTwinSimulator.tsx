'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  Sliders, 
  Layers, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Cpu,
  Monitor
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

  // DOM node definitions for our checkout visual twin
  const nodes: FocusNodeCoord[] = [
    { id: 'node-search', name: 'Search Store', role: 'searchbox', x: 24, y: 16, w: 130, h: 28 },
    { id: 'node-nav-bag', name: 'Review Bag (2 Items)', role: 'button', x: 250, y: 16, w: 130, h: 28 },
    { id: 'node-item-pro', name: 'MacBook Pro 16" - Space Black', role: 'link', x: 24, y: 80, w: 210, h: 34 },
    { id: 'node-item-qty', name: 'Quantity: 1', role: 'combobox', x: 250, y: 82, w: 85, h: 28 },
    { id: 'node-checkout-btn', name: 'Proceed to Checkout', role: 'button', x: 24, y: 132, w: 180, h: 34 },
    // Modal Trap Nodes (Active when isModalOpen = true)
    { id: 'node-modal-email', name: 'Modal: Enter Account Email', role: 'textbox', x: 60, y: 205, w: 240, h: 32, isTrapped: !isTrapFixed },
    { id: 'node-modal-continue', name: 'Modal: Continue with ID', role: 'button', x: 60, y: 250, w: 240, h: 34, isTrapped: !isTrapFixed },
    { id: 'node-modal-cancel', name: 'Modal: Cancel & Dismiss', role: 'button', x: 60, y: 298, w: 100, h: 30, isTrapped: !isTrapFixed },
    // Escape target node (only reachable when trap is fixed)
    { id: 'node-order-summary', name: 'Order Total: $2,499.00', role: 'region', x: 24, y: 360, w: 300, h: 36 },
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
      utterance.rate = 1.15;
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
    <div className="w-full space-y-5">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#141517] border border-[#23262a]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0c0d0e] border border-[#23262a]">
            <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
            <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
            <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#f4f5f6] flex items-center gap-2">
              <span>Interactive Visual Twin Simulator</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20">
                Playwright CDP Live
              </span>
            </div>
            <div className="text-xs text-[#9ba1a6] font-mono">
              Synthetic DOM Graph • SVG Focus Traversal • Real-Time Speech Synthesis
            </div>
          </div>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex items-center p-1 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs">
          {[
            { id: 'keyboard' as const, label: 'Keyboard Only' },
            { id: 'voiceover' as const, label: 'Screen Reader' },
            { id: 'tremor' as const, label: 'Motor Impairment' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePersona(p.id);
                if (p.id === 'tremor') setTremorIntensity(2);
                else setTremorIntensity(0);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activePersona === p.id
                  ? 'bg-[#23262a] text-[#f4f5f6] shadow-sm'
                  : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Split-Screen Main Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Pane: Interactive Visual Twin with SVG Focus Path Overlay (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative rounded-xl p-5 bg-[#141517] border border-[#23262a] shadow-xl overflow-hidden min-h-[480px]">
            {/* Window Controls Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#23262a] mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#9ba1a6]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulated Viewport: 420px × 440px</span>
              </div>

              {/* Simulation Stepper Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Traverse'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(0);
                    setCurrentSpeechText('Traversal reset. Press Traverse to begin.');
                  }}
                  className="p-1.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#23262a] transition-all"
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
              className={`relative rounded-lg p-5 border transition-all duration-300 min-h-[420px] ${
                contrastMode || visionFilter === 'contrast'
                  ? 'bg-black text-yellow-300 border-yellow-400'
                  : 'bg-[#0c0d0e] text-[#f4f5f6] border-[#23262a]'
              } ${reflow320 ? 'max-w-[320px] mx-auto' : 'w-full'}`}
            >
              {/* E-Commerce App Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
                <div
                  id="node-search"
                  className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${
                    activeNodeIndex === 0
                      ? 'border-[#5e6ad2] ring-2 ring-[#5e6ad2]/30 bg-[#5e6ad2]/10 text-white'
                      : 'border-[#23262a] bg-[#141517] text-[#9ba1a6]'
                  }`}
                >
                  Search Store
                </div>

                <div
                  id="node-nav-bag"
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                    activeNodeIndex === 1
                      ? 'border-[#5e6ad2] ring-2 ring-[#5e6ad2]/30 bg-[#5e6ad2]/10 text-white'
                      : 'border-[#23262a] bg-[#141517] text-[#9ba1a6]'
                  }`}
                >
                  Review Bag (2)
                </div>
              </div>

              {/* Product Card */}
              <div className="mt-3.5 p-3 rounded-lg bg-[#141517] border border-[#23262a] flex items-center justify-between">
                <div
                  id="node-item-pro"
                  className={`text-xs font-medium transition-all p-1.5 rounded-md ${
                    activeNodeIndex === 2 ? 'bg-[#5e6ad2]/10 ring-2 ring-[#5e6ad2] text-[#f4f5f6]' : 'text-[#f4f5f6]'
                  }`}
                >
                  MacBook Pro 16&quot; (M3 Max)
                </div>

                <div
                  id="node-item-qty"
                  className={`text-xs px-2 py-1 rounded-md border font-mono transition-all ${
                    activeNodeIndex === 3 ? 'border-[#5e6ad2] bg-[#5e6ad2]/10 ring-2 ring-[#5e6ad2]' : 'border-[#23262a] text-[#9ba1a6]'
                  }`}
                >
                  Qty: 1 ▾
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="mt-3.5">
                <button
                  id="node-checkout-btn"
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeNodeIndex === 4
                      ? 'bg-[#5e6ad2] text-white ring-2 ring-white/50 shadow-md'
                      : 'bg-[#181a1d] text-[#f4f5f6] border border-[#23262a] hover:bg-[#23262a]'
                  }`}
                >
                  Proceed to Checkout ($2,499.00)
                </button>
              </div>

              {/* Modal Dialog (The Tarjan Trap Suspect) */}
              {isModalOpen && (
                <div
                  className={`mt-4 p-4 rounded-lg border transition-all duration-300 relative ${
                    isCurrentlyInTrap
                      ? 'bg-red-950/20 border-red-500/50 shadow-lg'
                      : 'bg-[#141517] border-[#23262a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#f4f5f6]">Sign in to Complete Order</span>
                    {isCurrentlyInTrap && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                        Tarjan SCC Loop
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      id="node-modal-email"
                      type="text"
                      readOnly
                      value="auditor@barrierlens.dev"
                      className={`w-full px-3 py-1.5 rounded-md text-xs bg-[#0c0d0e] border font-mono transition-all ${
                        activeNodeIndex === 5
                          ? isCurrentlyInTrap
                            ? 'border-red-500 ring-2 ring-red-500/50 text-white'
                            : 'border-[#5e6ad2] ring-2 ring-[#5e6ad2]/40 text-white'
                          : 'border-[#23262a] text-[#9ba1a6]'
                      }`}
                    />

                    <div className="flex gap-2">
                      <button
                        id="node-modal-continue"
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                          activeNodeIndex === 6
                            ? isCurrentlyInTrap
                              ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-sm'
                              : 'bg-[#5e6ad2] text-white ring-2 ring-white/50'
                            : 'bg-[#181a1d] text-[#f4f5f6] border border-[#23262a]'
                        }`}
                      >
                        Continue
                      </button>

                      <button
                        id="node-modal-cancel"
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          activeNodeIndex === 7
                            ? isCurrentlyInTrap
                              ? 'border-red-500 text-red-400 ring-2 ring-red-500/50'
                              : 'border-[#5e6ad2] text-[#5e6ad2] ring-2 ring-[#5e6ad2]/50'
                            : 'border-[#23262a] text-[#9ba1a6]'
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
                className={`mt-4 p-3 rounded-lg border transition-all ${
                  activeNodeIndex === 8
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-emerald-300'
                    : 'border-[#23262a] bg-[#141517] text-[#9ba1a6]'
                }`}
              >
                <div className="text-[11px] font-mono">Order Total &amp; Tax: $2,698.92 (Escape Reached)</div>
              </div>

              {/* Dynamic SVG Focus Traversal Overlay Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <defs>
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
                        stroke={isTrapFixed ? '#30d158' : isCycle ? '#ff453a' : '#5e6ad2'}
                        strokeWidth={isCycle ? '2.5' : '1.5'}
                        strokeDasharray={isCycle ? '4 2' : 'none'}
                        className={isCycle ? 'animate-pulse' : ''}
                      />
                    </g>
                  );
                })}

                {/* Current Active Focus Ring Halo */}
                {activeNode && (
                  <rect
                    x={activeNode.x - 3}
                    y={activeNode.y - 3}
                    width={activeNode.w + 6}
                    height={activeNode.h + 6}
                    rx="6"
                    fill="none"
                    stroke={isCurrentlyInTrap ? '#ff453a' : isTrapFixed ? '#30d158' : '#5e6ad2'}
                    strokeWidth="2"
                    className="transition-all duration-200"
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
                  <div className="w-4 h-4 rounded-full border border-purple-400 bg-purple-500/20 shadow-md animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 absolute top-1 left-1" />
                </div>
              )}
            </div>

            {/* In-Canvas Tarjan Trap Callout Alert */}
            {isCurrentlyInTrap && (
              <div className="mt-3.5 p-3 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center justify-between text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Tarjan SCC Trap:</strong> Cycle period = 3 nodes (Email ⇄ Continue ⇄ Cancel). Tab trapped inside dialog.
                  </span>
                </div>
                <button
                  onClick={() => setIsTrapFixed(true)}
                  className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-all text-[11px]"
                >
                  Apply Patch
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Mission Control HUD & Speech Synthesizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Screen Reader Speech Synthesizer */}
          <div className="p-4 rounded-xl bg-[#141517] border border-[#23262a] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#f4f5f6]">
                <Volume2 className="w-4 h-4 text-[#5e6ad2]" />
                <span>Screen Reader Synthesizer</span>
              </div>
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded border transition-all ${
                  speechEnabled
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-[#181a1d] text-[#62676d] border-[#23262a]'
                }`}
              >
                {speechEnabled ? 'Audio: Active' : 'Audio: Muted'}
              </button>
            </div>

            {/* Real-Time Waveform Visualizer Canvas */}
            <div className="h-10 rounded-lg bg-[#0c0d0e] border border-[#23262a] flex items-center justify-center px-4 gap-1 overflow-hidden">
              {[10, 24, 38, 16, 30, 44, 14, 26, 40, 18, 32, 12, 28, 42, 20, 12, 34].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    waveformActive
                      ? 'bg-[#5e6ad2]'
                      : 'bg-[#23262a]'
                  }`}
                  style={{
                    height: waveformActive ? `${Math.max(4, Math.sin(i + currentStep) * (h * 0.7) + 16)}px` : '3px',
                  }}
                />
              ))}
            </div>

            {/* Live Virtual Speech Buffer */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] mb-1">Accessibility Announcement Buffer:</div>
              <div className="p-2.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] font-mono text-xs text-[#f4f5f6] min-h-[38px]">
                &quot;{currentSpeechText}&quot;
              </div>
            </div>

            {/* Kendall Tau Reading Sequence Metric */}
            <div className="flex items-center justify-between pt-2 border-t border-[#23262a] text-xs">
              <span className="text-[#9ba1a6]">Kendall&apos;s Tau Order:</span>
              <span className={`font-mono font-semibold ${isTrapFixed ? 'text-[#30d158]' : 'text-[#ff9f0a]'}`}>
                {isTrapFixed ? 'τ = 0.98 (Concordant)' : 'τ = 0.32 (Discordant Inversion)'}
              </span>
            </div>
          </div>

          {/* Card 2: Motor Tremor & Vision Red-Team Controls */}
          <div className="p-4 rounded-xl bg-[#141517] border border-[#23262a] shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#f4f5f6]">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Accessibility Simulation Parameters</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Stress Test
              </span>
            </div>

            {/* Tremor Intensity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#9ba1a6]">
                <span>Tremor Amplitude</span>
                <span className="font-mono text-[#f4f5f6]">
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
                className="w-full h-1.5 bg-[#23262a] rounded-lg appearance-none cursor-pointer accent-[#5e6ad2]"
              />
            </div>

            {/* Vision Impairment Simulation Controls */}
            <div className="space-y-2 pt-2 border-t border-[#23262a]">
              <div className="flex items-center justify-between text-xs text-[#9ba1a6]">
                <span>Vision Impairment Filter</span>
                <span className="font-mono text-[#f4f5f6] text-[11px] capitalize">
                  {visionFilter === 'blur' ? 'Blur (3.5px)' : visionFilter === 'protanopia' ? 'Protanopia' : visionFilter === 'contrast' ? 'High Contrast' : 'Standard'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
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
                    className={`p-1.5 rounded-md text-xs font-medium border text-center transition-all ${
                      visionFilter === mode.id
                        ? 'bg-[#181a1d] text-[#f4f5f6] border-[#5e6ad2] shadow-sm'
                        : 'bg-[#0c0d0e] border-[#23262a] text-[#9ba1a6] hover:text-[#f4f5f6]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Environmental 320px Reflow Toggle */}
            <div className="pt-2 border-t border-[#23262a] flex items-center justify-between">
              <span className="text-xs text-[#9ba1a6]">Mobile Reflow (WCAG 1.4.10)</span>
              <button
                onClick={() => setReflow320(!reflow320)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                  reflow320 ? 'bg-[#5e6ad2]/20 text-[#5e6ad2] border-[#5e6ad2]/30' : 'bg-[#0c0d0e] border-[#23262a] text-[#9ba1a6]'
                }`}
              >
                {reflow320 ? '320px Active' : 'Default Viewport'}
              </button>
            </div>
          </div>

          {/* Card 3: Causal Certificate Generator */}
          <div className="p-4 rounded-xl bg-[#141517] border border-[#23262a] shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#f4f5f6]">
                <ShieldCheck className="w-4 h-4 text-[#30d158]" />
                <span>Causal Counterfactual Status</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isTrapFixed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isTrapFixed ? 'Patch Verified' : 'Vulnerable'}
              </span>
            </div>

            <p className="text-[12px] text-[#9ba1a6] leading-relaxed">
              {isTrapFixed
                ? 'Minimal do(X = x\') AST intervention active: Focus escapes modal dialog to Order Total with 0 regressions.'
                : 'Tarjan SCC cycle detected. Synthesize and hot-patch the minimal causal intervention below.'}
            </p>

            <button
              onClick={() => {
                setIsTrapFixed(!isTrapFixed);
                setCurrentStep(0);
              }}
              className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                isTrapFixed
                  ? 'bg-[#181a1d] text-[#f4f5f6] border border-[#23262a] hover:bg-[#23262a]'
                  : 'bg-[#5e6ad2] hover:bg-[#6875e5] text-white shadow-sm'
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
                  <span>Apply Causal Hot-Patch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
