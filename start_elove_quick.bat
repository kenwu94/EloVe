@echo off
echo ============================================
echo     EloVe Dating App - Quick Start
echo ============================================
echo.
echo Starting all EloVe services...
echo.

echo [1/4] Starting DynamoDB Local...
start "DynamoDB Local" cmd /c "start_local_dynamodb.bat"
timeout /t 5 /nobreak >nul

echo [2/4] Setting up database and installing dependencies...
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
python setup_dynamodb.py >nul 2>&1
python setup_sample_data.py >nul 2>&1

echo [3/4] Starting Flask API...
start "Flask API" cmd /c "call venv\Scripts\activate.bat && python app.py"
timeout /t 3 /nobreak >nul

echo [4/4] Starting React Native app...
cd elove-mobile
if not exist "node_modules" (
    npm install >nul 2>&1
)
start "Expo Dev Server" cmd /c "npx expo start --port 8082"

echo.
echo ============================================
echo           🎉 EloVe App Started! 🎉
echo ============================================
echo.
echo Services are starting in separate windows:
echo ✓ DynamoDB Local (port 8000)
echo ✓ Flask API (port 5000) 
echo ✓ Expo Dev Server (port 8082)
echo.
echo TO TEST ON MOBILE:
echo 1. Install 'Expo Go' app
echo 2. Scan QR code from Expo window
echo 3. Or enter: exp://192.168.2.100:8082
echo.
echo TO TEST ON WEB:
echo 1. Find the 'Expo Dev Server' window
echo 2. Press 'w' to open in browser
echo.
echo Press any key to continue...
pause >nul
