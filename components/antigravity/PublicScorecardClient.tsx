'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuditRun } from '@/lib/barrierlens/types';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export function PublicScorecardClient({ auditRun }: { auditRun: AuditRun }) {
  const criticalCount = auditRun.findings.filter((f) => f.severity === 'critical').length;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="inline-flex items-center gap-3">
          <BrandLogo size="md" showBadge={true} />
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={`/api/audit/${auditRun.id}/export?format=html`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export VPAT 2.5</span>
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0090ff] hover:bg-[#007be0] text-xs font-medium text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open Dashboard</span>
          </Link>
        </div>
      </div>

      <SpotlightCard className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#0090ff]">
              Verified Accessibility Scorecard
            </p>
            <h1 className="text-2xl font-semibold text-white mt-1 break-all">
              {auditRun.targetUrl}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{auditRun.goal}</p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] shrink-0">
            {auditRun.taskSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-300">TASK PASSED</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-mono text-rose-300">BARRIERS DETECTED</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.06]">
            <p className="text-[11px] font-mono text-slate-400">Persona</p>
            <p className="text-sm font-semibold text-white mt-1 uppercase">{auditRun.persona}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.06]">
            <p className="text-[11px] font-mono text-slate-400">Effort Ratio</p>
            <p className="text-sm font-semibold text-white mt-1 font-mono">{auditRun.effortRatio.toFixed(2)}x</p>
          </div>
          <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.06]">
            <p className="text-[11px] font-mono text-slate-400">Total Findings</p>
            <p className="text-sm font-semibold text-white mt-1 font-mono">{auditRun.findings.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#07080b] border border-white/[0.06]">
            <p className="text-[11px] font-mono text-slate-400">Critical Traps</p>
            <p className="text-sm font-semibold text-rose-400 mt-1 font-mono">{criticalCount}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0090ff]" />
            <span>Certified Findings ({auditRun.findings.length})</span>
          </h2>
          {auditRun.findings.map((f) => (
            <div
              key={f.id}
              className="p-4 rounded-xl bg-[#07080b] border border-white/[0.08] space-y-2"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-white">{f.title}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                  {f.wcagRules?.[0] || f.kind}
                </span>
              </div>
              <p className="text-xs text-slate-400">{f.summary}</p>
            </div>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
}
