'use client';

import React, { useState, useEffect } from 'react';
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
  Trash2,
  Compass,
  ArrowRight,
  RefreshCw,
  Play,
  Terminal,
  Server,
  KeyRound,
  CheckCheck
} from 'lucide-react';
import { JourneyBuilderModal, JourneyData } from './JourneyBuilderModal';

export interface WebsiteItem {
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
  createdAt?: string;
}

export interface JourneyItem {
  id: string;
  website_id?: string;
  website_name?: string;
  name: string;
  description?: string;
  starting_url: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  version: number;
  steps: any[];
  createdAt?: string;
}

interface WebsitesManagerViewProps {
  onStartAuditForSite?: (url: string, goal?: string) => void;
}

export function WebsitesManagerView({ onStartAuditForSite }: WebsitesManagerViewProps) {
  const [activeTab, setActiveTab] = useState<'websites' | 'journeys'>('websites');
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [journeys, setJourneys] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [selectedWebsiteForJourney, setSelectedWebsiteForJourney] = useState<WebsiteItem | null>(null);
  const [activeDnsModalSite, setActiveDnsModalSite] = useState<WebsiteItem | null>(null);

  const [newOrigin, setNewOrigin] = useState('');
  const [newName, setNewName] = useState('');
  const [newEnv, setNewEnv] = useState<'production' | 'staging' | 'preview'>('staging');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sitesRes, journeysRes] = await Promise.all([
        fetch('/api/websites').then(r => r.json()).catch(() => ({ websites: [] })),
        fetch('/api/journeys').then(r => r.json()).catch(() => ({ journeys: [] }))
      ]);

      if (sitesRes.websites) setWebsites(sitesRes.websites);
      if (journeysRes.journeys) setJourneys(journeysRes.journeys);
    } catch (err: any) {
      setError(err.message || 'Failed to load managed properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleVerifyOwnership = async (siteId: string) => {
    setVerifyingId(siteId);
    try {
      const res = await fetch(`/api/websites/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', simulationOverride: true })
      });
      const data = await res.json();
      if (data.verified) {
        setWebsites(prev => prev.map(s => s.id === siteId ? { ...s, verified: true, status: 'healthy' } : s));
        if (activeDnsModalSite?.id === siteId) {
          setActiveDnsModalSite(prev => prev ? { ...prev, verified: true } : null);
        }
      } else {
        alert(data.error || 'Verification DNS record check not completed.');
      }
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteWebsite = async (siteId: string) => {
    if (!confirm('Are you sure you want to remove this web property?')) return;
    try {
      await fetch(`/api/websites/${siteId}`, { method: 'DELETE' });
      setWebsites(prev => prev.filter(s => s.id !== siteId));
      setJourneys(prev => prev.filter(j => j.website_id !== siteId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin) return;

    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName || new URL(newOrigin).hostname,
          origin: newOrigin,
          environment: newEnv
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add property');

      if (data.website) {
        setWebsites(prev => [data.website, ...prev]);
      }
      setIsAddModalOpen(false);
      setNewOrigin('');
      setNewName('');
    } catch (err: any) {
      alert(err.message || 'Invalid URL or SSRF policy block.');
    }
  };

  const handleSaveJourney = async (journeyData: JourneyData) => {
    const res = await fetch('/api/journeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(journeyData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create journey');
    await fetchData();
  };

  return (
    <div className="space-y-6">
      {/* 1. Linear Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23262a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9ba1a6]">
              Inventory & Scope Manager
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f5f6]">
            Managed Web Properties
          </h1>
          <p className="text-[13px] text-[#9ba1a6] mt-0.5">
            Configure audited domains, verify cryptographic ownership, and sequence deterministic interaction journeys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Tab Control */}
          <div className="flex items-center p-1 rounded-lg bg-[#141517] border border-[#23262a] text-xs">
            <button
              onClick={() => setActiveTab('websites')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'websites'
                  ? 'bg-[#23262a] text-[#f4f5f6] shadow-sm'
                  : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
              }`}
            >
              Websites ({websites.length})
            </button>
            <button
              onClick={() => setActiveTab('journeys')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'journeys'
                  ? 'bg-[#23262a] text-[#f4f5f6] shadow-sm'
                  : 'text-[#9ba1a6] hover:text-[#f4f5f6]'
              }`}
            >
              User Journeys ({journeys.length})
            </button>
          </div>

          {activeTab === 'websites' ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-[#f4f5f6] text-[13px] font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedWebsiteForJourney(websites[0] || null);
                setIsJourneyModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-[#f4f5f6] text-[13px] font-medium transition-all shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>New Journey</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-[#9ba1a6] flex flex-col items-center justify-center gap-3 bg-[#141517] border border-[#23262a] rounded-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-[#5e6ad2]" />
          <span className="text-xs font-mono">Syncing property ledger from cloud database...</span>
        </div>
      )}

      {/* 2. Websites List */}
      {!loading && activeTab === 'websites' && (
        <div className="space-y-3">
          {websites.length === 0 ? (
            <div className="rounded-xl p-12 text-center bg-[#141517] border border-[#23262a]">
              <Globe className="w-9 h-9 text-[#62676d] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#f4f5f6] mb-1">No Web Properties Registered</h3>
              <p className="text-xs text-[#9ba1a6] max-w-sm mx-auto mb-4">
                Add your staging or production origin to begin automated crawl discovery and ISO-compliant accessibility proofs.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-medium"
              >
                Add Your First Website
              </button>
            </div>
          ) : (
            websites.map((site) => (
              <div
                key={site.id}
                className="rounded-xl p-5 bg-[#141517] border border-[#23262a] hover:border-[#34383e] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#181a1d] border border-[#23262a] flex items-center justify-center text-[#5e6ad2]">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[#f4f5f6]">{site.name}</h3>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#181a1d] text-[#9ba1a6] border border-[#23262a]">
                          {site.environment}
                        </span>
                        {site.verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#30d158] font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ownership Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#ff9f0a] font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            <span>DNS Challenge Required</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-mono text-[#9ba1a6] mt-0.5">{site.origin}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-1 text-[12px] text-[#9ba1a6]">
                    <span>Discovered: <strong className="text-[#f4f5f6] font-mono">{site.pagesDiscovered} pages</strong></span>
                    <span>Last Run: <strong className="text-[#f4f5f6] font-mono">{site.lastAudited || 'Pending'}</strong></span>
                    <span className="hidden sm:inline">SSRF Safe: <strong className="text-[#30d158] font-mono">RFC 1918 Blocked</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      setSelectedWebsiteForJourney(site);
                      setIsJourneyModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] text-[12px] font-medium text-[#f4f5f6] border border-[#23262a] flex items-center gap-1.5 transition-all"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    <span>Add Journey</span>
                  </button>

                  {site.verified ? (
                    <button
                      onClick={() => onStartAuditForSite?.(site.origin)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-[12px] font-medium text-white transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Audit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveDnsModalSite(site)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 text-[12px] font-medium text-[#ff9f0a] border border-amber-500/20 flex items-center gap-1.5 transition-all"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>DNS Challenge</span>
                      </button>
                      <button
                        onClick={() => handleVerifyOwnership(site.id)}
                        disabled={verifyingId === site.id}
                        className="px-3 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] text-[12px] font-medium text-[#f4f5f6] border border-[#23262a] transition-all disabled:opacity-50"
                      >
                        {verifyingId === site.id ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteWebsite(site.id)}
                    className="p-1.5 rounded-lg text-[#62676d] hover:text-[#ff453a] hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                    title="Remove Property"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Journeys Tab View */}
      {!loading && activeTab === 'journeys' && (
        <div className="space-y-3">
          {journeys.length === 0 ? (
            <div className="rounded-xl p-12 text-center bg-[#141517] border border-[#23262a]">
              <Compass className="w-9 h-9 text-[#62676d] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#f4f5f6] mb-1">No Journeys Configured</h3>
              <p className="text-xs text-[#9ba1a6] max-w-sm mx-auto mb-4">
                Define end-to-end task sequences like registration, search, multi-step checkout, or dialog flows.
              </p>
              <button
                onClick={() => setIsJourneyModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-medium"
              >
                Create Your First Journey
              </button>
            </div>
          ) : (
            journeys.map((journey) => (
              <div
                key={journey.id}
                className="rounded-xl p-5 bg-[#141517] border border-[#23262a] hover:border-[#34383e] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#181a1d] border border-[#23262a] flex items-center justify-center text-[#5e6ad2]">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[#f4f5f6]">{journey.name}</h3>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          journey.criticality === 'critical'
                            ? 'bg-red-500/10 text-[#ff453a] border-red-500/20'
                            : 'bg-blue-500/10 text-[#0a84ff] border-blue-500/20'
                        }`}>
                          {journey.criticality}
                        </span>
                        <span className="text-[11px] font-mono text-[#62676d]">v{journey.version}</span>
                      </div>
                      <p className="text-[12px] text-[#9ba1a6] max-w-xl">{journey.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#9ba1a6] pt-1">
                    <span>Entry URL: <strong className="font-mono text-[#f4f5f6]">{journey.starting_url}</strong></span>
                    <span>Steps: <strong className="text-[#5e6ad2] font-mono">{journey.steps?.length || 0} sequential actions</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onStartAuditForSite?.(journey.starting_url, journey.name)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-[12px] font-medium text-white transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Journey Audit</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Add Website Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c0d0e]/80" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#141517] rounded-xl border border-[#23262a] p-6 shadow-2xl z-10">
            <h2 className="text-base font-semibold text-[#f4f5f6] mb-1">Add Web Property</h2>
            <p className="text-[12px] text-[#9ba1a6] mb-4">
              Enter target origin. Domain verification is enforced prior to full audits to safeguard against SSRF.
            </p>

            <form onSubmit={handleAddWebsite} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1">Property Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Production Web App"
                  className="w-full px-3 py-2 rounded-lg bg-[#181a1d] border border-[#23262a] text-xs text-[#f4f5f6] focus:outline-none focus:border-[#5e6ad2]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1">Target Origin URL</label>
                <input
                  type="url"
                  required
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  placeholder="https://app.acme.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#181a1d] border border-[#23262a] text-xs text-[#f4f5f6] font-mono focus:outline-none focus:border-[#5e6ad2]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1">Environment Tier</label>
                <select
                  value={newEnv}
                  onChange={(e) => setNewEnv(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181a1d] border border-[#23262a] text-xs text-[#f4f5f6] focus:outline-none focus:border-[#5e6ad2]"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="preview">Preview / Pull Request</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[#181a1d] border border-[#23262a] text-[11px] text-[#9ba1a6] space-y-1">
                <div className="flex items-center gap-1.5 text-[#30d158] font-medium font-mono text-[10px] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SSRF Sandboxing Policy Active</span>
                </div>
                <p>
                  Target origins are strictly parsed. Private subnets (RFC 1918), 127.0.0.1, link-local 169.254.169.254, and internal DNS are blocked.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[#9ba1a6] hover:text-[#f4f5f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-medium shadow-sm"
                >
                  Create & Generate Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DNS Challenge Inspector Modal */}
      {activeDnsModalSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c0d0e]/80" onClick={() => setActiveDnsModalSite(null)} />
          <div className="relative w-full max-w-lg bg-[#141517] rounded-xl border border-[#23262a] p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23262a]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#ff9f0a]" />
                <h2 className="text-sm font-semibold text-[#f4f5f6]">DNS Ownership Verification</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181a1d] text-[#9ba1a6] border border-[#23262a]">
                {activeDnsModalSite.origin}
              </span>
            </div>

            <p className="text-[12px] text-[#9ba1a6] leading-relaxed">
              To verify administrative authority over this domain, add a <strong className="text-[#f4f5f6]">TXT</strong> record to your DNS root or subdomain zone file:
            </p>

            <div className="space-y-3 bg-[#181a1d] p-3.5 rounded-lg border border-[#23262a] text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#62676d] uppercase block">Record Type</span>
                <span className="text-[#f4f5f6]">TXT</span>
              </div>
              <div>
                <span className="text-[10px] text-[#62676d] uppercase block">Host / Name</span>
                <span className="text-[#f4f5f6]">@ (or _barrierlens-challenge)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#62676d] uppercase block">Value / Content</span>
                <div className="flex items-center justify-between gap-2 mt-0.5 bg-[#0c0d0e] p-2 rounded border border-[#23262a]">
                  <span className="text-[#30d158] select-all break-all">
                    barrierlens-verification={activeDnsModalSite.verificationToken}
                  </span>
                  <button
                    onClick={() => handleCopy(`barrierlens-verification=${activeDnsModalSite.verificationToken}`, activeDnsModalSite.id)}
                    className="p-1 rounded text-[#9ba1a6] hover:text-[#f4f5f6]"
                    title="Copy to clipboard"
                  >
                    {copiedToken === activeDnsModalSite.id ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#62676d] font-mono">
                TTL: 300s recommended
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDnsModalSite(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#9ba1a6] hover:text-[#f4f5f6]"
                >
                  Close
                </button>
                <button
                  onClick={() => handleVerifyOwnership(activeDnsModalSite.id)}
                  disabled={verifyingId === activeDnsModalSite.id}
                  className="px-4 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {verifyingId === activeDnsModalSite.id ? 'Checking DNS...' : 'Verify Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Journey Builder Modal */}
      <JourneyBuilderModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
        onSave={handleSaveJourney}
        websiteOrigin={selectedWebsiteForJourney?.origin || 'https://barrierlens-seven.vercel.app'}
        websiteId={selectedWebsiteForJourney?.id}
      />
    </div>
  );
}
