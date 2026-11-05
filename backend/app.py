"""
BarrierLens Python Backend API (FastAPI)
Exposes complete agentic accessibility features:
- AWS Strands Swarm with Amazon Nova Bedrock models
- Tarjan SCC Focus Trapping & Kendall's Tau Reading Order
- Surgical AST Repair Verifier
- Neon Postgres pgvector Integration
"""

import os
import sys
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

# Load environment variables from .env
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    with open(env_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from strands_agent import StrandsSwarmAgent
from repair_engine import RepairVerifier
from genome_store import BarrierGenomeStore

app = FastAPI(
    title="BarrierLens Agentic Accessibility API",
    version="2.0.0",
    description="Python backend powered by AWS Strands Agents, Bedrock Nova, and Playwright."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    targetUrl: str = Field(default="http://localhost:3000/benchmark")
    goal: str = Field(default="Complete signup and modal interaction flow")
    persona: str = Field(default="keyboard")
    maxSteps: int = Field(default=8)

class VerifyRepairRequest(BaseModel):
    targetUrl: str
    findingKind: str = "keyboard_trap"
    patch: str = 'role="dialog" aria-modal="true"'
    traceKeys: Optional[List[str]] = None

@app.get("/health")
@app.get("/api/status")
def health_check():
    has_aws = bool(os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY"))
    has_neon = bool(os.environ.get("DATABASE_URL"))
    return {
        "status": "operational",
        "service": "BarrierLens Python Backend",
        "engine": "AWS Strands Agents + Playwright CDP + NetworkX Tarjan SCC",
        "awsBedrockConfigured": has_aws,
        "neonPostgresConfigured": has_neon,
        "region": os.environ.get("BEDROCK_REGION", "us-east-1"),
        "models": {
            "planning": "amazon.nova-pro-v1:0",
            "routine": "amazon.nova-micro-v1:0"
        }
    }

@app.post("/api/strands/run")
@app.post("/api/audit/run")
def run_strands_audit(req: AuditRequest):
    """Executes full autonomous multi-agent swarm audit on the requested target URL."""
    try:
        agent = StrandsSwarmAgent()
        result = agent.run_swarm_audit(
            target_url=req.targetUrl,
            goal=req.goal,
            persona=req.persona,
            max_steps=req.maxSteps
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/repair/verify")
def verify_repair(req: VerifyRepairRequest):
    """Replays the recorded trace in a headless Chromium sandbox with declarative patch injected."""
    try:
        verifier = RepairVerifier()
        result = verifier.verify_patch(
            target_url=req.targetUrl,
            finding_kind=req.findingKind,
            patch_snippet=req.patch,
            trace_keys=req.traceKeys
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
