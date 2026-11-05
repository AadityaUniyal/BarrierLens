"""
Vault Signed Webhook Dispatcher
Computes HMAC-SHA256 signatures for outgoing audit and repair events.
"""

import hmac
import hashlib
import json
import time
from typing import Dict, Any

class WebhookSigner:
    @staticmethod
    def sign_payload(secret: str, payload: Dict[str, Any]) -> str:
        body_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        return f"sha256={signature}"
