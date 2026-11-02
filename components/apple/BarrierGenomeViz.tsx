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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-400/30 flex items-center justify-center">
              <Dna className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[19px] font-semibold text-[#f5f5f7]">Barrier Genome</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  768-DIM pgvector
                </span>
              </div>
              <p className="text-[13px] text-[#86868b]">
                Learned vector embeddings capturing structural, semantic, and behavioral barrier DNA across the web
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border-hairline text-xs font-mono text-[#a1a1a6]">
              Dimensions: <span className="text-[#f5f5f7]">768</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border-hairline text-xs font-mono text-[#a1a1a6]">
              Cosine Distance: <span className="text-emerald-400">&lt;=&gt; HNSW</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dense Vector Heatmap */}
        <div className="lg:col-span-2 apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-medium text-[#f5f5f7] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#86868b]" />
                Genome Vector Heatmap (192 × 4 Feature Blocks)
              </h3>
              <p className="text-[12px] text-[#86868b]">
                Real-time dense projection of structural, semantic, behavioral, and contextual latent dimensions
              </p>
            </div>
            <span className="text-xs font-mono text-[#86868b]">
              |v| = {activeGenome.magnitude.toFixed(2)}
            </span>
          </div>

          {/* Visual Vector Grid (768 cells rendered as a 48x16 matrix) */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.04] space-y-3">
            <div className="grid grid-cols-4 gap-2 text-[11px] font-mono text-[#86868b] border-b border-white/[0.06] pb-2">
              <span className="text-blue-400">0-191 Structural</span>
              <span className="text-purple-400">192-383 Semantic</span>
              <span className="text-amber-400">384-575 Behavioral</span>
              <span className="text-emerald-400">576-767 Contextual</span>
            </div>

            <div className="grid grid-cols-[repeat(48,minmax(0,1fr))] gap-1 h-28 overflow-hidden rounded-lg">
              {activeGenome.vector.slice(0, 384).map((val, idx) => {
                // Color ramp by feature block
                let colorClass = 'bg-blue-500';
                if (idx >= 192) colorClass = 'bg-purple-500';

                const opacity = Math.min(1.0, Math.max(0.08, Math.abs(val)));
                return (
                  <div
                    key={idx}
                    className={`h-full rounded-sm transition-all duration-300 hover:scale-125 ${colorClass}`}
                    style={{ opacity }}
                    title={`Dim ${idx}: ${val.toFixed(4)}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#86868b] pt-1">
              <span>Unit-Normalized L2 Sphere</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Deterministic Murmur3 Projection
              </span>
            </div>
          </div>

          {/* Genome Metadata Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/[0.03] border-hairline">
              <span className="text-[11px] text-[#86868b] uppercase tracking-wider block">Kind</span>
              <span className="text-[13px] font-medium text-[#f5f5f7] capitalize">
                {activeGenome.findingKind.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border-hairline">
              <span className="text-[11px] text-[#86868b] uppercase tracking-wider block">Severity</span>
              <span className="text-[13px] font-mono text-rose-400 font-semibold">
                {activeGenome.metadata.severityScore} / 10.0
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border-hairline">
              <span className="text-[11px] text-[#86868b] uppercase tracking-wider block">Effort Ratio</span>
              <span className="text-[13px] font-mono text-amber-400 font-semibold">
                {activeGenome.context.effortRatio}x baseline
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border-hairline">
              <span className="text-[11px] text-[#86868b] uppercase tracking-wider block">Persona</span>
              <span className="text-[13px] font-medium text-[#f5f5f7] capitalize">
                {activeGenome.context.persona.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Cross-Site Transfer Matches */}
        <div className="apple-vibrancy-regular rounded-3xl p-6 border-hairline space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-[#f5f5f7] flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Cross-Site Transfer
            </h3>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Transfer Learning
            </span>
          </div>

          <p className="text-[12px] text-[#86868b]">
            Matching topological barriers across completely different web applications to transfer verified fixes
          </p>

          <div className="space-y-3 pt-2">
            {mockInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors border-hairline space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#f5f5f7] font-mono truncate max-w-[160px]">
                    {insight.sourceDomain}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    {Math.round(insight.similarityScore * 100)}% match
                  </span>
                </div>

                <p className="text-[12px] text-[#86868b] leading-relaxed">
                  {insight.explanation}
                </p>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] uppercase font-semibold text-indigo-300 block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Transferred Solution
                  </span>
                  <p className="text-[12px] text-[#e1e1e6] font-mono">
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
