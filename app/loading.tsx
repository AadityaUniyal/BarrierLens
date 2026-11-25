import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(0,144,255,0.3)]">
          <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-mono uppercase tracking-wider text-white/50">BarrierLens Verification Cockpit</p>
        <p className="text-[11px] text-slate-500">Hydrating sensory constraints &amp; Tarjan proof engines...</p>
      </div>
    </div>
  );
}
