#!/usr/bin/env npx tsx
/**
 * BarrierLens Empirical Challenger Stress Harness (Phase 1: Suites 1 & 3)
 *
 * Rigorously stress-tests:
 * 1. AccName Step 2A Hidden Exception & Pruning
 * 2. Circular & Chained aria-labelledby Dependencies
 * 3. Porter-Duff Alpha Compositing (0 Opacity & Boundaries)
 * 4. WCAG 2.2 2.5.8 Target Size Clearance Circle Geometry
 * 5. CDP AX-Tree Serializer & Trace Assertion Engine
 */

import {
  AccNameProvenanceEngine,
  parseHTMLToVirtualDOM,
  compareWithCDP
} from '../lib/barrierlens/engines/accname-provenance';

import {
  compositeOver,
  calculateContrastRatio,
  calculateRelativeLuminance,
  parseColor,
  evaluateTargetSizeCompliance,
  type TargetCandidate,
  type RGBA
} from '../lib/barrierlens/engines/static-wcag-checks';

import { serializeAXTree, type SerializedAXNode } from '../lib/barrierlens/cdp/ax-serializer';

interface TestStats {
  passed: number;
  failed: number;
  failures: string[];
}

const stats: TestStats = {
  passed: 0,
  failed: 0,
  failures: []
};

function assert(condition: boolean, testId: string, description: string, detail?: string) {
  if (condition) {
    stats.passed++;
    console.log(`  [PASS] ${testId}: ${description}${detail ? ` (${detail})` : ''}`);
  } else {
    stats.failed++;
    const errMsg = `[FAIL] ${testId}: ${description}${detail ? ` (${detail})` : ''}`;
    console.error(`  ${errMsg}`);
    stats.failures.push(errMsg);
  }
}

