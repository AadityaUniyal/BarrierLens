#!/usr/bin/env node

/**
 * BarrierLens Model Context Protocol (MCP) Server
 * Enables AI coding assistants (Cursor, Claude Code, Windsurf, Antigravity)
 * to run physical task-conditioned accessibility audits, verify keyboard traps,
 * detect announcement gaps, run dynamic axe scans, rank next actions, and
 * generate unified git patches directly inside the IDE.
 * 
 * Protocol: JSON-RPC 2.0 over standard I/O (stdio)
 */

import readline from 'node:readline';
import { chromium } from 'playwright';
import { FocusGraphEngine } from '../lib/barrierlens/engines/focus-graph.ts';
import { AnnouncementGapDetector } from '../lib/barrierlens/engines/announcement-gap.ts';
import { AccNameProvenanceEngine } from '../lib/barrierlens/engines/accname-provenance.ts';
import { TemporalModelChecker } from '../lib/barrierlens/engines/temporal-model-checker.ts';
import { AxeBaselineRunner } from '../lib/barrierlens/engines/axe-baseline-runner.ts';
import { AuditorCore } from '../lib/barrierlens/agent/auditor-core.ts';
import { ActionRanker } from '../lib/barrierlens/ml/action-ranker.ts';
import { VerifiedRepairEngine } from '../lib/barrierlens/repair/verified-replay.ts';
import { GitPatchGenerator } from '../lib/barrierlens/repair/git-patch-generator.ts';

const SERVER_NAME = 'barrierlens-mcp';
const SERVER_VERSION = '2.6.0';

const TOOLS = [
  {
    name: 'barrierlens_audit_journey',
    description: 'Execute an autonomous task-conditioned accessibility audit on a URL under a physical user persona (keyboard, screen_reader). Finds multi-step behavioral blockers, computes Metamorphic Effort Ratio, and returns verified certificates.',
    inputSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string', description: 'The absolute URL or local origin to audit (e.g. http://localhost:3000/checkout)' },
        goal: { type: 'string', description: 'Natural-language goal to accomplish (e.g. "Add item to cart and proceed to review")' },
        persona: { type: 'string', enum: ['keyboard', 'screen_reader', 'low_vision'], default: 'keyboard', description: 'Physical interaction persona' },
        maxSteps: { type: 'number', default: 10, description: 'Maximum interaction steps before timeout' }
      },
      required: ['targetUrl', 'goal']
    }
  },
  {
    name: 'barrierlens_certify_keyboard_traps',
    description: 'Perform empirical focus graph traversal using Tarjan SCC algorithm to detect keyboard traps, modal deadlocks, or focus loss. Returns deterministic proof certificates with exact reproducing key sequence.',
    inputSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string', description: 'Target URL to inspect for keyboard traps' },
        maxSteps: { type: 'number', default: 30, description: 'Max Tab / Shift+Tab traversal steps' }
      },
      required: ['targetUrl']
    }
  },
  {
    name: 'barrierlens_verify_patch',
    description: 'Inject a candidate HTML/ARIA fix snippet into a fresh browser sandbox, replay the exact recorded failure trace, and verify that the barrier is eliminated with zero regressions.',
    inputSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string', description: 'Target URL where finding was captured' },
        findingKind: { type: 'string', description: 'Kind of barrier (e.g. keyboard_trap, empty_accessible_name, silent_state_change)' },
        patchHtml: { type: 'string', description: 'Declarative HTML/ARIA replacement snippet' },
        traceKeys: { type: 'array', items: { type: 'string' }, description: 'Recorded sequence of keys to replay' }
      },
      required: ['targetUrl', 'findingKind', 'patchHtml']
    }
  },
  {
    name: 'barrierlens_check_accname',
    description: 'Evaluate an interactive element against the W3C Accessible Name Computation specification to diagnose missing or non-descriptive labels.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of the element' },
        role: { type: 'string', description: 'ARIA role or tagName' },
        computedName: { type: 'string', description: 'Currently resolved name or label' }
      },
      required: ['selector', 'role']
    }
  },
  {
    name: 'barrierlens_rank_action',
    description: 'Use the LightGBM Action Ranker (Tier 1 shortcut) to evaluate candidate interactive elements and predict the optimal next keyboard/focus action towards a user goal in <1ms without LLM latency.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Target goal (e.g. "Submit contact form")' },
        currentFocusSelector: { type: 'string', description: 'Selector of currently focused element' },
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              selector: { type: 'string' },
              role: { type: 'string' },
              name: { type: 'string' },
              tabIndex: { type: 'number' },
              tag: { type: 'string' }
            },
            required: ['selector', 'role', 'name']
          },
          description: 'List of candidate interactive elements'
        }
      },
      required: ['goal', 'candidates']
    }
  },
  {
    name: 'barrierlens_scan_axe_dynamic',
    description: 'Run in-session dynamic axe-core scan on a URL via headless Playwright CDP and return categorized WCAG 2.2 AA violations.',
    inputSchema: {
      type: 'object',
      properties: {
        targetUrl: { type: 'string', description: 'Target URL to evaluate' },
        runOnlyTags: { type: 'array', items: { type: 'string' }, default: ['wcag2a', 'wcag2aa'], description: 'Axe rule tags to evaluate' }
      },
      required: ['targetUrl']
    }
  },
  {
    name: 'barrierlens_generate_patch',
    description: 'Generate standard git-applicable unified diffs (`git apply` compatible) for an accessibility defect, ready to commit or create a PR.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', default: 'src/components/Modal.tsx', description: 'Relative path of the source file to patch' },
        targetSelector: { type: 'string', description: 'CSS selector of the offending element' },
        findingKind: { type: 'string', enum: ['keyboard_trap', 'empty_accessible_name', 'silent_state_change', 'unreachable_control', 'low_kendall_tau'], description: 'Kind of barrier' },
        patchAttributes: { type: 'object', description: 'Key-value map of ARIA attributes to apply' },
        originalContent: { type: 'string', description: 'Optional raw source file contents' }
      },
      required: ['filePath', 'findingKind']
    }
  }
];

