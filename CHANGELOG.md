# Changelog

All notable changes to AI Lab Template are documented here.

---

## [v19c] — 2026-03-02

### Added — n8n Workflow Auto-Sync + Multi-Environment Setup

#### n8n Workflow Sync (`scripts/sync-n8n-workflows.js`)
- **Full rewrite** with robust n8n Variables API support
- Syncs `$vars.BACKEND_PUBLIC_URL` and `$vars.N8N_WEBHOOK_SECRET` as n8n Variables — workflows never have hardcoded URLs
- Fallback chain: n8n API Key → Basic Auth (N8N_USER/N8N_PASSWORD)
- Idempotent upsert: finds workflow by name → PUT (update) or POST (create)
- Smart activation: schedule-trigger workflows activated automatically; Telegram/webhook-trigger workflows left inactive until credentials are added
- Wait loop (up to 90s) for n8n to be ready before syncing
- Detailed next-steps output with credential instructions

#### n8n Variables — correct approach for workflow expressions
- Workflows use `$vars.BACKEND_PUBLIC_URL` (n8n Variables) — NOT `$env.*` which is disabled in n8n >= 1.0 for security
- Variables are pushed automatically on `npm run setup` and `npm run n8n:sync`
- Changing `BACKEND_PUBLIC_URL` (e.g. stg → prod): just run `npm run n8n:sync` again

#### Multi-environment Docker setup
- `.env.staging.example` — staging template with [CHANGE] markers
- `.env.prod.example` — production template with security guidance
- `docker-compose.prod.yml` — fixed Redis password injection
- `docker-compose.n8n` — cleaned up env, removed stale `N8N_WEBHOOK_BASE_URL`
- `.gitignore` updated to exclude all real `.env*` files, keep `*.example`

#### Documentation
- **`docs/CONFIGURATION.md`** (438 lines) — complete reference covering: env file structure, all variables, dev/stg/prod setup, n8n configuration, Telegram bot, database, AI providers, troubleshooting
- **`README.md`** — rewritten: quick start, environments table, full API reference, project structure, scripts table, i18n modules
- **`n8n-workflows/SETUP.md`** — updated: auto-sync first, manual import as fallback
- New npm scripts: `n8n:sync`, `setup:full`

### Changed
- `docker-compose.yml` — n8n section cleaned: removed `$env.*` pattern, added `N8N_DIAGNOSTICS_ENABLED: false`
- `apps/backend/.env.example` — added `N8N_API_KEY`, `N8N_USER`, `N8N_PASSWORD`

---

## [v19b] — 2026-03-02

### Added — i18n Modularization + Hardcoded String Cleanup

#### i18n refactoring
- Split `lib/i18n.ts` (299 lines monolith) into 10 focused modules in `lib/i18n/`:
  `types.ts`, `common.ts`, `auth.ts`, `home.ts`, `dashboard.ts`, `users.ts`, `profile.ts`, `checklist.ts`, `telegram.ts`, `index.ts`
- `lib/i18n.ts` reduced to 12-line re-export shim — all existing imports still work
- New keys: `common.save/saving/saved/cancel/confirm`, `nav.profile`, `dashboard.myProfile/profileSub/howToUse/svcXxx`, `checklist.sectionCore/sectionStyle/sectionReminders/errorEmptyTask/errorRequiredFields`, full `profile.*` namespace, full `telegram.*` namespace

#### Hardcoded string elimination
- `TelegramHelpModal` — all 15+ UI strings → `t.telegram.*`
- `admin/profile/page.tsx` — all strings → `t.profile.*`
- `admin/page.tsx` — SERVICES array uses `t.dashboard.svcXxx`, profile card, "¿Cómo se usa?"
- `checklists/new/page.tsx` — section labels (Core, Estilo, Recordatorios) and validation errors
- `admin/users/page.tsx` — role labels in `<option>` tags and error messages

#### .env consolidation
- Root `.env.example` — Docker Compose only (shared vars)
- `apps/backend/.env.example` — local dev backend (with full comments)
- `apps/frontend/.env.example` — only `NEXT_PUBLIC_*`

---

## [v19] — 2026-03-02

### Added — n8n Telegram Integration

#### Backend
- `user.entity.ts` — `telegramChatId` column (nullable varchar)
- `users.controller.ts` — `GET/PATCH /v1/users/me` (own profile without admin)
- `users.service.ts` — `updateProfile()` method
- `webhooks.controller.ts` — `POST /v1/webhooks/telegram-response` parses `complete:itemId` / `postpone:itemId`
- `checklists.service.ts` — `patchItemByIdOnly()` for Telegram actions without user context
- `apps/backend/.env.example` — Telegram + n8n vars

#### Frontend
- `app/admin/profile/page.tsx` — profile page with name + Telegram Chat ID + status badge
- `components/ui/TelegramHelpModal.tsx` — 5-step modal with bot preview
- `app/checklists/new/page.tsx` — "¿Cómo obtenerlo?" button on Telegram field
- `app/api/users/me/route.ts` — proxy GET/PATCH
- Navbar — "Perfil" link, admin dashboard — "Mi Perfil" card

