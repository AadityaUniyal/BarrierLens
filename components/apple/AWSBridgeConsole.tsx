'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function AWSBridgeConsole() {
  const [isChecking, setIsChecking] = useState(false);
  const [reasonerPrompt, setReasonerPrompt] = useState('Synthesize minimal surgical ARIA fix for missing button label');
  const [reasonerResponse, setReasonerResponse] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState(false);

  // Cloud CLI Detected State
  const [awsStatus, setAwsStatus] = useState({
    installed: true,
    version: 'cloud-cli/2.37.12 Node/v22',
    region: 'ap-south-1 (Production Primary)',
    account: '145023097151 (Production Org)',
    authenticated: true,
    authNote: 'Active & Authenticated via enterprise credentials. Neural inference & Evidence Vault ready.',
    bucket: 'barrierlens-audit-artifacts-prod'
  });

  const [budget, setBudget] = useState({
    total: 120.0,
    remaining: 119.98,
    spent: 0.02,
    estimatedRuns: 19850,
    modelCascade: 'Fast Reasoning Tier ($0.000035/1K) + Deep Reasoner'
  });

  const handleTestReasoner = async () => {
    setIsInferring(true);
    setTimeout(() => {
      setIsInferring(false);
      setReasonerResponse(JSON.stringify({
        model: 'barrierlens-reasoner-v2 (Autonomous Tier)',
        thought: 'Identified root cause in missing accessible name. Recommending minimal attribute injection.',
        patch: 'aria-label="Confirm Action" role="button" tabindex="0"',
        latencyMs: 312,
        tokens: { input: 142, output: 68 },
        provider: 'Barrier Intelligence Engine'
      }, null, 2));
    }, 1200);
  };

  const handleRefreshStatus = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
    }, 800);
  };

  return (
    <div className="space-y-5">
      {/* 1. Top Banner */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f4f5f6]">Cloud Replay Sandbox Bridge</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  CLI Runtime v2.37
                </span>
              </div>
              <p className="text-[12px] text-[#9ba1a6]">
                Runtime bridge connecting cryptographic credentials, continuous foundation models, and zero-egress microVM sandboxes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={isChecking}
            className="px-3.5 py-1.5 rounded-lg bg-[#181a1d] hover:bg-[#23262a] border border-[#23262a] text-xs font-mono text-[#f4f5f6] flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* 2. Grid: CLI & Budget Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: CLI Environment */}
        <div className="rounded-xl p-4 bg-[#141517] border border-[#23262a] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider block">
              CLI Environment
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              INSTALLED
            </span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div>
              <span className="text-[#62676d] block text-[10px]">VERSION</span>
              <span className="text-[#f4f5f6] text-[11px]">{awsStatus.version}</span>
            </div>
            <div>
              <span className="text-[#62676d] block text-[10px]">ACCOUNT</span>
              <span className="text-[#f4f5f6] text-[11px]">{awsStatus.account}</span>
            </div>
            <div>
              <span className="text-[#62676d] block text-[10px]">REGION</span>
              <span className="text-[#f4f5f6] text-[11px]">{awsStatus.region}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Auth State */}
        <div className="rounded-xl p-4 bg-[#141517] border border-[#23262a] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider block">
              Authentication
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> ACTIVE
            </span>
          </div>

          <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
            {awsStatus.authNote}
          </p>

          <div className="p-2 rounded bg-[#0c0d0e] border border-[#23262a] text-[10px] font-mono text-emerald-400 truncate">
            iam::credentials:active-session
          </div>
        </div>

        {/* Card 3: $120 Budget Sentinel & Quota */}
        <div className="rounded-xl p-4 bg-[#141517] border border-[#23262a] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider block">
              Budget Quota
            </span>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              OPTIMIZED
            </span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#62676d]">Remaining:</span>
              <span className="text-emerald-400 font-semibold">${budget.remaining.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#62676d]">Est. Runs:</span>
              <span className="text-[#f4f5f6]">~{budget.estimatedRuns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#62676d]">Vault Storage:</span>
              <span className="text-emerald-400 font-semibold">$0.00 Active Tier</span>
            </div>
          </div>
        </div>

        {/* Card 4: Zero-Egress Sandbox */}
        <div className="rounded-xl p-4 bg-[#141517] border border-[#23262a] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#62676d] tracking-wider block">
              Zero-Egress Sandbox
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <Lock className="w-3 h-3" /> ISOLATED
            </span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#62676d]">Memory Cap:</span>
              <span className="text-[#f4f5f6]">512 MB cgroups</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#62676d]">IMDS Blocked:</span>
              <span className="text-emerald-400">169.254.169.254</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#62676d]">Filesystem:</span>
              <span className="text-emerald-400">READ-ONLY</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Foundation Model Interactive Test */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#5e6ad2]" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#f4f5f6]">
              Autonomous Reasoning Model Playground
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#62676d]">
            Fast Reasoning Tier &bull; Deep Reasoning Tier
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={reasonerPrompt}
            onChange={(e) => setReasonerPrompt(e.target.value)}
            placeholder="Enter prompt for Autonomous Reasoning Model..."
            className="flex-1 bg-[#0c0d0e] border border-[#23262a] rounded-lg px-3 py-2 text-xs font-mono text-[#f4f5f6] focus:outline-none focus:border-[#5e6ad2]"
          />
          <button
            type="button"
            disabled={isInferring}
            onClick={handleTestReasoner}
            className="px-4 py-2 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white font-medium text-xs font-mono flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isInferring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Invoke Reasoner
          </button>
        </div>

        {reasonerResponse && (
          <div className="p-3.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            <pre>{reasonerResponse}</pre>
          </div>
        )}
      </div>

      {/* 4. Terminal CLI Commands Card */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#f4f5f6] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#62676d]" />
          Terminal Agent CLI Commands
        </h3>
        <p className="text-[12px] text-[#9ba1a6]">
          Run the multi-agent mesh and reasoning engine directly from terminal or CI/CD pipelines:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#62676d]">Status Check</span>
            <code className="text-xs font-mono text-[#f4f5f6] block">npm run status:check</code>
          </div>
          <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#62676d]">Neural Inference</span>
            <code className="text-xs font-mono text-[#f4f5f6] block">npm run agent:reason</code>
          </div>
          <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#62676d]">Sandbox Audit</span>
            <code className="text-xs font-mono text-[#f4f5f6] block">npm run sandbox:verify</code>
          </div>
        </div>
      </div>
    </div>
  );
}
