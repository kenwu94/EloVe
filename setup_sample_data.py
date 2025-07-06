import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database
from elo_system import EloSystem

def create_sample_users():
    """Create some sample users for testing"""
    db = Database()
    
    sample_users = [
        {"name": "Alice", "age": 25, "bio": "Love hiking and photography", "photo_url": "https://via.placeholder.com/300x400?text=Alice"},
        {"name": "Bob", "age": 28, "bio": "Software engineer who loves cooking", "photo_url": "https://via.placeholder.com/300x400?text=Bob"},
        {"name": "Carol", "age": 24, "bio": "Artist and yoga enthusiast", "photo_url": "https://via.placeholder.com/300x400?text=Carol"},
        {"name": "David", "age": 30, "bio": "Musician and coffee lover", "photo_url": "https://via.placeholder.com/300x400?text=David"},
        {"name": "Emma", "age": 26, "bio": "Travel blogger and foodie", "photo_url": "https://via.placeholder.com/300x400?text=Emma"},
        {"name": "Frank", "age": 29, "bio": "Fitness trainer and outdoor enthusiast", "photo_url": "https://via.placeholder.com/300x400?text=Frank"},
        {"name": "Grace", "age": 27, "bio": "Doctor who loves reading", "photo_url": "https://via.placeholder.com/300x400?text=Grace"},
        {"name": "Henry", "age": 31, "bio": "Chef and wine connoisseur", "photo_url": "https://via.placeholder.com/300x400?text=Henry"}
    ]
    
    created_users = []
    
    for user_data in sample_users:
        user_id = db.create_user(
            name=user_data["name"],
            age=user_data["age"],
            bio=user_data["bio"],
            photo_url=user_data["photo_url"]
        )
        created_users.append(db.get_user(user_id))
        print(f"Created user: {user_data['name']} (ID: {user_id})")
    
    return created_users

def simulate_ratings():
    """Simulate some ratings between users"""
    db = Database()
    elo_system = EloSystem()
    
    users = db.get_all_users()
    
    if len(users) < 2:
        print("Need at least 2 users to simulate ratings")
        return
    
    import random
    
    # Simulate some interactions
    interactions = [
        # Alice rates others
        (users[0]['id'], users[1]['id'], 8, True),   # Alice likes Bob (8/10)
        (users[0]['id'], users[2]['id'], 6, False),  # Alice skips Carol (6/10)
        (users[0]['id'], users[3]['id'], 9, True),   # Alice likes David (9/10)
        
        # Bob rates others
        (users[1]['id'], users[0]['id'], 7, True),   # Bob likes Alice (7/10) - MUTUAL MATCH!
        (users[1]['id'], users[4]['id'], 5, False),  # Bob skips Emma (5/10)
        (users[1]['id'], users[5]['id'], 8, True),   # Bob likes Frank (8/10)
        
        # Carol rates others
        (users[2]['id'], users[0]['id'], 4, False),  # Carol skips Alice (4/10)
        (users[2]['id'], users[6]['id'], 9, True),   # Carol likes Grace (9/10)
        
        # More interactions for variety
        (users[3]['id'], users[0]['id'], 6, False),  # David skips Alice (6/10)
        (users[4]['id'], users[1]['id'], 3, False),  # Emma skips Bob (3/10)
        (users[5]['id'], users[1]['id'], 7, False),  # Frank skips Bob (7/10)
        (users[6]['id'], users[2]['id'], 8, True),   # Grace likes Carol (8/10) - MUTUAL MATCH!
    ]
    
    print("\nSimulating ratings...")
    
    for rater_id, rated_id, rating, is_match in interactions:
        # Get current ratings
        rater = db.get_user(rater_id)
        rated = db.get_user(rated_id)
        
        old_rater_elo = rater['elo_rating']
        old_rated_elo = rated['elo_rating']
        
        # Calculate new ratings
        new_rater_elo, new_rated_elo = elo_system.calculate_new_ratings(
            old_rater_elo, old_rated_elo, rating, is_match
        )
        
        # Update in database
        db.update_elo_rating(rater_id, new_rater_elo)
        db.update_elo_rating(rated_id, new_rated_elo)
        
        # Add rating record
        db.add_rating(rater_id, rated_id, rating, is_match)
        
        # Check for mutual match
        if is_match and db.check_mutual_match(rater_id, rated_id):
            db.create_match(rater_id, rated_id)
            print(f"  💕 MUTUAL MATCH: {rater['name']} and {rated['name']}!")
        
        action = "liked" if is_match else "skipped"
        print(f"  {rater['name']} {action} {rated['name']} ({rating}/10)")
        print(f"    {rater['name']}: {old_rater_elo:.1f} → {new_rater_elo:.1f} ({new_rater_elo - old_rater_elo:+.1f})")
        print(f"    {rated['name']}: {old_rated_elo:.1f} → {new_rated_elo:.1f} ({new_rated_elo - old_rated_elo:+.1f})")

def show_leaderboard():
    """Show current Elo leaderboard"""
    db = Database()
    users = db.get_all_users()
    
    print("\n" + "="*50)
    print("ELO LEADERBOARD")
    print("="*50)
    
    for i, user in enumerate(users, 1):
        print(f"{i:2d}. {user['name']:<10} | ELO: {user['elo_rating']:7.1f} | Age: {user['age']}")

if __name__ == "__main__":
    print("Setting up EloVe Dating App...")
    
    # Create sample users
    users = create_sample_users()
    
    # Simulate some ratings
    simulate_ratings()
    
    # Show final leaderboard
    show_leaderboard()
    
    print("\n" + "="*50)
    print("Setup complete! You can now start the API server with:")
    print("python app.py")
    print("="*50)
