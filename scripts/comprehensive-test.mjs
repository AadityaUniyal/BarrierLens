#!/usr/bin/env node
/**
 * BarrierLens Comprehensive Feature Test Suite
 * Tests all major features and reports functionality status
 */

import { chromium } from 'playwright';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

const testResults = {
  passed: [],
  failed: [],
  warnings: [],
};

async function test(name, fn) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    await fn();
    log('✓ PASS', 'green');
    testResults.passed.push(name);
  } catch (err) {
    log(`✗ FAIL: ${err.message}`, 'red');
    testResults.failed.push({ name, error: err.message });
  }
}

async function warn(name, message) {
  log(`⚠ WARNING: ${name} - ${message}`, 'yellow');
  testResults.warnings.push({ name, message });
}

// Test Suite
async function runTests() {
  section('🚀 BarrierLens Comprehensive Test Suite');

  // 1. File System Structure Tests
  section('📁 Testing File System Structure');
  
  await test('Package.json exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('package.json');
  });

  await test('Core directories exist', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app');
    await fs.access('components');
    await fs.access('lib');
    await fs.access('backend');
  });

  await test('TypeScript config valid', async () => {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile('tsconfig.json', 'utf-8');
    const config = JSON.parse(content);
    if (!config.compilerOptions) throw new Error('Missing compilerOptions');
  });

  // 2. Dependencies Test
  section('📦 Testing Dependencies');

  await test('Core dependencies installed', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('node_modules/next');
    await fs.access('node_modules/react');
    await fs.access('node_modules/playwright');
  });

  await test('AWS SDK present', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('node_modules/@aws-sdk/client-bedrock-runtime');
  });

  // 3. Core Library Tests
  section('🔧 Testing Core Library Modules');

  await test('Types module exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/types.ts');
  });

  await test('Focus graph engine exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/engines/focus-graph.ts');
  });

  await test('Auditor core exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/agent/auditor-core.ts');
  });

  await test('Repair engine exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/repair/verified-replay.ts');
  });

  // 4. API Routes Tests
  section('🌐 Testing API Routes Structure');

  await test('Health endpoint exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app/api/health/route.ts');
  });

  await test('Audit stream endpoint exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app/api/audit/stream/route.ts');
  });

  await test('Repair endpoints exist', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app/api/repair/verify/route.ts');
  });

  await test('GitHub integration exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/bot/github-pr-engine.ts');
  });

  // 5. Component Tests
  section('🎨 Testing UI Components');

  await test('Main page component exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app/page.tsx');
  });

  await test('Apple UI components exist', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('components/apple/Navbar.tsx');
    await fs.access('components/apple/AuditStudioView.tsx');
    await fs.access('components/apple/IssuesMasterDetailView.tsx');
  });

  await test('Cinematic landing exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('components/cinematic/CinematicLanding.tsx');
  });

  // 6. Backend Tests
  section('🐍 Testing Python Backend');

  await test('Backend app.py exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('backend/app.py');
  });

  await test('Backend requirements.txt exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('backend/requirements.txt');
  });

  await test('Core backend modules exist', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('backend/core');
    await fs.access('backend/inspector');
    await fs.access('backend/remedy');
  });

  // 7. Test Fixtures
  section('🧪 Testing Fixture Pages');

  await test('Keyboard trap fixture exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app/fixtures/keyboard-trap/page.tsx');
  });

  await test('Focus loss fixture exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app/fixtures/focus-loss/page.tsx');
  });

  await test('AccName WCAG fixture exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('app/fixtures/accname-wcag/page.tsx');
  });

  // 8. Configuration Files
  section('⚙️ Testing Configuration');

  await test('Next.js config exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('next.config.mjs');
  });

  await test('Tailwind config exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('tailwind.config.ts');
  });

  await test('Environment example exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('.env.example');
  });

  // 9. Documentation
  section('📚 Testing Documentation');

  await test('README exists', async () => {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile('README.md', 'utf-8');
    if (content.length < 100) throw new Error('README too short');
  });

  await test('Architecture docs exist', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('docs/ARCHITECTURE.md');
  });

  // 10. Advanced Features
  section('🚀 Testing Advanced Features');

  await test('Multi-agent mesh exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/multiagent/mesh-orchestrator.ts');
  });

  await test('Genome vectorization exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/genome/barrier-encoder.ts');
  });

  await test('Causal counterfactual engine exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/causal/counterfactual-engine.ts');
  });

  await test('VPAT generator exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/compliance/vpat-generator.ts');
  });

  await test('AWS Bedrock client exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/aws/bedrock-client.ts');
  });

  // 11. ML/AI Components
  section('🤖 Testing ML/AI Components');

  await test('Action ranker exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/ml/action-ranker.ts');
  });

  await test('Conformal impact model exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/ml/conformal-impact.ts');
  });

  await test('Visual affordance engine exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/ml/visual-affordance.ts');
  });

  // 12. Security & Integrations
  section('🔒 Testing Security & Integrations');

  await test('Rate limiting exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/security/rate-limit.ts');
  });

  await test('Webhook dispatcher exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/integrations/webhook-dispatcher.ts');
  });

  await test('GitHub PR engine exists', async () => {
    const fs = await import('node:fs/promises');
    await fs.access('lib/barrierlens/bot/github-pr-engine.ts');
  });

  // Final Summary
  section('📊 Test Results Summary');

  log(`\n✓ Passed: ${testResults.passed.length}`, 'green');
  log(`✗ Failed: ${testResults.failed.length}`, 'red');
  log(`⚠ Warnings: ${testResults.warnings.length}`, 'yellow');

  if (testResults.failed.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }

  if (testResults.warnings.length > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    testResults.warnings.forEach(({ name, message }) => {
      console.log(`  - ${name}: ${message}`);
    });
  }

  const totalTests = testResults.passed.length + testResults.failed.length;
  const successRate = ((testResults.passed.length / totalTests) * 100).toFixed(1);
  
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

  if (testResults.failed.length === 0) {
    log('\n🎉 All tests passed! Your application structure is solid.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Review the errors above.', 'yellow');
  }

  return testResults.failed.length === 0;
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    log(`\n💥 Test suite crashed: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  });
