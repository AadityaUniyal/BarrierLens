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
  Activity,
  Dna,
  GitBranch,
  Flame,
  Network,
  Cloud,
  MonitorPlay,
  Sparkles,
  Fingerprint,
  Key,
  ShieldCheck
} from 'lucide-react';
import { UserSession } from './AppleAuthModal';

export type ScreenId = 
  | 'story'
  | 'studio' 
  | 'integrations'
  | 'visual-twin' 
  | 'multi-agent' 
  | 'aws-bridge' 
  | 'focus-map' 
  | 'screen-reader' 
  | 'barrier-genome' 
  | 'causal-diff' 
  | 'stress-test' 
  | 'trends' 
  | 'triage' 
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

  // Apple Core Pillars
  const primaryNavItems = [
    { id: 'story', label: 'Story', icon: Sparkles },
    { id: 'studio', label: 'Studio', icon: Compass },
    { id: 'integrations', label: 'Integrations', icon: GitBranch },
    { id: 'visual-twin', label: 'Visual Twin', icon: MonitorPlay },
    { id: 'barrier-genome', label: 'Barrier Genome', icon: Dna },
    { id: 'aws-bridge', label: 'AWS Bedrock', icon: Cloud },
  ] as const;

  // Secondary Deep Diagnostic Tools
  const secondaryTools = [
    { id: 'multi-agent', label: 'Multi-Agent Mesh', icon: Network },
    { id: 'focus-map', label: 'Focus Map & Kendall Tau', icon: Terminal },
    { id: 'screen-reader', label: 'VoiceOver Transcript', icon: Volume2 },
    { id: 'causal-diff', label: 'Causal Proof Studio', icon: ShieldCheck },
    { id: 'stress-test', label: 'Red-Team Stress Arena', icon: Flame },
    { id: 'scorecard', label: 'Public Scorecard', icon: Share2 },
    { id: 'trends', label: 'Trends & Drift', icon: LineChart },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full apple-glass border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveScreen('story')}
            className="flex items-center gap-2.5 focus:outline-none group active:scale-[0.98] transition-all duration-150 ease-spring"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center shadow-md shadow-blue-500/20 ring-hairline ring-white/20 group-hover:scale-105 transition-transform duration-150 ease-spring">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-[-0.015em] text-[#f5f5f7]">BarrierLens</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/10 text-[#0a84ff] border-hairline border-blue-500/30">
                AWS Agentic
              </span>
            </div>
          </button>
        </div>

        {/* Apple Segmented Navigation Switcher */}
        <nav className="hidden md:flex items-center p-1 rounded-full bg-[#1c1c1e]/70 backdrop-blur-md border-hairline shadow-inner">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium active:scale-[0.98] transition-all duration-150 ease-spring ${
                  active
                    ? 'bg-[#2c2c2e] text-[#f5f5f7] shadow-sm shadow-black/40 ring-hairline ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#0a84ff]' : 'text-current'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* More Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                secondaryTools.some(t => t.id === activeScreen)
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
            >
              <span>More</span>
              <span className="text-[10px]">▾</span>
            </button>

            {isToolsOpen && (
              <div 
                className="absolute right-0 mt-2 w-52 p-1.5 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-2xl border-hairline border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsToolsOpen(false)}
              >
                <div className="text-[10px] font-mono uppercase text-[#86868b] px-3 py-1.5 border-b border-white/5">
                  Diagnostic Suites
                </div>
                {secondaryTools.map(tool => {
                  const Icon = tool.icon;
                  const active = activeScreen === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveScreen(tool.id);
                        setIsToolsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                        active ? 'bg-blue-600 text-white' : 'text-[#f5f5f7] hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#86868b]" />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Tools, Status & Apple Auth */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={openPalette}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1c1c1e]/80 hover:bg-[#2c2c2e] text-[#86868b] hover:text-[#f5f5f7] text-[11px] font-mono border-hairline active:scale-[0.98] transition-all duration-150 ease-spring"
          >
            <span className="apple-keycap px-1.5 py-0.2 text-[10px] text-white">⌘K</span>
            <span>Search</span>
          </button>

          <a
            href="/benchmark"
            target="_blank"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c1e]/80 hover:bg-[#2c2c2e] text-[#86868b] hover:text-[#f5f5f7] text-[11px] font-medium border-hairline active:scale-[0.98] transition-all duration-150 ease-spring"
          >
            <span>Benchmark</span>
            <ExternalLink className="w-3 h-3 text-[#6e6e73]" />
          </a>

          {/* Apple Passkey / Profile Pill */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-hairline active:scale-[0.98] transition-all ${
                userSession
                  ? 'bg-blue-500/10 text-white border-blue-500/30 hover:bg-blue-500/20'
                  : 'bg-white/6 hover:bg-white/12 text-[#f5f5f7] border-white/10'
              }`}
            >
              {userSession ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#0071e3] to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">
                    {userSession.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline font-medium text-[11px] max-w-[100px] truncate">{userSession.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </>
              ) : (
                <>
                  <Key className="w-3 h-3 text-[#0a84ff]" />
                  <span className="text-[11px]">Sign In</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-hairline">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <span className="text-[11px] font-mono text-[#86868b] hidden xl:inline">
              AWS Bedrock Connected
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
