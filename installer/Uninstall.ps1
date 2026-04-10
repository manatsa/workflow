# Sonar Workflow System Uninstaller

param(
    [switch]$Silent
)

$ErrorActionPreference = "Stop"

$AppName = "Sona Workflow"
$AppPublisher = "Acad"

function Write-Header {
    if (-not $Silent) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  $AppName Uninstaller" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
    }
}

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Uninstall-Application {
    Write-Header

    if (-not $Silent) {
        $confirm = Read-Host "Are you sure you want to uninstall $AppName? (Y/N)"
        if ($confirm -ne "Y" -and $confirm -ne "y") {
            Write-Host "Uninstallation cancelled." -ForegroundColor Yellow
            return
        }
    }

    Write-Host "Uninstalling $AppName..." -ForegroundColor White
    Write-Host ""

    # Get install location
    $InstallPath = Split-Path -Parent $MyInvocation.MyCommand.Path

    # Stop any running instances
    Write-Host "Stopping running instances..." -ForegroundColor White
    Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -like "*Sonar*" -or $_.CommandLine -like "*workflow-system*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  Done" -ForegroundColor Green

    # Remove shortcuts
    Write-Host "Removing shortcuts..." -ForegroundColor White

    # Desktop shortcut
    $DesktopPath = [Environment]::GetFolderPath("Desktop")
    $DesktopShortcut = "$DesktopPath\$AppName.lnk"
    if (Test-Path $DesktopShortcut) {
        Remove-Item $DesktopShortcut -Force
        Write-Host "  Removed Desktop shortcut" -ForegroundColor Green
    }

    # Start Menu shortcuts
    $StartMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
    $StartMenuFolder = "$StartMenuPath\$AppPublisher"
    if (Test-Path $StartMenuFolder) {
        Remove-Item $StartMenuFolder -Recurse -Force
        Write-Host "  Removed Start Menu shortcuts" -ForegroundColor Green
    }

    # Remove from Programs and Features
    if (Test-Admin) {
        Write-Host "Removing registry entries..." -ForegroundColor White
        $UninstallKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName"
        if (Test-Path $UninstallKey) {
            Remove-Item $UninstallKey -Recurse -Force
            Write-Host "  Removed from Programs and Features" -ForegroundColor Green
        }
    }

    # Remove installation directory
    Write-Host "Removing application files..." -ForegroundColor White

    # We need to start a new process to delete the folder since we're running from it
    $deleteScript = @"
Start-Sleep -Seconds 2
Remove-Item -Path '$InstallPath' -Recurse -Force -ErrorAction SilentlyContinue
"@

    $bytes = [System.Text.Encoding]::Unicode.GetBytes($deleteScript)
    $encodedCommand = [Convert]::ToBase64String($bytes)

    Start-Process powershell.exe -ArgumentList "-WindowStyle Hidden -EncodedCommand $encodedCommand" -WindowStyle Hidden

    Write-Host "  Scheduled for removal" -ForegroundColor Green

    # Done
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Uninstallation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Thank you for using $AppName" -ForegroundColor Cyan
    Write-Host ""

    if (-not $Silent) {
        Read-Host "Press Enter to exit"
    }
}

# Run uninstaller
Uninstall-Application
