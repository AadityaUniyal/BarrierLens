'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Settings2,
  Trash2
} from 'lucide-react';

interface WebsiteItem {
  id: string;
  name: string;
  origin: string;
  environment: 'production' | 'staging' | 'preview';
  verified: boolean;
  verificationMethod: 'dns_txt' | 'meta_tag' | 'http_file';
  verificationToken: string;
  pagesDiscovered: number;
  lastAudited: string;
  status: 'healthy' | 'needs_review' | 'unverified';
}

interface WebsitesManagerViewProps {
  onStartAuditForSite?: (url: string) => void;
}

export function WebsitesManagerView({ onStartAuditForSite }: WebsitesManagerViewProps) {
  const [websites, setWebsites] = useState<WebsiteItem[]>([
    {
      id: 'site_prod_01',
      name: 'BarrierLens Production',
      origin: 'https://barrierlens-seven.vercel.app',
      environment: 'production',
      verified: true,
      verificationMethod: 'dns_txt',
      verificationToken: 'barrierlens-site-verification=bl_v1_98a4bc10',
      pagesDiscovered: 15,
      lastAudited: '12 minutes ago',
      status: 'healthy'
    },
    {
      id: 'site_staging_02',
      name: 'Internal Benchmark Sandbox',
      origin: 'http://localhost:3000/benchmark',
      environment: 'staging',
      verified: true,
      verificationMethod: 'meta_tag',
      verificationToken: 'barrierlens-site-verification=bl_v1_local_dev',
      pagesDiscovered: 4,
      lastAudited: '1 hour ago',
      status: 'needs_review'
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [newName, setNewName] = useState('');
  const [newEnv, setNewEnv] = useState<'production' | 'staging' | 'preview'>('staging');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin) return;

    try {
      const url = new URL(newOrigin);
      const newSite: WebsiteItem = {
        id: `site_${Date.now()}`,
        name: newName || url.hostname,
        origin: url.origin,
        environment: newEnv,
        verified: false,
        verificationMethod: 'dns_txt',
        verificationToken: `barrierlens-site-verification=bl_v1_${Math.random().toString(36).substring(2, 10)}`,
        pagesDiscovered: 1,
        lastAudited: 'Never',
        status: 'unverified'
      };

      setWebsites([newSite, ...websites]);
      setIsAddModalOpen(false);
      setNewOrigin('');
      setNewName('');
    } catch {
      alert('Please enter a valid HTTP/HTTPS URL origin.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0a84ff]" />
            <span className="text-[12px] font-semibold tracking-wider uppercase text-[#86868b]">
              Websites & Verified Environments
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
            Managed Web Properties
          </h1>
          <p className="text-[14px] text-[#86868b] mt-0.5">
            Configure target origins, verify domain ownership, and manage crawling scope.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-[13px] font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Website</span>
        </button>
      </div>

      {/* 2. Websites List */}
      <div className="space-y-4">
        {websites.map((site) => (
          <div
            key={site.id}
            className="apple-vibrancy-regular rounded-3xl p-6 border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border-hairline flex items-center justify-center text-[#0a84ff]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#f5f5f7]">{site.name}</h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-[#a1a1a6] border-hairline">
                      {site.environment}
                    </span>
                    {site.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#30d158] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Domain Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#ff9f0a] font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Verification Required</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-mono text-[#86868b]">{site.origin}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 text-[12px] text-[#86868b]">
                <span>Pages Discovered: <strong className="text-[#f5f5f7]">{site.pagesDiscovered}</strong></span>
                <span>Last Audited: <strong className="text-[#f5f5f7]">{site.lastAudited}</strong></span>
                <span className="hidden sm:inline">SSRF Protection: <strong className="text-[#30d158]">Active</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {site.verified ? (
                <button
                  onClick={() => onStartAuditForSite?.(site.origin)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[12px] font-medium text-[#f5f5f7] border-hairline transition-all"
                >
                  Start Audit
                </button>
              ) : (
                <button
                  onClick={() => handleCopy(site.verificationToken, site.id)}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-[12px] font-medium text-[#ff9f0a] border-hairline border-amber-500/20 flex items-center gap-1.5 transition-all"
                >
                  {copiedToken === site.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy DNS Challenge</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Add Website Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg apple-card-raised rounded-3xl border-hairline p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-semibold text-[#f5f5f7] mb-1">Add Web Property</h2>
            <p className="text-[12px] text-[#86868b] mb-4">
              Enter target domain origin. Domain verification is enforced before full crawls to prevent SSRF abuse.
            </p>

            <form onSubmit={handleAddWebsite} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">Website Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Production Web App"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1c1c1e] border-hairline text-xs text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">Target Origin URL</label>
                <input
                  type="url"
                  required
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  placeholder="https://app.acme.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1c1c1e] border-hairline text-xs text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">Environment</label>
                <select
                  value={newEnv}
                  onChange={(e) => setNewEnv(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1c1c1e] border-hairline text-xs text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="preview">Preview / CI Branch</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/[0.06] border-hairline border-blue-500/20 text-xs text-[#a1a1a6]">
                <p className="font-medium text-[#f5f5f7] mb-0.5">SSRF Policy Guard</p>
                Target URLs are validated server-side. Private networks, link-local addresses, and cloud metadata services are blocked.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#86868b] hover:text-[#f5f5f7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] transition-all shadow-md shadow-blue-500/25"
                >
                  Add and Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
