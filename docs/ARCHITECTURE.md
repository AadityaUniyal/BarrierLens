# BarrierLens AI Architecture & Engineering Specification

## 1. Executive System Overview

BarrierLens AI is a multi-agent, autonomous accessibility auditing and self-healing intelligence platform. Unlike traditional rule-based scanners (which catch only 30–40% of WCAG defects and suffer from high false-positive rates), BarrierLens executes **deterministic graph analysis**, **causal counterfactual verification**, and **multimodal SLM reasoning** to detect, prove, and synthesize pull requests for complex accessibility failures.

```
                           +----------------------------------------+
                           |           User / CI Trigger            |
                           +-------------------+--------------------+
                                               |
                                               v
                           +----------------------------------------+
                           |         Next.js App Router API         |
                           |       (/api/audit/run, SSE Stream)     |
                           +-------------------+--------------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
    +---------------------------------+                 +---------------------------------+
    |   Deterministic Analysis Mesh   |                 |     Multimodal LLM / SLM        |
    |  - Tarjan Focus Graph (SCCs)    |                 |  - AWS Bedrock Nova Micro       |
    |  - Kendall's Tau DOM vs Visual  |                 |  - Groq LLaMA-3.3 70B (Fast)    |
    |  - WCAG 2.2 APCA Contrast       |                 |  - 0ms Circuit Breaker Fallback |
    +----------------+----------------+                 +----------------+----------------+
                     |                                                   |
                     +-------------------------+-------------------------+
                                               |
                                               v
                           +----------------------------------------+
                           |        Causal Counterfactual Engine    |
                           |   (Do-Calculus Interventions & Patch)  |
                           +-------------------+--------------------+
                                               |
                                               v
                           +----------------------------------------+
                           |       Cryptographic Certification      |
                           |  (SHA-256 Barrier Signature + PR Diff) |
                           +----------------------------------------+
```

---

## 2. Core Algorithmic Differentiators

### A. Graph-Theoretic Focus Traps (Tarjan's SCC Algorithm)
- **Problem**: Keyboard focus traps occur when interactive elements cycle focus indefinitely without an escape path to the document root.
- **Solution**: The DOM tab order is modeled as a directed graph $G = (V, E)$, where $V$ represents focusable nodes and $E$ represents Tab/Shift+Tab transitions.
- **Implementation**: `lib/barrierlens/agent/focus-graph.ts` executes Tarjan's Strongly Connected Components (SCC) algorithm. Any terminal SCC without an edge returning to an ancestor outside the component is deterministically flagged as a keyboard trap with zero heuristic guesswork.

### B. Visual vs. DOM Reading Disordering (Kendall's Tau Correlation)
- **Problem**: Screen readers navigate in DOM order, whereas sighted keyboard users navigate based on spatial 2D layout. Discrepancies cause disorientation for screen reader users and low-vision individuals.
- **Solution**: `lib/barrierlens/agent/layout-engine.ts` calculates the Kendall's Tau ($\tau$) rank correlation coefficient between DOM sequence order and visual reading coordinates $(Y, X)$:
  $$\tau = \frac{P - Q}{\frac{1}{2} n (n - 1)}$$
  Where $P$ is concordant pairs, $Q$ is discordant pairs, and $n$ is total interactive elements. Any threshold drop below $0.70$ flags an actionable Disordered Tab Traversal violation.

### C. Live Dual-Tier Model Routing with 0ms Circuit Breaker
- **Tier 1 (Fast Deterministic)**: 100% in-process TypeScript heuristics and graph solvers (`<5ms`).
- **Tier 2 (Synthetic Reasoning & Repair)**:
  - **AWS Bedrock Nova Micro** (`amazon.nova-micro-v1:0` in `us-east-1`): Generates surgical JSX/HTML remediation patches.
  - **Groq LLaMA-3.3 70B**: High-throughput cognitive deduction and audit intent framing.
- **Resilience**: `BackendCircuitBreaker` maintains a 20s health cache. If the local Python/CUDA server or cloud gateway is unreachable, it fails fast in **0ms**, preventing request timeouts across serverless edge lambdas.

### D. Structural Causal Model (SCM) & Counterfactual Verification
- **Framework**: Pearl's do-calculus framework applied to accessibility remediation.
- **Mechanism**:
  1. Construct a causal graph connecting CSS attributes, DOM structure, and accessibility outcomes.
  2. Perform an intervention $do(X = x^*)$ (e.g., adding `aria-expanded="true"`, removing `overflow: hidden`).
  3. Verify that the target barrier vanishes while maintaining non-violation invariants across all surrounding elements.
  4. Generate a signed cryptographic certificate guaranteeing zero regressions.

---

## 3. Data Store & Edge Architecture

- **PostgreSQL**: Neon Serverless Postgres with pgvector for 768-dimensional Barrier Genome embeddings.
- **Connection Pool**: Lazy connection proxy prevents static build crashes on Vercel preview environments where connection strings are masked.
- **Real-Time Streaming**: Server-Sent Events (SSE) via `app/api/audit/stream/route.ts` with strict 60s maxDuration budgeting and sub-step heartbeats.
