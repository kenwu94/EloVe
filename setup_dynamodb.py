#!/usr/bin/env python3
"""
Setup script for EloVe DynamoDB tables
This script can be used to set up tables in AWS DynamoDB or local DynamoDB
"""

import boto3
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_dynamodb_tables():
    """Set up DynamoDB tables for EloVe app"""
    
    # AWS Configuration
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    endpoint_url = os.getenv('DYNAMODB_ENDPOINT_URL')  # For local DynamoDB
    
    # Table names
    users_table_name = os.getenv('USERS_TABLE', 'elove-users')
    ratings_table_name = os.getenv('RATINGS_TABLE', 'elove-ratings')
    matches_table_name = os.getenv('MATCHES_TABLE', 'elove-matches')
    
    print(f"Setting up DynamoDB tables...")
    print(f"Region: {aws_region}")
    print(f"Endpoint: {endpoint_url or 'AWS DynamoDB'}")
    print(f"Tables: {users_table_name}, {ratings_table_name}, {matches_table_name}")
    
    # Initialize DynamoDB client
    session = boto3.Session(
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )
    
    if endpoint_url:
        # For local development
        dynamodb = session.resource('dynamodb', endpoint_url=endpoint_url)
        client = session.client('dynamodb', endpoint_url=endpoint_url)
    else:
        dynamodb = session.resource('dynamodb')
        client = session.client('dynamodb')
    
    # Check existing tables
    existing_tables = client.list_tables()['TableNames']
    print(f"Existing tables: {existing_tables}")
    
    # Create tables if they don't exist
    tables_to_create = [
        {
            'name': users_table_name,
            'schema': {
                'TableName': users_table_name,
                'KeySchema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
                'AttributeDefinitions': [{'AttributeName': 'id', 'AttributeType': 'S'}],
                'BillingMode': 'PAY_PER_REQUEST'
            }
        },
        {
            'name': ratings_table_name,
            'schema': {
                'TableName': ratings_table_name,
                'KeySchema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'rater_id', 'AttributeType': 'S'},
                    {'AttributeName': 'rated_id', 'AttributeType': 'S'}
                ],
                'GlobalSecondaryIndexes': [
                    {
                        'IndexName': 'rater-index',
                        'KeySchema': [{'AttributeName': 'rater_id', 'KeyType': 'HASH'}],
                        'Projection': {'ProjectionType': 'ALL'}
                    },
                    {
                        'IndexName': 'rated-index',
                        'KeySchema': [{'AttributeName': 'rated_id', 'KeyType': 'HASH'}],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            }
        },
        {
            'name': matches_table_name,
            'schema': {
                'TableName': matches_table_name,
                'KeySchema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'user1_id', 'AttributeType': 'S'}
                ],
                'GlobalSecondaryIndexes': [
                    {
                        'IndexName': 'user1-index',
                        'KeySchema': [{'AttributeName': 'user1_id', 'KeyType': 'HASH'}],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            }
        }
    ]
    
    for table_config in tables_to_create:
        table_name = table_config['name']
        if table_name not in existing_tables:
            print(f"Creating table: {table_name}")
            try:
                table = dynamodb.create_table(**table_config['schema'])
                table.wait_until_exists()
                print(f"✓ Table {table_name} created successfully")
            except Exception as e:
                print(f"✗ Error creating table {table_name}: {e}")
        else:
            print(f"✓ Table {table_name} already exists")
    
    print("\nDynamoDB setup complete!")

if __name__ == "__main__":
    setup_dynamodb_tables()
