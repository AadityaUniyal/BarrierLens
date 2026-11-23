import { NextRequest, NextResponse } from 'next/server';
import { poaDAGLedger } from '@/lib/barrierlens/engines/merkle-poa-ledger';
import { sql } from '@/lib/neon/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    const leafHash = searchParams.get('leafHash');

    const ledger = poaDAGLedger.getLedger();

    if (leafHash) {
      // Find block containing leafHash and return cryptographic proof
      for (const block of ledger) {
        const found = block.leaves.find(l => l.leafHash === leafHash);
        if (found) {
          const proof = poaDAGLedger.generateMerkleProof(block, leafHash);
          return NextResponse.json({
            found: true,
            blockHash: block.blockHash,
            epochId: block.epochId,
            proof
          });
        }
      }
      return NextResponse.json({ found: false, error: 'Leaf hash not found in ledger' }, { status: 404 });
    }

    if (runId) {
      const matchingBlock = ledger.find(b => b.targetUrl.includes(runId) || b.blockHash.includes(runId));
      if (matchingBlock) {
        return NextResponse.json({ block: matchingBlock });
      }
    }

    // Default: return the full immutable ledger summary
    return NextResponse.json({
      totalBlocksMinted: ledger.length,
      latestBlockHash: ledger.length > 0 ? ledger[ledger.length - 1].blockHash : null,
      latestMerkleRoot: ledger.length > 0 ? ledger[ledger.length - 1].merkleRoot : null,
      blocks: ledger
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to query PoA ledger' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { runId, targetUrl, persona, findings } = body;

    if (!targetUrl || !findings) {
      return NextResponse.json({ error: 'Missing required parameters: targetUrl, findings' }, { status: 400 });
    }

    const block = poaDAGLedger.mintBlock(
      runId || `run-${Date.now().toString(36)}`,
      targetUrl,
      persona || 'keyboard',
      findings
    );

    return NextResponse.json({
      success: true,
      epochId: block.epochId,
      blockHash: block.blockHash,
      merkleRoot: block.merkleRoot,
      complianceState: block.complianceState,
      leafCount: block.leafCount,
      signatures: block.statutoryLedgerSignatures
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to mint PoA block' }, { status: 500 });
  }
}
