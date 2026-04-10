@echo off
title Sonar Workflow System v1.5.0
echo ========================================
echo   Sonar Workflow System v1.5.0
echo ========================================
echo.

:: Detect local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
    goto :found
)
:found
if "%LOCAL_IP%"=="" set LOCAL_IP=localhost

:: Find JAR
set JAR_FILE=
if exist "backend\target\workflow-system-1.5.0.jar" set JAR_FILE=backend\target\workflow-system-1.5.0.jar
if exist "workflow-system-1.5.0.jar" set JAR_FILE=workflow-system-1.5.0.jar
if exist "installer\workflow-system-1.5.0.jar" set JAR_FILE=installer\workflow-system-1.5.0.jar

if "%JAR_FILE%"=="" (
    echo Error: workflow-system-1.5.0.jar not found
    pause
    exit /b 1
)

echo Starting application...
echo JAR: %JAR_FILE%
echo URL: http://%LOCAL_IP%:9500
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

java -jar "%JAR_FILE%" 2>&1
pause
