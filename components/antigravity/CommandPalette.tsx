'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Compass,
  ShieldAlert,
  GitPullRequest,
  Globe,
  Settings,
  Search,
  Home,
  X,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMANDS = [
  { id: 'overview', label: 'Overview & Fleet Telemetry', href: '/dashboard', shortcut: '1', icon: Activity },
  { id: 'studio', label: 'Audit Studio (Live Playwright + Swarm)', href: '/dashboard/studio', shortcut: '2', icon: Compass },
  { id: 'issues', label: 'Issues & Mathematical Proofs', href: '/dashboard/issues', shortcut: '3', icon: ShieldAlert },
  { id: 'fixes', label: 'Fixes, Replay Verification & PRs', href: '/dashboard/fixes', shortcut: '4', icon: GitPullRequest },
  { id: 'sites', label: 'Sites, Crawler & CUJ Journeys', href: '/dashboard/sites', shortcut: '5', icon: Globe },
  { id: 'settings', label: 'Settings, API Keys, Webhooks & Genome', href: '/dashboard/settings', shortcut: '6', icon: Settings },
  { id: 'home', label: 'Landing Page & Proof Playground', href: '/', shortcut: '0', icon: Home },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );
  const safeSelectedIdx = filtered.length ? Math.min(selectedIdx, filtered.length - 1) : 0;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' || (e.key === 'j' && e.ctrlKey)) {
        e.preventDefault();
        setSelectedIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp' || (e.key === 'k' && e.ctrlKey)) {
        e.preventDefault();
        setSelectedIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter' && filtered[safeSelectedIdx]) {
        e.preventDefault();
        router.push(filtered[safeSelectedIdx].href);
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, filtered, safeSelectedIdx, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] p-4 bg-black/70 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="w-full max-w-lg rounded-2xl bg-[#0b0d13] border border-white/[0.1] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            placeholder="Jump to workspace view or tool..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No matching commands.</p>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const active = idx === safeSelectedIdx;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onClick={() => {
                    router.push(cmd.href);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${
                    active
                      ? 'bg-[#0090ff]/15 text-white border border-[#0090ff]/30'
                      : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#0090ff]' : 'text-slate-400'}`} />
                    <span>{cmd.label}</span>
                  </span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[10px] text-slate-400">
                    {cmd.shortcut}
                  </kbd>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
