'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ShieldCheck,
  ChevronDown,
  Globe,
  FileText,
  Settings,
  GitPullRequest,
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
  LayoutDashboard,
  Fingerprint,
  CheckCircle2
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { UserSession } from './AppleAuthModal';
import { BrandLogo } from '@/components/brand/BrandLogo';

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
    const domTheme = typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-theme') as 'dark' | 'oled' | 'light' | null) : null;
    const activeCurrent = domTheme || theme;
    const nextTheme = activeCurrent === 'dark' ? 'oled' : activeCurrent === 'oled' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('barrierlens-theme', nextTheme);
    } catch {
      // ignore
    }
  };

  // Master 8-Tab High-Craft Swiss Dashboard Navigation
  const dashboardTabs = [
    { id: 'overview' as ScreenId, label: 'Overview', icon: Activity, keyNumber: '1' },
    { id: 'studio' as ScreenId, label: 'Audit Studio', icon: Compass, keyNumber: '2' },
    { id: 'issues' as ScreenId, label: 'Issues & Proofs', icon: CheckCircle2, keyNumber: '3' },
    { id: 'fixes' as ScreenId, label: 'Causal Fixes', icon: GitPullRequest, keyNumber: '4' },
    { id: 'arena' as ScreenId, label: 'Adversarial Lab', icon: Flame, keyNumber: '5' },
    { id: 'genome' as ScreenId, label: 'Barrier Genome', icon: Cpu, keyNumber: '6' },
    { id: 'websites' as ScreenId, label: 'Sites', icon: Globe, keyNumber: '7' },
    { id: 'vault' as ScreenId, label: 'Settings', icon: Settings, keyNumber: '8' },
  ];

  const isTabActive = (id: ScreenId) => {
    if (activeScreen === id) return true;
    if (id === 'overview' && (activeScreen === 'overview' || activeScreen === 'pulse')) return true;
    if (id === 'studio' && (activeScreen === 'studio' || activeScreen === 'audits' || activeScreen === 'inspector' || activeScreen === 'visual-twin')) return true;
    if (id === 'issues' && (activeScreen === 'issues' || activeScreen === 'triage' || activeScreen === 'focus-map' || activeScreen === 'screen-reader')) return true;
    if (id === 'fixes' && (activeScreen === 'fixes' || activeScreen === 'remedy')) return true;
    if (id === 'arena' && activeScreen === 'arena') return true;
    if (id === 'genome' && activeScreen === 'genome') return true;
    if (id === 'websites' && activeScreen === 'websites') return true;
    if (id === 'vault' && (activeScreen === 'vault' || activeScreen === 'settings' || activeScreen === 'reports')) return true;
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
    <div className="sticky top-2 sm:top-3.5 z-50 w-full px-3 sm:px-6 pointer-events-none">
      <header className="max-w-6xl mx-auto h-13 sm:h-14 px-3 sm:px-5 flex items-center justify-between gap-3 bg-white/95 dark:bg-black/80 backdrop-blur-md rounded-full border border-black/[0.08] dark:border-white/[0.08] shadow-sm pointer-events-auto transition-all duration-300">
        
        {/* Brand Logo & Context Switcher */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveScreen('story')}
            className="flex items-center text-left focus-visible:outline-none p-0.5 rounded-full hover:opacity-90 transition-opacity"
            title="BarrierLens Public Landing"
          >
            <span className="sr-only">BL</span>
            <BrandLogo size="md" showBadge={false} />
          </button>

          {/* Micro status beacon */}
          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-black/[0.08] dark:border-white/[0.08] text-[11px] text-slate-500 dark:text-white/60 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-slate-800 dark:text-white/80 font-medium tracking-tight">Active Cluster</span>
          </div>
        </div>

        {/* Center Navigation: Landing Page Anchors vs Dashboard Primary Sliding Tabs */}
        {isLandingPage ? (
          <nav aria-label="Public Navigation" className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('proofs')}
              className="px-3.5 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            >
              Proof Engine
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('how-it-works')}
              className="px-3.5 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            >
              How It Works
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('benchmarks')}
              className="px-3.5 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            >
              Benchmarks
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('comparison')}
              className="px-3.5 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            >
              Comparison
            </button>
            <button 
              type="button" 
              onClick={() => scrollToLandingSection('pricing')}
              className="px-3.5 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            >
              Pricing
            </button>
          </nav>
        ) : (
          <nav 
            aria-label="Dashboard Navigation" 
            className="flex items-center gap-1 bg-black/[0.03] dark:bg-black/40 backdrop-blur-md p-1 rounded-full border border-black/[0.06] dark:border-white/[0.08] overflow-x-auto max-w-full"
          >
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveScreen(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                    active 
                      ? 'text-white bg-[#121212] dark:bg-white/[0.16] shadow-sm font-bold' 
                      : 'text-slate-600 dark:text-white/60 hover:text-black dark:hover:text-white/90 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className="hidden sm:inline font-mono text-[9px] opacity-50">[{tab.keyNumber}]</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Actions & Utilities */}
        <div className="flex items-center gap-2">
          {/* Cmd+K Search trigger */}
          <button 
            type="button" 
            onClick={openPalette}
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-600 dark:text-white/60 hover:text-black dark:hover:text-white transition-all"
            title="Open Command Palette (⌘K)"
          >
            <Search className="w-3 h-3 opacity-60" />
            <span className="hidden md:inline text-[11px]">Command</span>
            <kbd className="font-mono text-[10px] opacity-50">⌘K</kbd>
          </button>

          {/* Theme Cycler */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {theme === 'dark' && <Moon className="w-3.5 h-3.5" />}
            {theme === 'oled' && <Moon className="w-3.5 h-3.5 text-orange-400" />}
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-yellow-500" />}
          </button>

          {/* User Passkey Account / Sign In Pill */}
          {userSession ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-xs text-white transition-all"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  {userSession.name ? userSession.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline font-medium text-[11px] truncate max-w-[90px]">
                  {userSession.name}
                </span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>

              {/* User Dropdown Drawer */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 apple-liquid-glass rounded-2xl p-2 shadow-2xl border border-white/[0.12] text-xs animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                    <p className="font-semibold text-white truncate">{userSession.name}</p>
                    <p className="text-[10px] text-white/50 truncate font-mono">{userSession.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActiveScreen('overview'); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/[0.08] text-white/80 flex items-center gap-2"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Fleet & Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSignOut?.(); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105"
              title="Sign in to your account"
            >
              <User className="w-3.5 h-3.5 text-slate-800" />
              <span>Sign In</span>
            </button>
          )}

          {/* Landing CTA: Open Studio */}
          {isLandingPage && (
            <button
              type="button"
              onClick={() => setActiveScreen('studio')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-950 hover:bg-slate-100 text-xs font-semibold shadow-sm transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Studio</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
