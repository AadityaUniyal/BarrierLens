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
import { authClient } from '@/lib/auth-client';
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
  onSignOut?: () => void | Promise<void>;
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

  // Dashboard Primary Tabs (The 8 cohesive command centers)
  const dashboardTabs = [
    { id: 'overview' as ScreenId, label: 'Overview', icon: Activity, keyNumber: '1' },
    { id: 'audits' as ScreenId, label: 'Audit Studio', icon: Compass, keyNumber: '2' },
    { id: 'issues' as ScreenId, label: 'Issues & Proofs', icon: ShieldCheck, keyNumber: '3' },
    { id: 'fixes' as ScreenId, label: 'Causal Fixes', icon: Sparkles, keyNumber: '4' },
    { id: 'arena' as ScreenId, label: 'Adversarial Lab', icon: Flame, keyNumber: '5' },
    { id: 'genome' as ScreenId, label: 'Barrier Genome', icon: Layers, keyNumber: '6' },
    { id: 'websites' as ScreenId, label: 'Sites', icon: Globe, keyNumber: '7' },
    { id: 'settings' as ScreenId, label: 'Settings & Cloud', icon: Settings, keyNumber: '8' },
  ];

  const isTabActive = (id: ScreenId) => {
    if (activeScreen === id) return true;
    if (id === 'overview' && (activeScreen === 'pulse' || activeScreen === 'trends')) return true;
    if (id === 'audits' && (activeScreen === 'inspector' || activeScreen === 'studio')) return true;
    if (id === 'issues' && (activeScreen === 'triage' || activeScreen === 'focus-map' || activeScreen === 'screen-reader')) return true;
    if (id === 'fixes' && activeScreen === 'remedy') return true;
    if (id === 'websites' && activeScreen === 'websites') return true;
    if (id === 'settings' && (activeScreen === 'vault' || activeScreen === 'aws-bridge' || activeScreen === 'reports' || activeScreen === 'scorecard')) return true;
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
    <header className="sticky top-0 z-50 w-full bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--line)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Context Switcher */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveScreen('story')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none p-1 transition-all"
            title="BarrierLens Public Landing"
          >
            <div className="w-7 h-7 bg-[var(--fg)] text-[var(--bg)] font-mono font-black flex items-center justify-center text-xs tracking-tighter shadow-sm">
              BL
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[var(--fg)] uppercase font-display">
                BarrierLens
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[var(--line)] text-[var(--fg-muted)]">
                v2.0
              </span>
            </div>
          </button>

          {/* Workspace Pill in Dashboard Mode or Cloud Status in Landing Mode */}
          {!isLandingPage ? (
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[var(--line)] text-xs font-mono text-[var(--fg-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-[var(--fg)] font-medium">Pro Workspace</span>
              <span className="text-[10px] px-1 bg-[var(--bg-secondary)] border border-[var(--line)] text-[#10b981]">PROD</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-hairline-l">
              <div className="flex items-center gap-1.5 px-2 py-0.5 border-hairline text-[10px] font-mono text-[#10b981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span>WCAG 2.2 AAA</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 border-hairline text-[10px] font-mono text-[rgba(255,255,255,0.7)]">
                <span>EAA 2025 READY</span>
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
            className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 border border-[var(--line)] overflow-x-auto max-w-full"
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
                      ? 'bg-[var(--fg)] text-[var(--bg)] font-bold'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[var(--bg)]' : 'text-[var(--fg-muted)]'}`} />
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
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] border border-[var(--line)] text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all"
              title="Search commands (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="text-[10px] px-1 bg-[var(--bg)] border border-[var(--line)] text-[var(--fg-subtle)]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] border border-[var(--line)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all"
            aria-label={`Switch theme, current: ${theme}`}
            title={`Theme: ${theme}`}
          >
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[var(--fg)]" />
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
                    className="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] border border-[var(--line)] text-[var(--fg)] text-xs font-mono font-medium tracking-wider uppercase transition-all"
                  >
                    SIGN IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('overview')}
                    className="px-4 py-1.5 bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-sm"
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
                className="flex items-center gap-2 px-2.5 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] border border-[var(--line)] text-xs font-mono text-[var(--fg)] transition-all"
              >
                <div className="w-5 h-5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] flex items-center justify-center font-bold text-[10px]">
                  {userSession?.name?.charAt(0) || 'A'}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">
                  {userSession?.name || 'Lead Auditor'}
                </span>
                <ChevronDown className={`w-3 h-3 text-[var(--fg-muted)] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-secondary)] border border-[var(--line)] shadow-2xl p-2 z-50 font-mono animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-[var(--line)] mb-1">
                      <div className="text-xs font-bold text-[var(--fg)] truncate">
                        {userSession?.name || 'Aaditya Uniyal'}
                      </div>
                      <div className="text-[10px] text-[var(--fg-muted)] truncate">
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
                        className="w-full text-left px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface)] flex items-center gap-2 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--fg-subtle)]" />
                        <span>Public Landing Page</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface)] flex items-center gap-2 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-[var(--fg-subtle)]" />
                        <span>Settings & API Vault</span>
                      </button>

                      <div className="border-t border-[var(--line)] my-1 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await authClient.signOut();
                            } catch (e) {
                              console.warn('[Navbar] authClient.signOut error:', e);
                            }
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
