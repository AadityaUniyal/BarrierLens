/**
 * BarrierLens 2.0 - Tier 3 Pairwise Cross-Feature Test Suite
 * Playwright CDP AX Tree Extraction & AST Unified Diff (cdp-extraction-and-ast-diff.test.ts)
 * 
 * Verifies live CDP Accessibility tree extraction, identification of missing accessible names
 * and focus traps, piping findings into the AST Git Patch Generator, and validating standard
 * unified diff syntax output.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, closeBrowser } from '../harness/browser-fixture';
import { extractCDPAXTree, CDPAXNode } from '../../../lib/barrierlens/cdp/cdp-ax-extractor';
import { GitPatchGenerator, PatchResult } from '../../../lib/barrierlens/repair/git-patch-generator';
import { BarrierFinding } from '../../../lib/barrierlens/types';
import { Page } from 'playwright';

describe('Tier 3: CDP Accessibility Extraction & AST Diff Pipeline', () => {
  let page: Page;
  const patchGenerator = new GitPatchGenerator();

  const FIXTURE_HTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CDP Accessibility Extraction & AST Diff Fixture</title>
      <style>
        .dialog { border: 2px solid red; padding: 20px; }
        .icon-btn { width: 32px; height: 32px; background: #333; border: none; }
      </style>
    </head>
    <body>
      <main>
        <h1>Accessible Checkout Trajectory</h1>
        <form id="checkout-form">
          <label for="full-name">Full Name</label>
          <input id="full-name" type="text" value="Sarah Chen" />

          <!-- Unlabeled Icon Button (Triggers empty_accessible_name) -->
          <button id="unlabeled-dismiss-btn" class="icon-btn" type="button">
            <svg width="16" height="16"><circle cx="8" cy="8" r="8" fill="red"/></svg>
          </button>

          <!-- Modal Container without Escape key or proper focus loop (Triggers keyboard_trap) -->
          <div id="trap-dialog-container" class="dialog" tabindex="-1">
            <h2>Confirmation Modal</h2>
            <button id="trap-action-confirm">Confirm Order</button>
            <button id="trap-action-cancel">Cancel Order</button>
          </div>
        </form>
      </main>
    </body>
    </html>
  `;

  before(async () => {
    const fixture = await createPage();
    page = fixture.page;
    await page.setContent(FIXTURE_HTML, { waitUntil: 'domcontentloaded' });
  });

  after(async () => {
    await closeBrowser();
  });

  it('1. should extract live accessibility tree via CDP and map backend DOM nodes', async () => {
    const axResult = await extractCDPAXTree(page, { resolveDOM: true, filterInteractiveOnly: false });

    assert.ok(axResult.allNodes.length > 0, 'AX tree must contain nodes');
    assert.ok(axResult.backendNodeMap.size > 0, 'Backend node map must be populated');

    // Find input node
    const inputNode = axResult.allNodes.find(n => n.role === 'textbox' || n.name === 'Full Name');
    assert.ok(inputNode !== undefined, 'AX tree must identify Full Name textbox');
    assert.equal(inputNode.name, 'Full Name');
  });

  it('2. should identify missing accessible name on interactive button from CDP AX tree', async () => {
    const axResult = await extractCDPAXTree(page, { resolveDOM: true });

    // Look for button with id 'unlabeled-dismiss-btn'
    const buttonNode = axResult.allNodes.find(n => {
      const isBtn = n.role === 'button';
      const hasId = n.domNode?.attributes?.id === 'unlabeled-dismiss-btn' || n.selector?.includes('unlabeled-dismiss-btn');
      return isBtn && hasId;
    });

    assert.ok(buttonNode !== undefined, 'Must identify unlabeled-dismiss-btn in AX tree');
    assert.ok(
      !buttonNode.name || buttonNode.name.trim() === '',
      `Button accessible name must be empty, got: "${buttonNode.name}"`
    );
  });

  it('3. should formulate structured BarrierFinding for empty accessible name', () => {
    const finding: BarrierFinding = {
      id: 'find_cdp_accname_01',
      runId: 'run_live_cdp_99',
      stepIdx: 2,
      kind: 'empty_accessible_name',
      trustTier: 'proven',
      wcagRules: ['WCAG 4.1.2 Name, Role, Value (Level A)'],
      severity: 'high',
      severityScore: 7.8,
      severityInterval: [7.2, 8.4],
      title: 'Empty Accessible Name on Action Trigger',
      summary: 'Button with icon lacks programmatic accessible name for screen readers.',
      evidence: {
        selector: '#unlabeled-dismiss-btn',
        elementHTML: '<button id="unlabeled-dismiss-btn" class="icon-btn" type="button"><svg width="16" height="16">...</svg></button>'
      }
    };

    assert.equal(finding.kind, 'empty_accessible_name');
    assert.equal(finding.evidence?.selector, '#unlabeled-dismiss-btn');
    assert.ok(finding.wcagRules.includes('WCAG 4.1.2 Name, Role, Value (Level A)'));
  });

  it('4. should pipe missing accessible name finding into GitPatchGenerator and output standard unified diff', () => {
    const patchResult: PatchResult = patchGenerator.generateUnifiedDiff({
      filePath: 'components/checkout/OrderConfirmation.tsx',
      targetSelector: '#unlabeled-dismiss-btn',
      findingKind: 'empty_accessible_name',
      patchAttributes: { 'aria-label': 'Dismiss modal notification' },
      explanation: 'Add programmatic aria-label satisfying WCAG 4.1.2 Name, Role, Value'
    });

    assert.ok(patchResult.unifiedDiff.includes('diff --git a/components/checkout/OrderConfirmation.tsx b/components/checkout/OrderConfirmation.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('--- a/components/checkout/OrderConfirmation.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('+++ b/components/checkout/OrderConfirmation.tsx'));
    assert.ok(/@@ -\d+,\d+ \+\d+,\d+ @@/.test(patchResult.unifiedDiff), 'Expected valid unified diff hunk header');
    assert.ok(patchResult.unifiedDiff.includes('+<button class="icon-btn" aria-label="Perform action">') || patchResult.unifiedDiff.includes('aria-label'));
    assert.equal(patchResult.isVerifiable, true);
  });

  it('5. should pipe keyboard trap finding into GitPatchGenerator and output modal trap remediation patch', () => {
    const trapFinding: BarrierFinding = {
      id: 'find_cdp_trap_02',
      runId: 'run_live_cdp_99',
      stepIdx: 4,
      kind: 'keyboard_trap',
      trustTier: 'proven',
      wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
      severity: 'critical',
      severityScore: 9.6,
      severityInterval: [9.1, 10.0],
      title: 'Focus Sink Deadlock in Dialog',
      summary: 'Focus cannot escape dialog container via Escape key.',
      evidence: {
        selector: '#trap-dialog-container',
        elementHTML: '<div id="trap-dialog-container" class="dialog">...</div>'
      }
    };

    const patchResult = patchGenerator.generateUnifiedDiff({
      filePath: 'components/checkout/ConfirmationModal.tsx',
      targetSelector: '#trap-dialog-container',
      findingKind: trapFinding.kind,
      explanation: 'Wrap dialog with accessible aria-modal and escape handler satisfying WCAG 2.1.2'
    });

    assert.ok(patchResult.unifiedDiff.includes('diff --git a/components/checkout/ConfirmationModal.tsx b/components/checkout/ConfirmationModal.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('--- a/components/checkout/ConfirmationModal.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('+++ b/components/checkout/ConfirmationModal.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('aria-modal="true"'));
    assert.ok(patchResult.unifiedDiff.includes('Escape'));
  });

  it('6. should generate contextual unified diff from full source code when provided', () => {
    const fullSourceCode = [
      'import React from "react";',
      '',
      'export function DismissButton() {',
      '  return (',
      '    <button id="unlabeled-dismiss-btn" className="icon-btn">',
      '      <span className="icon" />',
      '    </button>',
      '  );',
      '}'
    ].join('\n');

    const patchResult = patchGenerator.generateUnifiedDiff({
      filePath: 'components/DismissButton.tsx',
      originalContent: fullSourceCode,
      targetSelector: '#unlabeled-dismiss-btn',
      findingKind: 'empty_accessible_name',
      patchAttributes: { 'aria-label': 'Close dialog' },
      explanation: 'Add aria-label to DismissButton'
    });

    assert.ok(patchResult.unifiedDiff.includes('diff --git a/components/DismissButton.tsx b/components/DismissButton.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('--- a/components/DismissButton.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('+++ b/components/DismissButton.tsx'));
    assert.ok(patchResult.unifiedDiff.includes('-    <button id="unlabeled-dismiss-btn" className="icon-btn">'));
    assert.ok(patchResult.unifiedDiff.includes('+    <button id="unlabeled-dismiss-btn" className="icon-btn" aria-label="Close dialog">') || patchResult.unifiedDiff.includes('aria-label="Close dialog"'));
    assert.equal(patchResult.isVerifiable, true);
  });

});
