# UriTech — Stack Healthcheck Script (PowerShell)
# Uso: .\scripts\validate-stack.ps1

$services = @(
    @{ Name = "Postgres"; Url = "tcp://localhost:5432" },
    @{ Name = "Redis";    Url = "tcp://localhost:6379" },
    @{ Name = "MinIO";    Url = "http://localhost:9000/minio/health/live" }
)

$allOk = $true

foreach ($svc in $services) {
    try {
        if ($svc.Url -like "tcp://*") {
            $hostPort = $svc.Url -replace "tcp://",""
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect($hostPort.Split(":")[0], [int]$hostPort.Split(":")[1])
            $tcp.Close()
            Write-Host "[OK]   $($svc.Name) em $($svc.Url)" -ForegroundColor Green
        } else {
            $res = Invoke-WebRequest -Uri $svc.Url -UseBasicParsing -TimeoutSec 5
            if ($res.StatusCode -eq 200) {
                Write-Host "[OK]   $($svc.Name) em $($svc.Url)" -ForegroundColor Green
            } else {
                throw "HTTP $($res.StatusCode)"
            }
        }
    } catch {
        Write-Host "[FAIL] $($svc.Name) em $($svc.Url) — $($_.Exception.Message)" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
if ($allOk) {
    Write-Host "Stack local está saudável. Pode iniciar o backend com:" -ForegroundColor Cyan
    Write-Host "  cd apps/backend && npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "Alguns serviços não estão acessíveis. Verifique se o Docker está a correr:" -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.dev.yml up -d" -ForegroundColor Yellow
}
