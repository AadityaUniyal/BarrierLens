'use client';

import React from 'react';
import { 
  Zap, 
  Terminal, 
  Compass, 
  Volume2, 
  LineChart, 
  Share2, 
  Dna, 
  GitBranch, 
  Flame, 
  Network, 
  Cloud, 
  MonitorPlay, 
  Sparkles, 
  ShieldCheck,
  ChevronDown,
  Activity,
  Layers,
  Globe,
  FileText,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { UserSession } from './AppleAuthModal';

export type ScreenId = 
  | 'story'
  // 7 Customer-Facing Primary Destinations
  | 'overview'
  | 'websites'
  | 'audits'
  | 'issues'
  | 'fixes'
  | 'reports'
  | 'settings'
  // Backward compatibility aliases
  | 'pulse'
  | 'inspector'
  | 'remedy'
  | 'genome'
  | 'arena'
  | 'vault'
  | 'studio'
  | 'triage'
  // Specialist diagnostic sub-views
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
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);

  // Seven Customer-Facing Primary Destinations
  const primaryDestinations = [
    { id: 'overview' as ScreenId, label: 'Overview', icon: Activity },
    { id: 'websites' as ScreenId, label: 'Websites', icon: Globe },
    { id: 'audits' as ScreenId, label: 'Audits', icon: Compass },
    { id: 'issues' as ScreenId, label: 'Issues', icon: AlertTriangle },
    { id: 'fixes' as ScreenId, label: 'Fixes', icon: ShieldCheck },
    { id: 'reports' as ScreenId, label: 'Reports', icon: FileText },
  ];

  // Secondary Diagnostic Tools
  const secondaryTools = [
    { id: 'visual-twin' as ScreenId, label: 'Visual Twin Simulator', icon: MonitorPlay },
    { id: 'focus-map' as ScreenId, label: 'Focus Map & Kendall Tau', icon: Terminal },
    { id: 'screen-reader' as ScreenId, label: 'VoiceOver Transcript', icon: Volume2 },
    { id: 'genome' as ScreenId, label: 'Barrier Genome Vector Map', icon: Dna },
    { id: 'arena' as ScreenId, label: 'Red-Team Stress Arena', icon: Flame },
    { id: 'trends' as ScreenId, label: 'Trends & Drift', icon: LineChart },
  ];

  // Check if screen is active or matches alias
  const isNavActive = (id: ScreenId) => {
    if (activeScreen === id) return true;
    if (id === 'overview' && activeScreen === 'pulse') return true;
    if (id === 'audits' && activeScreen === 'inspector') return true;
    if (id === 'fixes' && activeScreen === 'remedy') return true;
    if (id === 'settings' && activeScreen === 'vault') return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full apple-glass border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveScreen(userSession ? 'overview' : 'story')}
            className="flex items-center gap-2.5 focus:outline-none group active:scale-[0.98] transition-all duration-150 ease-spring"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center shadow-md shadow-blue-500/20 ring-hairline ring-white/20 group-hover:scale-105 transition-transform duration-150 ease-spring">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-[-0.015em] text-[#f5f5f7]">BarrierLens</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/10 text-[#0a84ff] border-hairline border-blue-500/30">
                Engineering
              </span>
            </div>
          </button>
        </div>

        {/* 7-Destination Primary Navigation Bar */}
        {userSession ? (
          <nav className="hidden md:flex items-center p-1 rounded-full bg-[#1c1c1e]/70 backdrop-blur-md border-hairline shadow-inner">
            {primaryDestinations.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium active:scale-[0.98] transition-all duration-150 ease-spring ${
                    active
                      ? 'bg-[#2c2c2e] text-[#f5f5f7] shadow-sm shadow-black/40 ring-hairline ring-white/10'
                      : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#0a84ff]' : 'text-[#86868b]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Diagnostic Sub-Views Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  secondaryTools.some(t => t.id === activeScreen)
                    ? 'bg-[#2c2c2e] text-[#f5f5f7] ring-hairline ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.04]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#86868b]" />
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isToolsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsToolsOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 w-56 rounded-2xl apple-glass border-hairline shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                      Specialist Tools
                    </div>
                    {secondaryTools.map((tool) => {
                      const ToolIcon = tool.icon;
                      const isSubActive = activeScreen === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setActiveScreen(tool.id);
                            setIsToolsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                            isSubActive 
                              ? 'bg-white/10 text-white font-medium' 
                              : 'text-[#a1a1a6] hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <ToolIcon className="w-3.5 h-3.5 text-[#0a84ff]" />
                          <span>{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-6 text-[13px] text-[#86868b]">
            <button onClick={() => setActiveScreen('story')} className="hover:text-white transition-colors">
              The Problem
            </button>
            <button onClick={() => setActiveScreen('story')} className="hover:text-white transition-colors">
              Methodology
            </button>
            <button onClick={() => setActiveScreen('story')} className="hover:text-white transition-colors">
              EAA 2025
            </button>
          </div>
        )}

        {/* Right Action: Settings & Profile */}
        <div className="flex items-center gap-2.5">
          {userSession ? (
            <>
              {/* Settings Destination */}
              <button
                onClick={() => setActiveScreen('settings')}
                className={`p-2 rounded-full text-xs font-medium border-hairline active:scale-[0.98] transition-all ${
                  isNavActive('settings')
                    ? 'bg-[#0071e3] text-white border-blue-400/40 shadow-sm shadow-blue-500/20'
                    : 'bg-[#1c1c1e]/60 text-[#a1a1a6] hover:text-white hover:bg-white/[0.08]'
                }`}
                title="Settings & Workspace Admin"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* User Avatar & Session Details */}
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#1c1c1e]/80 border-hairline hover:bg-white/[0.08] active:scale-[0.98] transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white">
                  {userSession.name.charAt(0)}
                </div>
                <span className="text-xs text-[#f5f5f7] font-medium hidden sm:inline max-w-[90px] truncate">
                  {userSession.name.split(' ')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-xs font-medium text-white transition-all shadow-md shadow-blue-500/20"
            >
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
