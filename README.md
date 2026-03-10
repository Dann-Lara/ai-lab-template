# AI Lab Template

> Fullstack AI monorepo — Next.js · NestJS · LangChain · n8n · Turborepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Quick Start

> **Requires**: Node.js 20+, Docker Desktop running

```bash
git clone <repo>
cd ai-lab-template
npm run setup          # installs deps, starts Docker, migrates DB, syncs n8n workflows
```

Then set at least one AI provider key:

```env
# .env
GEMINI_API_KEY=your-key    # free tier — https://aistudio.google.com/app/apikey
```

```bash
npm run dev            # frontend :3000 · backend :3001
```

| Service | URL | Default credentials |
|---|---|---|
| Frontend | http://localhost:3000 | — |
| Backend / Swagger | http://localhost:3001/api | — |
| n8n | http://localhost:5678 | admin / admin123 |
| Superadmin | http://localhost:3000 | superadmin@ailab.dev / SuperAdmin123! |

> **Full configuration guide** → [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md)

---

## Environments

One env file per environment — only URLs and secrets change:

```bash
# Development (default)
cp .env.example .env
npm run setup

# Staging
cp .env.staging.example .env.staging
# edit .env.staging → change URLs + secrets
docker compose --env-file .env.staging -f docker-compose.yml -f docker-compose.staging.yml up -d

# Production
cp .env.prod.example .env.prod
# edit .env.prod → change EVERY value
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d
```

See [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) for the full reference.

---

## Applications Module

The built-in job applications assistant demonstrates every architectural layer:

| Feature | Description |
|---------|-------------|
| Base CV | ATS-scored form (score ≥ 85 to save). Field-level color feedback. |
| Hybrid CV | Dual-language (ES + EN) ATS-optimized CV generation from base CV + job offer |
| Editable CVs | User reviews and edits AI output before saving/printing |
| PDF Export | ATS-clean print (no browser headers/footers, single column, Arial font) |
| Interview Q&A | AI answers pasted interview questions using the tailored CV as context |
| Applied-from | Track application source (LinkedIn, Indeed, etc.) per application |

> Technical details → [`docs/TECHNICAL.md`](docs/TECHNICAL.md)

---

## AI Providers

Multiple providers with **automatic fallback** — if one fails (quota, rate limit, key error), the next is tried automatically.

| Provider | Free tier | Env var | Default model |
|---|---|---|---|
| Google Gemini | ✅ | `GEMINI_API_KEY` | `gemini-2.0-flash` |
| Groq | ✅ fast | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| OpenAI | ❌ | `OPENAI_API_KEY` | `gpt-4o-mini` |
| DeepSeek | ✅ cheap | `DEEPSEEK_API_KEY` | `deepseek-chat` |
| Anthropic | ❌ | `ANTHROPIC_API_KEY` | `claude-3-haiku` |

Override priority: `AI_PROVIDER_PRIORITY=openai,gemini,groq`

Check active providers: `GET /v1/ai/providers`

---

## Auth & Roles

| Role | Created by | Panel | Access |
|---|---|---|---|
| `superadmin` | Auto on startup | `/admin` | Full access |
| `admin` | By superadmin | `/admin` | Manage clients |
| `client` | Self signup | `/client` | AI tools + Checklists |

Default dev superadmin: `superadmin@ailab.dev` / `SuperAdmin123!`

---

## Features

### Intelligent Checklist (`/checklists`)
- AI-generated task lists: 5-step flow (questionnaire → AI → editor → confirm → done)
- Task completion, postpone, skip from web and Telegram
- Progress dashboard: completion ring, 14-day activity chart
- Weekly AI feedback (coaching)
- Telegram reminders via n8n — automated, no code

### AI Tools
- Text generation (prompt + system message + temperature)
- Text summarization (language-aware)

### n8n Automation
- 3 pre-built workflows pushed automatically on `npm run setup`
- Variables (`$vars.*`) synced from your `.env` — no hardcoded URLs
- Re-sync anytime: `npm run n8n:sync`

---

## n8n Workflows

Workflows are automatically pushed to n8n on setup. Variables like `BACKEND_PUBLIC_URL` are injected as n8n Variables (`$vars.*`) so workflows work across dev/stg/prod without changes.

| Workflow | Trigger | Auto-activated |
|---|---|---|
| Checklist Reminders | Every hour | ✅ |
| Telegram Responses (complete/postpone) | Bot webhook | ⚠️ after credentials |
| Weekly AI Feedback | Sunday 20:00 | ✅ |

After setup, add two credentials in n8n UI:
1. **HTTP Header Auth** → name `Backend Webhook Secret`, header `x-webhook-secret`
2. **Telegram** → name `Telegram Bot`, token from @BotFather

