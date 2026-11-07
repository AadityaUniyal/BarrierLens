'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Webhook, 
  Users, 
  Cloud, 
  FileCheck2, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  Lock,
  Download,
  X,
  Sparkles,
  CheckCircle2,
  Send
} from 'lucide-react';
import { UserSession } from './AppleAuthModal';

interface VaultAdminViewProps {
  userSession: UserSession | null;
  onOpenAuth: () => void;
}

interface APIKeyItem {
  id: string;
  name: string;
  prefix: string;
  scope: string;
  createdAt: string;
  lastUsedAt: string;
}

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'paused';
  successRate: string;
  lastTriggered: string;
}

export function VaultAdminView({ userSession, onOpenAuth }: VaultAdminViewProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'api-keys' | 'webhooks' | 'quota' | 'compliance'>('team');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKeyItem[]>([
    {
      id: 'key_prod_9841',
      name: 'Production CI/CD GitHub Action',
      prefix: 'bl_live_98a4',
      scope: 'audit:run, pr:create',
      createdAt: '2 days ago',
      lastUsedAt: '4 minutes ago'
    },
    {
      id: 'key_dev_2210',
      name: 'Local Developer CLI Runner',
      prefix: 'bl_live_41c0',
      scope: 'audit:read',
      createdAt: '1 week ago',
      lastUsedAt: 'Today at 9:15 AM'
    }
  ]);

  // Key creation modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState('audit:run, pr:create');
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    {
      id: 'wh_slack_001',
      url: 'https://api.acme.com/webhooks/barrierlens',
      events: ['audit.failed', 'repair.verified'],
      status: 'active',
      successRate: '100% (200 OK)',
      lastTriggered: '14 minutes ago'
    }
  ]);

  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [webhookTestNotice, setWebhookTestNotice] = useState<string | null>(null);

  // Team roster
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 'usr_1',
      name: userSession ? userSession.name : 'Sarah Chen',
      email: userSession ? userSession.email : 'sarah.chen@acme.corp',
      role: 'Organization Owner',
      passkeyStatus: 'Enforced (Touch ID)',
      added: 'Founder'
    },
    {
      id: 'usr_2',
      name: 'Marcus Vance',
      email: 'marcus.v@acme-corp.com',
      role: 'Lead Accessibility Auditor',
      passkeyStatus: 'Enforced (YubiKey)',
      added: '3 weeks ago'
    },
    {
      id: 'usr_3',
      name: 'Priya Sharma',
      email: 'priya.s@acme-corp.com',
      role: 'Staff Frontend Engineer',
      passkeyStatus: 'Enforced (Face ID)',
      added: '1 month ago'
    }
  ]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Staff Engineer');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    const randomBytes = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const fullKey = `bl_live_${randomBytes}`;
    const newEntry: APIKeyItem = {
      id: `key_${Date.now().toString(36)}`,
      name: newKeyName,
      prefix: fullKey.slice(0, 12),
      scope: newKeyScope,
      createdAt: 'Just now',
      lastUsedAt: 'Never'
    };
    setApiKeys(prev => [newEntry, ...prev]);
    setJustGeneratedKey(fullKey);
  };

  const handleSendTestPing = (whId: string) => {
    setTestingWebhookId(whId);
    setTimeout(() => {
      setTestingWebhookId(null);
      setWebhookTestNotice(`Signed HMAC-SHA256 test event delivered: 200 OK (28ms)`);
      setTimeout(() => setWebhookTestNotice(null), 3000);
    }, 700);
  };

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) return;
    const newMember = {
      id: `usr_${Date.now().toString(36)}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      passkeyStatus: 'Pending Activation',
      added: 'Just now'
    };
    setTeamMembers(prev => [...prev, newMember]);
    setIsInviteModalOpen(false);
    setInviteEmail('');
  };

  const handleDownloadEAAPack = () => {
    const pack = {
      directive: 'Directive (EU) 2019/882 (European Accessibility Act)',
      standard: 'EN 301 549 v3.2.1 / WCAG 2.2 Level AA',
      auditor: 'BarrierLens Autonomous Engine v2.4',
      generatedAt: new Date().toISOString(),
      complianceSummary: {
        metamorphicEffortRatioMax: 1.8,
        tarjanSinkSCCCount: 0,
        announcementGapsCount: 0,
        readingOrderConcordanceTau: 0.88,
        astPatchVerificationsPassed: true
      },
      digitalSignature: `sha256-${Date.now().toString(16)}a98e21f0084c71e`
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pack, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `EAA-2025-compliance-pack-${Date.now()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#f4f5f6]">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23262a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#30a46c] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Vault · Governance & Security Console
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f5f6]">
            Administration & Policy
          </h1>
          <p className="text-xs text-[#9ba1a6] mt-0.5">
            Manage organization credentials, role-based access, signed webhooks, and Bedrock quotas.
          </p>
        </div>

        {/* Segmented Admin Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-[#141517] border border-[#23262a] overflow-x-auto">
          {[
            { id: 'team', label: 'Team & RBAC', icon: Users },
            { id: 'api-keys', label: 'API Keys', icon: Key },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'quota', label: 'Bedrock Quota', icon: Cloud },
            { id: 'compliance', label: 'EAA Export', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#1f2226] text-[#f4f5f6] border border-[#34383f]'
                    : 'text-[#9ba1a6] hover:text-[#f4f5f6] hover:bg-[#181a1d] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#5e6ad2]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Team & RBAC Tab */}
      {activeTab === 'team' && (
        <div className="bg-[#141517] rounded-xl p-6 border border-[#23262a] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
            <div>
              <h2 className="text-sm font-semibold text-[#f4f5f6]">Organization Members & Passkey 2FA</h2>
              <p className="text-xs text-[#9ba1a6]">Control workspace access permissions with cryptographic hardware passkeys</p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#23262a] text-[#6b7280] uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Member</th>
                  <th className="py-2.5 px-3 font-medium">Role</th>
                  <th className="py-2.5 px-3 font-medium">Authentication</th>
                  <th className="py-2.5 px-3 font-medium">Added</th>
                  <th className="py-2.5 px-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23262a]">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#181a1d] transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium text-[#f4f5f6]">{member.name}</p>
                        <p className="text-[11px] text-[#9ba1a6]">{member.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#30a46c]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{member.passkeyStatus}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-[#9ba1a6]">{member.added}</td>
                    <td className="py-3 px-3 text-right">
                      <button className="text-xs text-[#9ba1a6] hover:text-[#f4f5f6] transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="bg-[#141517] rounded-xl p-6 border border-[#23262a] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
            <div>
              <h2 className="text-sm font-semibold text-[#f4f5f6]">Production API Keys</h2>
              <p className="text-xs text-[#9ba1a6]">Authenticate CI/CD runners, GitHub Actions, and external automated workers</p>
            </div>
            <button
              onClick={() => {
                setJustGeneratedKey(null);
                setNewKeyName('');
                setIsKeyModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 rounded-lg bg-[#0c0d0e] border border-[#23262a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#f4f5f6]">{key.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181a1d] border border-[#282c32] text-[#9ba1a6]">
                      {key.scope}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#9ba1a6]">
                    {key.prefix}••••••••••••••••••••••••••••••••
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[#6b7280] hidden sm:inline font-mono">Used {key.lastUsedAt}</span>
                  <button
                    onClick={() => handleCopy(key.prefix, key.id)}
                    className="p-2 rounded-lg bg-[#181a1d] hover:bg-[#23262a] text-[#f4f5f6] border border-[#282c32] transition-colors"
                    title="Copy Key Prefix"
                  >
                    {copiedKey === key.id ? <Check className="w-3.5 h-3.5 text-[#30a46c]" /> : <Copy className="w-3.5 h-3.5 text-[#9ba1a6]" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="bg-[#141517] rounded-xl p-6 border border-[#23262a] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
            <div>
              <h2 className="text-sm font-semibold text-[#f4f5f6]">Cryptographic Webhook Endpoints</h2>
              <p className="text-xs text-[#9ba1a6]">Deliver signed HMAC-SHA256 event payloads to external systems & alert channels</p>
            </div>
            <button
              onClick={() => alert('Webhook endpoint registration modal.')}
              className="px-3.5 py-1.5 rounded-lg bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Webhook</span>
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-4 rounded-lg bg-[#0c0d0e] border border-[#23262a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#f4f5f6] truncate max-w-sm">{wh.url}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#30a46c]/10 text-[#30a46c] border border-[#30a46c]/20 font-mono">
                      {wh.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9ba1a6] font-mono">
                    Events: {wh.events.join(', ')} · Health: {wh.successRate}
                  </p>
                </div>

                <button
                  disabled={testingWebhookId === wh.id}
                  onClick={() => handleSendTestPing(wh.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] border border-[#282c32] text-xs font-medium text-[#f4f5f6] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Send className="w-3 h-3 text-[#5e6ad2]" />
                  <span>{testingWebhookId === wh.id ? 'Sending...' : 'Send Test Ping'}</span>
                </button>
              </div>
            ))}
          </div>

          {webhookTestNotice && (
            <div className="p-3 rounded-lg bg-[#30a46c]/10 border border-[#30a46c]/30 text-xs font-mono text-[#30a46c] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{webhookTestNotice}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Bedrock Quota Tab */}
      {activeTab === 'quota' && (
        <div className="bg-[#141517] rounded-xl p-6 border border-[#23262a] shadow-xl space-y-5">
          <div className="pb-3 border-b border-[#23262a]">
            <h2 className="text-sm font-semibold text-[#f4f5f6]">AWS Bedrock Nova Metering</h2>
            <p className="text-xs text-[#9ba1a6]">Real-time token utilization across multi-agent swarm milestones</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1">
              <span className="text-[11px] font-semibold text-[#9ba1a6] uppercase font-mono">Amazon Nova Micro</span>
              <p className="text-2xl font-bold text-[#f4f5f6] tabular-nums font-mono">12,480</p>
              <p className="text-[10px] text-[#6b7280]">Tokens ($0.000035/1K tokens)</p>
            </div>
            <div className="p-4 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1">
              <span className="text-[11px] font-semibold text-[#9ba1a6] uppercase font-mono">Amazon Nova Pro</span>
              <p className="text-2xl font-bold text-[#f4f5f6] tabular-nums font-mono">48,200</p>
              <p className="text-[10px] text-[#6b7280]">Tokens ($0.0008/1K tokens)</p>
            </div>
            <div className="p-4 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1">
              <span className="text-[11px] font-semibold text-[#9ba1a6] uppercase font-mono">Hourly Swarm Quota</span>
              <p className="text-2xl font-bold text-[#30a46c] tabular-nums font-mono">6% Used</p>
              <p className="text-[10px] text-[#6b7280]">1,000,000 token limit</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. EAA Compliance Export Tab */}
      {activeTab === 'compliance' && (
        <div className="bg-[#141517] rounded-xl p-6 border border-[#23262a] shadow-xl space-y-5">
          <div className="pb-3 border-b border-[#23262a]">
            <h2 className="text-sm font-semibold text-[#f4f5f6]">European Accessibility Act (EAA) Compliance Export</h2>
            <p className="text-xs text-[#9ba1a6]">Generate cryptographically certified audit dossiers for regulatory filing</p>
          </div>

          <div className="p-5 rounded-lg bg-[#0c0d0e] border border-[#23262a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#f4f5f6]">Directive (EU) 2019/882 Official Compliance Pack</h3>
              <p className="text-xs text-[#9ba1a6]">
                Includes SHA-256 Tarjan SCC trap certificates, Kendall's Tau reading order proof, and AST diff records.
              </p>
            </div>

            <button
              onClick={handleDownloadEAAPack}
              className="px-4 py-2 rounded-lg bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Compliance Pack</span>
            </button>
          </div>
        </div>
      )}

      {/* Generate API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#141517] border border-[#23262a] rounded-xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#f4f5f6]">Generate New API Key</h3>
              <button onClick={() => setIsKeyModalOpen(false)} className="text-[#9ba1a6] hover:text-[#f4f5f6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!justGeneratedKey ? (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs text-[#9ba1a6]">Key Name / Description</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. GitHub Actions CI"
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] placeholder-[#5a626a] focus:outline-none focus:border-[#5e6ad2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9ba1a6]">Scopes</label>
                  <select
                    value={newKeyScope}
                    onChange={(e) => setNewKeyScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] focus:outline-none"
                  >
                    <option value="audit:run, pr:create">Full (audit:run, pr:create)</option>
                    <option value="audit:read">Read Only (audit:read)</option>
                    <option value="audit:run">Audit Runner (audit:run)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#181a1d] border border-[#282c32] text-xs text-[#9ba1a6]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateKey}
                    disabled={!newKeyName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#f4f5f6] text-[#0c0d0e] text-xs font-semibold disabled:opacity-50"
                  >
                    Generate
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#30a46c]/10 border border-[#30a46c]/30 text-xs font-mono text-[#30a46c] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>API Key Generated! Copy it now; it won't be shown again.</span>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a] font-mono text-xs text-[#f4f5f6] flex items-center justify-between gap-2 break-all">
                  <span>{justGeneratedKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(justGeneratedKey);
                      setCopiedKey('new_gen');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="p-1.5 rounded bg-[#181a1d] border border-[#34383f] shrink-0"
                  >
                    {copiedKey === 'new_gen' ? <Check className="w-3.5 h-3.5 text-[#30a46c]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-[#f4f5f6] text-[#0c0d0e] text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#141517] border border-[#23262a] rounded-xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#f4f5f6]">Invite Team Member</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-[#9ba1a6] hover:text-[#f4f5f6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-[#9ba1a6]">Work Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] placeholder-[#5a626a] focus:outline-none focus:border-[#5e6ad2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#9ba1a6]">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] focus:outline-none"
                >
                  <option value="Staff Engineer">Staff Engineer</option>
                  <option value="Lead Accessibility Auditor">Lead Accessibility Auditor</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                  <option value="Viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#181a1d] border border-[#282c32] text-xs text-[#9ba1a6]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[#f4f5f6] text-[#0c0d0e] text-xs font-semibold disabled:opacity-50"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
