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
# Edit apps/backend/.env → set OPENAI_API_KEY
npm run dev            # starts frontend (3000) + backend (3001)
```

---

## Auth & Roles

| Role         | Created by      | Panel       | Access                         |
|-------------|-----------------|-------------|-------------------------------|
| `superadmin` | Auto on startup | `/admin`    | All — creates admin/client    |
| `admin`      | By superadmin   | `/admin`    | Create/manage clients         |
| `client`     | Self (signup)   | `/client`   | AI tools only                 |

**Default superadmin** (dev):
```
email:    superadmin@ailab.dev
password: SuperAdmin123!
```
> Change `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` in `apps/backend/.env` before production.

---

## Auth Endpoints

| Method | Path                | Auth        | Description                      |
|--------|---------------------|-------------|----------------------------------|
| POST   | `/v1/auth/signup`   | Public      | Create client account            |
| POST   | `/v1/auth/login`    | Public      | Returns access + refresh tokens  |
| POST   | `/v1/auth/refresh`  | —           | Refresh access token             |
| GET    | `/v1/auth/me`       | JWT         | Current user info                |
| POST   | `/v1/auth/users`    | admin+      | Create admin/client user         |

---

## Services

| Service    | URL                              |
|------------|----------------------------------|
| Frontend   | http://localhost:3000            |
| Backend    | http://localhost:3001            |
| Swagger    | http://localhost:3001/api/docs   |
| n8n        | http://localhost:5678            |
| PostgreSQL | localhost:5432                   |
| Redis      | localhost:6379                   |

---

## Stack

- **Frontend**: Next.js 14, App Router, Tailwind CSS, Bebas Neue + Space Mono typography
- **Backend**: NestJS 10, TypeORM, Passport JWT, class-validator
- **AI**: LangChain, GPT-4o-mini
- **DB**: PostgreSQL 16 + Redis
- **Automation**: n8n with bidirectional webhooks
- **Monorepo**: Turborepo + shared packages (`@ai-lab/shared`, `@ai-lab/ai-core`)
- **CI/CD**: GitHub Actions + Docker Compose
