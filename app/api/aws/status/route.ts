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

  // 2. Probe AWS STS for Caller Identity (supports both static keys & IAM instance profiles)
  try {
    const sts = (accessKeyId && secretAccessKey)
      ? new STSClient({ region, credentials: { accessKeyId, secretAccessKey } })
      : new STSClient({ region });
    const caller = await sts.send(new GetCallerIdentityCommand({}));
    result.authenticated = true;
    const isRoot = Boolean(caller.Arn?.includes(':root'));
    result.account = caller.Account ? `***${caller.Account.slice(-4)}` : 'Authenticated';
    result.arn = isRoot ? 'arn:aws:iam::***:account-admin' : (caller.Arn || 'Authenticated');
    result.authType = isRoot ? 'Static Root Key (Security Warning)' : 'IAM Role / Instance Profile';
    if (isRoot) {
      result.securityWarning = 'Production server is using AWS root credentials. Recommend attaching an IAM EC2 Instance Profile Role with least privilege.';
    }
    result.authNote = `AWS Authentication active (${result.authType}). Evidence Vault & Nova Bedrock operational.`;
  } catch (stsErr: any) {
    result.authenticated = false;
    result.authNote = `AWS Credentials unconfigured or STS check failed: ${stsErr.message}`;
  }

  // 3. Probe Real S3 Artifact Store
  if (result.authenticated) {
    try {
      const s3 = (accessKeyId && secretAccessKey)
        ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
        : new S3Client({ region });
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

    // 4. Bedrock Active Status (real probe via BedrockClient)
    try {
      const { BedrockClient, ListFoundationModelsCommand } = await import('@aws-sdk/client-bedrock');
      const bedrockRegion = process.env.BEDROCK_REGION || 'us-east-1';
      const bedrockClient = (accessKeyId && secretAccessKey)
        ? new BedrockClient({ region: bedrockRegion, credentials: { accessKeyId, secretAccessKey } })
        : new BedrockClient({ region: bedrockRegion });
      const modelsRes = await bedrockClient.send(new ListFoundationModelsCommand({
        byProvider: 'Amazon'
      }));
      result.bedrock.active = Boolean(modelsRes.modelSummaries && modelsRes.modelSummaries.length > 0);
      result.bedrock.modelsCount = modelsRes.modelSummaries?.length || 0;
    } catch (bedrockErr: any) {
      result.bedrock.active = false;
      result.bedrock.error = bedrockErr.message;
    }
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
