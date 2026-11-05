"""
VoiceOver Reading Order vs Visual Layout Spatial Correlation (Kendall's Tau)
WCAG 1.3.2 Meaningful Sequence & WCAG 2.4.3 Focus Order
"""

from typing import List, Dict, Any
from scipy.stats import kendalltau

class ReadingOrderAnalyzer:
    def calculate_kendall_tau(self, elements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Computes Kendall's rank correlation coefficient (tau) between DOM traversal order
        and visual layout spatial reading order (top-to-bottom, left-to-right).
        """
        if len(elements) < 3:
            return {
                "tau": 1.0,
                "inversions": 0,
                "totalPairs": 0,
                "isAcceptable": True,
                "explanation": "Insufficient elements to compute spatial disorientation."
            }

        # 1. DOM Order ranking
        dom_ranks = list(range(len(elements)))

        # 2. Visual layout coordinates (y * 1000 + x)
        def visual_sort_key(el):
            box = el.get("box", {})
            return box.get("y", 0) * 1000 + box.get("x", 0)

        sorted_by_visual = sorted(enumerate(elements), key=lambda x: visual_sort_key(x[1]))
        visual_ranks = [0] * len(elements)
        for visual_rank, (original_idx, _) in enumerate(sorted_by_visual):
            visual_ranks[original_idx] = visual_rank

        tau_value, p_value = kendalltau(dom_ranks, visual_ranks)
        clean_tau = round(float(tau_value), 3) if not float(tau_value) != float(tau_value) else 1.0

        # Calculate discordant pairs (inversions)
        inversions = 0
        n = len(elements)
        total_pairs = n * (n - 1) // 2
        for i in range(n):
            for j in range(i + 1, n):
                if (dom_ranks[i] < dom_ranks[j] and visual_ranks[i] > visual_ranks[j]) or \
                   (dom_ranks[i] > dom_ranks[j] and visual_ranks[i] < visual_ranks[j]):
                    inversions += 1

        is_acceptable = clean_tau >= 0.60

        return {
            "tau": clean_tau,
            "pValue": round(float(p_value), 4) if p_value else 1.0,
            "inversions": inversions,
            "totalPairs": total_pairs,
            "isAcceptable": is_acceptable,
            "explanation": (
                f"Kendall's rank correlation \u03c4 = {clean_tau}. "
                f"Found {inversions} visual-to-DOM order inversions across {total_pairs} interactive element pairs. "
                + ("Passes WCAG sequence bounds." if is_acceptable else "Severe focus order disorientation detected.")
            )
        }
