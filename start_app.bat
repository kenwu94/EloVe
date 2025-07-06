@echo off
echo ============================================
echo          EloVe Dating App Startup
echo ============================================
echo.

echo Step 1: Checking if DynamoDB Local is running...
curl -s http://localhost:8000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ DynamoDB Local is running on port 8000
) else (
    echo ✗ DynamoDB Local is not running
    echo   Please run: start_local_dynamodb.bat
    echo.
)

echo Step 2: Checking if Flask API is running...
curl -s http://localhost:5000/api/users >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Flask API is running on port 5000
) else (
    echo ✗ Flask API is not running
    echo   Please run: python app.py
    echo.
)

echo Step 3: Starting React Native app...
cd elove-mobile
if exist package.json (
    echo ✓ Found React Native project
    echo Starting Expo development server...
    npm start
) else (
    echo ✗ React Native project not found
    echo   Make sure you're in the correct directory
)
