# UriGo - arranca todos os servicos + Expo em modo Wi-Fi (LAN)
# Uso: .\start-all.ps1
#      .\start-all.ps1 -KillPorts

param(
  [switch]$KillPorts
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

$Ports = @{
  Backend      = 4000
  WebAdmin     = 3000
  WebUser      = 3001
  MobileDriver = 8082
  MobileVendor = 8083
  MobileUser   = 8084
}

function Get-LanIp {
  # Prefer real Wi-Fi/Ethernet; skip VMware, Hyper-V, Docker, VPN, hotspot bridges.
  Import-Module NetTCPIP -ErrorAction SilentlyContinue | Out-Null
  $skipAlias = '(?i)(VMware|VirtualBox|Hyper-V|vEthernet|Docker|WSL|VPN|OpenVPN|Tailscale|ZeroTier|Bluetooth|Loopback|Local Area Connection\*|Liga)'
  $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -match '^(192\.168\.|10\.)' -and
      $_.PrefixOrigin -ne 'WellKnown' -and
      $_.InterfaceAlias -notmatch $skipAlias
    }

  $adapters = Get-NetIPInterface -AddressFamily IPv4 -ErrorAction SilentlyContinue
  $ranked = foreach ($c in $candidates) {
    $iface = $adapters | Where-Object { $_.InterfaceIndex -eq $c.InterfaceIndex } | Select-Object -First 1
    $alias = $c.InterfaceAlias
    $score = 100
    if ($alias -match '(?i)Wi-?Fi|WLAN|Wireless') { $score -= 50 }
    elseif ($alias -match '(?i)Ethernet|LAN') { $score -= 30 }
    if ($c.PrefixOrigin -eq 'Dhcp') { $score -= 10 }
    if ($iface) { $score += [int]$iface.InterfaceMetric }
    [PSCustomObject]@{
      IPAddress = $c.IPAddress
      Alias     = $alias
      Score     = $score
    }
  }

  $best = $ranked | Sort-Object Score | Select-Object -First 1
  if ($best) {
    Write-Host "  IP LAN escolhido: $($best.IPAddress) ($($best.Alias))" -ForegroundColor DarkGray
    return $best.IPAddress
  }

  $line = (ipconfig | Select-String 'IPv4').Line |
    Where-Object { $_ -match '192\.168\.0\.' -or $_ -match '192\.168\.' } |
    Select-Object -First 1
  if ($line -match ':\s*([\d.]+)') { return $Matches[1] }
  return '127.0.0.1'
}

function Stop-PortListener([int]$Port) {
  $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    if ($procId -and $procId -ne 0) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Write-Host "  Porta $Port libertada (PID $procId)" -ForegroundColor DarkYellow
    }
  }
}

function Start-ServiceWindow([string]$Title, [string]$Command, [hashtable]$ExtraEnv = @{}) {
  $envLines = ($ExtraEnv.GetEnumerator() | ForEach-Object {
    "`$env:$($_.Key)='$($_.Value)';"
  }) -join ' '
  $full = @"
Set-Location '$Root'
$envLines
`$Host.UI.RawUI.WindowTitle = '$Title'
Write-Host '=== $Title ===' -ForegroundColor Cyan
$Command
"@

  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $full
  ) | Out-Null
  Write-Host "  [OK] $Title" -ForegroundColor Green
}

Write-Host ''
Write-Host 'UriGo - arranque de todos os servicos' -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error 'Node.js nao encontrado. Instale Node >= 20.'
  exit 1
}

$LanIp = Get-LanIp
$ApiUrl = "http://${LanIp}:$($Ports.Backend)/api/v1"
$ExpoUrl = "exp://${LanIp}:$($Ports.MobileUser)"

if ($KillPorts) {
  Write-Host 'A libertar portas...' -ForegroundColor Yellow
  $Ports.Values | ForEach-Object { Stop-PortListener $_ }
  Start-Sleep -Seconds 2
}

Write-Host 'A compilar @uritech/shared (uma vez)...' -ForegroundColor Yellow
npm run build --workspace=@uritech/shared
if ($LASTEXITCODE -ne 0) {
  Write-Error "Falha ao compilar shared. Feche outros terminais com tsc --watch e tente de novo."
  exit 1
}

Write-Host ''
Write-Host 'A abrir servicos em janelas separadas...' -ForegroundColor Yellow

Start-ServiceWindow 'UriGo Backend :4000' 'npm run dev --workspace=@uritech/backend'
Start-Sleep -Seconds 2

Start-ServiceWindow 'UriGo Web Admin :3000' 'npm run dev --workspace=@uritech/web-admin'
Start-ServiceWindow 'UriGo Web User :3001' 'npm run dev --workspace=@uritech/web-user'

Start-ServiceWindow 'UriGo Mobile Driver :8082' 'npm run dev --workspace=@uritech/mobile-driver'
Start-ServiceWindow 'UriGo Mobile Vendor :8083' 'npm run dev --workspace=@uritech/mobile-vendor'

$mobileEnv = @{
  EXPO_PUBLIC_API_URL = $ApiUrl
}
$mobileCmd = "Set-Location '$Root\apps\mobile-user'; npx expo start --port $($Ports.MobileUser) --lan --clear"
Start-ServiceWindow 'UriGo Mobile User (Wi-Fi) :8084' $mobileCmd $mobileEnv

# QR code para Expo Go
$qrPath = Join-Path $Root 'expo-wifi-qr.png'
try {
  $encoded = [uri]::EscapeDataString($ExpoUrl)
  $qrUri = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + $encoded
  Invoke-WebRequest -Uri $qrUri -OutFile $qrPath -UseBasicParsing -TimeoutSec 15
  Write-Host ''
  Write-Host "QR code guardado: $qrPath" -ForegroundColor Green
} catch {
  Write-Host 'Nao foi possivel gerar QR automaticamente. Use o URL abaixo no Expo Go.' -ForegroundColor DarkYellow
}

Write-Host ''
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host 'Servicos' -ForegroundColor White
Write-Host "  API:        http://localhost:$($Ports.Backend)/api/v1"
Write-Host "  Web Admin:  http://localhost:$($Ports.WebAdmin)"
Write-Host "  Web User:   http://localhost:$($Ports.WebUser)"
Write-Host "  Mobile Drv: exp://localhost:$($Ports.MobileDriver)  (legado)"
Write-Host "  Mobile Vnd: exp://localhost:$($Ports.MobileVendor)  (legado)"
Write-Host ''
Write-Host 'Telemovel (Wi-Fi - mesma rede que o PC)' -ForegroundColor White
Write-Host "  IP LAN:     $LanIp"
Write-Host "  Expo Go:    $ExpoUrl"
Write-Host "  API mobile: $ApiUrl"
Write-Host ''
Write-Host 'Passos no telemovel:' -ForegroundColor Yellow
Write-Host '  1. Instale Expo Go'
Write-Host '  2. Mesma rede Wi-Fi que o PC (sem VPN)'
Write-Host "  3. Escaneie expo-wifi-qr.png ou introduza: $ExpoUrl"
Write-Host "  4. Se falhar, abra no browser do telemovel: http://${LanIp}:$($Ports.MobileUser)"
Write-Host ''
Write-Host 'Contas demo (palavra-passe: demo123):' -ForegroundColor DarkGray
Write-Host '  joao@uritech.com | budi@uritech.com | warung@uritech.com'
Write-Host ''
Write-Host 'Para libertar portas na proxima execucao: .\start-all.ps1 -KillPorts' -ForegroundColor DarkGray
Write-Host ''
