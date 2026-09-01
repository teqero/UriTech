#!/usr/bin/env bash
# UriTech — Setup de desenvolvimento rápido (Bash)
# Uso: bash scripts/setup-dev.sh

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

echo -e "${CYAN}🚀 UriTech — Setup de desenvolvimento${NC}"

# 1. Criar .env se não existir
if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo -e "${GREEN}✅ Criado apps/backend/.env a partir do exemplo${NC}"
else
    echo -e "${YELLOW}⚠️  apps/backend/.env já existe — a manter${NC}"
fi

# 2. Subir Docker
echo -e "${CYAN}🐳 A subir Docker Compose (Postgres + Redis + MinIO)...${NC}"
docker compose -f docker-compose.dev.yml up -d

# 3. Aguardar healthchecks
echo -e "${CYAN}⏳ A aguardar serviços ficarem prontos...${NC}"
sleep 10

# 4. Healthcheck
bash scripts/validate-stack.sh

echo ""
echo -e "${CYAN}📋 Próximos passos:${NC}"
echo -e "${WHITE}   1. cd apps/backend${NC}"
echo -e "${WHITE}   2. npm run dev${NC}"
echo -e "${WHITE}   3. Aceda a http://localhost:4000/api/v1${NC}"
