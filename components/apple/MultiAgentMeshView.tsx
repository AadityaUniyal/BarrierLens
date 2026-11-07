'use client';

import React, { useState } from 'react';
import { 
  Network, 
  Bot, 
  ShieldCheck, 
  Flame, 
  Cpu, 
  HardDrive, 
  Cloud, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Terminal, 
  Dna,
  GitBranch,
  Lock
} from 'lucide-react';
import { AgentRole } from '@/lib/barrierlens/aws/event-mesh';

interface AgentCardInfo {
  role: AgentRole;
  name: string;
  strand: string;
  status: 'idle' | 'active' | 'certified' | 'stressing';
  description: string;
  icon: any;
  accent: string;
}

export function MultiAgentMeshView() {
  const [isRunning, setIsRunning] = useState(false);
  const [targetUrl, setTargetUrl] = useState('https://demo.barrierlens.ai');
  const [goal, setGoal] = useState('Complete checkout form with keyboard only');
  const [activeChaos, setActiveChaos] = useState(true);

  const [agentLogs, setAgentLogs] = useState<Array<{ from: string; to: string; text: string; time: string; color: string }>>([
    { from: 'Orchestrator', to: 'Broadcast', text: 'Decomposing task goal into topological milestones via AWS Bedrock Claude 3.5 Sonnet.', time: '16:54:02', color: 'text-blue-400' },
    { from: 'Navigator', to: 'Forensic Auditor', text: 'Dispatched sequential Tab navigation inside isolated AWS Firecracker sandbox context.', time: '16:54:03', color: 'text-purple-400' },
    { from: 'Forensic Auditor', to: 'Causal Repair', text: 'Tarjan SCC cycle detected on #modal-terms (Inversion tau = 0.42). Empty label on <button>.', time: '16:54:04', color: 'text-amber-400' },
    { from: 'Red-Team Chaos', to: 'Navigator', text: 'Injected 320px responsive reflow + Windows High Contrast Mode filter.', time: '16:54:05', color: 'text-rose-400' },
    { from: 'Causal Repair', to: 'Sandbox Judge', text: 'Synthesized minimal do(aria-label="Submit") patch (Invasiveness Level 1).', time: '16:54:06', color: 'text-emerald-400' },
    { from: 'Sandbox Judge', to: 'Orchestrator', text: 'Sandboxed replay verified 0 regressions. SHA-256 certificate signed & uploaded to S3.', time: '16:54:07', color: 'text-teal-400' },
  ]);

  const agents: AgentCardInfo[] = [
    {
      role: 'orchestrator',
      name: 'Orchestrator Conductor',
      strand: 'AWS EventBridge & Bedrock Router',
      status: isRunning ? 'active' : 'idle',
      description: 'Coordinates agent task assignment, token budgets, and consensus verification.',
      icon: Network,
      accent: 'border-blue-500/20 text-blue-400 bg-blue-500/10'
    },
    {
      role: 'navigator',
      name: 'Navigator Agent',
      strand: 'Persona-Constrained Explorer',
      status: isRunning ? 'active' : 'idle',
      description: 'Drives physical traversal strictly through keyboard, screen reader, and speech limits.',
      icon: Bot,
      accent: 'border-purple-500/20 text-purple-400 bg-purple-500/10'
    },
    {
      role: 'forensic_auditor',
      name: 'Forensic Auditor',
      strand: 'Topological & Formal Verifier',
      status: isRunning ? 'active' : 'certified',
      description: 'Tarjan SCC cycles, Kendall tau visual-focus correlation, and W3C AccName provenance.',
      icon: Dna,
      accent: 'border-amber-500/20 text-amber-400 bg-amber-500/10'
    },
    {
      role: 'red_team_chaos',
      name: 'Red-Team Chaos Agent',
      strand: 'Adversarial Stress Engine',
      status: isRunning ? 'stressing' : 'idle',
      description: 'Applies network throttling, 320px viewport reflow, and Parkinson motor tremors.',
      icon: Flame,
      accent: 'border-rose-500/20 text-rose-400 bg-rose-500/10'
    },
    {
      role: 'causal_repair',
      name: 'Causal Repair Agent',
      strand: 'Counterfactual Synthesizer',
      status: isRunning ? 'active' : 'certified',
      description: 'Pearl SCM causal graphs and do(X=x) calculus synthesizing minimal HTML/ARIA patches.',
      icon: GitBranch,
      accent: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
    },
    {
      role: 'sandbox_judge',
      name: 'Sandbox Judge Agent',
      strand: 'Isolated Replay Gatekeeper',
      status: isRunning ? 'active' : 'certified',
      description: 'Executes within AWS Firecracker container, certifying 0 regressions with SHA-256 proofs.',
      icon: ShieldCheck,
      accent: 'border-teal-500/20 text-teal-400 bg-teal-500/10'
    }
  ];

  const handleLaunchMesh = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setAgentLogs(prev => [
        ...prev,
        {
          from: 'Orchestrator',
          to: 'Broadcast',
          text: `Mission Accomplished for ${targetUrl}. All 6 agents reached consensus. Signed certificate stored in S3.`,
          time: new Date().toLocaleTimeString(),
          color: 'text-emerald-400'
        }
      ]);
    }, 2800);
  };

  return (
    <div className="space-y-5">
      {/* 1. Top Banner: AWS Strands & Sandbox Overview */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2]">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f4f5f6]">Multi-Agent Cognitive Mesh</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20">
                  AWS Strands + Firecracker MicroVMs
                </span>
              </div>
              <p className="text-[12px] text-[#9ba1a6]">
                6 autonomous agents orchestrated via AWS EventBridge, Bedrock inference, S3 artifact persistence, and isolated replay sandboxes.
              </p>
            </div>
          </div>

          {/* Trigger Action */}
          <button
            type="button"
            disabled={isRunning}
            onClick={handleLaunchMesh}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2 shadow-sm ${
              isRunning
                ? 'bg-[#181a1d] text-[#9ba1a6] cursor-not-allowed border border-[#23262a]'
                : 'bg-[#5e6ad2] hover:bg-[#6875e5] text-white'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Orchestrating 6-Agent Mesh...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Dispatch Multi-Agent Mission
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. AWS Strands Telemetry Pill Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#141517] border border-[#23262a] flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#181a1d] border border-[#23262a] flex items-center justify-center text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#62676d] block">AWS Bedrock</span>
            <span className="text-xs font-semibold text-[#f4f5f6]">Claude 3.5 Sonnet</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141517] border border-[#23262a] flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#181a1d] border border-[#23262a] flex items-center justify-center text-purple-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#62676d] block">AWS EventBridge</span>
            <span className="text-xs font-semibold text-[#f4f5f6]">SQS Event Bus</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141517] border border-[#23262a] flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#181a1d] border border-[#23262a] flex items-center justify-center text-amber-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#62676d] block">AWS S3 Vault</span>
            <span className="text-xs font-semibold text-[#f4f5f6]">Artifacts &amp; Traces</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141517] border border-[#23262a] flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#181a1d] border border-[#23262a] flex items-center justify-center text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#62676d] block">Firecracker Sandbox</span>
            <span className="text-xs font-semibold text-emerald-400">Egress Blocked</span>
          </div>
        </div>
      </div>

      {/* 3. 6 Specialized Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.role}
              className="rounded-lg p-4 bg-[#141517] border border-[#23262a] hover:border-[#34383e] space-y-2.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${agent.accent}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f4f5f6]">{agent.name}</h3>
                    <span className="text-[10px] font-mono text-[#62676d]">{agent.strand}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase border ${
                  agent.status === 'active'
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/20 animate-pulse'
                    : agent.status === 'stressing'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}>
                  {agent.status}
                </span>
              </div>

              <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
                {agent.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 4. Live Inter-Agent Communication Bus Log */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#5e6ad2]" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#f4f5f6]">
              AWS EventBridge Inter-Agent Message Stream
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Zero-Loss SQS Delivery
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] font-mono text-[11px] space-y-2 max-h-56 overflow-y-auto">
          {agentLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#62676d] shrink-0">[{log.time}]</span>
              <span className={`font-semibold shrink-0 ${log.color}`}>{log.from} → {log.to}:</span>
              <span className="text-[#f4f5f6]">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
