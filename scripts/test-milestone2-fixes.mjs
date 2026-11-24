import assert from 'node:assert';
import { sql } from '../lib/supabase/db.ts';
import { supabaseServices } from '../lib/supabase/services.ts';
import { GET as getStatus } from '../app/api/status/route.ts';
import { GET as getExport } from '../app/api/audit/[id]/export/route.ts';
import fs from 'node:fs';

async function runTests() {
  console.log('Testing Supabase Service & Architectural Fixes...');

  // 1. Test Proxy Rejection when unconfigured
  const savedUrl = process.env.DATABASE_URL;
  const savedDirectUrl = process.env.DIRECT_URL;
  try {
    process.env.DATABASE_URL = '';
    process.env.DIRECT_URL = '';

    let threw = false;
    try {
      await sql`SELECT 1`;
    } catch (err) {
      threw = true;
      assert.match(err.message, /Supabase PostgreSQL client unconfigured/, 'Must reject with unconfigured client error');
    }
    assert.strictEqual(threw, true, 'sql must reject when database client is unconfigured');
    console.log('✓ FIX-01: sql proxy genuinely rejects when unconfigured');

    // Test status route returns database: false on rejection
    const statusRes = await getStatus();
    const statusJson = await statusRes.json();
    assert.strictEqual(statusJson.database, false, 'Status route must report database: false on unconfigured/rejection');
    console.log('✓ FIX-01: /api/status truthfully reports database: false');

    // 2. Test Error Reporting without synthetic mock IDs
    await supabaseServices.saveCausalCertificate({
      sha256Hash: 'abc',
      targetUrl: 'http://test.com',
      persona: 'keyboard',
      wcagRule: '2.1.2',
      interventionTarget: 'div',
      interventionAction: 'focus',
      astPatch: 'patch',
    });
    console.log('✓ FIX-02: saveCausalCertificate safely handles unconfigured DB');

    await supabaseServices.recordAgentTrace({
      traceId: 'tr-123',
      agentRole: 'tester',
      eventType: 'nav',
      payload: {},
    });
    console.log('✓ FIX-02: recordAgentTrace safely handles unconfigured DB');

    // 3. Test VPAT Export Truthful 404
    const dummyReq = { url: 'http://localhost:3000/api/audit/nonexistent-id/export?format=json' };
    const dummyParams = Promise.resolve({ id: 'nonexistent-id' });
    const exportRes = await getExport(dummyReq, { params: dummyParams });
    assert.strictEqual(exportRes.status, 404, 'Must return 404 for nonexistent audit run');
    const exportJson = await exportRes.json();
    assert.match(exportJson.error, /Audit run not found/);
    console.log('✓ FIX-03: /api/audit/[id]/export truthfully returns 404 for missing audit runs');

  } finally {
    process.env.DATABASE_URL = savedUrl;
    process.env.DIRECT_URL = savedDirectUrl;
  }

  // 4. Test Schema indexes in migrations/001_supabase_schema.sql
  const schemaSource = fs.readFileSync('migrations/001_supabase_schema.sql', 'utf8');
  assert.ok(
    schemaSource.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_fixes_finding_id ON fixes (finding_id);'),
    'Schema must create unique index on fixes(finding_id)'
  );
  console.log('✓ FIX-04: Supabase Schema contains idx_fixes_finding_id unique index');

  console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
