'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ShieldCheck,
  ChevronDown,
  Globe,
  FileText,
  Settings,
  Terminal,
  Search,
  Sparkles,
  Cpu,
  Flame,
  Sun,
  Moon,
  Command,
  Activity,
  Layers
} from 'lucide-react';
import { UserSession } from './AppleAuthModal';

export type ScreenId = 
  | 'story'
  | 'overview'
  | 'websites'
  | 'audits'
  | 'issues'
  | 'fixes'
  | 'reports'
  | 'settings'
  | 'pulse'
  | 'inspector'
  | 'remedy'
  | 'genome'
  | 'arena'
  | 'vault'
  | 'studio'
  | 'triage'
  | 'visual-twin' 
  | 'multi-agent' 
  | 'aws-bridge' 
  | 'focus-map' 
  | 'screen-reader' 
  | 'trends' 
  | 'scorecard';

interface NavbarProps {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  openPalette: () => void;
  servicesCount: { operational: number; total: number };
  userSession?: UserSession | null;
  onOpenAuth?: () => void;
}

export function Navbar({ 
  activeScreen, 
  setActiveScreen, 
  openPalette, 
  servicesCount,
  userSession,
  onOpenAuth
}: NavbarProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'oled' | 'light'>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('barrierlens-theme') as 'dark' | 'oled' | 'light';
      if (saved && (saved === 'dark' || saved === 'oled' || saved === 'light')) {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch {
      // ignore SSR or storage restriction
    }
  }, []);

  const cycleTheme = () => {
    const nextTheme = theme === 'dark' ? 'oled' : theme === 'oled' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('barrierlens-theme', nextTheme);
    } catch {
      // ignore
    }
  };

  // The 5 Core Master Hubs
  const masterHubs = [
    { id: 'audits' as ScreenId, label: 'Audit Studio', icon: Compass, keyNumber: '1' },
    { id: 'issues' as ScreenId, label: 'Evidence & Proofs', icon: ShieldCheck, keyNumber: '2' },
    { id: 'fixes' as ScreenId, label: 'Causal Fixes', icon: Sparkles, keyNumber: '3' },
    { id: 'arena' as ScreenId, label: 'Adversarial Lab', icon: Flame, keyNumber: '4' },
    { id: 'aws-bridge' as ScreenId, label: 'AWS & Genome', icon: Cpu, keyNumber: '5' },
  ];

  // Secondary Tools
  const secondaryTools = [
    { id: 'overview' as ScreenId, label: 'Executive Pulse HUD', icon: Activity, desc: 'Compliance trends & SLA summary' },
    { id: 'websites' as ScreenId, label: 'Monitored Sites & Journeys', icon: Globe, desc: 'Configured domains and target flows' },
    { id: 'reports' as ScreenId, label: 'Exportable Audit Scorecard', icon: FileText, desc: 'Public certified compliance ledger' },
    { id: 'settings' as ScreenId, label: 'Security & API Vault', icon: Settings, desc: 'HMAC webhooks & API credentials' },
    { id: 'story' as ScreenId, label: 'Product Architecture Tour', icon: Layers, desc: 'Algorithmic differentiator showcase' },
  ];

  const isNavActive = (id: ScreenId) => {
    if (activeScreen === id) return true;
    if (id === 'audits' && (activeScreen === 'inspector' || activeScreen === 'studio')) return true;
    if (id === 'issues' && (activeScreen === 'triage' || activeScreen === 'focus-map' || activeScreen === 'screen-reader')) return true;
    if (id === 'fixes' && activeScreen === 'remedy') return true;
    if (id === 'aws-bridge' && (activeScreen === 'genome' || activeScreen === 'multi-agent')) return true;
    if (id === 'reports' && (activeScreen === 'scorecard' || activeScreen === 'trends')) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand & Live Cloud Telemetry Indicator */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveScreen('audits')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none rounded-lg p-1 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0090ff] to-[#8b5cf6] p-[1px] shadow-lg shadow-[#0090ff]/20">
              <div className="w-full h-full bg-[#07080b] rounded-[7px] flex items-center justify-center">
                <span className="font-bold text-sm bg-gradient-to-r from-[#0090ff] to-[#06b6d4] bg-clip-text text-transparent">BL</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-[#0090ff] transition-colors">
                  BarrierLens
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300 border border-white/[0.08]">
                  2.0
                </span>
              </div>
            </div>
          </button>

          {/* Active Cloud Health Badge */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/[0.08]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AWS Bedrock Nova</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-medium text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>CDP Chromium</span>
            </div>
          </div>
        </div>

        {/* 5 Master Hub Navigation Tabs */}
        <nav 
          aria-label="Primary Navigation" 
          className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] backdrop-blur-md"
        >
          {masterHubs.map((hub) => {
            const active = isNavActive(hub.id);
            const Icon = hub.icon;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => setActiveScreen(hub.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-500/25 border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{hub.label}</span>
                <span className={`text-[10px] font-mono opacity-50 hidden xl:inline ml-0.5`}>
                  {hub.keyNumber}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: More Tools, Search ⌘K, User Auth */}
        <div className="flex items-center gap-2">
          
          {/* Secondary Tools Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 border border-white/[0.08] transition-all"
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0d0f15] border border-white/[0.12] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Extended Workspace
                  </div>
                  <div className="space-y-1 mt-1">
                    {secondaryTools.map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            setActiveScreen(tool.id);
                            setIsMoreOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
                            activeScreen === tool.id 
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                              : 'text-slate-300 hover:bg-white/[0.06] border border-transparent'
                          }`}
                        >
                          <ToolIcon className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-medium text-slate-100">{tool.label}</div>
                            <div className="text-[11px] text-slate-400">{tool.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Spotlight ⌘K Trigger */}
          <button
            type="button"
            onClick={openPalette}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-400 hover:text-white transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="font-mono text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-slate-300 border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
          </button>

          {/* User Session / Sign In */}
          {userSession ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="max-w-[80px] truncate">{userSession.name || 'Engineer'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-lg bg-white text-[#07080b] hover:bg-slate-100 text-xs font-semibold shadow-md transition-all"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
