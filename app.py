from flask import Flask, request, jsonify
from flask_cors import CORS
from database import Database
from elo_system import EloSystem
import json
import os
import base64
from werkzeug.utils import secure_filename
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Initialize database and Elo system
db = Database()
elo = EloSystem()

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_photo(photo_data, user_id):
    """Save photo data and return file URL"""
    try:
        # Decode base64 image
        if photo_data.startswith('data:image'):
            # Remove data URL prefix
            header, data = photo_data.split(',', 1)
            image_data = base64.b64decode(data)
        else:
            image_data = base64.b64decode(photo_data)
        
        # Open and process image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Resize image if too large (max 1200px on longest side)
        max_size = 1200
        if max(image.size) > max_size:
            image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Generate filename
        import uuid
        filename = f"{user_id}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save image
        image.save(filepath, 'JPEG', quality=85, optimize=True)
        
        # Return URL (in production, this would be a proper URL)
        return f"/uploads/{filename}"
        
    except Exception as e:
        print(f"Error saving photo: {e}")
        return None

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users ordered by Elo rating"""
    try:
        users = db.get_all_users()
        return jsonify({
            'success': True,
            'users': users
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        if not data or 'name' not in data or 'age' not in data:
            return jsonify({
                'success': False,
                'error': 'Name and age are required'
            }), 400
        
        user_id = db.create_user(
            name=data['name'],
            age=data['age'],
            bio=data.get('bio', ''),
            photo_url=data.get('photo_url', '')
        )
        
        user = db.get_user(user_id)
        
        return jsonify({
            'success': True,
            'user': user
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get a specific user"""
    try:
        user = db.get_user(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/<user_id>/discover', methods=['GET'])
def discover_users(user_id):
    """Get users for the current user to rate"""
    try:
        # Check if user exists
        current_user = db.get_user(user_id)
        if not current_user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Get users to rate
        users_to_rate = db.get_users_to_rate(user_id)
        
        return jsonify({
            'success': True,
            'users': users_to_rate,
            'current_user': current_user
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rate', methods=['POST'])
def rate_user():
    """Rate another user and update Elo ratings"""
    try:
        data = request.get_json()
        
        required_fields = ['rater_id', 'rated_id', 'rating', 'is_match']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'rater_id, rated_id, rating, and is_match are required'
            }), 400
        
        rater_id = data['rater_id']
        rated_id = data['rated_id']
        rating = int(data['rating'])
        is_match = bool(data['is_match'])
        
        # Validate rating
        if rating < 1 or rating > 10:
            return jsonify({
                'success': False,
                'error': 'Rating must be between 1 and 10'
            }), 400
        
        # Get current users
        rater = db.get_user(rater_id)
        rated = db.get_user(rated_id)
        
        if not rater or not rated:
            return jsonify({
                'success': False,
                'error': 'One or both users not found'
            }), 404
        
        # Calculate new Elo ratings
        new_rater_rating, new_rated_rating = elo.calculate_new_ratings(
            rater['elo_rating'],
            rated['elo_rating'],
            rating,
            is_match
        )
        
        # Update ratings in database
        db.update_elo_rating(rater_id, new_rater_rating)
        db.update_elo_rating(rated_id, new_rated_rating)
        
        # Add the rating record
        rating_id = db.add_rating(rater_id, rated_id, rating, is_match)
        
        # Check for mutual match if this was a match
        mutual_match = False
        match_id = None
        if is_match:
            mutual_match = db.check_mutual_match(rater_id, rated_id)
            if mutual_match:
                match_id = db.create_match(rater_id, rated_id)
        
        # Get impact description
        impact = elo.get_rating_impact(rating, is_match)
        
        # Get new tiers
        new_rater_tier = elo.get_attractiveness_tier(new_rater_rating)
        new_rated_tier = elo.get_attractiveness_tier(new_rated_rating)
        
        return jsonify({
            'success': True,
            'rating_id': rating_id,
            'new_rater_rating': round(new_rater_rating, 2),
            'new_rated_rating': round(new_rated_rating, 2),
            'rating_change_rater': round(new_rater_rating - rater['elo_rating'], 2),
            'rating_change_rated': round(new_rated_rating - rated['elo_rating'], 2),
            'rater_tier': new_rater_tier,
            'rated_tier': new_rated_tier,
            'mutual_match': mutual_match,
            'match_id': match_id,
            'impact': impact
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get users ranked by Elo rating"""
    try:
        users = db.get_all_users()  # Already ordered by Elo rating DESC
        
        # Add rank and tier to each user
        for i, user in enumerate(users):
            user['rank'] = i + 1
            user['tier'] = elo.get_attractiveness_tier(user['elo_rating'])
        
        return jsonify({
            'success': True,
            'leaderboard': users
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get general app statistics"""
    try:
        users = db.get_all_users()
        
        if not users:
            return jsonify({
                'success': True,
                'stats': {
                    'total_users': 0,
                    'highest_elo': 0,
                    'lowest_elo': 0,
                    'average_elo': 0
                }
            })
        
        elo_ratings = [user['elo_rating'] for user in users]
        
        stats = {
            'total_users': len(users),
            'highest_elo': max(elo_ratings),
            'lowest_elo': min(elo_ratings),
            'average_elo': round(sum(elo_ratings) / len(elo_ratings), 2)
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'EloVe API is running!'
    })

@app.route('/api/users/<user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """Get detailed statistics for a user"""
    try:
        # Check if user exists
        user = db.get_user(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Get user statistics
        stats = db.get_user_stats(user_id)
        
        # Add Elo tier information
        tier = elo.get_attractiveness_tier(user['elo_rating'])
        
        return jsonify({
            'success': True,
            'user': user,
            'stats': stats,
            'attractiveness_tier': tier
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/<user_id>/history', methods=['GET'])
def get_rating_history(user_id):
    """Get rating history for a user"""
    try:
        # Check if user exists
        user = db.get_user(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Get rating history
        limit = int(request.args.get('limit', 50))
        history = db.get_rating_history(user_id, limit)
        
        return jsonify({
            'success': True,
            'history': history
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/<user_id>/matches', methods=['GET'])
def get_user_matches(user_id):
    """Get all matches for a user"""
    try:
        # Check if user exists
        user = db.get_user(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Get matches
        matches = db.get_matches_for_user(user_id)
        
        return jsonify({
            'success': True,
            'matches': matches,
            'total_matches': len(matches)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rate/preview', methods=['POST'])
def preview_rating_impact():
    """Preview the impact of a rating before actually submitting it"""
    try:
        data = request.get_json()
        
        required_fields = ['rater_id', 'rated_id', 'rating', 'is_match']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'rater_id, rated_id, rating, and is_match are required'
            }), 400
        
        rater_id = data['rater_id']
        rated_id = data['rated_id']
        rating = int(data['rating'])
        is_match = bool(data['is_match'])
        
        # Validate rating
        if rating < 1 or rating > 10:
            return jsonify({
                'success': False,
                'error': 'Rating must be between 1 and 10'
            }), 400
        
        # Get current users
        rater = db.get_user(rater_id)
        rated = db.get_user(rated_id)
        
        if not rater or not rated:
            return jsonify({
                'success': False,
                'error': 'One or both users not found'
            }), 404
        
        # Calculate what the new ratings would be
        new_rater_rating, new_rated_rating = elo.calculate_new_ratings(
            rater['elo_rating'],
            rated['elo_rating'],
            rating,
            is_match
        )
        
        # Get impact description
        impact = elo.get_rating_impact(rating, is_match)
        
        return jsonify({
            'success': True,
            'current_rater_rating': rater['elo_rating'],
            'current_rated_rating': rated['elo_rating'],
            'projected_rater_rating': round(new_rater_rating, 2),
            'projected_rated_rating': round(new_rated_rating, 2),
            'rater_change': round(new_rater_rating - rater['elo_rating'], 2),
            'rated_change': round(new_rated_rating - rated['elo_rating'], 2),
            'impact_description': impact,
            'rater_tier': elo.get_attractiveness_tier(new_rater_rating),
            'rated_tier': elo.get_attractiveness_tier(new_rated_rating)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    

# Photo management endpoints
@app.route('/api/photos/upload', methods=['POST'])
def upload_photo():
    """Upload a photo for a user"""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        user_id = data['user_id']
        photo_data = data.get('photo')
        
        if not photo_data:
            return jsonify({
                'success': False,
                'error': 'Photo data is required'
            }), 400
        
        # Save photo
        photo_url = save_photo(photo_data, user_id)
        
        if not photo_url:
            return jsonify({
                'success': False,
                'error': 'Failed to save photo'
            }), 500
        
        # Check if this should be the main photo (first photo for user)
        existing_photos = db.get_user_photos(user_id)
        is_main = len(existing_photos) == 0
        
        # Create photo record in database
        photo_id = db.create_photo(user_id, photo_url, is_main)
        
        return jsonify({
            'success': True,
            'photo': {
                'id': photo_id,
                'url': photo_url,
                'is_main': is_main
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/<user_id>/photos', methods=['GET'])
def get_user_photos(user_id):
    """Get all photos for a user"""
    try:
        photos = db.get_user_photos(user_id)
        return jsonify({
            'success': True,
            'photos': photos
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/photos/<photo_id>', methods=['DELETE'])
def delete_photo(photo_id):
    """Delete a photo"""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        success = db.delete_photo(photo_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Photo deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete photo'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/photos/<photo_id>/main', methods=['PUT'])
def set_main_photo(photo_id):
    """Set a photo as the main photo"""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        user_id = data['user_id']
        success = db.set_main_photo(user_id, photo_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Main photo updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update main photo'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded photos"""
    from flask import send_from_directory
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    print("Starting EloVe Dating App API...")
    print("Available endpoints:")
    print("- GET /api/health - Health check")
    print("- GET /api/users - Get all users")
    print("- POST /api/users - Create new user")
    print("- GET /api/users/<id> - Get specific user")
    print("- GET /api/users/<id>/discover - Get users to rate")
    print("- GET /api/users/<id>/stats - Get user statistics")
    print("- GET /api/users/<id>/history - Get user rating history")
    print("- GET /api/users/<id>/matches - Get user matches")
    print("- POST /api/rate - Rate a user")
    print("- POST /api/rate/preview - Preview rating impact")
    print("- GET /api/leaderboard - Get Elo leaderboard")
    print("- GET /api/stats - Get app statistics")
    print("- POST /api/photos/upload - Upload a photo")
    print("- GET /api/users/<id>/photos - Get user photos")
    print("- DELETE /api/photos/<id> - Delete a photo")
    print("- PUT /api/photos/<id>/main - Set main photo")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
