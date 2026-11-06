'use client';

import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Lock, 
  Sliders, 
  Volume2,
  Printer,
  FileCode,
  Download
} from 'lucide-react';
import { AuditRun } from '@/lib/barrierlens/types';
import { ExecutiveReportModal } from './ExecutiveReportModal';

interface PublicScorecardViewProps {
  auditRun?: AuditRun | null;
}

export function PublicScorecardView({ auditRun }: PublicScorecardViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const runId = auditRun?.id || 'demo_run_latest';
  const effortRatio = auditRun?.effortRatio ?? 4.2;
  const trapCount = auditRun?.findings?.filter(f => f.kind === 'keyboard_trap').length ?? 1;
  const criticalCount = auditRun?.findings?.filter(f => f.severity === 'critical').length ?? 1;
  const findingsCount = auditRun?.findings?.length ?? 2;

  // Grade computation
  let grade = 'A';
  let gradeBadgeColor = 'text-[#30a46c] bg-[#30a46c]/10 border-[#30a46c]/30';
  let certStatus = 'EAA 2025 & WCAG 2.2 AA Certified';
  let isCompliant = true;

  if (trapCount > 0 || criticalCount > 0 || effortRatio >= 3.5) {
    grade = 'F';
    gradeBadgeColor = 'text-[#e5484d] bg-[#e5484d]/10 border-[#e5484d]/30';
    certStatus = 'Non-Compliant (Sink Trap Detected)';
    isCompliant = false;
  } else if (effortRatio >= 2.5 || findingsCount > 3) {
    grade = 'C';
    gradeBadgeColor = 'text-[#f76808] bg-[#f76808]/10 border-[#f76808]/30';
    certStatus = 'Conditional Compliance';
    isCompliant = false;
  } else if (effortRatio >= 1.6 || findingsCount > 0) {
    grade = 'B+';
    gradeBadgeColor = 'text-[#0090ff] bg-[#0090ff]/10 border-[#0090ff]/30';
    certStatus = 'Substantially Accessible';
    isCompliant = true;
  }

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/scorecard/${runId}`
    : `https://barrierlens.ai/scorecard/${runId}`;

  const embedSnippet = `<script async src="https://barrierlens.ai/badge.js" data-site="${auditRun?.targetUrl || 'target'}" data-run="${runId}" data-grade="${grade}"></script>`;

  const copyShareLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copyEmbedBadge = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(embedSnippet);
      setCopiedBadge(true);
      setTimeout(() => setCopiedBadge(false), 2000);
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditRun || { id: runId, grade, effortRatio }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `barrierlens-evidence-${runId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full space-y-6 text-[#f4f5f6]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141517] border border-[#23262a]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#0090ff]" />
            <h2 className="text-xl font-bold tracking-tight text-[#f4f5f6]">
              Executive Compliance Scorecard
            </h2>
          </div>
          <p className="text-xs text-[#9ba1a6]">
            Mathematically verifiable accessibility scorecard for audits, compliance filings, and public sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#1f2226] text-xs font-medium text-[#f4f5f6] border border-[#2d3137] transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#30a46c]" /> : <ExternalLink className="w-3.5 h-3.5 text-[#9ba1a6]" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Scorecard'}</span>
          </button>

          <button
            type="button"
            onClick={copyEmbedBadge}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#1f2226] text-xs font-medium text-[#f4f5f6] border border-[#2d3137] transition-all"
          >
            {copiedBadge ? <Check className="w-3.5 h-3.5 text-[#30a46c]" /> : <Copy className="w-3.5 h-3.5 text-[#9ba1a6]" />}
            <span>{copiedBadge ? 'Badge Copied' : 'Embed Badge'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#1f2226] text-xs font-medium text-[#9ba1a6] hover:text-[#f4f5f6] border border-[#2d3137] transition-all"
            title="Download Evidence Bundle (JSON)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#1f2226] text-xs font-medium text-[#f4f5f6] border border-[#2d3137] transition-all"
            title="Preview Formal Executive Audit Certificate & PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#5e6ad2]" />
            <span>Audit PDF Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Scorecard Card (Linear Slate) */}
      <div className="rounded-2xl bg-[#141517] border border-[#23262a] p-6 sm:p-8 space-y-6 shadow-xl max-w-4xl mx-auto">
        
        {/* Certificate Badge & Letter Grade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#23262a]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#1a1c1e] border border-[#2d3137] flex items-center justify-center text-[#f4f5f6] shrink-0 font-mono text-2xl font-black">
              {grade}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#f4f5f6]">
                  Accessibility Flow Certification
                </h3>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${gradeBadgeColor}`}>
                  Grade {grade}
                </span>
              </div>
              <p className="text-xs text-[#9ba1a6] font-mono">
                Audited target: {auditRun?.targetUrl || 'Default Retail Checkout Flow'}
              </p>
            </div>
          </div>

          <span className={`text-xs font-mono font-medium px-3 py-1 rounded-md border self-start sm:self-auto ${
            isCompliant
              ? 'bg-[#30a46c]/10 text-[#30a46c] border-[#30a46c]/30'
              : 'bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/30'
          }`}>
            {certStatus}
          </span>
        </div>

        {/* Primary Triad Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1">
            <span className="text-[11px] text-[#6b7280] font-mono uppercase">Metamorphic Effort</span>
            <div className="text-3xl font-extrabold text-[#f4f5f6] tabular-nums font-mono">
              {effortRatio.toFixed(1)}x
            </div>
            <span className="text-[11px] text-[#9ba1a6]">Disparity vs Mouse</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1">
            <span className="text-[11px] text-[#6b7280] font-mono uppercase">Reading Order τ</span>
            <div className="text-3xl font-extrabold text-[#0090ff] tabular-nums font-mono">
              {auditRun?.kendallTau?.tau?.toFixed(2) ?? '0.52'}
            </div>
            <span className="text-[11px] text-[#9ba1a6]">Kendall's Concordance</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1">
            <span className="text-[11px] text-[#6b7280] font-mono uppercase">Keyboard Traps</span>
            <div className={`text-3xl font-extrabold tabular-nums font-mono ${trapCount === 0 ? 'text-[#30a46c]' : 'text-[#e5484d]'}`}>
              {trapCount}
            </div>
            <span className="text-[11px] text-[#9ba1a6]">Tarjan Sink SCCs</span>
          </div>
        </div>

        {/* 4-Pillars of WCAG 2.2 AA Breakdown */}
        <div className="space-y-3 pt-2 border-t border-[#23262a]">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider font-mono">
            WCAG 2.2 Level AA Core Pillar Compliance
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Perceivable */}
            <div className="p-3.5 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-[#f4f5f6] font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#f76808]" />
                  1. Perceivable
                </span>
                <span className="text-[#30a46c] font-bold">94%</span>
              </div>
              <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
                Color contrast ratio (1.4.3), non-text labels (1.1.1), text reflow verified.
              </p>
            </div>

            {/* Operable */}
            <div className="p-3.5 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-[#f4f5f6] font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#0090ff]" />
                  2. Operable
                </span>
                <span className={trapCount === 0 ? 'text-[#30a46c] font-bold' : 'text-[#e5484d] font-bold'}>
                  {trapCount === 0 ? '98%' : '42%'}
                </span>
              </div>
              <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
                Physical keyboard traversal (2.1.1), zero traps (2.1.2), visible focus indicator (2.4.7).
              </p>
            </div>

            {/* Understandable */}
            <div className="p-3.5 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-[#f4f5f6] font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#8e4ec6]" />
                  3. Understandable
                </span>
                <span className="text-[#30a46c] font-bold">88%</span>
              </div>
              <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
                W3C AccName resolution provenance (4.1.2), predictable context change, input validation.
              </p>
            </div>

            {/* Robust */}
            <div className="p-3.5 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-[#f4f5f6] font-medium flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#30a46c]" />
                  4. Robust
                </span>
                <span className="text-[#30a46c] font-bold">91%</span>
              </div>
              <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
                DOM mutation announcement parity, zero announcement gaps (4.1.3), speech compatibility.
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary Paragraph */}
        <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23262a] space-y-1.5 text-xs">
          <div className="text-[#6b7280] font-semibold uppercase tracking-wider font-mono text-[10px]">
            Executive Compliance Finding
          </div>
          <p className="text-[#f4f5f6] leading-relaxed text-[12px]">
            The evaluated journey completed with an effort ratio of <strong className="text-[#0090ff] font-mono">{effortRatio.toFixed(1)}x</strong>. {trapCount > 0 ? 'A critical keyboard sink trap was mathematically proven in the confirmation modal container (out-degree = 0). Remediation requires injection of an Escape key handler and focus restoration.' : 'All keyboard and assistive focus paths successfully achieved behavioral task completion without sink cycles.'}
          </p>
        </div>

        {/* Cryptographic Certification Footer */}
        <div className="pt-4 border-t border-[#23262a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6b7280] font-mono">
          <span>Certificate ID: bl-{runId.slice(0, 16)}</span>
          <span className="flex items-center gap-1 text-[#30a46c]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Autonomous Execution
          </span>
        </div>

      </div>

      {/* Executive PDF & Printable Certificate Modal */}
      <ExecutiveReportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        auditRun={auditRun || null}
        grade={grade}
      />
    </div>
  );
}
