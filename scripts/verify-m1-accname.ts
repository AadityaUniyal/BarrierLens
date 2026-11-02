import {
  defaultAccNameEngine,
  compareWithCDP,
  parseHTMLToVirtualDOM
} from '../lib/barrierlens/engines/accname-provenance';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('  BarrierLens: W3C AccName & Provenance Engine Verification Suite');
  console.log('===============================================================\n');

  // -------------------------------------------------------------------------
  // Test Suite 1: Step 2A Hidden Elements & aria-labelledby Exception
  // -------------------------------------------------------------------------
  console.log('[Suite 1] Step 2A: Hidden Elements & aria-labelledby Exception');

  const hiddenBtnRes = defaultAccNameEngine.computeAccessibleName('<button style="display:none">Hidden</button>');
  assert(hiddenBtnRes.name === '', 'Step 2A prunes hidden button (empty accessible name)');
  assert(hiddenBtnRes.steps.some(s => s.step === '2A' && s.status === 'pruned'), 'Step 2A records pruned step');

  const hiddenAriaHidden = defaultAccNameEngine.computeAccessibleName('<button aria-hidden="true">Hidden</button>');
  assert(hiddenAriaHidden.name === '', 'Step 2A prunes aria-hidden="true" button');

  // W3C 1.2 §2.A Authoritative Exception: hidden element referenced by aria-labelledby IS traversed!
  const labelledByDoc = parseHTMLToVirtualDOM(
    '<div><button id="btn" aria-labelledby="hidden-lbl">Original</button><span id="hidden-lbl" style="display:none">Hidden Target Text</span></div>'
  );
  const btnElem = labelledByDoc.querySelector('#btn')!;
  const labelledByHiddenRes = defaultAccNameEngine.computeAccessibleName(btnElem, { documentRoot: labelledByDoc });
  assert(
    labelledByHiddenRes.name === 'Hidden Target Text',
    'Step 2A Authoritative Exception: hidden element referenced by aria-labelledby is traversed'
  );

  // -------------------------------------------------------------------------
  // Test Suite 2: Step 2B aria-labelledby Traversal, Multi-ID & Loop Prevention
  // -------------------------------------------------------------------------
  console.log('\n[Suite 2] Step 2B: aria-labelledby Resolution, Multi-ID & Loop Protection');

  const multiIdDoc = parseHTMLToVirtualDOM(
    '<div><button id="order-btn" aria-labelledby="token1 token2 token3"></button>' +
    '<span id="token1">Confirm</span><span id="token2">Order</span><span id="token3">Now</span></div>'
  );
  const orderBtn = multiIdDoc.querySelector('#order-btn')!;
  const multiIdRes = defaultAccNameEngine.computeAccessibleName(orderBtn, { documentRoot: multiIdDoc });
  assert(multiIdRes.name === 'Confirm Order Now', 'Step 2B concatenates multiple ID references with spaces');
  assert(multiIdRes.source === 'aria-labelledby', 'Step 2B sets winning source to aria-labelledby');

  // Loop prevention: A -> B -> A
  const loopDoc = parseHTMLToVirtualDOM(
    '<div><button id="a" aria-labelledby="b">A-Text</button><button id="b" aria-labelledby="a">B-Text</button></div>'
  );
  const nodeA = loopDoc.querySelector('#a')!;
  const loopRes = defaultAccNameEngine.computeAccessibleName(nodeA, { documentRoot: loopDoc });
  assert(loopRes.steps.some(s => s.status === 'loop_prevented'), 'Step 2B terminates cyclic aria-labelledby recursion');

  // Missing target diagnostic
  const missingIdDoc = parseHTMLToVirtualDOM('<button aria-labelledby="non-existent-id">Button</button>');
  const missingIdRes = defaultAccNameEngine.computeAccessibleName(missingIdDoc);
  assert(
    missingIdRes.diagnostics.includes('aria-labelledby refers to missing ID'),
    'Step 2B flags missing aria-labelledby ID in diagnostics'
  );

  // Empty target diagnostic
  const emptyTargetDoc = parseHTMLToVirtualDOM(
    '<div><button id="btn-empty" aria-labelledby="empty-span"></button><span id="empty-span">   </span></div>'
  );
  const btnEmpty = emptyTargetDoc.querySelector('#btn-empty')!;
  const emptyTargetRes = defaultAccNameEngine.computeAccessibleName(btnEmpty, { documentRoot: emptyTargetDoc });
  assert(
    emptyTargetRes.diagnostics.includes('aria-labelledby target is empty'),
    'Step 2B flags empty aria-labelledby target'
  );

  // -------------------------------------------------------------------------
  // Test Suite 3: Step 2C aria-label Attribute
  // -------------------------------------------------------------------------
  console.log('\n[Suite 3] Step 2C: aria-label Direct Resolution & Fallthrough');

  const ariaLabelRes = defaultAccNameEngine.computeAccessibleName('<button aria-label="Submit Payment">Pay</button>');
  assert(ariaLabelRes.name === 'Submit Payment', 'Step 2C resolves aria-label attribute');
  assert(ariaLabelRes.source === 'aria-label', 'Step 2C sets winning source to aria-label');

  // Empty aria-label falls through to contents
  const emptyAriaLabelRes = defaultAccNameEngine.computeAccessibleName('<button aria-label="">Visible Button Text</button>');
  assert(emptyAriaLabelRes.name === 'Visible Button Text', 'Step 2C empty aria-label falls through to contents');
  assert(emptyAriaLabelRes.source === 'contents', 'Empty aria-label results in contents source');

  // -------------------------------------------------------------------------
  // Test Suite 4: Step 2D Native Host Language Rules
  // -------------------------------------------------------------------------
  console.log('\n[Suite 4] Step 2D: Native HTML Host Language Rules');

  // 4.1 input[type="submit"] value vs default
  const inputSubmitValue = defaultAccNameEngine.computeAccessibleName('<input type="submit" value="Pay Now" />');
  assert(inputSubmitValue.name === 'Pay Now', 'Step 2D input[type=submit] uses value attribute');

  const inputSubmitDefault = defaultAccNameEngine.computeAccessibleName('<input type="submit" />');
  assert(inputSubmitDefault.name === 'Submit', 'Step 2D input[type=submit] uses browser default "Submit"');

  // 4.2 input[type="image"] alt
  const inputImageAlt = defaultAccNameEngine.computeAccessibleName('<input type="image" alt="Search Icon" />');
  assert(inputImageAlt.name === 'Search Icon', 'Step 2D input[type=image] uses alt attribute');

  // 4.3 Form controls with associated label[for]
  const formForDoc = parseHTMLToVirtualDOM(
    '<div><label for="username-input">User Account Name</label><input id="username-input" type="text" /></div>'
  );
  const usernameInput = formForDoc.querySelector('#username-input')!;
  const formForRes = defaultAccNameEngine.computeAccessibleName(usernameInput, { documentRoot: formForDoc });
  assert(formForRes.name === 'User Account Name', 'Step 2D resolves associated label[for="id"]');
  assert(formForRes.source === 'native-label', 'Step 2D sets source to native-label');

  // 4.4 Form controls with wrapping <label>
  const wrappingLabelDoc = parseHTMLToVirtualDOM(
    '<label>Billing Address <input type="text" id="billing" /></label>'
  );
  const billingInput = wrappingLabelDoc.querySelector('#billing')!;
  const wrappingLabelRes = defaultAccNameEngine.computeAccessibleName(billingInput, { documentRoot: wrappingLabelDoc });
  assert(wrappingLabelRes.name === 'Billing Address', 'Step 2D resolves wrapping parent <label>');

  // 4.5 Image alt: descriptive vs decorative vs missing
  const imgDescriptive = defaultAccNameEngine.computeAccessibleName('<img alt="Company Logo" />');
  assert(imgDescriptive.name === 'Company Logo', 'Step 2D img resolves alt attribute');

  const imgDecorative = defaultAccNameEngine.computeAccessibleName('<img alt="" />');
  assert(imgDecorative.name === '', 'Step 2D img with alt="" is decorative (empty name)');
  assert(!imgDecorative.diagnostics.includes('image has no alt'), 'Decorative image does not trigger missing alt diagnostic');

  const imgMissingAlt = defaultAccNameEngine.computeAccessibleName('<img src="photo.jpg" />');
  assert(imgMissingAlt.name === '', 'Step 2D img without alt returns empty name');
  assert(imgMissingAlt.diagnostics.includes('image has no alt'), 'Missing alt on img triggers diagnostic');

  // 4.6 SVG child <title>
  const svgTitleRes = defaultAccNameEngine.computeAccessibleName('<svg><title>Shopping Bag</title><path d="..." /></svg>');
  assert(svgTitleRes.name === 'Shopping Bag', 'Step 2D svg resolves child <title> element');

  // 4.7 Table caption
  const tableRes = defaultAccNameEngine.computeAccessibleName('<table><caption>Quarterly Financials</caption><tr><td>1</td></tr></table>');
  assert(tableRes.name === 'Quarterly Financials', 'Step 2D table resolves child <caption>');

  // 4.8 Fieldset legend
  const fieldsetRes = defaultAccNameEngine.computeAccessibleName('<fieldset><legend>Shipping Preferences</legend><input type="radio" /></fieldset>');
  assert(fieldsetRes.name === 'Shipping Preferences', 'Step 2D fieldset resolves child <legend>');

  // -------------------------------------------------------------------------
  // Test Suite 5: Step 2E Name from Contents & Step 2G Normalization
  // -------------------------------------------------------------------------
  console.log('\n[Suite 5] Step 2E & 2G: Name from Contents & Whitespace Normalization');

  const linkRes = defaultAccNameEngine.computeAccessibleName('<a href="/terms">Terms of Service</a>');
  assert(linkRes.name === 'Terms of Service', 'Step 2E extracts name from link contents');

  const buttonSubtree = defaultAccNameEngine.computeAccessibleName(
    '<button><span>Add to </span><strong>Shopping Cart</strong></button>'
  );
  assert(buttonSubtree.name === 'Add to Shopping Cart', 'Step 2E recurses through child elements to build name');

  // Step 2G whitespace normalization
  const whitespaceRes = defaultAccNameEngine.computeAccessibleName(
    '<button>   Click \n\t   here \u00A0 now   </button>'
  );
  assert(whitespaceRes.name === 'Click here now', 'Step 2G collapses runs of whitespace, newlines, and non-breaking spaces');

  // -------------------------------------------------------------------------
  // Test Suite 6: Step 2F Title & Placeholder Fallbacks
  // -------------------------------------------------------------------------
  console.log('\n[Suite 6] Step 2F: Title & Placeholder Fallback Attributes');

  const titleRes = defaultAccNameEngine.computeAccessibleName('<button title="Dismiss notification"></button>');
  assert(titleRes.name === 'Dismiss notification', 'Step 2F falls back to title attribute');
  assert(titleRes.source === 'title', 'Step 2F sets source to title');

  const placeholderRes = defaultAccNameEngine.computeAccessibleName('<input type="text" placeholder="Search articles..." />');
  assert(placeholderRes.name === 'Search articles...', 'Step 2F / 2D falls back to placeholder');
  assert(placeholderRes.diagnostics.includes('placeholder used as only label'), 'Flags placeholder used as only label');

  // -------------------------------------------------------------------------
  // Test Suite 7: 10 Diagnostic Anti-Pattern Rules
  // -------------------------------------------------------------------------
  console.log('\n[Suite 7] 10 Deterministic Diagnostics for Poor / Empty Names');

  // 1. EMPTY_ACCESSIBLE_NAME
  const emptyBtn = defaultAccNameEngine.computeAccessibleName('<button></button>');
  assert(emptyBtn.diagnostics.includes('no aria-label, no text content'), 'Diagnostic: no aria-label, no text content');
  assert(emptyBtn.isPoorOrEmpty === true, 'Empty button marked as isPoorOrEmpty');

  // 2. UNLABELED_ICON / LABEL_WRAPS_ONLY_ICON
  const iconBtn = defaultAccNameEngine.computeAccessibleName('<button><svg viewBox="0 0 24 24"><path d="..." /></svg></button>');
  assert(iconBtn.diagnostics.includes('parent link wraps only an icon'), 'Diagnostic: parent link wraps only an icon');

  // 3. IMAGE_MISSING_ALT
  const imgNoAlt = defaultAccNameEngine.computeAccessibleName('<img src="banner.png" />');
  assert(imgNoAlt.diagnostics.includes('image has no alt'), 'Diagnostic: image has no alt');

  // 4. MISSING_LABELLEDBY_TARGET
  const missingRef = defaultAccNameEngine.computeAccessibleName('<button aria-labelledby="ghost-element">Test</button>');
  assert(missingRef.diagnostics.includes('aria-labelledby refers to missing ID'), 'Diagnostic: aria-labelledby refers to missing ID');

  // 5. EMPTY_LABELLEDBY_TARGET
  const emptyTargetDoc2 = parseHTMLToVirtualDOM(
    '<div><button id="target2" aria-labelledby="ghost-blank"></button><span id="ghost-blank"></span></div>'
  );
  const target2 = emptyTargetDoc2.querySelector('#target2')!;
  const emptyTargetRes2 = defaultAccNameEngine.computeAccessibleName(target2, { documentRoot: emptyTargetDoc2 });
  assert(emptyTargetRes2.diagnostics.includes('aria-labelledby target is empty'), 'Diagnostic: aria-labelledby target is empty');

  // 6. GENERIC_NON_DESCRIPTIVE_NAME
  const genericLink = defaultAccNameEngine.computeAccessibleName('<a href="#">click here</a>');
  assert(genericLink.diagnostics.includes('non-descriptive generic placeholder'), 'Diagnostic: non-descriptive generic placeholder');

  // 7. PLACEHOLDER_ONLY_LABEL
  const phInput = defaultAccNameEngine.computeAccessibleName('<input type="text" placeholder="Type here" />');
  assert(phInput.diagnostics.includes('placeholder used as only label'), 'Diagnostic: placeholder used as only label');

  // 8. REDUNDANT_ROLE_IN_NAME
  const redundantBtn = defaultAccNameEngine.computeAccessibleName('<button>Search button</button>');
  assert(redundantBtn.diagnostics.includes('redundant role in accessible name'), 'Diagnostic: redundant role in accessible name');

  // 9. LABEL_IN_NAME_MISMATCH
  const mismatchBtn = defaultAccNameEngine.computeAccessibleName(
    '<button aria-label="Perform Checkout Transaction">Submit Order</button>'
  );
  assert(mismatchBtn.diagnostics.includes('visible text not in accessible name'), 'Diagnostic: visible text not in accessible name (WCAG 2.5.3)');

  // 10. UNLABELED_ICON
  const iconLink = defaultAccNameEngine.computeAccessibleName('<a href="/cart"><i class="fa fa-shopping-cart"></i></a>');
  assert(iconLink.diagnostics.includes('parent link wraps only an icon'), 'Diagnostic: icon link flagged as unlabeled icon control');

  // -------------------------------------------------------------------------
  // Test Suite 8: CDP AX-Tree Cross-Check Comparator
  // -------------------------------------------------------------------------
  console.log('\n[Suite 8] CDP AX-Tree Cross-Check Comparator');

  const matchRes = compareWithCDP('Submit Order', 'Submit Order');
  assert(matchRes.agreement === true, 'CDP exact match returns agreement true');
  assert(matchRes.status === 'EXACT_MATCH', 'CDP match status is EXACT_MATCH');
  assert(matchRes.agreementRate === 1.0, 'CDP exact match agreement rate is 1.0');

  const caseRes = compareWithCDP('SUBMIT ORDER', 'submit order');
  assert(caseRes.agreement === true, 'CDP case-insensitive match returns agreement true');
  assert(caseRes.status === 'CASE_INSENSITIVE_MATCH', 'Status is CASE_INSENSITIVE_MATCH');

  const subsetRes = compareWithCDP('Submit Order Now', 'Submit Order');
  assert(subsetRes.agreement === true, 'CDP subset match returns agreement true');
  assert(subsetRes.status === 'SUBSET_MATCH', 'Status is SUBSET_MATCH');
  assert(subsetRes.agreementRate === 0.85, 'Subset agreement rate is 0.85');

  const cdpEmptyRes = compareWithCDP('Submit Order', '');
  assert(cdpEmptyRes.agreement === false, 'Custom found but CDP empty returns agreement false');
  assert(cdpEmptyRes.status === 'CUSTOM_FOUND_CDP_EMPTY', 'Status is CUSTOM_FOUND_CDP_EMPTY');

  const customEmptyRes = compareWithCDP('', 'Submit Order');
  assert(customEmptyRes.agreement === false, 'Custom empty but CDP found returns agreement false');
  assert(customEmptyRes.status === 'CDP_FOUND_CUSTOM_EMPTY', 'Status is CDP_FOUND_CUSTOM_EMPTY');

  const mismatchRes = compareWithCDP('Cancel Transaction', 'Place Order');
  assert(mismatchRes.agreement === false, 'Value mismatch returns agreement false');
  assert(mismatchRes.status === 'VALUE_MISMATCH', 'Status is VALUE_MISMATCH');

  // -------------------------------------------------------------------------
  // Test Suite 9: Backward Compatibility with auditor-core
  // -------------------------------------------------------------------------
  console.log('\n[Suite 9] Backward Compatibility with auditor-core.ts');

  const evalGood = defaultAccNameEngine.evaluateName('#submit', 'button', 'Submit Order');
  assert(evalGood.isAdequate === true, 'Good name is marked adequate');
  assert(evalGood.reason === 'good', 'Good name reason is "good"');

  const evalEmpty = defaultAccNameEngine.evaluateName('#btn', 'button', '');
  assert(evalEmpty.isAdequate === false, 'Empty name marked inadequate');
  assert(evalEmpty.reason === 'missing_label', 'Empty name reason is missing_label');

  const evalGeneric = defaultAccNameEngine.evaluateName('#btn', 'button', 'Click Here');
  assert(evalGeneric.isAdequate === false, 'Generic placeholder marked inadequate');
  assert(evalGeneric.reason === 'non_descriptive_placeholder', 'Generic placeholder reason is non_descriptive_placeholder');

  console.log('\n===============================================================');
  console.log('  ALL TEST SUITES PASSED CLEANLY (100% SUCCESS)');
  console.log('===============================================================\n');
}

runAllTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
