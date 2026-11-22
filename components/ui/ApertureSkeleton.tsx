'use client';

import React from 'react';

interface ApertureSkeletonProps {
  variant?: 'page' | 'cards' | 'table' | 'inspector';
  lines?: number;
  className?: string;
  label?: string;
}

/**
 * Bespoke Architectural Aperture Skeleton Screen
 * Replaces generic AI gray pulse boxes with optical aperture wireframes,
 * laser coordinate sweeps, and hairline architectural grids.
 */
export function ApertureSkeleton({
  variant = 'cards',
  lines = 4,
  className = '',
  label = 'Synchronizing Ledger Telemetry...'
}: ApertureSkeletonProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#090a0d] p-6 ${className}`}>
      {/* 1. Atmospheric Grid & Subtle Coordinate Markers */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />

      {/* 2. Optical Laser Scan Wave (Continuous Refraction Sweep) */}
      <div 
        className="absolute inset-0 pointer-events-none -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 144, 255, 0.05) 50%, rgba(16, 185, 129, 0.05) 75%, transparent 100%)'
        }}
      />

      {/* 3. Variant Structure */}
      {variant === 'page' && (
        <div className="space-y-6 relative z-10">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full border border-[#0090ff]/60 border-t-transparent animate-spin" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 rounded bg-white/[0.06]" />
                <div className="h-2.5 w-24 rounded bg-white/[0.03]" />
              </div>
            </div>
            <div className="h-7 w-28 rounded-lg bg-white/[0.04] border border-white/[0.06]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((k) => (
              <div key={k} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse" />
                </div>
                <div className="h-6 w-24 rounded bg-white/[0.07]" />
                <div className="h-2 w-32 rounded bg-white/[0.03]" />
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-2">
            {Array.from({ length: lines }).map((_, idx) => (
              <div 
                key={idx} 
                className="h-12 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <div className="h-3 w-48 rounded bg-white/[0.05]" />
                </div>
                <div className="h-3 w-16 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {[1, 2, 3].map((k) => (
            <div key={k} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 rounded bg-white/[0.05]" />
                <div className="h-4 w-12 rounded bg-white/[0.04] border border-white/[0.06]" />
              </div>
              <div className="h-4 w-40 rounded bg-white/[0.07]" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded bg-white/[0.03]" />
                <div className="h-2.5 w-4/5 rounded bg-white/[0.03]" />
              </div>
              <div className="pt-2 flex justify-between border-t border-white/[0.04]">
                <div className="h-2 w-16 rounded bg-white/[0.04]" />
                <div className="h-2 w-10 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.05] text-[10px] font-mono text-neutral-500 uppercase">
            <span>Property Identifier</span>
            <span>Status</span>
            <span>Compliance Grade</span>
          </div>
          {Array.from({ length: lines }).map((_, idx) => (
            <div 
              key={idx} 
              className="h-10 rounded-lg bg-white/[0.015] border border-white/[0.04] flex items-center justify-between px-3"
            >
              <div className="h-3 w-36 rounded bg-white/[0.05]" />
              <div className="h-3 w-20 rounded bg-white/[0.03]" />
              <div className="h-3 w-12 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      )}

      {/* 4. Bottom Optical Sync Badge */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-neutral-500 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0090ff] animate-ping" />
          <span>{label}</span>
        </div>
        <span className="text-neutral-600 font-mono text-[9px] tracking-wider uppercase">
          APERTURE-CORE v2.6
        </span>
      </div>
    </div>
  );
}
