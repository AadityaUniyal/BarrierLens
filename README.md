<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="BarrierLens Logo" />
</p>

<h1 align="center">BarrierLens 2.0</h1>

<p align="center">
  <strong>Autonomous Agentic Web Accessibility Verification & Causal Repair Engine</strong><br />
  <em>Prove, verify, and mathematically seal digital accessibility barriers before production code ships.</em>
</p>

<p align="center">
  <a href="http://43.205.254.136"><strong>🌐 Live AWS Production Deployment: http://43.205.254.136</strong></a>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.1-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.0-61dafb?logo=react" alt="React 19" /></a>
  <a href="https://aws.amazon.com/bedrock/"><img src="https://img.shields.io/badge/AWS%20Bedrock-Nova%20Micro%20%7C%20Pro-FF9900?logo=amazon-aws" alt="AWS Bedrock Nova" /></a>
  <a href="https://neon.tech"><img src="https://img.shields.io/badge/Neon-pgvector%20Serverless-00E599?logo=postgresql" alt="Neon Postgres" /></a>
  <a href="https://playwright.dev"><img src="https://img.shields.io/badge/Playwright-Chromium%20CDP-45ba4b?logo=playwright" alt="Playwright" /></a>
  <a href="https://www.w3.org/WAI/standards-guidelines/wcag/"><img src="https://img.shields.io/badge/WCAG-2.2%20Level%20AAA-blue" alt="WCAG 2.2 AAA" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7%20Strict-blue?logo=typescript" alt="TypeScript" /></a>
</p>

---

## ⚡ The Executive Problem

Over **96.8% of the top 1,000,000 websites fail basic accessibility guidelines** (WebAIM Million). Legacy accessibility tools fail organizations in two opposite ways:

1. **Static DOM Linters (e.g., Axe, Lighthouse):** Run passive rule checks on static DOM trees. They detect simple color contrast and missing attributes, but are **completely blind to runtime behavioral traps** (e.g. keyboard focus sinks in animated modals, unannounced asynchronous cart updates, or disorienting visual reading flow inversions).
2. **Surface Overlay Widgets:** Inject cosmetic JavaScript overlays that attempt to re-style pages for screen readers. They create compliance liability, degrade user experience, and frequently trigger federal ADA / EAA lawsuits.

**BarrierLens is an Autonomous Task-Conditioned Verification Agent.** Rather than inspecting static markup, BarrierLens launches real headless Chromium sessions via the Chrome DevTools Protocol (CDP), assumes physical user personas with genuine sensory and motor constraints, autonomously traverses multi-step user journeys (e.g., checkout flows, account registrations, filter menus), mathematically proves focus sink cycles using **Tarjan Strongly Connected Components (SCC)**, evaluates reading order with **Kendall’s Tau ($\tau$) rank correlation**, and synthesizes cryptographically verified causal AST patches backed by **Amazon Bedrock Nova** foundation models.

---

## 🏆 Core Architectural Differentiators

| Capability | Legacy Linters (Axe/Lighthouse) | Overlay Widgets | BarrierLens 2.0 Agentic Mesh |
|---|---|---|---|
| **Runtime Interaction Testing** | ❌ Static Snapshot Only | ❌ Client DOM Override | ✅ **Autonomous Playwright CDP Journey Traversal** |
| **Keyboard Trap Detection** | ⚠️ Heuristic guess | ❌ Ignores | ✅ **Empirical Graph Tarjan SCC Sink Loop Proof** |
| **Reading Order Analysis** | ❌ Unchecked | ❌ Unchecked | ✅ **Kendall’s Tau ($\tau$) Concordance Matrix** |
| **Assistive Silence Detection** | ❌ Attributes only | ❌ Ignores | ✅ **VoiceOver Acoustic Stream Gap Detector** |
| **Severity Scoring** | ⚠️ Arbitrary Static Enum | ❌ None | ✅ **Conformal Prediction Bounds (MAPIE Quantile)** |
| **Cross-Site Intelligence** | ❌ None | ❌ None | ✅ **768-d Barrier Genome Vector Clustering (pgvector)** |
| **Root-Cause Remediation** | ⚠️ Text recommendations | ❌ Runtime CSS patch | ✅ **Cryptographic Causal Certificate + Sealed AST Patch** |
| **Cloud Foundation Models** | ❌ None | ❌ None | ✅ **Amazon Bedrock Nova Micro / Pro (SigV4 Auth)** |

---

## 📐 System Architecture

