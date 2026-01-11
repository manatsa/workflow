@echo off
REM Sonarworks Workflow System - Start Script (Windows Batch)
REM This script starts the application and logs output to console.log

echo ========================================
echo Sonarworks Workflow System
echo ========================================
echo.
echo Starting application...
echo Logging to console.log
echo.
echo Press Ctrl+C to stop the application
echo ========================================

java -jar workflow-system-1.0.0.jar > console.log 2>&1

echo.
echo Application stopped.
pause
