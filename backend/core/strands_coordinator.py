"""
BarrierLens AWS Strands Multi-Agent Coordinator
Orchestrates Bedrock Nova Pro and Nova Micro model inference.
"""

import json
import boto3
from typing import Dict, Any, Optional
from core.config import CoreConfig

class StrandsCoordinator:
    def __init__(self):
        self.config = CoreConfig
        self.bedrock_client = boto3.client(
            "bedrock-runtime",
            region_name=self.config.BEDROCK_REGION,
            aws_access_key_id=self.config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=self.config.AWS_SECRET_ACCESS_KEY
        )

    def invoke_nova(self, prompt: str, model_type: str = "micro", max_tokens: int = 150) -> str:
        """
        Invokes Amazon Nova Micro ($0.000035/1K) or Nova Pro ($0.0008/1K) with sub-second latency.
        """
        model_id = self.config.MODEL_PLANNING if model_type == "pro" else self.config.MODEL_ROUTINE
        try:
            body = json.dumps({
                "messages": [{"role": "user", "content": [{"text": prompt}]}],
                "inferenceConfig": {"max_new_tokens": max_tokens, "temperature": 0.1}
            })
            response = self.bedrock_client.invoke_model(
                modelId=model_id,
                body=body,
                contentType="application/json",
                accept="application/json"
            )
            res_json = json.loads(response["body"].read().decode("utf-8"))
            return res_json["output"]["message"]["content"][0]["text"].strip()
        except Exception as e:
            return f"[Bedrock Nova Swarm Fallback]: {str(e)}"
