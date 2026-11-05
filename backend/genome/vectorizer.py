"""
Barrier Genome 768-Dimensional Vectorizer
Encodes accessibility barrier signatures into normalized embedding vectors.
"""

import math
from typing import List

class GenomeVectorizer:
    def encode_barrier(
        self,
        finding_kind: str,
        wcag_rules: List[str],
        severity_score: float,
        target_url: str,
        dim: int = 768
    ) -> List[float]:
        """
        Synthesizes a deterministic, normalized 768-dimensional embedding vector
        representing the barrier's structural and semantic properties.
        """
        vec = [0.0] * dim

        # 1. Finding kind semantic hash
        kind_hash = hash(finding_kind)
        for i in range(128):
            vec[i] = ((kind_hash >> (i % 32)) & 1) * 0.5

        # 2. WCAG rules semantic hash
        rules_str = " ".join(wcag_rules)
        rule_hash = hash(rules_str)
        for i in range(128, 384):
            vec[i] = ((rule_hash >> (i % 32)) & 1) * 0.35

        # 3. Severity & continuous metrics
        norm_severity = severity_score / 10.0
        for i in range(384, 512):
            vec[i] = norm_severity * math.sin(i * 0.1)

        # 4. Target domain contextual tokens
        url_hash = hash(target_url)
        for i in range(512, dim):
            vec[i] = ((url_hash >> (i % 32)) & 1) * 0.25

        # L2-normalization
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [round(x / norm, 6) for x in vec]

        return vec
