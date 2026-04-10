@echo off
title Sonar Workflow System
cd /d "%~dp0"

:: Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo Java is not installed or not in PATH.
    echo Please install Java 21 or later from https://adoptium.net/
    pause
    exit /b 1
)

:: Detect local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
    goto :found
)
:found
if "%LOCAL_IP%"=="" set LOCAL_IP=localhost

:: Start the application
echo Starting Sonar Workflow System v1.5.0...
echo.
echo The application will be available at: http://%LOCAL_IP%:9500
echo.
echo Press Ctrl+C to stop the server.
echo.

java -jar "%~dp0workflow-system-1.5.0.jar"
pause
