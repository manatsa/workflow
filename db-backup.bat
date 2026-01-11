@echo off
REM Sonarworks Workflow System - Database Backup Script (Windows Batch)
REM Creates a backup of the PostgreSQL database

setlocal

REM Database Configuration
set DB_HOST=127.0.0.1
set DB_PORT=5432
set DB_NAME=workflow
set DB_USER=sonar

REM Get current date/time for backup filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "BACKUP_DATE=%dt:~0,8%_%dt:~8,6%"
set "BACKUP_FILE=workflow_backup_%BACKUP_DATE%.sql"

echo ========================================
echo Sonarworks Database Backup
echo ========================================
echo.
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo Backup File: %BACKUP_FILE%
echo.

REM Prompt for password
set /p "PGPASSWORD=Enter database password: "

echo.
echo Creating backup...

pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Backup completed successfully!
    echo Backup saved to: %BACKUP_FILE%
) else (
    echo.
    echo Backup failed! Please check your credentials and try again.
)

echo.
pause
endlocal
