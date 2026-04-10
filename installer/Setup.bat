@echo off
title Sonarworks Workflow System - Setup
echo.
echo ========================================
echo   Sonarworks Workflow System Installer
echo ========================================
echo.

:: Check for PowerShell
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: PowerShell is required but not found.
    pause
    exit /b 1
)

:: Run PowerShell installer
powershell -ExecutionPolicy Bypass -File "%~dp0Install.ps1"

pause
