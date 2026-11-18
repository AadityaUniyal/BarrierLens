import { ParetoConflictResolver } from '../lib/barrierlens/ml/pareto-resolver.ts';

function main() {
  console.log('[Test] Initializing Pareto Conflict Resolver test suite...');
  const resolver = new ParetoConflictResolver();

  // 1. Define competing candidate fixes for a Keyboard Trap in a Modal
  const candidateA = {
    id: 'patch_modal_inert_esc',
    name: 'Modal Focus Trap with Esc Handler + Inert Background',
    findingKind: 'keyboard_trap',
    targetSelector: '#trap-modal',
    patchCode: 'dialog.showModal(); window.addEventListener("keydown", (e) => { if (e.key === "Escape") dialog.close(); });',
    patchType: 'listener_patch',
    utilities: resolver.evaluateCandidateUtility('keyboard_trap', 'listener_patch', {
      implementsModalInert: true,
      addsEscKeyListener: true
    })
  };

  const candidateB = {
    id: 'patch_esc_only',
    name: 'Simple Esc Key Handler without Inert',
    findingKind: 'keyboard_trap',
    targetSelector: '#trap-modal',
    patchCode: 'window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });',
    patchType: 'listener_patch',
    utilities: resolver.evaluateCandidateUtility('keyboard_trap', 'listener_patch', {
      addsEscKeyListener: true
    })
  };

  const candidateC = {
    id: 'patch_brute_hide',
    name: 'Brute-Force Display None on Tab Keydown',
    findingKind: 'keyboard_trap',
    targetSelector: '#trap-modal',
    patchCode: 'modal.style.display = "none";',
    patchType: 'style_patch',
    utilities: resolver.evaluateCandidateUtility('keyboard_trap', 'style_patch', {
      hidesElementVisually: true
    })
  };

  console.log('\n--- Evaluated Utilities ---');
  console.log('Candidate A (Inert + Esc):', candidateA.utilities);
  console.log('Candidate B (Esc Only):', candidateB.utilities);
  console.log('Candidate C (Brute Hide):', candidateC.utilities);

  // Assert Dominance
  const aDominatesB = resolver.dominates(candidateA, candidateB);
  const aDominatesC = resolver.dominates(candidateA, candidateC);
  const bDominatesC = resolver.dominates(candidateB, candidateC);

  console.log('\n--- Dominance Checks ---');
  console.log('Candidate A dominates B (Expected true):', aDominatesB);
  console.log('Candidate A dominates C (Expected true):', aDominatesC);
  console.log('Candidate B dominates C (Expected true):', bDominatesC);

  if (!aDominatesB || !aDominatesC || !bDominatesC) {
    throw new Error('Pareto Dominance calculation failed');
  }

  // 2. Test Silent State Change with Conflict / Trade-off
  const candidateAssertiveVerbose = {
    id: 'patch_verbose_assertive',
    name: 'Assertive 60-word Verbose Live Region',
    findingKind: 'silent_state_change',
    targetSelector: '#status-alert',
    patchCode: '<div aria-live="assertive">Order #12345 has been confirmed and scheduled for delivery on Monday...</div>',
    patchType: 'attribute_patch',
    utilities: resolver.evaluateCandidateUtility('silent_state_change', 'attribute_patch', {
      addsAriaLiveAssertive: true,
      addsVerboseText: true
    })
  };

  const candidatePoliteConcise = {
    id: 'patch_polite_concise',
    name: 'Polite Concise Live Region',
    findingKind: 'silent_state_change',
    targetSelector: '#status-alert',
    patchCode: '<div aria-live="polite">Order #12345 confirmed.</div>',
    patchType: 'attribute_patch',
    utilities: resolver.evaluateCandidateUtility('silent_state_change', 'attribute_patch', {
      addsAriaLiveAssertive: false,
      addsVerboseText: false
    })
  };

  console.log('\n--- Silent State Change Utilities ---');
  console.log('Verbose Assertive:', candidateAssertiveVerbose.utilities);
  console.log('Polite Concise:', candidatePoliteConcise.utilities);

  // 3. Resolve Full Pareto Frontier
  const allCandidates = [
    candidateA,
    candidateB,
    candidateC,
    candidateAssertiveVerbose,
    candidatePoliteConcise
  ];

  const resolution = resolver.resolveParetoFrontier(allCandidates);

  console.log('\n--- Pareto Frontier Resolution ---');
  console.log('Total Candidates:', resolution.totalCandidates);
  console.log('Pareto Optimal Count:', resolution.paretoFrontier.length);
  console.log('Dominated Count:', resolution.dominatedCandidates.length);
  console.log('Best Balanced Candidate:', resolution.bestBalancedCandidate?.id);

  // Check Conflict Analysis & Compensations on Verbose Assertive candidate
  const verboseEval = resolution.evaluations[candidateAssertiveVerbose.id];
  console.log('\n--- Conflict & Regression Analysis on Verbose Assertive ---');
  console.log('Has Regression (Expected true):', verboseEval.hasRegression);
  console.log('Regressed Personas:', verboseEval.regressedPersonas);
  console.log('Conflict Explanation:', verboseEval.conflictAnalysis.explanation);
  console.log('Recommended Compensations:', verboseEval.recommendedCompensations);

  if (!verboseEval.hasRegression || !verboseEval.regressedPersonas.includes('cognitive')) {
    throw new Error('Failed to detect cognitive regression on verbose assertive live region');
  }

  if (verboseEval.recommendedCompensations.length === 0) {
    throw new Error('Failed to generate compensatory affordances for regression');
  }

  console.log('\n✅ ALL PARETO CONFLICT RESOLVER MATHEMATICAL PROPERTIES VERIFIED!');
}

main();
