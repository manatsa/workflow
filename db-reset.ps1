# Sonarworks Workflow System - Database Reset Script (PowerShell)
# Drops and recreates the database with a fresh schema

# Database Configuration
$DB_HOST = "127.0.0.1"
$DB_PORT = "5432"
$DB_NAME = "workflow"
$DB_USER = "sonar"
$ADMIN_USER = "postgres"

Write-Host "========================================"
Write-Host "Sonarworks Database Reset"
Write-Host "========================================"
Write-Host ""
Write-Host "Database: $DB_NAME"
Write-Host "Host: ${DB_HOST}:${DB_PORT}"
Write-Host ""
Write-Host "WARNING: This will DELETE ALL DATA in the database!" -ForegroundColor Red
Write-Host "The application will recreate the schema on next startup." -ForegroundColor Yellow
Write-Host ""

$Confirm = Read-Host -Prompt "Are you sure you want to reset the database? (yes/no)"
if ($Confirm -ne "yes") {
    Write-Host "Reset cancelled."
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

Write-Host "Step 2: Creating new empty database..."
& psql -h $DB_HOST -p $DB_PORT -U $ADMIN_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Database reset successfully!" -ForegroundColor Green
    Write-Host "Start the application to initialize the schema."
} else {
    Write-Host ""
    Write-Host "Reset failed! Please check your credentials and try again." -ForegroundColor Red
}

$env:PGPASSWORD = $null

Write-Host ""
Read-Host "Press Enter to exit"
