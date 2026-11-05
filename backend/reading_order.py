"""
BarrierLens Kendall's Tau Reading Order Engine
Computes rank correlation between visual spatial layout and DOM focus traversal order.
Flags WCAG 1.3.2 Meaningful Sequence & WCAG 2.4.3 Focus Order violations.
"""

from typing import List, Dict, Any
import numpy as np
from scipy.stats import kendalltau

class ReadingOrderAnalyzer:
    def __init__(self, tau_threshold: float = 0.65):
        self.tau_threshold = tau_threshold

    def calculate_kendall_tau(self, nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates Kendall's tau between DOM sequence index and geometric top-to-bottom, left-to-right order.
        """
        if len(nodes) < 3:
            return {
                "tau": 1.0,
                "isAcceptable": True,
                "inversionCount": 0,
                "explanation": "Insufficient interactive nodes to establish rank ordering."
            }

        # 1. Natural DOM sequence indices [0, 1, 2, ..., N-1]
        dom_order = list(range(len(nodes)))

        # 2. Visual geometric rank: sort by Y (row) then X (column)
        # Using a row tolerance of 24px so elements in the same horizontal navbar/form row share visual rank
        def visual_sort_key(item):
            box = item[1].get("box") or item[1].get("boundingBox") or {"x": 0, "y": 0}
            y = box.get("y", 0)
            x = box.get("x", 0)
            # Group into 24px visual bands
            y_band = round(y / 24.0) * 24
            return (y_band, x)

        indexed_nodes = list(enumerate(nodes))
        indexed_nodes.sort(key=visual_sort_key)

        visual_order = [0] * len(nodes)
        for visual_rank, (original_idx, _) in enumerate(indexed_nodes):
            visual_order[original_idx] = visual_rank

        # 3. Compute Kendall's Tau
        res = kendalltau(dom_order, visual_order)
        tau = float(res.statistic) if not np.isnan(res.statistic) else 1.0
        tau = round(tau, 3)

        # 4. Count pairwise inversions
        inversions = 0
        for i in range(len(visual_order)):
            for j in range(i + 1, len(visual_order)):
                if visual_order[i] > visual_order[j]:
                    inversions += 1

        is_acceptable = tau >= self.tau_threshold

        explanation = (
            f"Kendall's tau rank correlation is {tau} (acceptable >= {self.tau_threshold}). "
            f"Detected {inversions} visual-to-DOM order inversions."
        )
        if not is_acceptable:
            explanation += " Severe reading order disorientation: Keyboard focus jumps erratically across visual rows."

        return {
            "tau": tau,
            "isAcceptable": is_acceptable,
            "inversionCount": inversions,
            "pValue": float(res.pvalue) if not np.isnan(res.pvalue) else 0.0,
            "explanation": explanation,
            "focusOrder": [n.get("selector", f"Node-{i}") for i, n in enumerate(nodes[:8])],
            "visualOrder": [nodes[idx].get("selector", f"Node-{idx}") for idx, _ in indexed_nodes[:8]]
        }
