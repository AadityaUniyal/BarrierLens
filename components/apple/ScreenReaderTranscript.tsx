'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Play, AlertTriangle, CheckCircle2, Mic } from 'lucide-react';

interface SpeechBubble {
  id: string;
  type: 'speech' | 'silent_gap' | 'live_announcement';
  text: string;
  tag?: string;
  timestamp: string;
}

export function ScreenReaderTranscript() {
  const [isPlaying, setIsPlaying] = useState(false);

  const bubbles: SpeechBubble[] = [
    { id: '1', type: 'speech', text: 'Document loaded. Banner landmark. BarrierLens Accessibility Studio.', tag: 'H1', timestamp: '0.0s' },
    { id: '2', type: 'speech', text: 'Email address, edit text, required.', tag: 'INPUT', timestamp: '1.2s' },
    { id: '3', type: 'speech', text: 'Sign up, button.', tag: 'BUTTON', timestamp: '2.5s' },
    { id: '4', type: 'silent_gap', text: 'CRITICAL SILENT GAP: Visual red error message "Email address is required to proceed" appeared on submission, but focus remained on the button and no aria-live region was triggered. The blind user receives zero feedback and assumes the app froze.', tag: 'ERROR_GAP', timestamp: '3.1s' },
    { id: '5', type: 'speech', text: 'Open confirmation dialog, button.', tag: 'BUTTON', timestamp: '4.8s' },
    { id: '6', type: 'live_announcement', text: 'Dialog opened. Confirm Checkout Subscription.', tag: 'ARIA-LIVE', timestamp: '5.2s' },
    { id: '7', type: 'silent_gap', text: 'KEYBOARD TRAP: Focus trapped in dialog. Pressing Escape was not announced and produced no action.', tag: 'TRAP_GAP', timestamp: '6.4s' },
  ];

  const handleHearIt = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const speechQueue = bubbles.filter(b => b.type === 'speech' || b.type === 'live_announcement');
    let idx = 0;

    const speakNext = () => {
      if (idx >= speechQueue.length) {
        setIsPlaying(false);
        return;
      }
      const item = speechQueue[idx++];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = 1.0;
      utterance.onend = () => speakNext();
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#0a84ff]" />
            Screen Reader Audio Transcript
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Simulated auditory speech stream rendered as an interactive transcript with inline silent gap detection
          </p>
        </div>

        {/* Apple Hear It Button */}
        <button
          onClick={handleHearIt}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-xs shadow-lg transition-all ${
            isPlaying
              ? 'bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-gradient-to-r from-[#0071e3] to-[#0a84ff] text-white shadow-blue-500/20 hover:opacity-95'
          }`}
        >
          {isPlaying ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span>Stop Speech Synthesis</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Hear It Aloud (Web Speech API)</span>
            </>
          )}
        </button>
      </div>

      {/* Chat-Like Speech Bubble Stream */}
      <div className="apple-card rounded-3xl p-8 border border-white/[0.08] shadow-2xl space-y-4 max-w-4xl mx-auto">
        {bubbles.map((bubble) => {
          if (bubble.type === 'silent_gap') {
            return (
              <div
                key={bubble.id}
                className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1.5 shadow-lg"
              >
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Silent State Change Warning</span>
                  <span className="text-[10px] font-mono text-amber-500 ml-auto">{bubble.timestamp}</span>
                </div>
                <p className="leading-relaxed">
                  {bubble.text}
                </p>
              </div>
            );
          }

          const isLive = bubble.type === 'live_announcement';
          return (
            <div
              key={bubble.id}
              className={`p-4 rounded-2xl border text-xs space-y-1 transition-all ${
                isLive
                  ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
                  : 'bg-[#1c1c1e] border-white/[0.06] text-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#86868b]">
                <span className="flex items-center gap-1.5 font-bold">
                  <Mic className="w-3 h-3 text-[#0a84ff]" />
                  {bubble.tag || 'VOICEOVER'}
                </span>
                <span>{bubble.timestamp}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                "{bubble.text}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
