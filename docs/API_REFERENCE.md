# BarrierLens AI API Reference

All routes are deployed serverlessly on Next.js 15 and hosted at `https://barrierlens-ai.vercel.app`.

---

## 1. Core Audit & Discovery Endpoints

### `POST /api/audit/run`
Initiates a single-page or multi-page accessibility audit.
- **Request Body**:
  ```json
  {
    "url": "https://example.com",
    "mode": "standard" | "adversarial" | "causal",
    "journeyId": "optional-uuid"
  }
  ```
- **Response**: Returns run configuration, initial status, and stream URL.

### `GET /api/audit/stream?runId={id}`
SSE (Server-Sent Events) live log stream for active audit runs. Emits step-by-step agent actions, DOM discoveries, visual affordance ratings, and synthesized fixes.

### `POST /api/audit/swarm`
Orchestrates a parallel multi-agent swarm audit across deep site hierarchies using cooperative agent strands.

### `POST /api/crawler/discover`
Discovers all reachable internal routes, interactive journey entry points, and forms on a target domain without exceeding configured crawl budgets.

---

## 2. Intelligence, Counterfactuals & Repair

### `POST /api/repair/patch`
Synthesizes a minimal-invasiveness remediation code patch for a specific barrier using live foundation model reasoning.
- **Request Body**:
  ```json
  {
    "elementHtml": "<button class='btn'>Submit</button>",
    "barrierType": "MISSING_ACC_NAME",
    "wcagCriterion": "4.1.2"
  }
  ```
- **Response**:
  ```json
  {
    "patch": "<button class='btn' aria-label='Submit form'>Submit</button>",
    "strategy": "ARIA_ATTRIBUTE_INJECTION",
    "confidence": 0.98
  }
  ```

### `POST /api/repair/verify`
Runs counterfactual do-calculus verification on a candidate patch to mathematically confirm barrier resolution with zero regressions.

### `POST /api/genome`
Vectorizes barrier signatures into 768-dimensional normalized embeddings for cross-site transfer learning and similarity clustering.

---

## 3. Adversarial & Integration Endpoints

### `POST /api/adversarial/run`
Applies Chaos Injector conditions (motor tremors, high-contrast mode, 320px viewport reflow, 3G throttle) to discover hidden dynamic accessibility barriers.

### `POST /api/integrations/github/pr`
Automates GitHub Pull Request creation containing signed counterfactual verification certificates and verified code patches.

### `GET /api/aws/status`
Verifies live AWS Bedrock Nova Micro foundation model connectivity and credentials.
