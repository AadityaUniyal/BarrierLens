import { Page } from 'playwright';
import { ContrastResult, TargetSizeResult, BarrierFinding } from '../types';

export { type ContrastResult, type TargetSizeResult };

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface StaticWCAGOptions {
  runId?: string;
  stepIdx?: number;
  includeWarnings?: boolean;
}

// ---------------------------------------------------------------------------
// WCAG 1.4.3 Mathematical Formulation & Color Helpers
// ---------------------------------------------------------------------------

/**
 * Linearize an 8-bit sRGB color channel value in [0, 255] to linear light per IEC 61966-2-1.
 */
export function linearizeSRGBChannel(val8bit: number): number {
  const c = Math.max(0, Math.min(255, val8bit)) / 255;
  if (c <= 0.04045) {
    return c / 12.92;
  }
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculates relative luminance L from an sRGB color (R, G, B in [0, 255]).
 * L ranges strictly from 0.0 (black) to 1.0 (white).
 */
export function calculateRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rLin = linearizeSRGBChannel(rgb.r);
  const gLin = linearizeSRGBChannel(rgb.g);
  const bLin = linearizeSRGBChannel(rgb.b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculates WCAG 1.4.3 Contrast Ratio between two relative luminances L1 and L2.
 * Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 * Result ranges from 1.0 to 21.0.
 */
export function calculateContrastRatioFromLuminances(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Calculates WCAG 1.4.3 Contrast Ratio directly between two RGB colors.
 */
export function calculateContrastRatio(
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number }
): number {
  const lum1 = calculateRelativeLuminance(fg);
  const lum2 = calculateRelativeLuminance(bg);
  return calculateContrastRatioFromLuminances(lum1, lum2);
}

/**
 * Porter-Duff source-over alpha blending.
 * Composites semi-transparent foreground (fg) over background (bg).
 */
export function compositeOver(fg: RGBA, bg: RGBA): RGBA {
  const aFg = Math.max(0, Math.min(1, fg.a));
  const aBg = Math.max(0, Math.min(1, bg.a));

  const alphaFinal = aFg + aBg * (1 - aFg);
  if (alphaFinal <= 0.0001) {
    return { r: 255, g: 255, b: 255, a: 0 };
  }

  const r = Math.round((fg.r * aFg + bg.r * aBg * (1 - aFg)) / alphaFinal);
  const g = Math.round((fg.g * aFg + bg.g * aBg * (1 - aFg)) / alphaFinal);
  const b = Math.round((fg.b * aFg + bg.b * aBg * (1 - aFg)) / alphaFinal);

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
    a: Math.round(alphaFinal * 1000) / 1000
  };
}

/**
 * Parses CSS color strings (#hex, rgb, rgba, named colors) into RGBA.
 */
export function parseColor(colorStr: string): RGBA {
  const s = (colorStr || '').trim().toLowerCase();

  // Named colors
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (s === 'red') return { r: 255, g: 0, b: 0, a: 1 };
  if (s === 'green') return { r: 0, g: 128, b: 0, a: 1 };
  if (s === 'blue') return { r: 0, g: 0, b: 255, a: 1 };
  if (s === 'yellow') return { r: 255, g: 255, b: 0, a: 1 };
  if (s === 'gray' || s === 'grey') return { r: 128, g: 128, b: 128, a: 1 };

  // Hex: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }
  }

  // rgb(r, g, b) or rgba(r, g, b, a) or rgb(r g b / a)
  const rgbMatch = s.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    return {
      r: Math.round(parseFloat(rgbMatch[1])),
      g: Math.round(parseFloat(rgbMatch[2])),
      b: Math.round(parseFloat(rgbMatch[3])),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
    };
  }

  const spaceRgbMatch = s.match(/rgba?\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/);
  if (spaceRgbMatch) {
    let alpha = 1;
    if (spaceRgbMatch[4]) {
      if (spaceRgbMatch[4].endsWith('%')) {
        alpha = parseFloat(spaceRgbMatch[4]) / 100;
      } else {
        alpha = parseFloat(spaceRgbMatch[4]);
      }
    }
    return {
      r: Math.round(parseFloat(spaceRgbMatch[1])),
      g: Math.round(parseFloat(spaceRgbMatch[2])),
      b: Math.round(parseFloat(spaceRgbMatch[3])),
      a: alpha
    };
  }

  // Fallback default: opaque black
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function formatRgb(rgb: { r: number; g: number; b: number }): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatRgba(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

/**
 * Determines whether text is classified as "Large Text" under WCAG 1.4.3:
 * >= 18pt (24px) regular font OR >= 14pt (18.66px) bold (font-weight >= 700).
 */
export function isLargeTextCriterion(fontSizePx: number, fontWeight: string | number): boolean {
  let weightNum = 400;
  if (typeof fontWeight === 'number') {
    weightNum = fontWeight;
  } else if (typeof fontWeight === 'string') {
    if (fontWeight === 'bold') weightNum = 700;
    else if (fontWeight === 'bolder') weightNum = 800;
    else if (fontWeight === 'lighter') weightNum = 300;
    else {
      const parsed = parseInt(fontWeight, 10);
      if (!isNaN(parsed)) weightNum = parsed;
    }
  }

  const isBold = weightNum >= 700;
  if (fontSizePx >= 24) return true; // >= 18pt
  if (fontSizePx >= 18.66 && isBold) return true; // >= 14pt bold
  return false;
}

// ---------------------------------------------------------------------------
// WCAG 2.2 2.5.8 Target Size Mathematical Geometry
// ---------------------------------------------------------------------------

export interface TargetCandidate {
  selector: string;
  rect: BoundingRect;
  isInline: boolean;
  tagName: string;
  role?: string;
}

/**
 * Evaluates whether an interactive target complies with WCAG 2.2 2.5.8 (Target Size Minimum).
 * - >= 24x24 px passes directly.
 * - If < 24x24 px, centers a 24px diameter circle (radius 12px) on the target.
 *   If the circle does not intersect any neighbor target's bounding box or clearance circle, passes under Spacing Exception.
 * - Inline targets are exempt.
 */
export function evaluateTargetSizeCompliance(
  target: TargetCandidate,
  allNeighbors: TargetCandidate[]
): TargetSizeResult {
  const { width, height } = target.rect;
  const passesBaseSize = width >= 24 && height >= 24;

  if (target.isInline) {
    return {
      selector: target.selector,
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
      passesBaseSize,
      passesSpacingException: false,
      isInlineException: true,
      compliant: true
    };
  }

  if (passesBaseSize) {
    return {
      selector: target.selector,
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
      passesBaseSize: true,
      passesSpacingException: false,
      isInlineException: false,
      compliant: true
    };
  }

  // Evaluate 24px diameter clearance circle (radius 12px)
  const centerA = {
    x: target.rect.x + width / 2,
    y: target.rect.y + height / 2
  };
  const radiusA = 12; // 24px diameter

  let minDistance = Infinity;
  let intersectsNeighbor = false;

  for (const neighbor of allNeighbors) {
    if (neighbor === target || neighbor.selector === target.selector) continue;
    if (neighbor.rect.width === 0 || neighbor.rect.height === 0) continue;

    const nWidth = neighbor.rect.width;
    const nHeight = neighbor.rect.height;
    const nIsUndersized = nWidth < 24 || nHeight < 24;

    if (nIsUndersized) {
      // Both undersized: check distance between centers. Circles intersect if dist < 12 + 12 = 24px
      const centerB = {
        x: neighbor.rect.x + nWidth / 2,
        y: neighbor.rect.y + nHeight / 2
      };
      const centerDist = Math.sqrt(
        Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2)
      );
      if (centerDist < minDistance) {
        minDistance = centerDist;
      }
      if (centerDist < 24) {
        intersectsNeighbor = true;
      }
    } else {
      // Neighbor is >= 24x24 px: check distance from centerA to rectangle B
      const dx = Math.max(neighbor.rect.x - centerA.x, 0, centerA.x - (neighbor.rect.x + nWidth));
      const dy = Math.max(neighbor.rect.y - centerA.y, 0, centerA.y - (neighbor.rect.y + nHeight));
      const rectDist = Math.sqrt(dx * dx + dy * dy);

      if (rectDist < minDistance) {
        minDistance = rectDist;
      }
      if (rectDist < radiusA) {
        intersectsNeighbor = true;
      }
    }
  }

  const passesSpacingException = !intersectsNeighbor;
  const compliant = passesSpacingException;

  return {
    selector: target.selector,
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
    passesBaseSize: false,
    passesSpacingException,
    isInlineException: false,
    compliant,
    closestNeighborDistancePx: minDistance !== Infinity ? Math.round(minDistance * 10) / 10 : undefined
  };
}

