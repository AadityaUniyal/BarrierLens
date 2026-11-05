'use client';

import React, { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import { UserSession } from './AppleAuthModal';

interface VaultAdminViewProps {
  userSession: UserSession | null;
  onOpenAuth: () => void;
}

export function VaultAdminView({ userSession, onOpenAuth }: VaultAdminViewProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'api-keys' | 'webhooks' | 'quota' | 'compliance'>('team');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([
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

  // Webhooks state
  const [webhooks, setWebhooks] = useState<any[]>([
    {
      id: 'wh_slack_001',
      url: 'https://api.acme.com/webhooks/barrierlens',
      events: ['audit.failed', 'repair.verified'],
      status: 'active',
      successRate: '100% (200 OK)',
      lastTriggered: '14 minutes ago'
    }
  ]);

  // Team roster
  const teamMembers = [
    {
      id: 'usr_1',
      name: userSession ? userSession.name : 'Sarah Chen',
      email: userSession ? userSession.email : 'sarah.chen@apple-id.corp',
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
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold tracking-wider uppercase text-[#30d158] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Vault · Governance & Security Console
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
            Administration & Policy
          </h1>
          <p className="text-[14px] text-[#86868b] mt-0.5">
            Manage organization credentials, role-based access, signed webhooks, and Bedrock quotas.
          </p>
        </div>

        {/* Segmented Admin Switcher */}
        <div className="flex items-center p-1 rounded-full bg-[#1c1c1e] border-hairline">
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#2c2c2e] text-[#f5f5f7] shadow-sm'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#30d158]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Team & RBAC Tab */}
      {activeTab === 'team' && (
        <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#f5f5f7]">Organization Members</h2>
              <p className="text-[12px] text-[#86868b]">Control access permissions with strict Apple Passkey 2FA</p>
            </div>
            <button
              onClick={() => alert('Invitation sent to new member.')}
              className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-[12px] font-medium hover:bg-[#0077ed] flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Authentication</th>
                  <th className="py-2.5 px-3">Added</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[13px]">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium text-[#f5f5f7]">{member.name}</p>
                        <p className="text-[11px] text-[#86868b]">{member.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-[#0a84ff] border-hairline border-blue-500/20">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#30d158]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{member.passkeyStatus}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[12px] text-[#86868b]">{member.added}</td>
                    <td className="py-3 px-3 text-right">
                      <button className="text-[11px] text-[#86868b] hover:text-[#f5f5f7]">Edit</button>
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
        <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#f5f5f7]">Production API Keys</h2>
              <p className="text-[12px] text-[#86868b]">Authenticate CI/CD runners and external automated agents</p>
            </div>
            <button
              onClick={() => alert('New scoped API key generated.')}
              className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-[12px] font-medium hover:bg-[#0077ed] flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 rounded-2xl bg-white/[0.03] border-hairline flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#f5f5f7]">{key.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[#a1a1a6]">
                      {key.scope}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#86868b] mt-1">
                    {key.prefix}••••••••••••••••••••••••••••••••
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#86868b] hidden sm:inline">Used {key.lastUsedAt}</span>
                  <button
                    onClick={() => handleCopy(key.prefix, key.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#f5f5f7] border-hairline transition-all"
                  >
                    {copiedKey === key.id ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#f5f5f7]">Cryptographic Webhook Endpoints</h2>
              <p className="text-[12px] text-[#86868b]">Deliver signed HMAC-SHA256 event payloads to external systems</p>
            </div>
            <button
              onClick={() => alert('Webhook endpoint registration modal.')}
              className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-[12px] font-medium hover:bg-[#0077ed] flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Webhook</span>
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-4 rounded-2xl bg-white/[0.03] border-hairline flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-mono text-[#f5f5f7]">{wh.url}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-[#30d158] border-hairline border-green-500/20">
                      {wh.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868b] mt-1">
                    Events: {wh.events.join(', ')} · Health: {wh.successRate}
                  </p>
                </div>

                <button
                  onClick={() => alert('Dispatched ping event test payload.')}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-medium text-[#f5f5f7] border-hairline"
                >
                  Send Test Ping
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Bedrock Quota Tab */}
      {activeTab === 'quota' && (
        <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-6">
          <div>
            <h2 className="text-base font-semibold text-[#f5f5f7]">AWS Bedrock Nova Metering</h2>
            <p className="text-[12px] text-[#86868b]">Real-time token utilization across multi-agent swarm milestones</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border-hairline">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase">Amazon Nova Micro</span>
              <p className="text-2xl font-bold text-[#f5f5f7] mt-1">12,480</p>
              <p className="text-[10px] text-[#86868b] mt-0.5">Tokens ($0.000035/1K tokens)</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border-hairline">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase">Amazon Nova Pro</span>
              <p className="text-2xl font-bold text-[#f5f5f7] mt-1">48,200</p>
              <p className="text-[10px] text-[#86868b] mt-0.5">Tokens ($0.0008/1K tokens)</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border-hairline">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase">Hourly Quota</span>
              <p className="text-2xl font-bold text-[#30d158] mt-1">6% Used</p>
              <p className="text-[10px] text-[#86868b] mt-0.5">1,000,000 token limit</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. EAA Compliance Export Tab */}
      {activeTab === 'compliance' && (
        <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-6">
          <div>
            <h2 className="text-base font-semibold text-[#f5f5f7]">European Accessibility Act (EAA) Compliance Export</h2>
            <p className="text-[12px] text-[#86868b]">Generate cryptographically certified audit dossiers for regulatory filing</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#f5f5f7]">Directive (EU) 2019/882 Official Compliance Pack</h3>
              <p className="text-[12px] text-[#86868b] mt-1">
                Includes SHA-256 Tarjan SCC trap certificates, Kendall's Tau reading order proof, and AST diff records.
              </p>
            </div>

            <button
              onClick={() => alert('Downloading official EAA compliance PDF package...')}
              className="px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-[13px] font-medium hover:bg-[#0077ed] flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Compliance Pack</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
