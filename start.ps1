# Sonar Workflow System - Start Script (PowerShell)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sonar Workflow System v1.5.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Detect local IP
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
} catch { $localIP = "localhost" }
if (-not $localIP) { $localIP = "localhost" }

# Find JAR
$jarFile = $null
if (Test-Path "backend\target\workflow-system-1.5.0.jar") { $jarFile = "backend\target\workflow-system-1.5.0.jar" }
elseif (Test-Path "workflow-system-1.5.0.jar") { $jarFile = "workflow-system-1.5.0.jar" }
elseif (Test-Path "installer\workflow-system-1.5.0.jar") { $jarFile = "installer\workflow-system-1.5.0.jar" }

if (-not $jarFile) {
    Write-Host "Error: workflow-system-1.5.0.jar not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "JAR: $jarFile" -ForegroundColor White
Write-Host "URL: http://${localIP}:9500" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

java -jar $jarFile 2>&1 | Tee-Object -FilePath "console.log"

Write-Host ""
Write-Host "Application stopped." -ForegroundColor Yellow
