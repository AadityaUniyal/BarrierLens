/**
 * BarrierLens Universal Cloud Browser Provider
 * 
 * Provides unified, resilient Playwright Chromium instances across:
 * 1. Remote WebSocket CDP endpoints (Browserless.io, Browserbase, or self-hosted Chrome container via BROWSER_WS_ENDPOINT)
 * 2. Local headless Chromium with cloud-hardened flags (--no-sandbox, --disable-dev-shm-usage)
 * 3. Graceful diagnostic reporting when executed in un-provisioned serverless environments
 */

import { chromium, Browser, LaunchOptions } from 'playwright';

export interface BrowserProviderOptions {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
}

export class BrowserProvider {
  /**
   * Retrieves an operational Playwright Browser instance.
   * Prioritizes remote CDP WebSocket if configured, otherwise falls back to local Chromium.
   */
  static async getBrowser(options: BrowserProviderOptions = {}): Promise<Browser> {
    const wsEndpoint = process.env.BROWSER_WS_ENDPOINT || process.env.BROWSERLESS_WS_URL;

    // 1. If a remote WebSocket CDP endpoint is configured, connect to it (zero local RAM/CPU overhead)
    if (wsEndpoint) {
      try {
        console.log(`[BrowserProvider] Connecting to remote CDP browser at: ${wsEndpoint.replace(/\?token=.*$/, '?token=***')}`);
        return await chromium.connect(wsEndpoint, {
          timeout: options.timeout || 30000,
        });
      } catch (remoteErr: any) {
        console.warn(`[BrowserProvider] Failed to connect to remote CDP endpoint (${remoteErr.message}). Falling back to local...`);
      }
    }

    // 2. Local headless Chromium launch with Linux cloud-safe flags
    const launchArgs: LaunchOptions = {
      headless: options.headless !== undefined ? options.headless : true,
      slowMo: options.slowMo,
      timeout: options.timeout || 30000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    };

    try {
      return await chromium.launch(launchArgs);
    } catch (launchErr: any) {
      const msg = launchErr.message || '';
      
      // Check for missing binary error on Vercel / AWS Lambda
      if (
        msg.includes("Executable doesn't exist") || 
        msg.includes('Cannot find module') || 
        msg.includes('shared libraries') ||
        process.env.VERCEL
      ) {
        throw new Error(
          `[BarrierLens Cloud Runtime] Headless Chromium is not installed in this serverless environment.\n` +
          `To run live audits on Vercel or serverless cloud hosts, set the BROWSER_WS_ENDPOINT environment variable ` +
          `(e.g., wss://chrome.browserless.io?token=YOUR_TOKEN or your private Docker browser instance), ` +
          `or trigger audits via the background worker queue.`
        );
      }

      throw launchErr;
    }
  }

  /**
   * Checks whether a remote CDP browser endpoint is configured in environment variables
   */
  static isRemoteConfigured(): boolean {
    return Boolean(process.env.BROWSER_WS_ENDPOINT || process.env.BROWSERLESS_WS_URL);
  }
}
