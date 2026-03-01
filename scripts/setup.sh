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
for f in $(find . -name ".env.example" -not -path "*/node_modules/*" -not -path "*/.next/*"); do
  dest="${f%.example}"
  if [ ! -f "$dest" ]; then
    cp "$f" "$dest"
    echo -e "${GREEN}  [OK] Created: $dest${NC}"
  else
    echo -e "${YELLOW}  [!!] Already exists: $dest${NC}"
  fi
done

grep -q "sk-your-api-key-here" apps/backend/.env 2>/dev/null \
  && echo -e "\n${YELLOW}  [!!] ACTION: Set OPENAI_API_KEY in apps/backend/.env${NC}"

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
