/**
 * BarrierLens E2E Test Suite - Browser Fixture
 * 
 * Provides Playwright Chromium browser lifecycle management, isolated contexts,
 * viewport presets, and page navigation helpers.
 */

import { chromium, Browser, BrowserContext, Page, CDPSession, BrowserContextOptions, LaunchOptions } from 'playwright';
import { BASE_URL, TIMEOUTS, VIEWPORTS, ViewportDimensions, resolveUrl } from './config';

let sharedBrowser: Browser | null = null;
const activeContexts: Set<BrowserContext> = new Set();

export interface CreatePageOptions {
  viewport?: ViewportDimensions | keyof typeof VIEWPORTS;
  userAgent?: string;
  storageState?: string | any;
  colorScheme?: 'dark' | 'light' | 'no-preference';
  extraHTTPHeaders?: Record<string, string>;
  permissions?: string[];
  locale?: string;
}

export interface NavigationOptions {
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
}

/**
 * Returns or creates the singleton Playwright Chromium browser instance.
 */
export async function getBrowser(options: LaunchOptions = {}): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    return sharedBrowser;
  }

  const defaultArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--enable-features=NetworkService,NetworkServiceInProcess',
  ];

  sharedBrowser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    args: [...defaultArgs, ...(options.args || [])],
    ...options,
  });

  return sharedBrowser;
}

/**
 * Creates an isolated browser context with cleanup tracking.
 */
export async function createContext(options: BrowserContextOptions = {}): Promise<BrowserContext> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    ...options,
  });

  activeContexts.add(context);
  context.on('close', () => {
    activeContexts.delete(context);
  });

  return context;
}

/**
 * Creates an isolated page with optional viewport configuration and context isolation.
 */
export async function createPage(options: CreatePageOptions = {}): Promise<{ page: Page; context: BrowserContext }> {
  let viewport: ViewportDimensions = VIEWPORTS.desktop;
  if (options.viewport) {
    if (typeof options.viewport === 'string' && options.viewport in VIEWPORTS) {
      viewport = VIEWPORTS[options.viewport as keyof typeof VIEWPORTS];
    } else if (typeof options.viewport === 'object') {
      viewport = options.viewport as ViewportDimensions;
    }
  }

  const context = await createContext({
    viewport,
    userAgent: options.userAgent,
    storageState: options.storageState,
    colorScheme: options.colorScheme,
    extraHTTPHeaders: options.extraHTTPHeaders,
    permissions: options.permissions,
    locale: options.locale || 'en-US',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUTS.action);
  page.setDefaultNavigationTimeout(TIMEOUTS.navigation);

  return { page, context };
}

/**
 * Navigates a page to a path (relative or absolute) prepending BASE_URL if relative.
 */
export async function navigateTo(
  page: Page,
  path: string,
  options: NavigationOptions = {}
) {
  const targetUrl = resolveUrl(path);
  return await page.goto(targetUrl, {
    timeout: options.timeout ?? TIMEOUTS.navigation,
    waitUntil: options.waitUntil ?? 'domcontentloaded',
  });
}

/**
 * Attaches a Chrome DevTools Protocol (CDP) session for low-level accessibility
 * and DOM inspections.
 */
export async function getCDPSession(page: Page): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);
  return client;
}

/**
 * Closes all actively tracked browser contexts.
 */
export async function closeAllContexts(): Promise<void> {
  const contexts = Array.from(activeContexts);
  await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})));
  activeContexts.clear();
}

/**
 * Cleanly shuts down the shared browser instance and all open contexts.
 */
export async function closeBrowser(): Promise<void> {
  await closeAllContexts();
  if (sharedBrowser) {
    try {
      await sharedBrowser.close();
    } catch {
      // Ignore errors if already closed
    } finally {
      sharedBrowser = null;
    }
  }
}

// Ensure browser teardown on unexpected process termination
const cleanupBrowser = () => {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    try {
      sharedBrowser.close().catch(() => {});
    } catch {}
  }
};

process.on('exit', cleanupBrowser);
