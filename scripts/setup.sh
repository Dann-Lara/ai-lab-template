#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "============================================"
echo "     AI Lab Template - Setup"
echo "============================================"
echo -e "${NC}"

#  1. REQUIREMENTS 
echo -e "${YELLOW}>> Checking requirements...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}[ERROR] Node.js required (v20+)${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}[ERROR] Docker required${NC}"; exit 1; }
NODE_V=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_V" -lt 20 ] && echo -e "${RED}[ERROR] Node.js v20+ required. Got: $(node -v)${NC}" && exit 1
echo -e "${GREEN}  [OK] Node.js $(node -v)${NC}"
echo -e "${GREEN}  [OK] npm $(npm -v)${NC}"

#  2. INSTALL 
echo -e "\n${YELLOW}>> Installing dependencies...${NC}"
npm install
echo -e "${GREEN}  [OK] Dependencies installed${NC}"

#  3. HUSKY 
echo -e "\n${YELLOW}>> Setting up Git hooks...${NC}"
if [ -d ".git" ]; then
  npx husky 2>/dev/null \
    && echo -e "${GREEN}  [OK] Husky configured${NC}" \
    || echo -e "${YELLOW}  [!!] Husky skipped  run: npx husky${NC}"
else
  echo -e "${YELLOW}  [!!] No .git folder. Run: git init && npx husky${NC}"
fi

#  4. ENV FILES 
echo -e "\n${YELLOW}>> Setting up .env files...${NC}"

# Root .env — used by Docker Compose (ALL services read from here)
if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
  echo -e "${GREEN}  [OK] Created: .env (from .env.example)${NC}"
else
  echo -e "${YELLOW}  [!!] Already exists: .env${NC}"
fi

# apps/backend/.env — for running backend locally WITHOUT Docker
BACKEND_ENV="apps/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  cp "apps/backend/.env.example" "$BACKEND_ENV"
  echo -e "${GREEN}  [OK] Created: $BACKEND_ENV${NC}"
else
  # Ensure critical keys exist in older .env files (migration guard)
  for key in DATABASE_URL REDIS_URL JWT_SECRET; do
    if ! grep -q "^${key}=" "$BACKEND_ENV" 2>/dev/null; then
      # Extract default value from .env.example and append
      default=$(grep "^${key}=" "apps/backend/.env.example" | head -1)
      if [ -n "$default" ]; then
        echo "" >> "$BACKEND_ENV"
        echo "# Added by setup (key was missing)" >> "$BACKEND_ENV"
        echo "$default" >> "$BACKEND_ENV"
        echo -e "${GREEN}  [OK] Added missing ${key} to $BACKEND_ENV${NC}"
      fi
    fi
  done
  echo -e "${YELLOW}  [!!] Already exists: $BACKEND_ENV (checked required keys)${NC}"
fi

# apps/frontend/.env.local
if [ ! -f "apps/frontend/.env.local" ]; then
  cp "apps/frontend/.env.example" "apps/frontend/.env.local" 2>/dev/null || true
  echo -e "${GREEN}  [OK] Created: apps/frontend/.env.local${NC}"
fi

echo -e ""
echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}  ACTION REQUIRED: edit .env before running npm run dev${NC}"
echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "  Set at least ONE AI provider key (free options):"
echo -e "    ${BLUE}GEMINI_API_KEY${NC}=your-key  # https://aistudio.google.com/app/apikey"
echo -e "    ${BLUE}GROQ_API_KEY${NC}=your-key    # https://console.groq.com"
echo -e ""
echo -e "  Optional for Telegram reminders:"
echo -e "    ${BLUE}TELEGRAM_BOT_TOKEN${NC}=your-token"
echo -e "    ${BLUE}TELEGRAM_BOT_USERNAME${NC}=your-bot-name"

#  5. DOCKER 
echo -e "\n${YELLOW}>> Starting Docker services (postgres + redis)...${NC}"
docker compose up -d postgres redis 2>/dev/null || docker-compose up -d postgres redis

echo -e "${YELLOW}>> Waiting for PostgreSQL...${NC}"
RETRIES=30
until docker compose exec -T postgres pg_isready -U admin >/dev/null 2>&1 || [ "$RETRIES" -eq 0 ]; do
  echo "   Waiting... ($RETRIES left)"; sleep 2; RETRIES=$((RETRIES-1))
done
[ "$RETRIES" -eq 0 ] && echo -e "${RED}[ERROR] PostgreSQL timed out${NC}" && exit 1
echo -e "${GREEN}  [OK] PostgreSQL ready${NC}"

#  6. MIGRATIONS 
MIGRATION_DIR="apps/backend/src/database/migrations"
if [ -d "$MIGRATION_DIR" ] && [ -n "$(ls -A "$MIGRATION_DIR" 2>/dev/null)" ]; then
  echo -e "\n${YELLOW}>> Running database migrations...${NC}"
  npm run db:migrate \
    && echo -e "${GREEN}  [OK] Migrations complete${NC}" \
    || echo -e "${YELLOW}  [!!] Migrations failed  run manually: npm run db:migrate${NC}"
else
  echo -e "\n${YELLOW}  [!!] No migration files yet  skipping (TypeORM uses synchronize:true in dev)${NC}"
fi

#  7. N8N 
echo -e "\n${YELLOW}>> Starting n8n...${NC}"
docker compose up -d n8n 2>/dev/null || docker-compose up -d n8n
echo -e "${GREEN}  [OK] n8n at http://localhost:5678 (admin / admin123)${NC}"

#  8. SYNC N8N WORKFLOWS 
echo -e "\n${YELLOW}>> Syncing n8n workflows...${NC}"
if node scripts/sync-n8n-workflows.js; then
  echo -e "${GREEN}  [OK] Workflows synced${NC}"
else
  echo -e "${YELLOW}  [!!] Workflow sync failed — run manually: npm run n8n:sync${NC}"
  echo -e "${YELLOW}       Make sure N8N_API_KEY is set in apps/backend/.env or .env${NC}"
fi

#  9. DONE 
echo -e "\n${GREEN}"
echo "============================================"
echo "     Setup Complete!"
echo "============================================"
echo -e "${NC}"
echo -e "  Run ${BLUE}npm run dev${NC} to start"
echo ""
echo -e "  Frontend : ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend  : ${BLUE}http://localhost:3001${NC}"
echo -e "  Swagger  : ${BLUE}http://localhost:3001/api/docs${NC}"
echo -e "  n8n      : ${BLUE}http://localhost:5678${NC}  (admin / admin123)"
echo ""
echo -e "  To re-sync n8n workflows: ${BLUE}npm run n8n:sync${NC}"
echo -e "  To add credentials: open n8n UI → Credentials → New"
echo ""
echo -e "  ${YELLOW}ACTION REQUIRED: add your API keys to apps/backend/.env${NC}"
echo ""