function sendResponse(id, result, error = null) {
  const payload = { jsonrpc: '2.0', id };
  if (error) {
    payload.error = error;
  } else {
    payload.result = result;
  }
  process.stdout.write(JSON.stringify(payload) + '\n');
}

async function handleToolCall(name, args) {
  switch (name) {
    case 'barrierlens_audit_journey': {
      const auditor = new AuditorCore();
      const run = await auditor.runAudit(
        args.targetUrl,
        args.goal,
        args.persona || 'keyboard',
        args.maxSteps || 8
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              runId: run.id,
              taskSuccess: run.taskSuccess,
              effortRatio: run.effortRatio,
              tierMix: run.tierMix,
              totalFindings: run.findings.length,
              findings: run.findings.map(f => ({
                id: f.id,
                kind: f.kind,
                trustTier: f.trustTier,
                severity: f.severity,
                title: f.title,
                wcag: f.wcagRules,
                certificate: f.certificate
              }))
            }, null, 2)
          }
        ]
      };
    }

    case 'barrierlens_certify_keyboard_traps': {
      const auditor = new AuditorCore();
      const run = await auditor.runAudit(
        args.targetUrl,
        'Explore all interactive controls and test Escape keys',
        'keyboard',
        args.maxSteps || 10
      );
      const traps = run.findings.filter(f => f.kind === 'keyboard_trap' || f.kind === 'unreachable_control');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              trapsDetected: traps.length > 0,
              certificates: traps.map(t => t.certificate || t.evidence)
            }, null, 2)
          }
        ]
      };
    }

    case 'barrierlens_verify_patch': {
      const replayEngine = new VerifiedRepairEngine();
      const result = await replayEngine.verifyPatch(
        args.targetUrl,
        'mcp_finding_1',
        args.findingKind,
        args.patchHtml,
        args.traceKeys || ['Tab', 'Tab', 'Escape']
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    case 'barrierlens_check_accname': {
      const engine = new AccNameProvenanceEngine();
      const evalResult = engine.evaluateName(args.selector, args.role, args.computedName || '');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(evalResult, null, 2)
          }
        ]
      };
    }

    case 'barrierlens_rank_action': {
      const ranker = new ActionRanker();
      const formattedNodes = (args.candidates || []).map((c, i) => ({
        id: `mcp_node_${i}`,
        role: c.role,
        name: c.name,
        tag: c.tag || 'button',
        selector: c.selector,
        focusable: true,
        tabIndex: c.tabIndex ?? 0,
        box: { x: 100, y: 100 + i * 40, width: 200, height: 35 }
      }));

      const result = await ranker.rankNextActionAsync(
        args.goal,
        formattedNodes,
        args.currentFocusSelector || ''
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    case 'barrierlens_scan_axe_dynamic': {
      let browser = null;
      try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(args.targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const axeRunner = new AxeBaselineRunner();
        const result = await axeRunner.runEvaluation(page, {
          runOnlyTags: args.runOnlyTags || ['wcag2a', 'wcag2aa'],
          timeoutMs: 15000
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                summary: result.summary,
                violationsCount: result.violations.length,
                violations: result.violations.map(v => ({
                  id: v.id,
                  impact: v.impact,
                  description: v.description,
                  help: v.help,
                  helpUrl: v.helpUrl,
                  tags: v.tags,
                  nodesCount: v.nodes.length
                }))
              }, null, 2)
            }
          ]
        };
      } finally {
        if (browser) await browser.close();
      }
    }

    case 'barrierlens_generate_patch': {
      const patchGen = new GitPatchGenerator();
      const result = patchGen.generateUnifiedDiff({
        filePath: args.filePath || 'src/components/Modal.tsx',
        targetSelector: args.targetSelector,
        findingKind: args.findingKind,
        patchAttributes: args.patchAttributes,
        originalContent: args.originalContent
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function processMessage(msg) {
  if (!msg || typeof msg !== 'object') return;
  const { id, method, params } = msg;

  if (method === 'initialize') {
    sendResponse(id, {
      protocolVersion: '2024-11-05',
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      capabilities: { tools: {} }
    });
  } else if (method === 'notifications/initialized') {
    // Client ready notice
  } else if (method === 'tools/list') {
    sendResponse(id, { tools: TOOLS });
  } else if (method === 'tools/call') {
    try {
      const toolResult = await handleToolCall(params.name, params.arguments || {});
      sendResponse(id, toolResult);
    } catch (err) {
      sendResponse(id, null, { code: -32603, message: err.message });
    }
  } else if (method === 'ping') {
    sendResponse(id, {});
  } else {
    sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
  }
}

// Start stdio JSON-RPC loop
const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const parsed = JSON.parse(trimmed);
    processMessage(parsed);
  } catch (err) {
    process.stderr.write(`[MCP Error] Invalid JSON: ${err.message}\n`);
  }
});

process.stderr.write(`[BarrierLens MCP] Server v${SERVER_VERSION} initialized on stdio.\n`);