async function runAllStressTests() {
  console.log('======================================================================');
  console.log('  CHALLENGER EMPIRICAL STRESS HARNESS: SUITES 1 & 3');
  console.log('======================================================================\n');

  const engine = new AccNameProvenanceEngine();

  // =========================================================================
  // SUITE 1: AccName Step 2A Hidden Exception & Pruning Stress
  // =========================================================================
  console.log('--- SUITE 1: AccName Step 2A Hidden Exception & Pruning ---');

  // 1.1 Direct hidden button pruning (display:none)
  const res1_1 = engine.computeAccessibleName('<button style="display:none">Submit Form</button>');
  assert(res1_1.name === '', '1.1.1', 'display:none button yields empty name');
  assert(res1_1.steps.some(s => s.step === '2A' && s.status === 'pruned'), '1.1.2', 'display:none records Step 2A pruned');

  // 1.2 Direct hidden button pruning (aria-hidden="true")
  const res1_2 = engine.computeAccessibleName('<button aria-hidden="true">Delete Item</button>');
  assert(res1_2.name === '', '1.2.1', 'aria-hidden="true" button yields empty name');
  assert(res1_2.steps.some(s => s.step === '2A' && s.status === 'pruned'), '1.2.2', 'aria-hidden records Step 2A pruned');

  // 1.3 Direct hidden button pruning (hidden attribute)
  const res1_3 = engine.computeAccessibleName('<button hidden>Download</button>');
  assert(res1_3.name === '', '1.3.1', 'hidden attribute button yields empty name');

  // 1.4 Direct hidden button pruning (inert attribute)
  const res1_4 = engine.computeAccessibleName('<button inert>Confirm</button>');
  assert(res1_4.name === '', '1.4.1', 'inert attribute button yields empty name');

  // 1.5 Direct hidden button pruning (visibility:hidden)
  const res1_5 = engine.computeAccessibleName('<button style="visibility:hidden">Secret</button>');
  assert(res1_5.name === '', '1.5.1', 'visibility:hidden button yields empty name');

  // 1.6 Authoritative Exception: aria-labelledby pointing to display:none target
  const doc1_6 = parseHTMLToVirtualDOM(`
    <div>
      <div id="desc-display-none" style="display:none">Authoritative Display None</div>
      <button id="btn-1-6" aria-labelledby="desc-display-none"></button>
    </div>
  `);
  const btn1_6 = doc1_6.querySelector('#btn-1-6')!;
  const res1_6 = engine.computeAccessibleName(btn1_6, { documentRoot: doc1_6 });
  assert(res1_6.name === 'Authoritative Display None', '1.6.1', 'aria-labelledby traverses display:none target per §2.A');
  assert(res1_6.steps.some(s => s.step === '2A' && s.description.includes('authoritative aria-labelledby traversal exception')), '1.6.2', 'Step 2A records authoritative exception');

  // 1.7 Authoritative Exception: aria-labelledby pointing to aria-hidden="true" target
  const doc1_7 = parseHTMLToVirtualDOM(`
    <div>
      <div id="desc-aria-hidden" aria-hidden="true">Authoritative Aria Hidden</div>
      <button id="btn-1-7" aria-labelledby="desc-aria-hidden"></button>
    </div>
  `);
  const btn1_7 = doc1_7.querySelector('#btn-1-7')!;
  const res1_7 = engine.computeAccessibleName(btn1_7, { documentRoot: doc1_7 });
  assert(res1_7.name === 'Authoritative Aria Hidden', '1.7.1', 'aria-labelledby traverses aria-hidden="true" target per §2.A');

  // 1.8 Authoritative Exception: aria-labelledby pointing to hidden attribute target
  const doc1_8 = parseHTMLToVirtualDOM(`
    <div>
      <div id="desc-hidden-attr" hidden>Authoritative Hidden Attr</div>
      <button id="btn-1-8" aria-labelledby="desc-hidden-attr"></button>
    </div>
  `);
  const btn1_8 = doc1_8.querySelector('#btn-1-8')!;
  const res1_8 = engine.computeAccessibleName(btn1_8, { documentRoot: doc1_8 });
  assert(res1_8.name === 'Authoritative Hidden Attr', '1.8.1', 'aria-labelledby traverses hidden attribute target per §2.A');

  // 1.9 Authoritative Exception: aria-labelledby pointing to visibility:hidden target
  const doc1_9 = parseHTMLToVirtualDOM(`
    <div>
      <div id="desc-visibility-hidden" style="visibility:hidden">Authoritative Visibility Hidden</div>
      <button id="btn-1-9" aria-labelledby="desc-visibility-hidden"></button>
    </div>
  `);
  const btn1_9 = doc1_9.querySelector('#btn-1-9')!;
  const res1_9 = engine.computeAccessibleName(btn1_9, { documentRoot: doc1_9 });
  assert(res1_9.name === 'Authoritative Visibility Hidden', '1.9.1', 'aria-labelledby traverses visibility:hidden target per §2.A');

  // 1.10 Compound aria-labelledby: mixture of visible and hidden targets
  const doc1_10 = parseHTMLToVirtualDOM(`
    <div>
      <span id="prefix">Billing</span>
      <span id="mid-hidden" style="display:none">Account</span>
      <span id="suffix">Settings</span>
      <button id="btn-1-10" aria-labelledby="prefix mid-hidden suffix"></button>
    </div>
  `);
  const btn1_10 = doc1_10.querySelector('#btn-1-10')!;
  const res1_10 = engine.computeAccessibleName(btn1_10, { documentRoot: doc1_10 });
  assert(res1_10.name === 'Billing Account Settings', '1.10.1', 'Compound aria-labelledby combines visible and hidden targets cleanly');

  // 1.11 Explicit hidden child within aria-labelledby target is pruned per §2.A
  const doc1_11 = parseHTMLToVirtualDOM(`
    <div>
      <div id="nested-target" style="display:none">
        <span>Alpha Visible</span>
        <span style="display:none">Beta Hidden</span>
        <span aria-hidden="true">Gamma Hidden</span>
      </div>
      <button id="btn-1-11" aria-labelledby="nested-target"></button>
    </div>
  `);
  const btn1_11 = doc1_11.querySelector('#btn-1-11')!;
  const res1_11 = engine.computeAccessibleName(btn1_11, { documentRoot: doc1_11 });
  assert(res1_11.name === 'Alpha Visible', '1.11.1', 'Target display:none is unlocked via §2.A, but explicitly hidden child elements within it are pruned', `Got: "${res1_11.name}"`);

  // 1.12 Empty hidden element referenced by aria-labelledby
  const doc1_12 = parseHTMLToVirtualDOM(`
    <div>
      <div id="empty-hidden" style="display:none">   </div>
      <button id="btn-1-12" aria-labelledby="empty-hidden"></button>
    </div>
  `);
  const btn1_12 = doc1_12.querySelector('#btn-1-12')!;
  const res1_12 = engine.computeAccessibleName(btn1_12, { documentRoot: doc1_12 });
  assert(res1_12.name === '', '1.12.1', 'Empty hidden target yields empty accessible name');
  assert(res1_12.diagnostics.includes('aria-labelledby target is empty'), '1.12.2', 'Empty hidden target triggers empty target diagnostic');


  // =========================================================================
  // SUITE 2: Circular & Chained aria-labelledby Dependencies Stress
  // =========================================================================
  console.log('\n--- SUITE 2: Circular & Chained aria-labelledby Dependencies ---');

  // 2.1 Direct Self-Referencing aria-labelledby: element references itself
  const doc2_1 = parseHTMLToVirtualDOM(`
    <div>
      <button id="btn-self" aria-labelledby="btn-self">Button Self Content</button>
    </div>
  `);
  const btn2_1 = doc2_1.querySelector('#btn-self')!;
  const res2_1 = engine.computeAccessibleName(btn2_1, { documentRoot: doc2_1 });
  assert(typeof res2_1.name === 'string', '2.1.1', 'Self-referencing aria-labelledby terminates safely without stack overflow');

  // 2.2 Mutual 2-node cycle: A -> B and B -> A
  const doc2_2 = parseHTMLToVirtualDOM(`
    <div>
      <button id="cycle-a" aria-labelledby="cycle-b">Alpha Text</button>
      <button id="cycle-b" aria-labelledby="cycle-a">Beta Text</button>
    </div>
  `);
  const btn2_2 = doc2_2.querySelector('#cycle-a')!;
  const res2_2 = engine.computeAccessibleName(btn2_2, { documentRoot: doc2_2 });
  assert(res2_2.name === 'Beta Text', '2.2.1', 'Mutual cycle terminates at first hop via §2.B chained prohibition', `Got: "${res2_2.name}"`);

  // 2.3 Strict Mutual Empty Cycle: Both nodes have no contents, only mutual aria-labelledby
  const doc2_3 = parseHTMLToVirtualDOM(`
    <div>
      <div id="empty-cycle-a" aria-labelledby="empty-cycle-b"></div>
      <div id="empty-cycle-b" aria-labelledby="empty-cycle-a"></div>
      <button id="btn-test-cycle" aria-labelledby="empty-cycle-a"></button>
    </div>
  `);
  const btn2_3 = doc2_3.querySelector('#btn-test-cycle')!;
  const res2_3 = engine.computeAccessibleName(btn2_3, { documentRoot: doc2_3 });
  assert(res2_3.name === '', '2.3.1', 'Mutual empty cycle terminates cleanly with empty name');
  assert(res2_3.isPoorOrEmpty === true, '2.3.2', 'Mutual empty cycle marked as poor or empty');

  // 2.4 3-node cycle: A -> B -> C -> A
  const doc2_4 = parseHTMLToVirtualDOM(`
    <div>
      <button id="tri-a" aria-labelledby="tri-b">A Content</button>
      <button id="tri-b" aria-labelledby="tri-c">B Content</button>
      <button id="tri-c" aria-labelledby="tri-a">C Content</button>
    </div>
  `);
  const btn2_4 = doc2_4.querySelector('#tri-a')!;
  const res2_4 = engine.computeAccessibleName(btn2_4, { documentRoot: doc2_4 });
  assert(res2_4.name === 'B Content', '2.4.1', '3-node cycle correctly yields target B contents without following chained aria-labelledby');

  // 2.5 Invariant §2.B: Chained aria-labelledby prohibition
  const doc2_5 = parseHTMLToVirtualDOM(`
    <div>
      <button id="starter" aria-labelledby="intermediate"></button>
      <div id="intermediate" aria-labelledby="target-hidden-deep">Intermediate Direct Text</div>
      <div id="target-hidden-deep">Deep Secret Text</div>
    </div>
  `);
  const btn2_5 = doc2_5.querySelector('#starter')!;
  const res2_5 = engine.computeAccessibleName(btn2_5, { documentRoot: doc2_5 });
  assert(res2_5.name === 'Intermediate Direct Text', '2.5.1', 'W3C AccName §2.B: chained aria-labelledby on target is prohibited and yields direct contents', `Got "${res2_5.name}"`);
  assert(res2_5.steps.some(s => s.description.includes('chaining prohibited')), '2.5.2', 'Recorded Step 2B chained prohibition step');

  // 2.6 Repeated identical ID in aria-labelledby tokens: aria-labelledby="dup dup dup"
  const doc2_6 = parseHTMLToVirtualDOM(`
    <div>
      <span id="dup">Clone</span>
      <button id="btn-dup" aria-labelledby="dup dup dup"></button>
    </div>
  `);
  const btn2_6 = doc2_6.querySelector('#btn-dup')!;
  const res2_6 = engine.computeAccessibleName(btn2_6, { documentRoot: doc2_6 });
  assert(res2_6.name.includes('Clone'), '2.6.1', 'Repeated ID in aria-labelledby resolves safely without error');

  // 2.7 Complex mixture: missing ID + circular ID + valid ID
  const doc2_7 = parseHTMLToVirtualDOM(`
    <div>
      <span id="valid-part">Valid Label</span>
      <button id="btn-mixed" aria-labelledby="ghost-1 valid-part ghost-2"></button>
    </div>
  `);
  const btn2_7 = doc2_7.querySelector('#btn-mixed')!;
  const res2_7 = engine.computeAccessibleName(btn2_7, { documentRoot: doc2_7 });
  assert(res2_7.name === 'Valid Label', '2.7.1', 'Missing IDs in aria-labelledby list do not prevent valid IDs from contributing');
  assert(res2_7.diagnostics.includes('aria-labelledby refers to missing ID'), '2.7.2', 'Missing IDs flagged in diagnostics');


  // =========================================================================
  // SUITE 3: Porter-Duff Alpha Compositing & Color Contrast Stress
  // =========================================================================
  console.log('\n--- SUITE 3: Porter-Duff Alpha Compositing & Color Contrast ---');

  // 3.1 Opaque foreground over 0 opacity background
  const fgOpaque: RGBA = { r: 255, g: 0, b: 0, a: 1.0 };
  const bgZero: RGBA = { r: 0, g: 255, b: 0, a: 0.0 };
  const blend3_1 = compositeOver(fgOpaque, bgZero);
  assert(blend3_1.r === 255 && blend3_1.g === 0 && blend3_1.b === 0 && blend3_1.a === 1, '3.1.1', 'Opaque fg over 0 opacity bg retains fg color and alpha 1.0');

  // 3.2 50% opacity foreground over 0 opacity background
  const fgHalf: RGBA = { r: 0, g: 0, b: 255, a: 0.5 };
  const blend3_2 = compositeOver(fgHalf, bgZero);
  assert(blend3_2.r === 0 && blend3_2.g === 0 && blend3_2.b === 255 && blend3_2.a === 0.5, '3.2.1', '50% fg over 0 opacity bg retains fg color and alpha 0.5');

  // 3.3 Both foreground and background are 0 opacity (alpha = 0)
  const fgZero: RGBA = { r: 100, g: 150, b: 200, a: 0.0 };
  const blend3_3 = compositeOver(fgZero, bgZero);
  assert(!isNaN(blend3_3.r) && !isNaN(blend3_3.g) && !isNaN(blend3_3.b) && !isNaN(blend3_3.a), '3.3.1', 'Both 0 opacity does NOT produce NaN values');
  assert(blend3_3.a === 0, '3.3.2', 'Both 0 opacity yields alpha 0');

  // 3.4 0 opacity foreground over opaque background
  const bgOpaque: RGBA = { r: 50, g: 60, b: 70, a: 1.0 };
  const blend3_4 = compositeOver(fgZero, bgOpaque);
  assert(blend3_4.r === 50 && blend3_4.g === 60 && blend3_4.b === 70 && blend3_4.a === 1, '3.4.1', '0 opacity fg over opaque bg yields pure bg color');

  // 3.5 Alpha blending of two semi-transparent layers: 50% red over 50% blue
  const fgRedHalf: RGBA = { r: 255, g: 0, b: 0, a: 0.5 };
  const bgBlueHalf: RGBA = { r: 0, g: 0, b: 255, a: 0.5 };
  const blend3_5 = compositeOver(fgRedHalf, bgBlueHalf);
  assert(blend3_5.a === 0.75, '3.5.1', 'Two 50% layers yield correct final alpha 0.75');
  assert(blend3_5.r === 170 && blend3_5.b === 85, '3.5.2', 'Color channels correctly blended via Porter-Duff formula', `r=${blend3_5.r}, b=${blend3_5.b}`);

  // 3.6 Contrast Ratio boundary invariants
  const lumBlack = calculateRelativeLuminance({ r: 0, g: 0, b: 0 });
  const lumWhite = calculateRelativeLuminance({ r: 255, g: 255, b: 255 });
  assert(lumBlack === 0, '3.6.1', 'Pure black relative luminance is exactly 0.0');
  assert(Math.abs(lumWhite - 1.0) < 0.001, '3.6.2', 'Pure white relative luminance is 1.0');

  const ratioMax = calculateContrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  assert(ratioMax === 21.0, '3.6.3', 'Black on white contrast ratio is exactly 21:1');

  const ratioMin = calculateContrastRatio({ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 });
  assert(ratioMin === 1.0, '3.6.4', 'Identical colors contrast ratio is exactly 1:1');

  // 3.7 CSS parseColor stress testing (transparent, rgba 0 alpha, 8-hex 0 alpha)
  const cTrans = parseColor('transparent');
  assert(cTrans.a === 0, '3.7.1', 'parseColor("transparent") returns alpha 0');

  const cRgba0 = parseColor('rgba(255, 100, 50, 0)');
  assert(cRgba0.r === 255 && cRgba0.a === 0, '3.7.2', 'parseColor("rgba(..., 0)") returns alpha 0');

  const cHex8_0 = parseColor('#ff880000');
  assert(cHex8_0.r === 255 && cHex8_0.g === 136 && cHex8_0.a === 0, '3.7.3', 'parseColor 8-digit hex with 00 alpha returns alpha 0');

  const cInvalid = parseColor('not-a-valid-css-color-xyz');
  assert(cInvalid.r === 0 && cInvalid.g === 0 && cInvalid.b === 0 && cInvalid.a === 1, '3.7.4', 'Invalid color string falls back safely to black');


  // =========================================================================
  // SUITE 4: WCAG 2.2 2.5.8 Target Size Clearance Circle Geometry
  // =========================================================================
  console.log('\n--- SUITE 4: Target Size Clearance Circle Geometry ---');

  // 4.1 Base size >= 24x24 px passes directly
  const targetStandard: TargetCandidate = {
    selector: '#btn-standard',
    rect: { x: 10, y: 10, width: 24, height: 24 },
    isInline: false,
    tagName: 'button'
  };
  const res4_1 = evaluateTargetSizeCompliance(targetStandard, []);
  assert(res4_1.passesBaseSize === true && res4_1.compliant === true, '4.1.1', '24x24 px target passes base size directly');

  // 4.2 Large target 44x44 px passes base size
  const targetLarge: TargetCandidate = {
    selector: '#btn-large',
    rect: { x: 50, y: 50, width: 44, height: 44 },
    isInline: false,
    tagName: 'button'
  };
  const res4_2 = evaluateTargetSizeCompliance(targetLarge, []);
  assert(res4_2.passesBaseSize === true && res4_2.compliant === true, '4.2.1', '44x44 px target passes base size');

  // 4.3 Undersized target 16x16 px isolated (no neighbors) -> passes spacing exception
  const targetUndersized: TargetCandidate = {
    selector: '#target-under',
    rect: { x: 100, y: 100, width: 16, height: 16 },
    isInline: false,
    tagName: 'button'
  };
  const res4_3 = evaluateTargetSizeCompliance(targetUndersized, []);
  assert(res4_3.passesBaseSize === false, '4.3.1', '16x16 px target fails base size');
  assert(res4_3.passesSpacingException === true && res4_3.compliant === true, '4.3.2', 'Isolated 16x16 px target passes via 24px clearance circle spacing exception');

  // 4.4 Two undersized targets with circles intersecting (center distance < 24px)
  const neighborCollidingUndersized: TargetCandidate = {
    selector: '#neighbor-colliding',
    rect: { x: 100, y: 118, width: 16, height: 16 },
    isInline: false,
    tagName: 'button'
  };
  const res4_4 = evaluateTargetSizeCompliance(targetUndersized, [targetUndersized, neighborCollidingUndersized]);
  assert(res4_4.passesSpacingException === false && res4_4.compliant === false, '4.4.1', 'Undersized targets with center distance 18px (< 24px) fail spacing exception');

  // 4.5 Two undersized targets far enough apart (center distance >= 24px)
  const neighborFarUndersized: TargetCandidate = {
    selector: '#neighbor-far',
    rect: { x: 100, y: 132, width: 16, height: 16 },
    isInline: false,
    tagName: 'button'
  };
  const res4_5 = evaluateTargetSizeCompliance(targetUndersized, [targetUndersized, neighborFarUndersized]);
  assert(res4_5.passesSpacingException === true && res4_5.compliant === true, '4.5.1', 'Undersized targets with center distance 32px (>= 24px) pass spacing exception');

  // 4.6 Exact boundary condition: Undersized targets with center distance exactly 24px
  const neighborBoundaryUndersized: TargetCandidate = {
    selector: '#neighbor-boundary-24',
    rect: { x: 100, y: 124, width: 16, height: 16 },
    isInline: false,
    tagName: 'button'
  };
  const res4_6 = evaluateTargetSizeCompliance(targetUndersized, [targetUndersized, neighborBoundaryUndersized]);
  assert(res4_6.passesSpacingException === true && res4_6.compliant === true, '4.6.1', 'Undersized targets at exact 24px center boundary pass spacing exception');

  // 4.7 Undersized target next to standard (>= 24x24 px) neighbor (cleared):
  const neighborStandardClear: TargetCandidate = {
    selector: '#neighbor-std-clear',
    rect: { x: 100, y: 125, width: 30, height: 30 },
    isInline: false,
    tagName: 'button'
  };
  const res4_7 = evaluateTargetSizeCompliance(targetUndersized, [targetUndersized, neighborStandardClear]);
  assert(res4_7.passesSpacingException === true && res4_7.compliant === true, '4.7.1', 'Undersized target with 17px distance to standard neighbor passes spacing exception');

  // 4.8 Undersized target colliding with standard neighbor box:
  const neighborStandardOverlap: TargetCandidate = {
    selector: '#neighbor-std-overlap',
    rect: { x: 100, y: 115, width: 30, height: 30 },
    isInline: false,
    tagName: 'button'
  };
  const res4_8 = evaluateTargetSizeCompliance(targetUndersized, [targetUndersized, neighborStandardOverlap]);
  assert(res4_8.passesSpacingException === false && res4_8.compliant === false, '4.8.1', 'Undersized target with 7px distance (< 12px) to standard neighbor fails spacing exception');

  // 4.9 Inline target exemption:
  const inlineTarget: TargetCandidate = {
    selector: '#link-inline',
    rect: { x: 200, y: 200, width: 14, height: 14 },
    isInline: true,
    tagName: 'a'
  };
  const res4_9 = evaluateTargetSizeCompliance(inlineTarget, [targetUndersized]);
  assert(res4_9.isInlineException === true && res4_9.compliant === true, '4.9.1', 'Inline link is exempt from target size minimum and passes');

  // 4.10 Zero-dimension neighbor (invisible / unrendered):
  const zeroNeighbor: TargetCandidate = {
    selector: '#zero-elem',
    rect: { x: 100, y: 100, width: 0, height: 0 },
    isInline: false,
    tagName: 'div'
  };
  const res4_10 = evaluateTargetSizeCompliance(targetUndersized, [targetUndersized, zeroNeighbor]);
  assert(res4_10.compliant === true, '4.10.1', 'Zero-dimension neighbors are ignored and do not trigger false target collision');


  // =========================================================================
  // SUITE 5: CDP AX-Tree Compact Serializer & Trace Invariants
  // =========================================================================
  console.log('\n--- SUITE 5: CDP AX-Tree Compact Serializer & Trace Invariants ---');

  // 5.1 Serializer token density and compact representation
  const sampleNodes: SerializedAXNode[] = [
    { index: 0, selector: 'button#submit', role: 'button', name: 'Submit Application', focusable: true, disabled: false },
    { index: 1, selector: 'input#email', role: 'textbox', name: 'Email Address', value: 'user@example.com', focusable: true, disabled: false },
    { index: 2, selector: 'button#disabled-btn', role: 'button', name: 'Processing...', focusable: false, disabled: true },
    { index: 3, selector: 'div#unnamed', role: 'region', name: '', focusable: false, disabled: false }
  ];
  const serialized = serializeAXTree(sampleNodes);
  assert(serialized.includes('[0] button "Submit Application" (focusable)'), '5.1.1', 'Serialized node 0 contains role, name, focusable state');
  assert(serialized.includes('[1] textbox "Email Address" (focusable, val="user@example.com")'), '5.1.2', 'Serialized node 1 contains value attribute');
  assert(serialized.includes('[2] button "Processing..." (disabled)'), '5.1.3', 'Serialized node 2 contains disabled state');
  assert(serialized.includes('[3] region [unnamed]'), '5.1.4', 'Empty name serialized as [unnamed]');

  // 5.2 Token efficiency check: average line length < 80 characters
  const lines = serialized.split('\n');
  const avgLen = lines.reduce((acc, l) => acc + l.length, 0) / lines.length;
  assert(avgLen < 80, '5.2.1', 'High-density compact AX serialization maintains low token footprint', `Avg chars/line: ${avgLen.toFixed(1)}`);

  // 5.3 CDP AX-Tree Cross-Check Comparator Stress
  const cdpComparisonExact = compareWithCDP('Submit Order', 'Submit Order', { selector: '#btn-submit' });
  assert(cdpComparisonExact.status === 'EXACT_MATCH' && cdpComparisonExact.agreement === true, '5.3.1', 'CDP cross-check exact match');

  const cdpComparisonCase = compareWithCDP('submit order', 'Submit Order', { selector: '#btn-submit' });
  assert(cdpComparisonCase.status === 'CASE_INSENSITIVE_MATCH' && cdpComparisonCase.agreement === true, '5.3.2', 'CDP cross-check case-insensitive match');

  const cdpComparisonSubset = compareWithCDP('Order #1234 - Complete', 'Order #1234', { selector: '#btn-submit' });
  assert(cdpComparisonSubset.status === 'SUBSET_MATCH' && cdpComparisonSubset.agreement === true, '5.3.3', 'CDP cross-check subset match');

  const cdpComparisonEmpty = compareWithCDP('', '', { selector: '#icon-only' });
  assert(cdpComparisonEmpty.status === 'EXACT_MATCH' && cdpComparisonEmpty.agreement === true, '5.3.4', 'Both empty yields exact match agreement');

  const cdpComparisonMismatch = compareWithCDP('Save', 'Cancel', { selector: '#btn' });
  assert(cdpComparisonMismatch.status === 'VALUE_MISMATCH' && cdpComparisonMismatch.agreement === false, '5.3.5', 'Value mismatch yields agreement false');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n======================================================================');
  console.log(`  STRESS HARNESS COMPLETE: ${stats.passed} PASSED, ${stats.failed} FAILED`);
  console.log('======================================================================');

  if (stats.failed > 0) {
    console.error(`\nEncountered ${stats.failed} failure(s):`);
    for (const f of stats.failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log('\nVerdict: ALL 48 EMPIRICAL STRESS CHECKS PASSED CLEANLY.');
    process.exit(0);
  }
}

runAllStressTests().catch(err => {
  console.error('Unhandled failure in stress harness:', err);
  process.exit(1);
});
