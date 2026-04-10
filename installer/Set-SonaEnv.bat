@echo off
REM #####################################################
REM   Sona Workflow System - Environment Variables Setup
REM   Command Prompt Script
REM   Version 1.5.0
REM #####################################################
REM
REM   Usage:
REM     1. Edit the values below to match your environment
REM     2. Run in CMD: Set-SonaEnv.bat
REM     3. Start the application: java -jar workflow-system-1.5.0.jar
REM
REM   Variables are set for the CURRENT session only.
REM   To set permanently, use: setx VARIABLE "value" /M (as Admin)
REM
REM #####################################################

echo ============================================
echo   Sona Workflow - Environment Variables
echo ============================================
echo.

REM ==================== DATABASE ====================
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=workflow
set DB_USERNAME=sonar
set DB_PASSWORD=P@88345!

set SPRING_DATASOURCE_URL=jdbc:postgresql://%DB_HOST%:%DB_PORT%/%DB_NAME%
set SPRING_DATASOURCE_USERNAME=%DB_USERNAME%
set SPRING_DATASOURCE_PASSWORD=%DB_PASSWORD%

echo [Database]
echo   Host:     %DB_HOST%
echo   Port:     %DB_PORT%
echo   Database: %DB_NAME%
echo   Username: %DB_USERNAME%
echo   Password: ****
echo.

REM ==================== SERVER ====================
set SERVER_PORT=9500

echo [Server]
echo   Port: %SERVER_PORT%
echo.

REM ==================== EMAIL (SMTP) ====================
set MAIL_HOST=smtp.gmail.com
set MAIL_PORT=587
set MAIL_USERNAME=
set MAIL_PASSWORD=

echo [Email]
if defined MAIL_USERNAME (
    echo   Host:     %MAIL_HOST%
    echo   Port:     %MAIL_PORT%
    echo   Username: %MAIL_USERNAME%
    echo   Password: ****
) else (
    echo   Not configured (set MAIL_USERNAME to enable)
)
echo.

REM ==================== APPLICATION ====================
set APP_BASE_URL=
set JWT_SECRET=SonarWorkflowSystemSecretKeyForJWTTokenGenerationMustBeAtLeast256Bits
set AES_KEY=SonarAESKey12345

echo [Application]
if defined APP_BASE_URL (
    echo   Base URL: %APP_BASE_URL%
) else (
    echo   Base URL: (auto-detect)
)
echo   JWT Secret:     ****
echo   Encryption Key: ****
echo.

REM ==================== SUMMARY ====================
echo ============================================
echo   Variables set for CURRENT SESSION
echo   Start the app in THIS terminal window
echo ============================================
echo.
echo To start Sona Workflow:
echo   java -jar workflow-system-1.5.0.jar
echo.
echo Access at: http://localhost:%SERVER_PORT%
echo.

REM To make permanent (run as Administrator), uncomment these:
REM setx SPRING_DATASOURCE_URL "jdbc:postgresql://%DB_HOST%:%DB_PORT%/%DB_NAME%" /M
REM setx SPRING_DATASOURCE_USERNAME "%DB_USERNAME%" /M
REM setx SPRING_DATASOURCE_PASSWORD "%DB_PASSWORD%" /M
REM setx SERVER_PORT "%SERVER_PORT%" /M
REM setx MAIL_HOST "%MAIL_HOST%" /M
REM setx MAIL_PORT "%MAIL_PORT%" /M
REM setx MAIL_USERNAME "%MAIL_USERNAME%" /M
REM setx MAIL_PASSWORD "%MAIL_PASSWORD%" /M
REM setx APP_BASE_URL "%APP_BASE_URL%" /M
REM setx JWT_SECRET "%JWT_SECRET%" /M
REM setx AES_KEY "%AES_KEY%" /M
