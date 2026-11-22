/**
 * BarrierLens E2E Test Suite - Accessibility Helpers
 * 
 * Provides:
 * 1. WCAG 1.4.3 Relative Luminance & Contrast Ratio calculation engine
 * 2. Axe-core automated accessibility audit runner for Playwright
 * 3. Keyboard focus trap detection & cycle analysis
 */

import { Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults, Result as AxeResultNode } from 'axe-core';

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED_COLORS: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'rgba(0,0,0,0)',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
};

/**
 * Parses CSS hex or rgb/rgba color strings into normalized RGBA components.
 */
export function parseColor(color: string | RGBA): RGBA {
  if (typeof color === 'object' && color !== null && 'r' in color && 'g' in color && 'b' in color) {
    return {
      r: Math.max(0, Math.min(255, color.r)),
      g: Math.max(0, Math.min(255, color.g)),
      b: Math.max(0, Math.min(255, color.b)),
      a: color.a !== undefined ? Math.max(0, Math.min(1, color.a)) : 1,
    };
  }

  const raw = String(color).trim().toLowerCase();
  const hexTarget = NAMED_COLORS[raw] || raw;

  // Hex format: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (hexTarget.startsWith('#')) {
    const hex = hexTarget.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // rgb/rgba format: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = hexTarget.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    return {
      r: parseFloat(rgbMatch[1]),
      g: parseFloat(rgbMatch[2]),
      b: parseFloat(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  // Fallback to black on unrecognized format
  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Blends a foreground color over a background color if foreground has alpha < 1.
 */
export function blendColors(fg: RGBA, bg: RGBA): RGBA {
  const alpha = fg.a;
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
    a: 1,
  };
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function calculateRelativeLuminance(color: string | RGBA): number {
  const rgba = parseColor(color);
  const channels = [rgba.r, rgba.g, rgba.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * Calculates WCAG contrast ratio between foreground and background.
 * CR = (L1 + 0.05) / (L2 + 0.05) where L1 >= L2.
 */
export function calculateContrastRatio(foreground: string | RGBA, background: string | RGBA): number {
  const fgRgba = parseColor(foreground);
  const bgRgba = parseColor(background);

  // If foreground has alpha transparency, blend with background
  const effectiveFg = fgRgba.a < 1 ? blendColors(fgRgba, bgRgba) : fgRgba;

  const l1 = calculateRelativeLuminance(effectiveFg);
  const l2 = calculateRelativeLuminance(bgRgba);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Assesses WCAG AA compliance (4.5:1 for regular text, 3.0:1 for large text).
 */
export function meetsWcagAA(
  foreground: string | RGBA,
  background: string | RGBA,
  isLargeText = false
): { ratio: number; pass: boolean; minRequired: number } {
  const ratio = calculateContrastRatio(foreground, background);
  const minRequired = isLargeText ? 3.0 : 4.5;
  return {
    ratio,
    pass: ratio >= minRequired,
    minRequired,
  };
}

/**
 * Assesses WCAG AAA compliance (7.0:1 for regular text, 4.5:1 for large text).
 */
export function meetsWcagAAA(
  foreground: string | RGBA,
  background: string | RGBA,
  isLargeText = false
): { ratio: number; pass: boolean; minRequired: number } {
  const ratio = calculateContrastRatio(foreground, background);
  const minRequired = isLargeText ? 4.5 : 7.0;
  return {
    ratio,
    pass: ratio >= minRequired,
    minRequired,
  };
}

export interface AxeAuditOptions {
  include?: string[];
  exclude?: string[];
  tags?: string[];
  rules?: string[];
  disableRules?: string[];
}

/**
 * Runs an axe-core accessibility audit on a Playwright page.
 */
export async function runAxeAudit(page: Page, options: AxeAuditOptions = {}): Promise<AxeResults> {
  let builder = new AxeBuilder({ page });

  const tags = options.tags ?? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  if (tags.length > 0) {
    builder = builder.withTags(tags);
  }

  if (options.include) {
    for (const selector of options.include) {
      builder = builder.include(selector);
    }
  }

  if (options.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  if (options.rules && options.rules.length > 0) {
    builder = builder.withRules(options.rules);
  }

  if (options.disableRules && options.disableRules.length > 0) {
    builder = builder.disableRules(options.disableRules);
  }

  return await builder.analyze();
}

/**
 * Formats axe-core audit violations into a concise human-readable failure report.
 */
export function formatAxeViolations(results: AxeResults): string {
  if (results.violations.length === 0) {
    return 'No accessibility violations found.';
  }

  const lines: string[] = [
    `Found ${results.violations.length} accessibility violation(s):`,
  ];

  results.violations.forEach((violation: AxeResultNode, idx: number) => {
    lines.push(`\n[${idx + 1}] Rule: "${violation.id}" (${violation.impact || 'unknown'} impact)`);
    lines.push(`    Description: ${violation.description}`);
    lines.push(`    Help: ${violation.help} (${violation.helpUrl})`);
    lines.push(`    Failing Nodes (${violation.nodes.length}):`);
    violation.nodes.slice(0, 5).forEach((node, nodeIdx) => {
      lines.push(`      - Node ${nodeIdx + 1}: ${node.target.join(' ')}`);
      lines.push(`        HTML: ${node.html.trim().slice(0, 100)}`);
      if (node.failureSummary) {
        lines.push(`        Summary: ${node.failureSummary}`);
      }
    });
    if (violation.nodes.length > 5) {
      lines.push(`      ... and ${violation.nodes.length - 5} more nodes`);
    }
  });

  return lines.join('\n');
}

export interface FocusTrapAnalysis {
  isTrapped: boolean;
  cycleDetected: boolean;
  escapedContainer: boolean;
  visitedCount: number;
  visitedElements: Array<{
    tagName: string;
    id: string;
    className: string;
    role: string | null;
    ariaLabel: string | null;
    isInsideContainer: boolean;
    signature: string;
  }>;
  cycleLength: number;
}

export interface FocusTrapOptions {
  containerSelector?: string;
  maxTabs?: number;
  direction?: 'forward' | 'backward';
}

/**
 * Simulates Tab or Shift+Tab navigation to verify keyboard focus containment inside a dialog/modal.
 */
export async function detectFocusTrap(
  page: Page,
  options: FocusTrapOptions = {}
): Promise<FocusTrapAnalysis> {
  const containerSelector = options.containerSelector;
  const maxTabs = options.maxTabs ?? 20;
  const isBackward = options.direction === 'backward';

  const visited: FocusTrapAnalysis['visitedElements'] = [];
  const signaturesSeen = new Map<string, number>();
  let cycleDetected = false;
  let escapedContainer = false;
  let cycleLength = 0;

  for (let step = 0; step < maxTabs; step++) {
    if (isBackward) {
      await page.keyboard.press('Shift+Tab');
    } else {
      await page.keyboard.press('Tab');
    }

    const activeInfo = await page.evaluate((selector) => {
      const active = document.activeElement;
      if (!active) {
        return {
          tagName: 'BODY',
          id: '',
          className: '',
          role: null,
          ariaLabel: null,
          isInsideContainer: false,
          signature: 'BODY',
        };
      }

      const container = selector ? document.querySelector(selector) : null;
      const isInside = container ? container.contains(active) : true;
      const signature = `${active.tagName}#${active.id || ''}.${(active.className || '').toString().slice(0, 30)}[role=${active.getAttribute('role') || ''}]`;

      return {
        tagName: active.tagName,
        id: active.id || '',
        className: (active.className || '').toString(),
        role: active.getAttribute('role'),
        ariaLabel: active.getAttribute('aria-label'),
        isInsideContainer: isInside,
        signature,
      };
    }, containerSelector);

    visited.push(activeInfo);

    if (containerSelector && !activeInfo.isInsideContainer) {
      escapedContainer = true;
    }

    if (signaturesSeen.has(activeInfo.signature)) {
      const firstSeenIndex = signaturesSeen.get(activeInfo.signature)!;
      cycleLength = step - firstSeenIndex;
      cycleDetected = true;
      break;
    } else {
      signaturesSeen.set(activeInfo.signature, step);
    }
  }

  const isTrapped = (containerSelector ? !escapedContainer : true) && cycleDetected;

  return {
    isTrapped,
    cycleDetected,
    escapedContainer,
    visitedCount: visited.length,
    visitedElements: visited,
    cycleLength,
  };
}
