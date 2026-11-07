'use client';

import React, { useState } from 'react';
import { BarrierGenome } from '@/lib/barrierlens/genome/barrier-encoder';
import { TransferInsight } from '@/lib/barrierlens/genome/cross-site-transfer';
import { GenomeEvolutionPoint } from '@/lib/barrierlens/genome/genome-store';
import { Dna, Globe, Sparkles, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

interface BarrierGenomeVizProps {
  genomes?: BarrierGenome[];
  transferInsights?: TransferInsight[];
  evolutionTimeline?: GenomeEvolutionPoint[];
}

export function BarrierGenomeViz({
  genomes = [],
  transferInsights = [],
  evolutionTimeline = []
}: BarrierGenomeVizProps) {
  const [selectedGenome, setSelectedGenome] = useState<BarrierGenome | null>(genomes[0] || null);

  // Fallback demo mock if empty
  const activeGenome = selectedGenome || {
    findingId: 'gen_sample_01',
    findingKind: 'keyboard_trap',
    vector: Array.from({ length: 768 }, (_, i) => Math.sin(i / 12) * 0.5 + 0.5),
    magnitude: 1.0,
    timestamp: new Date().toISOString(),
    context: {
      goal: 'Complete checkout flow without mouse',
      persona: 'keyboard',
      targetUrl: 'https://store.apple.com/bag',
      effortRatio: 3.4,
      taskSuccess: false,
      maxSteps: 15,
      stepCount: 12
    },
    metadata: {
      title: 'Deterministic Focus Trap in Modal Overlay',
      trustTier: 'proven',
      severityScore: 9.4,
      wcagRules: ['WCAG 2.1.2 No Keyboard Trap']
    }
  } as BarrierGenome;

  const mockInsights: TransferInsight[] = transferInsights.length > 0 ? transferInsights : [
    {
      matchedFindingId: 'find_nord_99',
      sourceDomain: 'checkout.nordstrom.com',
      findingKind: 'keyboard_trap',
      similarityScore: 0.94,
      provenSolution: 'Add onKeyDown Escape key listener and trap boundary wrap handler.',
      confidence: 0.96,
      explanation: '94% Structural Genome Match: identical modal dialog focus trap sequence.'
    },
    {
      matchedFindingId: 'find_nike_42',
      sourceDomain: 'nike.com/cart',
      findingKind: 'keyboard_trap',
      similarityScore: 0.88,
      provenSolution: 'Ensure focus shifts to primary dismiss button upon container mount.',
      confidence: 0.91,
      explanation: '88% Behavioral Alignment: persistent focus cycling without exit transition.'
    }
  ];

  return (
    <div className="space-y-5">
      {/* 1. Top Banner */}
      <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2]">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f4f5f6]">Barrier Genome</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20">
                  768-DIM Vector Embeddings
                </span>
              </div>
              <p className="text-[12px] text-[#9ba1a6]">
                Learned vector embeddings capturing structural, semantic, and behavioral barrier DNA across the web.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-md bg-[#181a1d] border border-[#23262a] text-xs font-mono text-[#9ba1a6]">
              Dimensions: <span className="text-[#f4f5f6]">768</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-[#181a1d] border border-[#23262a] text-xs font-mono text-[#9ba1a6]">
              Metric: <span className="text-[#30d158]">&lt;=&gt; Cosine HNSW</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Dense Vector Heatmap */}
        <div className="lg:col-span-2 rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#f4f5f6] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#5e6ad2]" />
                Genome Vector Heatmap (192 × 4 Feature Blocks)
              </h3>
              <p className="text-[12px] text-[#9ba1a6] mt-0.5">
                Dense projection of structural, semantic, behavioral, and contextual latent dimensions.
              </p>
            </div>
            <span className="text-xs font-mono text-[#9ba1a6]">
              |v| = {activeGenome.magnitude.toFixed(2)}
            </span>
          </div>

          {/* Visual Vector Grid */}
          <div className="p-3.5 rounded-lg bg-[#0c0d0e] border border-[#23262a] space-y-2.5">
            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-[#62676d] border-b border-[#23262a] pb-2">
              <span className="text-blue-400">0-191 Structural</span>
              <span className="text-purple-400">192-383 Semantic</span>
              <span className="text-amber-400">384-575 Behavioral</span>
              <span className="text-emerald-400">576-767 Contextual</span>
            </div>

            <div className="grid grid-cols-[repeat(48,minmax(0,1fr))] gap-1 h-24 overflow-hidden rounded">
              {activeGenome.vector.slice(0, 384).map((val, idx) => {
                let colorClass = 'bg-blue-500';
                if (idx >= 192) colorClass = 'bg-purple-500';

                const opacity = Math.min(1.0, Math.max(0.12, Math.abs(val)));
                return (
                  <div
                    key={idx}
                    className={`h-full rounded-sm transition-all duration-200 ${colorClass}`}
                    style={{ opacity }}
                    title={`Dim ${idx}: ${val.toFixed(4)}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#9ba1a6] pt-1">
              <span>Unit-Normalized L2 Sphere</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Deterministic Murmur3 Projection
              </span>
            </div>
          </div>

          {/* Genome Metadata Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-[#181a1d] border border-[#23262a]">
              <span className="text-[10px] font-mono text-[#62676d] uppercase block">Kind</span>
              <span className="text-xs font-semibold text-[#f4f5f6] capitalize">
                {activeGenome.findingKind.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#181a1d] border border-[#23262a]">
              <span className="text-[10px] font-mono text-[#62676d] uppercase block">Severity</span>
              <span className="text-xs font-mono text-rose-400 font-semibold">
                {activeGenome.metadata.severityScore} / 10.0
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#181a1d] border border-[#23262a]">
              <span className="text-[10px] font-mono text-[#62676d] uppercase block">Effort Ratio</span>
              <span className="text-xs font-mono text-amber-400 font-semibold">
                {activeGenome.context.effortRatio}x baseline
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#181a1d] border border-[#23262a]">
              <span className="text-[10px] font-mono text-[#62676d] uppercase block">Persona</span>
              <span className="text-xs font-semibold text-[#f4f5f6] capitalize">
                {activeGenome.context.persona.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Cross-Site Transfer Matches */}
        <div className="rounded-xl p-5 bg-[#141517] border border-[#23262a] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#f4f5f6] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#5e6ad2]" />
              Cross-Site Transfer
            </h3>
            <span className="text-[10px] font-mono text-[#5e6ad2] bg-[#5e6ad2]/10 px-2 py-0.5 rounded border border-[#5e6ad2]/20">
              Transfer Learning
            </span>
          </div>

          <p className="text-[12px] text-[#9ba1a6]">
            Matching topological barriers across distinct domains to transfer verified fixes.
          </p>

          <div className="space-y-2.5 pt-1">
            {mockInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#181a1d] hover:bg-[#1c1f23] transition-colors border border-[#23262a] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-[#f4f5f6] truncate max-w-[150px]">
                    {insight.sourceDomain}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {Math.round(insight.similarityScore * 100)}% match
                  </span>
                </div>

                <p className="text-[11px] text-[#9ba1a6] leading-relaxed">
                  {insight.explanation}
                </p>

                <div className="p-2 rounded bg-[#0c0d0e] border border-[#23262a]">
                  <span className="text-[10px] uppercase font-mono text-[#5e6ad2] block mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Transferred Solution
                  </span>
                  <p className="text-[11px] text-[#f4f5f6] font-mono">
                    {insight.provenSolution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
