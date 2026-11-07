'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Terminal, 
  Volume2, 
  LineChart, 
  Share2, 
  Play, 
  ExternalLink,
  Dna,
  GitBranch,
  Flame,
  Network,
  Cloud,
  MonitorPlay,
  Activity,
  ShieldCheck,
  CheckCircle2,
  CornerDownLeft,
  LayoutDashboard,
  Award
} from 'lucide-react';
import { ScreenId } from './Navbar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScreen: (screen: ScreenId) => void;
  onRunAudit: () => void;
}

interface CommandAction {
  id: string;
  category: 'Hubs' | 'Diagnostics' | 'Lab Tools' | 'Actions';
  label: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose, onSelectScreen, onRunAudit }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions: CommandAction[] = useMemo(() => [
    // 4 Primary Hubs
    { id: 'hub-studio', category: 'Hubs', label: 'Audit Studio', description: 'Real-time multi-agent execution & action trace', icon: Terminal, shortcut: '1', action: () => { onSelectScreen('studio'); onClose(); } },
    { id: 'hub-issues', category: 'Hubs', label: 'Evidence & Proofs', description: 'Deterministic Tarjan SCC cycles & WCAG violations', icon: CheckCircle2, shortcut: '2', action: () => { onSelectScreen('issues'); onClose(); } },
    { id: 'hub-remedy', category: 'Hubs', label: 'Verified Fixes', description: 'Causal AST repair engine & GitHub PR generator', icon: GitBranch, shortcut: '3', action: () => { onSelectScreen('remedy'); onClose(); } },
    { id: 'hub-reports', category: 'Hubs', label: 'Executive Scorecard & Reports', description: '5-axis radar chart, PDF export & governance', icon: Share2, shortcut: '4', action: () => { onSelectScreen('scorecard'); onClose(); } },

    // Primary Actions
    { id: 'act-run', category: 'Actions', label: 'Launch Autonomous Flow Audit', description: 'Dispatch Tarjan graph & screen reader probes', icon: Play, shortcut: '↵', action: () => { onRunAudit(); onClose(); } },
    { id: 'act-cert', category: 'Actions', label: 'Export Cryptographic Causal Certificate', description: 'Download verified SHA-256 certificate and PR markdown', icon: Award, shortcut: 'C', action: () => { onSelectScreen('audits'); onClose(); } },

    // Diagnostics & Lab Tools
    { id: 'lab-focus', category: 'Diagnostics', label: 'Focus Map & Kendall\'s Tau Meter', description: '2D keyboard geometry and concordance score', icon: Terminal, shortcut: 'F', action: () => { onSelectScreen('focus-map'); onClose(); } },
    { id: 'lab-audio', category: 'Diagnostics', label: 'VoiceOver Auditory Feed', description: 'Simulated screen reader speech stream with silent gap alerts', icon: Volume2, shortcut: 'S', action: () => { onSelectScreen('screen-reader'); onClose(); } },
    { id: 'lab-twin', category: 'Diagnostics', label: 'Interactive Visual Twin Simulator', description: 'DOM shadow replay with live event simulation', icon: MonitorPlay, shortcut: 'T', action: () => { onSelectScreen('visual-twin'); onClose(); } },
    { id: 'lab-pulse', category: 'Diagnostics', label: 'Pulse Health Rings', description: 'Digital health monitoring across monitored domains', icon: Activity, shortcut: 'P', action: () => { onSelectScreen('pulse'); onClose(); } },
    { id: 'lab-genome', category: 'Lab Tools', label: 'Barrier Genome Vector Map', description: 'Clustered embeddings of historical failure modes', icon: Dna, shortcut: 'G', action: () => { onSelectScreen('genome'); onClose(); } },
    { id: 'lab-arena', category: 'Lab Tools', label: 'Arena (Red-Team Adversarial Stress)', description: 'Simulate high jitter, DOM mutations and screen reader crashes', icon: Flame, shortcut: 'A', action: () => { onSelectScreen('arena'); onClose(); } },
    { id: 'lab-mesh', category: 'Lab Tools', label: 'Multi-Agent Cognitive Mesh', description: 'Autonomous agent swarm coordination graph', icon: Network, shortcut: 'M', action: () => { onSelectScreen('multi-agent'); onClose(); } },
    { id: 'lab-vault', category: 'Lab Tools', label: 'Vault (Team, RBAC & API Keys)', description: 'Enterprise identity, credentials & audit access', icon: ShieldCheck, shortcut: 'V', action: () => { onSelectScreen('vault'); onClose(); } },
    { id: 'lab-benchmark', category: 'Actions', label: 'Open Synthetic Benchmark Fixtures', description: 'Inspect live WCAG trap and disordered testbeds', icon: ExternalLink, shortcut: 'B', action: () => { window.open('/benchmark', '_blank'); onClose(); } },
  ], [onSelectScreen, onRunAudit, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(a => 
      a.label.toLowerCase().includes(q) || 
      (a.description && a.description.toLowerCase().includes(q)) ||
      a.category.toLowerCase().includes(q)
    );
  }, [actions, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global Keyboard shortcuts & Modal navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-xl bg-[#141517] border border-[#23262a] overflow-hidden shadow-2xl shadow-black/80 space-y-0 text-left"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Menu"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#23262a] bg-[#141517]">
          <Search className="w-4 h-4 text-[#9ba1a6] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to tool..."
            className="w-full bg-transparent text-sm text-[#f4f5f6] placeholder-[#5a626a] tracking-tight focus:outline-none"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 rounded bg-[#1e2023] border border-[#34383f] font-mono text-[10px] text-[#9ba1a6] shadow-sm shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9ba1a6]">
              No matching commands or tools found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors duration-100 ${
                    isSelected 
                      ? 'bg-[#1f2226] text-[#f4f5f6] border border-[#34383f]' 
                      : 'text-[#9ba1a6] hover:bg-[#181a1d] hover:text-[#f4f5f6] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#282c32] text-[#f4f5f6]' : 'bg-[#1a1b1e] text-[#9ba1a6]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate text-left">
                      <div className="text-[13px] font-medium text-[#f4f5f6] flex items-center gap-2">
                        <span>{item.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#181a1d] border border-[#282c32] text-[#6b7280] font-normal uppercase">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-[#9ba1a6] truncate mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-[#181a1d] border border-[#282c32] font-mono text-[10px] text-[#9ba1a6]">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-[#23262a] bg-[#0f1011] flex items-center justify-between text-[11px] text-[#6b7280]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-[#181a1d] border border-[#23262a] font-mono text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.2 rounded bg-[#181a1d] border border-[#23262a] font-mono text-[10px]">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-[#181a1d] border border-[#23262a] font-mono text-[10px]">↵</kbd>
              <span className="ml-1">Select</span>
            </span>
          </div>
          <span>Linear Studio v2.4</span>
        </div>
      </div>
    </div>
  );
}
