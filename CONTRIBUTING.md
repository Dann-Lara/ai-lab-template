# Contributing Guide

## Development Setup

Follow the [README Quick Start](README.md#-quick-start) to get the project running.

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <subject>

# Examples:
feat(backend): add user authentication endpoint
fix(frontend): resolve hydration mismatch in AiGenerator
chore(docker): update postgres image to 16.3
docs(ai-core): add chain usage examples
test(backend): add integration tests for AI module
refactor(shared): simplify AiGenerateRequest type
```

**Allowed scopes:** `frontend`, `backend`, `ai-core`, `shared`, `n8n`, `docker`, `ci`, `deps`, `config`

## Branching Strategy

- `main` — production-ready code
- `develop` — integration branch
- `feat/<scope>/<description>` — new features
- `fix/<scope>/<description>` — bug fixes
- `chore/<description>` — maintenance

## Code Standards

- **TypeScript strict mode** is enforced everywhere
- All functions must have explicit return types
- No `any` types — use `unknown` and type guards
- Follow ESLint rules (auto-fixed on commit via lint-staged)
- Write tests for all new services and components

## Pull Request Process

1. Branch from `develop`
2. Write tests for your changes
3. Ensure `npm run lint`, `npm run type-check`, and `npm run test` pass
4. Open a PR to `develop` with a descriptive title
5. Request a review

## Adding a New Backend Module

```bash
# 1. Create the module structure
mkdir -p apps/backend/src/modules/my-feature/{dto,entities}

# 2. Create module, service, controller files
# 3. Register in app.module.ts
# 4. Add tests in *.spec.ts files
```

## Adding AI Capabilities

Add new chains or agents to `packages/ai-core/src/`:

```bash
packages/ai-core/src/
├── chains/       # Add new-chain.ts + new-chain.spec.ts
├── agents/       # Add specialized agents
└── prompts/      # Add prompt templates
```

Export from `packages/ai-core/src/index.ts` to make them available.
