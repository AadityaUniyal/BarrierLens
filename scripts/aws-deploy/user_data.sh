#!/bin/bash
set -ex
exec > >(tee /var/log/barrierlens-deploy.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=========================================="
echo "Starting BarrierLens AWS Production Deployment"
echo "=========================================="

export DEBIAN_FRONTEND=noninteractive

# 1. Update OS and install essential system libraries & Playwright Chromium deps
apt-get update -y
apt-get install -y curl wget git nginx build-essential python3 python3-pip python3-venv \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libasound2 libpangocairo-1.0-0 libxshmfence1 libglu1-mesa

# 2. Install Node.js 22.x LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 3. Clone Repository
mkdir -p /opt/barrierlens
cd /opt/barrierlens
git clone https://github.com/AadityaUniyal/BarrierLens.git .

# 4. Write Production .env.local (Populated via AWS SSM Parameter Store / Secrets Manager)
cat << 'EOF' > /opt/barrierlens/.env.local
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres.myowihtgpdncqelxgjwh:${DATABASE_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"}
DIRECT_URL=${DIRECT_URL:-"postgresql://postgres.myowihtgpdncqelxgjwh:${DATABASE_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"}
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-"https://myowihtgpdncqelxgjwh.supabase.co"}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-"sb_publishable_8b-ZqFaWTX7LOBhka0m8yQ_6cZOaSbr"}
SUPABASE_URL=${SUPABASE_URL:-"https://myowihtgpdncqelxgjwh.supabase.co"}
SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY:-"sb_publishable_8b-ZqFaWTX7LOBhka0m8yQ_6cZOaSbr"}
SUPABASE_SECRET_KEY=${SUPABASE_SECRET_KEY}
SUPABASE_JWKS_URL=https://myowihtgpdncqelxgjwh.supabase.co/auth/v1/.well-known/jwks.json
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-"barrierlens_master_production_secret_32_chars"}
BETTER_AUTH_URL=http://localhost:3000
AUTH_RP_ID=localhost
AWS_REGION=ap-south-1
AWS_DEFAULT_REGION=ap-south-1
BEDROCK_REGION=us-east-1
AWS_S3_BUCKET=barrierlens-audit-artifacts-145023097151
S3_ARTIFACTS_BUCKET=barrierlens-audit-artifacts-145023097151
PYTHON_BACKEND_URL=http://127.0.0.1:8000
NODE_ENV=production
EOF

# 5. Install Node Dependencies and Build Next.js
npm install
npm run build
npx playwright install chromium

# 6. Setup Python ML Backend Virtual Environment
cd /opt/barrierlens/backend
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
cd /opt/barrierlens

# 7. Configure Nginx Reverse Proxy
cat << 'EOF' > /etc/nginx/sites-available/barrierlens
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    # Python Backend Reverse Proxy
    location /api/backend/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    # Next.js Application & Serverless APIs
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/barrierlens /etc/nginx/sites-enabled/barrierlens
nginx -t && systemctl restart nginx

# 8. Start Services under PM2 Process Manager
pm2 start npm --name "barrierlens-web" -- start -- -p 3000
pm2 start /opt/barrierlens/backend/venv/bin/uvicorn --name "barrierlens-api" --interpreter none --cwd /opt/barrierlens/backend -- app:app --host 0.0.0.0 --port 8000
pm2 save
pm2 startup systemd -u root --hp /root

echo "=========================================="
echo "BarrierLens AWS Production Deployment Ready!"
echo "=========================================="