// ---------------------------------------------------------------------------
// In-Browser Static Check Evaluator Script for Playwright page.evaluate()
// ---------------------------------------------------------------------------

export const BROWSER_STATIC_CHECKS_SCRIPT = `
(function() {
  function linearize(c8) {
    var c = c8 / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(r, g, b) {
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  function contrastRatio(l1, l2) {
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
  }

  function parseRgba(str) {
    if (!str || str === 'transparent') return { r: 255, g: 255, b: 255, a: 0 };
    var m = str.match(/rgba?\\s*\\(\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*,\\s*([\\d.]+)(?:\\s*,\\s*([\\d.]+))?\\s*\\)/);
    if (m) {
      return {
        r: parseFloat(m[1]),
        g: parseFloat(m[2]),
        b: parseFloat(m[3]),
        a: m[4] !== undefined ? parseFloat(m[4]) : 1
      };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  function composite(fg, bg) {
    var af = fg.a;
    var ab = bg.a;
    var aFinal = af + ab * (1 - af);
    if (aFinal <= 0.0001) return { r: 255, g: 255, b: 255, a: 0 };
    var r = Math.round((fg.r * af + bg.r * ab * (1 - af)) / aFinal);
    var g = Math.round((fg.g * af + bg.g * ab * (1 - af)) / aFinal);
    var b = Math.round((fg.b * af + bg.b * ab * (1 - af)) / aFinal);
    return { r: r, g: g, b: b, a: aFinal };
  }

  function getSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    var tag = el.tagName.toLowerCase();
    var cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\\s+/)[0] : '';
    if (cls && !/[^a-zA-Z0-9_-]/.test(cls)) return tag + '.' + cls;
    return tag;
  }

  function getEffectiveBg(el) {
    var curr = el;
    var layers = [];
    while (curr && curr.nodeType === 1) {
      var style = window.getComputedStyle(curr);
      var bg = parseRgba(style.backgroundColor);
      if (bg.a > 0) {
        layers.unshift(bg);
        if (bg.a >= 0.99) break;
      }
      curr = curr.parentElement;
    }
    var base = { r: 255, g: 255, b: 255, a: 1 }; // Default root canvas
    for (var i = 0; i < layers.length; i++) {
      base = composite(layers[i], base);
    }
    return base;
  }

  // 1. Evaluate Color Contrast across text elements
  window.__barrierLensCheckContrast = function(targetSelector) {
    var elements = targetSelector 
      ? document.querySelectorAll(targetSelector)
      : document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, li, td, th');
    var results = [];

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.offsetParent && el.tagName.toLowerCase() !== 'body') continue;
      var text = (el.innerText || el.textContent || '').trim();
      if (!text) continue;

      var style = window.getComputedStyle(el);
      var fg = parseRgba(style.color);
      var bg = getEffectiveBg(el);
      var blendedFg = fg.a < 1 ? composite(fg, bg) : fg;

      var lumFg = luminance(blendedFg.r, blendedFg.g, blendedFg.b);
      var lumBg = luminance(bg.r, bg.g, bg.b);
      var ratio = contrastRatio(lumFg, lumBg);

      var fontSizePx = parseFloat(style.fontSize) || 16;
      var fontWeight = style.fontWeight || '400';
      var weightNum = parseInt(fontWeight, 10) || (fontWeight === 'bold' ? 700 : 400);
      var isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && weightNum >= 700);

      var passesAA = isLarge ? (ratio >= 3.0) : (ratio >= 4.5);
      var passesAAA = isLarge ? (ratio >= 4.5) : (ratio >= 7.0);

      results.push({
        selector: getSelector(el),
        foregroundColor: 'rgb(' + blendedFg.r + ', ' + blendedFg.g + ', ' + blendedFg.b + ')',
        backgroundColor: 'rgb(' + bg.r + ', ' + bg.g + ', ' + bg.b + ')',
        contrastRatio: ratio,
        fontSizePx: fontSizePx,
        isLargeText: isLarge,
        passesAA: passesAA,
        passesAAA: passesAAA
      });
    }
    return results;
  };

  // 2. Evaluate Target Size across interactive elements
  window.__barrierLensCheckTargetSize = function(targetSelector) {
    var elements = targetSelector
      ? document.querySelectorAll(targetSelector)
      : document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [tabindex="0"]');

    var candidates = [];
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      var style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      var isInline = style.display === 'inline' || (el.tagName.toLowerCase() === 'a' && el.parentElement && el.parentElement.tagName.toLowerCase() === 'p');

      candidates.push({
        selector: getSelector(el),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        isInline: isInline,
        tagName: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || undefined
      });
    }

    var results = [];
    for (var j = 0; j < candidates.length; j++) {
      var c = candidates[j];
      var w = c.rect.width;
      var h = c.rect.height;
      var passesBase = w >= 24 && h >= 24;

      if (c.isInline) {
        results.push({
          selector: c.selector,
          width: Math.round(w * 10) / 10,
          height: Math.round(h * 10) / 10,
          passesBaseSize: passesBase,
          passesSpacingException: false,
          isInlineException: true,
          compliant: true
        });
        continue;
      }

      if (passesBase) {
        results.push({
          selector: c.selector,
          width: Math.round(w * 10) / 10,
          height: Math.round(h * 10) / 10,
          passesBaseSize: true,
          passesSpacingException: false,
          isInlineException: false,
          compliant: true
        });
        continue;
      }

      var cAx = c.rect.x + w / 2;
      var cAy = c.rect.y + h / 2;
      var intersects = false;
      var minDist = 99999;

      for (var k = 0; k < candidates.length; k++) {
        if (k === j) continue;
        var n = candidates[k];
        var nIsUndersized = n.rect.width < 24 || n.rect.height < 24;

        if (nIsUndersized) {
          var cBx = n.rect.x + n.rect.width / 2;
          var cBy = n.rect.y + n.rect.height / 2;
          var dist = Math.sqrt(Math.pow(cAx - cBx, 2) + Math.pow(cAy - cBy, 2));
          if (dist < minDist) minDist = dist;
          if (dist < 24) intersects = true;
        } else {
          var dx = Math.max(n.rect.x - cAx, 0, cAx - (n.rect.x + n.rect.width));
          var dy = Math.max(n.rect.y - cAy, 0, cAy - (n.rect.y + n.rect.height));
          var rDist = Math.sqrt(dx * dx + dy * dy);
          if (rDist < minDist) minDist = rDist;
          if (rDist < 12) intersects = true;
        }
      }

      results.push({
        selector: c.selector,
        width: Math.round(w * 10) / 10,
        height: Math.round(h * 10) / 10,
        passesBaseSize: false,
        passesSpacingException: !intersects,
        isInlineException: false,
        compliant: !intersects,
        closestNeighborDistancePx: minDist !== 99999 ? Math.round(minDist * 10) / 10 : undefined
      });
    }

    return results;
  };
})();
`;

