"""
BarrierLens Unified Python Backend Server (FastAPI + CUDA Inference + LightGBM Ranker)
Integrates:
- core (Config, Reactive EventBus, Strands Coordinator)
- inspector (InspectorAgent, TarjanFocusGraph, ReadingOrderAnalyzer, AnnouncementGapDetector)
- remedy (CausalCritic, AstSynthesizer, ReplayVerifier)
- genome (GenomeVectorizer, PgvectorStore)
- arena (MetamorphicFuzzer)
- vault (RbacValidator, ApiKeyManager, WebhookSigner)
- ml.gpu_inference (CUDA MiniLM, CLIP, MAPIE Conformal Intervals)
- ml.action_ranker (LightGBM Tier 1 Action Ranker)
"""

import os
import sys
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import CoreConfig
from inspector.agent import InspectorAgent
from remedy.replay_verifier import ReplayVerifier
from arena.metamorphic_fuzzer import MetamorphicFuzzer
from vault.api_keys import ApiKeyManager
from vault.webhooks import WebhookSigner, WebhookDispatcher
from ml.gpu_inference import GPUInferenceEngine
from ml.action_ranker import LightGBMActionRanker

app = FastAPI(
    title="BarrierLens GPU-Accelerated Backend",
    version="2.6.0",
    description="Unified API for Behavioral Accessibility Agent, GPU Models, and LightGBM Ranker"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gpu_engine = GPUInferenceEngine()
action_ranker = LightGBMActionRanker()


# ----------------- Request Models -----------------

class AuditRunRequest(BaseModel):
    targetUrl: str = "http://localhost:3000/benchmark"
    goal: str = "Complete primary interaction flow using only keyboard"
    persona: str = "keyboard"
    maxSteps: int = 8

class ReplayVerifyRequest(BaseModel):
    targetUrl: str = "http://localhost:3000/benchmark"
    findingKind: str = "keyboard_trap"
    patch: str = 'role="dialog" aria-modal="true"'
    traceKeys: List[str] = ["Tab", "Tab", "Tab"]

class StressRunRequest(BaseModel):
    targetUrl: str = "http://localhost:3000/benchmark"
    iterations: int = 5

class ApiKeyGenerateRequest(BaseModel):
    name: str = "CI/CD Pipeline Runner"
    scope: str = "audit:run, pr:create"

class GenomeEmbedRequest(BaseModel):
    text: str

class LabelQualityRequest(BaseModel):
    role: str
    name: str
    surroundingText: Optional[str] = ""

class VisualAffordanceRequest(BaseModel):
    screenshot_b64: str
    accessible_name: str
    candidate_labels: Optional[List[str]] = None

class ConformalCalibrateRequest(BaseModel):
    kind: str
    persona: str
    blocks_task: bool
    step_index: int
    point_estimate: float
    calibration_data: Optional[List[Dict[str, float]]] = None

class ActionRankRequest(BaseModel):
    goal: str
    nodes: List[Dict[str, Any]]
    currentFocusSelector: Optional[str] = ""
    history: Optional[List[str]] = None

class WebhookDispatchRequest(BaseModel):
    webhookUrl: str
    secret: Optional[str] = "barrierlens-default-secret"
    eventType: str = "audit.completed"
    data: Dict[str, Any]


# ----------------- Endpoints -----------------

@app.get("/health")
@app.get("/api/status")
@app.get("/")
async def health_check():
    gpu_stats = gpu_engine.get_gpu_stats()
    return {
        "status": "operational",
        "service": "BarrierLens Unified Modular Python Backend",
        "version": "2.6.0",
        "gpu": gpu_stats,
        "awsBedrockConfigured": CoreConfig.is_aws_configured(),
        "neonPostgresConfigured": CoreConfig.is_neon_configured(),
        "models": {
            "planning": CoreConfig.MODEL_PLANNING,
            "routine": CoreConfig.MODEL_ROUTINE,
            "embedding": "all-MiniLM-L6-v2 (CUDA)",
            "vision": "CLIP ViT-B/32 (CUDA)",
            "actionRanker": "LightGBM LambdaMART"
        }
    }

# 1. Inspector / Swarm Execution
@app.post("/api/strands/run")
@app.post("/api/audit/run")
@app.post("/api/inspector/run")
async def run_inspector(req: AuditRunRequest):
    try:
        loop = asyncio.get_event_loop()
        agent = InspectorAgent()
        result = await loop.run_in_executor(
            None,
            lambda: agent.run_audit(
                target_url=req.targetUrl,
                goal=req.goal,
                persona=req.persona,
                max_steps=req.maxSteps
            )
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspector Agent audit failed: {str(e)}")

# 2. Remedy / Replay Verifier
@app.post("/api/repair/verify")
@app.post("/api/remedy/verify")
async def run_repair_verify(req: ReplayVerifyRequest):
    try:
        loop = asyncio.get_event_loop()
        verifier = ReplayVerifier()
        result = await loop.run_in_executor(
            None,
            lambda: verifier.verify_patch(
                target_url=req.targetUrl,
                finding_kind=req.findingKind,
                patch_snippet=req.patch,
                trace_keys=req.traceKeys
            )
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Remedy replay failed: {str(e)}")

# 3. Arena / Metamorphic Stress Fuzzer
@app.post("/api/arena/stress")
@app.post("/api/stress/run")
async def run_stress_suite(req: StressRunRequest):
    try:
        loop = asyncio.get_event_loop()
        fuzzer = MetamorphicFuzzer()
        result = await loop.run_in_executor(
            None,
            lambda: fuzzer.run_stress_suite(
                target_url=req.targetUrl,
                iterations=req.iterations
            )
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arena fuzzer failed: {str(e)}")

# 4. Vault / Scoped API Key Generator
@app.post("/api/vault/keys/generate")
@app.post("/api/keys/generate")
async def generate_api_key(req: ApiKeyGenerateRequest):
    try:
        raw_key, prefix, key_hash = ApiKeyManager.generate_api_key(name=req.name, scope=req.scope)
        return {
            "success": True,
            "apiKey": raw_key,
            "prefix": prefix,
            "keyHash": key_hash,
            "scope": req.scope
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Key generation failed: {str(e)}")

# 5. GPU ML: Text & Genome Embedding
@app.post("/api/genome/embed")
async def embed_genome_text(req: GenomeEmbedRequest):
    try:
        loop = asyncio.get_event_loop()
        vector = await loop.run_in_executor(None, lambda: gpu_engine.encode_text(req.text))
        return {
            "vector": vector,
            "dims": len(vector),
            "device": str(gpu_engine.device)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Genome embedding failed: {str(e)}")

# 6. GPU ML: Label Quality Semantic Analysis
@app.post("/api/ml/label-quality")
async def evaluate_label_quality(req: LabelQualityRequest):
    try:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: gpu_engine.classify_label_quality(
                role=req.role,
                name=req.name,
                surrounding_text=req.surroundingText or ""
            )
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Label quality inference failed: {str(e)}")

# 7. GPU ML: CLIP Visual Affordance Checking
@app.post("/api/ml/visual-affordance")
async def evaluate_visual_affordance(req: VisualAffordanceRequest):
    try:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: gpu_engine.classify_visual_affordance(
                screenshot_b64=req.screenshot_b64,
                accessible_name=req.accessible_name,
                candidate_labels=req.candidate_labels or []
            )
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visual affordance inference failed: {str(e)}")

# 8. Conformal Impact Calibration
@app.post("/api/impact/calibrate")
async def calibrate_impact(req: ConformalCalibrateRequest):
    try:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: gpu_engine.calibrate_conformal_impact(
                kind=req.kind,
                persona=req.persona,
                blocks_task=req.blocks_task,
                step_index=req.step_index,
                point_estimate=req.point_estimate,
                calibration_data=req.calibration_data
            )
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conformal calibration failed: {str(e)}")

# 9. LightGBM Action Ranker (M3 Tier 1 Inference)
@app.post("/api/ml/rank-action")
async def rank_action_candidates(req: ActionRankRequest):
    try:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: action_ranker.rank_candidates(
                goal=req.goal,
                nodes=req.nodes,
                current_focus_selector=req.currentFocusSelector or "",
                history=req.history
            )
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action ranking failed: {str(e)}")


# 10. Vault: Webhook Signature and Dispatch
@app.post("/api/vault/webhooks/dispatch")
async def dispatch_webhook_event(req: WebhookDispatchRequest):
    try:
        res = await WebhookDispatcher.dispatch(
            url=req.webhookUrl,
            secret=req.secret or "barrierlens-default-secret",
            event_type=req.eventType,
            data=req.data
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook dispatch failed: {str(e)}")


def run_server(host: str = CoreConfig.HOST, port: int = CoreConfig.PORT):
    print(f"[BarrierLens FastAPI GPU Backend] Serving at http://{host}:{port}")
    uvicorn.run(app, host=host, port=port, workers=1, log_level="info")

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    run_server(host=host, port=port)
