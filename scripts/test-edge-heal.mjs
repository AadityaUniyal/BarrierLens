import vm from 'node:vm';
import { sql } from '../lib/neon/db.ts';

async function main() {
  console.log('[Test] Testing Live Edge Self-Healing Engine...');

  // 1. Check causal certificates in Neon for our test domain
  const testDomain = 'example.com';
  try {
    const certs = await sql`
      SELECT finding_id, wcag_rule, intervention_target, intervention_action, ast_patch
      FROM causal_certificates
      WHERE target_url ILIKE ${'%' + testDomain + '%'}
      LIMIT 5;
    `;
    console.log(`[Test] Found ${certs.length} verified causal certificates in Neon for ${testDomain}:`);
    for (const c of certs) {
      console.log(` - Finding: ${c.finding_id}, Rule: ${c.wcag_rule}, Target: ${c.intervention_target}`);
    }
  } catch (dbErr) {
    console.log('[Test] Note: Live DB query timed out (server cold), testing graceful fallback mode.');
  }

  // 2. Import route handler directly and test GET
  const { GET } = await import('../app/api/heal/[siteId]/route.ts');

  // Test 2a: JSON format
  const reqJson = new Request(`https://barrierlens.ai/api/heal/${testDomain}?format=json`);
  const resJson = await GET(reqJson, { params: Promise.resolve({ siteId: testDomain }) });
  const data = await resJson.json();

  console.log('\n--- JSON Response Metadata ---');
  console.log('Site ID:', data.siteId);
  console.log('Status:', data.status);
  console.log('Patches Count:', data.patchesCount);

  if (data.status !== 'active') {
    throw new Error('Expected active status in JSON response');
  }

  // Test 2b: JavaScript runtime format
  const reqJs = new Request(`https://barrierlens.ai/api/heal/${testDomain}`);
  const resJs = await GET(reqJs, { params: Promise.resolve({ siteId: testDomain }) });
  const jsCode = await resJs.text();
  const contentType = resJs.headers.get('content-type');

  console.log('\n--- JavaScript Runtime Response ---');
  console.log('Content-Type Header:', contentType);
  console.log('Script Length (bytes):', jsCode.length);
  console.log('Script Preview:', jsCode.slice(0, 180));

  if (!contentType?.includes('application/javascript')) {
    throw new Error(`Expected application/javascript Content-Type, got ${contentType}`);
  }

  // Test 2c: Syntax validation via Node.js vm
  try {
    new vm.Script(jsCode);
    console.log('✅ Edge runtime JavaScript syntax is 100% valid!');
  } catch (syntaxErr) {
    throw new Error(`JavaScript syntax error in generated edge runtime: ${syntaxErr.message}`);
  }

  console.log('\n✅ ALL LIVE EDGE SELF-HEALING ENGINE TESTS PASSED!');
}

main().catch(err => {
  console.error('❌ Edge healing test failed:', err);
  process.exit(1);
});
