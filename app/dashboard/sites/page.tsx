'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, Plus, Search, Route, Trash2 } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export default function SitesPage() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [origin, setOrigin] = useState('');
  const [name, setName] = useState('');
  const [crawlTarget, setCrawlTarget] = useState('/benchmark');
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = () => {
    fetch('/api/websites')
      .then((r) => r.json())
      .then((d) => setWebsites(Array.isArray(d?.websites) ? d.websites : []))
      .catch(() => {});
    fetch('/api/journeys')
      .then((r) => r.json())
      .then((d) => setJourneys(Array.isArray(d?.journeys) ? d.journeys : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const addWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const res = await fetch('/api/websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || 'Sign in required to register websites.');
      return;
    }
    setOrigin('');
    setName('');
    setStatusMsg('Website registered.');
    loadData();
  };

  const deleteWebsite = async (id: string) => {
    const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || 'Could not delete website.');
      return;
    }
    loadData();
  };

  const runCrawler = async () => {
    setStatusMsg('Crawling routes...');
    try {
      const res = await fetch('/api/crawler/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: crawlTarget, maxPages: 8 }),
      });
      const data = await res.json();
      setDiscovered(Array.isArray(data?.routes) ? data.routes : []);
      setStatusMsg(`Discovered ${(data?.routes || []).length} route(s).`);
    } catch {
      setStatusMsg('Crawler discovery failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
          Target Inventory &amp; CUJs
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Sites &amp; Journeys</h1>
      </div>

      {statusMsg && (
        <div role="status" className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-slate-200">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpotlightCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0090ff]" />
            <span>Registered Websites ({websites.length})</span>
          </h2>

          <form onSubmit={addWebsite} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="https://app.example.com"
              className="flex-1 px-3 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Label"
              className="sm:w-32 px-3 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs text-white focus:border-[#0090ff] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-semibold text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="space-y-2">
            {websites.map((w) => (
              <div key={w.id} className="p-3 rounded-xl bg-[#07080b] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{w.name}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{w.origin}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/studio?url=${encodeURIComponent(w.origin)}`}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] text-white"
                  >
                    Audit
                  </Link>
                  {!String(w.id).startsWith('site_sample_') && (
                    <button
                      type="button"
                      onClick={() => deleteWebsite(w.id)}
                      aria-label={`Delete ${w.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Autonomous Route Discovery</span>
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={crawlTarget}
              onChange={(e) => setCrawlTarget(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#07080b] border border-white/[0.08] text-xs font-mono text-white focus:border-[#0090ff] focus:outline-none"
            />
            <button
              type="button"
              onClick={runCrawler}
              className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-semibold"
            >
              Crawl
            </button>
          </div>
          {discovered.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {discovered.map((r, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.06] text-xs font-mono text-slate-300 truncate">
                  {r.url || r}
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-white/[0.06] space-y-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-[#0090ff]" />
              <span>Saved Critical User Journeys ({journeys.length})</span>
            </h3>
            {journeys.map((j) => (
              <div key={j.id} className="p-3 rounded-xl bg-[#07080b] border border-white/[0.06]">
                <p className="text-xs font-semibold text-white">{j.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{j.description}</p>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
