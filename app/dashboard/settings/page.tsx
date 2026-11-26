'use client';

import React, { useEffect, useState } from 'react';
import { Key, Webhook, Cpu, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

export default function SettingsPage() {
  const [tab, setTab] = useState<'keys' | 'webhooks' | 'genome' | 'aws'>('keys');
  const [keys, setKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [genomes, setGenomes] = useState<any[]>([]);
  const [awsStatus, setAwsStatus] = useState<any>(null);
  const [newKeyName, setNewKeyName] = useState('CI/CD Pipeline');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const loadAll = () => {
    fetch('/api/integrations/api-keys')
      .then((r) => r.json())
      .then((d) => setKeys(Array.isArray(d?.keys) ? d.keys : []))
      .catch(() => {});
    fetch('/api/integrations/webhooks')
      .then((r) => r.json())
      .then((d) => setWebhooks(Array.isArray(d?.webhooks) ? d.webhooks : []))
      .catch(() => {});
    fetch('/api/genome')
      .then((r) => r.json())
      .then((d) => setGenomes(Array.isArray(d?.genomes) ? d.genomes : []))
      .catch(() => {});
    fetch('/api/aws/status')
      .then((r) => r.json())
      .then((d) => setAwsStatus(d))
      .catch(() => {});
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setCreatedSecret(null);
    const res = await fetch('/api/integrations/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || 'Sign in required to create API keys.');
      return;
    }
    setCreatedSecret(data.key?.secretKey || null);
    loadAll();
  };

  const revokeKey = async (id: string) => {
    await fetch(`/api/integrations/api-keys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    loadAll();
  };

  const registerWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const res = await fetch('/api/integrations/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, events: ['audit.completed'] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || 'Sign in required to register webhooks.');
      return;
    }
    setWebhookUrl('');
    setNotice('Webhook registered.');
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
            Vault, Integrations &amp; Compute
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Settings &amp; Vault</h1>
        </div>

        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as any)}
          options={[
            { id: 'keys', label: 'API Keys' },
            { id: 'webhooks', label: 'Webhooks' },
            { id: 'genome', label: 'Barrier Genome' },
            { id: 'aws', label: 'AWS & Compliance' },
          ]}
        />
      </div>

      {notice && (
        <div role="alert" className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-amber-300">
          {notice}
        </div>
      )}

      {tab === 'keys' && (
        <SpotlightCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-[#0090ff]" />
            <span>Scoped CI/CD API Keys</span>
          </h2>
          <form onSubmit={createKey} className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white focus:border-[#0090ff] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-semibold text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </form>

          {createdSecret && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 break-all">
              Copy now (shown once): {createdSecret}
            </div>
          )}

          <div className="space-y-2">
            {keys.length === 0 ? (
              <p className="text-xs text-slate-500">No active API keys (sign in to manage keys).</p>
            ) : (
              keys.map((k) => (
                <div key={k.id} className="p-3 rounded-xl bg-[#07080b] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">{k.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{k.key_prefix}...</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeKey(k.id)}
                    aria-label={`Revoke ${k.name}`}
                    className="p-1.5 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </SpotlightCard>
      )}

      {tab === 'webhooks' && (
        <SpotlightCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Webhook className="w-4 h-4 text-emerald-400" />
            <span>HMAC-SHA256 Webhooks</span>
          </h2>
          <form onSubmit={registerWebhook} className="flex gap-2">
            <input
              type="url"
              required
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.company.com/barrierlens"
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-semibold text-white"
            >
              Register
            </button>
          </form>
          <div className="space-y-2">
            {webhooks.map((w) => (
              <div key={w.id} className="p-3 rounded-xl bg-[#07080b] border border-white/[0.06] text-xs font-mono text-slate-300">
                {w.url}
              </div>
            ))}
          </div>
        </SpotlightCard>
      )}

      {tab === 'genome' && (
        <SpotlightCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0090ff]" />
            <span>pgvector Barrier Genome Index ({genomes.length})</span>
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {genomes.map((g, i) => (
              <div key={g.id || i} className="p-3 rounded-xl bg-[#07080b] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="font-mono text-white">{g.finding_kind || g.findingKind}</span>
                <span className="text-slate-400">{g.domain || g.target_url}</span>
              </div>
            ))}
          </div>
        </SpotlightCard>
      )}

      {tab === 'aws' && (
        <SpotlightCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AWS Bedrock &amp; S3 Telemetry</span>
          </h2>
          <pre className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-slate-300 overflow-x-auto">
            {JSON.stringify(awsStatus || { status: 'loading' }, null, 2)}
          </pre>
        </SpotlightCard>
      )}
    </div>
  );
}