```mermaid
flowchart TD
    subgraph Client["Cupertino Mission Control UI (Next.js 15 + React 19)"]
        UI[Audit Studio & Live Mission Control]
        SSE[Server-Sent Events Stream /api/audit/stream]
        Diff[Time-Travel Replay & Causal Patch Diff]
        GenomeUI[Barrier Genome pgvector 3D Topology]
    end

    subgraph Core["Autonomous Agent Engine (TypeScript Core)"]
        Recon[Autonomous Recon Engine\nPage Landmark Deduction]
        Swarm[Parallel Persona Swarm\nKeyboard | Screen Reader | Tremor]
        Provider[BrowserProvider\nCDP WebSocket / Local Headless Chromium]
        CircuitBreaker[Backend Circuit Breaker\nFail-Fast 0ms Health Gate]
    end

    subgraph Verification["Mathematical Proof Engines"]
        Tarjan[Tarjan SCC Focus Graph\nDirected Keyboard Loop Detection]
        Kendall[Kendall's Tau Engine\nVisual vs DOM Reading Inversion Matrix]
        Gap[Announcement Gap Detector\nState Mutation vs Screen Reader Speech]
        Causal[Pearl SCM Causal Engine\ndo-calculus Intervention & AST Synthesis]
    end

    subgraph Cloud["Live Cloud Infrastructure (Verified Production)"]
        Bedrock[Amazon Bedrock Runtime\namazon.nova-micro-v1:0 & nova-pro-v1:0]
        S3[AWS S3 Evidence Vault\nbarrierlens-audit-artifacts-145023097151]
        Neon[Neon Serverless Postgres\nbarrier_genomes pgvector HNSW Index]
        STS[AWS STS Caller Identity\nAccount: 145023097151]
    end

    UI --> SSE
    SSE --> Core
    Core --> Recon
    Recon --> Provider
    Provider --> Swarm
    Swarm --> Tarjan & Kendall & Gap
    Tarjan & Kendall & Gap --> Causal
    Causal --> CircuitBreaker
    CircuitBreaker --> Bedrock
    Causal --> Diff
    Swarm --> Neon
    Swarm --> S3
    Neon --> GenomeUI
```

---

## 📂 Repository Directory Layout

```
barrierlens/
├── app/                                 # Next.js 15 App Router Architecture
│   ├── api/                             # Serverless REST & SSE Endpoints
│   │   ├── adversarial/run/             # Red-team chaos & motor tremor stress testing
│   │   ├── audit/stream/                # Real-time SSE streaming agent trajectory
│   │   ├── audit/swarm/                 # Multi-persona parallel audit coordinator
│   │   ├── aws/status/                  # Live AWS STS, S3 bucket & Bedrock telemetry
│   │   ├── backend/[...route]/          # Resilient proxy to Python ML engine
│   │   ├── crawler/discover/            # Autonomous multi-page CUJ crawler
│   │   ├── genome/                      # Neon pgvector 768-d embedding queries
│   │   ├── health/                      # Production service health matrix
│   │   ├── reasoner/                    # Amazon Bedrock Nova inference route
│   │   ├── repair/verify/               # Causal counterfactual AST verification
│   │   └── strands/                     # AWS Strands agent mesh execution
│   ├── benchmark/                       # Ground-truth WCAG vulnerability testbed
│   ├── scorecard/[id]/                  # Public shareable executive compliance scorecard
│   ├── layout.tsx                       # Root layout, theme injection & font geometry
│   └── page.tsx                         # Cupertino Mission Control primary dashboard
├── backend/                             # Python 3.11+ GPU-Accelerated ML Service
│   ├── app.py                           # FastAPI application entry point (:8000)
│   ├── core/                            # Configuration, event bus & Strands coordinator
│   ├── inspector/                       # Tarjan focus graphs, reading order, gap detector
│   ├── ml/                              # LightGBM action ranker & Qwen2.5-Coder SLM
│   ├── remedy/                          # Replay verifier & AST code synthesizer
│   └── vault/                           # API key hashing & HMAC webhook dispatchers
├── components/apple/                    # Precision Cupertino Visual Interface Components
│   ├── AuditStudioView.tsx              # Interactive target auditor & progress streaming
│   ├── AWSBridgeConsole.tsx             # Live AWS STS identity, S3 & Bedrock monitor
│   ├── BarrierGenomeViz.tsx             # 768-d cosine similarity cluster visualization
│   ├── CausalDiffView.tsx               # Side-by-side AST counterfactual patch viewer
│   ├── CDPPatchSimulator.tsx            # Live DOM patch applicator & focus loop simulator
│   ├── LiveMissionControl.tsx           # Multi-agent activity feed & real-time telemetry
│   ├── StressTestDashboard.tsx          # Adversarial chaos injection & tremor console
│   └── TimeTravelReplayPlayer.tsx       # Step-by-step interactive DOM inspection
├── docs/                                # Technical Documentation & Architecture Blueprints
│   ├── ARCHITECTURE.md                  # Comprehensive deep-dive system design
│   ├── API_REFERENCE.md                 # Complete REST & SSE API specification
│   ├── AWS_PRODUCTION_DEPLOYMENT.md     # Production cloud deployment guide on AWS
│   └── BarrierLens Full Build Plan.pdf  # Foundational specification document
├── fixtures/                            # Verified benchmark pages with deliberate traps
├── lib/barrierlens/                     # Core Behavioral Accessibility Agent Framework
│   ├── adversarial/                     # Chaos injection & Parkinson motor tremor engine
│   ├── agent/                           # Auditor core, browser provider, LLM router, circuit breaker
│   ├── aws/                             # Budget sentinel, AWS CLI bridge, S3 evidence vault
│   ├── causal/                          # Pearl SCM causal engine & cryptographic certs
│   ├── cdp/                             # Accessibility tree serializer & CDP AX extractor
│   ├── crawler/                         # Autonomous sitemap crawler & CUJ synthesizer
│   ├── engines/                         # Tarjan focus graph, Kendall's tau, announcement gaps
│   ├── genome/                          # Barrier Genome 768-d encoder & pgvector store
│   └── ml/                              # Conformal impact, action ranker, visual affordance
├── lib/neon/                            # Neon Serverless Postgres Client & Resilient Proxy
├── public/                              # Production Static Assets & Vector Logos
├── scripts/                             # Verification Suites, Test Runners & CI Automation
│   ├── dev-all.mjs                      # Concurrent full-stack dev runner (:3000 + :8000)
│   ├── verify-novel-differentiators.mjs # 20/20 novel differentiator test suite
│   ├── aws-agent-cli.mjs                # CLI inspection for AWS STS, S3, and Bedrock
│   ├── aws-deploy/                      # AWS cloud-init and user_data deployment scripts
│   └── barrierlens-ci.mjs               # Headless CI/CD audit runner for GitHub Actions
├── next.config.mjs                      # Next.js 15 standalone production configuration
└── tsconfig.json                        # Strict TypeScript compiler configuration
```