#### n8n Workflows (`n8n-workflows/`)
- `01-checklist-reminders.json` — hourly scheduler with Telegram inline buttons
- `02-telegram-responses.json` — callback handler + `/start` → Chat ID reply
- `03-weekly-feedback.json` — Sunday 20:00 AI feedback via Telegram
- `scripts/sync-n8n-workflows.js` — initial version
- `n8n-workflows/SETUP.md` — setup guide

## [v17] — 2026-03-01

### Added — Multi-Provider AI Engine (`packages/ai-core`)
- **Provider registry** (`src/providers/registry.ts`): config-driven catalog of 5 providers (Gemini, Groq, OpenAI, DeepSeek, Anthropic) with priority ordering and exhaustion detection
- **LLM factory** (`src/llm/factory.ts`): creates the correct LangChain chat model for each provider; Groq and DeepSeek use the OpenAI-compatible endpoint
- **Fallback executor** (`src/llm/executor.ts`): iterates providers in priority order; on quota/rate-limit/auth/5xx errors falls through to the next; non-recoverable errors (content policy, bad prompt) throw immediately
- **`AI_PROVIDER_PRIORITY` env var**: override provider order without code changes (e.g. `openai,gemini,groq`)
- **`GET /v1/ai/providers`** endpoint: shows which providers are active and their configured models at runtime
- Supported providers: Google Gemini (`gemini-2.0-flash` default), Groq (free tier, llama-3.1), OpenAI, DeepSeek, Anthropic Claude
- Default model updated to `gemini-2.0-flash` (GA, available on free tier)

### Fixed
- `ai.controller.ts`: missing `Get` import from `@nestjs/common` caused startup crash
- 404 model-not-found errors now trigger provider fallback (previously treated as non-recoverable)
- Exhaustion detection expanded to cover `404`, `not found for api version`, `is not supported for generatecontent`

---

## [v16] — 2026-03-01

### Added — Intelligent Checklist Feature

#### Backend (`apps/backend/src/modules/checklists/`)
- **3 TypeORM entities**: `checklists`, `checklist_items`, `checklist_feedbacks` with proper indexes on `user_id`, `status`, `due_date`
- **ChecklistsService**: AI generation with exponential backoff retry (2 retries), per-user rate limiting (10 generations/hour), JSON schema validation of AI response before saving, prompts that include user language
- **10 REST endpoints**: generate-draft, regenerate-draft, confirm, CRUD, patch-item, progress, feedback, reminders/due
- Registered in `AppModule`

#### Frontend (`apps/frontend/`)
- **`/checklists`**: list page with filter tabs (active/paused/completed), stagger entrance animation (Anime.js), progress bars per checklist, inline delete confirm
- **`/checklists/new`**: 5-step creation flow (questionnaire → AI generating → review → confirm → done) with step indicator animation, 2-column form layout, drag-and-drop task reordering, daily time budget bar, regeneration modal
- **`/checklists/[id]`**: detail page with Tasks tab and Dashboard tab; Dashboard shows completion ring (SVG), 14-day activity bar chart, AI feedback section
- **TaskCard component**: editable inline, frequency badges with color coding, collapsible hack tip, drag handle, complete/postpone/skip actions
- **StepIndicator component**: animated progress line across steps
- **ProgressRing + BarChart components**: pure SVG, theme-aware
- **`lib/checklists.ts`**: TypeScript types + API client with auth header forwarding
- **8 Next.js API proxy routes** forwarding to NestJS with Authorization header
- **80+ i18n keys** added in ES and EN
- Checklist link added to Navbar (admin + client variants)
- Shortcut cards added to admin and client dashboards

---

## [v15] — 2026-03-01

### Fixed — Hydration & Infinite Loop
- Eliminated React hydration errors: `suppressHydrationWarning` on all i18n text, `mounted` flag in Navbar
- Fixed infinite loop in `/admin`: role arrays moved to module-level constants, `useAuth` serializes deps to string
- `ThemeScript` inline script prevents theme flash on page load
- DB password aligned: `apps/backend/.env.example` uses `secret` to match docker-compose defaults

### Improved — Light Mode
- All pages and components: full `dark:` prefix support, `transition-colors duration-300`
- Navbar, Footer, AI components: proper light/dark contrast
- `globals.css`: utility classes updated for both themes

---

## [v13] — 2026-03-01

### Added — Auth System & Role-Based Panels
- JWT auth with refresh tokens, role guards (`superadmin`, `admin`, `client`)
- `/admin` panel: user management, AI tools
- `/client` panel: AI tools
- Landing page with features, stack, docs sections
- `useAuth` hook with role enforcement and redirect

---

## [v1] — 2026-02-28

### Added — Initial Monorepo
- Turborepo setup: `apps/frontend` (Next.js 14), `apps/backend` (NestJS 10)
- `packages/ai-core` with LangChain, `packages/shared` for types
- PostgreSQL + Redis via Docker Compose
- i18n (ES/EN), dark/light theme, Anime.js animations
- Swagger at `/api`, basic AI generate + summarize endpoints
- GitHub Actions CI, Husky pre-commit, ESLint + Prettier
