'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Fingerprint,
  Mail,
  Lock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { BrandLogo } from '@/components/brand/BrandLogo';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  organization?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserSession) => void;
}

export function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePasskey = async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('Passkeys / WebAuthn are not supported in this browser.');
      }
      const res = await (authClient as any).signIn.passkey();
      if (res?.error) {
        throw new Error(res.error.message || 'Passkey verification failed.');
      }
      const u = res?.data?.user;
      if (!u) throw new Error('No passkey credential found for this domain.');
      onAuthenticated({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Auditor',
        email: u.email,
        avatarUrl: u.image,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Passkey authentication cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setLoading(true);
    setError(null);
    try {
      const res = await (authClient as any).signIn.social({
        provider,
        callbackURL: '/dashboard',
      });
      if (res?.error) {
        throw new Error(res.error.message || `${provider} OAuth is not configured.`);
      }
    } catch (err: any) {
      setError(err?.message || `${provider} sign-in failed.`);
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res =
        mode === 'signup'
          ? await (authClient as any).signUp.email({
              email: email.trim(),
              password,
              name: name.trim() || email.split('@')[0],
            })
          : await (authClient as any).signIn.email({
              email: email.trim(),
              password,
            });

      if (res?.error) {
        throw new Error(res.error.message || 'Invalid credentials.');
      }
      const u = res?.data?.user;
      if (!u) throw new Error('Authentication did not return a user session.');
      onAuthenticated({
        id: u.id,
        name: u.name || email.split('@')[0],
        email: u.email,
        avatarUrl: u.image,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-md rounded-2xl bg-[#0b0d13] border border-white/[0.1] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <BrandLogo size="sm" showBadge={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 id="auth-modal-title" className="text-lg font-semibold text-[#f8fafc] tracking-tight">
              {mode === 'signin' ? 'Sign in to BarrierLens' : 'Create your BarrierLens workspace'}
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1">
              Manage verified domains, API keys, webhooks, and persistent audit runs.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="text-rose-300/70 hover:text-rose-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handlePasskey}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-white text-black hover:bg-slate-200 font-semibold text-xs transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-50"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Sign in with Passkey / Touch ID</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors"
            >
              <span>GitHub</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors"
            >
              <span>Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <span className="w-full border-t border-white/[0.08]" />
            <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 bg-[#0b0d13] shrink-0">
              or email
            </span>
            <span className="w-full border-t border-white/[0.08]" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-[11px] font-mono text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:border-[#0090ff] focus:outline-none"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="block text-[11px] font-mono text-slate-400 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:border-[#0090ff] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-[11px] font-mono text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:border-[#0090ff] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-white font-medium text-xs transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="hover:text-white transition-colors"
            >
              {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
              <ShieldCheck className="w-3 h-3" /> BetterAuth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
