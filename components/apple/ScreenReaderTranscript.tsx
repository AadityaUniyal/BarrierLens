'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Play, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Activity as WaveformIcon } from 'lucide-react';

export interface SpeechTranscriptItem {
  id: string;
  type: 'speech' | 'silent_gap' | 'live_announcement';
  text: string;
  tag?: string;
  timestamp: string;
  category?: 'inline_error' | 'toast' | 'spinner' | 'state_change';
  proofCertificate?: string;
}

interface ScreenReaderTranscriptProps {
  items?: SpeechTranscriptItem[];
  onHearItClick?: () => void;
}

export function ScreenReaderTranscript({ items: propItems }: ScreenReaderTranscriptProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);

  const defaultBubbles: SpeechTranscriptItem[] = [
    { id: '1', type: 'speech', text: 'Document loaded. Banner landmark. BarrierLens Accessibility Studio.', tag: 'H1', timestamp: '0.0s' },
    { id: '2', type: 'speech', text: 'Email address, edit text, required.', tag: 'INPUT', timestamp: '1.2s' },
    { id: '3', type: 'speech', text: 'Continue to Payment, button.', tag: 'BUTTON', timestamp: '2.5s' },
    { id: '4', type: 'silent_gap', text: 'CRITICAL SILENT STATE CHANGE: Inline error "Error: A valid email address is required to proceed with registration" appeared visually on form submission, but focus remained on #submit-btn and 0 aria-live announcements were dispatched. The user is completely unaware that submission failed.', tag: 'SILENT_ERROR', timestamp: '2.9s', category: 'inline_error', proofCertificate: 'sha256-e9b418a092...' },
    { id: '5', type: 'speech', text: 'Add Pro Plan to Cart, button.', tag: 'BUTTON', timestamp: '4.2s' },
    { id: '6', type: 'silent_gap', text: 'SILENT TOAST: Visual notification "Product BarrierLens Enterprise successfully added to cart" rendered in DOM without aria-live="polite" or status role. Screen reader remained completely silent.', tag: 'SILENT_TOAST', timestamp: '4.7s', category: 'toast', proofCertificate: 'sha256-78ab310c12...' },
    { id: '7', type: 'speech', text: 'Dispatch Live Alert, button.', tag: 'BUTTON', timestamp: '6.0s' },
    { id: '8', type: 'live_announcement', text: 'Live Status: Profile preferences updated successfully.', tag: 'ARIA-LIVE', timestamp: '6.3s' },
  ];

  const bubbles = propItems || defaultBubbles;

  const handleHearIt = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setActiveSpeechIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const speechQueue = bubbles
      .map((b, originalIdx) => ({ ...b, originalIdx }))
      .filter(b => b.type === 'speech' || b.type === 'live_announcement');

    let queueIdx = 0;

    const speakNext = () => {
      if (queueIdx >= speechQueue.length) {
        setIsPlaying(false);
        setActiveSpeechIndex(null);
        return;
      }
      const item = speechQueue[queueIdx++];
      setActiveSpeechIndex(item.originalIdx);
      
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = 1.0;
      utterance.pitch = item.type === 'live_announcement' ? 1.15 : 1.0;
      utterance.onend = () => speakNext();
      utterance.onerror = () => {
        setIsPlaying(false);
        setActiveSpeechIndex(null);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const silentGapCount = bubbles.filter(b => b.type === 'silent_gap').length;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Cupertino Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0a84ff] border border-blue-500/20 font-semibold">
              VoiceOver & NVDA Auditory Feed
            </span>
            {silentGapCount > 0 && (
              <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[#ff9f0a] border border-amber-500/20 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {silentGapCount} Silent Gap(s) Detected
              </span>
            )}
          </div>
          <h2 className="text-[26px] font-bold tracking-tight text-white flex items-center gap-2.5 mt-1.5">
            <Volume2 className="w-6 h-6 text-[#0a84ff]" />
            Screen Reader Audio Transcript
          </h2>
          <p className="text-[13px] text-[#86868b] tracking-[0.005em] mt-0.5">
            Simulated auditory speech stream rendered as an interactive transcript with inline silent gap detection
          </p>
        </div>

        {/* Apple Hear It Interactive Control */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleHearIt}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl font-semibold text-xs shadow-xl active:scale-[0.98] transition-all duration-200 ease-spring ${
              isPlaying
                ? 'bg-[#ff453a] text-white shadow-red-500/25 ring-2 ring-red-500/40'
                : 'bg-gradient-to-r from-[#0071e3] to-[#0a84ff] text-white shadow-blue-500/25 hover:shadow-blue-500/35 ring-1 ring-white/20'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-4 h-4 animate-pulse" />
                <span>Pause VoiceOver Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Hear It Aloud (SpeechSynthesis)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transcript Stream Viewport */}
      <div className="apple-vibrancy-regular rounded-3xl p-6 md:p-8 border-hairline shadow-2xl space-y-4 max-w-4xl mx-auto backdrop-blur-2xl">
        {bubbles.map((bubble, idx) => {
          const isSpoken = activeSpeechIndex === idx;

          if (bubble.type === 'silent_gap') {
            return (
              <div
                key={bubble.id}
                className="p-5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 shadow-lg space-y-2 relative overflow-hidden transition-all duration-200"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono font-bold text-[#ff9f0a]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>SILENT STATE CHANGE (UNANNOUNCED)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#86868b]">{bubble.timestamp}</span>
                </div>
                
                <p className="text-[13px] text-amber-200/90 leading-relaxed font-medium">
                  {bubble.text}
                </p>

                {bubble.proofCertificate && (
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#86868b] border-t border-amber-500/20">
                    <span>Witnessed: Visual DOM Diff &gt; 0, Assistive Announcements = 0</span>
                    <span className="text-[#0a84ff]">Cert: {bubble.proofCertificate.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
            );
          }

          if (bubble.type === 'live_announcement') {
            return (
              <div
                key={bubble.id}
                className={`p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 shadow-md space-y-1 transition-all duration-200 ${
                  isSpoken ? 'ring-2 ring-[#30d158] scale-[1.01]' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-[#30d158] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ARIA-LIVE ASSERTIVE / POLITE
                  </span>
                  <span className="text-[11px] font-mono text-[#86868b]">{bubble.timestamp}</span>
                </div>
                <p className="text-sm text-emerald-200 font-medium">
                  "{bubble.text}"
                </p>
              </div>
            );
          }

          return (
            <div
              key={bubble.id}
              className={`p-4 rounded-2xl bg-[#1c1c1e]/70 border border-white/[0.06] shadow-sm flex items-start justify-between gap-4 transition-all duration-200 ${
                isSpoken ? 'ring-2 ring-[#0a84ff] bg-[#1c1c1e] scale-[1.01]' : ''
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-[#86868b]">
                  {bubble.tag || 'VOICED'}
                </span>
                <p className="text-sm text-[#f5f5f7] font-medium pt-0.5">
                  "{bubble.text}"
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#86868b] shrink-0">{bubble.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
