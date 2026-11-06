'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Compass, 
  Volume2, 
  ShieldCheck,
  ChevronDown,
  Globe,
  FileText,
  AlertTriangle,
  Settings,
  Terminal,
  Search,
  Sparkles,
  Cpu,
  Flame,
  Dna,
  Layers,
  Sun,
  Moon,
  Contrast
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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
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

  // Core High-Conviction Hubs
  const primaryHubs = [
    { id: 'story' as ScreenId, label: 'Product' },
    { id: 'audits' as ScreenId, label: 'Audit Studio', keyNumber: '1' },
    { id: 'issues' as ScreenId, label: 'Evidence & Proofs', keyNumber: '2' },
    { id: 'fixes' as ScreenId, label: 'Verified Fixes', keyNumber: '3' },
    { id: 'reports' as ScreenId, label: 'Reports', keyNumber: '4' },
  ];

  // Secondary Deep Diagnostic Lab Tools
  const diagnosticTools = [
    { id: 'focus-map' as ScreenId, label: 'Focus Map & Tarjan Proofs', icon: Terminal, desc: 'Interactive graph topology cycles' },
    { id: 'screen-reader' as ScreenId, label: 'VoiceOver Auditory Twin', icon: Volume2, desc: 'Acoustic reading order transcript' },
    { id: 'websites' as ScreenId, label: 'Target Sites & Journeys', icon: Globe, desc: 'Monitored domains and flows' },
    { id: 'arena' as ScreenId, label: 'Adversarial Stress Arena', icon: Flame, desc: 'Synthetic barrier injection tests' },
    { id: 'genome' as ScreenId, label: 'Barrier Genome Vectors', icon: Dna, desc: 'Cross-site similarity cluster map' },
    { id: 'settings' as ScreenId, label: 'Workspace & Security Vault', icon: Settings, desc: 'API keys, webhooks, rate limits' },
  ];

  const isNavActive = (id: ScreenId) => {
    if (activeScreen === id) return true;
    if (id === 'audits' && (activeScreen === 'inspector' || activeScreen === 'studio')) return true;
    if (id === 'issues' && activeScreen === 'triage') return true;
    if (id === 'fixes' && activeScreen === 'remedy') return true;
    if (id === 'reports' && (activeScreen === 'scorecard' || activeScreen === 'trends')) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0c0d0e]/95 backdrop-blur-md border-b border-[#23262a] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
        
        {/* Brand Link */}
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setActiveScreen('story')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff] rounded-md px-1 py-0.5"
          >
            <div className="w-5 h-5 rounded bg-[#181a1d] border border-[#34383e] flex items-center justify-center">
              <Zap className="w-3 h-3 text-[#f4f5f6]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-tight text-[#f4f5f6]">
                BarrierLens
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#181a1d] text-[#9ba1a6] border border-[#23262a]">
                v2.0
              </span>
            </div>
          </button>
        </div>

        {/* Primary Segmented Navigation (Linear Style) */}
        <nav 
          aria-label="Primary Navigation" 
          className="flex items-center gap-1 bg-[#141517] p-0.5 rounded-lg border border-[#23262a]"
        >
          {primaryHubs.map((hub) => {
            const active = isNavActive(hub.id);
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => setActiveScreen(hub.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff] ${
                  active
                    ? 'bg-[#1f2226] text-[#f4f5f6] shadow-sm border border-[#34383e]'
                    : 'text-[#9ba1a6] hover:text-[#f4f5f6] hover:bg-[#181a1d] border border-transparent'
                }`}
              >
                <span>{hub.label}</span>
                {hub.keyNumber && (
                  <span className={`text-[10px] font-mono opacity-40 hidden md:inline ml-0.5`}>
                    {hub.keyNumber}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Diagnostic Lab, Search ⌘K, User Auth */}
        <div className="flex items-center gap-2">
          
          {/* Diagnostic Lab Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141517] hover:bg-[#1a1c1e] text-xs font-medium text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#23262a] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
            >
              <Terminal className="w-3.5 h-3.5 text-[#9ba1a6]" />
              <span className="hidden sm:inline">Lab Tools</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsToolsOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#141517] border border-[#2d3137] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-[#9ba1a6] uppercase tracking-wider">
                    Diagnostic Deep Inspection
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {diagnosticTools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            setActiveScreen(tool.id);
                            setIsToolsOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                            activeScreen === tool.id 
                              ? 'bg-[#1f2226] text-[#f4f5f6] border border-[#34383e]' 
                              : 'text-[#9ba1a6] hover:bg-[#181a1d] hover:text-[#f4f5f6] border border-transparent'
                          }`}
                        >
                          <Icon className="w-4 h-4 mt-0.5 text-[#9ba1a6] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-[#f4f5f6] truncate">{tool.label}</div>
                            <div className="text-[11px] text-[#6b7280] truncate">{tool.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Search Palette (Cmd+K) */}
          <button
            type="button"
            onClick={openPalette}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#141517] hover:bg-[#1a1c1e] text-xs text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#23262a] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
            title="Open Command Palette (Cmd+K)"
          >
            <Search className="w-3 h-3 text-[#9ba1a6]" />
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[10px] font-mono text-[#6b7280] bg-[#181a1d] rounded border border-[#23262a]">
              ⌘K
            </kbd>
          </button>

          {/* Theme Mode Switcher (Linear Slate / OLED Black / Paper Light) */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-1.5 rounded-md bg-[#141517] hover:bg-[#1a1c1e] text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#23262a] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
            title={`Active Theme: ${theme.toUpperCase()} (Click to toggle)`}
          >
            {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-[#5e6ad2]" />}
            {theme === 'oled' && <Contrast className="w-3.5 h-3.5 text-[#f4f5f6]" />}
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-[#f76808]" />}
          </button>

          {/* User Session Profile or Sign In */}
          {userSession ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141517] hover:bg-[#1a1c1e] border border-[#23262a] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
            >
              <div className="w-4 h-4 rounded-full bg-[#25282e] border border-[#34383e] flex items-center justify-center text-[10px] font-semibold text-[#f4f5f6]">
                {userSession.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden xl:inline text-xs font-medium text-[#f4f5f6] max-w-[90px] truncate">
                {userSession.name}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-3 py-1 rounded-md bg-[#f4f5f6] hover:bg-white text-xs font-medium text-[#0c0d0e] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0090ff]"
            >
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
