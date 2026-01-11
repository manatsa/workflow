#!/bin/bash
# Sonarworks Workflow System - Database Restore Script (Linux/Mac)
# Restores the PostgreSQL database from a backup file

# Database Configuration
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="workflow"
DB_USER="sonar"
ADMIN_USER="postgres"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "Sonarworks Database Restore"
echo "========================================"
echo ""

# Get backup file from argument or prompt
BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
    echo "Available backup files:"
    ls -1 *.sql 2>/dev/null || echo "  (none found)"
    echo ""
    read -p "Enter backup filename: " BACKUP_FILE
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found!"
    exit 1
fi

echo ""
echo "Backup File: $BACKUP_FILE"
echo "Database: $DB_NAME"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo ""
echo "WARNING: This will DROP and recreate the database!"
echo "All existing data will be lost!"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
read -sp "Enter PostgreSQL admin password (postgres user): " PGPASSWORD
echo ""
export PGPASSWORD

echo ""
echo "Step 1: Dropping existing database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$ADMIN_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "Step 2: Creating new database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$ADMIN_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "Step 3: Restoring data from backup..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "Database restored successfully!"
else
    echo ""
    echo "Restore completed with warnings. Please verify the data."
fi

unset PGPASSWORD

echo ""
read -p "Press Enter to exit"
