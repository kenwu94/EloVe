@echo off
setlocal enabledelayedexpansion

echo ============================================
echo        EloVe Dating App - Complete Startup
echo ============================================
echo.
echo This script will start all services required for EloVe:
echo 1. DynamoDB Local
echo 2. Flask API Server
echo 3. React Native/Expo Development Server
echo.

REM Function to check if a port is in use
:check_port
netstat -an | find ":%1 " >nul 2>&1
if %errorlevel% equ 0 (
    echo Port %1 is already in use
    exit /b 1
) else (
    echo Port %1 is available
    exit /b 0
)

REM Check if required ports are available
echo Checking port availability...
call :check_port 8000
if %errorlevel% neq 0 (
    echo Warning: DynamoDB Local port 8000 is in use
    choice /c YN /m "Continue anyway? (Y/N)"
    if !errorlevel! equ 2 exit /b 1
)

call :check_port 5000
if %errorlevel% neq 0 (
    echo Warning: Flask API port 5000 is in use
    choice /c YN /m "Continue anyway? (Y/N)"
    if !errorlevel! equ 2 exit /b 1
)

call :check_port 8082
if %errorlevel% neq 0 (
    echo Warning: Expo port 8082 is in use
    choice /c YN /m "Continue anyway? (Y/N)"
    if !errorlevel! equ 2 exit /b 1
)

echo.
echo ============================================
echo Step 1: Starting DynamoDB Local
echo ============================================

REM Start DynamoDB Local in a new window
start "DynamoDB Local" cmd /c "start_local_dynamodb.bat"

REM Wait for DynamoDB to start
echo Waiting for DynamoDB Local to start...
timeout /t 5 /nobreak >nul

:wait_dynamodb
curl -s http://localhost:8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Still waiting for DynamoDB Local...
    timeout /t 2 /nobreak >nul
    goto wait_dynamodb
)
echo ✓ DynamoDB Local is running on port 8000

echo.
echo ============================================
echo Step 2: Setting up Database Schema and Data
echo ============================================

REM Check if virtual environment exists, create if not
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt >nul 2>&1

REM Setup database schema
echo Setting up database schema...
python setup_dynamodb.py

REM Setup sample data
echo Loading sample data...
python setup_sample_data.py

echo ✓ Database setup complete

echo.
echo ============================================
echo Step 3: Starting Flask API Server
echo ============================================

REM Start Flask API in a new window
start "Flask API" cmd /c "call venv\Scripts\activate.bat && python app.py"

REM Wait for Flask API to start
echo Waiting for Flask API to start...
timeout /t 3 /nobreak >nul

:wait_flask
curl -s http://localhost:5000/api/users >nul 2>&1
if %errorlevel% neq 0 (
    echo Still waiting for Flask API...
    timeout /t 2 /nobreak >nul
    goto wait_flask
)
echo ✓ Flask API is running on port 5000

echo.
echo ============================================
echo Step 4: Starting React Native App
echo ============================================

cd elove-mobile

REM Check if node_modules exists, install if not
if not exist "node_modules" (
    echo Installing React Native dependencies...
    npm install
)

echo Starting Expo development server...
start "Expo Dev Server" cmd /c "npx expo start --port 8082"

REM Wait for Expo to start
echo Waiting for Expo development server...
timeout /t 10 /nobreak >nul

echo.
echo ============================================
echo           🎉 EloVe App is Ready! 🎉
echo ============================================
echo.
echo Services Status:
echo ✓ DynamoDB Local: http://localhost:8000
echo ✓ Flask API: http://localhost:5000
echo ✓ Expo Dev Server: http://localhost:8082
echo.
echo How to test your app:
echo.
echo 📱 MOBILE TESTING:
echo   1. Install 'Expo Go' app on your phone
echo   2. Scan the QR code in the Expo terminal
echo   3. Or enter manually: exp://192.168.2.100:8082
echo.
echo 🌐 WEB TESTING:
echo   1. Look for the Expo terminal window
echo   2. Press 'w' to open in web browser
echo.
echo 🔧 TROUBLESHOOTING:
echo   - All services are running in separate windows
echo   - Check each window for errors or logs
echo   - Press Ctrl+C in any window to stop that service
echo.
echo Press any key to open the Expo terminal window...
pause >nul

REM Focus on the Expo window
powershell -command "& {Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::AppActivate('Expo Dev Server')}"

echo.
echo To stop all services, close all the opened terminal windows.
echo.
pause
