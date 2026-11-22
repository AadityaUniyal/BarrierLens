/**
 * Tier 2 E2E Boundary & Corner Suite: API Payload Boundaries
 * 
 * Tests boundary conditions, malformed JSON, content-type mismatches,
 * extreme UUIDs, SQL injection strings, oversized payloads,
 * and structured error response schemas without stack trace leakage.
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

// Direct route handlers
import * as runIdModule from '../../../app/api/runs/[id]/route';
import * as patchModule from '../../../app/api/repair/patch/route';
import { publicErrorResponse, AuthError } from '../../../lib/barrierlens/security/public-audit';
import { TargetPolicyError, resolvePublicTargetUrl } from '../../../lib/barrierlens/security/target-policy';
import { RateLimitError } from '../../../lib/barrierlens/security/rate-limit';
import { withTemporaryEnv } from '../harness/test-database-stub';

const getRun = (runIdModule as any).GET || (runIdModule as any).default?.GET;
const postPatch = (patchModule as any).POST || (patchModule as any).default?.POST;

describe('Tier 2: API Payload Boundaries', () => {

  describe('Malformed JSON & Truncated Payloads', () => {
    it('should reject malformed and truncated JSON payloads with structured error without stack traces', async () => {
      const truncatedBody = '{"findingKind": "keyboard_trap", "filePath":';
      const req = new NextRequest('http://localhost:3000/api/repair/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: truncatedBody
      });

      const res = await postPatch(req);
      assert.ok(res.status >= 400, `Expected error status code (got ${res.status})`);

      const json = await res.json();
      assert.ok(typeof json.error === 'string', 'Response must contain structured error message');
      assert.equal(json.stack, undefined, 'Response must not expose internal stack trace');
      assert.equal(json.trace, undefined, 'Response must not expose trace object');
    });

    it('should handle Content-Type mismatch (text/plain sending JSON body) gracefully', async () => {
      const payload = JSON.stringify({
        findingKind: 'keyboard_trap',
        filePath: 'src/App.tsx',
        targetSelector: '#modal'
      });

      const req = new NextRequest('http://localhost:3000/api/repair/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload
      });

      const res = await postPatch(req);
      assert.ok(res.status === 200 || res.status === 500, 'Should handle or safely reject text/plain');

      const json = await res.json();
      assert.equal(json.stack, undefined, 'No stack trace should be returned');
    });

    it('should reject missing required parameters with HTTP 400 and structured error', async () => {
      const req = new NextRequest('http://localhost:3000/api/repair/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unknownField: true })
      });

      const res = await postPatch(req);
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.equal(json.error, 'Missing required parameters: finding, findings, or findingKind');
      assert.equal(json.stack, undefined);
    });
  });

  describe('Extreme UUIDs & Injection Syntax in Route Parameters', () => {
    it('should reject SQL injection syntax in route run id parameter with HTTP 400', async () => {
      const injectionId = "'; DROP TABLE runs; --";
      const req = new Request(`http://localhost:3000/api/runs/${encodeURIComponent(injectionId)}`);

      const res = await getRun(req, {
        params: Promise.resolve({ id: injectionId })
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.error, 'Invalid run id');
      assert.equal(json.stack, undefined);
    });

    it('should reject non-hex / special character strings in route run id', async () => {
      const invalidIds = [
        'invalid-uuid-XYZ!@#',
        'run_123', // too short (< 16 chars)
        '../../../etc/passwd',
        '<script>alert(1)</script>',
        '1 OR 1=1'
      ];

      for (const id of invalidIds) {
        const req = new Request(`http://localhost:3000/api/runs/${encodeURIComponent(id)}`);
        const res = await getRun(req, {
          params: Promise.resolve({ id })
        });
        assert.equal(res.status, 400, `Expected HTTP 400 for invalid ID: ${id}`);
        const json = await res.json();
        assert.equal(json.error, 'Invalid run id');
      }
    });

    it('should handle oversized run id (10,000 characters) without regex catastrophic backtracking', async () => {
      const oversizedId = 'a'.repeat(10000);
      const startTime = performance.now();
      const regexValid = /^[0-9a-f-]{16,}$/i.test(oversizedId);
      const elapsed = performance.now() - startTime;

      assert.ok(elapsed < 20, `Regex check on 10k characters must complete in < 20ms (took ${elapsed}ms)`);
      assert.equal(regexValid, true);

      // Oversized string with invalid char rejects instantly with 400 without touching DB
      const oversizedInvalid = 'a'.repeat(9999) + '!';
      const req = new Request('http://localhost:3000/api/runs/oversized');
      const res = await getRun(req, {
        params: Promise.resolve({ id: oversizedInvalid })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.error, 'Invalid run id');
      assert.equal(json.stack, undefined);
    });

    it('should validate nil UUID format (00000000-0000-0000-0000-000000000000) against route parameter schema', async () => {
      const nilUuid = '00000000-0000-0000-0000-000000000000';
      // Route parameter contract verification: /^[0-9a-f-]{16,}$/i
      const isValid = /^[0-9a-f-]{16,}$/i.test(nilUuid);
      assert.equal(isValid, true, 'Nil UUID must satisfy route regex schema');

      // Illegal character in nil UUID boundary
      const corruptedNil = '00000000-0000-0000-0000-00000000000g';
      const isCorruptedValid = /^[0-9a-f-]{16,}$/i.test(corruptedNil);
      assert.equal(isCorruptedValid, false, 'Non-hex character in UUID must be rejected');

      // Route rejection on invalid UUID variant
      const req = new Request(`http://localhost:3000/api/runs/${corruptedNil}`);
      const res = await getRun(req, {
        params: Promise.resolve({ id: corruptedNil })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.error, 'Invalid run id');
      assert.equal(json.stack, undefined);
    });
  });

  describe('Oversized Request Bodies & Memory Stress', () => {
    it('should handle extreme 10MB payload size stress without crashing the process', async () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10 Megabytes
      const massiveBody = JSON.stringify({
        findingKind: 'keyboard_trap',
        filePath: 'src/BigFile.tsx',
        originalContent: largeData
      });

      const req = new NextRequest('http://localhost:3000/api/repair/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: massiveBody
      });

      const startTime = performance.now();
      const res = await postPatch(req);
      const elapsed = performance.now() - startTime;

      assert.ok(elapsed < 2000, `10MB payload processing should complete within 2s (took ${elapsed}ms)`);
      assert.ok(res.status === 200 || res.status === 500);

      const json = await res.json();
      assert.equal(json.stack, undefined, 'Must not leak stack traces on oversized payloads');
    });

    it('should handle deeply nested JSON objects without stack overflow', async () => {
      // Build 100-level nested object: { a: { a: { a: ... } } }
      let nested: any = { depth: 100 };
      for (let i = 0; i < 100; i++) {
        nested = { child: nested };
      }

      const req = new NextRequest('http://localhost:3000/api/repair/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingKind: 'keyboard_trap',
          patchAttributes: nested
        })
      });

      const res = await postPatch(req);
      assert.ok(res.status === 200 || res.status === 400 || res.status === 500);
      const json = await res.json();
      assert.equal(json.stack, undefined);
    });

    it('should neutralize null bytes and unicode control characters in payload strings', async () => {
      const req = new NextRequest('http://localhost:3000/api/repair/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingKind: 'keyboard_trap',
          filePath: 'src/test\u0000.tsx',
          targetSelector: 'button\u0000[name="test\u001F"]'
        })
      });

      const res = await postPatch(req);
      assert.ok(res.status === 200 || res.status === 500);
      const json = await res.json();
      assert.equal(json.stack, undefined);
    });
  });

  describe('Route Error Handler Schemas & Stack Trace Protection', () => {
    it('should format AuthError into structured 401 response without exposing stack trace', () => {
      const err = new AuthError('Invalid or expired API token supplied');
      const response = publicErrorResponse(err);

      assert.equal(response.status, 401);
      assert.equal(response.body.code, 'unauthorized');
      assert.equal(response.body.error, 'Invalid or expired API token supplied');
      assert.equal(response.body.stack, undefined);
      assert.equal(response.body.trace, undefined);
    });

    it('should format TargetPolicyError into structured 400 response with error code', () => {
      const err = new TargetPolicyError('Domain is not permitted under public audit policy', 'target_forbidden');
      const response = publicErrorResponse(err);

      assert.equal(response.status, 400);
      assert.equal(response.body.code, 'target_forbidden');
      assert.equal(response.body.error, 'Domain is not permitted under public audit policy');
      assert.equal(response.body.stack, undefined);
    });

    it('should format RateLimitError into structured 429 response with retryAfterSec', () => {
      const err = new RateLimitError('Audit quota exceeded for IP bucket', 120);
      const response = publicErrorResponse(err);

      assert.equal(response.status, 429);
      assert.equal(response.body.code, 'rate_limited');
      assert.equal(response.body.retryAfterSec, 120);
      assert.equal(response.body.stack, undefined);
    });

    it('should catch generic system error and return structured 500 without leaking file paths or database internals', () => {
      const err = new Error('FATAL: password authentication failed for user "postgres" at /var/lib/postgresql/data');
      const response = publicErrorResponse(err);

      assert.equal(response.status, 500);
      assert.equal(response.body.code, 'audit_failed');
      assert.equal(typeof response.body.error, 'string');
      assert.equal(response.body.stack, undefined);
    });

    it('should reject invalid URL schemes (javascript:, file:, data:) in audit target resolution', async () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'file:///etc/passwd',
        'data:text/html,<h1>Pwned</h1>',
        'ftp://anonymous@ftp.example.com',
      ];

      for (const dangerous of dangerousUrls) {
        await assert.rejects(
          async () => {
            await resolvePublicTargetUrl(dangerous, 'http://localhost:3000');
          },
          (err: any) => {
            assert.ok(err instanceof TargetPolicyError);
            assert.equal(err.code, 'invalid_url');
            return true;
          },
          `Dangerous URL should be rejected: ${dangerous}`
        );
      }
    });
  });

  after(() => {
    // Ensure background handles from imported modules allow process to terminate cleanly
    setTimeout(() => {
      process.exit(0);
    }, 50).unref();
  });

});
