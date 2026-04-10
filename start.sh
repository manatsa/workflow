#!/bin/bash
# Sonar Workflow System - Quick Start Script (Linux/Mac)
# For production deployments, use installer/install.sh instead

echo "========================================"
echo "  Sonar Workflow System v1.5.0"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Java
if ! command -v java &>/dev/null; then
    echo "Error: Java is not installed."
    echo "Install with: sudo apt install openjdk-21-jre"
    exit 1
fi

# Find JAR
JAR_FILE=""
if [ -f "backend/target/workflow-system-1.5.0.jar" ]; then
    JAR_FILE="backend/target/workflow-system-1.5.0.jar"
elif [ -f "workflow-system-1.5.0.jar" ]; then
    JAR_FILE="workflow-system-1.5.0.jar"
elif [ -f "installer/workflow-system-1.5.0.jar" ]; then
    JAR_FILE="installer/workflow-system-1.5.0.jar"
else
    echo "Error: workflow-system-1.5.0.jar not found"
    echo "Build first: cd backend && mvn clean package -DskipTests"
    exit 1
fi

# Detect local IP
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$LOCAL_IP" ] && LOCAL_IP="localhost"

echo "Starting application..."
echo "JAR: $JAR_FILE"
echo "URL: http://${LOCAL_IP}:9500"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================"
echo ""

java -jar "$JAR_FILE" 2>&1 | tee console.log
