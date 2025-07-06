# EloVe - Dating App with Elo Rating System

A sophisticated dating app backend that uses an advanced Elo rating system to rank users based on mutual ratings and matches. Every interaction affects user rankings, creating a dynamic and engaging dating experience.

## 🚀 Features

### Core Features
- **Advanced Elo Rating System**: Users start with 1200 Elo and ratings change based on interactions
- **Comprehensive Rating System**: Rate profiles 1-10, with nuanced impact on Elo scores
- **Intelligent Matching**: Mutual likes create matches with bonus Elo rewards
- **Attractiveness Tiers**: Users categorized into Elite, Very Attractive, Attractive, Average, etc.
- **Rating Preview**: See potential Elo impact before submitting ratings
- **Detailed Analytics**: Comprehensive user statistics and rating history

### Backend Features
- **Scalable DynamoDB Backend**: NoSQL database with optimized indexes
- **RESTful API**: Complete API with 11 endpoints for all functionality
- **Flexible K-Factor**: Adaptive rating changes based on user experience level
- **Rating Bounds**: Elo ratings bounded between 100-3000 for stability
- **Match Detection**: Automatic mutual match detection and recording

## 🏗️ Architecture

- **Backend**: Python Flask with advanced error handling
- **Database**: AWS DynamoDB with Global Secondary Indexes
- **Rating Algorithm**: Enhanced chess-style Elo system adapted for dating
- **API Design**: RESTful with comprehensive response data

## 📊 How the Elo System Works

### Rating Scale (1-10)
- **1-4**: Negative impact on rated user's Elo
- **5-6**: Neutral to slight positive impact
- **7-10**: Positive impact, with bonuses for matches

### Attractiveness Tiers
- **Elite** (2000+ Elo): Top tier users
- **Very Attractive** (1700-1999 Elo): High appeal
- **Attractive** (1400-1699 Elo): Above average
- **Average** (1100-1399 Elo): Standard appeal
- **Below Average** (800-1099 Elo): Lower appeal
- **Low** (<800 Elo): Needs improvement

### K-Factor Adaptation
- **New Users** (Under 1400 Elo): Full K-factor (32) for faster adjustment
- **Intermediate** (1400-1799 Elo): Reduced K-factor (25.6) for stability
- **Experienced** (1800+ Elo): Lower K-factor (19.2) for rating protection

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.8+
- AWS Account (for production) or Java 8+ (for local development)

### Installation

1. **Clone and setup the project**:
   ```bash
   cd EloVe
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   # source .venv/bin/activate  # On macOS/Linux
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and update:
   ```bash
   cp .env.example .env
   ```
   
   For production with AWS:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   
   USERS_TABLE=elove-users
   RATINGS_TABLE=elove-ratings
   MATCHES_TABLE=elove-matches
   ```

### Development Setup (Local DynamoDB)

1. **Use local DynamoDB** by adding this to your `.env`:
   ```
   DYNAMODB_ENDPOINT_URL=http://localhost:8000
   ```

2. **Start local DynamoDB**:
   ```bash
   # Windows
   start_local_dynamodb.bat
   
   # macOS/Linux
   ./start_local_dynamodb.sh
   ```

3. **Setup tables**:
   ```bash
   python setup_dynamodb.py
   ```

## 🌐 Running the Application

1. **Start the Flask server**:
   ```bash
   python app.py
   ```

2. **Test the API**:
   ```bash
   python test_api.py
   ```

3. **Access the API** at `http://localhost:5000`

## 📡 API Endpoints

### Health & Information
- `GET /api/health` - Health check
- `GET /api/stats` - General app statistics

### User Management
- `GET /api/users` - Get all users (ordered by Elo rating)
- `POST /api/users` - Create a new user
- `GET /api/users/{user_id}` - Get specific user details
- `GET /api/users/{user_id}/discover` - Get users available to rate

### User Analytics
- `GET /api/users/{user_id}/stats` - Detailed user statistics
- `GET /api/users/{user_id}/history` - User's rating history
- `GET /api/users/{user_id}/matches` - User's matches

### Rating & Matching
- `POST /api/rate/preview` - Preview rating impact before submitting
- `POST /api/rate` - Rate a user (creates matches if mutual)

