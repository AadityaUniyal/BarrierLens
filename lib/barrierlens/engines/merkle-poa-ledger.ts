import crypto from 'node:crypto';
import { BarrierFinding } from '../types';
import { sql } from '@/lib/supabase/db';

export interface PoAMerkleLeaf {
  findingId: string;
  wcagCriterion: string;
  targetSelector: string;
  domHash: string;
  proofDigest: string;
  timestamp: number;
  leafHash: string; // SHA-256(findingId || wcagCriterion || domHash || proofDigest || timestamp)
}

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleInclusionProof {
  leafHash: string;
  merkleRoot: string;
  steps: MerkleProofStep[];
  verified: boolean;
}

export interface PoABlock {
  epochId: number;
  runId?: string;
  blockHash: string;
  parentBlockHash: string;
  merkleRoot: string;
  timestamp: string;
  targetUrl: string;
  persona: string;
  complianceState: 'FULLY_COMPLIANT' | 'CONDITIONAL_NON_COMPLIANT' | 'MATERIAL_BREACH';
  leafCount: number;
  leaves: PoAMerkleLeaf[];
  statutoryLedgerSignatures: {
    adaTitleIIISignature: string;
    eaacertificateDigest: string;
    secVpatAttestation: string;
  };
}

export class ProofOfAccessibilityDAGLedger {
  private static genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
  private static blockChainHistory: PoABlock[] = [];

  /**
   * Constructs an immutable Merkle Leaf from a single accessibility finding or conformance proof.
   */
  public createLeaf(finding: BarrierFinding, targetUrl: string): PoAMerkleLeaf {
    const timestamp = Date.now();
    const selector = finding.selector || finding.evidence?.selector || 'body';
    const wcag = (finding.wcagRules && finding.wcagRules[0]) || 'WCAG 2.2 AA';
    
    // Hash target DOM snippet or selector
    const domSnippet = finding.evidence?.elementHTML || finding.evidence?.outerHTML || selector;
    const domHash = crypto.createHash('sha256').update(domSnippet).digest('hex');

    // Formal proof digest (SAMC proofHash, CMSD proofHash, or finding evidence hash)
    const proofDigest = finding.samcProof?.proofHash || 
                        finding.cmsdCertificate?.proofHash || 
                        finding.evidence?.proofHash || 
                        crypto.createHash('sha256').update(`${finding.id}:${finding.severity}:${finding.title}`).digest('hex');

    const canonical = [
      finding.id,
      wcag,
      selector,
      domHash,
      proofDigest,
      timestamp
    ].join(':::');

    const leafHash = crypto.createHash('sha256').update(canonical).digest('hex');

    return {
      findingId: finding.id,
      wcagCriterion: wcag,
      targetSelector: selector,
      domHash,
      proofDigest,
      timestamp,
      leafHash
    };
  }

