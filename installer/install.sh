#!/bin/bash
#
# Sonar Workflow System - Linux Installer
# Version 1.5.0
#
# Usage:
#   sudo ./install.sh                  Install the application
#   sudo ./install.sh --uninstall      Uninstall the application
#   sudo ./install.sh --update         Update JAR only (preserve config)
#

set -e

APP_NAME="Sonar Workflow System"
APP_VERSION="1.5.0"
JAR_FILE="workflow-system-1.5.0.jar"
INSTALL_DIR="/opt/sonar/workflow"
SERVICE_NAME="sonar-workflow"
SERVICE_USER="sonar"
LOG_DIR="/var/log/sonar"
PORT=9500

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}========================================"
    echo -e "  ${APP_NAME}"
    echo -e "  Version ${APP_VERSION} - Linux Installer"
    echo -e "========================================${NC}"
    echo ""
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Error: This script must be run as root (sudo)${NC}"
        exit 1
    fi
}

get_local_ip() {
    hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost"
}

check_java() {
    echo -e "${CYAN}Checking Java installation...${NC}"
    if command -v java &>/dev/null; then
        JAVA_VER=$(java -version 2>&1 | head -1)
        echo -e "  ${GREEN}Found: ${JAVA_VER}${NC}"
    else
        echo -e "  ${RED}Java not found!${NC}"
        echo -e "  ${YELLOW}Install with: sudo apt install openjdk-21-jre${NC}"
        echo -e "  ${YELLOW}Or download from: https://adoptium.net/${NC}"
        exit 1
    fi
}

check_postgresql() {
    echo -e "${CYAN}Checking PostgreSQL...${NC}"
    if command -v psql &>/dev/null; then
        echo -e "  ${GREEN}PostgreSQL client found${NC}"
    else
        echo -e "  ${YELLOW}Warning: PostgreSQL client not found${NC}"
        echo -e "  ${YELLOW}Make sure PostgreSQL is installed and the 'workflow' database exists${NC}"
    fi
}

create_user() {
    echo -e "${CYAN}Creating service user...${NC}"
    if id "$SERVICE_USER" &>/dev/null; then
        echo -e "  ${GREEN}User '${SERVICE_USER}' already exists${NC}"
    else
        useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
        echo -e "  ${GREEN}Created system user '${SERVICE_USER}'${NC}"
    fi
}

install_files() {
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    echo -e "${CYAN}Installing to ${INSTALL_DIR}...${NC}"

    # Create directories
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$LOG_DIR"

    # Copy JAR
    if [ -f "$SCRIPT_DIR/$JAR_FILE" ]; then
        cp "$SCRIPT_DIR/$JAR_FILE" "$INSTALL_DIR/"
        echo -e "  ${GREEN}Copied ${JAR_FILE}${NC}"
    else
        echo -e "  ${RED}Error: ${JAR_FILE} not found in ${SCRIPT_DIR}${NC}"
        exit 1
    fi

    # Set permissions
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
    chmod 755 "$INSTALL_DIR"
    chmod 644 "$INSTALL_DIR/$JAR_FILE"

    echo -e "  ${GREEN}Permissions set${NC}"
}

create_config() {
    # Create application config override if it doesn't exist
    CONFIG_FILE="$INSTALL_DIR/application.yml"
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" <<'CONF'
# Sonar Workflow System - Production Configuration
# Override default settings here

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/workflow
    username: sonar
    password: sonar

server:
  port: 9500
CONF
        chown "$SERVICE_USER:$SERVICE_USER" "$CONFIG_FILE"
        chmod 640 "$CONFIG_FILE"
        echo -e "  ${GREEN}Created default configuration${NC}"
        echo -e "  ${YELLOW}Edit ${CONFIG_FILE} to update database credentials${NC}"
    else
        echo -e "  ${GREEN}Existing configuration preserved${NC}"
    fi
}

create_service() {
    echo -e "${CYAN}Creating systemd service...${NC}"

    cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Sonar Workflow System
Documentation=https://sonarworks.com
After=network.target postgresql.service
Requires=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/java -Xms256m -Xmx1024m -jar ${INSTALL_DIR}/${JAR_FILE} --spring.config.additional-location=file:${INSTALL_DIR}/application.yml
ExecStop=/bin/kill -TERM \$MAINPID
Restart=on-failure
RestartSec=10
SuccessExitStatus=143

StandardOutput=append:${LOG_DIR}/sonar-workflow.log
StandardError=append:${LOG_DIR}/sonar-workflow-error.log

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${INSTALL_DIR} ${LOG_DIR}
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    echo -e "  ${GREEN}Service created and enabled${NC}"
}

