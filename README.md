# 🚀 AI Lab Template

Monorepo fullstack listo para producción con IA, automatización e i18n.

**Stack:** Next.js 14 · NestJS · LangChain · n8n · TypeScript · Turborepo · Docker

[![CI](https://github.com/Dann-Lara/ai-lab-template/actions/workflows/ci.yml/badge.svg)](https://github.com/Dann-Lara/ai-lab-template/actions)

---

## Quick Start / Inicio Rápido

### Requirements / Requisitos
- Node.js >= 20
- Docker Desktop (running / ejecutándose)
- Git

### 1. Clone / Clonar
```bash
npx degit Dann-Lara/ai-lab-template my-project
cd my-project
```

### 2. Setup
```bash
# Windows
npm run setup

# Mac / Linux
npm run setup
```

### 3. Set API Key / Configura tu API Key
Edit `apps/backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

### 4. Start Docker (REQUIRED before npm run dev)
```bash
npm run docker:up
```

> ⚠️ **El backend requiere PostgreSQL corriendo.** Si ves errores de conexión a DB, asegúrate de que Docker Desktop esté abierto y ejecuta `npm run docker:up` antes de `npm run dev`.

### 5. Run / Ejecutar
```bash
npm run dev
```

| Service   | URL                                    |
|-----------|----------------------------------------|
| Frontend  | http://localhost:3000                  |
| Backend   | http://localhost:3001                  |
| Swagger   | http://localhost:3001/api/docs         |
| n8n       | http://localhost:5678 (admin/admin123) |

---

## 🗂️ Structure / Estructura

```
ai-lab-template/
├── apps/
│   ├── frontend/          # Next.js 14 App Router + Tailwind + i18n + Anime.js
│   └── backend/           # NestJS REST API
├── packages/
│   ├── ai-core/           # LangChain chains & agents (desacoplado)
│   ├── shared/            # Tipos TypeScript compartidos
│   └── eslint-config/     # ESLint + Prettier compartido
├── docker/
├── scripts/
│   ├── setup.js           # Dispatcher cross-platform
│   ├── setup.sh           # Mac/Linux setup
│   └── setup.ps1          # Windows PowerShell setup
└── docker-compose.yml
```

---

## 🌐 Internationalization / Internacionalización

The app supports **English** and **Spanish** (default).

- Messages in `apps/frontend/messages/en.json` and `es.json`
- Language switcher in the navbar (🇺🇸 EN / 🇲🇽 ES)
- Default locale: `es` (no URL prefix) — English at `/en/...`

To add a new language:
1. Add the locale to `apps/frontend/lib/i18n.ts`
2. Create `apps/frontend/messages/<locale>.json`
3. Add the label to `LanguageSwitcher.tsx`

---

## 🎨 Theming / Temas

Light/Dark mode toggle in the navbar. Preference is saved in `localStorage`.

CSS variables in `globals.css` control all theme-aware colors. Use them via Tailwind:
```css
/* Always use dark: prefix for dark overrides */
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

/* Or use the shared utility classes */
className="card"       /* white card, dark-aware */
className="btn-primary"
className="input"
className="label"
```

---

## 🎬 Animations / Animaciones

Anime.js hooks in `apps/frontend/hooks/useAnime.ts`:

```tsx
import { useFadeInUp, useStaggerIn } from '@/hooks/useAnime';

function MyPage() {
  const heroRef    = useFadeInUp<HTMLDivElement>({ duration: 700 });
  const listRef    = useStaggerIn<HTMLUListElement>({ delay: 200, stagger: 80 });

  return (
    <>
      <div ref={heroRef}>Hero content</div>
      <ul ref={listRef}>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </>
  );
}
```

---

## 🤖 AI Integration / Integración IA

```typescript
import { generateText, summarizeText } from '@ai-lab/ai-core';

const { text } = await generateText({
  prompt: 'Explica TypeScript generics',
  systemMessage: 'Eres un senior developer',
  temperature: 0.7,
});
```

---

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all dev servers |
| `npm run build` | Build all packages |
| `npm run docker:up` | Start Docker services (DB required!) |
| `npm run docker:down` | Stop Docker services |
| `npm run db:migrate` | Run DB migrations |
| `npm run setup` | First-time project setup |

---

## 🪟 Windows Notes

`npm run setup` detects OS automatically:
- **Windows** → `scripts/setup.ps1` via PowerShell
- **Mac/Linux** → `scripts/setup.sh` via Bash

If PowerShell blocks execution:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## 📄 License / Licencia
MIT
