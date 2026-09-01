@echo off
chcp 65001 >nul
title UriTech — Parar Stack
echo A parar todos os servicos UriTech...

cd /d "%~dp0"

REM Parar Docker
docker compose -f docker-compose.dev.yml down 2>nul

REM Parar processos Node
TASKKILL /F /IM node.exe /FI "WINDOWTITLE eq UriTech Backend*" 2>nul
TASKKILL /F /IM node.exe /FI "WINDOWTITLE eq UriTech Admin*" 2>nul
TASKKILL /F /IM node.exe /FI "WINDOWTITLE eq UriTech App*" 2>nul

echo ✅ Tudo parado.
pause
