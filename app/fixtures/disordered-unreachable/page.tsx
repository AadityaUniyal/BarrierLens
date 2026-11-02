'use client';

import React, { useState } from 'react';

export default function DisorderedUnreachableFixturePage() {
  const [lastAction, setLastAction] = useState<string>('None');

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col items-center p-8 font-sans">
      <header className="w-full max-w-3xl flex justify-between items-center pb-4 mb-8 border-b border-white/10">
        <div className="text-lg font-semibold tracking-tight">Data Analytics Control Panel</div>
        <span className="text-xs text-white/40">BarrierLens M3 Test Fixture</span>
      </header>

      <main className="w-full max-w-3xl bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="inline-block px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
          Injected WCAG 2.4.3 &amp; 1.3.2 Failures
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Metrics &amp; Report Management</h1>
        <p className="text-[15px] text-white/60 leading-relaxed mb-6">
          This fixture presents a 3-column by 2-row button grid where positive <code className="text-amber-300">tabindex</code> attributes deliberately scramble the sequential keyboard focus order relative to the 2D visual layout reading order, reducing Kendall&apos;s Tau well below the 0.60 threshold. An orphaned action button with <code className="text-rose-300">tabindex=&quot;-1&quot;</code> is also present in the accessibility tree but unreachable via keyboard navigation walks.
        </p>

        {/* 
          3x2 Visual Grid:
          Visual Reading Order:
            Row 1: #grid-btn-1, #grid-btn-2, #grid-btn-3
            Row 2: #grid-btn-4, #grid-btn-5, #grid-btn-6
          Positive Tabindexes (5, 1, 6, 2, 4, 3):
            #grid-btn-1: 5
            #grid-btn-2: 1
            #grid-btn-3: 6
            #grid-btn-4: 2
            #grid-btn-5: 4
            #grid-btn-6: 3
        */}
        <div className="grid grid-cols-3 gap-4 my-6" id="metrics-grid">
          <button
            id="grid-btn-1"
            tabIndex={5}
            onClick={() => setLastAction('Button 1 (Status)')}
            className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            <span className="text-[11px] font-semibold text-[#0a84ff] uppercase mb-1">Button 1 (Row 1, Col 1)</span>
            <span className="text-[15px] font-medium text-white">System Status</span>
            <span className="text-[11px] text-amber-400 mt-1">tabindex=&quot;5&quot;</span>
          </button>

          <button
            id="grid-btn-2"
            tabIndex={1}
            onClick={() => setLastAction('Button 2 (Traffic)')}
            className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            <span className="text-[11px] font-semibold text-[#0a84ff] uppercase mb-1">Button 2 (Row 1, Col 2)</span>
            <span className="text-[15px] font-medium text-white">Traffic Realtime</span>
            <span className="text-[11px] text-amber-400 mt-1">tabindex=&quot;1&quot;</span>
          </button>

          <button
            id="grid-btn-3"
            tabIndex={6}
            onClick={() => setLastAction('Button 3 (Logs)')}
            className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            <span className="text-[11px] font-semibold text-[#0a84ff] uppercase mb-1">Button 3 (Row 1, Col 3)</span>
            <span className="text-[15px] font-medium text-white">Security Logs</span>
            <span className="text-[11px] text-amber-400 mt-1">tabindex=&quot;6&quot;</span>
          </button>

          <button
            id="grid-btn-4"
            tabIndex={2}
            onClick={() => setLastAction('Button 4 (Storage)')}
            className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            <span className="text-[11px] font-semibold text-[#0a84ff] uppercase mb-1">Button 4 (Row 2, Col 1)</span>
            <span className="text-[15px] font-medium text-white">Storage Quota</span>
            <span className="text-[11px] text-amber-400 mt-1">tabindex=&quot;2&quot;</span>
          </button>

          <button
            id="grid-btn-5"
            tabIndex={4}
            onClick={() => setLastAction('Button 5 (Cache)')}
            className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            <span className="text-[11px] font-semibold text-[#0a84ff] uppercase mb-1">Button 5 (Row 2, Col 2)</span>
            <span className="text-[15px] font-medium text-white">Cache Purge</span>
            <span className="text-[11px] text-amber-400 mt-1">tabindex=&quot;4&quot;</span>
          </button>

          <button
            id="grid-btn-6"
            tabIndex={3}
            onClick={() => setLastAction('Button 6 (Cluster)')}
            className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
          >
            <span className="text-[11px] font-semibold text-[#0a84ff] uppercase mb-1">Button 6 (Row 2, Col 3)</span>
            <span className="text-[15px] font-medium text-white">Cluster Health</span>
            <span className="text-[11px] text-amber-400 mt-1">tabindex=&quot;3&quot;</span>
          </button>
        </div>

        {/* Unreachable interactive button */}
        <section className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center" aria-labelledby="unreachable-heading">
          <div>
            <h3 id="unreachable-heading" className="text-base font-semibold mb-1">Data Export Pipeline</h3>
            <p className="text-xs text-white/50">Generates encrypted CSV and JSON archives for compliance auditing.</p>
          </div>
          <button
            id="orphaned-export-btn"
            tabIndex={-1}
            onClick={() => setLastAction('Export Data Clicked')}
            className="px-5 py-2.5 rounded-xl bg-rose-500/10 border border-dashed border-rose-500/40 text-rose-300 text-sm font-medium hover:bg-rose-500/20 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
            aria-label="Export Data"
          >
            Export Data
          </button>
        </section>

        <div className="mt-6 text-xs text-white/40">
          Last Action: <span className="text-white/80">{lastAction}</span>
        </div>
      </main>
    </div>
  );
}
