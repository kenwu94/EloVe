#!/usr/bin/env python3
"""
Test script for photo upload functionality
"""

import requests
import base64
import json
import os

# Configuration
BASE_URL = 'http://localhost:5000/api'

def test_photo_upload():
    """Test photo upload functionality"""
    
    # First, create a test user
    user_data = {
        'name': 'Test User',
        'age': 25,
        'bio': 'Test user for photo upload',
        'photo_url': ''
    }
    
    print("Creating test user...")
    response = requests.post(f'{BASE_URL}/users', json=user_data)
    
    if not response.json().get('success'):
        print(f"Failed to create user: {response.json()}")
        return
    
    user_id = response.json()['user']['id']
    print(f"Created user with ID: {user_id}")
    
    # Create a simple test image (1x1 pixel PNG in base64)
    test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHiwOIf/gAAAABJRU5ErkJggg=="
    
    # Test photo upload
    photo_data = {
        'user_id': user_id,
        'photo': f'data:image/png;base64,{test_image_base64}'
    }
    
    print("Uploading test photo...")
    response = requests.post(f'{BASE_URL}/photos/upload', json=photo_data)
    
    if response.json().get('success'):
        photo = response.json()['photo']
        print(f"Photo uploaded successfully: {photo}")
        
        # Test getting user photos
        print("Getting user photos...")
        response = requests.get(f'{BASE_URL}/users/{user_id}/photos')
        
        if response.json().get('success'):
            photos = response.json()['photos']
            print(f"User has {len(photos)} photos: {photos}")
        else:
            print(f"Failed to get photos: {response.json()}")
    else:
        print(f"Failed to upload photo: {response.json()}")

if __name__ == '__main__':
    try:
        test_photo_upload()
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to the server. Make sure the Flask app is running.")
    except Exception as e:
        print(f"Error: {e}")
