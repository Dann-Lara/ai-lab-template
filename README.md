# AI Lab Template

> Fullstack AI monorepo — Next.js · NestJS · LangChain · n8n · Turborepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Quick Start

> **Docker must be running before `npm run dev`**

```bash
git clone <repo>
cd ai-lab-template
npm run setup          # installs deps, starts Docker, seeds superadmin
# Edit apps/backend/.env → set at least one AI provider key (see AI Providers)
npm run dev            # starts frontend (3000) + backend (3001)
```

---

## AI Providers

The monorepo supports multiple AI providers with **automatic fallback**. If a provider fails (quota exceeded, bad key, rate limit), the next one is tried automatically.

Set one or more keys in `apps/backend/.env`:

| Provider   | Env Var              | Default Model             | Free Tier |
|------------|----------------------|---------------------------|-----------|
| Google Gemini | `GEMINI_API_KEY`  | `gemini-2.0-flash`        | Yes       |
| Groq       | `GROQ_API_KEY`       | `llama-3.1-70b-versatile` | Yes       |
| OpenAI     | `OPENAI_API_KEY`     | `gpt-4o-mini`             | No        |
| DeepSeek   | `DEEPSEEK_API_KEY`   | `deepseek-chat`           | Cheap     |
| Anthropic  | `ANTHROPIC_API_KEY`  | `claude-3-haiku`          | No        |

**Priority order** (default): Gemini → Groq → OpenAI → DeepSeek → Anthropic

Override priority without changing code:
```env
AI_PROVIDER_PRIORITY=openai,gemini,groq
```

Check active providers at runtime:
```
GET /v1/ai/providers
```

---

## Auth & Roles

| Role         | Created by      | Panel       | Access                         |
|-------------|-----------------|-------------|-------------------------------|
| `superadmin` | Auto on startup | `/admin`    | All — creates admin/client    |
| `admin`      | By superadmin   | `/admin`    | Create/manage clients         |
| `client`     | Self (signup)   | `/client`   | AI tools + Checklists         |

**Default superadmin** (dev):
```
email:    superadmin@ailab.dev
password: SuperAdmin123!
```
> Change `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` in `apps/backend/.env` before production.

---

## Features

### Intelligent Checklist (`/checklists`)
AI-generated personalized task lists with:
- 5-step creation flow: questionnaire → AI generation → drag-and-drop editor → confirm → done
- Regeneration with user feedback
- Task completion, postpone, skip — from web and Telegram
- Progress dashboard: completion ring, 14-day activity chart
- Weekly AI feedback (motivational coaching)
- Telegram reminders via n8n webhooks

### AI Tools (`/admin`, `/client`)
- Text generation (configurable prompt + system message + temperature)
- Text summarization (language-aware)

---

## API Endpoints

### Auth
| Method | Path                | Auth        | Description                      |
|--------|---------------------|-------------|----------------------------------|
| POST   | `/v1/auth/signup`   | Public      | Create client account            |
| POST   | `/v1/auth/login`    | Public      | Returns access + refresh tokens  |
| POST   | `/v1/auth/refresh`  | —           | Refresh access token             |
| GET    | `/v1/auth/me`       | JWT         | Current user info                |
| POST   | `/v1/auth/users`    | admin+      | Create admin/client user         |

### AI
| Method | Path                  | Auth | Description                   |
|--------|-----------------------|------|-------------------------------|
| POST   | `/v1/ai/generate`     | JWT  | Generate text                 |
| POST   | `/v1/ai/summarize`    | JWT  | Summarize text                |
| GET    | `/v1/ai/providers`    | JWT  | List active providers         |

### Checklists
| Method | Path                               | Auth | Description                        |
|--------|------------------------------------|------|------------------------------------|
| POST   | `/v1/checklists/generate-draft`    | JWT  | AI-generate draft tasks            |
| POST   | `/v1/checklists/regenerate-draft`  | JWT  | Regenerate with user feedback      |
| POST   | `/v1/checklists/confirm`           | JWT  | Save confirmed checklist           |
| GET    | `/v1/checklists`                   | JWT  | List user checklists               |
| GET    | `/v1/checklists/:id`               | JWT  | Get checklist with items           |
| PATCH  | `/v1/checklists/:id`               | JWT  | Update status / title              |
| DELETE | `/v1/checklists/:id`               | JWT  | Delete checklist                   |
| PATCH  | `/v1/checklists/:id/items/:itemId` | JWT  | Complete / postpone / skip task    |
| GET    | `/v1/checklists/:id/progress`      | JWT  | Progress data for dashboard        |
| POST   | `/v1/checklists/:id/feedback`      | JWT  | Generate AI weekly feedback        |
| GET    | `/v1/checklists/reminders/due`     | —    | Due tasks for n8n automation       |

---

## Services

| Service    | URL                              |
|------------|----------------------------------|
| Frontend   | http://localhost:3000            |
| Backend    | http://localhost:3001            |
| Swagger    | http://localhost:3001/api        |
| n8n        | http://localhost:5678            |
| PostgreSQL | localhost:5432                   |
| Redis      | localhost:6379                   |

---

## Structure

```
ai-lab-template/
├── apps/
│   ├── frontend/          Next.js 14 — pages, components, i18n, theme
│   │   ├── app/
│   │   │   ├── checklists/         Checklist feature pages
│   │   │   ├── admin/              Admin panel
│   │   │   └── client/             Client panel
│   │   └── components/
│   │       └── checklists/         TaskCard, StepIndicator, ProgressRing, Icons
│   └── backend/           NestJS — API, auth, AI, checklists, webhooks
│       └── src/modules/
│           ├── checklists/         Full checklist CRUD + AI generation
│           ├── ai/                 LLM proxy + provider status
│           ├── auth/               JWT + roles
│           └── webhooks/           n8n integration
└── packages/
    ├── ai-core/           Multi-provider LLM engine with fallback
    │   └── src/
    │       ├── providers/registry.ts   Provider config + exhaustion detection
    │       ├── llm/factory.ts          LLM instantiation per provider
    │       ├── llm/executor.ts         Fallback chain executor
    │       └── chains/                 generateText, summarizeText
    └── shared/            Shared types and DTOs
```

---

## Database

Tables managed by TypeORM (auto-sync in dev):

| Table                | Description                            |
|----------------------|----------------------------------------|
| `users`              | Auth + roles                           |
| `checklists`         | Checklist metadata + config            |
| `checklist_items`    | Individual tasks with frequency/status |
| `checklist_feedbacks`| AI-generated weekly feedback           |

---

## Environment Variables

See `apps/backend/.env.example` for the full reference. Minimum required:

```env
DATABASE_URL=postgresql://admin:secret@localhost:5432/ailab
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key   # or any other provider key
```
