# =========================================================================
# BarrierLens Python FastAPI ML Backend Container Image
# Provides GPU-accelerated MiniLM embeddings, CLIP, and Conformal Predictor
# =========================================================================

FROM python:3.11-slim

WORKDIR /app

# Install system utilities & browser dependencies for Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Install Playwright browser binary for Python inspector
RUN playwright install --with-deps chromium || true

# Copy backend source tree
COPY backend/ ./backend/

ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

# Start FastAPI production server with Uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
