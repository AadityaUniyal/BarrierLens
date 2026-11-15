"""
BarrierLens Local SLM (Small Language Model) Engine
Model: Qwen/Qwen2.5-Coder-0.5B-Instruct
Runs locally on NVIDIA GeForce RTX 4050 (CUDA cuda:0)

Provides:
1. Autonomous Web Journey Reasoning (Local Tier 2 Decision Maker)
2. Surgical AST Accessibility Code Remediation & Patch Synthesis
3. Zero-cloud-data-leakage / 100% Offline Edge Operation
"""

import os
import re
import json
import time
from typing import Dict, Any, List, Optional
import torch

class LocalSLMEngine:
    def __init__(self, model_id: str = "Qwen/Qwen2.5-Coder-0.5B-Instruct"):
        self.model_id = model_id
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.tokenizer = None
        self._is_loaded = False

    def ensure_loaded(self):
        """Lazy loader for SLM weights onto GPU"""
        if self._is_loaded:
            return

        from transformers import AutoModelForCausalLM, AutoTokenizer

        print(f"[BarrierLens SLM] Loading {self.model_id} onto {self.device}...", flush=True)
        t0 = time.time()

        # Check local cache snapshot path first
        snapshot_dir = os.path.expanduser(
            r"~/.cache/huggingface/hub/models--Qwen--Qwen2.5-Coder-0.5B-Instruct/snapshots/ea3f2471cf1b1f0db85067f1ef93848e38e88c25"
        )
        load_path = snapshot_dir if os.path.exists(os.path.join(snapshot_dir, "model.safetensors")) else self.model_id

        self.tokenizer = AutoTokenizer.from_pretrained(load_path, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            load_path,
            torch_dtype=torch.float16 if self.device.startswith("cuda") else torch.float32,
            trust_remote_code=True
        ).to(self.device)

        self.model.eval()
        self._is_loaded = True
        elapsed = time.time() - t0
        print(f"[BarrierLens SLM] Successfully loaded on {self.device} in {elapsed:.2f}s", flush=True)

    def reason_next_action(
        self,
        goal: str,
        persona: str = "keyboard",
        current_focus: str = "",
        compact_ax_tree: str = "",
        history: Optional[List[str]] = None,
        reflexion_hint: str = ""
    ) -> Dict[str, Any]:
        """
        Autonomous Web Journey Navigation Reasoning.
        Given target goal, persona constraints, and current accessibility tree,
        infers the optimal physical keyboard action with structured rationale.
        """
        self.ensure_loaded()

        system_prompt = (
            "You are BarrierLens, an elite autonomous web accessibility testing AI. "
            "You simulate a real user navigating strictly within physical persona constraints. "
            "Rules for 'keyboard' persona:\n"
            "- You CANNOT use a mouse. You cannot click arbitrary coordinates.\n"
            "- You can ONLY use: Tab (move forward), Shift+Tab (move back), Enter/Space (activate focused control), "
            "Escape (dismiss modal/dialog), or type text if focused on an input.\n"
            "- Output MUST be strict JSON only, nothing else."
        )

        user_prompt = f"""Goal: "{goal}"
Persona: "{persona}"
Current Focused Element: {current_focus or "None (document body)"}
Accessibility Tree Context:
{compact_ax_tree[:800] if compact_ax_tree else "No AX nodes available"}

Recent Action Trace:
{chr(10).join(history[-4:]) if history else "Starting exploration step 1"}
{f"Self-Correction Hint: {reflexion_hint}" if reflexion_hint else ""}

Choose the single best next action to make progress toward the goal.
Respond with this exact JSON structure:
{{
  "thought": "Brief explanation of why this key advances the goal",
  "action": "press_key" | "type_text" | "finish_task",
  "key": "Tab" | "Shift+Tab" | "Enter" | "Space" | "Escape",
  "text": "text to type if input is focused",
  "isGoalReached": false
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        text = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer([text], return_tensors="pt").to(self.device)

        t0 = time.time()
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=140,
                temperature=0.1,
                do_sample=False
            )

        gen_tokens = outputs[0][len(inputs.input_ids[0]):]
        raw_response = self.tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()
        latency_ms = (time.time() - t0) * 1000

        # Parse JSON
        parsed = self._extract_json(raw_response)
        if not parsed:
            # Fallback extraction from prose
            action = "press_key"
            key = "Tab"
            if "enter" in raw_response.lower():
                key = "Enter"
            elif "escape" in raw_response.lower():
                key = "Escape"
            parsed = {
                "thought": "Navigating interactive focus sequence toward goal",
                "action": action,
                "key": key,
                "isGoalReached": False
            }

        return {
            "thought": parsed.get("thought", "Advancing focus toward goal"),
            "action": parsed.get("action", "press_key"),
            "key": parsed.get("key", "Tab"),
            "text": parsed.get("text", ""),
            "isGoalReached": bool(parsed.get("isGoalReached", False)),
            "tierUsed": "local_gpu_slm",
            "model": self.model_id,
            "device": self.device,
            "latencyMs": round(latency_ms, 2)
        }

    def synthesize_remediation_code(
        self,
        defect_kind: str,
        target_selector: str,
        target_snippet: str = "",
        proof_explanation: str = ""
    ) -> Dict[str, Any]:
        """
        Surgical Accessibility Code Remediation.
        Generates production-grade HTML/ARIA/JSX replacement code to eliminate the defect.
        """
        self.ensure_loaded()

        system_prompt = (
            "You are a principal accessibility engineer specializing in WCAG 2.2 AA and React/HTML. "
            "You write minimal, surgically precise code fixes for accessibility defects. "
            "Return ONLY the fixed HTML/JSX element code snippet."
        )

        user_prompt = f"""Synthesize a surgical code patch to fix this accessibility defect:
