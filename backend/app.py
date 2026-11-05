"""
BarrierLens Unified Python Backend Server
Integrates all modular feature packages:
- core (Config, Reactive EventBus, Strands Coordinator)
- inspector (InspectorAgent, TarjanFocusGraph, ReadingOrderAnalyzer, AnnouncementGapDetector)
- remedy (CausalCritic, AstSynthesizer, ReplayVerifier)
- genome (GenomeVectorizer, PgvectorStore)
- arena (MetamorphicFuzzer)
- vault (RbacValidator, ApiKeyManager, WebhookSigner)
"""

import os
import sys
import json
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from pathlib import Path
from typing import Optional, List, Dict, Any

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import modular feature packages
from core.config import CoreConfig
from core.event_bus import event_bus
from inspector.agent import InspectorAgent
from remedy.replay_verifier import ReplayVerifier
from genome.vectorizer import GenomeVectorizer
from genome.pgvector_store import PgvectorStore
from arena.metamorphic_fuzzer import MetamorphicFuzzer
from vault.api_keys import ApiKeyManager
from vault.webhooks import WebhookSigner


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class BarrierLensHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def _send_json(self, status_code: int, data: Dict[str, Any]):
        response_bytes = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/health", "/api/status", "/"):
            self._send_json(200, {
                "status": "operational",
                "service": "BarrierLens Unified Modular Python Backend",
                "version": "2.1.0",
                "architecture": "Modular iOS App Feature Packages",
                "packages": ["core", "inspector", "remedy", "genome", "arena", "vault"],
                "awsBedrockConfigured": CoreConfig.is_aws_configured(),
                "neonPostgresConfigured": CoreConfig.is_neon_configured(),
                "region": CoreConfig.BEDROCK_REGION,
                "models": {
                    "planning": CoreConfig.MODEL_PLANNING,
                    "routine": CoreConfig.MODEL_ROUTINE
                }
            })
        else:
            self._send_json(404, {"error": "Not Found", "path": path})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_len = int(self.headers.get("Content-Length", 0))
        body = {}
        if content_len > 0:
            try:
                raw_body = self.rfile.read(content_len).decode("utf-8")
                body = json.loads(raw_body)
            except Exception as e:
                self._send_json(400, {"error": "Invalid JSON body", "detail": str(e)})
                return

        # 1. Inspector / Strands Swarm Execution
        if path in ("/api/strands/run", "/api/audit/run", "/api/inspector/run"):
            target_url = body.get("targetUrl", "http://localhost:3000/benchmark")
            goal = body.get("goal", "Complete primary interaction flow using only keyboard")
            persona = body.get("persona", "keyboard")
            max_steps = int(body.get("maxSteps", 8))

            try:
                agent = InspectorAgent()
                result = agent.run_audit(
                    target_url=target_url,
                    goal=goal,
                    persona=persona,
                    max_steps=max_steps
                )
                self._send_json(200, {"success": True, **result})
            except Exception as e:
                self._send_json(500, {"error": "Inspector Agent audit failed", "detail": str(e)})

        # 2. Remedy / Sandbox Replay Verifier
        elif path in ("/api/repair/verify", "/api/remedy/verify"):
            target_url = body.get("targetUrl", "http://localhost:3000/benchmark")
            finding_kind = body.get("findingKind", "keyboard_trap")
            patch_snippet = body.get("patch", 'role="dialog" aria-modal="true"')
            trace_keys = body.get("traceKeys", ["Tab", "Tab", "Tab"])

            try:
                verifier = ReplayVerifier()
                result = verifier.verify_patch(
                    target_url=target_url,
                    finding_kind=finding_kind,
                    patch_snippet=patch_snippet,
                    trace_keys=trace_keys
                )
                self._send_json(200, {"success": True, **result})
            except Exception as e:
                self._send_json(500, {"error": "Remedy replay failed", "detail": str(e)})

        # 3. Arena / Adversarial Stress Fuzzer
        elif path in ("/api/arena/stress", "/api/stress/run"):
            target_url = body.get("targetUrl", "http://localhost:3000/benchmark")
            iterations = int(body.get("iterations", 5))

            try:
                fuzzer = MetamorphicFuzzer()
                result = fuzzer.run_stress_suite(target_url=target_url, iterations=iterations)
                self._send_json(200, {"success": True, **result})
            except Exception as e:
                self._send_json(500, {"error": "Arena fuzzer failed", "detail": str(e)})

        # 4. Vault / Scoped API Key Generator
        elif path in ("/api/vault/keys/generate", "/api/keys/generate"):
            key_name = body.get("name", "CI/CD Pipeline Runner")
            scope = body.get("scope", "audit:run, pr:create")

            try:
                raw_key, prefix, key_hash = ApiKeyManager.generate_api_key(name=key_name, scope=scope)
                self._send_json(200, {
                    "success": True,
                    "apiKey": raw_key,
                    "prefix": prefix,
                    "keyHash": key_hash,
                    "scope": scope
                })
            except Exception as e:
                self._send_json(500, {"error": "API Key generation failed", "detail": str(e)})

        else:
            self._send_json(404, {"error": "Not Found", "path": path})


def run_server(host: str = CoreConfig.HOST, port: int = CoreConfig.PORT):
    server = ThreadingHTTPServer((host, port), BarrierLensHandler)
    print(f"[BarrierLens Unified Backend] Serving at http://{host}:{port}")
    print(f"[BarrierLens Unified Backend] Health check: http://{host}:{port}/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[BarrierLens] Shutting down backend...")
        server.server_close()


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    run_server(host=host, port=port)
