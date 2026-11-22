/**
 * BarrierLens E2E Test Suite - Harness Smoke Test
 * 
 * Verifies core functionality of all test harness modules:
 * config, server-fixture, browser-fixture, api-client, a11y-helpers, test-database-stub.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE_URL,
  SERVER_PORT,
  SERVER_HOST,
  TIMEOUTS,
  VIEWPORTS,
  ROUTES,
  resolveUrl,
} from './config';

import {
  isServerRunning,
  ensureServerRunning,
  stopServer,
} from './server-fixture';

import {
  getBrowser,
  createContext,
  createPage,
  navigateTo,
  closeBrowser,
} from './browser-fixture';

import {
  ApiClient,
  apiClient,
} from './api-client';

import {
  parseColor,
  calculateRelativeLuminance,
  calculateContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  blendColors,
  formatAxeViolations,
} from './a11y-helpers';

import {
  withTemporaryEnv,
  assertDbRejectionOnUnconfigured,
  assertNoMockFallbacks,
  verifyArrayQueryOperator,
  createMockNeonProxy,
} from './test-database-stub';

describe('BarrierLens E2E Test Harness', () => {

  describe('Config Module', () => {
    it('should export a valid BASE_URL and parsed host/port', () => {
      assert.ok(BASE_URL.startsWith('http://') || BASE_URL.startsWith('https://'));
      assert.ok(!BASE_URL.endsWith('/'), 'BASE_URL should not end with trailing slash');
      assert.equal(typeof SERVER_PORT, 'number');
      assert.ok(SERVER_PORT > 0 && SERVER_PORT < 65536);
      assert.equal(typeof SERVER_HOST, 'string');
    });

    it('should define all mandatory timeouts with positive numbers', () => {
      assert.ok(TIMEOUTS.navigation > 0);
      assert.ok(TIMEOUTS.assertion > 0);
      assert.ok(TIMEOUTS.action > 0);
      assert.ok(TIMEOUTS.serverStartup > 0);
      assert.ok(TIMEOUTS.network > 0);
    });

    it('should define standard viewport presets', () => {
      assert.deepEqual(VIEWPORTS.desktop, { width: 1280, height: 800 });
      assert.deepEqual(VIEWPORTS.mobile, { width: 375, height: 667 });
      assert.deepEqual(VIEWPORTS.tablet, { width: 768, height: 1024 });
      assert.deepEqual(VIEWPORTS.fourK, { width: 3840, height: 2160 });
      assert.deepEqual(VIEWPORTS.ultrawide, { width: 3440, height: 1440 });
    });

    it('should correctly resolve relative and absolute URLs', () => {
      assert.equal(resolveUrl('/test'), `${BASE_URL}/test`);
      assert.equal(resolveUrl('test'), `${BASE_URL}/test`);
      assert.equal(resolveUrl('http://example.com/api'), 'http://example.com/api');
    });
  });

  describe('API Client Module', () => {
    it('should instantiate and support withHeaders immutability', () => {
      const client = new ApiClient('http://127.0.0.1:3000');
      const authedClient = client.withHeaders({ 'Authorization': 'Bearer test-token' });
      assert.ok(client !== authedClient);
      assert.equal(typeof apiClient.get, 'function');
      assert.equal(typeof apiClient.post, 'function');
      assert.equal(typeof apiClient.put, 'function');
      assert.equal(typeof apiClient.patch, 'function');
      assert.equal(typeof apiClient.delete, 'function');
    });
  });

  describe('A11y Helpers Module - WCAG Contrast', () => {
    it('should accurately parse various color string formats', () => {
      assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
      assert.deepEqual(parseColor('#000000'), { r: 0, g: 0, b: 0, a: 1 });
      assert.deepEqual(parseColor('rgb(255, 0, 128)'), { r: 255, g: 0, b: 128, a: 1 });
      assert.deepEqual(parseColor('rgba(0, 100, 200, 0.5)'), { r: 0, g: 100, b: 200, a: 0.5 });
      assert.deepEqual(parseColor('white'), { r: 255, g: 255, b: 255, a: 1 });
    });

    it('should compute relative luminance matching W3C spec', () => {
      const whiteLum = calculateRelativeLuminance('#ffffff');
      const blackLum = calculateRelativeLuminance('#000000');
      assert.equal(whiteLum, 1.0);
      assert.equal(blackLum, 0.0);
    });

    it('should compute contrast ratios correctly', () => {
      const blackOnWhite = calculateContrastRatio('#000000', '#ffffff');
      assert.equal(blackOnWhite, 21);

      const whiteOnWhite = calculateContrastRatio('#ffffff', '#ffffff');
      assert.equal(whiteOnWhite, 1);

      // Contrast for #62676d against dark background #0a0a0c (failing contrast)
      const ratioLow = calculateContrastRatio('#62676d', '#0a0a0c');
      assert.ok(ratioLow < 4.5, `Expected #62676d on #0a0a0c to fail WCAG AA (got ${ratioLow})`);

      // Verified high-contrast text #e2e8f0 on #0a0a0c (passing contrast)
      const ratioHigh = calculateContrastRatio('#e2e8f0', '#0a0a0c');
      assert.ok(ratioHigh >= 4.5, `Expected #e2e8f0 on #0a0a0c to pass WCAG AA (got ${ratioHigh})`);
    });

    it('should evaluate WCAG AA and AAA compliance thresholds', () => {
      const passAA = meetsWcagAA('#000000', '#ffffff');
      assert.equal(passAA.pass, true);
      assert.equal(passAA.minRequired, 4.5);

      const passAAA = meetsWcagAAA('#000000', '#ffffff');
      assert.equal(passAAA.pass, true);
      assert.equal(passAAA.minRequired, 7.0);
    });

    it('should blend semi-transparent colors over backgrounds', () => {
      const blended = blendColors({ r: 255, g: 255, b: 255, a: 0.5 }, { r: 0, g: 0, b: 0, a: 1 });
      assert.equal(blended.r, 128);
      assert.equal(blended.g, 128);
      assert.equal(blended.b, 128);
    });

    it('should format empty axe violations gracefully', () => {
      const formatted = formatAxeViolations({ violations: [] } as any);
      assert.equal(formatted, 'No accessibility violations found.');
    });
  });

  describe('Database Stub & Contract Verification', () => {
    it('should isolate environment variables with withTemporaryEnv', async () => {
      const original = process.env.TEST_HARNESS_VAR;
      await withTemporaryEnv({ TEST_HARNESS_VAR: 'temporary-active' }, async () => {
        assert.equal(process.env.TEST_HARNESS_VAR, 'temporary-active');
      });
      assert.equal(process.env.TEST_HARNESS_VAR, original);
    });

    it('should assert rejection when database client is unconfigured', async () => {
      const proxy = createMockNeonProxy({ throwOnQuery: true, errorMessage: 'Neon database client unconfigured' });
      const result = await assertDbRejectionOnUnconfigured(async () => {
        return await proxy('SELECT 1');
      });
      assert.equal(result.rejected, true);
      assert.ok(result.errorMessage.includes('unconfigured'));
    });

    it('should detect synthetic mock fallbacks in payloads', () => {
      const cleanPayload = { id: 'usr_12345', name: 'Production User', trace: 'trace-live-99' };
      const dirtyPayload = { id: 'mock-id', name: 'Demo User', trace: 'mock-trace' };

      const cleanResult = assertNoMockFallbacks(cleanPayload);
      assert.equal(cleanResult.hasMocks, false);
      assert.equal(cleanResult.violations.length, 0);

      const dirtyResult = assertNoMockFallbacks(dirtyPayload);
      assert.equal(dirtyResult.hasMocks, true);
      assert.ok(dirtyResult.violations.length >= 2);
    });

    it('should verify PostgreSQL array overlap operator syntax', () => {
      const validQuery = 'SELECT * FROM findings WHERE ARRAY[$1]::text[] && wcag';
      const checkValid = verifyArrayQueryOperator(validQuery);
      assert.equal(checkValid.usesArrayOverlap, true);

      const invalidQuery = 'SELECT * FROM findings WHERE wcag = $1';
      const checkInvalid = verifyArrayQueryOperator(invalidQuery);
      assert.equal(checkInvalid.invalidScalarComparison, true);
    });
  });

  describe('Server & Browser Fixture Exports', () => {
    it('should export all server fixture control functions', () => {
      assert.equal(typeof isServerRunning, 'function');
      assert.equal(typeof ensureServerRunning, 'function');
      assert.equal(typeof stopServer, 'function');
    });

    it('should export all browser fixture control functions', () => {
      assert.equal(typeof getBrowser, 'function');
      assert.equal(typeof createContext, 'function');
      assert.equal(typeof createPage, 'function');
      assert.equal(typeof navigateTo, 'function');
      assert.equal(typeof closeBrowser, 'function');
    });
  });

});
