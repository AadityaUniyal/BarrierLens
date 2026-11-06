'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Compass, 
  Volume2, 
  LineChart, 
  Dna, 
  Flame, 
  MonitorPlay, 
  Sparkles, 
  ShieldCheck,
  ChevronDown,
  Activity,
  Globe,
  FileText,
  AlertTriangle,
  Settings,
  Terminal,
  Cpu
} from 'lucide-react';
import { UserSession } from './AppleAuthModal';

export type ScreenId = 
  | 'story'
  // 5 Cupertino Primary Hubs
  | 'overview'
  | 'websites'
  | 'audits'
  | 'issues'
  | 'fixes'
  | 'reports'
  | 'settings'
  // Aliases for compatibility
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

  // 5 Cupertino Primary Hubs
  const primaryHubs = [
    { id: 'overview' as ScreenId, label: 'Overview', icon: Activity, keyNumber: '1' },
    { id: 'websites' as ScreenId, label: 'Sites & Journeys', icon: Globe, keyNumber: '2' },
    { id: 'audits' as ScreenId, label: 'Audit Studio', icon: Compass, keyNumber: '3' },
    { id: 'issues' as ScreenId, label: 'Issues & Evidence', icon: AlertTriangle, keyNumber: '4' },
    { id: 'fixes' as ScreenId, label: 'Fixes & PRs', icon: ShieldCheck, keyNumber: '5' },
  ];

  // Secondary Diagnostic Tools
  const secondaryDiagnostics = [
    { id: 'reports' as ScreenId, label: 'Executive Scorecard & Reports', icon: FileText },
    { id: 'focus-map' as ScreenId, label: 'Focus Map & Tarjan Proofs', icon: Terminal },
    { id: 'screen-reader' as ScreenId, label: 'VoiceOver Auditory Twin', icon: Volume2 },
    { id: 'genome' as ScreenId, label: 'Barrier Genome Vector Map', icon: Dna },
    { id: 'arena' as ScreenId, label: 'Red-Team Stress Arena', icon: Flame },
    { id: 'visual-twin' as ScreenId, label: 'Visual Twin Simulator', icon: MonitorPlay },
    { id: 'aws-bridge' as ScreenId, label: 'AWS Strands Swarm Console', icon: Cpu },
    { id: 'settings' as ScreenId, label: 'Workspace & Security Vault', icon: Settings },
  ];

  const isNavActive = (id: ScreenId) => {
    if (activeScreen === id) return true;
    if (id === 'overview' && activeScreen === 'pulse') return true;
    if (id === 'audits' && (activeScreen === 'inspector' || activeScreen === 'studio')) return true;
    if (id === 'issues' && activeScreen === 'triage') return true;
    if (id === 'fixes' && activeScreen === 'remedy') return true;
    if (id === 'websites' && activeScreen === 'websites') return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#050507]/80 border-b border-white/[0.08] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Story Link */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveScreen('overview')}
            className="flex items-center gap-2.5 text-left group transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#30d158] p-[1.5px] shadow-[0_2px_12px_rgba(0,113,227,0.35)]">
              <div className="w-full h-full bg-[#050507] rounded-[10px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#0071e3] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                BarrierLens
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[#86868b] border border-white/[0.05]">
                  Pro
                </span>
              </span>
            </div>
          </button>

          {/* Distinct Product Story Pill */}
          <button
            type="button"
            onClick={() => setActiveScreen('story')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              activeScreen === 'story'
                ? 'bg-gradient-to-r from-[#0071e3] to-[#bf5af2] text-white border-transparent shadow-[0_2px_12px_rgba(0,113,227,0.4)]'
                : 'bg-white/[0.04] text-[#86868b] hover:text-white border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#30d158]" />
            <span>Story & Live Demos</span>
          </button>
        </div>

        {/* 5 Cupertino Primary Hubs Segmented Control */}
        <nav 
          aria-label="Primary Navigation" 
          className="flex items-center bg-white/[0.04] p-1 rounded-full border border-white/[0.06] backdrop-blur-md"
        >
          {primaryHubs.map((hub) => {
            const Icon = hub.icon;
            const active = isNavActive(hub.id);
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => setActiveScreen(hub.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 relative ${
                  active
                    ? 'bg-[#0071e3] text-white shadow-[0_2px_10px_rgba(0,113,227,0.4)]'
                    : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#86868b]'}`} />
                <span className="hidden md:inline">{hub.label}</span>
                <span className={`text-[9px] font-mono opacity-50 ml-0.5 hidden lg:inline`}>
                  {hub.keyNumber}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Session Profile */}
        <div className="flex items-center gap-2.5">
          {/* Secondary Diagnostics Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] text-xs font-medium text-[#86868b] hover:text-white border border-white/[0.06] transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-[#86868b]" />
              <span className="hidden sm:inline">Diagnostics</span>
              <ChevronDown className={`w-3 h-3 text-[#86868b] transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsToolsOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#121215]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                    Diagnostic Deep-Inspection Tools
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {secondaryDiagnostics.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            setActiveScreen(tool.id);
                            setIsToolsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all ${
                            activeScreen === tool.id 
                              ? 'bg-[#0071e3] text-white font-medium' 
                              : 'text-[#d1d1d6] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Spotlight Command Palette (Cmd + K) */}
          <button
            type="button"
            onClick={openPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] text-xs text-[#86868b] hover:text-white border border-white/[0.06] transition-all"
            title="Open Command Palette (Cmd+K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#30d158]" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#86868b] bg-white/[0.06] rounded border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>

          {/* Active Backend Engine Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#86868b]">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <span className="font-mono text-[10px] text-[#30d158]">Hybrid Swarm</span>
          </div>

          {/* User Workspace Profile */}
          {userSession && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.07] transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#bf5af2] flex items-center justify-center text-[10px] font-semibold text-white">
                {userSession.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="hidden xl:inline text-xs font-medium text-white max-w-[100px] truncate">
                {userSession.name}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
