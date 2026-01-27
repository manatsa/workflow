@echo off
title Sonar Workflow System
cd /d "%~dp0"

:: Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo Java is not installed or not in PATH.
    echo Please install Java 25 or later from https://adoptium.net/
    pause
    exit /b 1
)

:: Start the application
echo Starting Sonar Workflow System...
echo.
echo The application will be available at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server.
echo.

java -jar "%~dp0workflow-system-1.0.0.jar" --spring.profiles.active=prod
pause
