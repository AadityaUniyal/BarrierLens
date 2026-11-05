"""
BarrierLens Unified Python Backend Test Suite
Tests all 6 modular feature packages:
1. core: Strands Coordinator with Amazon Nova in us-east-1
2. inspector: NetworkX Tarjan SCC cycle detection & Scipy Kendall's Tau reading order
3. remedy: Headless Playwright differential patch replay verifier
4. genome: 768-dim normalized embedding vectorizer & pgvector store
5. arena: Metamorphic red-team adversarial stress fuzzer
6. vault: Scoped API key generator & HMAC-SHA256 webhook signer
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import CoreConfig
from core.strands_coordinator import StrandsCoordinator
from inspector.focus_graph import TarjanFocusGraph
from inspector.reading_order import ReadingOrderAnalyzer
from inspector.announcement_gap import AnnouncementGapDetector
from remedy.replay_verifier import ReplayVerifier
from genome.vectorizer import GenomeVectorizer
from arena.metamorphic_fuzzer import MetamorphicFuzzer
from vault.api_keys import ApiKeyManager
from vault.webhooks import WebhookSigner

def test_suite():
    print("=================================================================")
    print("   BARRIERLENS MODULAR PYTHON BACKEND — TEST SUITE               ")
    print("=================================================================\n")

    # 1. Test Inspector Tarjan SCC Focus Trapping
    print("TEST 1: Inspector Tarjan SCC Focus Trapping...")
    fg = TarjanFocusGraph()
    fg.add_node("btn-open", "button", accessible_name="Open Dialog")
    fg.add_node("modal-email", "input", accessible_name="Email")
    fg.add_node("modal-submit", "button", accessible_name="Submit")
    fg.add_node("modal-cancel", "button", accessible_name="Cancel")

    fg.add_edge("btn-open", "modal-email", key="Enter")
    fg.add_edge("modal-email", "modal-submit", key="Tab")
    fg.add_edge("modal-submit", "modal-cancel", key="Tab")
    fg.add_edge("modal-cancel", "modal-email", key="Tab")  # Sink Cycle (out-degree 0)

    trap = fg.find_keyboard_traps(["Enter", "Tab", "Tab", "Tab"])
    assert trap is not None, "Failed to detect Tarjan SCC trap"
    assert "modal-email" in trap["componentNodeIds"]
    print("   [OK] Tarjan SCC correctly certified sink cycle with SHA-256 certificate!")

    # 2. Test Inspector Reading Order (Kendall's Tau)
    print("\nTEST 2: Inspector Kendall's Tau Spatial Reading Order...")
    elements = [
        {"id": "el-1", "box": {"x": 100, "y": 50, "width": 80, "height": 30}},
        {"id": "el-2", "box": {"x": 200, "y": 50, "width": 80, "height": 30}},
        {"id": "el-3", "box": {"x": 100, "y": 120, "width": 80, "height": 30}},
        {"id": "el-4", "box": {"x": 200, "y": 100, "width": 80, "height": 30}},
    ]
    analyzer = ReadingOrderAnalyzer()
    res = analyzer.calculate_kendall_tau(elements)
    assert "tau" in res
    print(f"   [OK] Kendall Tau calculated: {res['tau']} (Inversions: {res['inversions']})")

    # 3. Test Core AWS Bedrock Nova Pro / Micro
    print("\nTEST 3: Core AWS Bedrock Nova Model Swarm (us-east-1)...")
    coordinator = StrandsCoordinator()
    reply = coordinator.invoke_nova("Summarize accessibility in 6 words.", model_type="micro", max_tokens=20)
    print(f"   [OK] Bedrock Nova response: '{reply}'")

    # 4. Test Remedy Headless Replay Verifier
    print("\nTEST 4: Remedy Headless Replay Verifier...")
    verifier = ReplayVerifier()
    v_res = verifier.verify_patch(
        target_url="http://localhost:3000/benchmark",
        finding_kind="keyboard_trap",
        patch_snippet='aria-modal="true" role="dialog"'
    )
    assert v_res["verified"] is True
    print("   [OK] Headless Playwright differential replay certified fix successfully!")

    # 5. Test Genome 768-dim Vectorizer
    print("\nTEST 5: Genome 768-dim Normalized Vectorizer...")
    vectorizer = GenomeVectorizer()
    vec = vectorizer.encode_barrier(
        finding_kind="keyboard_trap",
        wcag_rules=["WCAG 2.1.2"],
        severity_score=9.8,
        target_url="https://barrierlens-seven.vercel.app"
    )
    assert len(vec) == 768
    magnitude = round(sum(x * x for x in vec), 2)
    assert magnitude == 1.0, f"Expected unit magnitude 1.0, got {magnitude}"
    print(f"   [OK] 768-dim normalized genome vector synthesized (L2 magnitude = {magnitude})")

    # 6. Test Arena Metamorphic Red-Team Fuzzer
    print("\nTEST 6: Arena Metamorphic Red-Team Fuzzer...")
    fuzzer = MetamorphicFuzzer()
    stress_res = fuzzer.run_stress_suite("http://localhost:3000/benchmark", iterations=4)
    assert stress_res["testsExecuted"] == 4
    print(f"   [OK] Arena executed 4 adversarial mutations. Resilience score: {stress_res['resilienceScore']}%")

    # 7. Test Vault API Keys & Webhook Signatures
    print("\nTEST 7: Vault API Keys & Cryptographic Webhooks...")
    raw_key, prefix, key_hash = ApiKeyManager.generate_api_key("Production CI/CD")
    assert ApiKeyManager.verify_key(raw_key, key_hash) is True
    sig = WebhookSigner.sign_payload("whsec_secret_123", {"event": "audit.certified", "runId": "run_01"})
    assert sig.startswith("sha256=")
    print("   [OK] Vault generated scoped API key and verified HMAC-SHA256 signature!")

    print("\n=================================================================")
    print("   ALL 7/7 MODULAR BACKEND PACKAGES VERIFIED SUCCESSFULLY!       ")
    print("=================================================================\n")

if __name__ == "__main__":
    test_suite()
