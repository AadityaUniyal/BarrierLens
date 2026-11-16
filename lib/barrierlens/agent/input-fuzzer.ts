/**
 * BarrierLens Context-Aware Dynamic Input & Form Fuzzer
 * 
 * Replaces hardcoded string inputs with zero-hardcoding semantic inspection.
 * Derives context-specific input values by inspecting element attributes
 * (type, role, name, placeholder, aria-label, autocomplete) and page context.
 */

import { Page } from 'playwright';

export interface InputContext {
  tagName: string;
  type: string;
  role: string;
  name: string;
  id: string;
  placeholder: string;
  ariaLabel: string;
  labelText: string;
  autocomplete: string;
  required: boolean;
  pattern?: string;
  min?: string;
  max?: string;
}

export type FuzzingStrategy = 'valid_happy_path' | 'boundary_probe' | 'screen_reader_stress';

export class ContextAwareInputFuzzer {
  /**
   * Evaluates the targeted input or current active element and generates
   * a context-appropriate, realistic value.
   */
  async generateInputValue(
    page: Page,
    options: {
      targetSelector?: string;
      activeGoal?: string;
      strategy?: FuzzingStrategy;
    } = {}
  ): Promise<string> {
    const { targetSelector, activeGoal = '', strategy = 'valid_happy_path' } = options;

    try {
      const context: InputContext | null = await page.evaluate((selector) => {
        let el: HTMLElement | null = null;
        if (selector) {
          try { el = document.querySelector(selector); } catch {}
        }
        if (!el) {
          el = document.activeElement as HTMLElement | null;
        }
        if (!el) return null;

        const inputEl = el as HTMLInputElement;
        const tagName = (el.tagName || '').toLowerCase();
        const type = (inputEl.type || 'text').toLowerCase();
        const role = (el.getAttribute('role') || '').toLowerCase();
        const name = inputEl.name || el.getAttribute('name') || '';
        const id = el.id || '';
        const placeholder = inputEl.placeholder || el.getAttribute('placeholder') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const autocomplete = inputEl.autocomplete || el.getAttribute('autocomplete') || '';
        const required = inputEl.required || el.hasAttribute('aria-required');
        const pattern = inputEl.pattern || undefined;
        const min = inputEl.min || undefined;
        const max = inputEl.max || undefined;

        // Extract associated label text
        let labelText = '';
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) labelText = (label.textContent || '').trim();
        }
        if (!labelText) {
          const parentLabel = el.closest('label');
          if (parentLabel) labelText = (parentLabel.textContent || '').trim();
        }
        if (!labelText) {
          const labelledBy = el.getAttribute('aria-labelledby');
          if (labelledBy) {
            const labelEl = document.getElementById(labelledBy);
            if (labelEl) labelText = (labelEl.textContent || '').trim();
          }
        }

        return {
          tagName,
          type,
          role,
          name,
          id,
          placeholder,
          ariaLabel,
          labelText,
          autocomplete,
          required,
          pattern,
          min,
          max
        };
      }, targetSelector);

      if (!context) {
        return this.synthesizeFromGoal(activeGoal);
      }

      return this.deriveSemanticValue(context, activeGoal, strategy);
    } catch {
      return this.synthesizeFromGoal(activeGoal);
    }
  }

  /**
   * Derive semantic input value based on field metadata and surrounding context
   */
  deriveSemanticValue(context: InputContext, activeGoal: string, strategy: FuzzingStrategy): string {
    const combinedDescriptor = [
      context.type,
      context.name,
      context.id,
      context.placeholder,
      context.ariaLabel,
      context.labelText,
      context.autocomplete
    ].join(' ').toLowerCase();

    // 1. Password fields
    if (context.type === 'password' || combinedDescriptor.includes('password') || combinedDescriptor.includes('passwd')) {
      return 'Passw0rd!2026#Secure';
    }

    // 2. Email fields
    if (context.type === 'email' || combinedDescriptor.includes('email') || combinedDescriptor.includes('e-mail')) {
      return 'accessibility.tester@barrierlens.dev';
    }

    // 3. Search boxes
    if (context.type === 'search' || context.role === 'searchbox' || combinedDescriptor.includes('search') || combinedDescriptor.includes('query')) {
      // Extract search intent from goal or return accessible query
      const keywords = activeGoal.split(/\s+/).filter(w => w.length > 3 && !['navigate', 'verify', 'primary', 'ensure', 'flows'].includes(w.toLowerCase()));
      if (keywords.length > 0) {
        return keywords.slice(0, 2).join(' ');
      }
      return 'accessibility';
    }

    // 4. Phone / Telephone
    if (context.type === 'tel' || combinedDescriptor.includes('phone') || combinedDescriptor.includes('mobile') || combinedDescriptor.includes('tel')) {
      return '+1-555-019-2834';
    }

    // 5. Postal / Zip code
    if (combinedDescriptor.includes('zip') || combinedDescriptor.includes('postal')) {
      return '94103';
    }

    // 6. Number / Quantity / Age
    if (context.type === 'number' || context.role === 'spinbutton' || combinedDescriptor.includes('quantity') || combinedDescriptor.includes('qty')) {
      const minVal = parseInt(context.min || '1', 10);
      return String(isNaN(minVal) ? 1 : Math.max(1, minVal));
    }

    // 7. URL / Web address
    if (context.type === 'url' || combinedDescriptor.includes('url') || combinedDescriptor.includes('website')) {
      return 'https://barrierlens.dev';
    }

    // 8. Name fields
    if (combinedDescriptor.includes('first name') || combinedDescriptor.includes('fname')) {
      return 'Alex';
    }
    if (combinedDescriptor.includes('last name') || combinedDescriptor.includes('lname')) {
      return 'Morgan';
    }
    if (combinedDescriptor.includes('full name') || combinedDescriptor.includes('name') && !combinedDescriptor.includes('user')) {
      return 'Alex Morgan';
    }
    if (combinedDescriptor.includes('username') || combinedDescriptor.includes('handle')) {
      return 'barrierlens_qa';
    }

    // 9. Boundary or Stress testing strategy
    if (strategy === 'boundary_probe') {
      return 'Test & <script>alert(1)</script> "quotes"';
    }
    if (strategy === 'screen_reader_stress') {
      return 'A'.repeat(120);
    }

    // 10. Fallback: Contextual placeholder or goal synthesis
    if (context.placeholder && context.placeholder.length > 2 && !context.placeholder.toLowerCase().includes('enter')) {
      return context.placeholder;
    }

    return this.synthesizeFromGoal(activeGoal);
  }

  private synthesizeFromGoal(activeGoal: string): string {
    if (activeGoal) {
      const words = activeGoal.split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) return words[0];
    }
    return 'Accessibility Evaluation';
  }
}
