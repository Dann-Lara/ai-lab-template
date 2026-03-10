# Technical Reference — AI Lab Template

> Complete technical documentation: architecture, methodology, technologies, AI models, and design decisions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Architecture](#2-monorepo-architecture)
3. [Technology Stack](#3-technology-stack)
4. [AI Strategy](#4-ai-strategy)
5. [Applications Module — Deep Dive](#5-applications-module--deep-dive)
6. [Authentication & Permissions](#6-authentication--permissions)
7. [Database Design](#7-database-design)
8. [API Design](#8-api-design)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Infrastructure & DevOps](#10-infrastructure--devops)
11. [Design Decisions & Trade-offs](#11-design-decisions--trade-offs)

---

## 1. Project Overview

AI Lab Template is a production-ready fullstack monorepo for building AI-powered SaaS products. It ships with a working **Job Applications Assistant** as the reference feature module, demonstrating every architectural layer.

**Core capabilities:**
- Multi-provider AI inference with automatic fallback (Gemini → Groq → OpenAI → DeepSeek → Anthropic)
- Role-based permission system backed by PostgreSQL (not hardcoded in code)
- Modular NestJS backend with versioned REST API
- Next.js 14 App Router frontend with i18n (ES/EN), dark mode, and component system
- n8n workflow automation integration
- Multi-environment Docker setup (dev / staging / prod)

---

## 2. Monorepo Architecture

```
ai-lab-template/
├── apps/
│   ├── frontend/          Next.js 14 (App Router) — port 3000
│   └── backend/           NestJS 10               — port 3001
├── packages/
│   └── ai-core/           Shared AI inference package
├── docker/                Docker service configs (Postgres, Redis, n8n)
├── docs/                  Technical documentation
├── n8n-workflows/         Workflow JSON files + sync script
└── scripts/               Setup automation
```

**Turborepo** orchestrates the monorepo. `turbo.json` defines the pipeline:
- `build` → frontend build depends on backend types
- `dev` → parallel dev servers with hot reload
- `lint` / `test` → run across all packages

**Shared packages** (`packages/`) are consumed via TypeScript path aliases defined in `tsconfig.base.json`. The `@ai-lab/ai-core` package exports `generateText` and `executeWithFallback` — backend uses these, never calling provider SDKs directly.

---

## 3. Technology Stack

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 20 LTS | Server runtime |
| Framework | NestJS | 10 | Modular HTTP framework with DI |
| Language | TypeScript | 5.x | Full type safety |
| ORM | TypeORM | 0.3 | Database access + migrations |
| Database | PostgreSQL | 16 | Primary data store |
| Cache | Redis | 7 | Session store, rate limiting |
| Auth | JWT (RS256) + Passport | — | Stateless authentication |
| Validation | class-validator + class-transformer | — | DTO validation pipeline |
| API Docs | Swagger (OpenAPI 3) | — | Auto-generated at `/api` |
| Rate limiting | `@nestjs/throttler` | — | Per-endpoint throttling |

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 14 | App Router, SSR, API routes |
| Language | TypeScript | 5.x | Full type safety |
| Styling | Tailwind CSS | 3 | Utility-first CSS |
| Animation | Anime.js | 3 | Micro-animations (useFadeInUp) |
| i18n | Custom context | — | ES/EN with React context |
| State | React hooks (useState, useCallback) | — | Local + lifted state only |
| Auth | JWT stored in localStorage + useAuth hook | — | Client-side auth guard |

### AI Core (`packages/ai-core`)

| Provider | Model | Free tier | Use case |
|----------|-------|-----------|----------|
| Google Gemini | gemini-2.0-flash / gemini-2.5-flash | ✅ | Primary — fast, long context |
| Groq | llama-3.3-70b-versatile | ✅ | Fallback — ultra-fast inference |
| OpenAI | gpt-4o-mini | ❌ | Fallback — reliable structured output |
| DeepSeek | deepseek-chat | ✅ cheap | Fallback — cost-effective |
| Anthropic | claude-3-haiku | ❌ | Fallback — strong instruction following |

Provider priority is configurable via `AI_PROVIDER_PRIORITY` env var. The `withRetry` utility (2 retries, exponential backoff) wraps every AI call.

### Infrastructure

| Service | Technology | Purpose |
|---------|-----------|---------|
| Container orchestration | Docker Compose | Dev/stg/prod environments |
| Automation | n8n | Workflow automation, webhooks, Telegram |
| Reverse proxy | Nginx (prod) | SSL termination, static files |

---

## 4. AI Strategy

### Multi-Provider Fallback

```
Request → Gemini → [fail] → Groq → [fail] → OpenAI → [fail] → error
```

Implemented in `packages/ai-core/src/llm/executor.ts` via `executeWithFallback`. Each provider attempt catches errors and logs them; the next provider is tried automatically. This means the application stays functional even during provider outages or quota exhaustion.

### Prompt Engineering Patterns

All AI calls in the codebase follow these principles:

1. **No JSON embedding of long text** — CVs and long-form content are passed using delimiter-based formats (`===ES===`, `===EN===`) to avoid JSON string escaping truncation issues.

2. **No LangChain template parsing for user content** — `{` and `}` in user content are escaped via `esc()` which converts them to `(` `)`. Alternatively, `SystemMessage` / `HumanMessage` classes are used directly to bypass template parsing entirely.

3. **Compact prompts for evaluation** — Evaluation responses are kept under 500 tokens by limiting feedback to 10 words per field and using the `fieldFeedback: ""` pattern for approved fields.

4. **`approvedFields` pattern** — Re-evaluations pass previously approved rubric keys so the AI doesn't re-score them, preventing infinite optimization loops.

5. **Inference rules in system prompts** — When generating hybrid CVs or interview answers, the system prompt explicitly lists logical technology inferences (e.g., "React → hooks, JSX, testing with RTL") to produce realistic, non-invented content.

### ATS CV Generation

The hybrid CV generator follows ATS compliance rules derived from analysis of major ATS systems (Workday, Taleo, Greenhouse, Lever):

- Plain text only — no tables, columns, graphics
- Section headers in ALL CAPS
- Dates in `MM/YYYY` format
- Bullets as `- ` (hyphen-space), never Unicode bullets (•, ●)
- Keyword density: exact verbatim matches from the job offer
- Single-column left-to-right reading order (ATS parsers fail on multi-column)
- No personal pronouns in bullets

PDF export uses `@page { margin: 0 }` with `body { padding: 0.75in }` — this removes all browser-injected headers/footers (URL, title, date, page numbers) while maintaining correct print margins.

---

## 5. Applications Module — Deep Dive

### Data Model

```
BaseCvEntity (base_cvs) — one per user
  ├── Contact: fullName, email, phone, location, linkedIn
  ├── Content: summary, experience, education, skills, languages, certifications
  └── Timestamps: createdAt, updatedAt

ApplicationEntity (applications) — many per user
  ├── Basic: company, position, jobOffer, status, appliedFrom
  ├── ATS CV: atsScore, cvGeneratedEs, cvGeneratedEn (+ cvGenerated for compat)
  ├── Interview: interviewQuestions, interviewAnswers
  └── Timestamps: appliedAt, updatedAt
```

### CV Evaluation Flow

```
User fills CV form
    ↓
POST /base-cv/evaluate
    ├── AI scores each of 8 rubric fields (0-100 pts)
    ├── Returns fieldFeedback: "" (ok) or "improvement hint" (issue)
    ↓
Frontend applies status to each field:
    ├── "" → green ring + locked (disabled input)
    ├── short hint → amber ring + warning
    └── long hint → red ring + error
    ↓
Re-evaluation passes approvedFields: ["contact", "summary", ...]
    └── AI only scores pending fields, preserves locked scores
    ↓
score >= 85 → Save button unlocked
```

### Hybrid CV Generation Flow

```
User pastes job offer
    ↓
POST /generate-cv
    ├── Loads user's BaseCvEntity
    ├── Builds combined prompt with base CV + job offer
    ├── AI applies inference rules (React → hooks, etc.)
    ├── Returns delimiter-separated: SCORE / ===ES=== / ===EN===
    ↓
Frontend renders editable textareas (ES + EN tabs)
    ├── User edits content — dirty flag tracked per language
    ├── PDF export uses edited state (ATS-clean HTML, no browser chrome)
    └── Save stores edited content in cvGeneratedEs / cvGeneratedEn
```

### Interview Q&A Flow

```
Application saved with CVs
    ↓
User opens "Entrevista" panel
    ↓
User pastes interview questions
    ↓
POST /applications/:id/interview-qa
    ├── Loads BaseCvEntity + ApplicationEntity
    ├── Composes context: base CV + tailored CV
    ├── [superadmin only] Appends technical repo context
    ├── AI infers capabilities from CV (senior Angular → RxJS, etc.)
    └── Returns numbered answers
    ↓
User edits answers in textarea
    ↓
PATCH /applications/:id → saves interviewQuestions + interviewAnswers
```

---

## 6. Authentication & Permissions

### JWT Flow

```
POST /auth/login → { accessToken, refreshToken }
    ↓
Frontend stores in localStorage (ailab_at, ailab_rt)
    ↓
Every API request: Authorization: Bearer <token>
    ↓
JwtAuthGuard → @CurrentUser() decorator → { userId, email, role }
```

### Permission System

Permissions are stored per-user in the database (`users.permissions` column as JSON). The frontend fetches permissions once per session in `DashboardLayout` and distributes them via `PermissionsProvider` React context.

```typescript
// Roles: superadmin | admin | client
// Modules: dashboard | applications | users | settings | ...
// Each user has: { module: boolean } map
```

`<PermissionGate module="applications">` wraps protected page content. The Sidebar reads the same context to show/hide nav items. This means access control is completely configurable per user without code changes.

---

## 7. Database Design

TypeORM `synchronize: true` is used in development — schema changes in entity files apply automatically on restart. For staging/production, migration files should be generated via `typeorm migration:generate`.

Key indexes:
- `base_cvs(user_id)` — UNIQUE (one base CV per user)
- `applications(user_id, status)` — composite for filtered list queries
- `users(email)` — UNIQUE for login lookup

---

## 8. API Design

All routes are prefixed `/v1/` (NestJS versioning). The full API is auto-documented at `http://localhost:3001/api`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/login` | — | Login, returns JWT pair |
| GET | `/v1/applications/base-cv` | JWT | Get user's base CV |
| PUT | `/v1/applications/base-cv` | JWT | Save base CV (score ≥ 85 required) |
| POST | `/v1/applications/base-cv/evaluate` | JWT | Score CV fields (0-100), AI |
| POST | `/v1/applications/generate-cv` | JWT | Generate ES+EN ATS hybrid CV, AI |
| POST | `/v1/applications/extract-cv` | JWT | Extract CV data from PDF text, AI |
| POST | `/v1/applications/feedback` | JWT | Coaching feedback from history, AI |
| GET | `/v1/applications` | JWT | List user's applications |
| POST | `/v1/applications` | JWT | Create application |
| PATCH | `/v1/applications/:id` | JWT | Update status / CV / Q&A |
| DELETE | `/v1/applications/:id` | JWT | Delete application |
| POST | `/v1/applications/:id/interview-qa` | JWT | Generate interview answers, AI |

### Next.js API Proxies

All `/api/*` routes in the frontend proxy to the backend via `lib/api-proxy.ts`. This avoids CORS issues and keeps the backend URL server-side only.

---

## 9. Frontend Architecture

### App Router Structure

```
app/
├── (auth)/login/         Public auth pages
├── admin/
│   ├── applications/     Applications module
│   │   ├── page.tsx      Orchestrator — manages state, data fetching, tab routing
│   │   └── _components/  Atomic components (AppCard, BaseCVForm, NewApplicationForm, ...)
│   ├── users/            User management (superadmin only)
│   └── settings/         Settings page
└── api/                  Next.js API route proxies → NestJS backend
```

### Component Pattern

Each feature page follows the **orchestrator + atoms** pattern:
- `page.tsx` — owns all state, data fetching, and event handlers. Passes props down.
- `_components/` — pure/presentational components. No direct API calls except within their own interaction handlers.

### i18n

`lib/i18n/` contains one file per module (e.g., `applications.ts`) with `es` and `en` objects. The `useI18n()` hook returns the correct translations based on user locale preference stored in localStorage. All user-visible strings go through `t.module.key`.

---

## 10. Infrastructure & DevOps

### Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | postgres:16-alpine | 5432 | Primary database |
| redis | redis:7-alpine | 6379 | Cache + sessions |
| n8n | n8nio/n8n | 5678 | Workflow automation |

### npm Scripts

| Script | Action |
|--------|--------|
| `npm run dev` | Parallel dev servers (frontend + backend) |
| `npm run build` | Production build (Turborepo) |
| `npm run setup` | Install deps + start Docker + sync n8n |
| `npm run n8n:sync` | Push workflow JSON files to n8n |

---

## 11. Design Decisions & Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| `synchronize: true` in dev | Fast iteration, no migration files needed | Cannot use in production — use `migration:run` |
| JWT in localStorage | Simple, works with SSR proxies | XSS risk — mitigated by short expiry + refresh |
| Delimiter format for AI CV output | Avoids JSON string truncation for long CVs | Parser must handle both formats (new + legacy JSON) |
| `approvedFields` re-evaluation | Prevents infinite optimization loops | Requires frontend to track dirty state per field |
| DB-backed permissions | Configurable per user without deploys | Adds DB round-trip on session start |
| `esc()` for user content | Prevents LangChain template injection | Converts `{}` to `()` — visible in logs |
| Multi-provider AI fallback | Zero-downtime during provider outages | Slightly higher latency on first failure |
| Single env file per environment | Simple, no secret manager needed for MVP | Secrets in filesystem — use Vault/AWS SSM for prod |
