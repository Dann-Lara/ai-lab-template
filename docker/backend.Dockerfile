FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-core/package.json ./packages/ai-core/
RUN npm ci

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/backend
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN turbo run build --filter=backend

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
