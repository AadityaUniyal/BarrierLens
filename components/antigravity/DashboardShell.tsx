'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Compass,
  ShieldAlert,
  GitPullRequest,
  Globe,
  Settings,
  Command,
  LogOut,
  User,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { authClient } from '@/lib/auth-client';
import { AuthModal, UserSession } from './AuthModal';
import { CommandPalette } from './CommandPalette';

const NAV_TABS = [
  { href: '/dashboard', label: 'Overview', icon: Activity, key: '1', exact: true },
  { href: '/dashboard/studio', label: 'Audit Studio', icon: Compass, key: '2' },
  { href: '/dashboard/issues', label: 'Issues & Proofs', icon: ShieldAlert, key: '3' },
  { href: '/dashboard/fixes', label: 'Fixes & PRs', icon: GitPullRequest, key: '4' },
  { href: '/dashboard/sites', label: 'Sites & Journeys', icon: Globe, key: '5' },
  { href: '/dashboard/settings', label: 'Settings & Vault', icon: Settings, key: '6' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [healthStatus, setHealthStatus] = useState<'ok' | 'degraded' | 'checking'>('checking');

  useEffect(() => {
    (authClient as any)
      .getSession()
      .then((res: any) => {
        if (res?.data?.user) {
          const u = res.data.user;
          setUser({
            id: u.id,
            name: u.name || u.email?.split('@')[0] || 'Auditor',
            email: u.email,
            avatarUrl: u.image,
          });
        }
      })
      .catch(() => {});

    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealthStatus(d.status === 'ok' ? 'ok' : 'degraded'))
      .catch(() => setHealthStatus('degraded'));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const modalOpen = Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
      if (inInput || modalOpen || paletteOpen || authOpen) return;

      const tab = NAV_TABS.find((t) => t.key === e.key);
      if (tab) {
        e.preventDefault();
        router.push(tab.href);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, paletteOpen, authOpen]);

  const handleSignOut = async () => {
    try {
      await (authClient as any).signOut();
    } catch {}
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-[#07080b]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/" className="shrink-0">
              <BrandLogo size="sm" showBadge={true} />
            </Link>

            <nav aria-label="Dashboard sections" className="hidden lg:flex items-center gap-1">
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = tab.exact
                  ? pathname === tab.href
                  : pathname?.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      active
                        ? 'bg-white/[0.09] text-white border border-white/[0.12]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#0090ff]' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-slate-300">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  healthStatus === 'ok'
                    ? 'bg-emerald-400'
                    : healthStatus === 'degraded'
                    ? 'bg-amber-400'
                    : 'bg-slate-500 animate-pulse'
                }`}
              />
              <span>{healthStatus === 'ok' ? 'Operational' : healthStatus === 'degraded' ? 'Degraded' : 'Checking'}</span>
            </div>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 transition-colors"
              aria-label="Open command palette"
            >
              <Command className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline font-mono text-[11px]">K</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                <span className="hidden md:inline text-xs text-slate-300 font-medium">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-semibold transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile horizontal nav */}
        <nav
          aria-label="Mobile dashboard navigation"
          className="lg:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto"
        >
          {NAV_TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium ${
                  active
                    ? 'bg-white/[0.1] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={(u) => setUser(u)}
      />
    </div>
  );
}
