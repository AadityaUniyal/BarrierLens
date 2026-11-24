'use client';

import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import { Sliders, Check, Eye, ArrowUpRight } from 'lucide-react';

interface SwissScrollProviderProps {
  children: React.ReactNode;
}

export function SwissScrollProvider({ children }: SwissScrollProviderProps) {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [currentViewport, setCurrentViewport] = useState<string>('Desktop · 1440');
  const [accentColor, setAccentColor] = useState<string>('#FF4D00');
  const [canvasMode, setCanvasMode] = useState<'paper' | 'obsidian'>('paper');
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Initialize Lenis inertia smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    // 2. Track scroll progress & viewport
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const current = Math.min(100, Math.max(0, Math.round((window.scrollY / totalScroll) * 100)));
        setScrollProgress(current);
      }
    };

    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1440) setCurrentViewport(`Desktop · ${w}`);
      else if (w >= 1024) setCurrentViewport(`Laptop · ${w}`);
      else if (w >= 768) setCurrentViewport(`Tablet · ${w}`);
      else setCurrentViewport(`Mobile · ${w}`);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      lenis.destroy();
    };
  }, []);

  const toggleCanvasMode = (mode: 'paper' | 'obsidian') => {
    setCanvasMode(mode);
    if (mode === 'paper') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  const toggleAccent = (color: string) => {
    setAccentColor(color);
    document.documentElement.style.setProperty('--swiss-orange', color);
  };

  return (
    <>
      {children}

      {/* Floating Swiss Bottom Status Bar (sbwebdesign.ch standard) */}
      <div 
        role="region" 
        aria-label="Swiss Layout Telemetry & Inspector"
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto"
      >
        {/* Scroll percentage indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 dark:bg-black/80 light:bg-white/90 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 shadow-xl select-none">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="tabular-nums font-semibold tracking-tight">{String(scrollProgress).padStart(2, '0')}%</span>
          <span className="text-white/20">&bull;</span>
          <span className="text-slate-400 hidden sm:inline">{currentViewport}</span>
        </div>

        {/* Live Swiss Inspector Pill */}
        <button
          type="button"
          onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/10 text-xs font-mono transition-all hover:scale-105 shadow-xl"
          title="Toggle Swiss Design Inspector"
          aria-expanded={isInspectorOpen}
        >
          <Sliders className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden md:inline text-[11px]">Inspector</span>
        </button>

        {/* Interactive Inspector Popover */}
        {isInspectorOpen && (
          <div 
            className="absolute bottom-12 right-0 w-72 rounded-2xl bg-[#0e121e]/95 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-150 z-50 text-slate-200 font-mono"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-semibold text-white tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                Swiss Design Specs
              </span>
              <button 
                type="button" 
                onClick={() => setIsInspectorOpen(false)}
                className="text-slate-400 hover:text-white px-1"
                aria-label="Close Inspector"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Canvas Surface</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleCanvasMode('obsidian')}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    canvasMode === 'obsidian' 
                      ? 'bg-white/10 border-white/30 text-white font-medium' 
                      : 'border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Obsidian Ink
                </button>
                <button
                  type="button"
                  onClick={() => toggleCanvasMode('paper')}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    canvasMode === 'paper' 
                      ? 'bg-white/10 border-white/30 text-white font-medium' 
                      : 'border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Paper Canvas
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Accent Pigment</div>
              <div className="flex items-center gap-2">
                {[
                  { color: '#FF4D00', label: 'Swiss Orange' },
                  { color: '#0055FF', label: 'International Blue' },
                  { color: '#10B981', label: 'Verified Mint' }
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => toggleAccent(item.color)}
                    className="flex-1 py-1 rounded-md text-[10px] border flex items-center justify-center gap-1 transition-all"
                    style={{
                      borderColor: accentColor === item.color ? item.color : 'rgba(255,255,255,0.1)',
                      backgroundColor: accentColor === item.color ? `${item.color}20` : 'transparent'
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Type: Bricolage Grotesque</span>
              <span className="text-white font-medium">100% Handcrafted</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
