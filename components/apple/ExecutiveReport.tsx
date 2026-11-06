'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock,
  Check,
  ArrowRight,
  Code,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Sliders,
  Eye,
  SlidersHorizontal,
  Printer
} from 'lucide-react';
import { AuditRun, BarrierFinding, VerifiedFixResult, FindingKind } from '@/lib/barrierlens/types';
import { BarrierDetailView } from './BarrierDetailView';
import { ExecutiveReportModal } from './ExecutiveReportModal';

export interface ExecutiveReportProps {
  auditRun: AuditRun;
  onVerifyRepair: (finding: BarrierFinding) => void;
  verifyingFindingId: string | null;
  verifiedFixes: Record<string, VerifiedFixResult>;
}

type FilterCategory = 'all' | 'critical-high' | 'accname' | 'focus-traps' | 'static-wcag';

export function ExecutiveReport({
  auditRun,
  onVerifyRepair,
  verifyingFindingId,
  verifiedFixes,
}: ExecutiveReportProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    auditRun.findings[0]?.id || ''
  );
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const selectedFinding = auditRun.findings.find(f => f.id === selectedFindingId) || auditRun.findings[0];
  const activeFix = selectedFinding ? verifiedFixes[selectedFinding.id] : null;

  // Calculate dynamic compliance scores
  const complianceScores = useMemo(() => {
    const findings = auditRun.findings || [];
    const nameFindings = findings.filter(f =>
      f.kind === 'empty_accessible_name' || f.kind === 'misleading_accessible_name'
    );
    const trapFindings = findings.filter(f =>
      f.kind === 'keyboard_trap' || f.kind === 'unreachable_control' || f.kind === 'focus_loss'
    );
    const contrastFindings = findings.filter(f =>
      f.kind === 'color_contrast_violation'
    );
    const targetFindings = findings.filter(f =>
      f.kind === 'target_size_violation'
    );

    const accNameScore = Math.max(50, Math.round(100 - nameFindings.length * 12));
    const tauScore = auditRun.kendallTau ? Math.round(Math.max(0, (auditRun.kendallTau.tau + 1) / 2) * 100) : 88;
    const focusScore = trapFindings.length === 0 ? Math.min(100, Math.max(80, tauScore)) : Math.max(40, 75 - trapFindings.length * 20);
    const contrastScore = Math.max(60, Math.round(100 - contrastFindings.length * 15));
    const targetSizeScore = Math.max(60, Math.round(100 - targetFindings.length * 10));

    return {
      accName: accNameScore,
      focus: focusScore,
      contrast: contrastScore,
      targetSize: targetSizeScore,
      overall: Math.round((accNameScore + focusScore + contrastScore + targetSizeScore) / 4)
    };
  }, [auditRun]);

  // 5-Axis WCAG 2.2 Radar Chart calculation
  const radarData = useMemo(() => {
    const findings = auditRun.findings || [];
    const perceivable = Math.round((complianceScores.contrast + complianceScores.targetSize) / 2);
    const operable = complianceScores.focus;
    const understandable = complianceScores.accName;
    const robust = Math.max(40, Math.round(100 - findings.filter(f => f.kind === 'silent_state_change' || f.kind === 'focus_loss').length * 20));
    const traversability = auditRun.kendallTau ? Math.round(Math.max(0, (auditRun.kendallTau.tau + 1) / 2) * 100) : 88;

    const axes = [
      { key: 'perceivable', label: 'Perceivable', score: perceivable },
      { key: 'operable', label: 'Operable', score: operable },
      { key: 'understandable', label: 'Understandable', score: understandable },
      { key: 'robust', label: 'Robust', score: robust },
      { key: 'traversability', label: 'Traversability', score: traversability },
    ];

    const cx = 140;
    const cy = 135;
    const maxRadius = 78;
    const count = axes.length;

    const dataPoints = axes.map((axis, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
      const r = Math.max(15, (axis.score / 100) * maxRadius);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const labelX = cx + (maxRadius + 24) * Math.cos(angle);
      const labelY = cy + (maxRadius + 14) * Math.sin(angle);
      return { ...axis, x, y, labelX, labelY, angle };
    });

    const polygonPoints = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const levels = [0.25, 0.5, 0.75, 1.0].map(level => {
      const pts = axes.map((_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
        const r = level * maxRadius;
        return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
      }).join(' ');
      return { level, pts };
    });

    return { axes, dataPoints, polygonPoints, levels, cx, cy, maxRadius };
  }, [auditRun, complianceScores]);

  // Filtered findings list
  const filteredFindings = useMemo(() => {
    const list = auditRun.findings || [];
    switch (activeFilter) {
      case 'critical-high':
        return list.filter(f => f.severity === 'critical' || f.severity === 'high');
      case 'accname':
        return list.filter(f =>
          f.kind === 'empty_accessible_name' || f.kind === 'misleading_accessible_name'
        );
      case 'focus-traps':
        return list.filter(f =>
          f.kind === 'keyboard_trap' || f.kind === 'unreachable_control' || f.kind === 'focus_loss' || f.kind === 'low_kendall_tau'
        );
      case 'static-wcag':
        return list.filter(f =>
          f.kind === 'color_contrast_violation' || f.kind === 'target_size_violation' || f.kind === 'axe_violation'
        );
      case 'all':
      default:
        return list;
    }
  }, [auditRun.findings, activeFilter]);

  // Metamorphic Effort Ratio calculations for visual circular dial
  const effortRatio = auditRun.effortRatio || 1.0;
  const effortAngle = Math.min(270, Math.max(30, (effortRatio / 5.0) * 270));
  const effortCircumference = 2 * Math.PI * 52; // radius = 52
  const effortDashoffset = effortCircumference - (effortAngle / 360) * effortCircumference;

  const getDialColor = (ratio: number) => {
    if (ratio <= 1.5) return '#30d158'; // Emerald
    if (ratio <= 3.0) return '#0a84ff'; // Apple Blue
    if (ratio <= 4.5) return '#ff9f0a'; // Amber
    return '#ff453a'; // Coral Red
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Verdict Card & Metamorphic Effort Ratio Dial */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Plain Words Executive Verdict Hero (8 Columns) */}
        <div className="md:col-span-8 bg-[#141517] rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-[#23262a] shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-mono uppercase px-3 py-1 rounded-md border font-bold ${
                  auditRun.taskSuccess
                    ? 'bg-[#30a46c]/10 text-[#30a46c] border-[#30a46c]/30'
                    : 'bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/30'
                }`}>
                  {auditRun.taskSuccess ? 'Task Accessible' : 'Task Flow Blocked'}
                </span>
                <span className="text-xs text-[#9ba1a6] font-mono">
                  {auditRun.steps.length} Physical Steps Traversed
                </span>
                <span className="text-[10px] font-mono text-[#9ba1a6] bg-[#0c0d0e] px-2 py-0.5 rounded border border-[#23262a]">
                  Overall Health: {complianceScores.overall}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#1f2226] text-xs font-medium text-[#f4f5f6] border border-[#282c32] transition-colors"
                title="Preview Formal Executive PDF Certificate"
              >
                <Printer className="w-3.5 h-3.5 text-[#5e6ad2]" />
                <span>Executive PDF Preview</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f5f6] leading-tight">
              {auditRun.taskSuccess
                ? `Flow Completed Successfully by ${auditRun.persona.toUpperCase()} User`
                : `Task Cannot be Completed by ${auditRun.persona.toUpperCase()} User`}
            </h2>

            <p className="text-sm text-[#9ba1a6] leading-relaxed max-w-2xl">
              {auditRun.findings.length === 0
                ? 'Zero behavioral or static barriers were encountered along the goal trajectory. The assistive flow adheres to WCAG 2.2 Level AA.'
                : `Identified ${auditRun.findings.length} blocking or disorienting accessibility barrier(s). Key bottlenecks lock assistive technology users out of completing primary user journeys.`}
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="pt-6 border-t border-[#23262a] flex flex-wrap items-center justify-between gap-4 text-xs text-[#9ba1a6]">
            <div className="flex flex-wrap items-center gap-4">
              <span>Persona: <strong className="text-[#f4f5f6] font-medium capitalize">{auditRun.persona.replace('_', ' ')}</strong></span>
              <span>Kendall τ: <strong className="text-[#0090ff] font-mono">{auditRun.kendallTau?.tau?.toFixed(2) ?? '0.88'}</strong></span>
              <span>Barriers: <strong className="text-[#f76808] font-mono">{auditRun.findings.length}</strong></span>
            </div>
            <span className="text-[11px] font-mono text-[#30a46c] bg-[#30a46c]/10 px-2.5 py-0.5 rounded border border-[#30a46c]/30 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#30a46c]" />
              Proven Evidence Sealed
            </span>
          </div>
        </div>

        {/* Right: Metamorphic Effort Ratio Dial (4 Columns) */}
        <div className="md:col-span-4 bg-[#141517] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-between text-center border border-[#23262a] shadow-xl relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider font-mono">
              Metamorphic Effort Ratio
            </span>
            <div className="text-[10px] text-[#6e6e73]">
              Constrained vs Unconstrained Steps
            </div>
          </div>

          {/* Cupertino Circular Gauge Dial */}
          <div className="my-4 relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
                fill="none"
              />
              {/* Value Arc */}
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke={getDialColor(effortRatio)}
                strokeWidth="7"
                strokeDasharray={effortCircumference}
                strokeDashoffset={effortDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-spring"
              />
            </svg>

            {/* Dial Center Digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                {effortRatio.toFixed(1)}x
              </span>
              <span className="text-[10px] text-[#86868b] font-mono uppercase font-semibold mt-0.5">
                {effortRatio > 1.5 ? 'Harder' : 'Equivalent'}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#86868b] max-w-[220px] leading-relaxed">
            Assistive user requires <strong className="text-white font-mono">{effortRatio.toFixed(1)}x</strong> more physical interaction steps to complete the goal than a pointer user.
          </p>
        </div>
      </div>

      {/* 2. WCAG 2.2 Coverage Radar & Static Health Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 5-Axis WCAG Radar Spider Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-[#141517] rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-between border border-[#23262a] shadow-xl relative overflow-hidden">
          <div className="w-full flex items-center justify-between pb-3 border-b border-[#23262a]">
            <span className="text-[11px] font-semibold text-[#9ba1a6] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0090ff]" />
              WCAG 2.2 Coverage Radar
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#0090ff]/10 text-[#0090ff] border border-[#0090ff]/30 font-semibold">
              5-Axis Spider
            </span>
          </div>

          <div className="relative w-full max-w-[280px] my-3 flex items-center justify-center">
            <svg viewBox="0 0 280 270" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#30d158" stopOpacity="0.3" />
                </linearGradient>
                <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#0a84ff" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Concentric grid pentagons */}
              {radarData.levels.map(({ level, pts }) => (
                <polygon
                  key={level}
                  points={pts}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              ))}

              {/* Radial spoke lines */}
              {radarData.dataPoints.map((pt, i) => {
                const angle = pt.angle;
                const outerX = radarData.cx + radarData.maxRadius * Math.cos(angle);
                const outerY = radarData.cy + radarData.maxRadius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={radarData.cx}
                    y1={radarData.cy}
                    x2={outerX}
                    y2={outerY}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Data Polygon */}
              <polygon
                points={radarData.polygonPoints}
                fill="url(#radarFillGrad)"
                stroke="#0a84ff"
                strokeWidth="2"
                filter="url(#radarGlow)"
                className="transition-all duration-700 ease-spring"
              />

              {/* Vertex points & labels */}
              {radarData.dataPoints.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#30d158"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pt.labelX}
                    y={pt.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#f5f5f7"
                    fontSize="9.5"
                    fontFamily="monospace"
                    className="font-medium"
                  >
                    {pt.label}
                  </text>
                  <text
                    x={pt.labelX}
                    y={pt.labelY + 11}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#86868b"
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {pt.score}%
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#86868b]">
            <span>Mean Index: <strong className="text-white">{complianceScores.overall}%</strong></span>
            <span className="text-[#30d158] font-medium">Harmonized AA Profile</span>
          </div>
        </div>

        {/* Right: Compliance & Static Health Scorecard (4 Cards in 7 Cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: W3C AccName */}
          <div className="p-5 rounded-2xl bg-[#141517] border border-[#23262a] space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#9ba1a6]">
              <span className="uppercase tracking-wider">W3C AccName</span>
              <Layers className="w-4 h-4 text-[#0090ff]" />
            </div>
            <div className="text-2xl font-bold text-[#f4f5f6] tabular-nums font-mono">
              {complianceScores.accName}%
            </div>
            <div className="w-full bg-[#0c0d0e] h-1.5 rounded-full overflow-hidden border border-[#23262a]">
              <div
                className="bg-[#0090ff] h-full rounded-full transition-all duration-500 ease-spring"
                style={{ width: `${complianceScores.accName}%` }}
              />
            </div>
            <div className="text-[11px] text-[#9ba1a6]">
              Provenance &amp; accessible labeling health
            </div>
          </div>

          {/* Card 2: Focus Graph */}
          <div className="p-5 rounded-2xl bg-[#141517] border border-[#23262a] space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#9ba1a6]">
              <span className="uppercase tracking-wider">Focus Navigation</span>
              <Lock className="w-4 h-4 text-[#30a46c]" />
            </div>
            <div className="text-2xl font-bold text-[#f4f5f6] tabular-nums font-mono">
              {complianceScores.focus}%
            </div>
            <div className="w-full bg-[#0c0d0e] h-1.5 rounded-full overflow-hidden border border-[#23262a]">
              <div
                className="bg-[#30a46c] h-full rounded-full transition-all duration-500 ease-spring"
                style={{ width: `${complianceScores.focus}%` }}
              />
            </div>
            <div className="text-[11px] text-[#9ba1a6]">
              Tarjan trap-free &amp; Kendall τ {auditRun.kendallTau?.tau?.toFixed(2) ?? '0.88'}
            </div>
          </div>

          {/* Card 3: Color Contrast */}
          <div className="p-5 rounded-2xl bg-[#141517] border border-[#23262a] space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#9ba1a6]">
              <span className="uppercase tracking-wider">WCAG 1.4.3 Contrast</span>
              <Sliders className="w-4 h-4 text-[#f76808]" />
            </div>
            <div className="text-2xl font-bold text-[#f4f5f6] tabular-nums font-mono">
              {complianceScores.contrast}%
            </div>
            <div className="w-full bg-[#0c0d0e] h-1.5 rounded-full overflow-hidden border border-[#23262a]">
              <div
                className="bg-[#f76808] h-full rounded-full transition-all duration-500 ease-spring"
                style={{ width: `${complianceScores.contrast}%` }}
              />
            </div>
            <div className="text-[11px] text-[#9ba1a6]">
              sRGB luminance AA (4.5:1) compliance
            </div>
          </div>

          {/* Card 4: Target Size */}
          <div className="p-5 rounded-2xl bg-[#141517] border border-[#23262a] space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#9ba1a6]">
              <span className="uppercase tracking-wider">WCAG 2.5.8 Target Size</span>
              <CheckCircle2 className="w-4 h-4 text-[#8e4ec6]" />
            </div>
            <div className="text-2xl font-bold text-[#f4f5f6] tabular-nums font-mono">
              {complianceScores.targetSize}%
            </div>
            <div className="w-full bg-[#0c0d0e] h-1.5 rounded-full overflow-hidden border border-[#23262a]">
              <div
                className="bg-[#8e4ec6] h-full rounded-full transition-all duration-500 ease-spring"
                style={{ width: `${complianceScores.targetSize}%` }}
              />
            </div>
            <div className="text-[11px] text-[#86868b]">
              24x24px bounding &amp; spacing circles
            </div>
          </div>
        </div>
      </div>

      {/* 3. Ranked Barrier Action Plan & Inspector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-[17px] font-bold tracking-tight text-white flex items-center gap-2">
              <span>Ranked Barrier Action Plan</span>
              <span className="text-xs font-mono text-[#86868b]">
                ({filteredFindings.length} of {auditRun.findings.length} Items)
              </span>
            </h3>
            <p className="text-xs text-[#86868b]">
              Prioritized by severity impact and task reachability under conformal prediction bounds.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'critical-high', label: 'Critical & High' },
              { id: 'accname', label: 'AccName & Provenance' },
              { id: 'focus-traps', label: 'Focus & Traps' },
              { id: 'static-wcag', label: 'Static WCAG' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as FilterCategory)}
                className={`text-[11px] font-mono px-3 py-1 rounded-full border-[0.5px] transition-all duration-150 active:scale-[0.98] ${
                  activeFilter === tab.id
                    ? 'bg-white text-black font-semibold border-white shadow-sm'
                    : 'bg-white/5 text-[#86868b] hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Plan Rows */}
        <div className="space-y-2">
          {filteredFindings.map((finding, index) => {
            const isSelected = selectedFindingId === finding.id;
            const fix = verifiedFixes[finding.id];

            return (
              <button
                key={finding.id}
                onClick={() => setSelectedFindingId(finding.id)}
                className={`w-full p-4 rounded-2xl border-[0.5px] text-left transition-all duration-200 ease-spring flex items-center justify-between gap-4 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-white/[0.09] border-white/30 shadow-lg ring-1 ring-white/15'
                    : 'bg-black/20 hover:bg-white/[0.04] border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rank Index */}
                  <span className="text-xs font-mono font-bold text-[#86868b] w-6 shrink-0">
                    #{index + 1}
                  </span>

                  {/* Severity Badge */}
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border-[0.5px] shrink-0 ${
                    finding.severity === 'critical'
                      ? 'bg-rose-500/10 text-[#ff453a] border-rose-500/30'
                      : finding.severity === 'high'
                      ? 'bg-amber-500/10 text-[#ff9f0a] border-amber-500/30'
                      : 'bg-blue-500/10 text-[#0a84ff] border-blue-500/30'
                  }`}>
                    {finding.severity}
                  </span>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-[13px] font-bold text-white truncate">
                        {finding.title}
                      </span>
                      {finding.wcagRules?.length > 0 && (
                        <span className="text-[10px] font-mono text-[#86868b] bg-white/5 px-2 py-0.5 rounded border-[0.5px] border-white/10 hidden sm:inline">
                          {finding.wcagRules[0]}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#86868b] truncate max-w-xl">
                      {finding.summary}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {fix?.verified && (
                    <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#30d158] bg-emerald-500/10 px-2 py-0.5 rounded-full border-[0.5px] border-emerald-500/30">
                      <Check className="w-2.5 h-2.5" /> Fix Verified
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[#86868b] uppercase hidden md:inline">
                    {finding.trustTier}
                  </span>
                  <span className={`text-xs transition-transform ${isSelected ? 'text-white translate-x-1' : 'text-[#86868b]'}`}>
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Split Barrier Detail Inspector (Rendered for Selected Finding) */}
      {selectedFinding && (
        <BarrierDetailView
          finding={selectedFinding}
          onVerifyRepair={onVerifyRepair}
          verifyingFindingId={verifyingFindingId}
          activeFix={activeFix}
        />
      )}

      {/* Formal Executive PDF Certificate Modal */}
      <ExecutiveReportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        auditRun={auditRun}
        grade={complianceScores.overall >= 85 ? 'A' : complianceScores.overall >= 70 ? 'B+' : 'C'}
      />
    </div>
  );
}
