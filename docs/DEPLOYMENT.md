# Deployment Guide — Staging & Production

> Complete guide for deploying AI Lab Template on real servers.

---

## 1. Environment Overview

| Environment | Branch  | Domain example              | Purpose                        |
|-------------|---------|----------------------------|-------------------------------|
| Local dev   | any     | localhost:3000 / :3001     | Development + feature testing  |
| Staging     | `develop` | stg.yourdomain.com        | QA, n8n testing, client demos  |
| Production  | `main`  | app.yourdomain.com          | Live users                     |

---

## 2. Minimum Server Requirements

### Option A — Single VPS (recommended for staging, small prod)
| Spec      | Minimum       | Recommended          |
|-----------|--------------|---------------------|
| CPU       | 2 vCPU       | 4 vCPU              |
| RAM       | 4 GB         | 8 GB                |
| Disk      | 40 GB SSD    | 80 GB SSD           |
| OS        | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

**Providers that work well:** Hetzner Cloud (CX21/CX31), DigitalOcean Droplet, Vultr, Linode, AWS EC2 t3.medium

### Option B — Separate services (production at scale)
| Service    | Recommended                                 |
|------------|---------------------------------------------|
| Backend    | Any VPS or AWS ECS / Railway / Render       |
| Frontend   | Vercel (zero config) or same VPS via nginx  |
| Database   | Managed: AWS RDS, Supabase, Neon, PlanetScale|
| n8n        | n8n Cloud OR dedicated VPS (2 CPU, 2 GB RAM)|
| Redis      | Upstash (serverless) or same VPS            |

---

## 3. Required Environment Variables

### apps/backend/.env

```bash
# ─── Database ────────────────────────────────────────────────────────────
# Option 1: Full connection string (preferred)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

# Option 2: Individual params (used if DATABASE_URL not set)
DB_HOST=localhost
DB_PORT=5432
DB_USER=ailab
DB_PASSWORD=STRONG_RANDOM_PASSWORD_HERE
DB_NAME=ailab_prod

# ─── Redis (used for throttling / session cache) ──────────────────────────
REDIS_URL=redis://localhost:6379
# Or with auth: redis://:password@host:6379

# ─── Auth ────────────────────────────────────────────────────────────────
JWT_SECRET=MINIMUM_64_CHAR_RANDOM_STRING_GENERATE_WITH_openssl_rand_hex_32
JWT_EXPIRES_IN=7d

# ─── App ─────────────────────────────────────────────────────────────────
NODE_ENV=production          # or: staging
PORT=3001
FRONTEND_URL=https://app.yourdomain.com   # no trailing slash

# ─── n8n Integration ─────────────────────────────────────────────────────
N8N_WEBHOOK_SECRET=RANDOM_SECRET_SHARED_WITH_N8N
# This value must match the "Header Auth" credential value in all n8n workflows

# ─── Telegram Bot ────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxyz
# Get from @BotFather on Telegram

# ─── AI Providers (add at least ONE) ─────────────────────────────────────
GEMINI_API_KEY=AIza...          # Google AI Studio — free tier available
GROQ_API_KEY=gsk_...            # Groq — very fast, free tier
OPENAI_API_KEY=sk-...           # OpenAI — requires billing
DEEPSEEK_API_KEY=sk-...         # DeepSeek — very cheap
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic Claude
```

### apps/frontend/.env.local (or .env.production)

```bash
# ─── Backend API ─────────────────────────────────────────────────────────
# Internal URL used by Next.js server → backend (same network = faster)
BACKEND_URL=http://localhost:3001
# Or on separate servers: BACKEND_URL=http://10.0.0.5:3001

# Public URL shown in browser-side requests (must be HTTPS in prod)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# ─── App ─────────────────────────────────────────────────────────────────
NODE_ENV=production
NEXTAUTH_URL=https://app.yourdomain.com   # if using NextAuth
```

### n8n Environment Variables (set in n8n Settings > Variables)

```
BACKEND_PUBLIC_URL = https://api.yourdomain.com
```

> ⚠️ This must be the **public** backend URL — n8n calls it externally.

---

## 4. Generating Secure Secrets

```bash
# JWT_SECRET (64 chars minimum)
openssl rand -hex 32

# N8N_WEBHOOK_SECRET
openssl rand -hex 24

# DB_PASSWORD
openssl rand -base64 32 | tr -d '=+/' | head -c 32
```

---

## 5. Docker Compose Deployment (Recommended)

### 5.1 Staging

```bash
# Clone repository
git clone https://github.com/yourorg/ai-lab-template.git
cd ai-lab-template
git checkout develop

# Create env files from examples
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# Edit with real values
nano apps/backend/.env

# Start staging stack (includes n8n)
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Check logs
docker compose logs -f backend
docker compose logs -f frontend
```

### 5.2 Production

```bash
git checkout main

# Edit production env files
nano apps/backend/.env   # NODE_ENV=production

# Start production stack (no n8n — use n8n Cloud or separate VPS)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run DB migrations
docker compose exec backend npm run migration:run
```

---

