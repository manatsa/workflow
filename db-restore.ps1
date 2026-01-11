# Sonarworks Workflow System - Database Restore Script (PowerShell)
# Restores the PostgreSQL database from a backup file

param(
    [string]$BackupFile
)

# Database Configuration
$DB_HOST = "127.0.0.1"
$DB_PORT = "5432"
$DB_NAME = "workflow"
$DB_USER = "sonar"
$ADMIN_USER = "postgres"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================"
Write-Host "Sonarworks Database Restore"
Write-Host "========================================"
Write-Host ""

# Get backup file if not provided
if ([string]::IsNullOrEmpty($BackupFile)) {
    Write-Host "Available backup files:"
    Get-ChildItem -Path . -Filter "*.sql" | ForEach-Object { Write-Host "  - $($_.Name)" }
    Write-Host ""
    $BackupFile = Read-Host -Prompt "Enter backup filename"
}

# Check if file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file '$BackupFile' not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Backup File: $BackupFile"
Write-Host "Database: $DB_NAME"
Write-Host "Host: ${DB_HOST}:${DB_PORT}"
Write-Host ""
Write-Host "WARNING: This will DROP and recreate the database!" -ForegroundColor Yellow
Write-Host "All existing data will be lost!" -ForegroundColor Yellow
Write-Host ""

$Confirm = Read-Host -Prompt "Are you sure you want to continue? (yes/no)"
if ($Confirm -ne "yes") {
    Write-Host "Restore cancelled."
    exit 0
}

Write-Host ""
$SecurePassword = Read-Host -Prompt "Enter PostgreSQL admin password (postgres user)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $Password

Write-Host ""
Write-Host "Step 1: Dropping existing database..."
& psql -h $DB_HOST -p $DB_PORT -U $ADMIN_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

Write-Host "Step 2: Creating new database..."
& psql -h $DB_HOST -p $DB_PORT -U $ADMIN_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

Write-Host "Step 3: Restoring data from backup..."
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Restore completed with warnings. Please verify the data." -ForegroundColor Yellow
}

$env:PGPASSWORD = $null

Write-Host ""
Read-Host "Press Enter to exit"
