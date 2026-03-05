# AI Agents Development Rules — AI Lab Template

> Rules for AI coding assistants (Claude, Cursor, Copilot, etc.) working on this codebase.  
> **Read this before making any change.**

---

## 0. Non-negotiable Rules

1. **Never break existing functionality** — if uncertain, ask before deleting or renaming.
2. **Never hardcode secrets** — use `process.env` / `ConfigService`. Zero secrets in code.
3. **Never bypass TypeScript** — no `any`, no `ts-ignore`, no `as unknown as X` chains.
4. **Never commit `.env` files** — only `.env.example` goes in git.
5. **Read before writing** — always read the target file fully before editing.

---

## 1. Project Architecture

```
ai-lab-template/
├── apps/
│   ├── backend/          NestJS API (port 3001)
│   └── frontend/         Next.js 14 App Router (port 3000)
├── packages/
│   └── ai-core/          Shared AI provider abstraction
├── n8n-workflows/        Automation workflow JSONs
├── docker/               Compose configs
└── docs/                 You are here
```

### Backend — NestJS v10, TypeORM, PostgreSQL
- All routes versioned at `/v1/` via `enableVersioning()`  
- Auth: JWT (`JwtAuthGuard`) or webhook secret (`JwtOrWebhookSecretGuard`)  
- n8n endpoints **always** use `JwtOrWebhookSecretGuard` + `x-webhook-secret` header  
- Every new module needs: `entity`, `dto`, `service`, `controller`, `module`

### Frontend — Next.js 14 App Router, TypeScript strict
- All API calls go through `/api/*` (proxied in `next.config.ts`)  
- API client lives in `apps/frontend/lib/checklists.ts` — add methods there  
- Auth state via `useAuth(roles)` hook — always pass allowed roles array  
- Components > 200 lines **must** be split (see §4)

---

## 2. Authentication Model

| Caller         | Header                   | Guard                      |
|----------------|--------------------------|----------------------------|
| Web UI (user)  | `Authorization: Bearer …`| `JwtAuthGuard`             |
| n8n workflows  | `x-webhook-secret: …`    | `JwtOrWebhookSecretGuard`  |
| Both allowed   | either                   | `JwtOrWebhookSecretGuard`  |

`JwtOrWebhookSecretGuard` sets `req.webhookAuth = true` when secret matches.  
Controllers check this flag to skip user ownership queries.

---

## 3. n8n Workflow Conventions

- **All HTTP nodes** use credential: `Header Auth account` (id `EfBrBbQ88fwJlS4R`)  
- **All Telegram nodes** use credential: `Telegram account` (id `8JyddEiApG6k1J3x`)  
- **Variable syntax**: use `$env.BACKEND_PUBLIC_URL` (NOT `$vars.`)  
- **Callback data format**: `"action:checklistId:itemId"` — always 3 parts  
- After fixing a workflow: verify credentials are not id `"1"` or `"2"` (those are placeholders)

---

## 4. File Size Rules

| File Type    | Soft Limit | Hard Limit | Action                     |
|--------------|-----------|------------|----------------------------|
| Page (`.tsx`)| 200 lines | 300 lines  | Extract step/section components |
| Component    | 150 lines | 250 lines  | Extract sub-components     |
| Service (`.ts`)| 300 lines| 500 lines | Split into focused services |
| Controller   | 100 lines | 150 lines  | Already at limit           |

**Fragmentation pattern for pages:**
```
app/checklists/new/
  page.tsx                  ← orchestrator only (~150 lines)
components/checklists/new-wizard/
  StepQuestionnaire.tsx
  StepReview.tsx
  StepGenerating.tsx
  StepDone.tsx
  RegenModal.tsx
```

---

## 5. Backend Coding Standards

```typescript
// ✅ DO
async findOne(userId: string, id: string): Promise<ChecklistEntity> {
  const checklist = await this.repo.findOne({
    where: { id, userId },
    relations: ['items'],
  });
  if (!checklist) throw new NotFoundException('Checklist not found');
  return checklist;
}

// ❌ DON'T — no raw SQL, no any, no missing null check
const r = await this.repo.query(`SELECT * FROM checklists WHERE id = '${id}'`);
```

