# Sonarworks Workflow System - Start Script (PowerShell)
# This script starts the application and logs output to console.log

Write-Host "========================================"
Write-Host "Sonarworks Workflow System"
Write-Host "========================================"
Write-Host ""
Write-Host "Starting application..."
Write-Host "Logging to console.log"
Write-Host ""
Write-Host "Press Ctrl+C to stop the application"
Write-Host "========================================"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Start Java process and redirect output to console.log
$process = Start-Process -FilePath "java" -ArgumentList "-jar", "workflow-system-1.0.0.jar" -NoNewWindow -PassThru -RedirectStandardOutput "console.log" -RedirectStandardError "console.log"

Write-Host "Application started with PID: $($process.Id)"
Write-Host "Waiting for application to exit..."
Write-Host "Check console.log for application logs"
Write-Host ""

$process.WaitForExit()

Write-Host ""
Write-Host "Application stopped with exit code: $($process.ExitCode)"
