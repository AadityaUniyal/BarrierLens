"""
Vault Signed Webhook Dispatcher
Computes HMAC-SHA256 signatures for outgoing audit and repair events,
and asynchronously dispatches event payloads to third-party endpoints.
"""

import hmac
import hashlib
import json
import time
from typing import Dict, Any, Optional
import httpx

class WebhookSigner:
    @staticmethod
    def sign_payload(secret: str, payload: Dict[str, Any]) -> str:
        body_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        return f"sha256={signature}"


class WebhookDispatcher:
    @staticmethod
    async def dispatch(
        url: str,
        secret: str,
        event_type: str,
        data: Dict[str, Any],
        timeout: float = 10.0
    ) -> Dict[str, Any]:
        """
        Dispatches an event payload to a webhook URL with HMAC-SHA256 signature.
        Supports standard webhooks as well as Slack/Discord incoming webhook formats.
        """
        timestamp = int(time.time())
        payload = {
            "event": event_type,
            "timestamp": timestamp,
            "data": data
        }

        # If it's a Slack webhook, add markdown attachments format
        if "slack.com" in url or "hooks.slack.com" in url:
            slack_payload = {
                "text": f"🛡️ *BarrierLens Audit Alert:* {event_type}",
                "blocks": [
                    {
                        "type": "header",
                        "text": {"type": "plain_text", "text": f"🛡️ BarrierLens Audit Event: {event_type}"}
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Run ID:*\n`{data.get('runId', 'N/A')}`"},
                            {"type": "mrkdwn", "text": f"*Status:*\n`{data.get('status', 'completed')}`"},
                            {"type": "mrkdwn", "text": f"*Effort Ratio:*\n`{data.get('effortRatio', 1.0):.2f}x`"},
                            {"type": "mrkdwn", "text": f"*Blockers:*\n`{data.get('blockersCount', 0)}`"}
                        ]
                    }
                ]
            }
            body = slack_payload
        else:
            body = payload

        body_str = json.dumps(body)
        signature = WebhookSigner.sign_payload(secret, body)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "BarrierLens-Webhook/2.6.0",
            "X-BarrierLens-Event": event_type,
            "X-BarrierLens-Timestamp": str(timestamp),
            "X-BarrierLens-Signature": signature
        }

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, content=body_str, headers=headers)
            return {
                "statusCode": resp.status_code,
                "success": 200 <= resp.status_code < 300,
                "response": resp.text[:200]
            }
