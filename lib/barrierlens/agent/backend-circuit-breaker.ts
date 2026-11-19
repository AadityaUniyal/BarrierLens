/**
 * BarrierLens Backend Circuit Breaker
 * 
 * Prevents cascading latency bottlenecks and route timeouts when the Python ML backend (:8000)
 * is offline or slow. Caches availability status with a short TTL and fails fast (0ms) to in-process
 * or AWS Bedrock heuristics rather than waiting 3-7 seconds on dead-socket timeouts per step.
 */

export class BackendCircuitBreaker {
  private static instance: BackendCircuitBreaker;
  private backendUrl: string;
  private isOnline: boolean = false;
  private lastChecked: number = 0;
  private ttlMs: number = 20_000; // 20s health cache TTL
  private isProbing: boolean = false;

  private constructor() {
    this.backendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
  }

  static getInstance(): BackendCircuitBreaker {
    if (!BackendCircuitBreaker.instance) {
      BackendCircuitBreaker.instance = new BackendCircuitBreaker();
    }
    return BackendCircuitBreaker.instance;
  }

  getUrl(): string {
    return this.backendUrl;
  }

  /**
   * Fast non-blocking check whether Python backend is reachable.
   * If cache is fresh, returns immediately (0ms).
   */
  async checkAvailability(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastChecked < this.ttlMs) {
      return this.isOnline;
    }

    if (this.isProbing) {
      return this.isOnline;
    }

    this.isProbing = true;
    try {
      const res = await fetch(`${this.backendUrl}/health`, {
        signal: AbortSignal.timeout(300), // Fast 300ms probe
      });
      this.isOnline = res.ok;
    } catch {
      this.isOnline = false;
    } finally {
      this.lastChecked = Date.now();
      this.isProbing = false;
    }

    return this.isOnline;
  }

  /**
   * Synchronous check of the last known state.
   */
  isKnownOnline(): boolean {
    const now = Date.now();
    return this.isOnline && (now - this.lastChecked < this.ttlMs);
  }

  markOffline(): void {
    this.isOnline = false;
    this.lastChecked = Date.now();
  }

  markOnline(): void {
    this.isOnline = true;
    this.lastChecked = Date.now();
  }

  /**
   * Safely calls Python backend if online, otherwise instantly executes fallback.
   */
  async callWithFallback<T>(
    endpoint: string,
    init: RequestInit,
    fallback: () => T | Promise<T>,
    timeoutMs: number = 3000
  ): Promise<T> {
    const available = await this.checkAvailability();
    if (!available) {
      return fallback();
    }

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.backendUrl}${endpoint}`;
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        return fallback();
      }

      this.markOnline();
      return (await res.json()) as T;
    } catch {
      this.markOffline();
      return fallback();
    }
  }
}

export const backendBreaker = BackendCircuitBreaker.getInstance();
