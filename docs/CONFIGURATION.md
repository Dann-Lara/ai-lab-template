# Configuration Guide

> Complete reference for environment variables, Docker setup, n8n, Telegram, and multi-environment deployment.

---

## Table of Contents

1. [How env files work](#1-how-env-files-work)
2. [Root `.env` reference](#2-root-env-reference)
3. [Local development](#3-local-development)
4. [Staging environment](#4-staging-environment)
5. [Production environment](#5-production-environment)
6. [n8n setup](#6-n8n-setup)
7. [Telegram bot](#7-telegram-bot)
8. [Database](#8-database)
9. [AI providers](#9-ai-providers)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. How env files work

```
.env.example          ← template for local dev (committed to git)
.env                  ← your local values (git-ignored)

.env.staging.example  ← template for staging (committed)
.env.staging          ← staging values (git-ignored)

.env.prod.example     ← template for production (committed)
.env.prod             ← production values (git-ignored, use secrets manager)

apps/backend/.env.example  ← for running backend locally outside Docker
apps/backend/.env          ← your local backend-only values (git-ignored)
```

**Rule: only ONE file needs to change per environment.** Docker Compose reads from the root env file. The `apps/backend/.env` is only needed when running the backend with `npm run dev` (outside Docker).

### Which file to edit for what

| I want to change... | Edit this file |
|---|---|
| Anything for local dev (Docker) | `.env` |
| Anything for staging deployment | `.env.staging` |
| Anything for production | `.env.prod` |
| Backend local dev (no Docker) | `apps/backend/.env` |
| Frontend local dev (no Docker) | `apps/frontend/.env.local` |

---

## 2. Root `.env` reference

All variables available, with environment applicability:

| Variable | Dev | Stg | Prod | Description |
|---|---|---|---|---|
| `COMPOSE_PROJECT_NAME` | `ailab` | `ailab_stg` | `ailab_prod` | Docker container prefix |
| `NODE_ENV` | `development` | `staging` | `production` | Runtime mode |
| **Public URLs** | | | | |
| `BACKEND_PUBLIC_URL` | `http://localhost:3001` | `https://api.stg.example.com` | `https://api.example.com` | Backend URL visible from outside |
| `FRONTEND_PUBLIC_URL` | `http://localhost:3000` | `https://stg.example.com` | `https://example.com` | Frontend URL visible from outside |
| `N8N_WEBHOOK_URL` | `http://localhost:5678/` | `https://n8n.stg.example.com/` | `https://n8n.example.com/` | n8n public URL (must end with `/`) |
| **Database** | | | | |
| `DB_USER` | `admin` | `ailab_stg` | `ailab_prod` | PostgreSQL user |
| `DB_PASSWORD` | `secret` | strong password | very strong password | PostgreSQL password |
| `DB_NAME` | `ailab` | `ailab_stg` | `ailab_prod` | PostgreSQL database name |
| **Auth** | | | | |
| `JWT_SECRET` | any string | 32+ random chars | 32+ random chars | Sign JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | `7d` | `1d` | Token expiry |
| **n8n** | | | | |
| `N8N_WEBHOOK_SECRET` | `change-me` | random string | random string | Shared secret backend↔n8n |
| `N8N_ENCRYPTION_KEY` | any 32 chars | random 32 chars | random 32 chars | n8n credential encryption ⚠️ never change after first run |
| `N8N_API_KEY` | _(empty, fill after setup)_ | _(same)_ | _(same)_ | n8n REST API key for `npm run n8n:sync` |
| **Telegram** | | | | |
| `TELEGRAM_BOT_TOKEN` | _(empty or dev bot)_ | _(stg bot)_ | _(prod bot)_ | From @BotFather |
| `TELEGRAM_BOT_USERNAME` | _(empty or dev bot)_ | _(stg bot)_ | _(prod bot)_ | Bot username without @ |
| **AI Providers** | | | | |
| `GEMINI_API_KEY` | your key | your key | your key | Google AI Studio |
| `GROQ_API_KEY` | your key | your key | your key | Groq console |

### Generating strong secrets

```bash
# JWT_SECRET, N8N_ENCRYPTION_KEY, N8N_WEBHOOK_SECRET, etc.
openssl rand -base64 32

# Or with Node:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Local development

```bash
# 1. Copy template
cp .env.example .env

# 2. Set at least one AI key
# Edit .env → set GEMINI_API_KEY or GROQ_API_KEY

# 3. Run setup (handles everything)
npm run setup

# 4. Start dev servers
npm run dev
```

### What `npm run setup` does

1. Checks Node.js 20+ and Docker
2. Installs npm dependencies
3. Copies `.env.example` → `.env` (if not exists)
4. Starts PostgreSQL + Redis via Docker
5. Runs database migrations (if any)
6. Starts n8n via Docker
7. Runs `npm run n8n:sync` to push workflows + variables

### Services after setup

| Service | URL | Credentials |
|---|---|---|
| Frontend | http://localhost:3000 | — |
| Backend API | http://localhost:3001 | — |
| Swagger | http://localhost:3001/api | — |
| n8n | http://localhost:5678 | admin / admin123 |
| PostgreSQL | localhost:5432 | admin / secret |
| Redis | localhost:6379 | no password |

---

## 4. Staging environment

```bash
# 1. Copy and fill staging template
cp .env.staging.example .env.staging
# Edit .env.staging — change every [CHANGE] value

# 2. Deploy
docker compose \
  --env-file .env.staging \
  -f docker-compose.yml \
  -f docker-compose.staging.yml \
  up -d

# 3. Sync n8n workflows (from your local machine or CI)
N8N_URL=https://n8n.stg.yourdomain.com \
N8N_API_KEY=your-key \
BACKEND_PUBLIC_URL=https://api.stg.yourdomain.com \
N8N_WEBHOOK_SECRET=your-secret \
node scripts/sync-n8n-workflows.js
```

### Recommended staging setup

- Separate Telegram bot from production
- Separate database from production  
- Same AI provider keys are fine (or create free-tier keys per env)
- n8n behind a reverse proxy (nginx/Caddy/Traefik) — staging compose disables direct port exposure

---

## 5. Production environment

```bash
# 1. Copy and fill production template
cp .env.prod.example .env.prod
# Edit .env.prod — change EVERY value

# 2. Deploy
docker compose \
  --env-file .env.prod \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d

# 3. After first deploy: create n8n API key
#    n8n UI → Settings → n8n API → Create API Key
#    Add to .env.prod:  N8N_API_KEY=n8n_api_xxxx
#    Redeploy: docker compose --env-file .env.prod ... up -d

# 4. Sync workflows
N8N_URL=https://n8n.yourdomain.com \
N8N_API_KEY=your-key \
BACKEND_PUBLIC_URL=https://api.yourdomain.com \
N8N_WEBHOOK_SECRET=your-secret \
node scripts/sync-n8n-workflows.js
```

### Production checklist

- [ ] `JWT_SECRET` — strong random 32+ chars
- [ ] `N8N_ENCRYPTION_KEY` — set once, never change
- [ ] `DB_PASSWORD` — strong, unique
- [ ] `REDIS_PASSWORD` — set (used by `docker-compose.prod.yml`)
- [ ] `SUPERADMIN_PASSWORD` — changed from default
- [ ] `CORS_ORIGINS` — set to your actual domain
- [ ] Telegram bot — production bot, separate from dev/stg
- [ ] AI keys — production keys with billing limits set
- [ ] `.env.prod` — NOT committed to git
- [ ] Backups — PostgreSQL volume backed up

### Secrets management (recommended)

Instead of `.env.prod` on the server, use:
- **Doppler** (easiest): `doppler run -- docker compose up -d`
- **AWS SSM Parameter Store**: inject via ECS task definition
- **HashiCorp Vault**: inject via Vault agent
- **Docker Secrets**: for Swarm deployments

---

## 6. n8n setup

### How variables work in workflows

Workflows use `$vars.BACKEND_PUBLIC_URL` (n8n Variables) instead of hardcoded URLs. The `npm run n8n:sync` script automatically creates/updates these variables in n8n via the API.

**Never use `$env.*` in workflow expressions** — it's disabled by default for security in n8n >= 1.0.

```
# In workflow expressions:
✅  $vars.BACKEND_PUBLIC_URL      # correct — synced from your .env
❌  $env.BACKEND_PUBLIC_URL       # disabled in n8n 1.x
❌  http://localhost:3001         # hardcoded — breaks in staging/prod
```

### Variables synced automatically

| n8n Variable | Source | Used for |
|---|---|---|
| `BACKEND_PUBLIC_URL` | `.env` → `BACKEND_PUBLIC_URL` | HTTP Request node URLs |
| `N8N_WEBHOOK_SECRET` | `.env` → `N8N_WEBHOOK_SECRET` | Backend webhook auth header |

### Re-sync after changing URLs

```bash
# After changing BACKEND_PUBLIC_URL in .env:
npm run n8n:sync

# For staging/prod, pass env vars explicitly:
BACKEND_PUBLIC_URL=https://api.example.com \
N8N_WEBHOOK_SECRET=your-secret \
N8N_API_KEY=your-api-key \
N8N_URL=https://n8n.example.com \
node scripts/sync-n8n-workflows.js
```

### Creating the n8n API key

1. Open n8n UI → **Settings** → **n8n API**
2. Click **Create API Key**
3. Copy the key (starts with `n8n_api_`)
4. Add to `.env`: `N8N_API_KEY=n8n_api_xxxx`
5. Run `npm run n8n:sync` again

Without an API key, the sync falls back to basic auth (N8N_USER / N8N_PASSWORD). Basic auth works but an API key is more reliable.

### Workflow credentials (manual step)

After sync, workflows exist in n8n but need credentials:

**1. Backend Webhook Secret**
- n8n UI → Credentials → New → **HTTP Header Auth**
- Name: `Backend Webhook Secret`
- Header name: `x-webhook-secret`
- Header value: your `N8N_WEBHOOK_SECRET`

**2. Telegram Bot**
- n8n UI → Credentials → New → **Telegram**
- Name: `Telegram Bot`
- Token: your `TELEGRAM_BOT_TOKEN`

**3. Activate Telegram workflow**
- Open "02 - Telegram Responses"
- Assign credentials to each node
- Toggle **Active ON**
- n8n registers the webhook with Telegram automatically

### Workflows overview

| File | Name | Trigger | Auto-activated |
|---|---|---|---|
| `01-checklist-reminders.json` | Recordatorios | Every hour | ✅ yes |
| `02-telegram-responses.json` | Respuestas Telegram | Bot webhook | ⚠️ manual (needs credentials) |
| `03-weekly-feedback.json` | Feedback semanal | Sunday 20:00 | ✅ yes |

---

## 7. Telegram bot

### Creating the bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g. "AI Lab") and username (e.g. `MyAiLabBot`)
4. BotFather gives you a token: `1234567890:AABBcc...`

### Configuring the bot

In your `.env`:
```env
TELEGRAM_BOT_TOKEN=1234567890:AABBcc...
TELEGRAM_BOT_USERNAME=MyAiLabBot
```

In n8n: add as a Telegram credential (see section 6).

### How users get their Chat ID

1. User opens Telegram → searches for your bot
2. User sends `/start`
3. Bot replies with their Chat ID (handled by workflow 02)
4. User copies the ID and pastes it in their AI Lab profile

### Separate bots per environment (recommended)

```bash
# Create 3 bots via @BotFather:
#   MyAiLabDevBot     → TELEGRAM_BOT_TOKEN in .env
#   MyAiLabStagingBot → TELEGRAM_BOT_TOKEN in .env.staging
#   MyAiLabBot        → TELEGRAM_BOT_TOKEN in .env.prod
```

---

## 8. Database

### Local development

TypeORM runs with `synchronize: true` in development — schema is auto-updated. No manual migrations needed for dev.

### Staging / Production

Use migrations:
```bash
npm run db:migrate
```

### Accessing the database

```bash
# Local (Docker)
docker compose exec postgres psql -U admin -d ailab

# Or with a GUI: TablePlus, pgAdmin, DBeaver
# Host: localhost  Port: 5432  User: admin  Password: secret  DB: ailab
```

### Backup (production)

```bash
# Backup
docker compose exec postgres pg_dump -U ailab_prod ailab_prod > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U ailab_prod ailab_prod < backup_20240301.sql
```

---

## 9. AI providers

The backend tries providers in priority order, falling back automatically if one fails.

**Default priority:** Gemini → Groq → OpenAI → DeepSeek → Anthropic

```env
# Override priority (in .env):
AI_PROVIDER_PRIORITY=openai,gemini,groq
```

| Provider | Free tier | Speed | Best for |
|---|---|---|---|
| Google Gemini | ✅ generous | Fast | Starting point |
| Groq | ✅ fast | Very fast | Low latency |
| OpenAI | ❌ | Fast | Quality |
| DeepSeek | ✅ cheap | Medium | Cost efficiency |
| Anthropic | ❌ | Medium | Long context |

Check active providers at runtime:
```
GET /v1/ai/providers
Authorization: Bearer <token>
```

---

## 10. Troubleshooting

### n8n workflows not running

```bash
# Check n8n is up
docker compose ps n8n
docker compose logs n8n --tail=50

# Re-sync workflows
npm run n8n:sync

# Check n8n Variables were set
# n8n UI → Settings → Variables
# You should see BACKEND_PUBLIC_URL and N8N_WEBHOOK_SECRET
```

### n8n can't reach backend

The internal Docker URL for backend is `http://backend:3001` (Docker DNS). The workflows use `$vars.BACKEND_PUBLIC_URL` which should be `http://localhost:3001` in dev. This works because n8n and the backend are on the same Docker network.

If n8n is running outside Docker and calling `localhost:3001`, that's fine for local dev. In production, `BACKEND_PUBLIC_URL` must be the public HTTPS URL.

### Telegram messages not arriving

1. Check `TELEGRAM_BOT_TOKEN` in `.env`
2. Check the Telegram credential in n8n matches the token
3. Check the user has configured their Chat ID in their profile
4. Check workflow 02 is active in n8n
5. Check n8n logs: `docker compose logs n8n --tail=100`

### Backend can't connect to database

```bash
# Check postgres is running
docker compose ps postgres

# Check DATABASE_URL format
# Docker: postgresql://admin:secret@postgres:5432/ailab  (use 'postgres' not 'localhost')
# Local:  postgresql://admin:secret@localhost:5432/ailab
```

### JWT errors after deployment

If you changed `JWT_SECRET`, all existing tokens are invalidated. Users must log in again. This is expected.

### n8n encryption key warning

If n8n warns about `N8N_ENCRYPTION_KEY`, you may have changed it after credentials were saved. Restore the original key — changing it makes saved credentials unreadable.
