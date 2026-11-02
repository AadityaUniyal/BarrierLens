import { BarrierGenome, BarrierGenomeEncoder } from './barrier-encoder';
import { FindingKind } from '../types';
import { sql } from '../../neon/db';

export interface GenomeSimilarityResult {
  genome: BarrierGenome;
  similarity: number;
  domain: string;
  remediationAdvice?: string;
}

export interface GenomeEvolutionPoint {
  timestamp: string;
  findingKind: FindingKind;
  severityScore: number;
  effortRatio: number;
  title: string;
  similarityToBaseline: number;
}

export class GenomeStore {
  private static inMemoryStore: Map<string, BarrierGenome> = new Map();
  private encoder = new BarrierGenomeEncoder();
  private tableInitialized = false;

  private async ensureTable(): Promise<void> {
    if (this.tableInitialized) return;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS barrier_genomes (
          id TEXT PRIMARY KEY,
          finding_id TEXT NOT NULL,
          finding_kind TEXT NOT NULL,
          domain TEXT NOT NULL,
          target_url TEXT NOT NULL,
          persona TEXT NOT NULL,
          vector JSONB NOT NULL,
          magnitude FLOAT NOT NULL,
          severity_score FLOAT NOT NULL,
          wcag_rules JSONB NOT NULL,
          context JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `;
      this.tableInitialized = true;
    } catch {
      // Offline fallback: use in-memory store
      this.tableInitialized = true;
    }
  }

  async store(genome: BarrierGenome): Promise<void> {
    GenomeStore.inMemoryStore.set(genome.findingId, genome);

    try {
      await this.ensureTable();
      let domain = 'localhost';
      try {
        domain = new URL(genome.context.targetUrl).hostname;
      } catch {
        domain = genome.context.targetUrl || 'unknown';
      }

      await sql`
        INSERT INTO barrier_genomes (
          id, finding_id, finding_kind, domain, target_url, persona, vector, magnitude, severity_score, wcag_rules, context, created_at
        ) VALUES (
          ${genome.findingId},
          ${genome.findingId},
          ${genome.findingKind},
          ${domain},
          ${genome.context.targetUrl},
          ${genome.context.persona},
          ${JSON.stringify(genome.vector)},
          ${genome.magnitude},
          ${genome.metadata.severityScore || 5.0},
          ${JSON.stringify(genome.metadata.wcagRules || [])},
          ${JSON.stringify(genome.context)},
          ${genome.timestamp}
        )
        ON CONFLICT (id) DO UPDATE SET
          vector = EXCLUDED.vector,
          magnitude = EXCLUDED.magnitude,
          severity_score = EXCLUDED.severity_score,
          context = EXCLUDED.context;
      `;
    } catch (err) {
      // In-memory store already holds it
    }
  }

  async findSimilar(
    queryGenome: BarrierGenome,
    topK: number = 5,
    threshold: number = 0.65
  ): Promise<GenomeSimilarityResult[]> {
    const results: GenomeSimilarityResult[] = [];

    // 1. Try DB fetch
    try {
      await this.ensureTable();
      const rows = await sql`
        SELECT id, finding_id, finding_kind, domain, target_url, persona, vector, magnitude, severity_score, wcag_rules, context, created_at
        FROM barrier_genomes
        LIMIT 100;
      `;

      if (rows && rows.length > 0) {
        for (const row of rows) {
          if (row.finding_id === queryGenome.findingId) continue;
          const vec: number[] = typeof row.vector === 'string' ? JSON.parse(row.vector) : row.vector;
          const targetGenome: BarrierGenome = {
            findingId: row.finding_id,
            findingKind: row.finding_kind as FindingKind,
            vector: vec,
            magnitude: row.magnitude,
            timestamp: row.created_at,
            context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context,
            metadata: {
              title: `${row.finding_kind} on ${row.domain}`,
              trustTier: 'proven',
              severityScore: row.severity_score,
              wcagRules: typeof row.wcag_rules === 'string' ? JSON.parse(row.wcag_rules) : row.wcag_rules
            }
          };

          const sim = this.encoder.similarity(queryGenome, targetGenome);
          if (sim >= threshold) {
            results.push({
              genome: targetGenome,
              similarity: sim,
              domain: row.domain,
              remediationAdvice: this.generateRemediationHint(targetGenome)
            });
          }
        }
      }
    } catch {
      // Fall through to in-memory check
    }

    // 2. Combine with in-memory store if DB had none
    if (results.length === 0) {
      for (const [id, item] of GenomeStore.inMemoryStore.entries()) {
        if (id === queryGenome.findingId) continue;
        const sim = this.encoder.similarity(queryGenome, item);
        if (sim >= threshold) {
          let domain = 'localhost';
          try {
            domain = new URL(item.context.targetUrl).hostname;
          } catch {
            domain = item.context.targetUrl;
          }

          results.push({
            genome: item,
            similarity: sim,
            domain,
            remediationAdvice: this.generateRemediationHint(item)
          });
        }
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  async findByDomain(domain: string, limit: number = 20): Promise<BarrierGenome[]> {
    const list: BarrierGenome[] = [];

    try {
      await this.ensureTable();
      const rows = await sql`
        SELECT finding_id, finding_kind, target_url, vector, magnitude, severity_score, wcag_rules, context, created_at
        FROM barrier_genomes
        WHERE domain = ${domain}
        ORDER BY created_at DESC
        LIMIT ${limit};
      `;

      for (const r of rows) {
        list.push({
          findingId: r.finding_id,
          findingKind: r.finding_kind as FindingKind,
          vector: typeof r.vector === 'string' ? JSON.parse(r.vector) : r.vector,
          magnitude: r.magnitude,
          timestamp: r.created_at,
          context: typeof r.context === 'string' ? JSON.parse(r.context) : r.context,
          metadata: {
            title: `${r.finding_kind} finding`,
            trustTier: 'proven',
            severityScore: r.severity_score,
            wcagRules: typeof r.wcag_rules === 'string' ? JSON.parse(r.wcag_rules) : r.wcag_rules
          }
        });
      }
    } catch {
      // In-memory fallback
      for (const item of GenomeStore.inMemoryStore.values()) {
        if (item.context.targetUrl.includes(domain)) {
          list.push(item);
        }
      }
    }

    return list.slice(0, limit);
  }

  async getEvolutionTimeline(findingKind: FindingKind, domain: string): Promise<GenomeEvolutionPoint[]> {
    const points: GenomeEvolutionPoint[] = [];
    const genomes = await this.findByDomain(domain, 50);
    const kindGenomes = genomes.filter(g => g.findingKind === findingKind);

    if (kindGenomes.length === 0) return points;

    // Baseline is the earliest observed genome
    const baseline = kindGenomes[kindGenomes.length - 1];

    for (const g of kindGenomes) {
      points.push({
        timestamp: g.timestamp,
        findingKind: g.findingKind,
        severityScore: g.metadata.severityScore,
        effortRatio: g.context.effortRatio,
        title: g.metadata.title,
        similarityToBaseline: this.encoder.similarity(baseline, g)
      });
    }

    return points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private generateRemediationHint(genome: BarrierGenome): string {
    switch (genome.findingKind) {
      case 'keyboard_trap':
        return 'Previous matching solution: Ensure Escape key listener or modal cleanup unbinds keyboard trap on dismissal.';
      case 'silent_state_change':
        return 'Previous matching solution: Bind aria-live="polite" or use role="status" container for dynamic feedback.';
      case 'empty_accessible_name':
        return 'Previous matching solution: Add concise aria-label or visible label text to interactive control.';
      default:
        return 'Review WCAG criteria and ensure keyboard focus order aligns with visual representation.';
    }
  }
}
