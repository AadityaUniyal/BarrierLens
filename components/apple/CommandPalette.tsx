'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Compass, 
  Terminal, 
  Volume2, 
  LineChart, 
  CheckSquare, 
  Share2, 
  Zap,
  Play,
  Database,
  ExternalLink,
  Dna,
  GitBranch,
  Flame,
  Network,
  Cloud,
  MonitorPlay,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { ScreenId } from './Navbar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScreen: (screen: ScreenId) => void;
  onRunAudit: () => void;
}

export function CommandPalette({ isOpen, onClose, onSelectScreen, onRunAudit }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { label: 'Pulse Overview & Digital Health Rings', icon: Activity, shortcut: 'P', action: () => { onSelectScreen('pulse'); onClose(); } },
    { label: 'Run Autonomous Audit (Inspector)', icon: Play, shortcut: '↵', action: () => { onRunAudit(); onClose(); } },
    { label: 'Vault (Team, RBAC & API Keys)', icon: ShieldCheck, shortcut: 'V', action: () => { onSelectScreen('vault'); onClose(); } },
    { label: 'Remedy (Causal AST Repair & Sandbox)', icon: GitBranch, shortcut: 'R', action: () => { onSelectScreen('remedy'); onClose(); } },
    { label: 'Barrier Genome Vector Map', icon: Dna, shortcut: 'G', action: () => { onSelectScreen('genome'); onClose(); } },
    { label: 'Arena (Red-Team Adversarial Stress)', icon: Flame, shortcut: 'A', action: () => { onSelectScreen('arena'); onClose(); } },
    { label: 'Interactive Visual Twin Simulator', icon: MonitorPlay, shortcut: 'T', action: () => { onSelectScreen('visual-twin'); onClose(); } },
    { label: 'Multi-Agent Mesh (AWS Strands)', icon: Network, shortcut: 'M', action: () => { onSelectScreen('multi-agent'); onClose(); } },
    { label: 'AWS CLI & Bedrock Sandbox Bridge', icon: Cloud, shortcut: 'C', action: () => { onSelectScreen('aws-bridge'); onClose(); } },
    { label: 'Focus Map & Kendall Tau Meter', icon: Terminal, shortcut: 'F', action: () => { onSelectScreen('focus-map'); onClose(); } },
    { label: 'VoiceOver Speech Audio Transcript', icon: Volume2, shortcut: 'S', action: () => { onSelectScreen('screen-reader'); onClose(); } },
    { label: 'Trends & Flow Drift Sentinel', icon: LineChart, shortcut: 'D', action: () => { onSelectScreen('trends'); onClose(); } },
    { label: 'Public Verifiable Scorecard', icon: Share2, shortcut: 'K', action: () => { onSelectScreen('scorecard'); onClose(); } },
    { label: 'Open Synthetic Benchmark Site', icon: ExternalLink, shortcut: 'B', action: () => { window.open('/benchmark', '_blank'); onClose(); } },
  ];

  const filtered = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-2xl apple-vibrancy-thick overflow-hidden shadow-2xl border-hairline"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-hairline">
          <Search className="w-4 h-4 text-[#86868b] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or jump to screen..."
            className="w-full bg-transparent text-[15px] text-[#f5f5f7] placeholder-[#6e6e73] tracking-[-0.005em] focus:outline-none"
            autoFocus
          />
          <span className="apple-keycap px-2 py-0.5 text-[10px] text-white">ESC</span>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={idx}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] transition-all duration-150 ease-spring ${
                  isSelected ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/20' : 'text-[#f5f5f7] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#86868b]'}`} />
                  <span className="text-[13px] tracking-[0.005em]">{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className={`apple-keycap px-2 py-0.5 text-[10px] ${
                    isSelected ? 'text-white border-white/40' : 'text-[#86868b]'
                  }`}>
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
