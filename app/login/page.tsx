'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  Fingerprint, 
  User, 
  Lock, 
  Sparkles, 
  AlertTriangle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { authClient } from '@/lib/auth-client';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'instant' | 'email' | 'passkey'>('instant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInstantDemoLogin = () => {
    setIsAuthenticating(true);
    setStatusMessage('Provisioning verified auditor session...');
    setTimeout(() => {
      try {
        sessionStorage.setItem('barrierlens_user', JSON.stringify({
          id: `auditor_${Date.now().toString(36)}`,
          name: 'Lead Auditor',
          email: 'auditor@barrierlens.ai',
          role: 'Lead Accessibility Engineer',
          organization: 'Monorepo Fleet Workspace'
        }));
      } catch {}
      router.push('/dashboard');
    }, 400);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setIsAuthenticating(true);
    setErrorMessage(null);
    setStatusMessage(isSignUp ? 'Creating your account...' : 'Signing in...');

    try {
      if (isSignUp) {
        const res = await (authClient as any).signUp.email({
          email,
          password,
          name: name || email.split('@')[0],
        });
        if (res?.data?.user) {
          router.push('/dashboard');
          return;
        }
      } else {
        const res = await (authClient as any).signIn.email({
          email,
          password,
        });
        if (res?.data?.user) {
          router.push('/dashboard');
          return;
        }
      }

      throw new Error('Authentication failed. Please verify your credentials.');
    } catch (err: any) {
      setIsAuthenticating(false);
      setErrorMessage(err?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handlePasskeyAuth = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    setStatusMessage('Requesting biometric hardware signature (Touch ID / Face ID)...');

    try {
      const res = await (authClient as any).signIn.passkey({ autoFill: false });
      if (res?.data?.user) {
        router.push('/dashboard');
        return;
      }
      throw new Error(res?.error?.message || 'Passkey authentication was cancelled or could not be verified.');
    } catch (err: any) {
      setIsAuthenticating(false);
      setStatusMessage('');
      setErrorMessage(err?.message || 'Passkey authentication was cancelled.');
    }
  };

  const handleGitHubAuth = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    setStatusMessage('Redirecting to GitHub OAuth...');
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: window.location.origin + '/?tab=overview',
      });
    } catch (err: any) {
      setIsAuthenticating(false);
      setErrorMessage('GitHub OAuth error: ' + (err?.message || 'Provider unavailable.'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f8fafc] font-sans flex flex-col justify-between antialiased selection:bg-blue-600/30 selection:text-white relative overflow-hidden">
      {/* Ambient Radial Lighting */}
      <div className="ambient-mesh pointer-events-none" />
      <div className="ambient-cinematic pointer-events-none" />

      {/* Top Bar with Brand Link */}
      <header className="max-w-6xl w-full mx-auto p-6 flex items-center justify-between relative z-10">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <BrandLogo size="md" showBadge={false} />
        </Link>
        <Link 
          href="/" 
          className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </Link>
      </header>

      {/* High-Craft Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-[#0f1422] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center border border-blue-500/30">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Sign In to BarrierLens
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Autonomous Accessibility Verification &amp; Causal AST Remediation
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div role="alert" className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Notice</p>
                <p className="text-[11px] text-white/80">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Status Message */}
          {isAuthenticating && (
            <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-xs text-cyan-300 flex items-center justify-center gap-2 font-mono">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#091124] rounded-xl border border-blue-500/25 text-xs font-medium">
            <button
              type="button"
              onClick={() => setAuthMode('instant')}
              className={`py-2 rounded-lg transition-all ${authMode === 'instant' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              1-Click Demo
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('email')}
              className={`py-2 rounded-lg transition-all ${authMode === 'email' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Email &amp; Pass
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('passkey')}
              className={`py-2 rounded-lg transition-all ${authMode === 'passkey' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Passkey / Git
            </button>
          </div>

          {/* Tab 1: 1-Click Instant Auditor */}
          {authMode === 'instant' && (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-2xl bg-[#142247] border border-blue-500/25 space-y-2 text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant Auditor Access
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Immediately unlock all accessibility studios, Tarjan cycle diagnostics, and verified AST pull requests as Lead Auditor.
                </p>
              </div>

              <button
                type="button"
                onClick={handleInstantDemoLogin}
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold tracking-wide uppercase transition-all shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Enter as Lead Auditor (1-Click)</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-200 ml-1" />
              </button>
            </div>
          )}

          {/* Tab 2: Email & Password */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-3.5 pt-1">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091124] border border-blue-500/25 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="auditor@company.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#091124] border border-blue-500/25 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#091124] border border-blue-500/25 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                {isSignUp ? 'Create Account & Sign In' : 'Sign In with Email'}
              </button>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-cyan-300 hover:underline"
                >
                  {isSignUp ? 'Already registered? Sign in' : "Don't have an account? Create one"}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Passkey & GitHub */}
          {authMode === 'passkey' && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handlePasskeyAuth}
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:scale-[1.01]"
              >
                <Fingerprint className="w-4 h-4 text-slate-800" />
                <span>Sign In with Touch ID / Passkey</span>
              </button>

              <button
                type="button"
                onClick={handleGitHubAuth}
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-blue-500/25 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
              >
                <GithubIcon className="w-4 h-4 text-white" />
                <span>Continue with GitHub</span>
              </button>
            </div>
          )}

          <div className="pt-2 text-center border-t border-blue-500/15">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>FIDO2 WebAuthn &bull; Better Auth Multi-Tenant RBAC</span>
            </p>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="p-6 text-center text-xs text-slate-400 font-mono relative z-10">
        &copy; 2026 BarrierLens Inc. &bull; Task-Conditioned Autonomous Accessibility Fleet
      </footer>
    </div>
  );
}
