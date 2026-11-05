"""
BarrierLens Autonomous Physical Task Auditor (Inspector)
Powered by Playwright CDP, NetworkX Tarjan SCC, Scipy Kendall's Tau, and AWS Bedrock Nova.
"""

import os
import time
import uuid
from typing import List, Dict, Any, Optional
from playwright.sync_api import sync_playwright

from core.config import CoreConfig
from core.event_bus import event_bus
from core.strands_coordinator import StrandsCoordinator
from inspector.focus_graph import TarjanFocusGraph
from inspector.reading_order import ReadingOrderAnalyzer
from inspector.announcement_gap import AnnouncementGapDetector

class InspectorAgent:
    def __init__(self):
        self.coordinator = StrandsCoordinator()
        self.focus_graph = TarjanFocusGraph()
        self.reading_order = ReadingOrderAnalyzer()
        self.gap_detector = AnnouncementGapDetector()

    def run_audit(
        self,
        target_url: str,
        goal: str = "Complete primary interaction flow using only keyboard",
        persona: str = "keyboard",
        max_steps: int = 8,
        on_step_callback: Optional[Any] = None
    ) -> Dict[str, Any]:
        run_id = str(uuid.uuid4())
        started_at = time.time()
        steps: List[Dict[str, Any]] = []
        findings: List[Dict[str, Any]] = []
        key_history: List[str] = []
        tokens_used = 0

        # Strand 1: Milestone Planner with Amazon Nova Pro
        planner_prompt = f"Goal: '{goal}' on target '{target_url}'. Provide 3 sequential verification milestones for a {persona} user."
        milestones_text = self.coordinator.invoke_nova(planner_prompt, model_type="pro", max_tokens=100)
        tokens_used += 120

        # Publish initial plan event
        event_bus.publish("audit_started", {
            "runId": run_id,
            "targetUrl": target_url,
            "goal": goal,
            "milestones": milestones_text
        })

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})

            # Navigate to target
            try:
                page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(800)
                page_title = page.title() or "Target Application"
            except Exception as e:
                browser.close()
                raise RuntimeError(f"Failed to navigate to target '{target_url}': {str(e)}")

            # Extract initial interactive elements for Set-of-Marks visual grounding
            raw_elements = page.evaluate("""() => {
                const els = Array.from(document.querySelectorAll('button, a, input, select, textarea, [tabindex="0"], [role="button"], [role="dialog"]'));
                return els.slice(0, 30).map((el, idx) => {
                    const r = el.getBoundingClientRect();
                    return {
                        id: el.id || ('el-' + idx),
                        tagName: el.tagName.toLowerCase(),
                        role: el.getAttribute('role') || el.tagName.toLowerCase(),
                        accessibleName: el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || '',
                        selector: el.id ? '#' + el.id : (el.className ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()),
                        box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
                    };
                });
            }""")

            # Register nodes in Focus Graph
            for el in raw_elements:
                self.focus_graph.add_node(
                    node_id=el["selector"],
                    tag_name=el["tagName"],
                    role=el["role"],
                    accessible_name=el["accessibleName"],
                    selector=el["selector"],
                    box=el["box"]
                )

            # Strand 2: Reading Order Analysis (Kendall's Tau)
            kendall_result = self.reading_order.calculate_kendall_tau(raw_elements)
            if not kendall_result["isAcceptable"]:
                findings.append({
                    "id": str(uuid.uuid4()),
                    "kind": "low_kendall_tau",
                    "trustTier": "proven",
                    "title": f"Disorienting Reading Order (Kendall \u03c4 = {kendall_result['tau']})",
                    "summary": kendall_result["explanation"],
                    "wcagRules": ["WCAG 1.3.2 Meaningful Sequence", "WCAG 2.4.3 Focus Order"],
                    "severity": "high",
                    "severityScore": 7.5,
                    "evidence": kendall_result
                })

            # Strand 3: Autonomous Physical Navigation Loop
            prev_active = ""
            for step_idx in range(1, max_steps + 1):
                key_to_press = "Tab" if step_idx < max_steps - 1 else "Enter"
                page.keyboard.press(key_to_press)
                key_history.append(key_to_press)
                page.wait_for_timeout(300)

                current_active = page.evaluate("""() => {
                    const el = document.activeElement;
                    if (!el || el === document.body) return 'body';
                    return el.id ? '#' + el.id : el.tagName.toLowerCase();
                }""")

                if prev_active and current_active and prev_active != current_active:
                    self.focus_graph.add_edge(prev_active, current_active, key=key_to_press)

                step_record = {
                    "idx": step_idx,
                    "persona": persona,
                    "actionType": "press_key",
                    "key": key_to_press,
                    "activeElementBefore": prev_active,
                    "activeElementAfter": current_active,
                    "timestamp": time.time()
                }
                steps.append(step_record)

                # Broadcast step event to EventBus
                event_bus.publish("step_executed", step_record)
                if on_step_callback:
                    on_step_callback(step_record)

                prev_active = current_active

                # Strand 4: Tarjan SCC Keyboard Trap Verification
                trap_cert = self.focus_graph.find_keyboard_traps(key_history)
                if trap_cert and not any(f["kind"] == "keyboard_trap" for f in findings):
                    finding_record = {
                        "id": str(uuid.uuid4()),
                        "kind": "keyboard_trap",
                        "trustTier": "proven",
                        "title": "Deterministic Keyboard Trap Detected",
                        "summary": trap_cert["proofExplanation"],
                        "wcagRules": ["WCAG 2.1.2 No Keyboard Trap (Level A)"],
                        "severity": "critical",
                        "severityScore": 9.8,
                        "certificate": trap_cert,
                        "evidence": trap_cert
                    }
                    findings.append(finding_record)
                    event_bus.publish("trap_certified", finding_record)

            browser.close()

        effort_ratio = round(len(steps) / 1.0, 1)

        result_payload = {
            "runId": run_id,
            "targetUrl": target_url,
            "pageTitle": page_title,
            "goal": goal,
            "persona": persona,
            "milestonesPlan": milestones_text,
            "effortRatio": effort_ratio,
            "taskSuccess": len(findings) == 0,
            "steps": steps,
            "findings": findings,
            "kendallTau": kendall_result,
            "tokensUsed": tokens_used,
            "durationSec": round(time.time() - started_at, 2)
        }

        event_bus.publish("audit_completed", result_payload)
        return result_payload