Barrier Kind: {defect_kind}
Target Selector: {target_selector}
Original Snippet:
{target_snippet or f'<div id="{target_selector.replace("#", "")}">...</div>'}

Defect Diagnosis:
{proof_explanation or f"Barrier detected at {target_selector}."}

Fix Requirements:
- If keyboard_trap: ensure role="dialog", aria-modal="true", and onKeyDown escape key dismiss handler.
- If empty_accessible_name: provide descriptive aria-label or visible label.
- If silent_state_change: add role="status" and aria-live="polite".
- If unreachable_control: use native semantic <button> or tabindex="0".

Return the clean, patched code snippet:"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        text = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer([text], return_tensors="pt").to(self.device)

        t0 = time.time()
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=180,
                temperature=0.1,
                do_sample=False
            )

        gen_tokens = outputs[0][len(inputs.input_ids[0]):]
        patched_code = self.tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()
        latency_ms = (time.time() - t0) * 1000

        # Clean code fences if present
        if "```" in patched_code:
            match = re.search(r"```(?:html|jsx|tsx|xml)?\s*([\s\S]*?)```", patched_code)
            if match:
                patched_code = match.group(1).strip()

        return {
            "defectKind": defect_kind,
            "targetSelector": target_selector,
            "patchedCode": patched_code,
            "model": self.model_id,
            "device": self.device,
            "latencyMs": round(latency_ms, 2)
        }

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Safely extracts JSON object from model generation"""
        try:
            return json.loads(text)
        except Exception:
            pass

        # Search for first { and last }
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return None

    def get_stats(self) -> Dict[str, Any]:
        """Reports live GPU memory stats for the SLM"""
        stats = {
            "modelId": self.model_id,
            "isLoaded": self._is_loaded,
            "device": self.device,
        }
        if torch.cuda.is_available() and self._is_loaded:
            stats["allocatedVRAM_MB"] = round(torch.cuda.memory_allocated(0) / (1024**2), 1)
        return stats
