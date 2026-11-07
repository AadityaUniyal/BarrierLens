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

  if (!isOpen) return null;

  const handlePasskeyAuth = async () => {
    setIsAuthenticating(true);
    setStatusMessage('Prompting FIDO2 WebAuthn / Passkey...');

    try {
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
        }, 500);
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
        className="absolute inset-0 bg-[#0c0d0e]/80"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#141517] rounded-xl border border-[#23262a] p-6 shadow-2xl z-10 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-md bg-[#181a1d] hover:bg-[#23262a] border border-[#23262a] flex items-center justify-center text-[#9ba1a6] hover:text-[#f4f5f6] transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Current Active Session View */}
        {currentSession ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#5e6ad2] flex items-center justify-center text-white font-semibold text-base shadow-sm">
                {currentSession.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#f4f5f6]">{currentSession.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <p className="text-xs font-mono text-[#9ba1a6]">{currentSession.email}</p>
                <p className="text-xs text-[#5e6ad2] font-medium mt-0.5">{currentSession.organization}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#181a1d] border border-[#23262a] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#9ba1a6]">Role &amp; Permissions</span>
                <span className="text-[#f4f5f6] font-medium">{currentSession.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9ba1a6]">Database</span>
                <span className="text-[#30d158] font-mono">Neon PostgreSQL Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9ba1a6]">Auth Engine</span>
                <span className="text-[#30d158] font-mono capitalize">Better Auth ({currentSession.authMethod.replace('_', ' ')})</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-[#181a1d] hover:bg-[#23262a] border border-[#23262a] text-xs font-medium text-[#f4f5f6] transition-all"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    await authClient.signOut();
                  } catch {}
                  onSignOut();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-400 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#181a1d] border border-[#23262a] text-[#5e6ad2] mb-1">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#f4f5f6]">Authenticate into BarrierLens</h2>
              <p className="text-xs text-[#9ba1a6]">
                Native Better Auth with Neon PostgreSQL and WebAuthn FIDO2 biometrics.
              </p>
            </div>

            {/* Segmented Auth Tab Selector */}
            <div className="p-1 rounded-lg bg-[#0c0d0e] border border-[#23262a] grid grid-cols-3 gap-1 text-xs">
              <button
                onClick={() => setActiveTab('passkey')}
                className={`py-1.5 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'passkey'
                    ? 'bg-[#23262a] text-[#f4f5f6] shadow-sm'
                    : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5 text-[#5e6ad2]" />
                Passkey
              </button>
              <button
                onClick={() => setActiveTab('github')}
                className={`py-1.5 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'github'
                    ? 'bg-[#23262a] text-[#f4f5f6] shadow-sm'
                    : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                }`}
              >
                <GithubIcon className="w-3.5 h-3.5" />
                GitHub
              </button>
              <button
                onClick={() => setActiveTab('sample')}
                className={`py-1.5 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'sample'
                    ? 'bg-[#23262a] text-[#f4f5f6] shadow-sm'
                    : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sample
              </button>
            </div>

            {/* Tab 1: Apple Passkey */}
            {activeTab === 'passkey' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#181a1d] border border-[#23262a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#0c0d0e] flex items-center justify-center border border-[#23262a] text-[#5e6ad2]">
                    <Key className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#f4f5f6]">Biometric Passkey</p>
                    <p className="text-[#9ba1a6]">Zero passwords. Stored in Apple Secure Enclave &amp; Neon DB.</p>
                  </div>
                </div>

                <button
                  onClick={handlePasskeyAuth}
                  disabled={isAuthenticating}
                  className="w-full py-2.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-75"
                >
                  {isAuthenticating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{statusMessage || 'Verifying Token...'}</span>
                    </div>
                  ) : authSuccess ? (
                    <div className="flex items-center gap-1.5 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{statusMessage}</span>
                    </div>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>Continue with Touch ID / Face ID</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 2: GitHub OAuth */}
            {activeTab === 'github' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#181a1d] border border-[#23262a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#0c0d0e] flex items-center justify-center border border-[#23262a] text-[#f4f5f6]">
                    <GithubIcon className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#f4f5f6]">Developer Sign In</p>
                    <p className="text-[#9ba1a6]">Authenticate securely via GitHub OAuth.</p>
                  </div>
                </div>

                <button
                  onClick={handleGitHubAuth}
                  disabled={isAuthenticating}
                  className="w-full py-2.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[#23262a] shadow-sm transition-all disabled:opacity-75"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>Continue with GitHub</span>
                </button>
              </div>
            )}

            {/* Tab 3: Sample Mode */}
            {activeTab === 'sample' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#181a1d] border border-[#23262a] text-xs space-y-1">
                  <p className="font-semibold text-[#f4f5f6]">Sample Evaluation Workspace</p>
                  <p className="text-[#9ba1a6]">
                    Explore the interface with pre-loaded sample benchmark runs in read-only mode.
                  </p>
                </div>

                <button
                  onClick={handleExploreSample}
                  className="w-full py-2.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[#23262a] transition-all"
                >
                  <span>Explore Sample Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9ba1a6]" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
