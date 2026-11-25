import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#0f1422] border border-white/[0.08] shadow-2xl space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center border border-blue-500/20">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white tracking-tight">Endpoint Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The target route does not exist in the active BarrierLens fleet registry.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-slate-200 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Cockpit</span>
        </Link>
      </div>
    </div>
  );
}
