"""
BarrierLens Visual Text Recovery & Screen Reader Silence Engine (M5)
Extracts visual text rendered into canvas, icons, image-buttons, or raster UI,
and identifies critical Accessible Name omissions where visual text exists
but assistive technology receives silence.
"""

import base64
import io
import re
from typing import Dict, Any, List, Optional
from PIL import Image

class VisualTextRecoveryEngine:
    def __init__(self):
        self._ocr_available = None
        self.reader = None
        self.backend = "heuristic_raster"

    def _ensure_ocr(self):
        if self._ocr_available is not None:
            return
        # Lazy check if tesseract or easyocr is available
        try:
            import pytesseract
            self.pytesseract = pytesseract
            self._ocr_available = True
            self.backend = "pytesseract"
        except ImportError:
            try:
                import easyocr
                self.reader = easyocr.Reader(['en'], gpu=False)
                self._ocr_available = True
                self.backend = "easyocr"
            except Exception:
                self._ocr_available = False
                self.backend = "heuristic_raster"

    def analyze_element_visual_text(
        self,
        screenshot_b64: str,
        computed_name: str = "",
        role: str = "button"
    ) -> Dict[str, Any]:
        """
        Analyzes an element's visual rendering to extract burned-in text.
        Cross-checks against the programmatic accessible name to detect
        Assistive Silence / Unannounced Visual Text.
        """
        if not screenshot_b64:
            return {
                "extractedText": "",
                "hasDiscrepancy": False,
                "suggestedLabel": "",
                "confidence": 0.0,
                "reason": "No image payload"
            }

        try:
            # Clean data URI prefix if present
            clean_b64 = re.sub(r"^data:image\/[a-z]+;base64,", "", screenshot_b64)
            img_bytes = base64.b64decode(clean_b64)
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

            self._ensure_ocr()
            extracted_text = ""
            confidence = 0.85

            if self._ocr_available and self.backend == "pytesseract":
                try:
                    extracted_text = self.pytesseract.image_to_string(image).strip()
                except Exception:
                    self._ensure_ocr()
            extracted_text = ""
            elif self._ocr_available and self.backend == "easyocr":
                try:
                    import numpy as np
                    results = self.reader.readtext(np.array(image))
                    extracted_text = " ".join([r[1] for r in results if r[2] > 0.4]).strip()
                except Exception:
                    self._ensure_ocr()
            extracted_text = ""

            # Clean extracted text
            extracted_text = re.sub(r"\s+", " ", extracted_text).strip()

            # Cross-check against computed accessible name
            clean_name = (computed_name or "").strip().lower()
            clean_visual = extracted_text.lower()

            has_discrepancy = False
            suggested_label = ""
            explanation = ""

            if extracted_text and len(extracted_text) >= 2:
                # If visual text exists, but computed name is empty or generic
                is_empty_or_generic = not clean_name or clean_name in ["button", "link", "icon", "submit", "image", "btn"]
                if is_empty_or_generic:
                    has_discrepancy = True
                    suggested_label = extracted_text
                    explanation = (
                        f"Element visually displays \"{extracted_text}\", but its programmatic "
                        f"accessible name is empty or generic. Screen readers will announce an uninformative "
                        f"control instead of the visible text."
                    )
                elif clean_visual not in clean_name and clean_name not in clean_visual:
                    # Mismatch between visible text and programmatic label
                    has_discrepancy = True
                    suggested_label = extracted_text
                    explanation = (
                        f"Visual text \"{extracted_text}\" conflicts with programmatic name \"{computed_name}\". "
                        f"Violates WCAG 2.5.3 (Label in Name)."
                    )

            return {
                "extractedText": extracted_text,
                "hasDiscrepancy": has_discrepancy,
                "suggestedLabel": suggested_label,
                "confidence": confidence if has_discrepancy else 0.5,
                "explanation": explanation,
                "backend": self.backend
            }

        except Exception as e:
            return {
                "extractedText": "",
                "hasDiscrepancy": False,
                "suggestedLabel": "",
                "confidence": 0.0,
                "error": str(e)
            }
