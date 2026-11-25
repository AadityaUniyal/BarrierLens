'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled BarrierLens Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#0f1422] border border-rose-500/30 shadow-2xl space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white tracking-tight">Diagnostics Exception Caught</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error.message || 'An unexpected error occurred while executing the accessibility engine.'}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-slate-200 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Recover Session</span>
        </button>
      </div>
    </div>
  );
}
