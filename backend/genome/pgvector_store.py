"""
Neon PostgreSQL pgvector Database Driver
Persists 768-dim barrier vectors and performs cosine distance queries.
"""

import os
import uuid
import json
import psycopg2
from typing import List, Dict, Any, Optional
from core.config import CoreConfig
from genome.vectorizer import GenomeVectorizer

class PgvectorStore:
    def __init__(self):
        self.db_url = CoreConfig.DATABASE_URL
        self.vectorizer = GenomeVectorizer()

    def store_genome(
        self,
        finding_id: str,
        finding_kind: str,
        target_url: str,
        persona: str,
        severity_score: float,
        wcag_rules: List[str],
        vector: Optional[List[float]] = None
    ) -> bool:
        if not self.db_url:
            return False

        if vector is None:
            vector = self.vectorizer.encode_barrier(
                finding_kind=finding_kind,
                wcag_rules=wcag_rules,
                severity_score=severity_score,
                target_url=target_url
            )

        try:
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()
            vec_str = "[" + ",".join(str(x) for x in vector) + "]"
            gid = str(uuid.uuid4())
            import urllib.parse
            domain = urllib.parse.urlparse(target_url).hostname or "target.local"

            cur.execute("""
                INSERT INTO barrier_genomes (
                    id, finding_id, finding_kind, domain, target_url, persona, 
                    vector, vector_json, magnitude, severity_score, wcag_rules, context
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, 
                    %s::vector, %s, %s, %s, %s, %s
                )
                ON CONFLICT (id) DO NOTHING;
            """, (
                gid, finding_id, finding_kind, domain, target_url, persona,
                vec_str, json.dumps(vector), 1.0, severity_score, json.dumps(wcag_rules), json.dumps({"source": "backend_agent"})
            ))

            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            return False
