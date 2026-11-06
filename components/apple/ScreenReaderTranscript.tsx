'use client';

import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Activity as WaveformIcon,
  ShieldAlert,
  Radio
} from 'lucide-react';

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
    { id: '4', type: 'silent_gap', text: 'CRITICAL SILENT STATE CHANGE: Inline error "Error: A valid email address is required to proceed with registration" appeared visually on form submission, but focus remained on #submit-btn and 0 aria-live announcements were dispatched. The user is completely unaware that submission failed.', tag: 'SILENT_ERROR', timestamp: '2.9s', category: 'inline_error', proofCertificate: 'sha256-e9b418a092c4b810' },
    { id: '5', type: 'speech', text: 'Add Pro Plan to Cart, button.', tag: 'BUTTON', timestamp: '4.2s' },
    { id: '6', type: 'silent_gap', text: 'SILENT TOAST: Visual notification "Product BarrierLens Enterprise successfully added to cart" rendered in DOM without aria-live="polite" or status role. Screen reader remained completely silent.', tag: 'SILENT_TOAST', timestamp: '4.7s', category: 'toast', proofCertificate: 'sha256-78ab310c12e841aa' },
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
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23262a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded bg-[#1e2023] text-[#9ba1a6] border border-[#34383f] font-medium flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#5e6ad2]" />
              VoiceOver & NVDA Auditory Stream
            </span>
            {silentGapCount > 0 && (
              <span className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded bg-[#f76808]/10 text-[#f76808] border border-[#f76808]/30 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                {silentGapCount} Silent Gap{silentGapCount > 1 ? 's' : ''} Detected
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[#f4f5f6] flex items-center gap-2.5">
            Screen Reader Audio Transcript
          </h2>
          <p className="text-xs text-[#9ba1a6] mt-0.5">
            Empirical auditory speech feed rendered as an interactive transcript with inline silent gap proof certificates.
          </p>
        </div>

        {/* Audio Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleHearIt}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-colors duration-150 ${
              isPlaying
                ? 'bg-[#e5484d] text-white shadow-sm'
                : 'bg-[#f4f5f6] text-[#0c0d0e] hover:bg-white'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                <span>Pause Audio Synthesis</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Hear It Aloud (SpeechSynthesis)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transcript Stream List */}
      <div className="rounded-xl bg-[#141517] border border-[#23262a] p-5 md:p-6 space-y-3.5 max-w-4xl mx-auto">
        {bubbles.map((bubble, idx) => {
          const isSpoken = activeSpeechIndex === idx;

          if (bubble.type === 'silent_gap') {
            return (
              <div
                key={bubble.id}
                className="p-4 rounded-lg bg-[#1a1714] border border-[#f76808]/40 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono font-semibold text-[#f76808]">
                    <ShieldAlert className="w-4 h-4 text-[#f76808]" />
                    <span>SILENT STATE CHANGE (UNANNOUNCED TO AT)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#9ba1a6]">{bubble.timestamp}</span>
                </div>
                
                <p className="text-xs text-[#f4f5f6] leading-relaxed font-normal">
                  {bubble.text}
                </p>

                {bubble.proofCertificate && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#9ba1a6] border-t border-[#2a231f]">
                    <span>Proof: Visual DOM Diff &gt; 0, Assistive Speech Queue = 0</span>
                    <span className="text-[#5e6ad2] bg-[#141517] px-2 py-0.5 rounded border border-[#23262a]">
                      Cert: {bubble.proofCertificate}
                    </span>
                  </div>
                )}
              </div>
            );
          }

          if (bubble.type === 'live_announcement') {
            return (
              <div
                key={bubble.id}
                className={`p-3.5 rounded-lg bg-[#141a16] border border-[#30a46c]/40 space-y-1 transition-all duration-150 ${
                  isSpoken ? 'ring-1 ring-[#30a46c] bg-[#17211a]' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-[#30a46c] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ARIA-LIVE ASSERTIVE / POLITE DISPATCH
                  </span>
                  <span className="text-[11px] font-mono text-[#9ba1a6]">{bubble.timestamp}</span>
                </div>
                <p className="text-xs text-[#f4f5f6] font-medium pl-5">
                  &ldquo;{bubble.text}&rdquo;
                </p>
              </div>
            );
          }

          return (
            <div
              key={bubble.id}
              className={`p-3.5 rounded-lg bg-[#181a1d] border border-[#23262a] flex items-start justify-between gap-4 transition-all duration-150 ${
                isSpoken ? 'ring-1 ring-[#5e6ad2] bg-[#1f2226]' : ''
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-[#9ba1a6]">
                    {bubble.tag || 'VOICED'}
                  </span>
                  {isSpoken && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#5e6ad2]">
                      <WaveformIcon className="w-3 h-3 animate-pulse" />
                      <span>Speaking now</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#f4f5f6] font-normal leading-relaxed pt-0.5">
                  &ldquo;{bubble.text}&rdquo;
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#9ba1a6] shrink-0">{bubble.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
