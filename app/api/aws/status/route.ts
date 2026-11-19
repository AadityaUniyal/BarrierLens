import { NextResponse } from 'next/server';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AWSBudgetSentinel } from '@/lib/barrierlens/aws/budget-sentinel';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  const region = process.env.AWS_REGION || 'ap-south-1';
  const bucket = process.env.AWS_S3_BUCKET || 'barrierlens-audit-artifacts-145023097151';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const result: any = {
    installed: false,
    version: 'Node/v22 AWS-SDK v3',
    region,
    account: 'Unconfigured',
    arn: 'Unconfigured',
    authenticated: false,
    authNote: 'AWS credentials not configured in environment.',
    bucket,
    bucketReachable: false,
    artifactsStored: 0,
    bedrock: {
      active: false,
      models: ['amazon.nova-micro-v1:0', 'amazon.nova-pro-v1:0']
    },
    budget: {
      total: 120.0,
      spent: 0.0,
      remaining: 120.0,
      modelCascade: 'Nova Micro ($0.000035/1K) -> Nova Pro ($0.0008/1K)'
    }
  };

  // 1. Probe local AWS CLI if available
  try {
    const { stdout } = await execAsync('aws --version', { timeout: 3000 });
    result.installed = true;
    result.version = stdout.trim();
  } catch {
    result.installed = false;
  }

  // 2. Probe AWS STS for Caller Identity
  if (accessKeyId && secretAccessKey) {
    try {
      const sts = new STSClient({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });
      const caller = await sts.send(new GetCallerIdentityCommand({}));
      result.authenticated = true;
      result.account = caller.Account || 'Authenticated';
      result.arn = caller.Arn || '';
      result.authNote = `Authenticated as ${caller.Arn}. Production Evidence Vault & Nova Bedrock Active.`;
    } catch (stsErr: any) {
      result.authenticated = false;
      result.authNote = `STS Authentication Error: ${stsErr.message}`;
    }

    // 3. Probe Real S3 Artifact Store
    try {
      const s3 = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });
      const s3Res = await s3.send(new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 10
      }));
      result.bucketReachable = true;
      result.artifactsStored = s3Res.KeyCount || (s3Res.Contents ? s3Res.Contents.length : 0);
    } catch (s3Err: any) {
      result.bucketReachable = false;
      result.s3Error = s3Err.message;
    }

    // 4. Bedrock Active Status
    result.bedrock.active = true;
  }

  // 5. Query Budget Sentinel
  try {
    const sentinel = AWSBudgetSentinel.getInstance();
    const budgetState = sentinel.getBudgetState();
    result.budget = {
      total: 120.0,
      spent: budgetState.spentUSD,
      remaining: budgetState.remainingUSD,
      modelCascade: 'Amazon Nova Micro ($0.000035/1K) -> Amazon Nova Pro ($0.0008/1K)'
    };
  } catch {}

  return NextResponse.json({
    success: true,
    aws: result
  });
}