create_management_script() {
    echo -e "${CYAN}Creating management script...${NC}"

    cat > "$INSTALL_DIR/sonar-workflow.sh" <<'SCRIPT'
#!/bin/bash
# Sonar Workflow System Management Script

SERVICE_NAME="sonar-workflow"
LOG_FILE="/var/log/sonar/sonar-workflow.log"

case "$1" in
    start)
        echo "Starting Sonar Workflow System..."
        sudo systemctl start "$SERVICE_NAME"
        echo "Started. Check status with: $0 status"
        ;;
    stop)
        echo "Stopping Sonar Workflow System..."
        sudo systemctl stop "$SERVICE_NAME"
        echo "Stopped."
        ;;
    restart)
        echo "Restarting Sonar Workflow System..."
        sudo systemctl restart "$SERVICE_NAME"
        echo "Restarted. Check status with: $0 status"
        ;;
    status)
        sudo systemctl status "$SERVICE_NAME"
        ;;
    logs)
        if [ "$2" = "-f" ]; then
            sudo journalctl -u "$SERVICE_NAME" -f
        else
            sudo tail -100 "$LOG_FILE" 2>/dev/null || sudo journalctl -u "$SERVICE_NAME" --no-pager -n 100
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs [-f]}"
        exit 1
        ;;
esac
SCRIPT

    chmod +x "$INSTALL_DIR/sonar-workflow.sh"

    # Create symlink in /usr/local/bin
    ln -sf "$INSTALL_DIR/sonar-workflow.sh" /usr/local/bin/sonar-workflow
    echo -e "  ${GREEN}Management script created${NC}"
    echo -e "  ${GREEN}Use 'sonar-workflow start|stop|restart|status|logs' to manage${NC}"
}

do_install() {
    print_header
    check_root
    check_java
    check_postgresql
    create_user
    install_files
    create_config
    create_service
    create_management_script

    LOCAL_IP=$(get_local_ip)

    echo ""
    echo -e "${GREEN}========================================"
    echo -e "  Installation Complete!"
    echo -e "========================================${NC}"
    echo ""
    echo -e "  Install directory: ${CYAN}${INSTALL_DIR}${NC}"
    echo -e "  Configuration:     ${CYAN}${INSTALL_DIR}/application.yml${NC}"
    echo -e "  Logs:              ${CYAN}${LOG_DIR}/sonar-workflow.log${NC}"
    echo ""
    echo -e "  Management commands:"
    echo -e "    ${CYAN}sonar-workflow start${NC}     Start the application"
    echo -e "    ${CYAN}sonar-workflow stop${NC}      Stop the application"
    echo -e "    ${CYAN}sonar-workflow restart${NC}   Restart the application"
    echo -e "    ${CYAN}sonar-workflow status${NC}    Check status"
    echo -e "    ${CYAN}sonar-workflow logs -f${NC}   Follow logs"
    echo ""
    echo -e "  Application URL: ${YELLOW}http://${LOCAL_IP}:${PORT}${NC}"
    echo ""

    read -p "Start the application now? (y/n): " START_NOW
    if [ "$START_NOW" = "y" ] || [ "$START_NOW" = "Y" ]; then
        systemctl start "$SERVICE_NAME"
        echo -e "${GREEN}Application started!${NC}"
        echo -e "Access at: ${YELLOW}http://${LOCAL_IP}:${PORT}${NC}"
    fi
}

do_uninstall() {
    print_header
    check_root

    echo -e "${YELLOW}This will remove Sonar Workflow System from this machine.${NC}"
    read -p "Are you sure? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "Uninstallation cancelled."
        exit 0
    fi

    echo -e "${CYAN}Stopping service...${NC}"
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true

    echo -e "${CYAN}Removing service...${NC}"
    rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload

    echo -e "${CYAN}Removing management script...${NC}"
    rm -f /usr/local/bin/sonar-workflow

    echo -e "${CYAN}Removing application files...${NC}"
    rm -rf "$INSTALL_DIR"

    echo -e "${CYAN}Removing logs...${NC}"
    rm -rf "$LOG_DIR"

    echo ""
    echo -e "${GREEN}Uninstallation complete.${NC}"
    echo -e "${YELLOW}Note: The '${SERVICE_USER}' user and PostgreSQL database were not removed.${NC}"
    echo -e "${YELLOW}Remove manually if needed:${NC}"
    echo -e "  ${CYAN}sudo userdel ${SERVICE_USER}${NC}"
    echo -e "  ${CYAN}sudo -u postgres dropdb workflow${NC}"
}

do_update() {
    print_header
    check_root

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [ ! -f "$SCRIPT_DIR/$JAR_FILE" ]; then
        echo -e "${RED}Error: ${JAR_FILE} not found in ${SCRIPT_DIR}${NC}"
        exit 1
    fi

    echo -e "${CYAN}Stopping service...${NC}"
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true

    echo -e "${CYAN}Updating JAR file...${NC}"
    cp "$SCRIPT_DIR/$JAR_FILE" "$INSTALL_DIR/"
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/$JAR_FILE"
    chmod 644 "$INSTALL_DIR/$JAR_FILE"

    echo -e "${CYAN}Starting service...${NC}"
    systemctl start "$SERVICE_NAME"

    LOCAL_IP=$(get_local_ip)
    echo ""
    echo -e "${GREEN}Update complete! Application running at http://${LOCAL_IP}:${PORT}${NC}"
}

# Main
case "${1:-}" in
    --uninstall) do_uninstall ;;
    --update)    do_update ;;
    *)           do_install ;;
esac
