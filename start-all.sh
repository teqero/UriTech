#!/usr/bin/env bash
# UriGo — arranca todos os serviços + Expo LAN (Git Bash / WSL / macOS / Linux)
# Uso: ./start-all.sh
#      ./start-all.sh --kill-ports

set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

KILL_PORTS=false
if [[ "${1:-}" == "--kill-ports" ]]; then
  KILL_PORTS=true
fi

get_lan_ip() {
  if command -v ipconfig &>/dev/null; then
    ipconfig | grep -Eo '192\.168\.[0-9]+\.[0-9]+' | head -1
  elif command -v hostname &>/dev/null; then
    hostname -I 2>/dev/null | awk '{print $1}'
  else
    echo "127.0.0.1"
  fi
}

stop_port() {
  local port=$1
  if command -v netstat &>/dev/null; then
    local pid
    pid=$(netstat -ano 2>/dev/null | grep ":$port " | grep LISTENING | awk '{print $NF}' | head -1)
    if [[ -n "$pid" && "$pid" != "0" ]]; then
      taskkill //PID "$pid" //F 2>/dev/null || kill "$pid" 2>/dev/null || true
      echo "  Porta $port libertada (PID $pid)"
    fi
  fi
}

start_bg() {
  local title=$1
  shift
  echo "  [OK] $title"
  if [[ "$(uname -s)" == MINGW* ]] || [[ "$(uname -s)" == MSYS* ]]; then
    powershell -NoExit -Command "Set-Location '$ROOT'; `$Host.UI.RawUI.WindowTitle='$title'; $*"
  else
    (cd "$ROOT" && eval "$*") &
  fi
}

LAN_IP="$(get_lan_ip)"
API_URL="http://${LAN_IP}:4000/api/v1"
EXPO_URL="exp://${LAN_IP}:8084"

echo ""
echo "UriGo — arranque de todos os serviços"
echo "====================================="
echo ""

if $KILL_PORTS; then
  echo "A libertar portas..."
  for p in 4000 3000 3001 8082 8083 8084; do stop_port "$p"; done
  sleep 2
fi

echo "A compilar @uritech/shared..."
npm run build --workspace=@uritech/shared

echo ""
echo "A arrancar serviços..."

start_bg "UriGo Backend :4000" "npm run dev --workspace=@uritech/backend"
sleep 2
start_bg "UriGo Web Admin :3000" "npm run dev --workspace=@uritech/web-admin"
start_bg "UriGo Web User :3001" "npm run dev --workspace=@uritech/web-user"
start_bg "UriGo Mobile Driver :8082" "npm run dev --workspace=@uritech/mobile-driver"
start_bg "UriGo Mobile Vendor :8083" "npm run dev --workspace=@uritech/mobile-vendor"

export EXPO_PUBLIC_API_URL="$API_URL"
start_bg "UriGo Mobile User (Wi-Fi) :8084" "cd apps/mobile-user && npx expo start --port 8084 --lan"

QR_PATH="$ROOT/expo-wifi-qr.png"
ENCODED=$(python -c "import urllib.parse; print(urllib.parse.quote('$EXPO_URL'))" 2>/dev/null || echo "$EXPO_URL")
curl -fsSL "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${ENCODED}" -o "$QR_PATH" 2>/dev/null \
  && echo "" && echo "QR code: $QR_PATH" \
  || echo "Gere o QR manualmente com: $EXPO_URL"

echo ""
echo "Telemóvel (Wi‑Fi): $EXPO_URL"
echo "API mobile:       $API_URL"
echo ""
