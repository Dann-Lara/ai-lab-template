# Changelog

All notable changes to AI Lab Template are documented here.

---

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
