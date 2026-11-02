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
  Cpu
} from 'lucide-react';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authMethod: 'apple_passkey' | 'aws_iam' | 'sandbox_developer';
  organization: string;
  role: 'Security & Accessibility Lead' | 'Staff Frontend Engineer' | 'Compliance Officer';
  awsRegion: string;
  bedrockQuota: string;
  verifiedAt: string;
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
  const [activeTab, setActiveTab] = useState<'passkey' | 'aws_iam' | 'sandbox'>('passkey');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [enterpriseOrg, setEnterpriseOrg] = useState('Acme Global Retail');

  if (!isOpen) return null;

  const handleSimulatePasskeyAuth = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccess(true);
      setTimeout(() => {
        onAuthenticate({
          id: 'usr_apple_9841',
          name: 'Sarah Chen',
          email: 'sarah.chen@apple-id.corp',
          authMethod: 'apple_passkey',
          organization: 'Cupertino Core Design Systems',
          role: 'Staff Frontend Engineer',
          awsRegion: 'us-east-1 (N. Virginia)',
          bedrockQuota: '1,000,000 tokens/hr (Enterprise Tier)',
          verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setAuthSuccess(false);
        onClose();
      }, 700);
    }, 1200);
  };

  const handleSimulateAwsIamAuth = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccess(true);
      setTimeout(() => {
        onAuthenticate({
          id: 'usr_aws_5521',
          name: 'Alex Rivera, Lead Architect',
          email: 'alex.rivera@enterprise.aws',
          authMethod: 'aws_iam',
          organization: enterpriseOrg || 'Enterprise Cloud Systems',
          role: 'Security & Accessibility Lead',
          awsRegion: 'us-west-2 (Oregon - Bedrock Multi-Agent Mesh)',
          bedrockQuota: 'Unlimited (IAM Assumed Role: arn:aws:iam::8831:role/BarrierLensAuditor)',
          verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setAuthSuccess(false);
        onClose();
      }, 700);
    }, 1400);
  };

  const handleSimulateSandbox = () => {
    onAuthenticate({
      id: 'usr_guest_demo',
      name: 'Guest Developer',
      email: 'sandbox@barrierlens.dev',
      authMethod: 'sandbox_developer',
      organization: 'Local Playwright Sandbox',
      role: 'Staff Frontend Engineer',
      awsRegion: 'us-east-1 (Shared Bedrock Evaluation Pool)',
      bedrockQuota: '50,000 tokens/session',
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
                <span className="text-[#86868b]">AWS Bedrock Region</span>
                <span className="text-[#f5f5f7] font-mono">{currentSession.awsRegion}</span>
              </div>
              <div className="hairline-divider" />
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">Authentication Token</span>
                <span className="text-emerald-400 font-mono capitalize">{currentSession.authMethod.replace('_', ' ')}</span>
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
                onClick={() => {
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
                Connect with Apple Passkey or enterprise AWS IAM to unlock multi-agent AWS Bedrock orchestration and cryptographic audit certificates.
              </p>
            </div>

            {/* Apple Segmented Auth Tab Selector */}
            <div className="p-1 rounded-2xl bg-[#1c1c1e] border border-white/8 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('passkey')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'passkey'
                    ? 'bg-[#2c2c2e] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5 text-[#0a84ff]" />
                Apple Passkey
              </button>
              <button
                onClick={() => setActiveTab('aws_iam')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'aws_iam'
                    ? 'bg-[#2c2c2e] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-orange-400" />
                AWS IAM SSO
              </button>
              <button
                onClick={() => setActiveTab('sandbox')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'sandbox'
                    ? 'bg-[#2c2c2e] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Sandbox
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
                    <p className="text-[#86868b]">Zero passwords. Stored in Apple Secure Enclave with end-to-end audit signing.</p>
                  </div>
                </div>

                <button
                  onClick={handleSimulatePasskeyAuth}
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-75"
                >
                  {isAuthenticating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Verifying Biometric Token...</span>
                    </div>
                  ) : authSuccess ? (
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Authenticated via Secure Enclave</span>
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

            {/* Tab 2: AWS IAM Identity Center */}
            {activeTab === 'aws_iam' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Enterprise Organization</label>
                  <input
                    type="text"
                    value={enterpriseOrg}
                    onChange={(e) => setEnterpriseOrg(e.target.value)}
                    placeholder="e.g. Acme Global Logistics"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-500/[0.05] border border-orange-500/20 text-xs text-orange-200/90 space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-orange-400" />
                    AWS Bedrock Multi-Agent Mesh Provisioning
                  </p>
                  <p className="text-[11px] text-orange-300/70">
                    Authenticates via AWS IAM Identity Center. Grants access to Claude 3.5 Sonnet, Titan Embeddings, and S3 Artifact Lake.
                  </p>
                </div>

                <button
                  onClick={handleSimulateAwsIamAuth}
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-75"
                >
                  {isAuthenticating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Connecting to AWS Bedrock Mesh...</span>
                    </div>
                  ) : authSuccess ? (
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>AWS IAM Role Assumed</span>
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Assume AWS Enterprise Auditor Role</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 3: Sandbox */}
            {activeTab === 'sandbox' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 text-xs space-y-1.5">
                  <p className="font-semibold text-[#f5f5f7]">Instant Developer Sandbox</p>
                  <p className="text-[#86868b]">
                    Explore BarrierLens immediately without signing in. Includes 50k tokens, local Playwright execution, and demo benchmark targets.
                  </p>
                </div>

                <button
                  onClick={handleSimulateSandbox}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/16 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/12 transition-all"
                >
                  <span>Launch Instant Guest Sandbox</span>
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
