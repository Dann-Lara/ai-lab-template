#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║      🚀 AI Lab Template Setup         ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Check requirements
echo -e "${YELLOW}Checking requirements...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is required. Install v20+${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required.${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required.${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is required.${NC}"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js v20+ required. Current: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo -e "${GREEN}✅ npm $(npm -v)${NC}"
echo -e "${GREEN}✅ Docker found${NC}"

# Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Setup Husky
echo -e "\n${YELLOW}🐕 Setting up Git hooks (Husky)...${NC}"
npx husky install
echo -e "${GREEN}✅ Husky configured${NC}"

# Copy .env files
echo -e "\n${YELLOW}⚙️  Setting up environment files...${NC}"
for env_example in $(find . -name ".env.example" -not -path "*/node_modules/*" -not -path "*/.next/*"); do
  env_file="${env_example%.example}"
  if [ ! -f "$env_file" ]; then
    cp "$env_example" "$env_file"
    echo -e "${GREEN}  ✅ Created: $env_file${NC}"
  else
    echo -e "${YELLOW}  ⚠️  Already exists (skipped): $env_file${NC}"
  fi
done

# Check OPENAI_API_KEY
if grep -q "sk-your-api-key-here" apps/backend/.env 2>/dev/null; then
  echo -e "\n${YELLOW}⚠️  Remember to set your OPENAI_API_KEY in apps/backend/.env${NC}"
fi

# Start Docker services
echo -e "\n${YELLOW}🐳 Starting Docker services (postgres + redis)...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
RETRIES=30
until docker-compose exec -T postgres pg_isready -U admin > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "  Waiting... ($RETRIES retries left)"
  sleep 2
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
  echo -e "${RED}❌ PostgreSQL did not become ready in time${NC}"
  exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Run migrations
echo -e "\n${YELLOW}🗄️  Running database migrations...${NC}"
npm run db:migrate
echo -e "${GREEN}✅ Migrations complete${NC}"

# Start n8n
echo -e "\n${YELLOW}🔄 Starting n8n...${NC}"
docker-compose up -d n8n
echo -e "${GREEN}✅ n8n started at http://localhost:5678${NC}"

echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║       ✅ Setup Complete!               ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"
echo -e "Run ${BLUE}npm run dev${NC} to start development servers"
echo ""
echo -e "  Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:3001${NC}"
echo -e "  API Docs:  ${BLUE}http://localhost:3001/api/docs${NC}"
echo -e "  n8n:       ${BLUE}http://localhost:5678${NC} (admin/admin123)"
echo ""