---

## 🚀 Quickstart & Installation

### Prerequisites

- **Node.js**: `22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **AWS CLI**: Authenticated (`aws sts get-caller-identity`)
- **Python** (Optional for local ML GPU acceleration): Python `3.11+` with PyTorch & CUDA

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/AadityaUniyal/BarrierLens.git
cd BarrierLens
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```ini
# Neon PostgreSQL Connection
DATABASE_URL=postgresql://user:password@ep-your-subdomain.us-east-2.aws.neon.tech/neondb?sslmode=require

# AWS Bedrock & Evidence Vault
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=ap-south-1
BEDROCK_REGION=us-east-1
S3_ARTIFACTS_BUCKET=barrierlens-audit-artifacts-145023097151

# Better Auth & Security
BETTER_AUTH_SECRET=your_32_character_minimum_random_secret_string
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Verify the Novel Differentiators

Run the 20-point verification test suite verifying the Barrier Genome, Causal Engine, and Adversarial Stress Agent:

```bash
npm run test:differentiators
```

```
======================================================
🎉 ALL 20 NOVEL DIFFERENTIATOR VERIFICATIONS PASSED!
======================================================
```

### 4. Launch the Development Environment

Start the Next.js Cupertino Studio:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the **Cupertino Mission Control** dashboard.

To launch both the Next.js Studio and the optional CUDA GPU ML backend concurrently:

```bash
npm run dev:all
```

---

## 🧪 Comprehensive Verification Commands

| Command | Purpose | Output / SLA |
|---|---|---|
| `npx tsc --noEmit` | Strict Type Check | 0 errors across 100% of files |
| `npm run test:differentiators` | Core Algorithms | 20/20 passed (Genome, Causal, AAST) |
| `npm run build` | Next.js Production Build | 15/15 static & serverless routes compiled |
| `node scripts/aws-agent-cli.mjs status` | AWS Cloud Health | STS Identity, S3 Bucket, Bedrock Models |
| `node scripts/aws-agent-cli.mjs bedrock` | Bedrock Inference | Invokes Nova Micro with live prompt |
| `npm run test:services` | Neon Postgres | Latency, DDL provisioning, and pool health |

---

## 🔒 Security & Defense-in-Depth

- **Egress IMDS Blocker:** All headless Chromium contexts block requests to `169.254.169.254` (AWS IMDSv2) and `metadata.google.internal`, preventing SSRF credential theft.
- **Circuit Breaker Architecture:** In-memory health cache probes external ML endpoints with a 300ms probe. Offline services fail fast (0ms) into local mathematical heuristics with zero timeout blocking.
- **Cryptographic Causal Certificates:** Counterfactual accessibility repairs produce a SHA-256 digital signature certifying that the barrier was eliminated without introducing regressions.
- **Build-Safe DB Proxies:** Database connections are evaluated through lazy proxies so secret masking (`[SENSITIVE]`) during preview builds never crashes CI/CD compilation.

---

## 📄 License & Attribution

Internal Proprietary / Open Access — Aaditya Uniyal. All rights reserved.
