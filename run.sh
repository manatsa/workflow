#!/bin/bash
# Sonar Workflow System - Background Run Script (Linux/Mac)
# Runs the application in the background and logs to console.log

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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
    exit 1
fi

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$LOCAL_IP" ] && LOCAL_IP="localhost"

echo "Starting Sonar Workflow System v1.5.0 in background..."
nohup java -jar "$JAR_FILE" > console.log 2>&1 &
PID=$!

echo "PID: $PID"
echo "URL: http://${LOCAL_IP}:9500"
echo "Logs: tail -f console.log"
echo ""
echo "Stop with: kill $PID"
echo $PID > sonar-workflow.pid
