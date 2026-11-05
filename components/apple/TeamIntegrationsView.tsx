'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Key, 
  Webhook, 
  Users, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ExternalLink,
  Code2,
  Terminal,
  Activity,
  AlertCircle
} from 'lucide-react';
import { UserSession } from './AppleAuthModal';

interface TeamIntegrationsViewProps {
  userSession: UserSession | null;
  onOpenAuth: () => void;
}

export function TeamIntegrationsView({ userSession, onOpenAuth }: TeamIntegrationsViewProps) {
  const [activeTab, setActiveTab] = useState<'cicd' | 'api-keys' | 'webhooks' | 'team'>('cicd');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Production CI/CD Runner');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  const [testPingResult, setTestPingResult] = useState<any | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // GitHub Actions workflow
  const [workflowYaml, setWorkflowYaml] = useState<string>('');
  const [prCommentPreview, setPrCommentPreview] = useState<string>('');

  // Fetch initial data
  useEffect(() => {
    fetchApiKeys();
    fetchWebhooks();
    fetchGithubConfig();
  }, []);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/integrations/api-keys');
      const data = await res.json();
      if (data.keys) setApiKeys(data.keys);
    } catch {
      // Fallback
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleCreateApiKey = async () => {
    setIsCreatingKey(true);
    try {
      const res = await fetch('/api/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, scopes: ['audits:read', 'audits:write'] })
      });
      const data = await res.json();
      if (data.success && data.key) {
        setCreatedSecretKey(data.key.secretKey);
        fetchApiKeys();
      }
    } catch {
      // Handle error
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await fetch(`/api/integrations/api-keys?id=${id}`, { method: 'DELETE' });
      setApiKeys(prev => prev.filter(k => k.id !== id));
    } catch {}
  };

  const fetchWebhooks = async () => {
    setIsLoadingWebhooks(true);
    try {
      const res = await fetch('/api/integrations/webhooks');
      const data = await res.json();
      if (data.webhooks) setWebhooks(data.webhooks);
    } catch {
      // Fallback
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl) return;
    setIsRegisteringWebhook(true);
    try {
      const res = await fetch('/api/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newWebhookUrl })
      });
      const data = await res.json();
      if (data.success) {
        setNewWebhookUrl('');
        fetchWebhooks();
      }
    } catch {} finally {
      setIsRegisteringWebhook(false);
    }
  };

  const handleSendTestPing = async (webhook: any) => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-ping', webhookId: webhook.id, url: webhook.url, secret: webhook.secret })
      });
      const data = await res.json();
      setTestPingResult(data);
    } catch {} finally {
      setIsPinging(false);
    }
  };

  const fetchGithubConfig = async () => {
    try {
      const res = await fetch('/api/integrations/github');
      const data = await res.json();
      if (data.workflowYaml) setWorkflowYaml(data.workflowYaml);
      if (data.prCommentTemplate) setPrCommentPreview(data.prCommentTemplate);
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f5f5f7] tracking-tight">
            Team & Ecosystem Integrations
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-1">
            Connect BarrierLens to your GitHub CI/CD pipelines, issue API keys, configure webhooks, and manage team members.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="inline-flex p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl self-start sm:self-auto">
          {[
            { id: 'cicd', label: 'CI/CD & GitHub', icon: GitBranch },
            { id: 'api-keys', label: 'API Keys', icon: Key },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'team', label: 'Team & Org', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/20'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CI/CD & GITHUB ACTIONS
          ========================================================================= */}
      {activeTab === 'cicd' && (
        <div className="space-y-6">
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#f5f5f7] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#0071e3]" />
                  GitHub Actions Autonomous Audit Workflow
                </h3>
                <p className="text-xs text-[#86868b]">
                  Add this YAML file to <code className="text-[#0a84ff] font-mono">.github/workflows/barrierlens.yml</code> in your repository.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(workflowYaml, 'yaml')}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-[#f5f5f7] border border-white/10 flex items-center gap-2 transition-all self-start sm:self-auto"
              >
                {copiedSection === 'yaml' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Workflow YAML</span>
                  </>
                )}
              </button>
            </div>

            {/* Workflow Code Block */}
            <div className="p-4 rounded-2xl bg-black/70 border border-white/8 font-mono text-xs text-[#f5f5f7] overflow-x-auto leading-relaxed">
              <pre>{workflowYaml || 'Loading workflow YAML...'}</pre>
            </div>
          </div>

          {/* PR Comment Preview Box */}
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <h3 className="text-base font-bold text-[#f5f5f7] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Automated PR Comment Output Preview
            </h3>
            <p className="text-xs text-[#86868b]">
              Every pull request receives a deterministic status comment detailing the Metamorphic Effort Ratio and verified patches.
            </p>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 font-mono text-xs text-[#f5f5f7] whitespace-pre-wrap leading-relaxed">
              {prCommentPreview || 'Loading PR comment template...'}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: API KEYS MANAGEMENT
          ========================================================================= */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          {/* Key creation box */}
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <h3 className="text-base font-bold text-[#f5f5f7] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#0071e3]" />
              Generate API Key
            </h3>
            <p className="text-xs text-[#86868b]">
              Use API keys to authenticate headless CI/CD runs, curl commands, and custom webhook dispatchers.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Key Description (e.g. GitHub Actions Preview)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              />
              <button
                onClick={handleCreateApiKey}
                disabled={isCreatingKey}
                className="px-6 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-75"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Key</span>
              </button>
            </div>

            {/* Modal popup when key created */}
            {createdSecretKey && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>API Key Created Successfully</span>
                </div>
                <p className="text-[11px] text-[#86868b]">
                  Make sure to copy your API key now as you won't be able to see it again!
                </p>
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/60 border border-emerald-500/20 font-mono text-xs text-emerald-300">
                  <span className="truncate">{createdSecretKey}</span>
                  <button
                    onClick={() => copyToClipboard(createdSecretKey, 'secretKey')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shrink-0 transition-all"
                  >
                    {copiedSection === 'secretKey' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Keys Table */}
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <h3 className="text-base font-bold text-[#f5f5f7]">Active API Keys</h3>
            {apiKeys.length === 0 ? (
              <p className="text-xs text-[#86868b] py-4 text-center italic">
                {isLoadingKeys ? 'Loading API keys...' : 'No API keys created yet. Generate one above to connect your CI/CD pipeline.'}
              </p>
            ) : (
              <div className="divide-y divide-white/8">
                {apiKeys.map((k) => (
                  <div key={k.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#f5f5f7]">{k.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#86868b] border border-white/10">
                          {k.key_prefix}...
                        </span>
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        Created: {new Date(k.created_at).toLocaleDateString()} • Rate Limit: {k.rate_limit_per_min || 120} req/min
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: WEBHOOKS MANAGEMENT
          ========================================================================= */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <h3 className="text-base font-bold text-[#f5f5f7] flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[#0071e3]" />
              Register Webhook Endpoint
            </h3>
            <p className="text-xs text-[#86868b]">
              Receive real-time signed HTTP POST payloads when an audit finishes or when proven traps are detected.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                placeholder="https://api.yourdomain.com/webhooks/barrierlens"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              />
              <button
                onClick={handleCreateWebhook}
                disabled={isRegisteringWebhook}
                className="px-6 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-75"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Webhook</span>
              </button>
            </div>
          </div>

          {/* Webhook List */}
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-4">
            <h3 className="text-base font-bold text-[#f5f5f7]">Registered Endpoints</h3>
            {webhooks.length === 0 ? (
              <p className="text-xs text-[#86868b] py-4 text-center italic">
                {isLoadingWebhooks ? 'Loading webhooks...' : 'No webhooks registered yet.'}
              </p>
            ) : (
              <div className="divide-y divide-white/8">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-mono text-xs text-[#0a84ff] font-semibold">{wh.url}</div>
                        <div className="text-[11px] text-[#86868b]">
                          Signing Secret: <code className="text-white/60">{wh.secret ? wh.secret.slice(0, 10) + '...' : 'whsec_***'}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendTestPing(wh)}
                          disabled={isPinging}
                          className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-[#f5f5f7] border border-white/10 flex items-center gap-1.5 transition-all"
                        >
                          <Send className="w-3 h-3 text-[#0a84ff]" />
                          <span>Send Test Ping</span>
                        </button>
                        <button
                          onClick={async () => {
                            await fetch(`/api/integrations/webhooks?id=${wh.id}`, { method: 'DELETE' });
                            setWebhooks(prev => prev.filter(w => w.id !== wh.id));
                          }}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Test Ping Live Inspection HUD */}
            {testPingResult && (
              <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[#86868b]">Dispatched Test Event</span>
                  <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
                </div>
                <div className="text-[#86868b]">
                  Target: <span className="text-white">{testPingResult.targetUrl}</span>
                </div>
                <div className="text-[#86868b]">
                  Header: <span className="text-[#0a84ff]">{testPingResult.headers?.['X-BarrierLens-Signature']}</span>
                </div>
                <pre className="text-emerald-300 pt-1 overflow-x-auto">
                  {JSON.stringify(testPingResult.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TEAM & BETTER AUTH ORGANIZATION
          ========================================================================= */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="apple-card p-6 rounded-3xl border border-white/8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#0a84ff]">Better Auth Organization</span>
                <h3 className="text-xl font-bold text-[#f5f5f7]">Cupertino Design Systems</h3>
                <p className="text-xs text-[#86868b]">Tier: Enterprise Swarm • AWS Bedrock Region: us-east-1</p>
              </div>
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite Team Member</span>
              </button>
            </div>

            {/* Team Members List */}
            <div className="divide-y divide-white/8 pt-2">
              {[
                { name: 'Sarah Chen', email: 'sarah.chen@apple-id.corp', role: 'Staff Frontend Engineer (Owner)', passkey: true, status: 'Active' },
                { name: 'Marcus Vance', email: 'marcus.v@apple-id.corp', role: 'Accessibility Specialist', passkey: true, status: 'Active' },
                { name: 'Alex Rivera', email: 'a.rivera@apple-id.corp', role: 'QA Lead', passkey: false, status: 'Invited' },
              ].map((member, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0071e3] to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#f5f5f7] flex items-center gap-2">
                        <span>{member.name}</span>
                        {member.passkey && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-[#0a84ff] border border-blue-500/20 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Passkey
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#86868b]">{member.email} • {member.role}</div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    member.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-[#86868b]'
                  }`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage & Budget Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2">
              <span className="text-xs text-[#86868b]">Monthly Autonomous Runs</span>
              <div className="text-2xl font-bold text-[#f5f5f7] tabular-nums">42 / 500</div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#0071e3] h-full rounded-full" style={{ width: '8.4%' }} />
              </div>
            </div>

            <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2">
              <span className="text-xs text-[#86868b]">Bedrock Token Budget</span>
              <div className="text-2xl font-bold text-purple-400 tabular-nums">1.2M / 10.0M</div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '12%' }} />
              </div>
            </div>

            <div className="apple-card p-5 rounded-2xl border border-white/8 space-y-2">
              <span className="text-xs text-[#86868b]">Verified AST Patches</span>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">18 Verified</div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
