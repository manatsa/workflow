@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  Sona Workflow MSI Installer Builder
echo  Version 1.5.0 (bundling JDK 21 runtime)
echo ============================================
echo.

:: --- JDK Paths ---
:: JDK 21 is used to create the bundled runtime image (jlink)
:: JDK 25 is used for jpackage (supports WiX 4/5)
set JDK21_HOME=C:\program files\eclipse adoptium\jdk-21.0.3.9-hotspot
set JDK25_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.1.8-hotspot

if not exist "%JDK21_HOME%\bin\jlink.exe" (
    echo ERROR: JDK 21 not found at %JDK21_HOME%
    echo Please ensure Eclipse Adoptium JDK 21 is installed.
    exit /b 1
)
if not exist "%JDK25_HOME%\bin\jpackage.exe" (
    echo ERROR: JDK 25 not found at %JDK25_HOME%
    echo Please ensure Eclipse Adoptium JDK 25 is installed.
    exit /b 1
)

echo Using JDK 21 for runtime: %JDK21_HOME%
echo Using JDK 25 for jpackage: %JDK25_HOME%
echo.

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set FRONTEND_DIR=%PROJECT_ROOT%\frontend
set BACKEND_DIR=%PROJECT_ROOT%\backend
set BACKEND_TARGET=%BACKEND_DIR%\target
set JAR_NAME=workflow-system-1.5.0.jar
set JAR_PATH=%BACKEND_TARGET%\%JAR_NAME%
set STAGING_DIR=%SCRIPT_DIR%staging
set RESOURCE_DIR=%SCRIPT_DIR%resource
set RUNTIME_DIR=%SCRIPT_DIR%runtime-jdk21
set OUTPUT_DIR=%SCRIPT_DIR%output
set ICON_PATH=%SCRIPT_DIR%sonar_icon.ico

echo [1/8] Cleaning previous build...
if exist "%STAGING_DIR%" rmdir /s /q "%STAGING_DIR%"
if exist "%RESOURCE_DIR%" rmdir /s /q "%RESOURCE_DIR%"
if exist "%RUNTIME_DIR%" rmdir /s /q "%RUNTIME_DIR%"
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%STAGING_DIR%"
mkdir "%RESOURCE_DIR%"
mkdir "%OUTPUT_DIR%"

echo [2/8] Building Angular frontend...
cd /d "%FRONTEND_DIR%"
call npx ng build --configuration production
if %errorlevel% neq 0 (
    echo ERROR: Angular build failed.
    exit /b 1
)
echo        Frontend build complete.

echo [3/8] Copying frontend to backend static resources...
set STATIC_DIR=%BACKEND_DIR%\src\main\resources\static
if exist "%STATIC_DIR%" (
    for %%f in ("%STATIC_DIR%\*.js" "%STATIC_DIR%\*.html" "%STATIC_DIR%\*.css" "%STATIC_DIR%\*.map") do del /q "%%f" 2>nul
    if exist "%STATIC_DIR%\assets" rmdir /s /q "%STATIC_DIR%\assets"
)
if not exist "%STATIC_DIR%" mkdir "%STATIC_DIR%"
xcopy /s /e /y "%FRONTEND_DIR%\dist\sonar-workflow\browser\*" "%STATIC_DIR%\" >nul
echo        Frontend copied to static resources.

echo [4/8] Building Spring Boot JAR...
cd /d "%BACKEND_DIR%"
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo ERROR: Maven build failed.
    exit /b 1
)
echo        Backend build complete.

cd /d "%SCRIPT_DIR%"

:: Verify JAR exists
if not exist "%JAR_PATH%" (
    echo ERROR: %JAR_NAME% not found at %JAR_PATH%
    exit /b 1
)

:: Check icon
if not exist "%ICON_PATH%" (
    echo WARNING: Icon file not found at %ICON_PATH%
    set ICON_OPTION=
) else (
    set ICON_OPTION=--icon "%ICON_PATH%"
)

echo [5/8] Staging application files...
copy "%JAR_PATH%" "%STAGING_DIR%\%JAR_NAME%" >nul
echo        Copied %JAR_NAME%

echo [6/8] Creating JDK 21 runtime image with jlink...
"%JDK21_HOME%\bin\jlink.exe" ^
    --add-modules java.base,java.logging,java.naming,java.sql,java.management,java.instrument,java.desktop,java.security.jgss,java.net.http,jdk.unsupported,java.xml,java.scripting,java.compiler,jdk.crypto.ec,java.datatransfer,java.prefs ^
    --output "%RUNTIME_DIR%" ^
    --strip-debug ^
    --no-man-pages ^
    --no-header-files ^
    --compress=2

if %errorlevel% neq 0 (
    echo ERROR: jlink failed to create runtime image.
    exit /b 1
)
echo        JDK 21 runtime image created.

echo [7/8] Preparing resource files...
copy "%SCRIPT_DIR%setup-db.bat" "%RESOURCE_DIR%\setup-db.bat" >nul
copy "%SCRIPT_DIR%SonaWorkflow.bat" "%RESOURCE_DIR%\SonaWorkflow.bat" >nul
copy "%SCRIPT_DIR%SonaWorkflow-Hidden.vbs" "%RESOURCE_DIR%\SonaWorkflow-Hidden.vbs" >nul
copy "%SCRIPT_DIR%README.txt" "%RESOURCE_DIR%\README.txt" >nul
if exist "%PROJECT_ROOT%\backend\config.sona" (
    copy "%PROJECT_ROOT%\backend\config.sona" "%STAGING_DIR%\config.sona" >nul
    echo        Included config.sona
)
echo        Resource files staged.

echo [8/8] Building MSI with jpackage (this may take a few minutes)...
echo.

"%JDK25_HOME%\bin\jpackage.exe" ^
    --input "%STAGING_DIR%" ^
    --main-jar "%JAR_NAME%" ^
    --main-class org.springframework.boot.loader.launch.JarLauncher ^
    --runtime-image "%RUNTIME_DIR%" ^
    --type msi ^
    --name "Sona Workflow" ^
    --app-version 1.5.0 ^
    --vendor "Acad" ^
    --description "Sona Workflow Management System" ^
    --copyright "Copyright (c) 2026 Acad" ^
    %ICON_OPTION% ^
    --win-menu ^
    --win-shortcut ^
    --win-dir-chooser ^
    --win-menu-group "Acad" ^
    --install-dir "Acad\Sona Workflow" ^
    --resource-dir "%RESOURCE_DIR%" ^
    --java-options "-Xms256m" ^
    --java-options "-Xmx1024m" ^
    --java-options "-Dspring.profiles.active=prod" ^
    --java-options "-Dserver.port=9500" ^
    --dest "%OUTPUT_DIR%"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: jpackage failed to build MSI.
    exit /b 1
)

echo Cleaning up staging files...
rmdir /s /q "%STAGING_DIR%"
rmdir /s /q "%RESOURCE_DIR%"
rmdir /s /q "%RUNTIME_DIR%"

echo.
echo ============================================
echo  BUILD SUCCESSFUL
echo ============================================
echo.

for %%f in ("%OUTPUT_DIR%\*.msi") do (
    echo MSI created: %%f
    echo Size: %%~zf bytes
)

echo.
echo Output directory: %OUTPUT_DIR%
echo.
