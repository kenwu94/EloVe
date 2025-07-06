import requests
import json
import time
import random

# API base URL
BASE_URL = "http://localhost:5000/api"

def test_api():
    """Test the EloVe API functionality"""
    print("🚀 Testing EloVe Dating App API")
    print("=" * 50)
    
    # Test health check
    print("1. Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.json()}")
    
    # Create test users
    print("\n2. Creating test users...")
    users = [
        {"name": "Alice Johnson", "age": 25, "bio": "Love hiking and coffee", "photo_url": "https://example.com/alice.jpg"},
        {"name": "Bob Smith", "age": 28, "bio": "Software engineer and musician", "photo_url": "https://example.com/bob.jpg"},
        {"name": "Charlie Brown", "age": 24, "bio": "Artist and traveler", "photo_url": "https://example.com/charlie.jpg"},
        {"name": "Diana Prince", "age": 27, "bio": "Fitness enthusiast", "photo_url": "https://example.com/diana.jpg"},
        {"name": "Eve Wilson", "age": 23, "bio": "Bookworm and chef", "photo_url": "https://example.com/eve.jpg"}
    ]
    
    created_users = []
    for user_data in users:
        response = requests.post(f"{BASE_URL}/users", json=user_data)
        if response.status_code == 201:
            user = response.json()['user']
            created_users.append(user)
            print(f"Created user: {user['name']} (ID: {user['id']}, Elo: {user['elo_rating']})")
        else:
            print(f"Failed to create user: {user_data['name']}")
    
    if len(created_users) < 2:
        print("Need at least 2 users to test ratings. Exiting.")
        return
    
    # Test discovery
    print(f"\n3. Testing user discovery for {created_users[0]['name']}...")
    response = requests.get(f"{BASE_URL}/users/{created_users[0]['id']}/discover")
    if response.status_code == 200:
        discovery = response.json()
        print(f"Found {len(discovery['users'])} users to rate")
        for user in discovery['users'][:3]:  # Show first 3
            print(f"  - {user['name']} (Elo: {user['elo_rating']})")
    
    # Test rating preview
    print(f"\n4. Testing rating preview...")
    if len(created_users) >= 2:
        rater = created_users[0]
        rated = created_users[1]
        
        preview_data = {
            "rater_id": rater['id'],
            "rated_id": rated['id'],
            "rating": 8,
            "is_match": True
        }
        
        response = requests.post(f"{BASE_URL}/rate/preview", json=preview_data)
        if response.status_code == 200:
            preview = response.json()
            print(f"Rating preview for {rater['name']} rating {rated['name']} with 8/10 (match):")
            print(f"  Rater: {preview['current_rater_rating']} → {preview['projected_rater_rating']} ({preview['rater_change']:+.2f})")
            print(f"  Rated: {preview['current_rated_rating']} → {preview['projected_rated_rating']} ({preview['rated_change']:+.2f})")
            print(f"  Impact: {preview['impact_description']}")
    
    # Test actual ratings
    print(f"\n5. Testing actual ratings...")
    ratings_to_test = [
        (0, 1, 8, True),   # Alice rates Bob 8/10, match
        (1, 0, 7, True),   # Bob rates Alice 7/10, match (mutual!)
        (0, 2, 5, False),  # Alice rates Charlie 5/10, no match
        (2, 0, 9, True),   # Charlie rates Alice 9/10, match
        (1, 2, 6, False),  # Bob rates Charlie 6/10, no match
    ]
    
    for rater_idx, rated_idx, rating, is_match in ratings_to_test:
        if rater_idx < len(created_users) and rated_idx < len(created_users):
            rater = created_users[rater_idx]
            rated = created_users[rated_idx]
            
            rating_data = {
                "rater_id": rater['id'],
                "rated_id": rated['id'],
                "rating": rating,
                "is_match": is_match
            }
            
            response = requests.post(f"{BASE_URL}/rate", json=rating_data)
            if response.status_code == 200:
                result = response.json()
                match_status = "MATCH" if is_match else "SKIP"
                mutual = " (MUTUAL MATCH!)" if result.get('mutual_match') else ""
                print(f"  {rater['name']} → {rated['name']}: {rating}/10 [{match_status}]{mutual}")
                print(f"    Elo changes: {rater['name']} {result['rating_change_rater']:+.1f}, {rated['name']} {result['rating_change_rated']:+.1f}")
            
            time.sleep(0.5)  # Small delay between requests
    
    # Test leaderboard
    print(f"\n6. Testing leaderboard...")
    response = requests.get(f"{BASE_URL}/leaderboard")
    if response.status_code == 200:
        leaderboard = response.json()
        print("Current leaderboard:")
        for user in leaderboard['leaderboard'][:5]:  # Top 5
            print(f"  #{user['rank']} {user['name']} - {user['elo_rating']:.1f} Elo ({user['tier']})")
    
    # Test user stats
    print(f"\n7. Testing user statistics...")
    if created_users:
        user_id = created_users[0]['id']
        response = requests.get(f"{BASE_URL}/users/{user_id}/stats")
        if response.status_code == 200:
            stats_data = response.json()
            user = stats_data['user']
            stats = stats_data['stats']
            print(f"Stats for {user['name']}:")
            print(f"  Elo Rating: {user['elo_rating']:.1f} ({stats_data['attractiveness_tier']})")
            print(f"  Ratings Given: {stats['total_ratings_given']}")
            print(f"  Ratings Received: {stats['total_ratings_received']}")
            print(f"  Match Rate Given: {stats['match_rate_given']:.1f}%")
            print(f"  Average Rating Given: {float(stats['average_rating_given']):.1f}/10")
            print(f"  Average Rating Received: {float(stats['average_rating_received']):.1f}/10")
    
    # Test matches
    print(f"\n8. Testing matches...")
    if created_users:
        user_id = created_users[0]['id']
        response = requests.get(f"{BASE_URL}/users/{user_id}/matches")
        if response.status_code == 200:
            matches_data = response.json()
            matches = matches_data['matches']
            print(f"Matches for {created_users[0]['name']}: {len(matches)} total")
            for match in matches:
                other_user = match['other_user']
                print(f"  💕 Matched with {other_user['name']} (Elo: {other_user['elo_rating']:.1f})")
    
    print(f"\n✅ API testing completed!")

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Make sure the server is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Error during testing: {e}")
