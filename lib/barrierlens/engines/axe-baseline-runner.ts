import { Page } from 'playwright';
import axe from 'axe-core';
import { BarrierFinding, AxeEvaluationResult, TrustTier } from '../types';

export { type AxeEvaluationResult };

export interface AxeExecutionOptions {
  runOnlyTags?: string[];
  contextSelector?: string;
  timeoutMs?: number;
  resultTypes?: ('violations' | 'passes' | 'incomplete' | 'inapplicable')[];
}

export interface AxeRunSummary {
  violationCount: number;
  passCount: number;
  incompleteCount: number;
  inapplicableCount: number;
  criticalViolations: number;
  highViolations: number;
  mediumViolations: number;
  lowViolations: number;
}

export interface AxeExecutionOutput {
  rawResults: any;
  violations: AxeEvaluationResult[];
  passes: any[];
  incomplete: any[];
  normalizedFindings: BarrierFinding[];
  summary: AxeRunSummary;
}

/**
 * Maps axe-core tag array (e.g. ['cat.color', 'wcag2aa', 'wcag143', 'wcag258'])
 * into standardized human-readable WCAG rule descriptions.
 */
export function mapAxeTagsToWcag(tags: string[] = []): string[] {
  const rules: string[] = [];
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    // Pattern: wcagXYZ or wcagWXYZ (e.g. wcag143 -> WCAG 1.4.3, wcag258 -> WCAG 2.5.8, wcag412 -> WCAG 4.1.2)
    const match = lower.match(/^wcag(\d)(\d)(\d+)$/);
    if (match) {
      rules.push(`WCAG ${match[1]}.${match[2]}.${match[3]}`);
      continue;
    }
    if (lower === 'wcag2a') {
      rules.push('WCAG 2.0 Level A');
    } else if (lower === 'wcag2aa') {
      rules.push('WCAG 2.0 Level AA');
    } else if (lower === 'wcag2aaa') {
      rules.push('WCAG 2.0 Level AAA');
    } else if (lower === 'wcag21a') {
      rules.push('WCAG 2.1 Level A');
    } else if (lower === 'wcag21aa') {
      rules.push('WCAG 2.1 Level AA');
    } else if (lower === 'wcag22aa') {
      rules.push('WCAG 2.2 Level AA');
    }
  }
  return rules.length > 0 ? Array.from(new Set(rules)) : ['WCAG 2.2 AA'];
}

/**
 * Maps axe impact levels to BarrierLens severity strings.
 */
export function mapAxeImpactToSeverity(impact?: string | null): 'low' | 'medium' | 'high' | 'critical' {
  switch (impact) {
    case 'critical':
      return 'critical';
    case 'serious':
      return 'high';
    case 'moderate':
      return 'medium';
    case 'minor':
    default:
      return 'low';
  }
}

/**
 * Derives a normalized severity score (0.0 to 10.0) from severity level.
 */
export function getSeverityScore(severity: 'low' | 'medium' | 'high' | 'critical'): number {
  switch (severity) {
    case 'critical':
      return 9.5;
    case 'high':
      return 7.5;
    case 'medium':
      return 5.0;
    case 'low':
      return 2.5;
  }
}

