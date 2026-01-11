# Sonarworks Workflow System - Database Backup Script (PowerShell)
# Creates a backup of the PostgreSQL database

# Database Configuration
$DB_HOST = "127.0.0.1"
$DB_PORT = "5432"
$DB_NAME = "workflow"
$DB_USER = "sonar"

# Generate backup filename with timestamp
$BACKUP_DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "workflow_backup_$BACKUP_DATE.sql"

Write-Host "========================================"
Write-Host "Sonarworks Database Backup"
Write-Host "========================================"
Write-Host ""
Write-Host "Database: $DB_NAME"
Write-Host "Host: ${DB_HOST}:${DB_PORT}"
Write-Host "User: $DB_USER"
Write-Host "Backup File: $BACKUP_FILE"
Write-Host ""

# Prompt for password securely
$SecurePassword = Read-Host -Prompt "Enter database password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable for pg_dump
$env:PGPASSWORD = $Password

Write-Host ""
Write-Host "Creating backup..."

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Run pg_dump
& pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "Backup saved to: $BACKUP_FILE"
} else {
    Write-Host ""
    Write-Host "Backup failed! Please check your credentials and try again." -ForegroundColor Red
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host ""
Read-Host "Press Enter to exit"
