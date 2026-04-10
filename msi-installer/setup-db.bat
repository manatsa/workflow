@echo off
setlocal enabledelayedexpansion

:: ============================================
::  Sona Workflow - Database Setup
::  Creates the PostgreSQL database and user
::  if they do not already exist.
:: ============================================

:: Try to find psql on PATH first
where psql >nul 2>&1
if %errorlevel% equ 0 (
    set PSQL_CMD=psql
    goto :found_psql
)

:: Check common PostgreSQL installation paths
for %%V in (17 16 15 14) do (
    if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" (
        set PSQL_CMD="C:\Program Files\PostgreSQL\%%V\bin\psql.exe"
        goto :found_psql
    )
)

echo ERROR: psql not found. Please ensure PostgreSQL is installed.
echo Download from: https://www.postgresql.org/download/windows/
exit /b 1

:found_psql
echo Found psql: %PSQL_CMD%
echo.

:: Check if PostgreSQL is running by attempting a connection
%PSQL_CMD% -U postgres -h localhost -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to PostgreSQL on localhost.
    echo Please ensure PostgreSQL is running and the 'postgres' superuser is accessible.
    echo.
    echo If you have a password set for the postgres user, you may be prompted for it.
    exit /b 1
)

echo [1/3] Checking if user 'sonar' exists...
%PSQL_CMD% -U postgres -h localhost -tAc "SELECT 1 FROM pg_roles WHERE rolname='sonar';" 2>nul | findstr "1" >nul
if %errorlevel% neq 0 (
    echo        Creating user 'sonar'...
    %PSQL_CMD% -U postgres -h localhost -c "CREATE USER sonar WITH PASSWORD 'P@88345!';" 2>nul
    if %errorlevel% neq 0 (
        echo WARNING: Could not create user 'sonar'. It may already exist or you lack permissions.
    ) else (
        echo        User 'sonar' created successfully.
    )
) else (
    echo        User 'sonar' already exists.
)

echo [2/3] Checking if database 'workflow' exists...
%PSQL_CMD% -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='workflow';" 2>nul | findstr "1" >nul
if %errorlevel% neq 0 (
    echo        Creating database 'workflow'...
    %PSQL_CMD% -U postgres -h localhost -c "CREATE DATABASE workflow OWNER sonar;" 2>nul
    if %errorlevel% neq 0 (
        echo WARNING: Could not create database 'workflow'. It may already exist or you lack permissions.
    ) else (
        echo        Database 'workflow' created successfully.
    )
) else (
    echo        Database 'workflow' already exists.
)

echo [3/3] Granting privileges...
%PSQL_CMD% -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE workflow TO sonar;" 2>nul
%PSQL_CMD% -U postgres -h localhost -d workflow -c "GRANT ALL ON SCHEMA public TO sonar;" 2>nul
echo        Privileges granted.

echo.
echo Database setup complete.
exit /b 0
