"""
BarrierLens LightGBM Action Ranker (M3 Tier 1 Inference)
Trained to predict element utility and recommended action directly from
accessibility features, bypassing LLM API calls on routine steps.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
import lightgbm as lgb

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "action_ranker_model.txt"

FEATURE_NAMES = [
    "semantic_match",
    "role_priority",
    "focus_order_weight",
    "history_len_norm",
    "is_input",
    "is_button",
    "is_link",
    "is_expanded"
]

ROLE_PRIORITIES = {
    "input": 0.90,
    "button": 0.85,
    "textarea": 0.85,
    "select": 0.80,
    "a": 0.70,
    "link": 0.70,
    "menuitem": 0.75,
    "tab": 0.75
}

class LightGBMActionRanker:
    _instance: Optional["LightGBMActionRanker"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LightGBMActionRanker, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.booster: Optional[lgb.Booster] = None
        self._ensure_model()
        self._initialized = True

    def _ensure_model(self):
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        if MODEL_PATH.exists():
            try:
                self.booster = lgb.Booster(model_file=str(MODEL_PATH))
                print(f"[LightGBMActionRanker] Loaded existing model from {MODEL_PATH}")
                return
            except Exception as e:
                print(f"[LightGBMActionRanker] Failed to load {MODEL_PATH}: {e}, retraining...")

        self._train_bootstrap_model()

    def _train_bootstrap_model(self):
        """
        Trains an initial LightGBM regressor on simulated accessibility navigation matrices
        reflecting optimal keyboard / screen-reader decision boundaries.
        """
        print("[LightGBMActionRanker] Bootstrapping initial LightGBM model...")
        rng = np.random.RandomState(42)
        n_samples = 2500

        # Features: [semantic_match, role_priority, focus_order_weight, history_len_norm, is_input, is_button, is_link, is_expanded]
        semantic = rng.uniform(0.0, 1.0, n_samples)
        role_p = rng.choice([0.5, 0.7, 0.8, 0.85, 0.9], n_samples)
        focus_ord = rng.uniform(0.1, 1.0, n_samples)
        hist_len = rng.uniform(0.0, 1.0, n_samples)
        is_inp = (role_p == 0.9).astype(float)
        is_btn = (role_p == 0.85).astype(float)
        is_lnk = (role_p == 0.7).astype(float)
        is_exp = rng.binomial(1, 0.15, n_samples).astype(float)

        X = np.column_stack([
            semantic, role_p, focus_ord, hist_len, is_inp, is_btn, is_lnk, is_exp
        ])

        # Target utility function (reflecting optimal action utility):
        # High semantic match + high role priority + forward focus progression yields target 1.0
        y = (
            (semantic * 0.50) +
            (role_p * 0.28) +
            (focus_ord * 0.18) +
            (is_btn * 0.04) -
            (hist_len * 0.05) +
            rng.normal(0, 0.02, n_samples)
        )
        y = np.clip(y, 0.0, 1.0)

        train_data = lgb.Dataset(X, label=y, feature_name=FEATURE_NAMES)
        params = {
            "objective": "regression",
            "metric": "rmse",
            "learning_rate": 0.08,
            "num_leaves": 31,
            "min_data_in_leaf": 20,
            "verbosity": -1,
            "seed": 42
        }

        self.booster = lgb.train(params, train_data, num_boost_round=120)
        self.booster.save_model(str(MODEL_PATH))
        print(f"[LightGBMActionRanker] Model trained and saved to {MODEL_PATH}")

    def _extract_features(
        self,
        node: Dict[str, Any],
        goal_words: List[str],
        current_focus_selector: str,
        all_nodes: List[Dict[str, Any]],
        history_length: int
    ) -> List[float]:
        role = (node.get("role") or "").lower()
        name = (node.get("name") or "").lower()
        selector = node.get("selector") or ""

        # 1. Semantic matching
        name_words = name.split()
        if goal_words:
            matches = [w for w in goal_words if any(w in nw for nw in name_words)]
            semantic_match = len(matches) / len(goal_words)
        else:
            semantic_match = 0.0

        # 2. Role priority
        role_priority = ROLE_PRIORITIES.get(role, 0.50)

        # 3. Focus order progression
        curr_idx = -1
        node_idx = -1
        for i, n in enumerate(all_nodes):
            sel = n.get("selector") or ""
            if sel == current_focus_selector:
                curr_idx = i
            if sel == selector:
                node_idx = i

        n_count = max(1, len(all_nodes))
        if curr_idx != -1 and node_idx != -1:
            dist = (node_idx - curr_idx) if node_idx >= curr_idx else (n_count + node_idx - curr_idx)
            focus_order_weight = max(0.1, 1.0 - (dist / (n_count * 1.5)))
        else:
            focus_order_weight = 0.5

        # 4. History length normalized
        hist_norm = min(1.0, history_length / 20.0)

        # 5. Role flags
        is_input = 1.0 if role in ("input", "textarea") else 0.0
        is_button = 1.0 if role == "button" else 0.0
        is_link = 1.0 if role in ("a", "link") else 0.0
        is_expanded = 1.0 if node.get("expanded") is True else 0.0

        return [
            semantic_match,
            role_priority,
            focus_order_weight,
            hist_norm,
            is_input,
            is_button,
            is_link,
            is_expanded
        ]

    def rank_candidates(
        self,
        goal: str,
        nodes: List[Dict[str, Any]],
        current_focus_selector: str = "",
        history: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Ranks candidate AX nodes using the trained LightGBM booster.
        Returns top recommended candidate, confidence, action, and Tier 1 eligibility.
        """
        if not nodes:
            return {
                "bestNode": None,
                "recommendedAction": "press_key",
                "key": "Tab",
                "confidence": 0.40,
                "isHighConfidence": False,
                "source": "lightgbm",
                "reasoning": "No candidate interactive nodes available, default Tab."
            }

        history = history or []
        goal_words = [w for w in goal.lower().split() if len(w) > 2]

        feature_matrix = []
        valid_nodes = []

        for node in nodes:
            if node.get("disabled") is True:
                continue
            feats = self._extract_features(node, goal_words, current_focus_selector, nodes, len(history))
            feature_matrix.append(feats)
            valid_nodes.append(node)

        if not valid_nodes:
            return {
                "bestNode": None,
                "recommendedAction": "press_key",
                "key": "Tab",
                "confidence": 0.40,
                "isHighConfidence": False,
                "source": "lightgbm",
                "reasoning": "All candidates disabled, default Tab."
            }

        X = np.array(feature_matrix)
        preds = self.booster.predict(X)

        best_idx = int(np.argmax(preds))
        best_score = float(preds[best_idx])
        best_node = valid_nodes[best_idx]

        confidence = round(min(0.99, max(0.10, best_score)), 2)
        is_high_confidence = confidence >= 0.78

        # Determine physical action
        is_current_target = (best_node.get("selector") == current_focus_selector)
        role = (best_node.get("role") or "").lower()

        if is_current_target:
            if role in ("input", "textarea") and not best_node.get("value"):
                recommended_action = "type_text"
                key = "Enter"
            else:
                recommended_action = "press_key"
                key = "Enter"
        else:
            recommended_action = "press_key"
            key = "Tab"

        reasoning = (
            f"LightGBM M3 selected <{best_node.get('role')} \"{best_node.get('name')}\"> "
            f"with confidence {confidence}. "
            + ("Bypassing LLM via Tier 1 shortcut." if is_high_confidence else "Escalating to Tier 2 LLM Router.")
        )

        return {
            "bestNode": best_node,
            "recommendedAction": recommended_action,
            "key": key,
            "confidence": confidence,
            "isHighConfidence": is_high_confidence,
            "source": "gpu_lightgbm",
            "reasoning": reasoning
        }
