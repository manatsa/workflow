# Sonar Workflow System Installer
# Run as Administrator for best results

param(
    [string]$InstallPath = "$env:ProgramFiles\Sonar\Workflow System",
    [switch]$Silent
)

$ErrorActionPreference = "Stop"

# Application Info
$AppName = "Sonar Workflow System"
$AppVersion = "1.0.0"
$AppPublisher = "Sonar"
$AppExe = "SonarWorkflow.bat"
$AppIcon = "sonar_icon.ico"

function Write-Header {
    if (-not $Silent) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  $AppName Installer" -ForegroundColor Cyan
        Write-Host "  Version $AppVersion" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
    }
}

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Application {
    Write-Header

    # Check for admin rights
    if (-not (Test-Admin)) {
        Write-Host "Note: Running without administrator rights." -ForegroundColor Yellow
        Write-Host "      Some features may not work correctly." -ForegroundColor Yellow
        Write-Host ""

        # Use user's local app data instead
        $InstallPath = "$env:LOCALAPPDATA\Sonar\Workflow System"
    }

    # Check Java
    Write-Host "Checking Java installation..." -ForegroundColor White
    try {
        $javaVersion = & java -version 2>&1 | Select-Object -First 1
        Write-Host "  Found: $javaVersion" -ForegroundColor Green
    } catch {
        Write-Host "  Java not found!" -ForegroundColor Red
        Write-Host "  Please install Java 25 or later from https://adoptium.net/" -ForegroundColor Yellow
        if (-not $Silent) {
            Read-Host "Press Enter to exit"
        }
        exit 1
    }

    # Create installation directory
    Write-Host ""
    Write-Host "Installing to: $InstallPath" -ForegroundColor White

    if (Test-Path $InstallPath) {
        Write-Host "  Removing existing installation..." -ForegroundColor Yellow
        Remove-Item -Path $InstallPath -Recurse -Force
    }

    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "  Created installation directory" -ForegroundColor Green

    # Copy files
    Write-Host ""
    Write-Host "Copying files..." -ForegroundColor White

    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

    # Copy JAR
    Copy-Item "$ScriptDir\workflow-system-1.0.0.jar" "$InstallPath\" -Force
    Write-Host "  Copied workflow-system-1.0.0.jar" -ForegroundColor Green

    # Copy launcher
    Copy-Item "$ScriptDir\SonarWorkflow.bat" "$InstallPath\" -Force
    Write-Host "  Copied SonarWorkflow.bat" -ForegroundColor Green

    # Copy hidden launcher
    Copy-Item "$ScriptDir\SonarWorkflow-Hidden.vbs" "$InstallPath\" -Force
    Write-Host "  Copied SonarWorkflow-Hidden.vbs" -ForegroundColor Green

    # Copy icon
    if (Test-Path "$ScriptDir\sonar_icon.ico") {
        Copy-Item "$ScriptDir\sonar_icon.ico" "$InstallPath\" -Force
        Write-Host "  Copied sonar_icon.ico" -ForegroundColor Green
    } elseif (Test-Path "$ScriptDir\sonar_icon.png") {
        Copy-Item "$ScriptDir\sonar_icon.png" "$InstallPath\" -Force
        Write-Host "  Copied sonar_icon.png" -ForegroundColor Green
    }

    # Copy uninstaller
    Copy-Item "$ScriptDir\Uninstall.ps1" "$InstallPath\" -Force
    Write-Host "  Copied Uninstall.ps1" -ForegroundColor Green

    # Create shortcuts
    Write-Host ""
    Write-Host "Creating shortcuts..." -ForegroundColor White

    $WshShell = New-Object -ComObject WScript.Shell

    # Desktop shortcut
    $DesktopPath = [Environment]::GetFolderPath("Desktop")
    $Shortcut = $WshShell.CreateShortcut("$DesktopPath\$AppName.lnk")
    $Shortcut.TargetPath = "$InstallPath\SonarWorkflow.bat"
    $Shortcut.WorkingDirectory = $InstallPath
    $Shortcut.Description = $AppName
    if (Test-Path "$InstallPath\sonar_icon.ico") {
        $Shortcut.IconLocation = "$InstallPath\sonar_icon.ico"
    }
    $Shortcut.Save()
    Write-Host "  Created Desktop shortcut" -ForegroundColor Green

    # Start Menu shortcut
    $StartMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
    $StartMenuFolder = "$StartMenuPath\$AppPublisher"

    if (-not (Test-Path $StartMenuFolder)) {
        New-Item -ItemType Directory -Path $StartMenuFolder -Force | Out-Null
    }

    $Shortcut = $WshShell.CreateShortcut("$StartMenuFolder\$AppName.lnk")
    $Shortcut.TargetPath = "$InstallPath\SonarWorkflow.bat"
    $Shortcut.WorkingDirectory = $InstallPath
    $Shortcut.Description = $AppName
    if (Test-Path "$InstallPath\sonar_icon.ico") {
        $Shortcut.IconLocation = "$InstallPath\sonar_icon.ico"
    }
    $Shortcut.Save()
    Write-Host "  Created Start Menu shortcut" -ForegroundColor Green

    # Create uninstaller shortcut
    $Shortcut = $WshShell.CreateShortcut("$StartMenuFolder\Uninstall $AppName.lnk")
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$InstallPath\Uninstall.ps1`""
    $Shortcut.WorkingDirectory = $InstallPath
    $Shortcut.Description = "Uninstall $AppName"
    $Shortcut.Save()
    Write-Host "  Created Uninstaller shortcut" -ForegroundColor Green

    # Add to Programs and Features (if admin)
    if (Test-Admin) {
        Write-Host ""
        Write-Host "Registering application..." -ForegroundColor White

        $UninstallKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName"
        New-Item -Path $UninstallKey -Force | Out-Null
        Set-ItemProperty -Path $UninstallKey -Name "DisplayName" -Value $AppName
        Set-ItemProperty -Path $UninstallKey -Name "DisplayVersion" -Value $AppVersion
        Set-ItemProperty -Path $UninstallKey -Name "Publisher" -Value $AppPublisher
        Set-ItemProperty -Path $UninstallKey -Name "InstallLocation" -Value $InstallPath
        Set-ItemProperty -Path $UninstallKey -Name "UninstallString" -Value "powershell.exe -ExecutionPolicy Bypass -File `"$InstallPath\Uninstall.ps1`""
        Set-ItemProperty -Path $UninstallKey -Name "NoModify" -Value 1
        Set-ItemProperty -Path $UninstallKey -Name "NoRepair" -Value 1
        if (Test-Path "$InstallPath\sonar_icon.ico") {
            Set-ItemProperty -Path $UninstallKey -Name "DisplayIcon" -Value "$InstallPath\sonar_icon.ico"
        }
        Write-Host "  Added to Programs and Features" -ForegroundColor Green
    }

    # Done
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can start the application from:" -ForegroundColor White
    Write-Host "  - Desktop shortcut" -ForegroundColor Cyan
    Write-Host "  - Start Menu > $AppPublisher > $AppName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The application will be available at: http://localhost:8080" -ForegroundColor Yellow
    Write-Host ""

    if (-not $Silent) {
        $launch = Read-Host "Would you like to start the application now? (Y/N)"
        if ($launch -eq "Y" -or $launch -eq "y") {
            Start-Process "$InstallPath\SonarWorkflow.bat"
        }
    }
}

# Run installer
Install-Application
