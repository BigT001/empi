@echo off
REM Windows Task Scheduler Setup for Weekly Data Validation
REM This script creates scheduled tasks to run validation and repair scripts weekly
REM Run this script as Administrator

setlocal enabledelayedexpansion

REM Colors and styling
echo.
echo ============================================
echo Data Validation Scheduler Setup
echo ============================================
echo.

REM Check for Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges
    echo Please run as Administrator
    pause
    exit /b 1
)

REM Get the workspace path
set WORKSPACE_PATH=C:\Users\HomePC\Desktop\empi

REM Verify files exist
if not exist "%WORKSPACE_PATH%\weekly-data-validation.js" (
    echo ERROR: weekly-data-validation.js not found
    pause
    exit /b 1
)

if not exist "%WORKSPACE_PATH%\repair-data-consistency.js" (
    echo ERROR: repair-data-consistency.js not found
    pause
    exit /b 1
)

echo ✓ Required scripts found
echo.

REM Create scheduled task for weekly validation
echo Creating scheduled task: Weekly Data Validation...
echo.

schtasks /create /tn "EMPI\Weekly Data Validation" ^
  /tr "node C:\Users\HomePC\Desktop\empi\weekly-data-validation.js >> C:\Users\HomePC\Desktop\empi\logs\validation-!date:~-4,4!!date:~-10,2!!date:~-7,2!-!time:~0,2!!time:~3,2!.log 2>&1" ^
  /sc weekly ^
  /d SUN ^
  /st 02:00 ^
  /z ^
  /f

if %errorLevel% equ 0 (
    echo ✓ Task created successfully: EMPI\Weekly Data Validation
) else (
    echo ERROR: Failed to create validation task
    pause
    exit /b 1
)

echo.

REM Create scheduled task for auto-repair
echo Creating scheduled task: Weekly Data Repair...
echo.

schtasks /create /tn "EMPI\Weekly Data Repair" ^
  /tr "node C:\Users\HomePC\Desktop\empi\repair-data-consistency.js --fix >> C:\Users\HomePC\Desktop\empi\logs\repair-!date:~-4,4!!date:~-10,2!!date:~-7,2!-!time:~0,2!!time:~3,2!.log 2>&1" ^
  /sc weekly ^
  /d MON ^
  /st 03:00 ^
  /z ^
  /f

if %errorLevel% equ 0 (
    echo ✓ Task created successfully: EMPI\Weekly Data Repair
) else (
    echo ERROR: Failed to create repair task
    pause
    exit /b 1
)

echo.

REM Create logs directory if it doesn't exist
if not exist "%WORKSPACE_PATH%\logs" (
    mkdir "%WORKSPACE_PATH%\logs"
    echo ✓ Created logs directory
)

if not exist "%WORKSPACE_PATH%\validation-reports" (
    mkdir "%WORKSPACE_PATH%\validation-reports"
    echo ✓ Created validation-reports directory
)

echo.

REM Display task information
echo ============================================
echo ✓ Scheduled Tasks Created
echo ============================================
echo.
echo 📋 Task 1: Weekly Data Validation
echo    Schedule: Every Sunday at 02:00 AM
echo    Command:  weekly-data-validation.js
echo    Purpose:  Comprehensive consistency check
echo.
echo 🔧 Task 2: Weekly Data Repair
echo    Schedule: Every Monday at 03:00 AM
echo    Command:  repair-data-consistency.js --fix
echo    Purpose:  Auto-repair detected issues
echo.
echo 📁 Logs Location: %WORKSPACE_PATH%\logs\
echo 📊 Reports Location: %WORKSPACE_PATH%\validation-reports\
echo.
echo ============================================
echo Next Steps:
echo ============================================
echo.
echo 1. View scheduled tasks in Task Scheduler:
echo    - Open Task Scheduler (taskschd.msc)
echo    - Navigate to: Task Scheduler Library \ EMPI
echo.
echo 2. Manual execution (for testing):
echo    - Validation: npm run validate
echo    - Repair: npm run repair
echo    - Repair (auto-fix): npm run repair:fix
echo.
echo 3. View logs:
echo    - Check %WORKSPACE_PATH%\logs\ for execution logs
echo.
echo 4. Review reports:
echo    - Check %WORKSPACE_PATH%\validation-reports\ for detailed reports
echo.
echo ============================================
echo.

pause
