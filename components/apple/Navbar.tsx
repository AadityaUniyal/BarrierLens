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
  Search,
  ExternalLink,
  LogOut,
  User,
  LayoutDashboard
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
  onSignOut?: () => void;
}

export function Navbar({ 
  activeScreen, 
  setActiveScreen, 
  openPalette, 
  servicesCount,
  userSession,
  onOpenAuth,
  onSignOut
}: NavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'oled' | 'light'>('dark');

  const isLandingPage = activeScreen === 'story';

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

  // Dashboard Primary Tabs (The 7 cohesive command centers)
  const dashboardTabs = [
    { id: 'overview' as ScreenId, label: 'Overview', icon: Activity, keyNumber: '1' },
    { id: 'audits' as ScreenId, label: 'Audit Studio', icon: Compass, keyNumber: '2' },
    { id: 'issues' as ScreenId, label: 'Issues & Proofs', icon: ShieldCheck, keyNumber: '3' },
    { id: 'fixes' as ScreenId, label: 'Causal Fixes', icon: Sparkles, keyNumber: '4' },
    { id: 'arena' as ScreenId, label: 'Adversarial Lab', icon: Flame, keyNumber: '5' },
    { id: 'genome' as ScreenId, label: 'Barrier Genome', icon: Layers, keyNumber: '6' },
    { id: 'settings' as ScreenId, label: 'Settings & Cloud', icon: Settings, keyNumber: '7' },
  ];

  const isTabActive = (id: ScreenId) => {
    if (activeScreen === id) return true;
    if (id === 'overview' && (activeScreen === 'pulse' || activeScreen === 'trends')) return true;
    if (id === 'audits' && (activeScreen === 'inspector' || activeScreen === 'studio')) return true;
    if (id === 'issues' && (activeScreen === 'triage' || activeScreen === 'focus-map' || activeScreen === 'screen-reader')) return true;
    if (id === 'fixes' && activeScreen === 'remedy') return true;
    if (id === 'settings' && (activeScreen === 'vault' || activeScreen === 'aws-bridge' || activeScreen === 'websites' || activeScreen === 'reports' || activeScreen === 'scorecard')) return true;
    return false;
  };

  const scrollToLandingSection = (sectionId: string) => {
    if (activeScreen !== 'story') {
      setActiveScreen('story');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0a0a0a]/95 backdrop-blur-md border-hairline-b transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Context Switcher */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveScreen('story')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none p-1 transition-all"
            title="BarrierLens Public Landing"
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

          {/* Workspace Pill in Dashboard Mode or Cloud Status in Landing Mode */}
          {!isLandingPage ? (
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-hairline-l text-xs font-mono text-[rgba(255,255,255,0.6)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-white font-medium">Pro Workspace</span>
              <span className="text-[10px] px-1 bg-[#121316] border-hairline text-[#10b981]">PROD</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-hairline-l">
              <div className="flex items-center gap-1.5 px-2 py-0.5 border-hairline text-[10px] font-mono text-[#10b981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span>BEDROCK NOVA</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 border-hairline text-[10px] font-mono text-[rgba(255,255,255,0.6)]">
                <span>CDP 9222</span>
              </div>
            </div>
          )}
        </div>

        {/* Center Navigation: Landing Page Anchors vs Dashboard Primary Tabs */}
        {isLandingPage ? (
          <nav aria-label="Public Navigation" className="hidden md:flex items-center gap-6 font-mono text-xs">
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('proofs')}
              className="text-[rgba(255,255,255,0.7)] hover:text-white transition-colors"
            >
              Proof Engine
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('how-it-works')}
              className="text-[rgba(255,255,255,0.7)] hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('benchmarks')}
              className="text-[rgba(255,255,255,0.7)] hover:text-white transition-colors"
            >
              Benchmarks
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('comparison')}
              className="text-[rgba(255,255,255,0.7)] hover:text-white transition-colors"
            >
              Comparison
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('pricing')}
              className="text-[rgba(255,255,255,0.7)] hover:text-white transition-colors"
            >
              Pricing
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('faq')}
              className="text-[rgba(255,255,255,0.7)] hover:text-white transition-colors"
            >
              FAQ
            </button>
          </nav>
        ) : (
          <nav 
            aria-label="Dashboard Navigation" 
            className="flex items-center gap-1 bg-[#121316] p-1 border-hairline overflow-x-auto max-w-full"
          >
            {dashboardTabs.map((tab) => {
              const active = isTabActive(tab.id);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveScreen(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                    active
                      ? 'bg-white text-black font-bold'
                      : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[#1a1c20]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-black' : 'text-[rgba(255,255,255,0.6)]'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-40 hidden xl:inline ml-0.5">
                    [{tab.keyNumber}]
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-2">
          
          {/* Spotlight ⌘K Trigger (In Dashboard mode) */}
          {!isLandingPage && (
            <button
              type="button"
              onClick={openPalette}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#121316] hover:bg-[#1a1c20] border-hairline text-xs font-mono text-[rgba(255,255,255,0.6)] hover:text-white transition-all"
              title="Search commands (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="text-[10px] px-1 bg-[#0a0a0a] border-hairline text-[rgba(255,255,255,0.5)]">
                ⌘K
              </kbd>
            </button>
          )}

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

          {/* In Landing Page: Sign In vs Launch Dashboard */}
          {isLandingPage ? (
            <div className="flex items-center gap-2">
              {userSession ? (
                <button
                  type="button"
                  onClick={() => setActiveScreen('overview')}
                  className="px-4 py-1.5 bg-white hover:bg-[rgba(255,255,255,0.85)] text-black text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>DASHBOARD</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="px-3 py-1.5 bg-[#121316] hover:bg-[#1a1c20] border-hairline text-white text-xs font-mono font-medium tracking-wider uppercase transition-all"
                  >
                    SIGN IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('overview')}
                    className="px-4 py-1.5 bg-white hover:bg-[rgba(255,255,255,0.85)] text-black text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>LAUNCH APP</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ) : (
            /* In Dashboard Mode: User Profile Dropdown & Switch to Landing */
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1 bg-[#121316] hover:bg-[#1a1c20] border-hairline text-xs font-mono text-white transition-all"
              >
                <div className="w-5 h-5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] flex items-center justify-center font-bold text-[10px]">
                  {userSession?.name?.charAt(0) || 'A'}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">
                  {userSession?.name || 'Lead Auditor'}
                </span>
                <ChevronDown className={`w-3 h-3 text-[rgba(255,255,255,0.5)] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-[#121316] border-hairline shadow-2xl p-2 z-50 font-mono animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-hairline-b mb-1">
                      <div className="text-xs font-bold text-white truncate">
                        {userSession?.name || 'Aaditya Uniyal'}
                      </div>
                      <div className="text-[10px] text-[rgba(255,255,255,0.5)] truncate">
                        {userSession?.email || 'auditor@barrierlens.com'}
                      </div>
                      <div className="text-[10px] text-[#10b981] mt-0.5">
                        {userSession?.role || 'Lead Auditor'} &bull; Pro Tier
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen('story');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#1a1c20] flex items-center gap-2 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[rgba(255,255,255,0.4)]" />
                        <span>Public Landing Page</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[#1a1c20] flex items-center gap-2 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-[rgba(255,255,255,0.4)]" />
                        <span>Settings & API Vault</span>
                      </button>

                      <div className="border-hairline-t my-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSignOut) onSignOut();
                            setActiveScreen('story');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
