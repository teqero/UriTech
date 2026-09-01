@echo off
cls
echo ==========================================
echo    UriTech - Stack de Desenvolvimento
echo ==========================================
echo.

echo [1/4] Verificar Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo Docker nao esta a correr. Inicia o Docker Desktop primeiro.
    pause
    exit /b 1
)
echo Docker OK

echo [2/4] Subir infraestrutura Docker...
cd /d "%~dp0"
docker compose -f docker-compose.dev.yml up -d
echo Infraestrutura no ar

echo [3/4] Iniciar backend NestJS...
start "Backend" cmd /k "cd /d %~dp0apps/backend && npm run start:prod"
echo Backend iniciado em http://localhost:4000

echo [4/4] Iniciar aplicacoes web...
start "Admin" cmd /k "cd /d %~dp0apps/web-admin && npm run dev"
echo Admin em http://localhost:3000
start "App" cmd /k "cd /d %~dp0apps/web-user && npm run dev"
echo App em http://localhost:3001

echo.
echo ==========================================
echo    Tudo no ar! Acede:
echo    - API Docs:  http://localhost:4000/api/docs
echo    - API:       http://localhost:4000/api/v1
echo    - Admin:     http://localhost:3000
echo    - App:       http://localhost:3001
echo    - MinIO:     http://localhost:9002
echo ==========================================
pause
