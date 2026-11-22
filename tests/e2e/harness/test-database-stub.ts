/**
 * BarrierLens E2E Test Suite - Test Database Stub & Contract Verifier
 * 
 * Provides assertions and utilities for validating Neon Serverless Postgres
 * contracts:
 * - F28: True error rejection when database client is unconfigured
 * - F29: Absence of synthetic mock fallbacks ('mock-id', 'mock-trace')
 * - F31: PostgreSQL TEXT[] array query operator compatibility ('&&')
 * - F32: Schema uniqueness constraint on fixes(finding_id)
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Runs an asynchronous block with temporary environment variables and guarantees restoration.
 */
export async function withTemporaryEnv<T>(
  temporaryVars: Record<string, string | undefined>,
  action: () => Promise<T>
): Promise<T> {
  const originalValues: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(temporaryVars)) {
    originalValues[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await action();
  } finally {
    for (const [key, orig] of Object.entries(originalValues)) {
      if (orig === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = orig;
      }
    }
  }
}

/**
 * Asserts that a database operation rejects with an error when unconfigured,
 * rather than silently returning an empty result or mock data (F28).
 */
export async function assertDbRejectionOnUnconfigured(
  queryFn: () => Promise<any>
): Promise<{ rejected: boolean; errorMessage: string; error: any }> {
  try {
    const result = await queryFn();
    return {
      rejected: false,
      errorMessage: `Expected query to reject, but it resolved with: ${JSON.stringify(result)}`,
      error: null,
    };
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    const matchesContract = message.toLowerCase().includes('unconfigured') ||
      message.toLowerCase().includes('database') ||
      message.toLowerCase().includes('neon');

    return {
      rejected: true,
      errorMessage: message,
      error: err,
    };
  }
}

const MOCK_PATTERNS = [
  'mock-id',
  'mock-trace',
  'mock-finding',
  'mock-run',
  'mock-patch',
  'mock-session',
];

/**
 * Recursively scans a payload to verify no synthetic mock fallbacks are present (F29).
 */
export function assertNoMockFallbacks(
  payload: any,
  currentPath = ''
): { hasMocks: boolean; violations: string[] } {
  const violations: string[] = [];

  function scan(val: any, p: string) {
    if (val === null || val === undefined) return;

    if (typeof val === 'string') {
      for (const pattern of MOCK_PATTERNS) {
        if (val.toLowerCase().includes(pattern)) {
          violations.push(`Violation at "${p}": contained mock marker "${pattern}" (value: "${val}")`);
        }
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => scan(item, `${p}[${idx}]`));
    } else if (typeof val === 'object') {
      for (const [key, value] of Object.entries(val)) {
        scan(value, p ? `${p}.${key}` : key);
      }
    }
  }

  scan(payload, currentPath);

  return {
    hasMocks: violations.length > 0,
    violations,
  };
}

/**
 * Inspects Neon database schema files to verify that unique constraints and indexes are declared (F32).
 */
export function inspectSchemaStatements(schemaFilePath?: string): {
  hasUniqueFindingIdIndex: boolean;
  statements: string[];
  rawContent: string;
} {
  const targetPath = schemaFilePath || path.resolve(process.cwd(), 'lib/neon/schema.ts');
  if (!fs.existsSync(targetPath)) {
    return {
      hasUniqueFindingIdIndex: false,
      statements: [],
      rawContent: '',
    };
  }

  const rawContent = fs.readFileSync(targetPath, 'utf8');
  const hasUniqueFindingIdIndex =
    rawContent.includes('idx_fixes_finding_id') &&
    rawContent.toLowerCase().includes('unique') &&
    rawContent.includes('finding_id');

  const statements = rawContent
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    hasUniqueFindingIdIndex,
    statements,
    rawContent,
  };
}

/**
 * Validates that PostgreSQL array operations use the correct array overlap operator '&&'
 * rather than invalid scalar comparisons on TEXT[] columns (F31).
 */
export function verifyArrayQueryOperator(queryOrCode: string): {
  usesArrayOverlap: boolean;
  invalidScalarComparison: boolean;
  matchedSnippet: string;
} {
  const usesArrayOverlap = /&&|\bunnest\b/i.test(queryOrCode);
  const invalidScalarComparison = /wcag\s*=\s*\$|\$1\s*=\s*wcag/i.test(queryOrCode);

  let matchedSnippet = '';
  const overlapMatch = queryOrCode.match(/(\w+\s*&&\s*\w+|ARRAY\[[^\]]+\]::text\[\]\s*&&\s*\w+)/);
  if (overlapMatch) {
    matchedSnippet = overlapMatch[0];
  }

  return {
    usesArrayOverlap,
    invalidScalarComparison,
    matchedSnippet,
  };
}

/**
 * Factory for creating a controlled Neon proxy stub for test environments.
 */
export function createMockNeonProxy(options: {
  throwOnQuery?: boolean;
  errorMessage?: string;
  mockRows?: any[];
} = {}) {
  const {
    throwOnQuery = false,
    errorMessage = 'Neon database client unconfigured',
    mockRows = [],
  } = options;

  return new Proxy(function () {} as any, {
    apply(_target, _thisArg, args) {
      if (throwOnQuery) {
        return Promise.reject(new Error(errorMessage));
      }
      return Promise.resolve(mockRows);
    },
    get(_target, prop) {
      if (prop === 'then') return undefined;
      return () => {
        if (throwOnQuery) {
          return Promise.reject(new Error(errorMessage));
        }
        return Promise.resolve(mockRows);
      };
    },
  });
}
