'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ShieldCheck,
  ChevronDown,
  Globe,
  FileText,
  Settings,
  Sparkles,
  Cpu,
  Flame,
  Sun,
  Moon,
  Command,
  Activity,
  Layers,
  ArrowRight,
  Search
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

  // Primary Navigation Hubs (Bridging Cinematic Editorial + Full App)
  const masterHubs = [
    { id: 'story' as ScreenId, label: 'Overview', icon: Layers, keyNumber: '0' },
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
    <header className="sticky top-0 z-50 w-full bg-[#0a0a0a]/95 backdrop-blur-md border-hairline-b transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand & Live Cloud Telemetry Indicator */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveScreen('story')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none p-1 transition-all"
          >
            <div className="w-7 h-7 bg-white text-black font-mono font-black flex items-center justify-center text-xs tracking-tighter shadow-sm">
              BL
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white uppercase font-display">
                BarrierLens
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 border-hairline text-[rgba(255,255,255,0.6)]">
                v2.0
              </span>
            </div>
          </button>

          {/* Active Cloud Health Badge */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-hairline-l">
            <div className="flex items-center gap-1.5 px-2 py-0.5 border-hairline text-[10px] font-mono text-[#10b981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span>BEDROCK NOVA</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 border-hairline text-[10px] font-mono text-[rgba(255,255,255,0.6)]">
              <span>CDP 9222</span>
            </div>
          </div>
        </div>

        {/* Primary Segmented Navigation Hubs */}
        <nav 
          aria-label="Primary Navigation" 
          className="flex items-center gap-1 bg-[#121316] p-1 border-hairline"
        >
          {masterHubs.map((hub) => {
            const active = isNavActive(hub.id);
            const Icon = hub.icon;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => setActiveScreen(hub.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-white text-black font-bold'
                    : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[#1a1c20]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-black' : 'text-[rgba(255,255,255,0.6)]'}`} />
                <span>{hub.label}</span>
                <span className={`text-[10px] opacity-40 hidden xl:inline ml-0.5`}>
                  [{hub.keyNumber}]
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: More Tools, Search ⌘K, User Auth / Launch App */}
        <div className="flex items-center gap-2">
          
          {/* Secondary Tools Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#121316] hover:bg-[#1a1c20] text-xs font-mono uppercase text-[rgba(255,255,255,0.7)] hover:text-white border-hairline transition-all"
            >
              <span>Tools</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-[#121316] border-hairline shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-widest">
                    Diagnostic Lab Workspaces
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
                          className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 transition-all ${
                            activeScreen === tool.id 
                              ? 'bg-white text-black font-bold' 
                              : 'text-[rgba(255,255,255,0.7)] hover:bg-[#1a1c20] hover:text-white'
                          }`}
                        >
                          <ToolIcon className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold">{tool.label}</div>
                            <div className="text-[11px] opacity-70">{tool.desc}</div>
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
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#121316] hover:bg-[#1a1c20] border-hairline text-xs font-mono text-[rgba(255,255,255,0.6)] hover:text-white transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="text-[10px] px-1 bg-[#0a0a0a] border-hairline text-[rgba(255,255,255,0.5)]">
              ⌘K
            </kbd>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-1.5 bg-[#121316] hover:bg-[#1a1c20] border-hairline text-[rgba(255,255,255,0.7)] hover:text-white transition-all"
            title={`Theme: ${theme}`}
          >
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-white" />
            )}
          </button>

          {/* Primary Action Button: Flip to Studio if on Story */}
          {activeScreen === 'story' ? (
            <button
              type="button"
              onClick={() => setActiveScreen('audits')}
              className="px-3.5 py-1 bg-white hover:bg-[rgba(255,255,255,0.85)] text-black text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>LAUNCH APP</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : userSession ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#121316] border-hairline text-xs font-mono text-[#10b981]"
            >
              <span className="w-2 h-2 bg-[#10b981]" />
              <span className="max-w-[80px] truncate">{userSession.name || 'Engineer'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1 bg-[#121316] hover:bg-[#1a1c20] border-hairline text-white text-xs font-mono font-bold tracking-wider uppercase transition-all"
            >
              SIGN IN
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
