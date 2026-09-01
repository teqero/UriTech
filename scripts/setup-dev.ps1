# UriTech — Setup de desenvolvimento rápido (PowerShell)
# Uso: .\scripts\setup-dev.ps1

Write-Host "🚀 UriTech — Setup de desenvolvimento" -ForegroundColor Cyan

# 1. Criar .env se não existir
if (-not (Test-Path "apps/backend/.env")) {
    Copy-Item "apps/backend/.env.example" "apps/backend/.env"
    Write-Host "✅ Criado apps/backend/.env a partir do exemplo" -ForegroundColor Green
} else {
    Write-Host "⚠️  apps/backend/.env já existe — a manter" -ForegroundColor Yellow
}

# 2. Subir Docker
Write-Host "🐳 A subir Docker Compose (Postgres + Redis + MinIO)..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d

# 3. Aguardar healthchecks
Write-Host "⏳ A aguardar serviços ficarem prontos..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# 4. Healthcheck
.\scripts\validate-stack.ps1

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. cd apps/backend" -ForegroundColor White
Write-Host "   2. npm run dev" -ForegroundColor White
Write-Host "   3. Aceda a http://localhost:4000/api/v1" -ForegroundColor White
