# BarrierLens Production Deployment on Amazon Web Services (AWS)

## Architecture Overview

BarrierLens 2.0 is deployed in production on Amazon Web Services in region `ap-south-1` (Mumbai) with multi-region inference routed to `us-east-1` (N. Virginia) for Amazon Bedrock Foundation Models.

```
+---------------------------------------------------------------------------------------------+
|                                        AWS CLOUD                                            |
|                                                                                             |
|   +-------------------------------------------------------------------------------------+   |
|   |   Amazon EC2 Instance: barrierlens-production-app (m7i-flex.large, Ubuntu 22.04)    |   |
|   |   Public IP: http://43.205.254.136 | DNS: ec2-43-205-254-136.ap-south-1             |   |
|   |                                                                                     |   |
|   |   +-----------------------------------------------------------------------------+   |   |
|   |   |              Nginx Reverse Proxy (:80 / :443)                                |   |   |
|   |   |   - /api/backend/  --> http://127.0.0.1:8000 (Python FastAPI ML Backend)    |   |   |
|   |   |   - /              --> http://127.0.0.1:3000 (Next.js 15 Cupertino Studio)   |   |   |
|   |   +-----------------------------------------------------------------------------+   |   |
|   |                                                                                     |   |
|   |   +------------------------------------+   +------------------------------------+   |   |
|   |   |  Next.js 15 Frontend & Agent Mesh  |   |    Python 3.10 ML Backend Engine   |   |   |
|   |   |  - PM2 Name: barrierlens-web       |   |    - PM2 Name: barrierlens-api     |   |   |
|   |   |  - Port: 3000                      |   |    - Port: 8000                    |   |   |
|   |   |  - Playwright Headless Chromium    |   |    - PyTorch, LightGBM, EasyOCR    |   |   |
|   |   +------------------------------------+   +------------------------------------+   |   |
|   +-------------------------------------------------------------------------------------+   |
|                                                                                             |
|   +----------------------------------+   +----------------------------------------------+   |
|   |   Amazon Bedrock Runtime         |   |   Amazon S3 Evidence Vault                   |   |
|   |   - Region: us-east-1            |   |   - Bucket: barrierlens-audit-artifacts-...  |   |
|   |   - Models: Nova Micro & Pro     |   |   - Replay traces & screenshots              |   |
|   +----------------------------------+   +----------------------------------------------+   |
|                                                                                             |
|   +----------------------------------+   +----------------------------------------------+   |
|   |   IAM Role & Instance Profile    |   |   Neon Serverless PostgreSQL (pgvector)      |   |
|   |   - BarrierLensInstanceProfile   |   |   - 768-d Barrier Genome Embeddings          |   |
|   |   - Role: BarrierLensEC2Role     |   |   - HNSW Cosine Similarity Index             |   |
|   +----------------------------------+   +----------------------------------------------+   |
+---------------------------------------------------------------------------------------------+
```

---

## Live Production Endpoints

- **Mission Control Web App**: [http://43.205.254.136](http://43.205.254.136)
- **Unified Health API**: `http://43.205.254.136/api/health`
- **AWS Bedrock & S3 Telemetry**: `http://43.205.254.136/api/aws/status`
- **Python ML Backend Health**: `http://43.205.254.136/api/backend/health`

---

## Infrastructure Specifications

1. **Compute**:
   - **Instance Type**: `m7i-flex.large` (2 vCPUs, 8 GB RAM)
   - **Operating System**: Ubuntu 22.04 LTS (x86_64)
   - **Storage**: 30 GB gp3 high-IOPS EBS Root Volume

2. **Security & Networking**:
   - **Security Group**: `barrierlens-prod-sg` (`sg-0eef523e7ada34e05`)
   - **Inbound Ports**: 80 (HTTP), 443 (HTTPS), 3000 (Next.js), 8000 (FastAPI), 22 (SSH)

3. **Process Supervision (PM2)**:
   - `barrierlens-web`: Next.js 15 server on port 3000
   - `barrierlens-api`: Python FastAPI server with Uvicorn on port 8000
   - Automatic restart on failure and boot-time persistence via systemd

4. **Zero-Timeout Edge Architecture**:
   - Both the frontend agent runner and the Python ML service reside on the same compute cluster.
   - Long-running multi-page journey audits run without the 60-second timeouts imposed by serverless edge platforms.
