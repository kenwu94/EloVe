#!/bin/bash

# Local DynamoDB Setup Script for EloVe
# This script helps you set up DynamoDB Local for development

echo "EloVe - Local DynamoDB Setup"
echo "============================"

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is required to run DynamoDB Local"
    echo "Please install Java 8+ and try again"
    exit 1
fi

# Create dynamodb-local directory if it doesn't exist
mkdir -p dynamodb-local
cd dynamodb-local

# Download DynamoDB Local if not already present
if [ ! -f "DynamoDBLocal.jar" ]; then
    echo "Downloading DynamoDB Local..."
    curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
    tar -xzf dynamodb_local_latest.tar.gz
    rm dynamodb_local_latest.tar.gz
    echo "DynamoDB Local downloaded successfully"
fi

# Start DynamoDB Local
echo "Starting DynamoDB Local on port 8000..."
echo "Access the DynamoDB Local shell at: http://localhost:8000/shell"
echo "Press Ctrl+C to stop"

java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
