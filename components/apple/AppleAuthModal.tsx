'use client';

import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Cloud, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Fingerprint, 
  Lock,
  Building2,
  Cpu,
  GitBranch
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authMethod: 'apple_passkey' | 'aws_iam' | 'sandbox_developer' | 'github_oauth' | 'session' | 'sample_mode';
  organization: string;
  role: string;
  awsRegion?: string;
  bedrockQuota?: string;
  verifiedAt?: string;
}

interface AppleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession | null;
  onAuthenticate: (session: UserSession) => void;
  onSignOut: () => void;
}

export function AppleAuthModal({
  isOpen,
  onClose,
  currentSession,
  onAuthenticate,
  onSignOut
}: AppleAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'passkey' | 'github' | 'sample'>('passkey');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [enterpriseOrg, setEnterpriseOrg] = useState('Acme Global Retail');

  if (!isOpen) return null;

  const handlePasskeyAuth = async () => {
    setIsAuthenticating(true);
    setStatusMessage('Prompting Apple Touch ID / Face ID WebAuthn...');

    try {
      // Real Better Auth WebAuthn Passkey
      const res = await (authClient as any).signIn.passkey({
        autoFill: false,
      });

      if (res?.data?.user) {
        setAuthSuccess(true);
        setStatusMessage('Biometric signature verified.');
        setTimeout(() => {
          onAuthenticate({
            id: res.data.user.id,
            name: res.data.user.name || res.data.user.email?.split('@')[0] || 'Authenticated User',
            email: res.data.user.email || 'user@barrierlens.com',
            authMethod: 'apple_passkey',
            organization: 'Personal Workspace',
            role: 'Auditor',
            awsRegion: 'us-east-1',
            bedrockQuota: 'Standard Tier',
            verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setIsAuthenticating(false);
          setAuthSuccess(false);
          onClose();
        }, 600);
        return;
      } else {
        throw new Error(res?.error?.message || 'Passkey was not recognized');
      }
    } catch (err: any) {
      console.warn('[Passkey] Authentication error:', err?.message || err);
      setIsAuthenticating(false);
      setStatusMessage(err?.message || 'Biometric authentication was cancelled or unavailable.');
    }
  };

  const handleGitHubAuth = async () => {
    setIsAuthenticating(true);
    setStatusMessage('Redirecting to GitHub OAuth...');
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: window.location.href,
      });
    } catch (err: any) {
      setIsAuthenticating(false);
      setStatusMessage('GitHub OAuth failed: ' + (err?.message || 'Provider unavailable'));
    }
  };

  const handleExploreSample = () => {
    onAuthenticate({
      id: 'demo_viewer',
      name: 'Sample Workspace',
      email: 'sample@barrierlens.com',
      authMethod: 'sample_mode',
      organization: 'Sample Project (Read-Only)',
      role: 'Viewer',
      awsRegion: 'us-east-1',
      bedrockQuota: 'Demo Evaluation Scope',
      verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog (Apple Translucent Sheet) */}
      <div className="relative w-full max-w-lg apple-card-raised rounded-3xl border border-white/14 p-7 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Glow Accent */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#0071e3]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 flex items-center justify-center text-[#86868b] hover:text-[#f5f5f7] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Current Active Session View */}
        {currentSession ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-purple-600 flex items-center justify-center text-white font-semibold text-xl shadow-lg ring-2 ring-white/20">
                {currentSession.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#f5f5f7]">{currentSession.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[#86868b]">{currentSession.email}</p>
                <p className="text-xs text-[#0a84ff] font-medium mt-0.5">{currentSession.organization}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">Role & Governance</span>
                <span className="text-[#f5f5f7] font-medium">{currentSession.role}</span>
              </div>
              <div className="hairline-divider" />
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">Database Connection</span>
                <span className="text-emerald-400 font-mono">Neon Postgres (ep-ancient-dew)</span>
              </div>
              <div className="hairline-divider" />
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">Authentication Engine</span>
                <span className="text-emerald-400 font-mono capitalize">Better Auth ({currentSession.authMethod.replace('_', ' ')})</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/16 border border-white/10 text-xs font-semibold text-white transition-all"
              >
                Return to Workspace
              </button>
              <button
                onClick={async () => {
                  try {
                    await authClient.signOut();
                  } catch {}
                  onSignOut();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-400 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-6">
            <div className="text-center space-y-1.5 pt-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/6 border border-white/10 mb-2">
                <Fingerprint className="w-6 h-6 text-[#0071e3]" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#f5f5f7]">Authenticate into BarrierLens</h2>
              <p className="text-xs text-[#86868b] max-w-sm mx-auto">
                Protected by Better Auth with native Neon PostgreSQL storage and Apple Passkey biometrics.
              </p>
            </div>

            {/* Segmented Auth Tab Selector */}
            <div className="p-1 rounded-2xl bg-[#1c1c1e] border border-white/8 grid grid-cols-4 gap-1">
              <button
                onClick={() => setActiveTab('passkey')}
                className={`py-1.5 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'passkey'
                    ? 'bg-[#2c2c2e] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Fingerprint className="w-3 h-3 text-[#0a84ff]" />
                Passkey
              </button>
              <button
                onClick={() => setActiveTab('github')}
                className={`py-1.5 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'github'
                    ? 'bg-[#2c2c2e] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <GithubIcon className="w-3 h-3 text-white" />
                GitHub
              </button>
              <button
                onClick={() => setActiveTab('sample')}
                className={`py-1.5 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'sample'
                    ? 'bg-[#2c2c2e] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Sample Mode
              </button>
            </div>

            {/* Tab 1: Apple Passkey */}
            {activeTab === 'passkey' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center border border-white/8 text-[#0a84ff]">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#f5f5f7]">Biometric FIDO2 Passkey</p>
                    <p className="text-[#86868b]">Zero passwords. Stored in Apple Secure Enclave and Neon PostgreSQL.</p>
                  </div>
                </div>

                <button
                  onClick={handlePasskeyAuth}
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-75"
                >
                  {isAuthenticating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>{statusMessage || 'Verifying Biometric Token...'}</span>
                    </div>
                  ) : authSuccess ? (
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{statusMessage}</span>
                    </div>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>Continue with Touch ID / Face ID Passkey</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 2: GitHub OAuth */}
            {activeTab === 'github' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center border border-white/8 text-white">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#f5f5f7]">Developer Sign In</p>
                    <p className="text-[#86868b]">Authenticate securely via GitHub OAuth.</p>
                  </div>
                </div>

                <button
                  onClick={handleGitHubAuth}
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-2xl bg-[#24292e] hover:bg-[#2f363d] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 shadow-lg transition-all disabled:opacity-75"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>Continue with GitHub</span>
                </button>
              </div>
            )}

            {/* Tab 3: Sample Mode */}
            {activeTab === 'sample' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 text-xs space-y-1.5">
                  <p className="font-semibold text-[#f5f5f7]">Sample Evaluation Workspace</p>
                  <p className="text-[#86868b]">
                    Explore the interface with pre-loaded sample benchmark runs in read-only mode. No real account created.
                  </p>
                </div>

                <button
                  onClick={handleExploreSample}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/16 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/12 transition-all"
                >
                  <span>Explore Sample Workspace</span>
                  <ArrowRight className="w-4 h-4 text-[#86868b]" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
