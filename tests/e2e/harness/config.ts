/**
 * BarrierLens E2E Test Suite - Harness Configuration
 * 
 * Provides centralized environment variables, URLs, viewports, and timeout settings.
 */

export interface ViewportDimensions {
  width: number;
  height: number;
}

export interface E2ETimeouts {
  navigation: number;
  assertion: number;
  action: number;
  serverStartup: number;
  network: number;
}

export const BASE_URL: string = (
  process.env.E2E_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://127.0.0.1:3000'
).replace(/\/$/, '');

let parsedUrl: URL;
try {
  parsedUrl = new URL(BASE_URL);
} catch {
  parsedUrl = new URL('http://127.0.0.1:3000');
}

export const SERVER_PORT: number = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3000;
export const SERVER_HOST: string = parsedUrl.hostname || '127.0.0.1';

export const TIMEOUTS: E2ETimeouts = {
  navigation: process.env.E2E_NAV_TIMEOUT ? parseInt(process.env.E2E_NAV_TIMEOUT, 10) : 30_000,
  assertion: process.env.E2E_ASSERT_TIMEOUT ? parseInt(process.env.E2E_ASSERT_TIMEOUT, 10) : 10_000,
  action: process.env.E2E_ACTION_TIMEOUT ? parseInt(process.env.E2E_ACTION_TIMEOUT, 10) : 15_000,
  serverStartup: process.env.E2E_SERVER_TIMEOUT ? parseInt(process.env.E2E_SERVER_TIMEOUT, 10) : 60_000,
  network: process.env.E2E_NETWORK_TIMEOUT ? parseInt(process.env.E2E_NETWORK_TIMEOUT, 10) : 15_000,
};

export const VIEWPORTS: Record<string, ViewportDimensions> = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  fourK: { width: 3840, height: 2160 },
  ultrawide: { width: 3440, height: 1440 },
};

export const ROUTES = {
  landing: '/',
  dashboard: '/?tab=overview',
  audits: '/?tab=audits',
  issues: '/?tab=issues',
  fixes: '/?tab=fixes',
  arena: '/?tab=arena',
  genome: '/?tab=genome',
  websites: '/?tab=websites',
  settings: '/?tab=settings',
  api: {
    status: '/api/aws/status',
    bedrock: '/api/aws/bedrock',
    audit: '/api/audit',
    auditExport: (id: string) => `/api/audit/${id}/export`,
    analyticsTrends: '/api/analytics/trends',
    apiKeys: '/api/vault/keys',
    webhooks: '/api/vault/webhooks',
    authSession: '/api/auth/get-session',
    authSignOut: '/api/auth/sign-out',
  },
} as const;

/**
 * Resolves a relative path to a fully qualified URL using BASE_URL.
 */
export function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export const E2E_CONFIG = {
  baseUrl: BASE_URL,
  host: SERVER_HOST,
  port: SERVER_PORT,
  timeouts: TIMEOUTS,
  viewports: VIEWPORTS,
  routes: ROUTES,
  resolveUrl,
};

export default E2E_CONFIG;
