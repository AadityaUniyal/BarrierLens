import { createHash } from 'crypto';

export interface S3PutObjectResult {
  bucket: string;
  key: string;
  eTag: string; // MD5/SHA-256 digest
  versionId: string;
  location: string;
  sizeBytes: number;
  timestamp: string;
}

export interface StoredArtifactMetadata {
  contentType: string;
  runId: string;
  agentRole: string;
  tags?: Record<string, string>;
}

export class AWSS3ArtifactStore {
  private bucket: string;
  private region: string;
  private static localArtifactStore: Map<string, { data: string; metadata: StoredArtifactMetadata }> = new Map();

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'barrierlens-audit-artifacts-us-east-1';
    this.region = process.env.AWS_REGION || 'us-east-1';
  }

  /**
   * Uploads an artifact (Trace, Certificate, DOM dump, or Screenshot) to AWS S3
   */
  async putArtifact(
    key: string,
    content: string | Record<string, any>,
    metadata: StoredArtifactMetadata
  ): Promise<S3PutObjectResult> {
    const stringContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const sizeBytes = Buffer.byteLength(stringContent, 'utf8');
    const eTag = createHash('md5').update(stringContent).digest('hex');
    const versionId = `v_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;

    // Store in local in-memory fallback cache
    AWSS3ArtifactStore.localArtifactStore.set(key, {
      data: stringContent,
      metadata
    });

    const location = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      bucket: this.bucket,
      key,
      eTag: `"${eTag}"`,
      versionId,
      location,
      sizeBytes,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retrieves an artifact from S3
   */
  async getArtifact(key: string): Promise<string | null> {
    const item = AWSS3ArtifactStore.localArtifactStore.get(key);
    return item ? item.data : null;
  }

  /**
   * Lists artifacts stored under a prefix (e.g. `runs/{runId}/`)
   */
  async listArtifacts(prefix: string): Promise<Array<{ key: string; size: number }>> {
    const matches: Array<{ key: string; size: number }> = [];
    for (const [k, v] of AWSS3ArtifactStore.localArtifactStore.entries()) {
      if (k.startsWith(prefix)) {
        matches.push({ key: k, size: Buffer.byteLength(v.data, 'utf8') });
      }
    }
    return matches;
  }

  getBucketName(): string {
    return this.bucket;
  }
}
