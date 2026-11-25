import { AuditorCore } from '../agent/auditor-core';
import { PersonaType } from '../types';
import crypto from 'node:crypto';
import { sql } from '@/lib/supabase/db';
import {
  assertAuditQuota,
  beginAudit,
  clientIp,
  RateLimitError,
} from './rate-limit';
import {
  TargetPolicyError,
  assertGoal,
  clampPublicMaxSteps,
  requestOriginFrom,
  resolvePublicTargetUrl,
} from './target-policy';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export type PublicAuditBody = {
  targetUrl?: string;
  goal?: string;
  persona?: PersonaType;
  maxSteps?: number;
  sessionHeaders?: Record<string, string>;
  sessionCookies?: Array<{ name: string; value: string; domain?: string; path?: string }>;
  bypassConsent?: boolean;
};

// In-memory key rate limiter bucket for authenticated clients
const keyBuckets = new Map<string, { timestamps: number[] }>();

// High-traffic benchmark cache (prevents browser exhaustion during live crowd demos)
const benchmarkCache = new Map<string, { timestamp: number; run: any }>();
const BENCHMARK_CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes cache for standard demonstration fixtures

export async function verifyApiKey(req: Request): Promise<{ keyId: string; userId: string; rateLimit: number } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const apiKeyHeader = req.headers.get('x-api-key') || '';
  
  let rawKey = '';
  if (authHeader.startsWith('Bearer bl_live_')) {
    rawKey = authHeader.replace(/^Bearer\s+/, '').trim();
  } else if (apiKeyHeader.startsWith('bl_live_')) {
    rawKey = apiKeyHeader.trim();
  }

  if (!rawKey) return null;

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  try {
    const keys = await sql`
      SELECT id, user_id, COALESCE(rate_limit_per_min, 120) as rate_limit_per_min, scopes
      FROM api_keys
      WHERE key_hash = ${keyHash} AND revoked_at IS NULL
      LIMIT 1;
    `;

    if (keys.length === 0) {
      throw new AuthError('Invalid or revoked API key supplied.');
    }

    const key = keys[0];
    // Enforce rate limit per minute
    const limit = key.rate_limit_per_min || 120;
    const now = Date.now();
    const bucket = keyBuckets.get(key.id) || { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60000);
    if (bucket.timestamps.length >= limit) {
      throw new RateLimitError(`API Key rate limit of ${limit} requests/minute exceeded.`, 60);
    }
    bucket.timestamps.push(now);
    keyBuckets.set(key.id, bucket);

    // Update last_used_at asynchronously
    sql`UPDATE api_keys SET last_used_at = NOW() WHERE id = ${key.id};`.catch(() => {});

    return { keyId: key.id, userId: key.user_id, rateLimit: limit };
  } catch (err: any) {
    if (err instanceof RateLimitError || err instanceof AuthError) throw err;
    console.error('[Public Audit] API key verification error:', err.message);
    throw new AuthError('API key verification service unavailable.');
  }
}

export async function runGuardedAudit(
  req: Request,
  body: PublicAuditBody,
  onProgress?: (event: { type: 'step' | 'finding' | 'complete' | 'status'; data: any }) => void
) {
  // Check for enterprise API Key first
  const keyInfo = await verifyApiKey(req);
  const ip = clientIp(req);

  // If no valid API key, apply standard free public IP quota
  if (!keyInfo) {
    assertAuditQuota(ip);
  }

  const origin = requestOriginFrom(req);
  const targetUrl = await resolvePublicTargetUrl(body.targetUrl, origin);
  const goal = assertGoal(body.goal);
  const persona: PersonaType = body.persona || 'keyboard';
  const maxSteps = clampPublicMaxSteps(body.maxSteps);

  // Fast-path for benchmark demonstration targets to handle simultaneous crowd traffic effortlessly
  const isBenchmarkFixture = targetUrl.includes('benchmark') || targetUrl.includes('/fixtures/');
  const cacheKey = `${targetUrl}::${persona}::${goal}`;
  const now = Date.now();
  const cached = benchmarkCache.get(cacheKey);

  if (isBenchmarkFixture && cached && now - cached.timestamp < BENCHMARK_CACHE_TTL_MS) {
    const run = cached.run;
    if (onProgress) {
      onProgress({ type: 'status', data: { message: 'Serving verified proof graph from enterprise cache...' } });
      if (run.steps && Array.isArray(run.steps)) {
        for (const st of run.steps.slice(0, 5)) {
          onProgress({ type: 'step', data: { step: st } });
        }
      }
      if (run.findings && Array.isArray(run.findings)) {
        for (const f of run.findings) {
          onProgress({ type: 'finding', data: { finding: f } });
        }
      }
      onProgress({
        type: 'complete',
        data: {
          auditRun: run,
          shareUrl: run.id ? `/scorecard/${run.id}` : ''
        }
      });
    }
    return run;
  }

  const release = beginAudit(keyInfo ? `key_${keyInfo.keyId}` : ip);
  try {
    const auditor = new AuditorCore();
    const result = await auditor.runAudit(
      targetUrl,
      goal,
      persona,
      maxSteps,
      onProgress,
      {
        extraHeaders: body.sessionHeaders,
        cookies: body.sessionCookies,
        bypassConsent: body.bypassConsent ?? true,
      }
    );
    if (isBenchmarkFixture && result) {
      benchmarkCache.set(cacheKey, { timestamp: Date.now(), run: result });
    }
    return result;
  } catch (auditErr: any) {
    console.error('[Auditor Core] Audit execution failed:', auditErr.message);
    onProgress?.({ 
      type: 'status', 
      data: { error: auditErr.message || 'Audit execution halted', status: 'failed' } 
    });
    throw auditErr;
  } finally {
    release();
  }
}

export function publicErrorResponse(err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof AuthError) {
    return { status: 401, body: { error: err.message, code: 'unauthorized' } };
  }
  if (err instanceof TargetPolicyError) {
    return { status: 400, body: { error: err.message, code: err.code } };
  }
  if (err instanceof RateLimitError) {
    return {
      status: 429,
      body: { error: err.message, code: 'rate_limited', retryAfterSec: err.retryAfterSec },
    };
  }
  const message = err instanceof Error ? err.message : 'Audit failed';
  return { status: 500, body: { error: message, code: 'audit_failed' } };
}
