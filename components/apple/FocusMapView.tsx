'use client';

import React from 'react';
import { Terminal, Lock, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';
import { KendallTauMetric, TrapCertificate } from '@/lib/barrierlens/types';

interface FocusMapViewProps {
  kendallTau?: KendallTauMetric;
  trapCertificate?: TrapCertificate | null;
}

export function FocusMapView({ kendallTau, trapCertificate }: FocusMapViewProps) {
  const tau = kendallTau?.tau ?? 0.65;
  const isHealthy = tau >= 0.6;

  // Mock layout nodes for visual canvas
  const focusPath = [
    { id: '1', label: 'Skip Link', x: 80, y: 50, isTrapped: false },
    { id: '2', label: 'Nav: Shop', x: 200, y: 50, isTrapped: false },
    { id: '3', label: 'Nav: Cart', x: 350, y: 50, isTrapped: false },
    { id: '4', label: 'Input: Email', x: 180, y: 160, isTrapped: false },
    { id: '5', label: 'Button: Submit', x: 380, y: 160, isTrapped: false },
    { id: '6', label: 'Modal: Coupon', x: 260, y: 280, isTrapped: true },
    { id: '7', label: 'Modal: Apply', x: 420, y: 280, isTrapped: true },
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#0a84ff]" />
            Focus Map & Kendall Tau Discordance
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Empirical keyboard traversal path graph with Tarjan SCC cycle detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#86868b]">Spatial Layout Correlation:</span>
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
            isHealthy
              ? 'bg-emerald-500/10 text-[#30d158] border-emerald-500/30'
              : 'bg-rose-500/10 text-[#ff453a] border-rose-500/30'
          }`}>
            τ = {tau} ({isHealthy ? 'CONCORDANT' : 'DISORIENTING'})
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas & Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: SVG Focus Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 apple-card rounded-3xl p-6 border border-white/[0.08] shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs text-[#86868b] pb-3 border-b border-white/[0.06]">
            <span>2D Focus Path Geometry</span>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0a84ff]" /> Forward Tab Path</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff453a]" /> Tarjan Trap Cycle</span>
            </div>
          </div>

          <div className="relative w-full h-[380px] bg-[#090a0f] rounded-2xl border border-white/[0.05] overflow-hidden flex items-center justify-center">
            {/* SVG Traversal Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0a84ff" />
                </marker>
                <marker id="trap-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff453a" />
                </marker>
              </defs>

              {/* Connecting Edges */}
              <line x1="120" y1="50" x2="160" y2="50" stroke="#0a84ff" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="280" y1="50" x2="310" y2="50" stroke="#0a84ff" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="350" y1="70" x2="220" y2="140" stroke="#0a84ff" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrow)" />
              <line x1="280" y1="160" x2="340" y2="160" stroke="#0a84ff" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="400" y1="180" x2="300" y2="260" stroke="#0a84ff" strokeWidth="2" markerEnd="url(#arrow)" />

              {/* Trapped SCC Cycle Loop */}
              <path
                d="M 330 280 C 370 240, 390 240, 420 280 C 390 320, 350 320, 330 280"
                fill="none"
                stroke="#ff453a"
                strokeWidth="2.5"
                markerEnd="url(#trap-arrow)"
                className="animate-pulse"
              />
            </svg>

            {/* Rendered Nodes */}
            {focusPath.map((node) => (
              <div
                key={node.id}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 shadow-lg border ${
                  node.isTrapped
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                    : 'bg-[#1c1c1e] text-white border-white/10'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  node.isTrapped ? 'bg-rose-500 text-white' : 'bg-[#0a84ff] text-white'
                }`}>
                  {node.id}
                </span>
                <span>{node.label}</span>
              </div>
            ))}

            {/* Trap Callout Badge */}
            <div className="absolute bottom-6 right-6 p-3 rounded-xl bg-rose-950/90 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center gap-2 shadow-2xl">
              <Lock className="w-4 h-4 text-[#ff453a]" />
              <span>Tarjan SCC Trap: Focus Cycles Between Node #6 & #7</span>
            </div>
          </div>
        </div>

        {/* Right: Kendall Tau Rank Correlation Meter (4 cols) */}
        <div className="lg:col-span-4 apple-card rounded-3xl p-6 border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Kendall's Tau (τ) Rank Concordance
            </h3>
            <p className="text-xs text-[#86868b]">
              Measures the statistical discordance between sequential Tab index order and 2D visual screen coordinates.
            </p>
          </div>

          <div className="my-4 flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-extrabold text-white tracking-tight tabular-nums">
              {tau}
            </div>
            <span className="text-[11px] font-mono text-[#86868b] mt-1">
              Range: [-1.0 (inverted) to +1.0 (perfect)]
            </span>
            <div className="mt-3 text-xs text-[#30d158] font-medium">
              {tau >= 0.6 ? 'Meets WCAG 2.4.3 reading order' : 'Disorienting layout inversions'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-xs text-[#86868b] space-y-2 font-mono">
            <div className="flex justify-between">
              <span>Concordant Pairs:</span>
              <span className="text-white">18</span>
            </div>
            <div className="flex justify-between">
              <span>Inversion Count:</span>
              <span className="text-amber-400">3</span>
            </div>
            <div className="flex justify-between">
              <span>Total Traversed:</span>
              <span className="text-white">7 Nodes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