function hashSelector(selector: string): string {
  let hash = 0;
  for (let i = 0; i < selector.length; i++) {
    hash = (hash << 5) - hash + selector.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Normalizes raw axe-core violation records into BarrierLens standard BarrierFinding items.
 */
export function normalizeAxeViolations(
  violations: any[] = [],
  runId: string = 'run_axe',
  stepIdx: number = 0
): BarrierFinding[] {
  const findings: BarrierFinding[] = [];

  for (const violation of violations) {
    const severity = mapAxeImpactToSeverity(violation.impact);
    const severityScore = getSeverityScore(severity);
    const wcagRules = mapAxeTagsToWcag(violation.tags);

    const nodes = Array.isArray(violation.nodes) ? violation.nodes : [];
    for (const node of nodes) {
      const targetArray = Array.isArray(node.target) ? node.target : [node.target || ''];
      const selector = targetArray.join(' ');
      const findingId = `axe_${runId}_${stepIdx}_${violation.id}_${hashSelector(selector)}`;

      findings.push({
        id: findingId,
        runId,
        stepIdx,
        kind: 'axe_violation',
        trustTier: 'observed' as TrustTier,
        wcagRules,
        severity,
        severityScore,
        severityInterval: [
          Math.max(0, Math.round((severityScore - 1.2) * 10) / 10),
          Math.min(10, Math.round((severityScore + 1.2) * 10) / 10)
        ],
        title: `${violation.help} (${violation.id})`,
        summary: node.failureSummary || violation.description,
        evidence: {
          axeRuleId: violation.id,
          helpUrl: violation.helpUrl,
          htmlSnippet: node.html,
          selector,
          failureSummary: node.failureSummary,
          targetArray: targetArray,
          tags: violation.tags
        }
      });
    }
  }

  return findings;
}

export class AxeBaselineRunner {
  private axeSource: string;

  constructor() {
    this.axeSource = axe.source;
  }

  /**
   * Injects axe-core source into the Playwright page if not already present.
   */
  async injectAxe(page: Page): Promise<void> {
    const isAxeLoaded = await page.evaluate(() => {
      return typeof (window as any).axe !== 'undefined';
    });

    if (!isAxeLoaded) {
      await page.evaluate(this.axeSource);
    }
  }

  /**
   * Executes axe-core against the page context and returns raw results.
   */
  async executeAxe(page: Page, options: AxeExecutionOptions = {}): Promise<any> {
    await this.injectAxe(page);

    const tags = options.runOnlyTags || ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const selector = options.contextSelector || 'document';
    const resultTypes = options.resultTypes || ['violations', 'passes', 'incomplete', 'inapplicable'];

    const results = await page.evaluate(
      async ({ tags, selector, resultTypes }) => {
        const win = window as any;
        if (!win.axe) {
          throw new Error('axe-core is not loaded in page context');
        }

        const context = selector === 'document' ? document : document.querySelector(selector) || document;
        return await win.axe.run(context, {
          runOnly: {
            type: 'tag',
            values: tags
          },
          resultTypes
        });
      },
      { tags, selector, resultTypes }
    );

    return results;
  }

  /**
   * Primary entry point: runs axe-core, extracts standard AxeEvaluationResult objects,
   * normalizes findings into BarrierFinding records, and produces a structured summary.
   */
  async runEvaluation(
    page: Page,
    options: AxeExecutionOptions & { runId?: string; stepIdx?: number } = {}
  ): Promise<AxeExecutionOutput> {
    const rawResults = await this.executeAxe(page, options);
    const runId = options.runId || 'run_axe';
    const stepIdx = options.stepIdx ?? 0;

    const rawViolations = rawResults?.violations || [];
    const passes = rawResults?.passes || [];
    const incomplete = rawResults?.incomplete || [];
    const inapplicable = rawResults?.inapplicable || [];

    const violations: AxeEvaluationResult[] = rawViolations.map((v: any) => ({
      ruleId: v.id,
      impact: v.impact || 'minor',
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags || [],
      nodes: (v.nodes || []).map((n: any) => ({
        target: Array.isArray(n.target) ? n.target : [n.target || ''],
        html: n.html || '',
        failureSummary: n.failureSummary || ''
      }))
    }));

    const normalizedFindings = normalizeAxeViolations(rawViolations, runId, stepIdx);

    let criticalViolations = 0;
    let highViolations = 0;
    let mediumViolations = 0;
    let lowViolations = 0;

    for (const f of normalizedFindings) {
      if (f.severity === 'critical') criticalViolations++;
      else if (f.severity === 'high') highViolations++;
      else if (f.severity === 'medium') mediumViolations++;
      else lowViolations++;
    }

    const summary: AxeRunSummary = {
      violationCount: normalizedFindings.length,
      passCount: passes.length,
      incompleteCount: incomplete.length,
      inapplicableCount: inapplicable.length,
      criticalViolations,
      highViolations,
      mediumViolations,
      lowViolations
    };

    return {
      rawResults,
      violations,
      passes,
      incomplete,
      normalizedFindings,
      summary
    };
  }
}

export const defaultAxeBaselineRunner = new AxeBaselineRunner();