### Leaderboards
- `GET /api/leaderboard` - Get Elo-based leaderboard with tiers

## 💡 Example API Usage

### Create a User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "age": 25,
    "bio": "Love hiking and coffee",
    "photo_url": "https://example.com/alice.jpg"
  }'
```

### Preview Rating Impact
```bash
curl -X POST http://localhost:5000/api/rate/preview \
  -H "Content-Type: application/json" \
  -d '{
    "rater_id": "user-id-1",
    "rated_id": "user-id-2", 
    "rating": 8,
    "is_match": true
  }'
```

### Rate a User
```bash
curl -X POST http://localhost:5000/api/rate \
  -H "Content-Type: application/json" \
  -d '{
    "rater_id": "user-id-1",
    "rated_id": "user-id-2", 
    "rating": 8,
    "is_match": true
  }'
```

### Get User Statistics
```bash
curl http://localhost:5000/api/users/{user_id}/stats
```

### Get Leaderboard
```bash
curl http://localhost:5000/api/leaderboard
```

## 🗄️ Database Schema

### Users Table
- `id` (String): Unique user identifier
- `name` (String): User's name
- `age` (Number): User's age
- `bio` (String): User's biography
- `photo_url` (String): Profile photo URL
- `elo_rating` (Number): Current Elo rating (default: 1200)
- `created_at` (String): ISO timestamp

### Ratings Table
- `id` (String): Unique rating identifier
- `rater_id` (String): ID of user giving the rating
- `rated_id` (String): ID of user being rated
- `rating` (Number): Rating given (1-10)
- `is_match` (Boolean): Whether the rater liked the profile
- `created_at` (String): ISO timestamp

### Matches Table
- `id` (String): Unique match identifier
- `user1_id` (String): First user's ID
- `user2_id` (String): Second user's ID
- `created_at` (String): ISO timestamp

## 🛠️ Development Tools

- **Local DynamoDB**: Development without AWS dependency
- **Test Suite**: Comprehensive API testing script
- **Sample Data**: Script to create test users and interactions
- **Table Setup**: Automated table creation and configuration

## 📁 File Structure

```
EloVe/
├── app.py                    # Flask application with all endpoints
├── database.py               # DynamoDB database layer with analytics
├── elo_system.py            # Enhanced Elo rating calculations
├── test_api.py              # Comprehensive API testing script
├── setup_dynamodb.py        # Table creation script
├── setup_sample_data.py     # Sample data creation
├── start_local_dynamodb.bat # Windows DynamoDB Local starter
├── start_local_dynamodb.sh  # Unix DynamoDB Local starter
├── requirements.txt         # Python dependencies
├── .env.example             # Environment configuration template
└── README.md               # This documentation
```

## 🚀 Next Steps & Future Enhancements

### Immediate Improvements
- [ ] Add user authentication and JWT tokens
- [ ] Implement photo upload with S3 integration
- [ ] Add user preferences and filtering
- [ ] Create comprehensive logging and monitoring

### Medium-term Features
- [ ] Web/mobile frontend interface
- [ ] Real-time messaging system for matches
- [ ] Push notifications for matches and messages
- [ ] Advanced recommendation algorithms
- [ ] Location-based filtering and proximity matching

### Long-term Vision
- [ ] Machine learning for improved matching
- [ ] Video profile support
- [ ] Social features (groups, events)
- [ ] Premium subscription features
- [ ] Analytics dashboard for administrators

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Install dependencies
pip install -r requirements.txt

# Start the API server
python app.py

# In another terminal, run tests
python test_api.py
```

The test script will:
- Create sample users
- Test rating and matching functionality
- Demonstrate Elo calculations
- Show leaderboard updates
- Test all API endpoints

## 📊 Performance Considerations

- **DynamoDB Scaling**: Auto-scaling enabled for production loads
- **K-Factor Optimization**: Adaptive K-factors for rating stability
- **Caching Strategy**: Consider Redis for frequently accessed data
- **Rate Limiting**: Implement API rate limiting for production
- **Monitoring**: CloudWatch integration for production metrics

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the modern dating experience**
