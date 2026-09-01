#!/usr/bin/env bash
# UriTech — Stack Healthcheck Script (Bash)
# Uso: bash scripts/validate-stack.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

all_ok=true

check_tcp() {
  local name="$1" host="$2" port="$3"
  if timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
    echo -e "${GREEN}[OK]   $name em $host:$port${NC}"
  else
    echo -e "${RED}[FAIL] $name em $host:$port${NC}"
    all_ok=false
  fi
}

check_http() {
  local name="$1" url="$2"
  if curl -sf "$url" >/dev/null 2>&1; then
    echo -e "${GREEN}[OK]   $name em $url${NC}"
  else
    echo -e "${RED}[FAIL] $name em $url${NC}"
    all_ok=false
  fi
}

check_tcp "Postgres" "localhost" "5432"
check_tcp "Redis"    "localhost" "6379"
check_http "MinIO"   "http://localhost:9000/minio/health/live"

echo ""
if [ "$all_ok" = true ]; then
  echo -e "${CYAN}Stack local está saudável. Pode iniciar o backend com:${NC}"
  echo -e "${CYAN}  cd apps/backend && npm run dev${NC}"
else
  echo -e "${YELLOW}Alguns serviços não estão acessíveis. Verifique se o Docker está a correr:${NC}"
  echo -e "${YELLOW}  docker compose -f docker-compose.dev.yml up -d${NC}"
fi
