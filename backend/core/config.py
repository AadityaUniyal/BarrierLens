"""
BarrierLens Core Configuration & Credential Manager
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional

# Automatically resolve root .env.local and .env
root_dir = Path(__file__).resolve().parent.parent.parent
for env_name in [".env.local", ".env"]:
    env_path = root_dir / env_name
    if env_path.exists():
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k_clean = k.strip()
                    v_clean = v.strip().strip("'\"")
                    os.environ.setdefault(k_clean, v_clean)

class CoreConfig:
    # AWS Bedrock
    AWS_ACCESS_KEY_ID: Optional[str] = os.environ.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.environ.get("AWS_SECRET_ACCESS_KEY")
    BEDROCK_REGION: str = os.environ.get("BEDROCK_REGION", "us-east-1")
    MODEL_PLANNING: str = "amazon.nova-pro-v1:0"
    MODEL_ROUTINE: str = "amazon.nova-micro-v1:0"

    # Neon PostgreSQL
    DATABASE_URL: Optional[str] = os.environ.get("DATABASE_URL")

    # API Server
    HOST: str = os.environ.get("HOST", "127.0.0.1")
    PORT: int = int(os.environ.get("PORT", "8000"))

    @classmethod
    def is_aws_configured(cls) -> bool:
        return bool(cls.AWS_ACCESS_KEY_ID and cls.AWS_SECRET_ACCESS_KEY)

    @classmethod
    def is_neon_configured(cls) -> bool:
        return bool(cls.DATABASE_URL)
