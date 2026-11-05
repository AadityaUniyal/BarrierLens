"""
Vault Cryptographic API Key Hasher & Validator
"""

import hashlib
import secrets
from typing import Tuple

class ApiKeyManager:
    @staticmethod
    def generate_api_key(name: str, scope: str = "audit:run") -> Tuple[str, str, str]:
        """
        Returns (raw_key, key_prefix, sha256_hash).
        """
        raw_token = secrets.token_hex(24)
        full_key = f"bl_live_{raw_token}"
        prefix = full_key[:12]
        key_hash = hashlib.sha256(full_key.encode("utf-8")).hexdigest()
        return full_key, prefix, key_hash

    @staticmethod
    def verify_key(raw_key: str, stored_hash: str) -> bool:
        computed = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        return secrets.compare_digest(computed, stored_hash)
