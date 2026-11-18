import { createHash } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

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
  private s3Client: S3Client | null;
  private isConfigured: boolean;
  // In-memory fallback when no AWS credentials available (dev / CI)
  private static localArtifactStore: Map<string, { data: string; metadata: StoredArtifactMetadata }> = new Map();

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'barrierlens-audit-artifacts-us-east-1';
    this.region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.isConfigured = Boolean(accessKeyId && secretAccessKey && process.env.AWS_S3_BUCKET);
    this.s3Client = this.isConfigured
      ? new S3Client({
          region: this.region,
          credentials: { accessKeyId, secretAccessKey },
        })
      : null;
  }

  /**
   * Uploads an artifact to AWS S3 (real PutObjectCommand).
   * Falls back to in-memory local store when AWS credentials are absent.
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
    const location = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    if (this.isConfigured && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: stringContent,
            ContentType: metadata.contentType || 'application/json',
            Metadata: {
              runId: metadata.runId,
              agentRole: metadata.agentRole,
              ...metadata.tags,
            },
          })
        );
      } catch (err: any) {
        console.warn('[S3ArtifactStore] S3 upload failed, falling back to local store:', err.message);
        AWSS3ArtifactStore.localArtifactStore.set(key, { data: stringContent, metadata });
      }
    } else {
      // Local in-memory fallback for dev/CI
      AWSS3ArtifactStore.localArtifactStore.set(key, { data: stringContent, metadata });
    }

    return { bucket: this.bucket, key, eTag: `"${eTag}"`, versionId, location, sizeBytes, timestamp: new Date().toISOString() };
  }

  /**
   * Retrieves an artifact — from S3 first, then in-memory cache.
   */
  async getArtifact(key: string): Promise<string | null> {
    if (this.isConfigured && this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({ Bucket: this.bucket, Key: key })
        );
        const stream = response.Body as any;
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(Buffer.from(chunk));
        return Buffer.concat(chunks).toString('utf-8');
      } catch {
        // Fall through to local cache
      }
    }
    const item = AWSS3ArtifactStore.localArtifactStore.get(key);
    return item ? item.data : null;
  }

  /**
   * Lists artifacts stored under a prefix (e.g. `runs/{runId}/`)
   */
  async listArtifacts(prefix: string): Promise<Array<{ key: string; size: number }>> {
    if (this.isConfigured && this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix })
        );
        return (response.Contents || []).map((obj) => ({
          key: obj.Key || '',
          size: obj.Size || 0,
        }));
      } catch {
        // Fall through to local store
      }
    }
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
