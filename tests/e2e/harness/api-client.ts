/**
 * BarrierLens E2E Test Suite - API Client
 * 
 * Opaque HTTP client for Next.js API route handlers (/api/*).
 * Captures status, headers, JSON/text responses, and request latency.
 */

import { BASE_URL, TIMEOUTS, resolveUrl } from './config';

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  throwOnError?: boolean;
}

export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Record<string, string>;
  data: T;
  rawText: string;
  latencyMs: number;
  url: string;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = BASE_URL, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = defaultHeaders;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const rawUrl = path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const url = new URL(rawUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async execute<T = any>(
    method: string,
    path: string,
    body?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const targetUrl = this.buildUrl(path, options.params);
    const timeoutMs = options.timeoutMs ?? TIMEOUTS.network;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers || {}),
    };

    let serializedBody: string | undefined = undefined;
    if (body !== undefined && body !== null) {
      if (typeof body === 'object' && !(body instanceof Uint8Array)) {
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
        serializedBody = JSON.stringify(body);
      } else {
        serializedBody = String(body);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = performance.now();
    try {
      const response = await fetch(targetUrl, {
        method,
        headers,
        body: serializedBody,
        signal: controller.signal,
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const rawText = await response.text();

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      let parsedData: any = rawText;
      const contentType = responseHeaders['content-type'] || '';
      if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          // Keep raw text if JSON parsing fails
        }
      }

      const result: ApiResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: responseHeaders,
        data: parsedData as T,
        rawText,
        latencyMs,
        url: targetUrl,
      };

      if (options.throwOnError && !response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${method} ${targetUrl}: ${rawText}`);
      }

      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T = any>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('GET', path, undefined, options);
  }

  async post<T = any>(path: string, body?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('POST', path, body, options);
  }

  async put<T = any>(path: string, body?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('PUT', path, body, options);
  }

  async patch<T = any>(path: string, body?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('PATCH', path, body, options);
  }

  async delete<T = any>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>('DELETE', path, undefined, options);
  }

  /**
   * Returns a new client with merged default headers (e.g. for authenticated sessions).
   */
  withHeaders(headers: Record<string, string>): ApiClient {
    return new ApiClient(this.baseUrl, { ...this.defaultHeaders, ...headers });
  }
}

export const apiClient = new ApiClient();
export const api = apiClient;
export default apiClient;