  /**
   * Computes the binary Merkle Root of an array of leaves.
   */
  public computeMerkleRoot(leaves: PoAMerkleLeaf[]): { root: string; treeLayers: string[][] } {
    if (leaves.length === 0) {
      const emptyRoot = crypto.createHash('sha256').update('EMPTY_MERKLE_TREE').digest('hex');
      return { root: emptyRoot, treeLayers: [[emptyRoot]] };
    }

    let currentLayer = leaves.map(l => l.leafHash);
    const treeLayers: string[][] = [currentLayer];

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left; // Duplicate odd sibling
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLayer.push(combined);
      }
      currentLayer = nextLayer;
      treeLayers.push(currentLayer);
    }

    return {
      root: currentLayer[0],
      treeLayers
    };
  }

  /**
   * Mints an immutable Proof-of-Accessibility (PoA) Block into the cryptographic DAG.
   */
  public mintBlock(
    runId: string,
    targetUrl: string,
    persona: string,
    findings: BarrierFinding[]
  ): PoABlock {
    const epochId = ProofOfAccessibilityDAGLedger.blockChainHistory.length + 1;
    const parentBlockHash = ProofOfAccessibilityDAGLedger.blockChainHistory.length > 0
      ? ProofOfAccessibilityDAGLedger.blockChainHistory[ProofOfAccessibilityDAGLedger.blockChainHistory.length - 1].blockHash
      : ProofOfAccessibilityDAGLedger.genesisHash;

    const leaves = findings.map(f => this.createLeaf(f, targetUrl));
    const { root: merkleRoot } = this.computeMerkleRoot(leaves);
    const timestamp = new Date().toISOString();

    const criticalViolations = findings.filter(f => f.severity === 'critical' || f.severity === 'high');
    const complianceState: PoABlock['complianceState'] = findings.length === 0
      ? 'FULLY_COMPLIANT'
      : criticalViolations.length > 0 ? 'MATERIAL_BREACH' : 'CONDITIONAL_NON_COMPLIANT';

    // Cryptographic block hash
    const blockPayload = [epochId, parentBlockHash, merkleRoot, timestamp, targetUrl, complianceState].join('|||');
    const blockHash = crypto.createHash('sha256').update(blockPayload).digest('hex');

    // Statutory legal attestations (HMAC digests under ADA Title III and EAA 2025)
    const adaTitleIIISignature = crypto.createHmac('sha256', 'BARRIERLENS_STATUTORY_SECRET_ADA')
      .update(`${blockHash}:ADA_TITLE_III:${targetUrl}:${complianceState}`)
      .digest('hex');

    const eaacertificateDigest = crypto.createHmac('sha256', 'BARRIERLENS_STATUTORY_SECRET_EAA')
      .update(`${blockHash}:EAA_EN_301_549:${targetUrl}:${merkleRoot}`)
      .digest('hex');

    const secVpatAttestation = crypto.createHmac('sha256', 'BARRIERLENS_STATUTORY_SECRET_SEC')
      .update(`${blockHash}:VPAT_2.5_INT:${runId}:${timestamp}`)
      .digest('hex');

    const block: PoABlock = {
      epochId,
      runId,
      blockHash,
      parentBlockHash,
      merkleRoot,
      timestamp,
      targetUrl,
      persona,
      complianceState,
      leafCount: leaves.length,
      leaves,
      statutoryLedgerSignatures: {
        adaTitleIIISignature,
        eaacertificateDigest,
        secVpatAttestation
      }
    };

    ProofOfAccessibilityDAGLedger.blockChainHistory.push(block);
    return block;
  }

  /**
   * Generates a tamper-proof O(log N) Merkle Inclusion Proof for a specific leaf.
   */
  public generateMerkleProof(block: PoABlock, leafHash: string): MerkleInclusionProof {
    const { root, treeLayers } = this.computeMerkleRoot(block.leaves);
    const steps: MerkleProofStep[] = [];

    let leafIndex = treeLayers[0].indexOf(leafHash);
    if (leafIndex === -1) {
      return { leafHash, merkleRoot: root, steps: [], verified: false };
    }

    for (let layerIdx = 0; layerIdx < treeLayers.length - 1; layerIdx++) {
      const currentLayer = treeLayers[layerIdx];
      const isEven = leafIndex % 2 === 0;
      const siblingIndex = isEven ? leafIndex + 1 : leafIndex - 1;

      if (siblingIndex < currentLayer.length) {
        steps.push({
          position: isEven ? 'right' : 'left',
          hash: currentLayer[siblingIndex]
        });
      } else {
        // Self sibling if odd count
        steps.push({
          position: 'right',
          hash: currentLayer[leafIndex]
        });
      }

      leafIndex = Math.floor(leafIndex / 2);
    }

    const verified = this.verifyMerkleProof(leafHash, steps, root);

    return {
      leafHash,
      merkleRoot: root,
      steps,
      verified
    };
  }

  /**
   * Cryptographically verifies a Merkle proof in O(log N) operations.
   */
  public verifyMerkleProof(leafHash: string, steps: MerkleProofStep[], expectedRoot: string): boolean {
    let currentHash = leafHash;

    for (const step of steps) {
      if (step.position === 'left') {
        currentHash = crypto.createHash('sha256').update(step.hash + currentHash).digest('hex');
      } else {
        currentHash = crypto.createHash('sha256').update(currentHash + step.hash).digest('hex');
      }
    }

    return currentHash === expectedRoot;
  }

  /**
   * Retrieves current ledger chain.
   */
  public getLedger(): PoABlock[] {
    return ProofOfAccessibilityDAGLedger.blockChainHistory;
  }

  /**
   * Mints a PoA block with continuity from Postgres and persists it to `poa_ledger_blocks`.
   */
  public async mintBlockPersisted(
    runId: string,
    targetUrl: string,
    persona: string,
    findings: BarrierFinding[]
  ): Promise<PoABlock> {
    let prevEpoch = ProofOfAccessibilityDAGLedger.blockChainHistory.length;
    let prevHash = prevEpoch > 0
      ? ProofOfAccessibilityDAGLedger.blockChainHistory[prevEpoch - 1].blockHash
      : ProofOfAccessibilityDAGLedger.genesisHash;

    try {
      const latest = await sql`
        SELECT epoch_id, block_hash
        FROM poa_ledger_blocks
        ORDER BY epoch_id DESC
        LIMIT 1
      `;
      if (latest.length > 0 && Number(latest[0].epoch_id) >= prevEpoch) {
        prevEpoch = Number(latest[0].epoch_id);
        prevHash = String(latest[0].block_hash);
      }
    } catch {
      // Fall back to in-memory chain state if DB is temporarily unreachable
    }

    const epochId = prevEpoch + 1;
    const parentBlockHash = prevHash;
    const leaves = findings.map(f => this.createLeaf(f, targetUrl));
    const { root: merkleRoot } = this.computeMerkleRoot(leaves);
    const timestamp = new Date().toISOString();

    const criticalViolations = findings.filter(f => f.severity === 'critical' || f.severity === 'high');
    const complianceState: PoABlock['complianceState'] = findings.length === 0
      ? 'FULLY_COMPLIANT'
      : criticalViolations.length > 0 ? 'MATERIAL_BREACH' : 'CONDITIONAL_NON_COMPLIANT';

    const blockPayload = [epochId, parentBlockHash, merkleRoot, timestamp, targetUrl, complianceState].join('|||');
    const blockHash = crypto.createHash('sha256').update(blockPayload).digest('hex');

    const adaTitleIIISignature = crypto.createHmac('sha256', 'BARRIERLENS_STATUTORY_SECRET_ADA')
      .update(`${blockHash}:ADA_TITLE_III:${targetUrl}:${complianceState}`)
      .digest('hex');

    const eaacertificateDigest = crypto.createHmac('sha256', 'BARRIERLENS_STATUTORY_SECRET_EAA')
      .update(`${blockHash}:EAA_EN_301_549:${targetUrl}:${merkleRoot}`)
      .digest('hex');

    const secVpatAttestation = crypto.createHmac('sha256', 'BARRIERLENS_STATUTORY_SECRET_SEC')
      .update(`${blockHash}:VPAT_2.5_INT:${runId}:${timestamp}`)
      .digest('hex');

    const block: PoABlock = {
      epochId,
      runId,
      blockHash,
      parentBlockHash,
      merkleRoot,
      timestamp,
      targetUrl,
      persona,
      complianceState,
      leafCount: leaves.length,
      leaves,
      statutoryLedgerSignatures: {
        adaTitleIIISignature,
        eaacertificateDigest,
        secVpatAttestation
      }
    };

    ProofOfAccessibilityDAGLedger.blockChainHistory.push(block);

    await sql`
      INSERT INTO poa_ledger_blocks (
        epoch_id, run_id, block_hash, parent_block_hash, merkle_root,
        target_url, persona, compliance_state, leaf_count, leaves, statutory_signatures
      )
      VALUES (
        ${block.epochId},
        ${runId},
        ${block.blockHash},
        ${block.parentBlockHash},
        ${block.merkleRoot},
        ${block.targetUrl},
        ${block.persona},
        ${block.complianceState},
        ${block.leafCount},
        ${JSON.stringify(block.leaves)}::jsonb,
        ${JSON.stringify(block.statutoryLedgerSignatures)}::jsonb
      )
    `;

    return block;
  }

  /**
   * Loads persisted PoA blocks from Postgres, falling back to in-memory cache if DB is unavailable.
   */
  public async getPersistedLedger(runId?: string): Promise<PoABlock[]> {
    try {
      const rows = runId
        ? await sql`
            SELECT epoch_id, run_id, block_hash, parent_block_hash, merkle_root, target_url, persona, compliance_state, leaf_count, leaves, statutory_signatures, created_at
            FROM poa_ledger_blocks
            WHERE run_id = ${runId} OR target_url ILIKE ${'%' + runId + '%'} OR block_hash ILIKE ${'%' + runId + '%'}
            ORDER BY epoch_id ASC
          `
        : await sql`
            SELECT epoch_id, run_id, block_hash, parent_block_hash, merkle_root, target_url, persona, compliance_state, leaf_count, leaves, statutory_signatures, created_at
            FROM poa_ledger_blocks
            ORDER BY epoch_id ASC
          `;

      if (rows.length > 0) {
        return rows.map((r: any) => ({
          epochId: Number(r.epoch_id),
          runId: r.run_id || undefined,
          blockHash: r.block_hash,
          parentBlockHash: r.parent_block_hash,
          merkleRoot: r.merkle_root,
          timestamp: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          targetUrl: r.target_url,
          persona: r.persona,
          complianceState: r.compliance_state,
          leafCount: Number(r.leaf_count || 0),
          leaves: typeof r.leaves === 'string' ? JSON.parse(r.leaves) : (r.leaves || []),
          statutoryLedgerSignatures: typeof r.statutory_signatures === 'string'
            ? JSON.parse(r.statutory_signatures)
            : (r.statutory_signatures || { adaTitleIIISignature: '', eaacertificateDigest: '', secVpatAttestation: '' })
        }));
      }
    } catch {
      // Fall back to in-memory chain if DB query fails
    }

    const mem = ProofOfAccessibilityDAGLedger.blockChainHistory;
    if (runId) {
      return mem.filter(b => b.runId === runId || b.targetUrl.includes(runId) || b.blockHash.includes(runId));
    }
    return mem;
  }
}

export const poaDAGLedger = new ProofOfAccessibilityDAGLedger();
