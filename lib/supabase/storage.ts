import { supabase } from './db';

export const BUCKET_NAME = 'audit-artifacts';

export interface UploadResult {
  path: string;
  publicUrl: string;
  error?: string;
}

/**
 * Returns the public URL for a file stored in the audit-artifacts bucket.
 */
export function getArtifactPublicUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Uploads a screenshot from an audit step into Supabase Storage.
 * Supports Buffer, Uint8Array, Blob, or base64 data URLs.
 */
export async function uploadAuditScreenshot(
  runId: string,
  stepIdx: number | string,
  data: Buffer | Uint8Array | Blob | string,
  mimeType: string = 'image/png'
): Promise<UploadResult> {
  const filePath = `runs/${runId}/steps/step-${stepIdx}.png`;
  
  let uploadData: any = data;
  if (typeof data === 'string' && data.startsWith('data:')) {
    // Strip base64 header if present
    const base64Data = data.split(',')[1];
    uploadData = Buffer.from(base64Data, 'base64');
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, uploadData, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error(`Failed to upload screenshot for run ${runId} step ${stepIdx}:`, error.message);
    return { path: filePath, publicUrl: '', error: error.message };
  }

  return {
    path: filePath,
    publicUrl: getArtifactPublicUrl(filePath),
  };
}

/**
 * Uploads an accessibility DOM tree or snapshot snapshot for debugging.
 */
export async function uploadDomSnapshot(
  runId: string,
  stepIdx: number | string,
  domHtml: string
): Promise<UploadResult> {
  const filePath = `runs/${runId}/dom/snapshot-${stepIdx}.html`;
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, Buffer.from(domHtml, 'utf8'), {
      contentType: 'text/html; charset=utf-8',
      upsert: true,
    });

  if (error) {
    console.error(`Failed to upload DOM snapshot for run ${runId} step ${stepIdx}:`, error.message);
    return { path: filePath, publicUrl: '', error: error.message };
  }

  return {
    path: filePath,
    publicUrl: getArtifactPublicUrl(filePath),
  };
}

/**
 * Uploads an exported report or certificate (e.g. VPAT, Causal Certificate JSON, Markdown).
 */
export async function uploadReportArtifact(
  runId: string,
  fileName: string,
  content: string | Buffer,
  contentType: string = 'application/json'
): Promise<UploadResult> {
  const filePath = `runs/${runId}/reports/${fileName}`;
  
  const data = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Failed to upload report artifact ${fileName} for run ${runId}:`, error.message);
    return { path: filePath, publicUrl: '', error: error.message };
  }

  return {
    path: filePath,
    publicUrl: getArtifactPublicUrl(filePath),
  };
}

/**
 * Lists all artifacts uploaded for a particular audit run.
 */
export async function listRunArtifacts(runId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`runs/${runId}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error) {
    console.warn(`Could not list artifacts for run ${runId}:`, error.message);
    return [];
  }

  return data.map((item) => `runs/${runId}/${item.name}`);
}

/**
 * Creates a signed URL for private or expiring artifact access.
 */
export async function createSignedArtifactUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    console.error(`Failed to create signed URL for ${filePath}:`, error.message);
    return null;
  }

  return data.signedUrl;
}
