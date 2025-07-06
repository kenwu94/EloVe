import boto3
import uuid
import os
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Database:
    def __init__(self):
        # AWS Configuration
        aws_region = os.getenv('AWS_REGION', 'us-east-1')
        aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        endpoint_url = os.getenv('DYNAMODB_ENDPOINT_URL')  # For local DynamoDB
        
        # Table names
        self.users_table_name = os.getenv('USERS_TABLE', 'elove-users')
        self.ratings_table_name = os.getenv('RATINGS_TABLE', 'elove-ratings')
        self.matches_table_name = os.getenv('MATCHES_TABLE', 'elove-matches')
        self.photos_table_name = os.getenv('PHOTOS_TABLE', 'elove-photos')
        
        # Initialize DynamoDB client
        session = boto3.Session(
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region
        )
        
        if endpoint_url:
            # For local development
            self.dynamodb = session.resource('dynamodb', endpoint_url=endpoint_url)
        else:
            self.dynamodb = session.resource('dynamodb')
        
        self.init_tables()
    
    def init_tables(self):
        """Initialize DynamoDB tables"""
        try:
            # Create Users table
            self.users_table = self.dynamodb.create_table(
                TableName=self.users_table_name,
                KeySchema=[
                    {
                        'AttributeName': 'id',
                        'KeyType': 'HASH'
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'id',
                        'AttributeType': 'S'
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"Creating {self.users_table_name} table...")
            self.users_table.wait_until_exists()
            
        except self.dynamodb.meta.client.exceptions.ResourceInUseException:
            # Table already exists
            self.users_table = self.dynamodb.Table(self.users_table_name)
        
        try:
            # Create Ratings table
            self.ratings_table = self.dynamodb.create_table(
                TableName=self.ratings_table_name,
                KeySchema=[
                    {
                        'AttributeName': 'id',
                        'KeyType': 'HASH'
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'id',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'rater_id',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'rated_id',
                        'AttributeType': 'S'
                    }
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'rater-index',
                        'KeySchema': [
                            {
                                'AttributeName': 'rater_id',
                                'KeyType': 'HASH'
                            }
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        }
                    },
                    {
                        'IndexName': 'rated-index',
                        'KeySchema': [
                            {
                                'AttributeName': 'rated_id',
                                'KeyType': 'HASH'
                            }
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        }
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"Creating {self.ratings_table_name} table...")
            self.ratings_table.wait_until_exists()
            
        except self.dynamodb.meta.client.exceptions.ResourceInUseException:
            self.ratings_table = self.dynamodb.Table(self.ratings_table_name)
        
        try:
            # Create Matches table
            self.matches_table = self.dynamodb.create_table(
                TableName=self.matches_table_name,
                KeySchema=[
                    {
                        'AttributeName': 'id',
                        'KeyType': 'HASH'
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'id',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'user1_id',
                        'AttributeType': 'S'
                    }
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'user1-index',
                        'KeySchema': [
                            {
                                'AttributeName': 'user1_id',
                                'KeyType': 'HASH'
                            }
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        }
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"Creating {self.matches_table_name} table...")
            self.matches_table.wait_until_exists()
            
        except self.dynamodb.meta.client.exceptions.ResourceInUseException:
            self.matches_table = self.dynamodb.Table(self.matches_table_name)
        
        try:
            # Create Photos table
            self.photos_table = self.dynamodb.create_table(
                TableName=self.photos_table_name,
                KeySchema=[
                    {
                        'AttributeName': 'id',
                        'KeyType': 'HASH'
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'id',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'user_id',
                        'AttributeType': 'S'
                    }
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'user-photos-index',
                        'KeySchema': [
                            {
                                'AttributeName': 'user_id',
                                'KeyType': 'HASH'
                            }
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        }
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"Creating {self.photos_table_name} table...")
            self.photos_table.wait_until_exists()
            
        except self.dynamodb.meta.client.exceptions.ResourceInUseException:
            self.photos_table = self.dynamodb.Table(self.photos_table_name)
    
    def create_user(self, name, age, bio="", photo_url=""):
        """Create a new user"""
        user_id = str(uuid.uuid4())
        
        item = {
            'id': user_id,
            'name': name,
            'age': age,
            'bio': bio,
            'photo_url': photo_url,
            'elo_rating': Decimal('1200.0'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.users_table.put_item(Item=item)
        return user_id
    
    def get_user(self, user_id):
        """Get user by ID"""
        try:
            response = self.users_table.get_item(Key={'id': user_id})
            if 'Item' in response:
                item = response['Item']
                # Convert Decimal to float for JSON serialization
                item['elo_rating'] = float(item['elo_rating'])
                return item
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    def get_all_users(self):
        """Get all users"""
        try:
            response = self.users_table.scan()
            users = response['Items']
            
            # Convert Decimal to float and sort by elo_rating
            for user in users:
                user['elo_rating'] = float(user['elo_rating'])
            
            # Sort by elo_rating in descending order
            users.sort(key=lambda x: x['elo_rating'], reverse=True)
            return users
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    def update_elo_rating(self, user_id, new_rating):
        """Update user's Elo rating"""
        try:
            self.users_table.update_item(
                Key={'id': user_id},
                UpdateExpression='SET elo_rating = :rating',
                ExpressionAttributeValues={':rating': Decimal(str(new_rating))}
            )
        except Exception as e:
            print(f"Error updating elo rating: {e}")
    
    def add_rating(self, rater_id, rated_id, rating, is_match):
        """Add a rating/interaction"""
        rating_id = str(uuid.uuid4())
        
        item = {
            'id': rating_id,
            'rater_id': rater_id,
            'rated_id': rated_id,
            'rating': rating,
            'is_match': is_match,
            'created_at': datetime.utcnow().isoformat()
        }
        
        try:
            self.ratings_table.put_item(Item=item)
            return rating_id
        except Exception as e:
            print(f"Error adding rating: {e}")
            return None
    
    def check_mutual_match(self, user1_id, user2_id):
        """Check if two users have mutually liked each other"""
        try:
            # Check if user1 liked user2
            response1 = self.ratings_table.query(
                IndexName='rater-index',
                KeyConditionExpression=Key('rater_id').eq(user1_id),
                FilterExpression=Attr('rated_id').eq(user2_id) & Attr('is_match').eq(True)
            )
            user1_liked = len(response1['Items']) > 0
            
            # Check if user2 liked user1
            response2 = self.ratings_table.query(
                IndexName='rater-index',
                KeyConditionExpression=Key('rater_id').eq(user2_id),
                FilterExpression=Attr('rated_id').eq(user1_id) & Attr('is_match').eq(True)
            )
            user2_liked = len(response2['Items']) > 0
            
            return user1_liked and user2_liked
        except Exception as e:
            print(f"Error checking mutual match: {e}")
            return False
    
    def create_match(self, user1_id, user2_id):
        """Create a match between two users"""
        match_id = str(uuid.uuid4())
        
        # Ensure consistent ordering for the match
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id
        
        item = {
            'id': match_id,
            'user1_id': user1_id,
            'user2_id': user2_id,
            'created_at': datetime.utcnow().isoformat()
        }
        
        try:
            # Check if match already exists by scanning for the pair
            existing_matches = self.matches_table.scan(
                FilterExpression=Attr('user1_id').eq(user1_id) & Attr('user2_id').eq(user2_id)
            )
            
            if len(existing_matches['Items']) == 0:
                self.matches_table.put_item(Item=item)
            
            return match_id
        except Exception as e:
            print(f"Error creating match: {e}")
            return None
    
    def get_users_to_rate(self, user_id):
        """Get users that haven't been rated by the current user"""
        try:
            # Get all users
            all_users_response = self.users_table.scan()
            all_users = all_users_response['Items']
            
            # Get users already rated by this user
            rated_response = self.ratings_table.query(
                IndexName='rater-index',
                KeyConditionExpression=Key('rater_id').eq(user_id)
            )
            rated_user_ids = {item['rated_id'] for item in rated_response['Items']}
            
            # Filter out the current user and already rated users
            unrated_users = [
                user for user in all_users 
                if user['id'] != user_id and user['id'] not in rated_user_ids
            ]
            
            # Convert Decimal to float for JSON serialization
            for user in unrated_users:
                user['elo_rating'] = float(user['elo_rating'])
            
            # Sort by a mix of Elo rating and randomness for better discovery
            import random
            random.shuffle(unrated_users)  # Add some randomness
            unrated_users.sort(key=lambda x: x['elo_rating'], reverse=True)
            
            return unrated_users
        except Exception as e:
            print(f"Error getting users to rate: {e}")
            return []
    
    def get_user_stats(self, user_id):
        """Get detailed statistics for a user"""
        try:
            # Get ratings given by this user
            given_ratings = self.ratings_table.query(
                IndexName='rater-index',
                KeyConditionExpression=Key('rater_id').eq(user_id)
            )
            
            # Get ratings received by this user
            received_ratings = self.ratings_table.query(
                IndexName='rated-index',
                KeyConditionExpression=Key('rated_id').eq(user_id)
            )
            
            # Calculate statistics
            given_items = given_ratings['Items']
            received_items = received_ratings['Items']
            
            # Matches given and received
            matches_given = len([r for r in given_items if r['is_match']])
            matches_received = len([r for r in received_items if r['is_match']])
            
            # Average ratings
            avg_rating_given = sum(r['rating'] for r in given_items) / len(given_items) if given_items else 0
            avg_rating_received = sum(r['rating'] for r in received_items) / len(received_items) if received_items else 0
            
            # Match rate (percentage of ratings that resulted in matches)
            match_rate_given = (matches_given / len(given_items) * 100) if given_items else 0
            match_rate_received = (matches_received / len(received_items) * 100) if received_items else 0
            
            return {
                'total_ratings_given': len(given_items),
                'total_ratings_received': len(received_items),
                'matches_given': matches_given,
                'matches_received': matches_received,
                'average_rating_given': round(avg_rating_given, 2),
                'average_rating_received': round(avg_rating_received, 2),
                'match_rate_given': round(match_rate_given, 2),
                'match_rate_received': round(match_rate_received, 2)
            }
        except Exception as e:
            print(f"Error getting user stats: {e}")
            return {}
    
    def get_rating_history(self, user_id, limit=50):
        """Get rating history for a user (both given and received)"""
        try:
            # Get ratings given by this user
            given_ratings = self.ratings_table.query(
                IndexName='rater-index',
                KeyConditionExpression=Key('rater_id').eq(user_id),
                Limit=limit,
                ScanIndexForward=False  # Most recent first
            )
            
            # Get ratings received by this user
            received_ratings = self.ratings_table.query(
                IndexName='rated-index',
                KeyConditionExpression=Key('rated_id').eq(user_id),
                Limit=limit,
                ScanIndexForward=False  # Most recent first
            )
            
            # Combine and sort by timestamp
            all_ratings = []
            
            for rating in given_ratings['Items']:
                rating['type'] = 'given'
                all_ratings.append(rating)
            
            for rating in received_ratings['Items']:
                rating['type'] = 'received'
                all_ratings.append(rating)
            
            # Sort by created_at timestamp
            return sorted(all_ratings, key=lambda x: x['created_at'], reverse=True)[:limit]
        except Exception as e:
            print(f"Error getting rating history: {e}")
            return []

    # Photo management methods
    def create_photo(self, user_id, photo_url, is_main=False):
        """Create a new photo for a user"""
        photo_id = str(uuid.uuid4())
        
        # If this is set as main photo, remove main status from other photos
        if is_main:
            self.set_main_photo(user_id, photo_id, create_new=True)
        
        item = {
            'id': photo_id,
            'user_id': user_id,
            'url': photo_url,
            'is_main': is_main,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.photos_table.put_item(Item=item)
        return photo_id
    
    def get_user_photos(self, user_id):
        """Get all photos for a user"""
        try:
            response = self.photos_table.query(
                IndexName='user-photos-index',
                KeyConditionExpression=Key('user_id').eq(user_id)
            )
            
            photos = response.get('Items', [])
            # Sort photos with main photo first
            return sorted(photos, key=lambda x: (not x.get('is_main', False), x.get('created_at', '')))
        except Exception as e:
            print(f"Error getting user photos: {e}")
            return []
    
    def delete_photo(self, photo_id):
        """Delete a photo"""
        try:
            self.photos_table.delete_item(Key={'id': photo_id})
            return True
        except Exception as e:
            print(f"Error deleting photo: {e}")
            return False
    
    def set_main_photo(self, user_id, photo_id, create_new=False):
        """Set a photo as the main photo for a user"""
        try:
            # First, remove main status from all other photos
            user_photos = self.get_user_photos(user_id)
            
            for photo in user_photos:
                if photo['id'] != photo_id and photo.get('is_main', False):
                    self.photos_table.update_item(
                        Key={'id': photo['id']},
                        UpdateExpression='SET is_main = :val',
                        ExpressionAttributeValues={':val': False}
                    )
            
            # Set the specified photo as main (only if it's not a new photo being created)
            if not create_new:
                self.photos_table.update_item(
                    Key={'id': photo_id},
                    UpdateExpression='SET is_main = :val',
                    ExpressionAttributeValues={':val': True}
                )
            
            return True
        except Exception as e:
            print(f"Error setting main photo: {e}")
            return False
    
    def get_main_photo(self, user_id):
        """Get the main photo for a user"""
        try:
            photos = self.get_user_photos(user_id)
            for photo in photos:
                if photo.get('is_main', False):
                    return photo
            # If no main photo, return the first photo
            return photos[0] if photos else None
        except Exception as e:
            print(f"Error getting main photo: {e}")
            return None
    
    def get_matches_for_user(self, user_id):
        """Get all matches for a user"""
        try:
            # Get matches where this user is user1
            response = self.matches_table.query(
                IndexName='user1-index',
                KeyConditionExpression=Key('user1_id').eq(user_id)
            )
            
            matches = response.get('Items', [])
            
            # Also scan for matches where this user is user2 (less efficient but necessary)
            scan_response = self.matches_table.scan(
                FilterExpression=Attr('user2_id').eq(user_id)
            )
            
            matches.extend(scan_response.get('Items', []))
            
            # Remove duplicates
            unique_matches = {}
            for match in matches:
                match_id = match.get('id')
                if match_id not in unique_matches:
                    unique_matches[match_id] = match
            
            return list(unique_matches.values())
        except Exception as e:
            print(f"Error getting matches for user: {e}")
            return []
