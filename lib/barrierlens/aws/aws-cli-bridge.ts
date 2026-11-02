import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface AWSCLIStatus {
  isInstalled: boolean;
  version?: string;
  configuredRegion: string;
  configuredAccount?: string;
  isAuthenticated: boolean;
  authError?: string;
  bedrockReady: boolean;
  s3Ready: boolean;
  activeProfile: string;
}

export class AWSCLIBridge {
  private static cachedStatus: AWSCLIStatus | null = null;
  private static lastCheck = 0;

  /**
   * Inspects local AWS CLI installation, configuration, and authentication status
   */
  async getStatus(forceRefresh = false): Promise<AWSCLIStatus> {
    if (!forceRefresh && AWSCLIBridge.cachedStatus && (Date.now() - AWSCLIBridge.lastCheck < 15000)) {
      return AWSCLIBridge.cachedStatus;
    }

    let isInstalled = false;
    let version = '';
    let configuredRegion = process.env.AWS_REGION || 'ap-south-1';
    let configuredAccount = '';
    let isAuthenticated = false;
    let authError = '';

    // 1. Check AWS CLI Version
    try {
      const { stdout } = await execAsync('aws --version', { timeout: 4000 });
      isInstalled = true;
      version = stdout.trim();
    } catch {
      isInstalled = false;
    }

    // 2. Check Caller Identity & Authentication
    if (isInstalled) {
      try {
        const { stdout } = await execAsync('aws sts get-caller-identity --output json', { timeout: 6000 });
        const identity = JSON.parse(stdout);
        configuredAccount = identity.Account || '';
        isAuthenticated = true;
      } catch (err: any) {
        isAuthenticated = false;
        const msg = err.stderr || err.stdout || err.message || '';
        if (msg.includes('expired') || msg.includes('reauthenticate')) {
          authError = 'Session expired. Run "aws login" or export AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY.';
        } else if (msg.includes('Unable to locate credentials')) {
          authError = 'No credentials found. Configure via "aws configure" or .env.local';
        } else {
          authError = msg.slice(0, 120);
        }
      }
    }

    const status: AWSCLIStatus = {
      isInstalled,
      version,
      configuredRegion,
      configuredAccount: configuredAccount || '145023097151',
      isAuthenticated,
      authError: authError || undefined,
      bedrockReady: isAuthenticated || Boolean(process.env.AWS_ACCESS_KEY_ID),
      s3Ready: isAuthenticated || Boolean(process.env.AWS_ACCESS_KEY_ID),
      activeProfile: process.env.AWS_PROFILE || 'default'
    };

    AWSCLIBridge.cachedStatus = status;
    AWSCLIBridge.lastCheck = Date.now();
    return status;
  }

  /**
   * Invokes an AWS CLI command safely with timeout
   */
  async executeCommand(command: string, timeoutMs = 8000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs });
      return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: (err.stdout || '').trim(),
        stderr: (err.stderr || err.message || '').trim(),
        exitCode: err.code || 1
      };
    }
  }

  /**
   * Invokes AWS Bedrock model via AWS CLI bedrock-runtime
   */
  async invokeBedrockCLI(
    modelId: string,
    prompt: string,
    region = 'us-east-1'
  ): Promise<{ output: string; latencyMs: number; success: boolean }> {
    const start = performance.now();
    const payload = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const base64Payload = Buffer.from(payload).toString('base64');
    const cmd = `aws bedrock-runtime invoke-model --model-id "${modelId}" --region "${region}" --body "${base64Payload}" outfile.json`;

    const res = await this.executeCommand(cmd, 10000);
    const latencyMs = Math.round(performance.now() - start);

    if (res.exitCode === 0) {
      return { output: res.stdout, latencyMs, success: true };
    }

    return {
      output: res.stderr || 'Bedrock CLI invocation returned non-zero code',
      latencyMs,
      success: false
    };
  }
}
