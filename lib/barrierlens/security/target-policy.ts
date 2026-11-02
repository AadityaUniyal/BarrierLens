import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const PUBLIC_MAX_STEPS = 12;
export const PUBLIC_MAX_GOAL_CHARS = 500;
export const PUBLIC_MAX_URL_CHARS = 2048;

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google.internal.',
]);

export class TargetPolicyError extends Error {
  constructor(
    message: string,
    public readonly code: 'invalid_url' | 'blocked_target' | 'private_target' | 'goal_too_long'
  ) {
    super(message);
    this.name = 'TargetPolicyError';
  }
}

function allowPrivateTargets(): boolean {
  if (process.env.ALLOW_PRIVATE_TARGETS === 'true') return true;
  if (process.env.ALLOW_PRIVATE_TARGETS === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateIP(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized === '::1') return true;
    if (normalized.startsWith('fe80:')) return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice('::ffff:'.length);
      if (isIP(mapped) === 4) return isPrivateIPv4(mapped);
    }
    return false;
  }
  return false;
}

export function clampPublicMaxSteps(maxSteps: unknown): number {
  const n = typeof maxSteps === 'number' ? maxSteps : Number(maxSteps);
  if (!Number.isFinite(n)) return 8;
  return Math.max(4, Math.min(PUBLIC_MAX_STEPS, Math.floor(n)));
}

export function assertGoal(goal: unknown): string {
  const text = typeof goal === 'string' ? goal.trim() : '';
  if (!text) {
    return 'Complete the primary task on this page using only the keyboard.';
  }
  if (text.length > PUBLIC_MAX_GOAL_CHARS) {
    throw new TargetPolicyError(
      `Goal must be ${PUBLIC_MAX_GOAL_CHARS} characters or fewer.`,
      'goal_too_long'
    );
  }
  return text;
}

/**
 * Resolve a user-supplied target to an absolute http(s) URL.
 * Relative paths (e.g. /benchmark) stay on this deployment so the free demo always works.
 */
export async function resolvePublicTargetUrl(
  rawInput: unknown,
  requestOrigin: string
): Promise<string> {
  const raw = typeof rawInput === 'string' ? rawInput.trim() : '';
  if (!raw) {
    return `${requestOrigin.replace(/\/$/, '')}/benchmark`;
  }
  if (raw.length > PUBLIC_MAX_URL_CHARS) {
    throw new TargetPolicyError('URL is too long.', 'invalid_url');
  }

  let parsed: URL;
  try {
    parsed = raw.startsWith('/') ? new URL(raw, requestOrigin) : new URL(raw);
  } catch {
    throw new TargetPolicyError('Enter a valid http or https URL.', 'invalid_url');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TargetPolicyError('Only http and https URLs are allowed.', 'invalid_url');
  }
  if (parsed.username || parsed.password) {
    throw new TargetPolicyError('URLs with credentials are not allowed.', 'blocked_target');
  }

  const hostname = parsed.hostname.replace(/\.+$/, '').toLowerCase();
  if (!hostname || BLOCKED_HOSTS.has(hostname)) {
    if (!allowPrivateTargets()) {
      throw new TargetPolicyError(
        'Local and metadata hosts are blocked on the public auditor.',
        'private_target'
      );
    }
  }

  if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost')) {
    if (!allowPrivateTargets()) {
      throw new TargetPolicyError(
        'Internal hostnames are blocked on the public auditor.',
        'private_target'
      );
    }
  }

  const literalIP = isIP(hostname);
  if (literalIP && isPrivateIP(hostname) && !allowPrivateTargets()) {
    throw new TargetPolicyError(
      'Private network addresses are blocked on the public auditor.',
      'private_target'
    );
  }

  if (!allowPrivateTargets() && literalIP === 0) {
    try {
      const resolved = await lookup(hostname, { all: true });
      for (const record of resolved) {
        if (isPrivateIP(record.address)) {
          throw new TargetPolicyError(
            'That hostname resolves to a private address and cannot be audited.',
            'private_target'
          );
        }
      }
    } catch (err) {
      if (err instanceof TargetPolicyError) throw err;
      throw new TargetPolicyError('Could not resolve that hostname.', 'invalid_url');
    }
  }

  return parsed.toString();
}

export function requestOriginFrom(req: Request): string {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) return `${proto}://${host}`;
  try {
    return new URL(req.url).origin;
  } catch {
    return process.env.APP_PUBLIC_ORIGIN || 'http://localhost:3000';
  }
}
