@echo off
title Sonar Workflow System v1.5.0
cd /d "%~dp0"

echo ============================================
echo  Sonar Workflow System v1.5.0
echo ============================================
echo.

:: First-launch database setup
if not exist "%~dp0.initialized" (
    echo First launch detected - running database setup...
    echo.
    call "%~dp0setup-db.bat"
    if %errorlevel% neq 0 (
        echo.
        echo WARNING: Database setup encountered issues.
        echo Please ensure PostgreSQL is running and try again.
        echo.
        pause
        exit /b 1
    )
    echo. > "%~dp0.initialized"
    echo.
)

:: Detect local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
    goto :found
)
:found
if "%LOCAL_IP%"=="" set LOCAL_IP=localhost

:: Start the application
echo Starting Sonar Workflow System...
echo.
echo The application will be available at: http://%LOCAL_IP%:9500
echo.
echo Press Ctrl+C to stop the server.
echo.

java -jar "%~dp0workflow-system-1.5.0.jar"
pause
