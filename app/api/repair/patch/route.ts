import { NextRequest, NextResponse } from 'next/server';
import { GitPatchGenerator } from '@/lib/barrierlens/repair/git-patch-generator';
import { cdasASTSurgeryEngine } from '@/lib/barrierlens/causal/cdas-ast-surgery';
import { BarrierFinding, FindingKind } from '@/lib/barrierlens/types';

export const runtime = 'nodejs';

const patchGenerator = new GitPatchGenerator();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { finding, findings, filePath, originalContent, targetSelector, findingKind, patchAttributes, patchSnippet } = body;

    // Single finding patch generation with CDAS Causal Dual-Objective AST Surgery
    if (finding) {
      const result = patchGenerator.generatePatchForFinding(finding as BarrierFinding, filePath || 'src/components/AuditedView.tsx');
      const cdas = cdasASTSurgeryEngine.synthesizeSurgicalPatch(
        finding as BarrierFinding,
        finding.evidence?.outerHTML || finding.evidence?.snippet || '<button className="p-2 rounded">Action</button>'
      );
      return NextResponse.json({
        ...result,
        cdasCertificate: cdas.certificate,
        ssimVisualInvariance: cdas.certificate.ssimVisualInvariance,
        causalATE: cdas.certificate.causalATE
      });
    }

    // Bundle generation for multiple findings
    if (Array.isArray(findings) && findings.length > 0) {
      const bundle = patchGenerator.createPatchBundle(findings as BarrierFinding[], filePath || 'src/components/AuditedView.tsx');
      return new NextResponse(bundle, {
        headers: {
          'Content-Type': 'text/x-diff',
          'Content-Disposition': 'attachment; filename="barrierlens-remediation.patch"'
        }
      });
    }

    // Custom patch generation
    if (findingKind) {
      const result = patchGenerator.generateUnifiedDiff({
        filePath: filePath || 'src/components/AuditedView.tsx',
        originalContent,
        targetSelector,
        findingKind: findingKind as FindingKind,
        patchAttributes,
        patchSnippet
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Missing required parameters: finding, findings, or findingKind' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate patch' }, { status: 500 });
  }
}
