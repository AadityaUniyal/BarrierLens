/**
 * Verification script for ContextAwareInputFuzzer
 */
import { ContextAwareInputFuzzer } from '../lib/barrierlens/agent/input-fuzzer.ts';

async function runVerification() {
  console.log('======================================================================');
  console.log('🧪 VERIFYING CONTEXT-AWARE INPUT & FORM FUZZER');
  console.log('======================================================================\n');

  const fuzzer = new ContextAwareInputFuzzer();
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  // 1. Password derivation
  const pwVal = fuzzer.deriveSemanticValue({
    tagName: 'input',
    type: 'password',
    role: '',
    name: 'user_password',
    id: 'password-input',
    placeholder: 'Enter secure password',
    ariaLabel: '',
    labelText: 'Password',
    autocomplete: 'current-password',
    required: true
  }, 'Sign in', 'valid_happy_path');
  assert(pwVal.length >= 8 && /[A-Z]/.test(pwVal) && /[0-9]/.test(pwVal) && /[!@#$%^&*]/.test(pwVal),
    `Password meets enterprise complexity criteria: ${pwVal}`);

  // 2. Email derivation
  const emailVal = fuzzer.deriveSemanticValue({
    tagName: 'input',
    type: 'email',
    role: '',
    name: 'email',
    id: 'user-email',
    placeholder: 'name@company.com',
    ariaLabel: 'Email address',
    labelText: 'Your Email',
    autocomplete: 'email',
    required: true
  }, 'Subscribe to newsletter', 'valid_happy_path');
  assert(emailVal.includes('@') && emailVal.includes('.'),
    `Email derivation produces valid RFC 5322 format: ${emailVal}`);

  // 3. Searchbox contextual derivation from goal
  const searchVal = fuzzer.deriveSemanticValue({
    tagName: 'input',
    type: 'search',
    role: 'searchbox',
    name: 'q',
    id: 'site-search',
    placeholder: 'Search documentation...',
    ariaLabel: 'Search',
    labelText: '',
    autocomplete: 'off',
    required: false
  }, 'Search documentation for keyboard trap guidelines', 'valid_happy_path');
  assert(searchVal.length > 0 && !searchVal.toLowerCase().includes('trap guidelines') && searchVal.toLowerCase().includes('documentation'),
    `Search query dynamically synthesized from mission goal: "${searchVal}"`);

  // 4. Telephone / phone derivation
  const phoneVal = fuzzer.deriveSemanticValue({
    tagName: 'input',
    type: 'tel',
    role: '',
    name: 'phone',
    id: 'tel-field',
    placeholder: 'Phone number',
    ariaLabel: '',
    labelText: 'Phone',
    autocomplete: 'tel',
    required: false
  }, 'Checkout', 'valid_happy_path');
  assert(/^\+?[0-9\-\(\)\s]+$/.test(phoneVal) && phoneVal.length >= 10,
    `Telephone derivation formats valid phone digits: ${phoneVal}`);

  // 5. Postal / Zip code
  const zipVal = fuzzer.deriveSemanticValue({
    tagName: 'input',
    type: 'text',
    role: '',
    name: 'postal_code',
    id: 'zip',
    placeholder: 'ZIP Code',
    ariaLabel: 'Zip',
    labelText: 'Postal Code',
    autocomplete: 'postal-code',
    required: true
  }, 'Shipping address', 'valid_happy_path');
  assert(/^\d{5}$/.test(zipVal), `Zip code derivation produces 5-digit zip: ${zipVal}`);

  // 6. Number / Quantity
  const qtyVal = fuzzer.deriveSemanticValue({
    tagName: 'input',
    type: 'number',
    role: 'spinbutton',
    name: 'quantity',
    id: 'cart-qty',
    placeholder: '',
    ariaLabel: 'Quantity',
    labelText: 'Qty',
    autocomplete: '',
    required: true,
    min: '2'
  }, 'Add to cart', 'valid_happy_path');
  assert(parseInt(qtyVal, 10) >= 2, `Number derivation respects element min attribute: ${qtyVal}`);

  // 7. Stress / Boundary fuzzing
  const stressVal = fuzzer.deriveSemanticValue({
    tagName: 'input',
    type: 'text',
    role: 'textbox',
    name: 'notes',
    id: 'notes-field',
    placeholder: 'Notes',
    ariaLabel: 'Notes',
    labelText: 'Special Notes',
    autocomplete: '',
    required: false
  }, 'Submit feedback', 'screen_reader_stress');
  assert(stressVal.length >= 100, `Screen reader stress fuzzer produces high-length input payload`);

  console.log('\n======================================================================');
  console.log(`Results: ${passed} / ${total} tests passed`);
  console.log('======================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
