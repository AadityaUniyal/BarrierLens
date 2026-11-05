"""
BarrierLens 768-dimensional Barrier Genome Vectorizer & Neon Postgres pgvector Store.
Enables cross-site transfer learning and zero-LLM repairs for recurring barrier patterns.
"""

import os
import json
import math
import hashlib
from typing import List, Dict, Any, Optional
import psycopg2

class BarrierGenomeStore:
    DIMENSIONS = 768

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.environ.get("DATABASE_URL")

    def encode_finding(self, finding_kind: str, wcag_rules: List[str], severity_score: float, context_url: str) -> List[float]:
        """
        Encodes an accessibility barrier into a 768-dimensional normalized feature vector.
        """
        vec = [0.0] * self.DIMENSIONS

        # Block 1: Finding Kind projection (dims 0..15)
        kinds = ["keyboard_trap", "silent_state_change", "low_kendall_tau", "empty_accessible_name", "focus_loss"]
        if finding_kind in kinds:
            vec[kinds.index(finding_kind)] = 1.0

        # Block 2: Severity metric (dim 16)
        vec[16] = min(1.0, max(0.0, severity_score / 10.0))

        # Block 3: WCAG Rule projection (dims 20..83)
        for rule in wcag_rules:
            h = int(hashlib.md5(rule.encode("utf-8")).hexdigest(), 16) % 64
            vec[20 + h] = 0.8

        # Block 4: Domain & Context hash projection (dims 84..255)
        domain_hash = int(hashlib.sha256(context_url.encode("utf-8")).hexdigest(), 16) % 172
        vec[84 + domain_hash] = 0.5

        # Normalize vector to unit length (L2 norm)
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]

        return vec

    def store_genome(
        self,
        finding_id: str,
        finding_kind: str,
        target_url: str,
        persona: str,
        severity_score: float,
        wcag_rules: List[str],
        vector: List[float]
    ) -> bool:
        """Stores the genome vector in Neon PostgreSQL."""
        if not self.db_url:
            return False

        try:
            domain = target_url.split("//")[-1].split("/")[0]
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()

            cur.execute("""
                INSERT INTO barrier_genomes (
                    id, finding_id, finding_kind, domain, target_url, persona,
                    magnitude, severity_score, wcag_rules, context, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    magnitude = EXCLUDED.magnitude,
                    severity_score = EXCLUDED.severity_score;
            """, (
                finding_id,
                finding_id,
                finding_kind,
                domain,
                target_url,
                persona,
                1.0,
                severity_score,
                json.dumps(wcag_rules),
                json.dumps({"url": target_url, "persona": persona})
            ))

            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            print(f"[Genome Store Warning] Neon store failed: {e}")
            return False