- Use `NotFoundException`, `BadRequestException`, `ForbiddenException` from `@nestjs/common`  
- Validate all DTOs with `class-validator` decorators  
- Log with `this.logger = new Logger(ClassName.name)` — never `console.log` in production code  
- Wrap external API calls (Telegram, AI) in try/catch with `this.logger.warn()`

---

## 6. Frontend Coding Standards

```typescript
// ✅ DO — typed state, named handlers
const [loading, setLoading] = useState(false);
async function handleSave() { ... }

// ❌ DON'T — inline async in JSX
<button onClick={async () => { await save(); }}>

// ✅ DO — void wrapper for async handlers in JSX
<button onClick={() => void handleSave()}>
```

- All async handlers named `handle*` — called from JSX with `() => void handle*()`  
- All API calls in `lib/checklists.ts` — never `fetch()` directly in components  
- Use `suppressHydrationWarning` only on elements with date/locale-dependent text  
- Never use `localStorage` directly — use the `useAuth` / token utilities

---

## 7. TypeORM Entity Rules

- Every entity has `@CreateDateColumn()` and `@UpdateDateColumn()`  
- Foreign keys use `@Column({ name: 'checklist_id' })` + `@ManyToOne` with named join  
- Boolean flags default to `false`: `@Column({ default: false })` reminderSent!: boolean  
- Soft delete preferred over hard delete for user data

---

## 8. Environment Variables

- New vars go in **both** `.env.example` AND `docs/DEPLOYMENT.md`  
- Backend accesses via `this.configService.get<string>('VAR_NAME', 'fallback')`  
- Frontend accesses via `process.env.NEXT_PUBLIC_*` (public) or API calls (private)  
- Never log env values — only log `!!process.env.VAR_NAME` (boolean presence)

---

## 9. Git Conventions

```
feat(checklists): add send-to-telegram endpoint
fix(n8n): align workflow credentials to correct IDs
refactor(frontend): fragment new-checklist page into wizard steps
docs: add deployment guide for staging/prod
```

- Prefix: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`  
- Scope in parentheses: module or file area affected  
- Present tense, lowercase, no period at end  
- Reference issue number if applicable: `fix(auth): resolve JWT expiry #42`

---

## 11. Dark / Light Mode Compliance

Every new design or UI component **must** support both color modes:
- Use Tailwind's `dark:` variants for all colors — never hardcode a single-mode color.
- Background: `bg-white dark:bg-slate-900` / `bg-slate-50 dark:bg-slate-950`
- Text: `text-slate-900 dark:text-white` / `text-slate-600 dark:text-slate-300`
- Borders: `border-slate-200 dark:border-slate-800`
- Never use CSS `color`, `background-color`, or inline styles for theme-sensitive values.
- Test visually in both modes before marking a UI task done.

---

## 12. i18n for All User-Facing Text

**Every** string shown to the user must use the i18n system — no hardcoded text in components:
- All labels, messages, errors, placeholders, and button text go through `t.*` keys.
- Add new keys to **both** `checklistES` / `checklistEN` (or the relevant file) at the same time.
- Never leave a fallback like `t.foo ?? 'Texto en español'` — add the key instead.
- Error messages thrown from API calls must be translatable (use `t.common.error` or a specific key).
- Files: `apps/frontend/lib/i18n/*.ts` — one file per domain (`checklist`, `common`, `auth`, etc.).
- After adding keys, verify the EN translation is also filled in (no untranslated EN strings).


Before marking any task done:
1. TypeScript compiles without errors: `cd apps/backend && npx tsc --noEmit`
2. No new `console.log` in committed code
3. New endpoints have `@ApiOperation({ summary: '...' })` for Swagger
4. New components have no inline style blocks (use Tailwind classes)
5. n8n workflow credential IDs match the project standard (`EfBrBbQ88fwJlS4R` / `8JyddEiApG6k1J3x`)
