'use client';

import React from 'react';
import { 
  Zap, 
  Terminal, 
  Compass, 
  Volume2, 
  LineChart, 
  CheckSquare, 
  Share2, 
  ExternalLink,
  Activity
} from 'lucide-react';

export type ScreenId = 'studio' | 'focus-map' | 'screen-reader' | 'trends' | 'triage' | 'scorecard';

interface NavbarProps {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  openPalette: () => void;
  servicesCount: { operational: number; total: number };
}

export function Navbar({ activeScreen, setActiveScreen, openPalette, servicesCount }: NavbarProps) {
  const navItems = [
    { id: 'studio', label: 'Studio & Theater', icon: Compass },
    { id: 'focus-map', label: 'Focus Map & Tau', icon: Terminal },
    { id: 'screen-reader', label: 'Audio Transcript', icon: Volume2 },
    { id: 'trends', label: 'Trends & Sentinel', icon: LineChart },
    { id: 'triage', label: 'Review Queue', icon: CheckSquare },
    { id: 'scorecard', label: 'Public Scorecard', icon: Share2 },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full apple-glass border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveScreen('studio')}
            className="flex items-center gap-2.5 focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight text-[#f5f5f7]">BarrierLens</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-[#0a84ff] border border-blue-500/20">
                PRO 0.1%
              </span>
            </div>
          </button>
        </div>

        {/* Apple Segmented Navigation Switcher */}
        <nav className="hidden md:flex items-center p-1 rounded-full bg-[#1c1c1e]/80 border border-white/[0.06] shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#2c2c2e] text-[#f5f5f7] shadow-sm shadow-black/40'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#0a84ff]' : 'text-current'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools & Status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={openPalette}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#86868b] hover:text-[#f5f5f7] text-[11px] font-mono border border-white/[0.08] transition-colors"
          >
            <span className="text-[10px] px-1 py-0.5 rounded bg-white/10 text-white font-bold">⌘K</span>
            <span>Search</span>
          </button>

          <a
            href="/benchmark"
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#86868b] hover:text-[#f5f5f7] text-[11px] font-medium border border-white/[0.08] transition-colors"
          >
            <span>Benchmark</span>
            <ExternalLink className="w-3 h-3 text-[#6e6e73]" />
          </a>

          <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <span className="text-[11px] font-mono text-[#86868b] hidden lg:inline">
              Neon {servicesCount.operational}/{servicesCount.total}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
