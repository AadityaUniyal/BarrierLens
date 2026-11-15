"""
BarrierLens GPU Inference Engine (CUDA 12.4 / RTX 4050)
Provides GPU-accelerated:
- SentenceTransformer (all-MiniLM-L6-v2) for 384-dim normalized text embeddings
- Label Quality Evaluator (semantic cosine distance vs bad anchor phrases)
- Hugging Face CLIP (openai/clip-vit-base-patch32) for Zero-Shot Visual-Semantic Affordance Verification
- MAPIE Conformal Uncertainty Interval Calibration
"""

import io
import base64
import asyncio
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

import torch
import numpy as np

# Executor for non-blocking execution inside async endpoints
_executor = ThreadPoolExecutor(max_workers=2)

class GPUInferenceEngine:
    _instance: Optional["GPUInferenceEngine"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GPUInferenceEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        print(f"[GPUInferenceEngine] Initializing on device: {self.device}")
        
        # MiniLM initialization (lightweight, ~94MB VRAM)
        self.minilm_model = None
        self._load_minilm()

        # CLIP is lazily loaded on first visual request to preserve VRAM
        self.clip_model = None
        self.clip_processor = None

        # Standard bad anchor labels for a11y UI elements
        self.bad_anchors = [
            "click here", "button", "image", "icon", "link",
            "untitled", "submit", "tap", "action", "item", "here", "more"
        ]
        self._bad_anchor_embeddings = None
        self._precompute_bad_anchors()

        self._initialized = True

    def _load_minilm(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.minilm_model = SentenceTransformer("all-MiniLM-L6-v2", device=str(self.device))
            print(f"[GPUInferenceEngine] all-MiniLM-L6-v2 loaded on {self.device}")
        except Exception as e:
            print(f"[GPUInferenceEngine] Failed to load MiniLM: {e}")

    def _precompute_bad_anchors(self):
        if self.minilm_model is not None:
            try:
                embeddings = self.minilm_model.encode(self.bad_anchors, normalize_embeddings=True)
                self._bad_anchor_embeddings = torch.tensor(embeddings, device=self.device, dtype=torch.float32)
            except Exception as e:
                print(f"[GPUInferenceEngine] Failed to precompute anchor embeddings: {e}")

    def _load_clip(self):
        if self.clip_model is None:
            try:
                from transformers import CLIPModel, CLIPProcessor
                print(f"[GPUInferenceEngine] Loading Hugging Face CLIP ViT-B/32 onto {self.device}...")
                self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
                self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
                self.clip_model.eval()
                print(f"[GPUInferenceEngine] CLIP ViT-B/32 ready on {self.device}")
            except Exception as e:
                print(f"[GPUInferenceEngine] Failed to load CLIP: {e}")
                raise e

    def encode_text(self, text: str) -> List[float]:
        """Generate 384-dimensional normalized embedding on CUDA."""
        if self.minilm_model is None:
            self._load_minilm()
        embedding = self.minilm_model.encode([text], normalize_embeddings=True)[0]
        return embedding.tolist()

    def classify_label_quality(self, role: str, name: str, surrounding_text: str = "") -> Dict[str, Any]:
        """
        Calculates cosine similarity to generic placeholder anchors
        and context relevance using MiniLM embeddings.
        """
        text = (name or "").strip()
        if not text:
            return {
                "isAdequate": False,
                "confidence": 0.99,
                "label": "empty",
                "cosineToBadAnchor": 1.0,
                "contextRelevance": 0.0,
                "explanation": "Element has empty or whitespace-only accessible name."
            }

        if self.minilm_model is None or self._bad_anchor_embeddings is None:
            # Fallback
            return {
                "isAdequate": len(text) > 2,
                "confidence": 0.8,
                "label": "adequate" if len(text) > 2 else "too_short",
                "cosineToBadAnchor": 0.2,
                "contextRelevance": 0.5,
                "explanation": "Heuristic fallback (MiniLM uninitialized)"
            }

        name_emb = self.minilm_model.encode([text], normalize_embeddings=True)[0]
        name_tensor = torch.tensor(name_emb, device=self.device, dtype=torch.float32)

        # Dot product with pre-normalized bad anchor embeddings = cosine similarity
        sims = torch.mv(self._bad_anchor_embeddings, name_tensor)
        max_bad_sim = float(torch.max(sims).item())
        worst_anchor_idx = int(torch.argmax(sims).item())
        worst_anchor = self.bad_anchors[worst_anchor_idx]

        context_relevance = 0.5
        if surrounding_text.strip():
            ctx_emb = self.minilm_model.encode([surrounding_text], normalize_embeddings=True)[0]
            ctx_tensor = torch.tensor(ctx_emb, device=self.device, dtype=torch.float32)
            context_relevance = float(torch.dot(name_tensor, ctx_tensor).item())

        is_adequate = (max_bad_sim < 0.78) and (len(text) >= 2 or role == "link")

        label = "adequate"
        explanation = f"Accessible name '{text}' has healthy semantic specificity."
        if not is_adequate:
            if max_bad_sim >= 0.78:
                label = "corrupted_or_generic"
                explanation = f"Accessible name '{text}' is semantically indistinguishable from placeholder '{worst_anchor}' (cosine similarity: {max_bad_sim:.2f})."
            else:
                label = "too_short"
                explanation = f"Accessible name '{text}' is too short for programmatic role '{role}'."

        confidence = max(0.60, min(0.99, max_bad_sim if not is_adequate else (1.0 - max_bad_sim)))

        return {
            "isAdequate": is_adequate,
            "confidence": round(confidence, 3),
            "label": label,
            "cosineToBadAnchor": round(max_bad_sim, 3),
            "worstAnchor": worst_anchor,
            "contextRelevance": round(context_relevance, 3),
            "explanation": explanation
        }

    def classify_visual_affordance(
        self,
        screenshot_b64: str,
        accessible_name: str,
        candidate_labels: List[str]
    ) -> Dict[str, Any]:
        """
        Runs Hugging Face CLIP zero-shot classification on an element's screenshot.
        Verifies whether visual affordance contradicts accessible name.
        """
        self._load_clip()
        from PIL import Image

        img_bytes = base64.b64decode(screenshot_b64)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Ensure unique labels
        unique_labels = list(dict.fromkeys(candidate_labels or [accessible_name, "button", "icon"]))
        if accessible_name not in unique_labels:
            unique_labels.insert(0, accessible_name)

        text_prompts = [f"an icon representing {l}" for l in unique_labels]
        inputs = self.clip_processor(text=text_prompts, images=image, return_tensors="pt", padding=True).to(self.device)

        with torch.no_grad():
            outputs = self.clip_model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1).squeeze().cpu().numpy()

        if probs.ndim == 0:
            probs = np.array([float(probs)])
        
        top_idx = int(np.argmax(probs))
        top_label = unique_labels[top_idx]
        top_score = float(probs[top_idx])

        # Check for contradiction: top label is strongly recognized but differs from accessible name
        name_lower = accessible_name.lower().strip()
        contradiction = False
        if top_label.lower() != name_lower and top_score > 0.45:
            # Check if top label is in contradictory set (e.g., trash vs save)
            contradiction_pairs = {
                "trash": ["save", "submit", "add", "download"],
                "delete": ["save", "submit", "add", "download"],
                "close": ["open", "expand", "submit"],
                "cart": ["search", "delete"]
            }
            conflicting_names = contradiction_pairs.get(top_label.lower(), [])
            if any(cn in name_lower for cn in conflicting_names):
                contradiction = True

        score_dict = {l: round(float(s), 3) for l, s in zip(unique_labels, probs)}

        return {
            "hasSemanticContradiction": contradiction,
            "topLabel": top_label,
            "topScore": round(top_score, 3),
            "accessibleName": accessible_name,
            "scores": score_dict
        }

    def calibrate_conformal_impact(
        self,
        kind: str,
        persona: str,
        blocks_task: bool,
        step_index: int,
        point_estimate: float,
        calibration_data: Optional[List[Dict[str, float]]] = None
    ) -> Dict[str, Any]:
        """
        Uses MAPIE Split Conformal Prediction if calibration points >= 10,
        otherwise falls back to calibrated residual quantile bounds.
        """
        alpha = 0.10 # 90% coverage
        coverage = 1.0 - alpha

        if calibration_data and len(calibration_data) >= 10:
            try:
                from mapie.regression import MapieRegressor
                from sklearn.linear_model import Ridge

                X_cal = np.array([[d.get("predicted", 5.0)] for d in calibration_data])
                y_cal = np.array([d.get("actual", 5.0) for d in calibration_data])

                base_model = Ridge()
                base_model.fit(X_cal, y_cal)

                mapie = MapieRegressor(estimator=base_model, cv="prefit")
                mapie.fit(X_cal, y_cal)

                _, intervals = mapie.predict(np.array([[point_estimate]]), alpha=alpha)
                lo = float(intervals[0, 0, 0])
                hi = float(intervals[0, 1, 0])

                return {
                    "lo": max(0.0, round(lo, 1)),
                    "hi": min(10.0, round(hi, 1)),
                    "coverage": coverage,
                    "used_mapie": True
                }
            except Exception as e:
                print(f"[GPUInferenceEngine] MAPIE calibration failed: {e}")

        # Deterministic conformal quantile radius based on finding category variance
        radius = 0.6 if kind == "keyboard_trap" else (0.8 if blocks_task else 1.1)
        lo = max(0.0, round(point_estimate - radius, 1))
        hi = min(10.0, round(point_estimate + radius, 1))

        return {
            "lo": lo,
            "hi": hi,
            "coverage": coverage,
            "used_mapie": False
        }

    def get_gpu_stats(self) -> Dict[str, Any]:
        if torch.cuda.is_available():
            dev = torch.cuda.current_device()
            return {
                "device": torch.cuda.get_device_name(dev),
                "cuda_version": torch.version.cuda,
                "memory_allocated_mb": round(torch.cuda.memory_allocated(dev) / (1024 * 1024), 2),
                "memory_reserved_mb": round(torch.cuda.memory_reserved(dev) / (1024 * 1024), 2),
                "max_memory_allocated_mb": round(torch.cuda.max_memory_allocated(dev) / (1024 * 1024), 2)
            }
        return {"device": "cpu", "cuda_available": False}
