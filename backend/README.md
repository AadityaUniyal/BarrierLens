# BarrierLens Python Agentic Backend

The native Python backend powering **BarrierLens 2.0**. Executes autonomous accessibility journeys using **AWS Strands Agents**, **Amazon Bedrock Nova**, **Playwright Chromium CDP**, and **NetworkX Tarjan SCC**.

---

## Architecture & Modules

* **`strands_agent.py`**: AWS Strands multi-agent swarm orchestrator.
  * *Milestone Planner*: Decomposes user tasks into verifiable post-conditions using Amazon Nova Pro.
  * *Physics-Bound Navigator*: Drives physical keyboard traversal via Playwright Chromium CDP.
  * *Tarjan SCC Certifier*: Mathematical graph cycle proof engine.
  * *Causal Critic*: Counterfactual patch synthesis and sandbox replay.
* **`focus_graph.py`**: Directed graph model using NetworkX. Applies Tarjan's Strongly Connected Components algorithm to certify sink cycles (out-degree $= 0$).
* **`reading_order.py`**: Kendall's rank correlation coefficient $\tau$ between visual 2D coordinates and DOM focus order using `scipy.stats.kendalltau`.
* **`announcement_gap.py`**: Intercepts DOM visual mutations (toasts, error banners) and audits corresponding `aria-live` screen reader announcements.
* **`repair_engine.py`**: Closed-loop AST patch synthesis and differential headless replay verifier.
* **`genome_store.py`**: 768-dimensional Barrier Genome vectorizer storing embeddings directly in Neon PostgreSQL.
* **`app.py`**: FastAPI application exposing high-throughput REST and Server-Sent Event (SSE) streaming endpoints.

---

## Running the Backend

### 1. Verify Features & Test Suite
```bash
python backend/test_backend.py
```

### 2. Start the FastAPI Server
```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI docs will be available at:
`http://127.0.0.1:8000/docs`
