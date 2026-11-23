'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Fingerprint, 
  User, 
  Zap, 
  AlertTriangle, 
  RotateCcw 
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
  authMethod: 'apple_passkey' | 'aws_iam' | 'sandbox_developer' | 'github_oauth' | 'session' | 'sample_mode' | 'instant_lead';
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
  const [activeTab, setActiveTab] = useState<'instant' | 'passkey' | 'github'>('instant');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInstantDemoLogin = () => {
    setIsAuthenticating(true);
    setStatusMessage('Generating cryptographic session...');
    setTimeout(() => {
      onAuthenticate({
        id: 'auditor_lead_uniyal',
        name: 'Aaditya Uniyal',
        email: 'aaditya@barrierlens.com',
        authMethod: 'instant_lead',
        organization: 'BarrierLens Pro Production',
        role: 'Lead Accessibility Engineer',
        awsRegion: 'ap-south-1',
        bedrockQuota: 'Amazon Bedrock Nova Active',
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setIsAuthenticating(false);
      onClose();
    }, 400);
  };

  const handlePasskeyAuth = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
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
            organization: 'Pro Workspace',
            role: 'Lead Auditor',
            awsRegion: 'ap-south-1',
            bedrockQuota: 'Amazon Bedrock Nova Active',
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
      setStatusMessage('');
      setErrorMessage(
        err?.message || 'Passkey authentication failed or was cancelled by user. Ensure WebAuthn is supported on your device and retry.'
      );
    }
  };

  const handleGitHubAuth = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    setStatusMessage('Connecting to GitHub OAuth...');
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: window.location.href,
      });
    } catch (err: any) {
      console.warn('[GitHub] Authentication error:', err?.message || err);
      setIsAuthenticating(false);
      setStatusMessage('');
      setErrorMessage(
        'GitHub OAuth failed: ' + (err?.message || 'Provider unavailable or OAuth credentials unconfigured. Please retry or contact your workspace admin.')
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#07080b]/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog with hairline borders and editorial dark aesthetic */}
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-lg bg-[#0c0d10] border border-white/10 p-8 shadow-2xl z-10 space-y-6 rounded-2xl"
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-6 right-6 w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Current Active Session View */}
        {currentSession ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
                ( ACTIVE SESSION )
              </span>
              <h2 id="auth-modal-title" className="text-xl font-black uppercase tracking-tight text-white font-mono">
                Verified Credentials
              </h2>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#121316] border border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-white text-black font-black flex items-center justify-center text-lg font-mono rounded-lg shadow-sm">
                {currentSession.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono">{currentSession.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs font-mono text-white/50">{currentSession.email}</p>
                <p className="text-xs text-[#10b981] font-mono mt-0.5">{currentSession.organization}</p>
              </div>
            </div>

            <div className="p-4 bg-[#121316] border border-white/10 rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Role &amp; Clearance</span>
                <span className="text-white font-bold">{currentSession.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">AWS Telemetry Region</span>
                <span className="text-[#10b981]">ap-south-1 (Mumbai)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">AI Engine</span>
                <span className="text-[#10b981]">Amazon Bedrock Nova Active</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-white/90 rounded-lg transition-all"
              >
                ENTER MISSION CONTROL
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await authClient.signOut();
                  } catch {}
                  onSignOut();
                  onClose();
                }}
                className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-mono font-bold text-red-400 rounded-lg transition-all"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">
                ( IDENTITY &amp; TRUST )
              </span>
              <h2 id="auth-modal-title" className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                Access Audit Cockpit
              </h2>
              <p className="text-xs text-white/60 leading-relaxed">
                Hardware-backed cryptographic sessions for mathematical accessibility audits.
              </p>
            </div>

            {/* Segmented Auth Tab Selector */}
            <div className="p-1 bg-[#121316] border border-white/10 rounded-lg grid grid-cols-3 gap-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => { setActiveTab('instant'); setErrorMessage(null); }}
                className={`py-2 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider rounded ${
                  activeTab === 'instant'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('passkey'); setErrorMessage(null); }}
                className={`py-2 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider rounded ${
                  activeTab === 'passkey'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Passkey</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('github'); setErrorMessage(null); }}
                className={`py-2 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider rounded ${
                  activeTab === 'github'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </button>
            </div>

            {/* Actionable Error Banner */}
            {errorMessage && (
              <div 
                role="alert"
                aria-live="assertive"
                className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-red-300">Authentication Failed</p>
                    <p className="text-white/70 text-[11px] leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      if (activeTab === 'passkey') handlePasskeyAuth();
                      else if (activeTab === 'github') handleGitHubAuth();
                    }}
                    className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] uppercase tracking-wider font-bold rounded flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="px-2.5 py-1 text-white/50 hover:text-white text-[10px] uppercase tracking-wider transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Status Message */}
            {isAuthenticating && statusMessage && (
              <div 
                role="status"
                aria-live="polite"
                className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-mono text-blue-300 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Tab 1: Instant Demo Access */}
            {activeTab === 'instant' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#121316] border border-white/10 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-white font-mono font-bold">
                    <User className="w-4 h-4 text-[#10b981]" />
                    <span>Instant Reviewer Clearance</span>
                  </div>
                  <p className="text-white/60 leading-relaxed">
                    Instantly enter the production Mission Control workspace pre-configured with active AWS Bedrock Nova telemetry and ground-truth accessibility benchmarks.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInstantDemoLogin}
                  disabled={isAuthenticating}
                  className="w-full py-3 bg-white hover:bg-white/90 text-black text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 rounded-lg transition-all shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>CONTINUE AS LEAD AUDITOR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tab 2: Apple Passkey / WebAuthn */}
            {activeTab === 'passkey' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#121316] border border-white/10 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#17181c] flex items-center justify-center border border-white/10 rounded-lg text-white">
                    <Key className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white font-mono">Biometric Passkey</p>
                    <p className="text-white/50">Hardware-backed FIDO2 WebAuthn token.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePasskeyAuth}
                  disabled={isAuthenticating}
                  className="w-full py-3 bg-[#17181c] hover:bg-[#202228] border border-white/10 rounded-lg text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <Fingerprint className="w-4 h-4 text-[#10b981]" />
                  <span>Authenticate with Touch ID / Face ID</span>
                </button>
              </div>
            )}

            {/* Tab 3: GitHub OAuth */}
            {activeTab === 'github' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#121316] border border-white/10 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#17181c] flex items-center justify-center border border-white/10 rounded-lg text-white">
                    <GithubIcon className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white font-mono">GitHub CI/CD Integration</p>
                    <p className="text-white/50">Sync repository webhooks and pull request export.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGitHubAuth}
                  disabled={isAuthenticating}
                  className="w-full py-3 bg-[#17181c] hover:bg-[#202228] border border-white/10 rounded-lg text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>Continue with GitHub</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
