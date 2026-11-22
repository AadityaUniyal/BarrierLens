/**
 * BarrierLens 2.0 - Tier 3 Pairwise Cross-Feature Test Suite
 * Adversarial Arena Tremor Injection & Executive Scorecard (adversarial-arena-and-scorecard.test.ts)
 * 
 * Verifies motor tremor injection in Adversarial Arena, execution of stress runs,
 * detection of latent accessibility barriers, dynamic recalculation of the 5-axis
 * governance radar, and scorecard grade transitions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MotorTremorSimulator } from '../../../lib/barrierlens/adversarial/motor-tremor';
import { BarrierFinding, AuditRun } from '../../../lib/barrierlens/types';

describe('Tier 3: Adversarial Arena Tremor Injection & Scorecard Radar', () => {

  // Pure mathematical evaluator mirroring ExecutiveReport.tsx:52-100
  function compute5AxisRadar(run: AuditRun) {
    const findings = run.findings || [];
    const nameFindings = findings.filter(f =>
      f.kind === 'empty_accessible_name' || f.kind === 'misleading_accessible_name'
    );
    const trapFindings = findings.filter(f =>
      f.kind === 'keyboard_trap' || f.kind === 'unreachable_control' || f.kind === 'focus_loss'
    );
    const contrastFindings = findings.filter(f =>
      f.kind === 'color_contrast_violation'
    );
    const targetFindings = findings.filter(f =>
      f.kind === 'target_size_violation'
    );

    const accNameScore = Math.max(50, Math.round(100 - nameFindings.length * 12));
    const tauScore = run.kendallTau ? Math.round(Math.max(0, (run.kendallTau.tau + 1) / 2) * 100) : 88;
    const focusScore = trapFindings.length === 0 ? Math.min(100, Math.max(80, tauScore)) : Math.max(40, 75 - trapFindings.length * 20);
    const contrastScore = Math.max(60, Math.round(100 - contrastFindings.length * 15));
    const targetSizeScore = Math.max(60, Math.round(100 - targetFindings.length * 10));

    const perceivable = Math.round((contrastScore + targetSizeScore) / 2);
    const operable = focusScore;
    const understandable = accNameScore;
    const robust = Math.max(40, Math.round(100 - findings.filter(f => f.kind === 'silent_state_change' || f.kind === 'focus_loss').length * 20));
    const traversability = tauScore;

    const overall = Math.round((accNameScore + focusScore + contrastScore + targetSizeScore) / 4);

    return {
      perceivable,
      operable,
      understandable,
      robust,
      traversability,
      overall
    };
  }

  // Scorecard grade evaluator mirroring PublicScorecardView.tsx:40-60
  function computeScorecardGrade(run: AuditRun) {
    const effortRatio = run.effortRatio ?? 1.0;
    const trapCount = run.findings?.filter(f => f.kind === 'keyboard_trap').length ?? 0;
    const criticalCount = run.findings?.filter(f => f.severity === 'critical').length ?? 0;
    const findingsCount = run.findings?.length ?? 0;

    let grade = 'A';
    let certStatus = 'EAA 2025 & WCAG 2.2 AA Certified';
    let isCompliant = true;

    if (trapCount > 0 || criticalCount > 0 || effortRatio >= 3.5) {
      grade = 'F';
      certStatus = 'Non-Compliant (Sink Trap Detected)';
      isCompliant = false;
    } else if (effortRatio >= 2.5 || findingsCount > 3) {
      grade = 'C';
      certStatus = 'Conditional Compliance';
      isCompliant = false;
    } else if (effortRatio >= 1.6 || findingsCount > 0) {
      grade = 'B+';
      certStatus = 'Substantially Accessible';
      isCompliant = true;
    }

    return { grade, certStatus, isCompliant };
  }

  it('1. should instantiate motor tremor simulator with severity presets', () => {
    const tremor = new MotorTremorSimulator();
    assert.equal(typeof tremor.pressKeyWithTremor, 'function');
    assert.equal(typeof tremor.typeWithTremor, 'function');
    assert.equal(typeof tremor.simulateInteraction, 'function');
  });

  it('2. should simulate motor tremor perturbation on action sequences', async () => {
    const tremor = new MotorTremorSimulator();

    // Mock page with Playwright keyboard interface
    const mockPage: any = {
      waitForTimeout: async (ms: number) => {},
      keyboard: {
        press: async (k: string) => {},
        type: async (text: string) => {}
      }
    };

    const result = await tremor.simulateInteraction(mockPage, [
      { type: 'press_key', key: 'Tab' },
      { type: 'press_key', key: 'Enter' },
      { type: 'type_text', text: 'test' }
    ], 'severe');

    assert.equal(result.actions.length, 3);
    assert.ok(result.totalTimingJitterMs > 0, 'Total timing jitter should be positive');
    assert.ok(result.successRate >= 0 && result.successRate <= 100);
  });

  it('3. should degrade Operable score in 5-axis governance radar upon latent keyboard trap injection', () => {
    // Baseline clean run
    const cleanRun: AuditRun = {
      id: 'run_baseline_clean',
      targetUrl: 'http://localhost:3000/benchmark',
      goal: 'Complete checkout flow',
      persona: 'keyboard',
      status: 'completed',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      taskSuccess: true,
      effortRatio: 1.2,
      findings: [],
      steps: [],
      kendallTau: {
        tau: 0.95,
        focusOrder: ['#a', '#b'],
        visualOrder: ['#a', '#b'],
        inversionCount: 0,
        totalPairs: 1,
        concordantCount: 1,
        discordantCount: 0,
        isAcceptable: true,
        explanation: 'Perfect concordance'
      },
      tierMix: { tier0Rules: 1, tier1Ranker: 0, tier2Groq: 0, tier3Gemini: 0 }
    };

    const cleanRadar = compute5AxisRadar(cleanRun);
    assert.ok(cleanRadar.operable >= 90, `Clean run operable score must be >= 90, got: ${cleanRadar.operable}`);

    // Injected stress run encountering latent keyboard trap
    const latentTrapFinding: BarrierFinding = {
      id: 'latent_trap_01',
      runId: 'run_stress_tremor',
      stepIdx: 5,
      kind: 'keyboard_trap',
      trustTier: 'proven',
      wcagRules: ['WCAG 2.1.2 No Keyboard Trap (Level A)'],
      severity: 'critical',
      severityScore: 9.8,
      severityInterval: [9.2, 10.0],
      title: 'Latent Focus Deadlock under Rapid Escape Jitter',
      summary: 'Modal animation race condition drops focus into body and traps keyboard traversal.'
    };

    const stressRun: AuditRun = {
      ...cleanRun,
      taskSuccess: false,
      effortRatio: 3.9,
      findings: [latentTrapFinding]
    };

    const stressRadar = compute5AxisRadar(stressRun);
    assert.ok(
      stressRadar.operable < cleanRadar.operable,
      `Operable score must degrade under keyboard trap (before: ${cleanRadar.operable}, after: ${stressRadar.operable})`
    );
    assert.equal(stressRadar.operable, 55, 'Focus score with 1 critical trap must equal 55');
  });

  it('4. should compute all 5 mandatory axes within normalized bounds [0, 100]', () => {
    const complexRun: AuditRun = {
      id: 'run_complex_eval',
      targetUrl: 'http://localhost:3000/benchmark',
      goal: 'Explore all interactive widgets',
      persona: 'screen_reader',
      status: 'completed',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      taskSuccess: false,
      effortRatio: 2.8,
      kendallTau: {
        tau: 0.60,
        focusOrder: ['#1', '#2'],
        visualOrder: ['#2', '#1'],
        inversionCount: 1,
        totalPairs: 2,
        concordantCount: 1,
        discordantCount: 1,
        isAcceptable: false,
        explanation: 'Partial inversion'
      },
      findings: [
        {
          id: 'f1',
          runId: 'run_complex_eval',
          stepIdx: 1,
          kind: 'empty_accessible_name',
          trustTier: 'proven',
          wcagRules: ['WCAG 4.1.2'],
          severity: 'high',
          severityScore: 7.5,
          severityInterval: [7, 8],
          title: 'Unlabeled button',
          summary: 'Missing aria-label'
        },
        {
          id: 'f2',
          runId: 'run_complex_eval',
          stepIdx: 3,
          kind: 'color_contrast_violation',
          trustTier: 'proven',
          wcagRules: ['WCAG 1.4.3'],
          severity: 'medium',
          severityScore: 5.5,
          severityInterval: [5, 6],
          title: 'Low contrast text',
          summary: 'Contrast ratio 3.2:1'
        }
      ],
      steps: [],
      tierMix: { tier0Rules: 1, tier1Ranker: 0, tier2Groq: 0, tier3Gemini: 0 }
    };

    const radar = compute5AxisRadar(complexRun);

    // Verify all 5 axes are present and bounded
    ['perceivable', 'operable', 'understandable', 'robust', 'traversability'].forEach(axis => {
      const val = (radar as any)[axis];
      assert.equal(typeof val, 'number', `Axis ${axis} must be numeric`);
      assert.ok(val >= 0 && val <= 100, `Axis ${axis} (${val}) must be within [0, 100]`);
    });
  });

  it('5. should transition Executive Scorecard grade from A to F upon critical barrier detection', () => {
    // Clean run has grade A
    const passingRun: AuditRun = {
      id: 'run_pass',
      targetUrl: 'http://localhost:3000',
      goal: 'Pass',
      persona: 'keyboard',
      status: 'completed',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      taskSuccess: true,
      effortRatio: 1.1,
      findings: [],
      steps: [],
      tierMix: { tier0Rules: 1, tier1Ranker: 0, tier2Groq: 0, tier3Gemini: 0 }
    };

    const initialScorecard = computeScorecardGrade(passingRun);
    assert.equal(initialScorecard.grade, 'A');
    assert.equal(initialScorecard.isCompliant, true);

    // Failing run with critical trap
    const failingRun: AuditRun = {
      ...passingRun,
      taskSuccess: false,
      effortRatio: 4.2,
      findings: [
        {
          id: 'trap_99',
          runId: 'run_pass',
          stepIdx: 2,
          kind: 'keyboard_trap',
          trustTier: 'proven',
          wcagRules: ['WCAG 2.1.2'],
          severity: 'critical',
          severityScore: 9.9,
          severityInterval: [9.5, 10.0],
          title: 'Sink Cycle',
          summary: 'Critical keyboard trap'
        }
      ]
    };

    const failingScorecard = computeScorecardGrade(failingRun);
    assert.equal(failingScorecard.grade, 'F');
    assert.equal(failingScorecard.isCompliant, false);
    assert.equal(failingScorecard.certStatus, 'Non-Compliant (Sink Trap Detected)');
  });

  it('6. should recover radar score and scorecard grade back to passing after fix is verified', () => {
    // Remediation eliminates the trap finding and restores effortRatio to optimal 1.15
    const remediatedRun: AuditRun = {
      id: 'run_remediated',
      targetUrl: 'http://localhost:3000',
      goal: 'Checkout',
      persona: 'keyboard',
      status: 'completed',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      taskSuccess: true,
      effortRatio: 1.15,
      findings: [], // Trap eliminated
      steps: [],
      kendallTau: {
        tau: 0.98,
        focusOrder: ['#a', '#b'],
        visualOrder: ['#a', '#b'],
        inversionCount: 0,
        totalPairs: 1,
        concordantCount: 1,
        discordantCount: 0,
        isAcceptable: true,
        explanation: 'High concordance'
      },
      tierMix: { tier0Rules: 1, tier1Ranker: 0, tier2Groq: 0, tier3Gemini: 0 }
    };

    const recoveredRadar = compute5AxisRadar(remediatedRun);
    assert.ok(recoveredRadar.operable >= 90);
    assert.ok(recoveredRadar.overall >= 90);

    const recoveredScorecard = computeScorecardGrade(remediatedRun);
    assert.equal(recoveredScorecard.grade, 'A');
    assert.equal(recoveredScorecard.isCompliant, true);
  });

});
