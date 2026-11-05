"""
Announcement-Gap Detector
Detects visual DOM updates that fail to announce to assistive tech (WCAG 4.1.3 Status Messages).
"""

from typing import List, Dict, Any, Optional
import uuid

class AnnouncementGapDetector:
    def detect_gap(
        self,
        visual_mutation: Dict[str, Any],
        aria_live_announcements: List[str]
    ) -> Optional[Dict[str, Any]]:
        is_visual_change = visual_mutation.get("isSignificant", False)
        text_content = visual_mutation.get("textContent", "").strip()

        if is_visual_change and text_content:
            has_matching_speech = any(
                text_content.lower() in ann.lower() or ann.lower() in text_content.lower()
                for ann in aria_live_announcements
            )

            if not has_matching_speech:
                return {
                    "id": str(uuid.uuid4()),
                    "kind": "announcement_gap",
                    "trustTier": "proven",
                    "title": "Visual State Transition Lacks Screen-Reader Announcement",
                    "summary": (
                        f"A visible DOM mutation occurred ('{text_content[:60]}...') "
                        f"but zero aria-live speech announcements were emitted. "
                        f"Screen-reader users are completely unaware of this state change."
                    ),
                    "wcagRules": ["WCAG 4.1.3 Status Messages (Level AA)"],
                    "severity": "high",
                    "severityScore": 7.8,
                    "evidence": {
                        "visualText": text_content,
                        "spokenAnnouncements": aria_live_announcements,
                        "elementSelector": visual_mutation.get("selector", "unknown")
                    }
                }
        return None
