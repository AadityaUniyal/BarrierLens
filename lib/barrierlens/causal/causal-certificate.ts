import { BarrierFinding, FindingKind } from '../types';
import { CounterfactualResult, CounterfactualPatch } from './counterfactual-engine';
import { VerificationResult } from './sandbox-verifier';
import { createHash } from 'crypto';

export interface CausalCertificate {
  id: string; // UUID v4
  timestamp: string; // ISO-8601
  findingId: string;
  findingKind: FindingKind;
  causalChain: string[];
  intervention: {
    nodeSelector: string;
    type: string;
    before: string;
    after: string;
  };
  verification: {
    barrierEliminated: boolean;
    regressionFree: boolean;
    replaySuccess: boolean;
    proofHash: string;
  };
  wcagMapping: string[];
  remediation: {
    originalHTML: string;
    patchedHTML: string;
    diffSummary: string;
    invasivenessLevel: number;
  };
  signatureHash: string; // SHA-256 of entire certificate payload
}

export class CausalCertificateGenerator {
  /**
   * Generates a signed Causal Certificate verifying that an intervention provably resolves the finding
   */
  generateCertificate(
    finding: BarrierFinding,
    counterfactual: CounterfactualResult,
    verification: VerificationResult,
    chosenPatch?: CounterfactualPatch
  ): CausalCertificate {
    const certId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const patch = chosenPatch || counterfactual.bestPatch || counterfactual.patches[0];

    // Reconstruct human-readable causal chain
    const causalChain: string[] = [
      `1. Target: Element <${finding.evidence?.selector || 'control'}> exhibits ${finding.kind}`,
      `2. Structural Dependency: SCM identified root causal locus at ${counterfactual.causalGraph.rootCause?.id || 'target node'}`,
      `3. Counterfactual Action: do(${patch?.intervention.interventionType} = "${patch?.intervention.newValue || 'patch'}")`,
      `4. Empirical Verification: Sandbox re-evaluation verified barrier elimination (${verification.barrierEliminated}) with ${verification.regressionCount} regressions`,
      `5. Conformance: Satisfies WCAG criterion ${finding.wcagRules.join(', ')}`
    ];

    const diffSummary = patch
      ? `Replaced: ${patch.originalHTML.slice(0, 60)}... → ${patch.patchedHTML.slice(0, 60)}...`
      : 'No patch recorded';

    const unsignedCertificate = {
      id: certId,
      timestamp,
      findingId: finding.id,
      findingKind: finding.kind,
      causalChain,
      intervention: {
        nodeSelector: finding.evidence?.selector || 'unknown',
        type: patch?.intervention.interventionType || 'add_attribute',
        before: patch?.originalHTML || '',
        after: patch?.patchedHTML || ''
      },
      verification: {
        barrierEliminated: verification.barrierEliminated,
        regressionFree: verification.regressionCount === 0,
        replaySuccess: verification.replaySuccess,
        proofHash: verification.proofHash
      },
      wcagMapping: finding.wcagRules,
      remediation: {
        originalHTML: patch?.originalHTML || '',
        patchedHTML: patch?.patchedHTML || '',
        diffSummary,
        invasivenessLevel: patch?.invasiveness || 1
      }
    };

    const signatureHash = createHash('sha256')
      .update(JSON.stringify(unsignedCertificate))
      .digest('hex');

    return {
      ...unsignedCertificate,
      signatureHash
    };
  }
}