See [`n8n-workflows/SETUP.md`](n8n-workflows/SETUP.md) for step-by-step.

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/login` | Public | Login → access + refresh tokens |
| POST | `/v1/auth/signup` | Public | Create client account |
| POST | `/v1/auth/refresh` | — | Refresh access token |
| GET | `/v1/auth/me` | JWT | Current user info |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/users/me` | JWT | Own profile |
| PATCH | `/v1/users/me` | JWT | Update name / telegramChatId |
| GET | `/v1/users` | admin+ | List all users |
| PATCH | `/v1/users/:id/active` | superadmin | Activate / deactivate user |

### AI
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/ai/generate` | JWT | Generate text |
| POST | `/v1/ai/summarize` | JWT | Summarize text |
| GET | `/v1/ai/providers` | JWT | List active providers |

### Checklists
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/checklists/generate-draft` | JWT | AI-generate draft |
| POST | `/v1/checklists/regenerate-draft` | JWT | Regenerate with feedback |
| POST | `/v1/checklists/confirm` | JWT | Save confirmed checklist |
| GET | `/v1/checklists` | JWT | List user's checklists |
| GET | `/v1/checklists/:id` | JWT | Get with items |
| PATCH | `/v1/checklists/:id` | JWT | Update status/title |
| DELETE | `/v1/checklists/:id` | JWT | Delete |
| PATCH | `/v1/checklists/:id/items/:itemId` | JWT | Complete/postpone/skip |
| GET | `/v1/checklists/:id/progress` | JWT | Dashboard data |
| POST | `/v1/checklists/:id/feedback` | JWT | Generate AI feedback |
| GET | `/v1/checklists/reminders/due` | webhook-secret | Due tasks for n8n |

### Webhooks (n8n integration)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/webhooks/n8n` | webhook-secret | Receive events from n8n |
| POST | `/v1/webhooks/telegram-response` | webhook-secret | Telegram button callbacks |

---

## Project Structure

```
ai-lab-template/
├── apps/
│   ├── frontend/              Next.js 14
│   │   ├── app/
│   │   │   ├── admin/         Admin panel + profile
│   │   │   ├── client/        Client panel
│   │   │   └── checklists/    Checklist pages
│   │   ├── components/
│   │   │   ├── ui/            Navbar, Footer, Modals, ThemeToggle
│   │   │   └── checklists/    TaskCard, ProgressRing, StepIndicator
│   │   └── lib/
│   │       ├── i18n/          Translation modules (ES/EN)
│   │       └── i18n-context   React context
│   └── backend/               NestJS 10
│       └── src/modules/
│           ├── checklists/    AI generation + CRUD + reminders
│           ├── ai/            Multi-provider LLM proxy
│           ├── auth/          JWT + refresh + role guards
│           ├── users/         User management + profile
│           └── webhooks/      n8n + Telegram integration
├── packages/
│   ├── ai-core/               Multi-provider LLM engine with fallback
│   └── shared/                Shared types and DTOs
├── n8n-workflows/             n8n JSON exports (auto-pushed by npm run n8n:sync)
├── docs/                      Guides and references
│   └── CONFIGURATION.md       ← Full env + deployment guide
├── scripts/
│   ├── setup.sh               Unix setup script
│   ├── setup.ps1              Windows PowerShell setup
│   └── sync-n8n-workflows.js  n8n workflow sync
├── docker-compose.yml         Base (all environments)
├── docker-compose.override.yml  Dev hot-reload (auto-loaded)
├── docker-compose.staging.yml   Staging overrides
├── docker-compose.prod.yml      Production overrides
├── .env.example               Dev template
├── .env.staging.example       Staging template
└── .env.prod.example          Production template
```

---

## Database

| Table | Description |
|---|---|
| `users` | Auth + roles + telegramChatId |
| `checklists` | Checklist metadata, config, reminder prefs |
| `checklist_items` | Individual tasks with frequency/status/dueDate |
| `checklist_feedbacks` | AI-generated weekly feedback |

---

## Scripts

| Command | Description |
|---|---|
| `npm run setup` | Full setup: deps + Docker + DB + n8n workflows |
| `npm run dev` | Start frontend + backend in watch mode |
| `npm run n8n:sync` | Push/update n8n workflows and variables |
| `npm run build` | Build all packages |
| `npm run docker:up` | Start all Docker services |
| `npm run docker:down` | Stop all Docker services |
| `npm run db:migrate` | Run database migrations |
| `npm run lint` | Lint all packages |
| `npm run test` | Run all tests |

---

## i18n

All UI text is in `apps/frontend/lib/i18n/` — split into modules:

| Module | Contents |
|---|---|
| `common.ts` | Shared labels, nav, footer |
| `auth.ts` | Login, signup |
| `checklist.ts` | All checklist UI |
| `profile.ts` | Profile page |
| `telegram.ts` | Telegram help modal |
| `dashboard.ts` | Admin/client panels |
| `users.ts` | User management |

Add a new section: create `lib/i18n/mysection.ts`, export ES/EN objects, add to `index.ts`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
