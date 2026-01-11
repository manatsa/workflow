#!/bin/bash
# Sonarworks Workflow System - Start Script (Linux/Mac)
# This script starts the application and logs output to console.log

echo "========================================"
echo "Sonarworks Workflow System"
echo "========================================"
echo ""
echo "Starting application..."
echo "Logging to console.log"
echo ""
echo "Press Ctrl+C to stop the application"
echo "========================================"

# Get script directory and change to it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Start Java process and redirect output to console.log
java -jar workflow-system-1.0.0.jar > console.log 2>&1 &
PID=$!

echo "Application started with PID: $PID"
echo "Check console.log for application logs"
echo ""

# Wait for the process to finish
wait $PID
EXIT_CODE=$?

echo ""
echo "Application stopped with exit code: $EXIT_CODE"
