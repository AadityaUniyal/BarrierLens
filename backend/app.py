"""
BarrierLens Python Backend API
Ultra-resilient multi-agent accessibility engine:
- AWS Strands Swarm with Amazon Nova Bedrock models (Nova Pro & Nova Micro)
- NetworkX Tarjan SCC Focus Trapping & Scipy Kendall's Tau Reading Order
- Surgical AST Repair Verifier with Playwright Headless Replay
- Neon Postgres pgvector Integration
- Zero external C-extension dependencies (pure Python HTTP server, bypasses Windows AppLocker)
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

# Load environment variables from .env
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    with open(env_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

# Import Python Strands Swarm engines
from strands_agent import StrandsSwarmAgent
from repair_engine import RepairVerifier
from genome_store import BarrierGenomeStore


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
            has_aws = bool(os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY"))
            has_neon = bool(os.environ.get("DATABASE_URL"))
            self._send_json(200, {
                "status": "operational",
                "service": "BarrierLens Python Backend",
                "version": "2.0.0",
                "engine": "AWS Strands Agents + Playwright CDP + NetworkX Tarjan SCC",
                "awsBedrockConfigured": has_aws,
                "neonPostgresConfigured": has_neon,
                "region": os.environ.get("BEDROCK_REGION", "us-east-1"),
                "models": {
                    "planning": "amazon.nova-pro-v1:0",
                    "routine": "amazon.nova-micro-v1:0"
                }
            })
        else:
            self._send_json(404, {"error": "Not Found", "path": path})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Read JSON body
        content_len = int(self.headers.get("Content-Length", 0))
        body = {}
        if content_len > 0:
            try:
                raw_body = self.rfile.read(content_len).decode("utf-8")
                body = json.loads(raw_body)
            except Exception as e:
                self._send_json(400, {"error": "Invalid JSON body", "detail": str(e)})
                return

        if path in ("/api/strands/run", "/api/audit/run"):
            target_url = body.get("targetUrl", "http://localhost:3000/benchmark")
            goal = body.get("goal", "Complete primary interaction flow using only keyboard")
            persona = body.get("persona", "keyboard")
            max_steps = int(body.get("maxSteps", 8))

            try:
                agent = StrandsSwarmAgent()
                result = agent.run_swarm_audit(
                    target_url=target_url,
                    goal=goal,
                    persona=persona,
                    max_steps=max_steps
                )
                self._send_json(200, {"success": True, **result})
            except Exception as e:
                self._send_json(500, {"error": "Strands Swarm failed", "detail": str(e)})

        elif path in ("/api/repair/verify", "/api/repair"):
            target_url = body.get("targetUrl", "http://localhost:3000/benchmark")
            finding_kind = body.get("findingKind", "keyboard_trap")
            patch_snippet = body.get("patch", 'role="dialog" aria-modal="true"')
            trace_keys = body.get("traceKeys", ["Tab", "Tab", "Tab"])

            try:
                verifier = RepairVerifier()
                result = verifier.verify_patch(
                    target_url=target_url,
                    finding_kind=finding_kind,
                    patch_snippet=patch_snippet,
                    trace_keys=trace_keys
                )
                self._send_json(200, {"success": True, **result})
            except Exception as e:
                self._send_json(500, {"error": "Repair verification failed", "detail": str(e)})

        else:
            self._send_json(404, {"error": "Not Found", "path": path})


def run_server(host: str = "127.0.0.1", port: int = 8000):
    server = ThreadingHTTPServer((host, port), BarrierLensHandler)
    print(f"[BarrierLens Python Backend] Serving at http://{host}:{port}")
    print(f"[BarrierLens Python Backend] Health check: http://{host}:{port}/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[BarrierLens] Shutting down backend...")
        server.server_close()


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    run_server(host=host, port=port)
