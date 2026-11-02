export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSec: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

type Bucket = { timestamps: number[] };

const ipBuckets = new Map<string, Bucket>();
let inFlight = 0;

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.PUBLIC_AUDITS_PER_HOUR || 8);
const MAX_IN_FLIGHT = Number(process.env.PUBLIC_MAX_CONCURRENT_AUDITS || 2);

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function prune(bucket: Bucket, now: number) {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
}

export function assertAuditQuota(ip: string): void {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || { timestamps: [] };
  prune(bucket, now);
  if (bucket.timestamps.length >= MAX_PER_WINDOW) {
    const oldest = bucket.timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    throw new RateLimitError(
      `Free public limit reached (${MAX_PER_WINDOW} audits per hour). Try again later, or run the built-in /benchmark demo after the window resets.`,
      retryAfterSec
    );
  }
  if (inFlight >= MAX_IN_FLIGHT) {
    throw new RateLimitError(
      'The free auditor is busy. Wait a moment and try again.',
      20
    );
  }
}

export function beginAudit(ip: string): () => void {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || { timestamps: [] };
  prune(bucket, now);
  bucket.timestamps.push(now);
  ipBuckets.set(ip, bucket);
  inFlight += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    inFlight = Math.max(0, inFlight - 1);
  };
}

export function auditCapacity() {
  return {
    inFlight,
    maxInFlight: MAX_IN_FLIGHT,
    maxPerHour: MAX_PER_WINDOW,
  };
}
