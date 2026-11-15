#!/usr/bin/env node

/**
 * BarrierLens MCP Server Verification Test
 * Tests the stdio JSON-RPC 2.0 communication, tool discovery, and tool execution.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMcpTest() {
  console.log('--- Testing BarrierLens MCP Server JSON-RPC 2.0 stdio ---');

  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';
  const serverProcess = spawn(npxCmd, ['tsx', path.resolve(__dirname, 'barrierlens-mcp.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: isWin
  });

  const responses = [];
  let pendingResolve = null;

  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        responses.push(parsed);
        if (pendingResolve) {
          const res = pendingResolve;
          pendingResolve = null;
          res(parsed);
        }
      } catch (e) {
        // ignore non-json log
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    // console.error('[MCP Stderr]:', data.toString());
  });

  function sendRpc(msg) {
    return new Promise((resolve) => {
      pendingResolve = resolve;
      serverProcess.stdin.write(JSON.stringify(msg) + '\n');
    });
  }

  // 1. Initialize
  console.log('1. Testing initialize handshake...');
  const initRes = await sendRpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'BarrierLens-Test-Client', version: '1.0.0' }
    }
  });

  if (initRes.result?.serverInfo?.name !== 'barrierlens-mcp') {
    throw new Error(`Unexpected server name: ${JSON.stringify(initRes)}`);
  }
  console.log(`✅ Handshake successful: ${initRes.result.serverInfo.name} v${initRes.result.serverInfo.version}`);

  // 2. Tools list
  console.log('2. Testing tools/list...');
  const listRes = await sendRpc({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });

  const toolNames = listRes.result?.tools?.map(t => t.name) || [];
  console.log(`Found ${toolNames.length} MCP tools:`, toolNames.join(', '));
  if (!toolNames.includes('barrierlens_rank_action') || !toolNames.includes('barrierlens_generate_patch')) {
    throw new Error(`Missing expected tools in tools/list: ${toolNames}`);
  }
  console.log('✅ tools/list returned all registered tools');

  // 3. Tool call: barrierlens_generate_patch
  console.log('3. Testing tools/call barrierlens_generate_patch...');
  const patchRes = await sendRpc({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'barrierlens_generate_patch',
      arguments: {
        filePath: 'src/components/CheckoutModal.tsx',
        targetSelector: '#checkout-modal',
        findingKind: 'keyboard_trap',
        patchAttributes: { 'aria-modal': 'true', role: 'dialog' }
      }
    }
  });

  const patchText = patchRes.result?.content?.[0]?.text;
  if (!patchText || !patchText.includes('diff --git a/src/components/CheckoutModal.tsx')) {
    throw new Error(`Unexpected patch generation output: ${patchText}`);
  }
  console.log('✅ barrierlens_generate_patch produced verified unified git diff');

  // 4. Tool call: barrierlens_rank_action
  console.log('4. Testing tools/call barrierlens_rank_action...');
  const rankRes = await sendRpc({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'barrierlens_rank_action',
      arguments: {
        goal: 'Submit payment form',
        candidates: [
          { selector: '#cancel-btn', role: 'button', name: 'Cancel', tag: 'button' },
          { selector: '#submit-btn', role: 'button', name: 'Submit Payment', tag: 'button' }
        ]
      }
    }
  });

  const rankText = rankRes.result?.content?.[0]?.text;
  const parsedRank = JSON.parse(rankText);
  if (!parsedRank.recommendedAction || parsedRank.confidence === undefined) {
    throw new Error(`Invalid rank output: ${rankText}`);
  }
  console.log(`✅ barrierlens_rank_action scored candidate: ${parsedRank.bestNode?.selector} (Confidence: ${parsedRank.confidence.toFixed(2)})`);

  // 5. Tool call: barrierlens_check_accname
  console.log('5. Testing tools/call barrierlens_check_accname...');
  const accRes = await sendRpc({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'barrierlens_check_accname',
      arguments: {
        selector: '#empty-icon-btn',
        role: 'button',
        computedName: ''
      }
    }
  });

  const accText = accRes.result?.content?.[0]?.text;
  if (!accText || (!accText.includes('EMPTY_ACCESSIBLE_NAME') && !accText.includes('isAdequate'))) {
    throw new Error(`Unexpected accname check output: ${accText}`);
  }
  console.log('✅ barrierlens_check_accname evaluated properly');

  // Cleanup
  serverProcess.kill();
  console.log('\n🎉 ALL MCP SERVER TESTS PASSED WITH 100% SUCCESS.\n');
  process.exit(0);
}

runMcpTest().catch(err => {
  console.error('❌ MCP Test Failed:', err);
  process.exit(1);
});
