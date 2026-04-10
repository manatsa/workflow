#######################################################
#  Sona Workflow System - Environment Variables Setup
#  PowerShell Script
#  Version 1.5.0
#######################################################
#
#  Usage:
#    1. Edit the values below to match your environment
#    2. Run in PowerShell: .\Set-SonaEnv.ps1
#    3. Start the application: java -jar workflow-system-1.5.0.jar
#
#  To set permanently (survives reboots), change $Scope to "Machine"
#  and run PowerShell as Administrator.
#
#######################################################

# Set to "Process" for current session only, or "Machine" for permanent (requires Admin)
$Scope = "Process"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Sona Workflow - Environment Variables" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ==================== DATABASE ====================
$DB_HOST     = "localhost"
$DB_PORT     = "5432"
$DB_NAME     = "workflow"
$DB_USERNAME = "sonar"
$DB_PASSWORD = "P@88345!"

[Environment]::SetEnvironmentVariable("SPRING_DATASOURCE_URL", "jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}", $Scope)
[Environment]::SetEnvironmentVariable("SPRING_DATASOURCE_USERNAME", $DB_USERNAME, $Scope)
[Environment]::SetEnvironmentVariable("SPRING_DATASOURCE_PASSWORD", $DB_PASSWORD, $Scope)

Write-Host "[Database]" -ForegroundColor Yellow
Write-Host "  Host:     $DB_HOST"
Write-Host "  Port:     $DB_PORT"
Write-Host "  Database: $DB_NAME"
Write-Host "  Username: $DB_USERNAME"
Write-Host "  Password: ****"
Write-Host ""

# ==================== SERVER ====================
$SERVER_PORT = "9500"

[Environment]::SetEnvironmentVariable("SERVER_PORT", $SERVER_PORT, $Scope)

Write-Host "[Server]" -ForegroundColor Yellow
Write-Host "  Port: $SERVER_PORT"
Write-Host ""

# ==================== EMAIL (SMTP) ====================
$MAIL_HOST     = "smtp.gmail.com"
$MAIL_PORT     = "587"
$MAIL_USERNAME = ""
$MAIL_PASSWORD = ""

[Environment]::SetEnvironmentVariable("MAIL_HOST", $MAIL_HOST, $Scope)
[Environment]::SetEnvironmentVariable("MAIL_PORT", $MAIL_PORT, $Scope)
[Environment]::SetEnvironmentVariable("MAIL_USERNAME", $MAIL_USERNAME, $Scope)
[Environment]::SetEnvironmentVariable("MAIL_PASSWORD", $MAIL_PASSWORD, $Scope)

Write-Host "[Email]" -ForegroundColor Yellow
if ($MAIL_USERNAME) {
    Write-Host "  Host:     $MAIL_HOST"
    Write-Host "  Port:     $MAIL_PORT"
    Write-Host "  Username: $MAIL_USERNAME"
    Write-Host "  Password: ****"
} else {
    Write-Host "  Not configured (leave username empty to skip)"
}
Write-Host ""

# ==================== APPLICATION ====================
$APP_BASE_URL    = ""
$JWT_SECRET      = "SonarWorkflowSystemSecretKeyForJWTTokenGenerationMustBeAtLeast256Bits"
$AES_KEY         = "SonarAESKey12345"

[Environment]::SetEnvironmentVariable("APP_BASE_URL", $APP_BASE_URL, $Scope)
[Environment]::SetEnvironmentVariable("JWT_SECRET", $JWT_SECRET, $Scope)
[Environment]::SetEnvironmentVariable("AES_KEY", $AES_KEY, $Scope)

Write-Host "[Application]" -ForegroundColor Yellow
if ($APP_BASE_URL) {
    Write-Host "  Base URL: $APP_BASE_URL"
} else {
    Write-Host "  Base URL: (auto-detect)"
}
Write-Host "  JWT Secret:      ****"
Write-Host "  Encryption Key:  ****"
Write-Host ""

# ==================== SUMMARY ====================
Write-Host "============================================" -ForegroundColor Green
if ($Scope -eq "Machine") {
    Write-Host "  Variables set PERMANENTLY (Machine scope)" -ForegroundColor Green
    Write-Host "  Restart required for services to pick up changes" -ForegroundColor Yellow
} else {
    Write-Host "  Variables set for CURRENT SESSION only" -ForegroundColor Green
    Write-Host "  Start the app in THIS terminal window" -ForegroundColor Yellow
}
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start Sona Workflow:" -ForegroundColor Cyan
Write-Host "  java -jar workflow-system-1.5.0.jar" -ForegroundColor White
Write-Host ""
Write-Host "Access at: http://localhost:${SERVER_PORT}" -ForegroundColor Cyan
Write-Host ""
