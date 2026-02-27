# 🚀 AI Lab Template

A production-ready fullstack monorepo template for building AI-powered applications with automation capabilities.

**Stack:** Next.js 14 · NestJS · LangChain · n8n · TypeScript · Turborepo · Docker

[![CI](https://github.com/Dann-Lara/ai-lab-template/actions/workflows/ci.yml/badge.svg)](https://github.com/Dann-Lara/ai-lab-template/actions)

---

## ✨ Features

- **Monorepo** with Turborepo (incremental builds, remote caching)
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript (clean architecture, DI, Swagger)
- **AI Module**: LangChain + OpenAI (decoupled `packages/ai-core`)
- **Automation**: n8n as a Docker service (webhooks ↔ backend)
- **Database**: PostgreSQL 16 + TypeORM migrations
- **Auth**: JWT + Passport.js (local + JWT strategies)
- **Code Quality**: ESLint + Prettier + Husky + Commitlint
- **Testing**: Jest · React Testing Library · Playwright E2E
- **CI/CD**: GitHub Actions (lint + test + build)

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- Git

### 1. Clone the template

```bash
# Using degit (recommended)
npx degit Dann-Lara/ai-lab-template my-project
cd my-project

# Or clone directly
git clone https://github.com/Dann-Lara/ai-lab-template my-project
cd my-project
```

### 2. Run the setup script

```bash
chmod +x scripts/setup.sh
npm run setup
```

This will:
- Install all dependencies
- Configure Husky git hooks
- Copy `.env.example` → `.env` for all apps
- Start Docker services (PostgreSQL, Redis, n8n)
- Run database migrations

### 3. Add your API key

Edit `apps/backend/.env`:

```bash
OPENAI_API_KEY=sk-your-actual-api-key
```

### 4. Start development

```bash
npm run dev
```

| Service   | URL                               |
|-----------|-----------------------------------|
| Frontend  | http://localhost:3000             |
| Backend   | http://localhost:3001             |
| Swagger   | http://localhost:3001/api/docs    |
| n8n       | http://localhost:5678 (admin/admin123) |

---

## 📁 Repository Structure

```
ai-lab-template/
├── apps/
│   ├── frontend/          # Next.js 14 App Router
│   └── backend/           # NestJS REST API
├── packages/
│   ├── ai-core/           # LangChain AI logic (decoupled)
│   ├── shared/            # Shared TypeScript types & DTOs
│   └── eslint-config/     # Shared ESLint + Prettier config
├── docker/                # Dockerfiles
├── scripts/               # setup.sh and seed scripts
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml
├── turbo.json
└── tsconfig.base.json
```

---

## 🤖 AI Integration

### Using `packages/ai-core`

```typescript
import { generateText, summarizeText } from '@ai-lab/ai-core';

// Generate text
const { text, model } = await generateText({
  prompt: 'Explain TypeScript generics',
  systemMessage: 'You are a senior developer',
  temperature: 0.7,
});

// Summarize text
const summary = await summarizeText({
  text: longArticle,
  maxLength: 150,
  language: 'Spanish',
});
```

### API Endpoints

```bash
# Generate text
POST /v1/ai/generate
{ "prompt": "Hello AI", "temperature": 0.7 }

# Summarize text
POST /v1/ai/summarize
{ "text": "Long text...", "maxLength": 200 }
```

---

## 🔄 n8n Integration

n8n runs at `http://localhost:5678` and integrates with the backend via webhooks.

### Trigger n8n from NestJS

```typescript
// Inject WebhooksService and call:
await webhooksService.triggerN8nWorkflow('my-workflow', { userId: '123' });
```

### Receive n8n events in NestJS

```bash
POST /v1/webhooks/n8n
Headers: X-Webhook-Secret: your-secret
```

---

## 🧪 Testing

```bash
# All tests
npm run test

# Specific workspace
npm run test --filter=backend
npm run test --filter=frontend

# E2E (requires running app)
npm run test:e2e

# Coverage
npm run test -- --coverage
```

---

## 🏗️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all dev servers |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run all tests |
| `npm run setup` | Initial project setup |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |

---

## 🔧 Environment Variables

See `.env.example` files in:
- `apps/backend/.env.example`
- `apps/frontend/.env.example`

Key variables:
- `OPENAI_API_KEY` — Required for AI features
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Must be changed in production
- `N8N_WEBHOOK_SECRET` — Shared secret for n8n webhooks

---

## 📖 Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — Development guidelines
- [API Docs](http://localhost:3001/api/docs) — Swagger (when running)

---

## 📄 License

MIT

---

## 🪟 Windows Notes

`npm run setup` detecta automáticamente el OS:
- **Windows** → ejecuta `scripts/setup.ps1` via PowerShell
- **Mac / Linux** → ejecuta `scripts/setup.sh` via Bash

Si PowerShell bloquea la ejecución por política, ábrelo como Administrador y ejecuta:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Si usas **Git Bash** o **WSL**, puedes ejecutar el bash script directamente:
```bash
bash scripts/setup.sh
```
