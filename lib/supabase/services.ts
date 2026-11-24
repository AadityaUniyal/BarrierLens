import { sql, supabase } from './db';
import https from 'node:https';

export interface ServiceTestResult {
  service: string;
  status: 'operational' | 'degraded' | 'failed';
  endpoint?: string;
  details: Record<string, any>;
  latencyMs?: number;
}

function probeHttps(url: string): Promise<{ statusCode?: number; statusMessage?: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve({ statusCode: res.statusCode, statusMessage: res.statusMessage });
    }).on('error', (e) => reject(e));
  });
}

async function retry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return retry(fn, retries - 1, delayMs * 2);
  }
}

export const supabaseServices = {
  config: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
  },

  /**
   * 1. Test Supabase Postgres Database via direct SQL connection
   */
  async testPostgres(): Promise<ServiceTestResult> {
    const start = performance.now();
    try {
      const result = await retry(async () => {
        return await sql`SELECT version(), current_database(), current_user, NOW() as current_time`;
      });
      const latencyMs = Math.round(performance.now() - start);
      return {
        service: 'Supabase Postgres',
        status: 'operational',
        endpoint: 'aws-0-ap-northeast-1.pooler.supabase.com:6543',
        latencyMs,
        details: {
          database: result[0]?.current_database,
          user: result[0]?.current_user,
          serverVersion: result[0]?.version?.split(' ')[0] + ' ' + result[0]?.version?.split(' ')[1],
          currentTime: result[0]?.current_time,
        },
      };
    } catch (err: any) {
      return {
        service: 'Supabase Postgres',
        status: 'degraded',
        latencyMs: Math.round(performance.now() - start),
        details: { error: err.message, note: 'Direct pooler pending password or using PostgREST' },
      };
    }
  },

  /**
   * 2. Test Supabase PostgREST Data API
   */
  async testDataApi(): Promise<ServiceTestResult> {
    const start = performance.now();
    try {
      const { data, error } = await supabase.from('configuration').select('key').limit(1);
      const latencyMs = Math.round(performance.now() - start);
      if (error && error.code !== 'PGRST116' && !error.message.includes('schema cache')) {
        return {
          service: 'Supabase Data API',
          status: 'degraded',
          latencyMs,
          details: { error: error.message, code: error.code },
        };
      }
      return {
        service: 'Supabase Data API',
        status: 'operational',
        endpoint: `${this.config.supabaseUrl}/rest/v1`,
        latencyMs,
        details: { reachable: true, postgrest: 'active' },
      };
    } catch (err: any) {
      return {
        service: 'Supabase Data API',
        status: 'failed',
        latencyMs: Math.round(performance.now() - start),
        details: { error: err.message },
      };
    }
  },

  /**
   * 3. Test Supabase Auth
   */
  async testAuth(): Promise<ServiceTestResult> {
    const start = performance.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      const latencyMs = Math.round(performance.now() - start);
      return {
        service: 'Supabase Auth',
        status: error ? 'degraded' : 'operational',
        endpoint: `${this.config.supabaseUrl}/auth/v1`,
        latencyMs,
        details: {
          sessionActive: Boolean(data?.session),
          error: error?.message || null,
        },
      };
    } catch (err: any) {
      return {
        service: 'Supabase Auth',
        status: 'failed',
        latencyMs: Math.round(performance.now() - start),
        details: { error: err.message },
      };
    }
  },

  /**
   * 4. Test Supabase Storage
   */
  async testStorage(): Promise<ServiceTestResult> {
    const start = performance.now();
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const latencyMs = Math.round(performance.now() - start);
      return {
        service: 'Supabase Storage',
        status: error ? 'degraded' : 'operational',
        endpoint: `${this.config.supabaseUrl}/storage/v1`,
        latencyMs,
        details: {
          bucketsCount: data?.length ?? 0,
          buckets: data?.map((b) => b.name) ?? [],
          error: error?.message || null,
        },
      };
    } catch (err: any) {
      return {
        service: 'Supabase Storage',
        status: 'failed',
        latencyMs: Math.round(performance.now() - start),
        details: { error: err.message },
      };
    }
  },

  /**
   * 5. Test pgvector Extension
   */
  async testVector(): Promise<ServiceTestResult> {
    const start = performance.now();
    try {
      const result = await sql`
        SELECT extname, extversion 
        FROM pg_extension 
        WHERE extname = 'vector';
      `;
      const latencyMs = Math.round(performance.now() - start);
      const isInstalled = result.length > 0;
      return {
        service: 'Supabase pgvector',
        status: isInstalled ? 'operational' : 'degraded',
        latencyMs,
        details: {
          installed: isInstalled,
          version: result[0]?.extversion || 'not enabled',
        },
      };
    } catch (err: any) {
      return {
        service: 'Supabase pgvector',
        status: 'degraded',
        latencyMs: Math.round(performance.now() - start),
        details: { error: err.message, note: 'Will be enabled upon schema migration' },
      };
    }
  },

  /**
   * 6. Record Agent Trace
   */
  async recordAgentTrace(trace: {
    traceId: string;
    agentRole: string;
    eventType: string;
    payload: any;
    model?: string;
    bedrockModel?: string;
    tokensUsed?: number;
    latencyMs?: number;
  }) {
    try {
      await sql`
        INSERT INTO agent_event_traces (
          trace_id, agent_role, event_type, payload, bedrock_model, tokens_used, latency_ms
        ) VALUES (
          ${trace.traceId},
          ${trace.agentRole},
          ${trace.eventType},
          ${JSON.stringify(trace.payload)}::jsonb,
          ${trace.bedrockModel || trace.model || null},
          ${trace.tokensUsed || 0},
          ${trace.latencyMs || 0}
        );
      `;
    } catch (e: any) {
      console.log('[Supabase Services] recordAgentTrace notice:', e.message);
    }
  },

  /**
   * 7. Save Causal Certificate
   */
  async saveCausalCertificate(cert: any) {
    try {
      await sql`
        INSERT INTO causal_certificates (
          finding_id, sha256_hash, target_url, persona, wcag_rule,
          intervention_target, intervention_action, ast_patch, original_html,
          patched_html, verification_status, regressions_count, sandbox_metrics
        ) VALUES (
          ${cert.finding_id || cert.findingId},
          ${cert.sha256_hash || cert.sha256Hash},
          ${cert.target_url || cert.targetUrl},
          ${cert.persona || 'keyboard'},
          ${cert.wcag_rule || cert.wcagRule},
          ${cert.intervention_target || cert.interventionTarget},
          ${cert.intervention_action || cert.interventionAction},
          ${cert.ast_patch || cert.astPatch},
          ${cert.original_html || cert.originalHtml || null},
          ${cert.patched_html || cert.patchedHtml || null},
          ${cert.verification_status || 'verified'},
          ${cert.regressions_count || 0},
          ${JSON.stringify(cert.sandbox_metrics || {})}::jsonb
        );
      `;
    } catch (e: any) {
      console.log('[Supabase Services] saveCausalCertificate notice:', e.message);
    }
  },

  /**
   * Run All Diagnostics
   */
  async runAllTests(): Promise<{
    timestamp: string;
    allPassed: boolean;
    results: ServiceTestResult[];
  }> {
    const results = await Promise.all([
      this.testDataApi(),
      this.testAuth(),
      this.testStorage(),
      this.testPostgres(),
      this.testVector(),
    ]);

    const allPassed = results.every((r) => r.status === 'operational');
    return {
      timestamp: new Date().toISOString(),
      allPassed,
      results,
    };
  },
};

// Compatibility export
export const neonServices = supabaseServices;