## 6. Database

### PostgreSQL on the same server (Docker)
Already included in `docker-compose.yml`. Password set via `DB_PASSWORD` env var.

### Managed PostgreSQL (recommended for prod)

| Provider    | Free tier | Notes                            |
|-------------|-----------|----------------------------------|
| Supabase    | 500 MB    | Includes connection pooling      |
| Neon        | 512 MB    | Serverless, auto-pause           |
| Railway     | $5/mo     | Simple, great DX                 |
| AWS RDS     | No        | Most reliable, higher cost       |

After provisioning, set `DATABASE_URL` with the connection string provided.

### Migrations
```bash
# Generate migration after entity changes
npm run migration:generate -- --name AddTelegramChatId

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

## 7. n8n Setup

### Option A — n8n Cloud (easiest)
1. Sign up at [n8n.io](https://n8n.io)
2. Import workflow JSONs from `n8n-workflows/`
3. Create credentials:
   - **Header Auth** (name: "Header Auth account"): Header = `x-webhook-secret`, Value = your `N8N_WEBHOOK_SECRET`
   - **Telegram API** (name: "Telegram account"): Bot token = your `TELEGRAM_BOT_TOKEN`
4. Set variable `BACKEND_PUBLIC_URL` in n8n Settings > Variables

### Option B — Self-hosted n8n on same VPS
Already included in `docker-compose.staging.yml`.

```bash
# Access n8n
open http://YOUR_SERVER_IP:5678

# Webhook URL base (set in n8n Settings > General)
WEBHOOK_URL=http://YOUR_SERVER_IP:5678/
```

### Workflow Import Order
1. `01-checklist-reminders.json` — daily scheduler
2. `02-telegram-responses.json` — button callbacks  
3. `03-weekly-feedback.json` — Sunday AI feedback

### Credential IDs
After importing, update credential IDs in workflows to match your n8n instance:
- The JSONs reference IDs `EfBrBbQ88fwJlS4R` (Header Auth) and `8JyddEiApG6k1J3x` (Telegram)
- n8n will auto-prompt to relink credentials on import

---

## 8. Reverse Proxy (nginx)

```nginx
# /etc/nginx/sites-available/ailab

# Frontend
server {
    server_name app.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable and get SSL
certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

---

## 9. HTTPS / SSL

**Required for production** (Telegram webhooks require HTTPS).

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates (replace domains)
sudo certbot --nginx \
  -d app.yourdomain.com \
  -d api.yourdomain.com

# Auto-renew (runs via systemd timer automatically after certbot install)
sudo certbot renew --dry-run
```

---

## 10. Health Checks & Monitoring

```bash
# Backend health
curl https://api.yourdomain.com/health

# Expected: { "status": "ok", "database": "connected", "ai": ["gemini","groq"] }

# Check logs
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend

# Database connection test
docker compose exec backend node -e "
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  c.connect().then(() => console.log('DB OK')).catch(e => console.error(e));
"
```

---

## 11. Staging vs Production Differences

| Config             | Staging                    | Production                  |
|--------------------|----------------------------|-----------------------------|
| `NODE_ENV`         | `staging`                  | `production`                |
| DB                 | Local Docker Postgres       | Managed (Supabase/RDS)      |
| n8n                | Self-hosted (same compose) | n8n Cloud or dedicated VPS  |
| SSL                | Optional (dev only)        | **Required**                |
| Log level          | `debug`                    | `warn`                      |
| JWT expiry         | `7d`                       | `1d` (more secure)          |
| Rate limits        | relaxed                    | strict (default config)     |
| Admin seed         | `superadmin@ailab.dev`     | Change immediately!         |

---

## 12. First Deploy Checklist

- [ ] All env vars set (no defaults from `.env.example` remain)
- [ ] `JWT_SECRET` is at least 64 chars and random
- [ ] `N8N_WEBHOOK_SECRET` set and matches n8n credential
- [ ] `TELEGRAM_BOT_TOKEN` set and bot is active
- [ ] At least one AI provider key set (`GEMINI_API_KEY` recommended — free)
- [ ] Database migrations run successfully
- [ ] HTTPS configured (required for Telegram)
- [ ] n8n workflows imported and credentials relinked
- [ ] n8n `BACKEND_PUBLIC_URL` variable points to HTTPS backend URL
- [ ] Default admin password changed from seed value
- [ ] Backup strategy configured for PostgreSQL

---

## 13. Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `SASL: client password must be a string` | `DB_PASSWORD` not loaded | Check `.env` path and `DATABASE_URL` |
| `401 Invalid webhook secret` | n8n cred value ≠ `N8N_WEBHOOK_SECRET` | Sync both values |
| `Could not find property option` (n8n) | Wrong scheduleTrigger format | Use `cronExpression` field |
| `Telegram: bot was blocked` | User blocked the bot | Nothing — user must unblock |
| `AI generation limit reached` | Rate limit hit | Wait 1 hour or increase limit in service |
| `Cannot find module '@ai-lab/ai-core'` | Packages not built | `npm run build` from repo root |
