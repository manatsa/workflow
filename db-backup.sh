#!/bin/bash
# Sonarworks Workflow System - Database Backup Script (Linux/Mac)
# Creates a backup of the PostgreSQL database

# Database Configuration
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="workflow"
DB_USER="sonar"

# Generate backup filename with timestamp
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="workflow_backup_${BACKUP_DATE}.sql"

echo "========================================"
echo "Sonarworks Database Backup"
echo "========================================"
echo ""
echo "Database: $DB_NAME"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "User: $DB_USER"
echo "Backup File: $BACKUP_FILE"
echo ""

# Prompt for password
read -sp "Enter database password: " PGPASSWORD
echo ""
export PGPASSWORD

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "Creating backup..."

# Run pg_dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "Backup completed successfully!"
    echo "Backup saved to: $BACKUP_FILE"
else
    echo ""
    echo "Backup failed! Please check your credentials and try again."
fi

# Clear password from environment
unset PGPASSWORD

echo ""
read -p "Press Enter to exit"
