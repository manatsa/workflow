@echo off
REM Sonarworks Workflow System - Database Restore Script (Windows Batch)
REM Restores the PostgreSQL database from a backup file

setlocal

REM Database Configuration
set DB_HOST=127.0.0.1
set DB_PORT=5432
set DB_NAME=workflow
set DB_USER=sonar
set ADMIN_USER=postgres

echo ========================================
echo Sonarworks Database Restore
echo ========================================
echo.

REM Check if backup file is provided
if "%~1"=="" (
    echo Usage: db-restore.bat [backup_file.sql]
    echo.
    echo Available backup files:
    dir /b *.sql 2>nul
    echo.
    set /p "BACKUP_FILE=Enter backup filename: "
) else (
    set "BACKUP_FILE=%~1"
)

REM Check if file exists
if not exist "%BACKUP_FILE%" (
    echo Error: Backup file '%BACKUP_FILE%' not found!
    pause
    exit /b 1
)

echo.
echo Backup File: %BACKUP_FILE%
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo.
echo WARNING: This will DROP and recreate the database!
echo All existing data will be lost!
echo.
set /p "CONFIRM=Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo.
set /p "PGPASSWORD=Enter PostgreSQL admin password (postgres user): "

echo.
echo Step 1: Dropping existing database...
psql -h %DB_HOST% -p %DB_PORT% -U %ADMIN_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"

echo Step 2: Creating new database...
psql -h %DB_HOST% -p %DB_PORT% -U %ADMIN_USER% -d postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"

echo Step 3: Restoring data from backup...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database restored successfully!
) else (
    echo.
    echo Restore completed with warnings. Please verify the data.
)

echo.
pause
endlocal
