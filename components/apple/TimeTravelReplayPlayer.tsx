'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Command,
  Eye,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ActionStep, BarrierFinding } from '@/lib/barrierlens/types';

export interface TimeTravelReplayPlayerProps {
  steps: ActionStep[];
  findings?: BarrierFinding[];
  targetUrl: string;
  onSelectFinding?: (finding: BarrierFinding) => void;
  className?: string;
}

export function TimeTravelReplayPlayer({
  steps = [],
  findings = [],
  targetUrl,
  onSelectFinding,
  className = ''
}: TimeTravelReplayPlayerProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2>(1);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIdx] || steps[0] || {
    idx: 1,
    persona: 'KEYBOARD',
    actionType: 'press_key',
    key: 'Tab',
    activeElementBefore: 'body',
    activeElementAfter: '#nav-home',
    reasoning: 'Initial step',
    timestamp: Date.now()
  };

  // Map step index to any findings detected at this step
  const findingsAtCurrentStep = useMemo(() => {
    return findings.filter(f => f.stepIdx === currentStep.idx || (currentStepIdx === 0 && f.stepIdx === 0));
  }, [findings, currentStep.idx, currentStepIdx]);

  // Web Speech API Voice Narration
  useEffect(() => {
    if (!speechEnabled || !synthRef.current) return;

    synthRef.current.cancel();

    let announcement = '';
    if (currentStep.actionType === 'press_key') {
      announcement = `Pressed ${currentStep.key || 'key'}. Focused on ${currentStep.activeElementAfter || 'element'}.`;
    } else if (currentStep.actionType === 'type_text') {
      announcement = `Typed ${currentStep.text || 'text'}.`;
    } else {
      announcement = `${currentStep.reasoning || 'Step executed'}`;
    }

    if (findingsAtCurrentStep.length > 0) {
      announcement += ` Warning: Accessibility barrier detected: ${findingsAtCurrentStep[0].title}.`;
    }

    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.rate = playbackSpeed === 2 ? 1.4 : playbackSpeed === 0.5 ? 0.8 : 1.0;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  }, [currentStepIdx, speechEnabled, playbackSpeed, currentStep, findingsAtCurrentStep]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = (1200 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStepIdx(prev => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, totalSteps, playbackSpeed]);

  // Synthesize realistic bounding-box simulation for active element
  const boundingBox = useMemo(() => {
    const el = currentStep.activeElementAfter || 'body';
    // Deterministic position calculation based on selector string hash
    let hash = 0;
    for (let i = 0; i < el.length; i++) {
      hash = ((hash << 5) - hash) + el.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const x = 40 + (absHash % 480);
    const y = 80 + ((absHash >> 3) % 280);
    const width = 120 + ((absHash >> 6) % 180);
    const height = 36 + ((absHash >> 9) % 32);

    return { x, y, width, height };
  }, [currentStep.activeElementAfter]);

  return (
    <div className={`flex flex-col rounded-3xl bg-zinc-950/90 border border-zinc-800/80 shadow-2xl backdrop-blur-2xl overflow-hidden ${className}`}>
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-medium text-zinc-400 tracking-wider uppercase ml-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Cinematic Time-Travel Studio
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
            {targetUrl ? new URL(targetUrl.startsWith('file:') ? 'http://localhost/fixture' : targetUrl).pathname : '/'}
          </span>
        </div>

        {/* Audio Toggle & Speed Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSpeechEnabled(prev => !prev)}
            title={speechEnabled ? 'Mute Web Speech narration' : 'Enable Web Speech API audio sync'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              speechEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
            }`}
          >
            {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{speechEnabled ? 'Voice Sync ON' : 'Audio Muted'}</span>
          </button>

          <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-0.5 text-xs font-mono">
            {([0.5, 1, 2] as const).map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  playbackSpeed === speed ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div className="relative w-full h-[420px] bg-gradient-to-b from-zinc-950 to-zinc-900 overflow-hidden flex items-center justify-center">
        {/* Subtle background grid pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Simulated Browser Web View */}
        <div className="relative w-[760px] h-[340px] rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-inner overflow-hidden flex flex-col">
          {/* Internal Browser Chrome */}
          <div className="h-8 bg-zinc-950/80 border-b border-zinc-800/80 px-4 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="truncate max-w-[400px]">{targetUrl || 'about:blank'}</span>
            <span className="text-zinc-500">CDP Frame #1</span>
          </div>

          {/* Page Canvas Simulator with Interactive Focus Ring */}
          <div className="relative flex-1 p-6 bg-zinc-900/60 overflow-hidden">
            {/* Mock Page Mockup Elements */}
            <div className="flex flex-col space-y-4 opacity-40 select-none">
              <div className="h-8 w-48 rounded bg-zinc-700/60" />
              <div className="flex space-x-3">
                <div className="h-6 w-20 rounded bg-zinc-700/40" />
                <div className="h-6 w-24 rounded bg-zinc-700/40" />
                <div className="h-6 w-20 rounded bg-zinc-700/40" />
              </div>
              <div className="h-20 w-full rounded-xl bg-zinc-800/40 border border-zinc-700/30" />
              <div className="h-10 w-32 rounded-lg bg-zinc-700/50" />
            </div>

            {/* Dynamic Animated Focus Ring (SVG / CSS Overlay) */}
            <div
              className="absolute transition-all duration-300 ease-out border-2 border-emerald-400 rounded-lg pointer-events-none z-20 shadow-[0_0_24px_rgba(52,211,153,0.35)]"
              style={{
                left: `${boundingBox.x}px`,
                top: `${boundingBox.y}px`,
                width: `${boundingBox.width}px`,
                height: `${boundingBox.height}px`
              }}
            >
              {/* Focus Ring Label Tag */}
              <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[10px] font-mono font-bold tracking-tight shadow flex items-center gap-1">
                <span>{currentStep.activeElementAfter || 'body'}</span>
              </div>
            </div>

            {/* Keystroke HUD (Bottom Right of Canvas) */}
            <div className="absolute bottom-4 right-4 z-30 flex items-center space-x-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-700/70 shadow-2xl backdrop-blur-md">
                <Command className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-200 font-semibold tracking-wide">
                  {currentStep.actionType === 'type_text'
                    ? `⌨️ Type: "${currentStep.text || ''}"`
                    : `⇥ Key: ${currentStep.key || 'Tab'}`}
                </span>
              </div>
            </div>

            {/* Barrier Warning Banner overlay if finding exists at step */}
            {findingsAtCurrentStep.length > 0 && (
              <div className="absolute top-4 right-4 z-30 max-w-sm rounded-xl bg-rose-950/80 border border-rose-500/50 p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-rose-200 truncate">
                      {findingsAtCurrentStep[0].title}
                    </p>
                    <p className="text-[11px] text-rose-300/80 mt-0.5 line-clamp-2">
                      {findingsAtCurrentStep[0].summary}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrubbable Timeline Track */}
      <div className="px-6 pt-4 pb-2 border-t border-zinc-800/80 bg-zinc-900/30">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
          <span>Step {totalSteps > 0 ? currentStepIdx + 1 : 0} of {totalSteps}</span>
          <span className="text-zinc-500">
            {currentStep.timestamp ? new Date(currentStep.timestamp).toLocaleTimeString() : ''}
          </span>
        </div>

        {/* Timeline Slider with finding ticks */}
        <div className="relative w-full flex items-center group">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIdx}
            onChange={(e) => setCurrentStepIdx(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />

          {/* Finding markers along timeline track */}
          {findings.map((f, i) => {
            const stepPos = f.stepIdx > 0 && totalSteps > 1 ? (f.stepIdx / (totalSteps - 1)) * 100 : 0;
            return (
              <div
                key={f.id || i}
                title={`Barrier at step ${f.stepIdx}: ${f.title}`}
                className="absolute w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-950 pointer-events-none"
                style={{ left: `${Math.min(98, Math.max(2, stepPos))}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/50">
        <div className="flex items-center space-x-2">
          {/* Step Back */}
          <button
            onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
            disabled={currentStepIdx <= 0}
            className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 disabled:opacity-30 text-zinc-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(prev => !prev)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-500/20"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={() => setCurrentStepIdx(prev => Math.min(totalSteps - 1, prev + 1))}
            disabled={currentStepIdx >= totalSteps - 1}
            className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 disabled:opacity-30 text-zinc-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIdx(0);
            }}
            className="p-2 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Current Step Reasoning Description */}
        <div className="text-right max-w-md truncate">
          <p className="text-xs text-zinc-300 font-medium truncate">
            {currentStep.reasoning || `Action: ${currentStep.actionType}`}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono truncate">
            {currentStep.activeElementBefore} → {currentStep.activeElementAfter}
          </p>
        </div>
      </div>
    </div>
  );
}
