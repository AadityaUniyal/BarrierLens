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
  Play
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
          name: newName,
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0a84ff]" />
            <span className="text-[12px] font-semibold tracking-wider uppercase text-[#86868b]">
              Websites & Journeys Management
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
            Managed Web Properties
          </h1>
          <p className="text-[14px] text-[#86868b] mt-0.5">
            Configure target origins, verify domain ownership, and design deterministic user journeys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border-hairline text-xs">
            <button
              onClick={() => setActiveTab('websites')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'websites'
                  ? 'bg-white/[0.12] text-[#f5f5f7] shadow-sm'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
            >
              Websites ({websites.length})
            </button>
            <button
              onClick={() => setActiveTab('journeys')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'journeys'
                  ? 'bg-white/[0.12] text-[#f5f5f7] shadow-sm'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
            >
              Journeys ({journeys.length})
            </button>
          </div>

          {activeTab === 'websites' ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-[13px] font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Website</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedWebsiteForJourney(websites[0] || null);
                setIsJourneyModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-[13px] font-medium hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
            >
              <Compass className="w-4 h-4" />
              <span>Build Journey</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-[#86868b] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0a84ff]" />
          <span className="text-xs">Loading managed properties from Neon Postgres...</span>
        </div>
      )}

      {/* 2. Websites List */}
      {!loading && activeTab === 'websites' && (
        <div className="space-y-4">
          {websites.length === 0 ? (
            <div className="apple-vibrancy-regular rounded-3xl p-12 text-center border-hairline">
              <Globe className="w-10 h-10 text-[#86868b] mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-[#f5f5f7] mb-1">No Web Properties Added</h3>
              <p className="text-xs text-[#86868b] max-w-sm mx-auto mb-4">
                Add your production or staging domain to begin autonomous accessibility exploration.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-medium"
              >
                Add Your First Website
              </button>
            </div>
          ) : (
            websites.map((site) => (
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
                  <button
                    onClick={() => {
                      setSelectedWebsiteForJourney(site);
                      setIsJourneyModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[12px] font-medium text-[#f5f5f7] border-hairline flex items-center gap-1.5 transition-all"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#0a84ff]" />
                    <span>Add Journey</span>
                  </button>

                  {site.verified ? (
                    <button
                      onClick={() => onStartAuditForSite?.(site.origin)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[12px] font-medium text-[#f5f5f7] border-hairline transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-[#30d158]" />
                      <span>Start Audit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(site.verificationToken, site.id)}
                        className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-[12px] font-medium text-[#ff9f0a] border-hairline border-amber-500/20 flex items-center gap-1.5 transition-all"
                      >
                        {copiedToken === site.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>DNS Challenge</span>
                      </button>
                      <button
                        onClick={() => handleVerifyOwnership(site.id)}
                        disabled={verifyingId === site.id}
                        className="px-3 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-[12px] font-medium text-white transition-all disabled:opacity-50"
                      >
                        {verifyingId === site.id ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteWebsite(site.id)}
                    className="p-2 rounded-xl text-[#86868b] hover:text-[#ff453a] hover:bg-red-500/10 transition-all"
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
        <div className="space-y-4">
          {journeys.length === 0 ? (
            <div className="apple-vibrancy-regular rounded-3xl p-12 text-center border-hairline">
              <Compass className="w-10 h-10 text-[#86868b] mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-[#f5f5f7] mb-1">No Journeys Configured</h3>
              <p className="text-xs text-[#86868b] max-w-sm mx-auto mb-4">
                Define end-to-end task flows like account creation, search, checkout, or form submissions.
              </p>
              <button
                onClick={() => setIsJourneyModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-medium"
              >
                Create Your First Journey
              </button>
            </div>
          ) : (
            journeys.map((journey) => (
              <div
                key={journey.id}
                className="apple-vibrancy-regular rounded-3xl p-6 border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border-hairline border-blue-500/20 flex items-center justify-center text-[#0a84ff]">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[#f5f5f7]">{journey.name}</h3>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border-hairline ${
                          journey.criticality === 'critical'
                            ? 'bg-red-500/10 text-[#ff453a] border-red-500/20'
                            : 'bg-blue-500/10 text-[#0a84ff] border-blue-500/20'
                        }`}>
                          {journey.criticality}
                        </span>
                        <span className="text-[11px] font-mono text-[#86868b]">v{journey.version}</span>
                      </div>
                      <p className="text-[13px] text-[#86868b] max-w-xl">{journey.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#86868b] pt-1">
                    <span>Starting URL: <strong className="font-mono text-[#f5f5f7]">{journey.starting_url}</strong></span>
                    <span>Steps: <strong className="text-[#0a84ff]">{journey.steps?.length || 0}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onStartAuditForSite?.(journey.starting_url, journey.name)}
                    className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-[12px] font-medium text-white transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
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

      {/* 5. Journey Builder Modal */}
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
