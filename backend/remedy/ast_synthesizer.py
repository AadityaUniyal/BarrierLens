"""
Surgical AST Patch Synthesizer
Uses Amazon Nova Pro via Bedrock to synthesize minimal, declarative HTML/ARIA patches.
"""

from typing import Dict, Any, List
from core.strands_coordinator import StrandsCoordinator

class AstSynthesizer:
    def __init__(self):
        self.coordinator = StrandsCoordinator()

    def synthesize_patch(self, finding_kind: str, component_nodes: List[str]) -> str:
        prompt = (
            f"Synthesize minimal HTML/ARIA patch for {finding_kind} on components {component_nodes}. "
            f"Return ONLY replacement HTML snippet with role='dialog' and aria-modal='true'."
        )
        patch = self.coordinator.invoke_nova(prompt, model_type="pro", max_tokens=120)
        if not patch or "Fallback" in patch:
            patch = '<div role="dialog" aria-modal="true" onKeyDown={(e) => e.key === "Escape" && close()}>\n  {children}\n</div>'
        return patch
