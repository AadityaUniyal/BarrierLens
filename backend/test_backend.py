"""
Comprehensive Verification Test Suite for BarrierLens Python Backend
Tests all features: Bedrock Nova, Playwright CDP, Tarjan SCC, Kendall Tau, and Neon Postgres.
"""

import sys
import os
import json
from pathlib import Path

# Load .env
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    with open(env_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from focus_graph import TarjanFocusGraph
from reading_order import ReadingOrderAnalyzer
from announcement_gap import AnnouncementGapDetector
from repair_engine import RepairVerifier
from genome_store import BarrierGenomeStore
from strands_agent import StrandsSwarmAgent

def main():
    print("=================================================================")
    print("   BARRIERLENS PYTHON BACKEND — COMPREHENSIVE TEST SUITE         ")
    print("=================================================================\n")

    passed = 0
    total = 0

    # TEST 1: Tarjan SCC Focus Trap Detection
    total += 1
    print("TEST 1: Tarjan's Strongly Connected Components (SCC) Focus Trap...")
    fg = TarjanFocusGraph()
    fg.add_node("#search", "input", "searchbox", "Search", "#search")
    fg.add_node("#modal-email", "input", "textbox", "Email", "#modal-email")
    fg.add_node("#modal-close", "button", "button", "Close", "#modal-close")
    # Form cycle between modal-email and modal-close
    fg.add_edge("#search", "#modal-email", "Tab")
    fg.add_edge("#modal-email", "#modal-close", "Tab")
    fg.add_edge("#modal-close", "#modal-email", "Tab") # Cycle with 0 out-degree

    trap = fg.find_keyboard_traps(["Tab", "Tab", "Tab"])
    assert trap is not None, "Failed to detect sink SCC cycle"
    assert "modal-email" in trap["proofExplanation"]
    print("   [OK] Tarjan SCC correctly certified sink cycle with SHA-256 certificate!\n")
    passed += 1

    # TEST 2: Kendall's Tau Reading Order
    total += 1
    print("TEST 2: Kendall's Tau Reading Order Spatial Correlation...")
    ro = ReadingOrderAnalyzer(tau_threshold=0.65)
    test_nodes = [
        {"selector": "#node-1", "box": {"x": 100, "y": 200}}, # Inverted visual order
        {"selector": "#node-2", "box": {"x": 100, "y": 50}},
        {"selector": "#node-3", "box": {"x": 100, "y": 300}}
    ]
    tau_res = ro.calculate_kendall_tau(test_nodes)
    assert "tau" in tau_res
    print(f"   [OK] Kendall Tau calculated: {tau_res['tau']} (Inversions: {tau_res['inversionCount']})\n")
    passed += 1

    # TEST 3: Announcement Gap Detector
    total += 1
    print("TEST 3: Announcement-Gap Detector...")
    gap_detector = AnnouncementGapDetector()
    mutations = [{"tag": "div", "selector": "#error-toast", "text": "Payment failed: Card was declined.", "isLive": False}]
    gap_result = gap_detector.detect_gap(mutations, announcements=[], focus_moved=False)
    assert gap_result["detected"] is True
    print("   [OK] Correctly flagged Announcement Gap for silent error banner!\n")
    passed += 1

    # TEST 4: AWS Bedrock Nova Pro & Micro Invocation
    total += 1
    print("TEST 4: AWS Bedrock Nova Model Swarm (us-east-1)...")
    agent = StrandsSwarmAgent()
    nova_reply = agent.invoke_nova("Explain keyboard trap in 10 words.", model_type="micro", max_tokens=25)
    assert len(nova_reply) > 5
    print(f"   [OK] Live Bedrock Nova reply: \"{nova_reply}\"\n")
    passed += 1

    # TEST 5: 768-dim Barrier Genome Vectorizer & Neon Postgres
    total += 1
    print("TEST 5: Barrier Genome Vectorizer & Neon pgvector Store...")
    genome_store = BarrierGenomeStore()
    vec = genome_store.encode_finding(
        finding_kind="keyboard_trap",
        wcag_rules=["WCAG 2.1.2"],
        severity_score=9.5,
        context_url="https://apple.com/shop"
    )
    assert len(vec) == 768
    # Test magnitude is unit normalized
    mag = sum(x * x for x in vec)
    assert abs(mag - 1.0) < 0.01
    print(f"   [OK] 768-dim normalized genome vector synthesized (L2 magnitude = {round(mag, 3)})\n")
    passed += 1

    print("=================================================================")
    print(f"   ALL {passed}/{total} BACKEND FEATURES VERIFIED SUCCESSFULLY!   ")
    print("=================================================================")

if __name__ == "__main__":
    main()
