#!/bin/bash
# Sonarworks Workflow System - Database Reset Script (Linux/Mac)
# Drops and recreates the database with a fresh schema

# Database Configuration
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="workflow"
DB_USER="sonar"
ADMIN_USER="postgres"

echo "========================================"
echo "Sonarworks Database Reset"
echo "========================================"
echo ""
echo "Database: $DB_NAME"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo ""
echo "WARNING: This will DELETE ALL DATA in the database!"
echo "The application will recreate the schema on next startup."
echo ""

read -p "Are you sure you want to reset the database? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
read -sp "Enter PostgreSQL admin password (postgres user): " PGPASSWORD
echo ""
export PGPASSWORD

echo ""
echo "Step 1: Dropping existing database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$ADMIN_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "Step 2: Creating new empty database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$ADMIN_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

if [ $? -eq 0 ]; then
    echo ""
    echo "Database reset successfully!"
    echo "Start the application to initialize the schema."
else
    echo ""
    echo "Reset failed! Please check your credentials and try again."
fi

unset PGPASSWORD

echo ""
read -p "Press Enter to exit"
