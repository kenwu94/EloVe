@echo off
REM Local DynamoDB Setup Script for EloVe (Windows)
REM This script helps you set up DynamoDB Local for development

echo EloVe - Local DynamoDB Setup
echo ============================

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Java is required to run DynamoDB Local
    echo Please install Java 8+ and try again
    pause
    exit /b 1
)

REM Create dynamodb-local directory if it doesn't exist
if not exist "dynamodb-local" mkdir dynamodb-local
cd dynamodb-local

REM Download DynamoDB Local if not already present
if not exist "DynamoDBLocal.jar" (
    echo Downloading DynamoDB Local...
    curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
    tar -xzf dynamodb_local_latest.tar.gz
    del dynamodb_local_latest.tar.gz
    echo DynamoDB Local downloaded successfully
)

REM Start DynamoDB Local
echo Starting DynamoDB Local on port 8000...
echo Access the DynamoDB Local shell at: http://localhost:8000/shell
echo Press Ctrl+C to stop

java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
