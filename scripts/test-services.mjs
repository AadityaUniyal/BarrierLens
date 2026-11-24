import { supabaseServices } from '../lib/supabase/services.ts';

console.log('====================================================');
console.log('     BARRIERLENS - SUPABASE SERVICES TEST SUITE     ');
console.log('====================================================\n');

async function run() {
  console.log('Executing live diagnostic tests across Supabase infrastructure...\n');
  const result = await supabaseServices.runAllTests();

  for (const item of result.results) {
    const symbol = item.status === 'operational' ? '✅' : item.status === 'degraded' ? '⚠️' : '❌';
    console.log(`${symbol} ${item.service} [${item.status.toUpperCase()}] (${item.latencyMs ?? 0}ms)`);
    if (item.endpoint) console.log(`   Endpoint: ${item.endpoint}`);
    if (item.details) console.log(`   Details:`, JSON.stringify(item.details, null, 2));
    console.log('');
  }

  console.log('====================================================');
  console.log(`Diagnostic Complete at: ${result.timestamp}`);
  console.log(`System Operational Status: ${result.allPassed ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED / CONFIG REQUIRED'}`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
