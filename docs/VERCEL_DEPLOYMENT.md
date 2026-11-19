# Production Deployment Guide: BarrierLens on Vercel

This guide covers deploying the BarrierLens web application and serverless API mesh to Vercel.

## Quick Deployment Steps

1. **Connect Repository**:
   Import your GitHub repository into Vercel.

2. **Configure Node Engine**:
   Ensure Node.js is set to `22.x` in Project Settings -> General -> Node.js Version.

3. **Required Environment Variables**:
   Add the following variables in the Vercel Dashboard under Settings -> Environment Variables:
   - `DATABASE_URL`: Connection string for Neon Serverless PostgreSQL.
   - `AWS_ACCESS_KEY_ID`: IAM user access key with Bedrock and S3 access.
   - `AWS_SECRET_ACCESS_KEY`: IAM secret key.
   - `AWS_DEFAULT_REGION`: e.g. `ap-south-1` or `us-east-1`.
   - `BEDROCK_REGION`: `us-east-1` (where Amazon Nova Foundation Models run).
   - `S3_ARTIFACTS_BUCKET`: `barrierlens-audit-artifacts-145023097151`.
   - `BETTER_AUTH_SECRET`: A 32+ character random secret string.
   - `BETTER_AUTH_URL`: Your live domain (e.g. `https://barrierlens-seven.vercel.app`).

4. **Verify Deployment**:
   Once deployed, run `curl -I https://<your-project>.vercel.app/api/health` to confirm edge routes are responding with status 200.
