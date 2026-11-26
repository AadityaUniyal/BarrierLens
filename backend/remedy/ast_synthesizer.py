"""
Surgical AST Patch Synthesizer
Uses Python's HTMLParser AST traversal (with optional Amazon Nova Pro enrichment via Bedrock)
to synthesize minimal, declarative HTML/ARIA patches.
"""

from html.parser import HTMLParser
from html import escape
from typing import Dict, Any, List, Optional
from core.strands_coordinator import StrandsCoordinator


class _DOMPatchTransformer(HTMLParser):
    """Lightweight HTML5 AST transformer that injects ARIA attributes onto the target element."""

    def __init__(self, target_tag: Optional[str], attrs_to_inject: Dict[str, str]):
        super().__init__(convert_charrefs=False)
        self.target_tag = target_tag
        self.attrs_to_inject = attrs_to_inject
        self.patched = False
        self.out: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[tuple]):
        self._emit_tag(tag, attrs, self_closing=False)

    def handle_startendtag(self, tag: str, attrs: List[tuple]):
        self._emit_tag(tag, attrs, self_closing=True)

    def _emit_tag(self, tag: str, attrs: List[tuple], self_closing: bool):
        attr_map = {k: (v if v is not None else "") for k, v in attrs}
        if not self.patched and (self.target_tag is None or tag.lower() == self.target_tag.lower()):
            for k, v in self.attrs_to_inject.items():
                attr_map[k] = v
            self.patched = True
        rendered_attrs = "".join(
            f' {k}="{escape(v, quote=True)}"' if v != "" else f" {k}"
            for k, v in attr_map.items()
        )
        suffix = " />" if self_closing else ">"
        self.out.append(f"<{tag}{rendered_attrs}{suffix}")

    def handle_endtag(self, tag: str):
        self.out.append(f"</{tag}>")

    def handle_data(self, data: str):
        self.out.append(data)

    def handle_entityref(self, name: str):
        self.out.append(f"&{name};")

    def handle_charref(self, name: str):
        self.out.append(f"&#{name};")


class AstSynthesizer:
    def __init__(self):
        self.coordinator = StrandsCoordinator()

    def synthesize_patch(self, finding_kind: str, component_nodes: List[str], source_html: Optional[str] = None) -> str:
        attrs_map: Dict[str, Dict[str, str]] = {
            "keyboard_trap": {"role": "dialog", "aria-modal": "true", "tabindex": "-1"},
            "empty_accessible_name": {"aria-label": "Interactive control"},
            "missing_accessible_name": {"aria-label": "Interactive control"},
            "silent_state_change": {"aria-live": "polite", "role": "status"},
            "focus_loss": {"tabindex": "-1", "data-focus-restore": "true"},
        }
        attrs_to_inject = attrs_map.get(finding_kind, {"aria-label": "Accessible element"})

        if source_html:
            transformer = _DOMPatchTransformer(target_tag=None, attrs_to_inject=attrs_to_inject)
            transformer.feed(source_html)
            transformer.close()
            if transformer.patched:
                return "".join(transformer.out)

        prompt = (
            f"Synthesize minimal HTML/ARIA patch for {finding_kind} on components {component_nodes}. "
            f"Return ONLY replacement HTML snippet with {', '.join(f'{k}={v}' for k, v in attrs_to_inject.items())}."
        )
        patch = self.coordinator.invoke_nova(prompt, model_type="pro", max_tokens=120)
        if patch and "Fallback" not in patch and "<" in patch:
            return patch

        tag = "dialog" if finding_kind == "keyboard_trap" else "div"
        base_html = f"<{tag}></{tag}>"
        transformer = _DOMPatchTransformer(target_tag=tag, attrs_to_inject=attrs_to_inject)
        transformer.feed(base_html)
        transformer.close()
        return "".join(transformer.out)
