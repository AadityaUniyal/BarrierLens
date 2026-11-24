import { supabase, sql } from './db';

export interface BarrierGenomeRecord {
  id: string;
  finding_id: string;
  finding_kind: string;
  domain: string;
  target_url: string;
  persona: string;
  similarity: number;
  context: Record<string, any>;
  wcag_rules: string[];
}

export interface VectorMatchOptions {
  threshold?: number;
  limit?: number;
}

/**
 * Searches for semantically and structurally similar accessibility barriers using
 * Supabase pgvector cosine distance via the `match_barrier_genomes` stored procedure.
 */
export async function searchSimilarBarriers(
  embedding: number[],
  options: VectorMatchOptions = {}
): Promise<BarrierGenomeRecord[]> {
  const threshold = options.threshold ?? 0.70;
  const limit = options.limit ?? 5;

  if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
    console.warn(`[searchSimilarBarriers] Invalid embedding vector length: ${embedding?.length}. Expected 768.`);
    return [];
  }

  // 1. Try Supabase PostgREST RPC call
  try {
    const { data, error } = await supabase.rpc('match_barrier_genomes', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (!error && Array.isArray(data)) {
      return data as BarrierGenomeRecord[];
    }
  } catch (rpcErr: any) {
    console.warn('[searchSimilarBarriers] RPC call failed, falling back to direct SQL:', rpcErr?.message);
  }

  // 2. Direct SQL fallback using tagged template postgres driver
  try {
    const vectorStr = `[${embedding.join(',')}]`;
    const rows = await sql`
      SELECT
        id,
        finding_id,
        finding_kind,
        domain,
        target_url,
        persona,
        (1 - (COALESCE(embedding, vector) <=> ${vectorStr}::vector)) as similarity,
        context,
        wcag_rules
      FROM barrier_genomes
      WHERE COALESCE(embedding, vector) IS NOT NULL
        AND (1 - (COALESCE(embedding, vector) <=> ${vectorStr}::vector)) >= ${threshold}
      ORDER BY COALESCE(embedding, vector) <=> ${vectorStr}::vector ASC
      LIMIT ${limit};
    `;

    return (rows || []).map((r: any) => ({
      id: r.id,
      finding_id: r.finding_id,
      finding_kind: r.finding_kind,
      domain: r.domain,
      target_url: r.target_url,
      persona: r.persona,
      similarity: typeof r.similarity === 'number' ? r.similarity : parseFloat(r.similarity),
      context: typeof r.context === 'string' ? JSON.parse(r.context) : r.context,
      wcag_rules: typeof r.wcag_rules === 'string' ? JSON.parse(r.wcag_rules) : r.wcag_rules,
    }));
  } catch (sqlErr: any) {
    console.error('[searchSimilarBarriers] SQL query failed:', sqlErr?.message);
    return [];
  }
}

/**
 * Persists a barrier genome with its 768D embedding vector into Supabase pgvector.
 */
export async function storeBarrierEmbedding(params: {
  id: string;
  findingId: string;
  findingKind: string;
  domain: string;
  targetUrl: string;
  persona: string;
  embedding: number[];
  magnitude: number;
  severityScore: number;
  wcagRules: string[];
  context: Record<string, any>;
}): Promise<boolean> {
  const {
    id,
    findingId,
    findingKind,
    domain,
    targetUrl,
    persona,
    embedding,
    magnitude,
    severityScore,
    wcagRules,
    context,
  } = params;

  try {
    const vectorStr = `[${embedding.join(',')}]`;
    await sql`
      INSERT INTO barrier_genomes (
        id, finding_id, finding_kind, domain, target_url, persona,
        vector, embedding, vector_json, magnitude, severity_score, wcag_rules, context, created_at
      ) VALUES (
        ${id},
        ${findingId},
        ${findingKind},
        ${domain},
        ${targetUrl},
        ${persona},
        ${vectorStr}::vector,
        ${vectorStr}::vector,
        ${JSON.stringify(embedding)},
        ${magnitude},
        ${severityScore},
        ${JSON.stringify(wcagRules)},
        ${JSON.stringify(context)},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        vector = EXCLUDED.vector,
        embedding = EXCLUDED.embedding,
        vector_json = EXCLUDED.vector_json,
        magnitude = EXCLUDED.magnitude,
        severity_score = EXCLUDED.severity_score,
        context = EXCLUDED.context;
    `;
    return true;
  } catch (err: any) {
    console.error('[storeBarrierEmbedding] Failed to store genome:', err?.message);
    return false;
  }
}

/**
 * In-memory cosine similarity calculation between two float vectors.
 */
export function computeCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
