"""
BarrierLens Announcement Gap Detector
Identifies when dynamic visual DOM mutations occur (e.g. error banners, modal dialogs, toasts)
without corresponding ARIA live region announcements.
"""

from typing import List, Dict, Any, Optional

class AnnouncementGapDetector:
    def detect_gap(
        self,
        dom_mutations: List[Dict[str, Any]],
        announcements: List[Dict[str, Any]],
        focus_moved: bool
    ) -> Dict[str, Any]:
        """
        Flags silent state changes when:
        1. A significant visual mutation occurred (e.g. error message, banner, dialog).
        2. Focus did not move to the mutated element.
        3. No aria-live announcement was registered by assistive technology.
        """
        meaningful_visual_mutations = []

        for m in dom_mutations:
            text = (m.get("text") or m.get("elementText") or "").strip()
            tag = (m.get("tag") or "").lower()
            is_live = bool(m.get("isLive") or m.get("isLiveRegion"))

            # Exclude script, style, and svg noise
            if tag in ["script", "style", "noscript", "svg", "path"]:
                continue

            # Check if this mutation carries meaningful visual semantic feedback
            if text and len(text) > 4:
                is_error_or_status = any(kw in text.lower() for kw in [
                    "error", "failed", "invalid", "required", "declined", "success", "added", "updated", "complete"
                ])
                if is_error_or_status and not is_live:
                    meaningful_visual_mutations.append({
                        "selector": m.get("selector", "unknown"),
                        "text": text,
                        "tag": tag,
                        "type": m.get("type", "mutation")
                    })

        # If a meaningful visual message appeared but no speech announcement occurred and focus didn't move
        has_announcements = len(announcements) > 0
        if meaningful_visual_mutations and not has_announcements and not focus_moved:
            target = meaningful_visual_mutations[0]
            return {
                "detected": True,
                "kind": "silent_state_change",
                "evidence": (
                    f"Announcement Gap Detected: Visual status text \"{target['text'][:60]}\" appeared at "
                    f"`{target['selector']}`, but no aria-live polite/assertive announcement was emitted, "
                    f"leaving screen reader users completely unaware of the update."
                ),
                "visualDeltaText": target["text"],
                "targetSelector": target["selector"],
                "wcagRule": "WCAG 4.1.3 Status Messages (Level AA)"
            }

        return {
            "detected": False,
            "evidence": "Visual mutations are properly accompanied by live announcements or active focus shifts."
        }
