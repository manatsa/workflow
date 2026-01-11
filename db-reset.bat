@echo off
REM Sonarworks Workflow System - Database Reset Script (Windows Batch)
REM Drops and recreates the database with a fresh schema

setlocal

REM Database Configuration
set DB_HOST=127.0.0.1
set DB_PORT=5432
set DB_NAME=workflow
set DB_USER=sonar
set ADMIN_USER=postgres

echo ========================================
echo Sonarworks Database Reset
echo ========================================
echo.
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo.
echo WARNING: This will DELETE ALL DATA in the database!
echo The application will recreate the schema on next startup.
echo.
set /p "CONFIRM=Are you sure you want to reset the database? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo Reset cancelled.
    pause
    exit /b 0
)

echo.
set /p "PGPASSWORD=Enter PostgreSQL admin password (postgres user): "

echo.
echo Step 1: Dropping existing database...
psql -h %DB_HOST% -p %DB_PORT% -U %ADMIN_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"

echo Step 2: Creating new empty database...
psql -h %DB_HOST% -p %DB_PORT% -U %ADMIN_USER% -d postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database reset successfully!
    echo Start the application to initialize the schema.
) else (
    echo.
    echo Reset failed! Please check your credentials and try again.
)

echo.
pause
endlocal