// ---------------------------------------------------------------------------
// StaticWCAGEngine Core Class
// ---------------------------------------------------------------------------

export class StaticWCAGEngine {
  /**
   * Evaluates color contrast on a Playwright Page.
   */
  async evaluateContrast(page: Page, targetSelector?: string): Promise<ContrastResult[]> {
    await page.evaluate(BROWSER_STATIC_CHECKS_SCRIPT);
    const results = (await page.evaluate((sel) => {
      return (window as any).__barrierLensCheckContrast(sel);
    }, targetSelector)) as ContrastResult[];
    return results;
  }

  /**
   * Evaluates WCAG 2.2 Target Size (2.5.8) on a Playwright Page.
   */
  async evaluateTargetSize(page: Page, targetSelector?: string): Promise<TargetSizeResult[]> {
    await page.evaluate(BROWSER_STATIC_CHECKS_SCRIPT);
    const results = (await page.evaluate((sel) => {
      return (window as any).__barrierLensCheckTargetSize(sel);
    }, targetSelector)) as TargetSizeResult[];
    return results;
  }

  /**
   * Generates BarrierFinding records from contrast and target size failures.
   */
  normalizeStaticViolations(
    contrastResults: ContrastResult[],
    targetSizeResults: TargetSizeResult[],
    options: StaticWCAGOptions = {}
  ): BarrierFinding[] {
    const findings: BarrierFinding[] = [];
    const runId = options.runId || 'run_static';
    const stepIdx = options.stepIdx ?? 0;

    // 1. Contrast violations (fails AA)
    for (const res of contrastResults) {
      if (!res.passesAA) {
        const requiredRatio = res.isLargeText ? 3.0 : 4.5;
        const id = `contrast_${runId}_${stepIdx}_${hashSelector(res.selector)}`;

        findings.push({
          id,
          runId,
          stepIdx,
          kind: 'color_contrast_violation',
          trustTier: 'observed',
          wcagRules: ['WCAG 1.4.3 Contrast (Minimum) (Level AA)'],
          severity: res.contrastRatio < 2.5 ? 'high' : 'medium',
          severityScore: res.contrastRatio < 2.5 ? 7.5 : 5.0,
          severityInterval: [Math.max(0, (res.contrastRatio < 2.5 ? 7.5 : 5.0) - 1.0), Math.min(10, (res.contrastRatio < 2.5 ? 7.5 : 5.0) + 1.0)],
          title: `Color Contrast Failure: ${res.contrastRatio}:1 (Requires ${requiredRatio}:1)`,
          summary: `Text at ${res.selector} has contrast ratio ${res.contrastRatio}:1 (fg: ${res.foregroundColor}, bg: ${res.backgroundColor}), failing WCAG 1.4.3 Level AA requirement of ${requiredRatio}:1.`,
          evidence: {
            selector: res.selector,
            contrastRatio: res.contrastRatio,
            requiredRatio,
            foregroundColor: res.foregroundColor,
            backgroundColor: res.backgroundColor,
            fontSizePx: res.fontSizePx,
            isLargeText: res.isLargeText,
            passesAAA: res.passesAAA
          }
        });
      }
    }

    // 2. Target size violations (fails SC 2.5.8)
    for (const res of targetSizeResults) {
      if (!res.compliant) {
        const id = `target_size_${runId}_${stepIdx}_${hashSelector(res.selector)}`;

        findings.push({
          id,
          runId,
          stepIdx,
          kind: 'target_size_violation',
          trustTier: 'observed',
          wcagRules: ['WCAG 2.2 2.5.8 Target Size (Minimum) (Level AA)'],
          severity: res.width < 16 || res.height < 16 ? 'high' : 'medium',
          severityScore: res.width < 16 || res.height < 16 ? 7.0 : 5.0,
          severityInterval: [4.0, 7.5],
          title: `Target Size Violation: ${res.width}x${res.height}px (Minimum 24x24px)`,
          summary: `Interactive control ${res.selector} is sized ${res.width}x${res.height} CSS pixels (below 24x24px minimum) and fails the 24px clearance spacing exception (closest neighbor distance: ${res.closestNeighborDistancePx ?? 'too close'}px).`,
          evidence: {
            selector: res.selector,
            width: res.width,
            height: res.height,
            passesBaseSize: res.passesBaseSize,
            passesSpacingException: res.passesSpacingException,
            isInlineException: res.isInlineException,
            closestNeighborDistancePx: res.closestNeighborDistancePx
          }
        });
      }
    }

    return findings;
  }
}

function hashSelector(sel: string): string {
  let hash = 0;
  for (let i = 0; i < sel.length; i++) {
    hash = (hash << 5) - hash + sel.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export const defaultStaticWCAGEngine = new StaticWCAGEngine();
