import { ParallelPersonaSwarm } from '../lib/barrierlens/swarm/persona-swarm.ts';
import assert from 'assert';

async function testParallelPersonaSwarm() {
  console.log('[Test] Starting Parallel Persona Swarm Test Suite...');

  const swarm = new ParallelPersonaSwarm();
  assert(swarm, 'ParallelPersonaSwarm should be instantiable');

  // Track progress events
  const recordedEvents = [];
  const onProgress = (event) => {
    recordedEvents.push(event);
    console.log(`  -> Progress Event: [${event.type}]`, event.type === 'persona_started' ? `persona=${event.persona}` : '');
  };

  // Mock internal auditorCore to test swarm mechanics reliably in headless unit test environment
  const mockAuditorCore = {
    async runAudit(targetUrl, goal, persona, maxSteps) {
      // Simulate persona-specific findings
      const mockFindings = [];

      if (persona === 'keyboard') {
        mockFindings.push({
          id: `finding_trap_${persona}`,
          kind: 'keyboard_trap',
          selector: '#dialog-modal',
          persona,
          severity: 'critical',
          description: 'Focus locked in modal without escape key handler',
          confidence: 0.95
        });
      }

      if (persona === 'screen_reader') {
        mockFindings.push({
          id: `finding_accname_${persona}`,
          kind: 'missing_accessible_name',
          selector: 'button.icon-btn',
          persona,
          severity: 'serious',
          description: 'Icon button lacks aria-label or accessible text',
          suggestedFix: { title: 'Close modal' },
          confidence: 0.92
        });
        // Cross-persona finding on modal
        mockFindings.push({
          id: `finding_modal_sr_${persona}`,
          kind: 'silent_dynamic_mutation',
          selector: '#dialog-modal',
          persona,
          severity: 'moderate',
          description: 'Modal opened dynamically without aria-live announcement',
          confidence: 0.88
        });
      }

      if (persona === 'low_vision') {
        mockFindings.push({
          id: `finding_contrast_${persona}`,
          kind: 'unreachable_interactive',
          selector: 'button.icon-btn',
          persona,
          severity: 'serious',
          description: 'Button touch target fails minimum 44x44px boundary',
          confidence: 0.85
        });
      }

      if (persona === 'cognitive') {
        mockFindings.push({
          id: `finding_timeout_${persona}`,
          kind: 'missing_accessible_name',
          selector: 'form.checkout',
          persona,
          severity: 'moderate',
          description: 'Form submission lacks progress indicators',
          suggestedFix: { title: 'Checkout form' },
          confidence: 0.80
        });
      }

      return {
        id: `run_${persona}_${Date.now()}`,
        targetUrl,
        goal,
        persona,
        status: 'completed',
        findings: mockFindings,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };
    }
  };

  // Inject mock auditor
  swarm.auditorCore = mockAuditorCore;

  console.log('\n[Test 1] Executing Swarm across all 4 core personas concurrently...');
  const result = await swarm.executeSwarm({
    targetUrl: 'https://example.com/checkout',
    goal: 'Complete checkout form with keyboard and screen reader',
    personas: ['keyboard', 'screen_reader', 'low_vision', 'cognitive'],
    maxStepsPerPersona: 5,
    concurrency: 2,
    synthesizePatches: true,
    onProgress
  });

  // Verify swarm output
  console.log('\n--- Swarm Execution Result ---');
  console.log('Swarm ID:', result.swarmId);
  console.log('Total Duration:', result.totalDurationMs, 'ms');
  console.log('Persona Results Count:', result.personaResults.length);
  console.log('Total Findings:', result.allFindings.length);
  console.log('Unique Findings:', result.uniqueFindingCount);
  console.log('Cross-Persona Findings on Shared Selectors:', result.crossPersonaFindingCount);
  console.log('Unified Health Score:', result.unifiedHealthScore);
  console.log('Pareto Frontier Patches Count:', result.paretoSummary.paretoFrontier.length);

  // Assertions
  assert.strictEqual(result.personaResults.length, 4, 'All 4 personas should have executed');
  assert(result.allFindings.length >= 5, 'Should have aggregated findings from all personas');
  assert(result.crossPersonaFindingCount >= 1, 'Should detect cross-persona overlap on shared selectors (#dialog-modal, button.icon-btn)');
  assert(result.unifiedHealthScore >= 0 && result.unifiedHealthScore <= 100, 'Unified health score must be bounded in [0, 100]');
  assert(result.paretoSummary.paretoFrontier.length > 0, 'Pareto frontier should produce non-empty candidate set');
  assert(result.recommendedPatches.length > 0, 'Recommended patches must contain Pareto-optimal fixes');

  // Verify progress events recorded
  const startEvent = recordedEvents.find(e => e.type === 'swarm_started');
  const paretoEvent = recordedEvents.find(e => e.type === 'pareto_analysis_completed');
  const completeEvent = recordedEvents.find(e => e.type === 'swarm_completed');
  assert(startEvent, 'Must emit swarm_started event');
  assert(paretoEvent, 'Must emit pareto_analysis_completed event');
  assert(completeEvent, 'Must emit swarm_completed event');

  console.log('\n✅ Parallel Persona Swarm Test Suite passed with 100% assertions!');
}

testParallelPersonaSwarm().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
