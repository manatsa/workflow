# PostgreSQL Setup Instructions for Sonar Workflow System

## Prerequisites
- PostgreSQL server running on localhost (or adjust the connection string accordingly)
- PostgreSQL client tools installed

## Step 1: Create Database and User

Connect to PostgreSQL as superuser and run:

```sql
-- Create database
CREATE DATABASE workflow;

-- Create user
CREATE USER sonar WITH PASSWORD 'P@88345!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE workflow TO sonar;

-- Configure database settings
\c workflow
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Step 2: Verify Connection

Test your PostgreSQL connection with the credentials:
- Host: localhost
- Port: 5432 (default)
- Database: workflow
- Username: sonar
- Password: P@88345!

## Step 3: Run the Application

Once PostgreSQL is properly configured, you can run the application:

```bash
cd backend
java -jar target/workflow-system-1.0.0.jar
```

The application will automatically create all necessary tables and schema when it starts.

## Configuration Details

The application is configured to use:
- Database: workflow
- Username: sonar  
- Password: P@88345!
- Port: 5432 (default PostgreSQL port)

If your PostgreSQL installation uses different settings, update the `application.yml` file accordingly.