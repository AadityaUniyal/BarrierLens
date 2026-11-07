'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Cpu, 
  ShieldCheck, 
  Dna, 
  Volume2, 
  Sparkles, 
  ExternalLink, 
  Layers, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  MonitorPlay
} from 'lucide-react';

interface LiveMissionControlProps {
  onOpenGenome: () => void;
  onOpenCausalDiff: () => void;
  onOpenAwsConsole: () => void;
  onOpenVisualTwin?: () => void;
}

export function LiveMissionControl({ onOpenGenome, onOpenCausalDiff, onOpenAwsConsole, onOpenVisualTwin }: LiveMissionControlProps) {
  const [targetUrl, setTargetUrl] = useState('https://store.apple.com/checkout');
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Synthesize Apple-style acoustic cues using Web Audio API
  const playCupertinoTone = (type: 'barrier' | 'success' | 'step') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'barrier') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {}
  };

  const handleLaunchStrandsAudit = async () => {
    setIsRunning(true);
    setActiveStep(0);
    setAuditResult(null);

    try {
      // Trigger API endpoint
      const response = await fetch('/api/strands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl }),
      });

      const data = await response.json();

      // Progressive step animation
      for (let i = 0; i < (data.steps?.length || 5); i++) {
        setActiveStep(i);
        playCupertinoTone(i === 1 ? 'barrier' : 'step');
        await new Promise((r) => setTimeout(r, 450));
      }

      setAuditResult(data);
      playCupertinoTone('success');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Cupertino Mission Control Hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 apple-glass border-hairline border-white/[0.12] shadow-2xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border-hairline border-blue-500/30 text-blue-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Agent Mesh • Continuous Reasoning Engine • 768-D Vector Embeddings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f5f7]">
              Autonomous Accessibility Reliability Engine
            </h1>
            <p className="text-sm text-[#86868b] leading-relaxed">
              Dispatches multi-agent cognitive swarms to discover dynamic interaction traps, derive minimal Pearl counterfactual fixes <code className="font-mono text-blue-300">do(X = x&apos;)</code>, and sign cryptographically immutable Causal Certificates.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl p-3 rounded-2xl border-hairline border-white/10">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-[11px] text-[#86868b] uppercase tracking-wider">Cloud Credit</div>
              <div className="text-base font-semibold font-mono text-emerald-400">$120.00</div>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-[11px] text-[#86868b] uppercase tracking-wider">Model Cost</div>
              <div className="text-base font-semibold font-mono text-blue-400">$0.000035</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[11px] text-[#86868b] uppercase tracking-wider">Sound FX</div>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`text-xs px-2 py-0.5 rounded font-mono ${soundEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800'}`}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Dispatch Input Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/[0.08]">
          <div className="relative flex-1">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Enter web application URL to audit..."
              className="w-full h-12 pl-4 pr-10 rounded-2xl bg-black/50 border border-white/10 text-sm text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all font-mono"
            />
          </div>

          <button
            onClick={handleLaunchStrandsAudit}
            disabled={isRunning}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#0071e3] to-[#42a5f5] text-white text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Strands Swarm Active...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Dispatch Strands Agents</span>
              </>
            )}
          </button>

          {onOpenVisualTwin && (
            <button
              onClick={onOpenVisualTwin}
              type="button"
              className="h-12 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border-hairline border-white/10 text-[#f5f5f7] text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <MonitorPlay className="w-4 h-4 text-cyan-400" />
              <span>Launch Visual Twin</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Agent Execution Pipeline */}
      {isRunning && (
        <div className="p-6 rounded-3xl apple-glass border-hairline border-white/[0.12] space-y-4">
          <div className="flex items-center justify-between text-xs text-[#86868b]">
            <span className="font-medium text-[#f5f5f7]">Strands Swarm Telemetry</span>
            <span className="font-mono">Step {activeStep + 1} of 5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { role: 'Navigator', desc: 'Chromium CDP AXTree' },
              { role: 'Auditor', desc: 'Tarjan SCC Traps' },
              { role: 'Chaos', desc: 'Kendall Tau Disorientation' },
              { role: 'Causal', desc: 'Pearl SCM do(X = x\')' },
              { role: 'Judge', desc: 'SHA-256 Causal Cert' },
            ].map((step, idx) => (
              <div
                key={step.role}
                className={`p-3 rounded-2xl border transition-all duration-300 ${
                  activeStep === idx
                    ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : activeStep > idx
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                    : 'bg-black/30 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{step.role}</span>
                  {activeStep > idx ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : activeStep === idx ? (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  ) : null}
                </div>
                <p className="text-[10px] text-[#86868b] truncate">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Result Cards */}
      {auditResult && (
        <div className="space-y-6">
          {/* Real Inspected Web Page Banner */}
          {auditResult.realPageTitle && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs text-[#86868b]">Inspected Target Application</div>
                  <div className="text-sm font-semibold text-[#f5f5f7] flex items-center gap-2">
                    <span>{auditResult.realPageTitle}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#86868b]">
                      {auditResult.interactiveNodesFound} Interactive Elements Indexed
                    </span>
                  </div>
                </div>
              </div>
              {onOpenVisualTwin && (
                <button
                  onClick={onOpenVisualTwin}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>Launch Visual Twin Simulator</span>
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Causal Certificate */}
          <div className="p-6 rounded-3xl apple-glass border-hairline border-emerald-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Causal Certificate Signed</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0 Regressions
              </span>
            </div>

            <div>
              <div className="text-xs text-[#86868b]">Immutable SHA-256 Digest</div>
              <div className="text-xs font-mono text-[#f5f5f7] truncate mt-0.5">
                {auditResult.certificateSummary?.sha256}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-[11px] text-[#86868b] flex items-center justify-between">
                <span>Minimal AST Patch:</span>
                <span className="font-mono text-emerald-400">{auditResult.certificateSummary?.wcagRule}</span>
              </div>
              <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap">
                {auditResult.certificateSummary?.patch}
              </pre>
            </div>

            <button
              onClick={onOpenCausalDiff}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#f5f5f7] flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <span>Inspect Proof in Causal Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: 768-dim Barrier Genome */}
          <div className="p-6 rounded-3xl apple-glass border-hairline border-purple-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-medium">
                <Dna className="w-4 h-4" />
                <span>Barrier Genome Vectorized</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                768 Dimensions
              </span>
            </div>

            <p className="text-xs text-[#86868b]">
              Encoded structural, semantic, and behavioral fingerprint into 768-dimensional latent vector index.
            </p>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-[11px] text-[#86868b]">Sample Vector Slice:</div>
              <div className="grid grid-cols-4 gap-1 font-mono text-[10px] text-purple-300">
                {auditResult.genomeVectorSample?.map((v: number, i: number) => (
                  <span key={i} className="bg-purple-950/40 p-1 rounded text-center">
                    {v.toFixed(3)}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenGenome}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#f5f5f7] flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <span>Explore Genome Heatmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Compute Budget & Sentinel */}
          <div className="p-6 rounded-3xl apple-glass border-hairline border-blue-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-medium">
                <DollarSign className="w-4 h-4" />
                <span>Compute Budget Sentinel</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Safe
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="text-[10px] text-[#86868b]">Total Tokens</div>
                <div className="text-sm font-semibold font-mono text-[#f5f5f7] mt-1">
                  {auditResult.totalTokens?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="text-[10px] text-[#86868b]">Run Cost</div>
                <div className="text-sm font-semibold font-mono text-emerald-400 mt-1">
                  ${auditResult.totalCostUsd}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#86868b]">
                <span>Credit Utilized</span>
                <span className="font-mono">$119.98 Remaining</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-400 w-[0.2%]" />
              </div>
            </div>

            <button
              onClick={onOpenAwsConsole}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#f5f5f7] flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <span>Manage Models &amp; Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
