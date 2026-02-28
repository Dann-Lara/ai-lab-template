# Contributing Guide / Guía de Contribución

## Setup / Configuración

Follow the [README Quick Start](README.md#quick-start--inicio-rápido).

> **Important / Importante:** Run `npm run docker:up` before `npm run dev` — the backend needs PostgreSQL.

---

## Commit Convention / Convención de Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(frontend): add dark mode toggle
fix(backend): handle DB connection timeout
chore(docker): update postgres to 16.3
docs(ai-core): add summarization examples
i18n(frontend): add French locale messages
```

**Allowed scopes:** `frontend`, `backend`, `ai-core`, `shared`, `n8n`, `docker`, `ci`, `deps`, `config`

---

## Internationalization / Internacionalización

### Adding translations / Agregando traducciones
1. Add keys to `apps/frontend/messages/en.json` AND `es.json`
2. Access in components: `const t = useTranslations('namespace')`
3. For server components: `import { useTranslations } from 'next-intl'`
4. For client components: same import but with `'use client'`

### Adding a new language / Agregar nuevo idioma
```typescript
// apps/frontend/lib/i18n.ts
export const locales = ['en', 'es', 'fr'] as const; // add here

// apps/frontend/messages/fr.json  ← create this file
// apps/frontend/components/ui/LanguageSwitcher.tsx ← add label
```

---

## Theming / Temas

Use CSS utility classes defined in `globals.css`:
- `.card` — white/dark-aware card container
- `.btn-primary` — blue primary button
- `.btn-secondary` — neutral secondary button
- `.input` — dark-aware text input
- `.label` — form label

Always pair light/dark variants:
```tsx
className="bg-white dark:bg-slate-900"
className="text-slate-900 dark:text-slate-100"
className="border-slate-200 dark:border-slate-700"
```

---

## Animations / Animaciones

Use hooks from `apps/frontend/hooks/useAnime.ts`:
- `useFadeInUp(options)` — fade + slide up entrance
- `useStaggerIn(options)` — staggered children entrance

Add new animations in `tailwind.config.ts` under `keyframes` + `animation`.

---

## Adding a Backend Module / Agregar módulo NestJS

```bash
# 1. Create structure
mkdir -p apps/backend/src/modules/my-feature/{dto}

# 2. Create: my-feature.module.ts, my-feature.service.ts, my-feature.controller.ts
# 3. Register in apps/backend/src/app.module.ts
# 4. Add tests: my-feature.service.spec.ts
```

## Adding AI Capabilities / Agregar capacidades IA

Add to `packages/ai-core/src/chains/` or `packages/ai-core/src/agents/`:

```typescript
// packages/ai-core/src/chains/my-chain.ts
export async function myChain(input: string): Promise<string> {
  const llm = getLLM({ temperature: 0.5 });
  // ... LangChain logic
}
```

Export from `packages/ai-core/src/index.ts`.

---

## Branching / Ramas

- `main` — producción
- `develop` — integración
- `feat/<scope>/<description>` — nuevas features
- `fix/<scope>/<description>` — bug fixes
