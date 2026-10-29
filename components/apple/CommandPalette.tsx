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
  ExternalLink
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
    { label: 'Run Autonomous Audit', icon: Play, shortcut: '↵', action: () => { onRunAudit(); onClose(); } },
    { label: 'Open Studio & Trace Theater', icon: Compass, shortcut: '1', action: () => { onSelectScreen('studio'); onClose(); } },
    { label: 'Focus Map & Kendall Tau Meter', icon: Terminal, shortcut: '2', action: () => { onSelectScreen('focus-map'); onClose(); } },
    { label: 'Screen Reader Audio Transcript', icon: Volume2, shortcut: '3', action: () => { onSelectScreen('screen-reader'); onClose(); } },
    { label: 'Trends & Flow Drift Sentinel', icon: LineChart, shortcut: '4', action: () => { onSelectScreen('trends'); onClose(); } },
    { label: 'Review Queue & Active Learning', icon: CheckSquare, shortcut: '5', action: () => { onSelectScreen('triage'); onClose(); } },
    { label: 'Public Verifiable Scorecard', icon: Share2, shortcut: '6', action: () => { onSelectScreen('scorecard'); onClose(); } },
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-2xl apple-card-raised overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-[#86868b] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or jump to screen..."
            className="w-full bg-transparent text-sm text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#86868b]">ESC</kbd>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isSelected ? 'bg-[#0071e3] text-white' : 'text-[#f5f5f7] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#86868b]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-[#86868b]'
                  }`}>
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
