# 🚀 EloVe Dating App - Startup Guide

## Prerequisites
1. Make sure you have Python, Node.js, and Java installed
2. Make sure you've installed all dependencies with `pip install -r requirements.txt`

## Running the Complete App (3 Steps)

### Step 1: Start DynamoDB Local (Database)
```bash
# Open Terminal/Command Prompt 1
cd c:\Users\kenwu.KEN\EloVe
start_local_dynamodb.bat
```
**Wait for**: "Starting DynamoDB Local on port 8000..."

### Step 2: Start Flask API Server (Backend)
```bash
# Open Terminal/Command Prompt 2
cd c:\Users\kenwu.KEN\EloVe
python app.py
```
**Wait for**: "Running on http://192.168.2.100:5000"

### Step 3: Start React Native App (Frontend)
```bash
# Open Terminal/Command Prompt 3
cd c:\Users\kenwu.KEN\EloVe\elove-mobile
npm start
```
**Wait for**: QR code to appear

## Testing Your App

### Option 1: Mobile Device
1. Install "Expo Go" app from Play Store (Android) or App Store (iOS)
2. Scan the QR code shown in Terminal 3
3. Your app will load on your phone!

### Option 2: Computer Browser
1. In Terminal 3, press `w` to open in web browser
2. The app will open at http://localhost:8081

### Option 3: Emulator
1. In Terminal 3, press `a` for Android emulator or `i` for iOS simulator

## What You Should See

1. **Profile Creation Screen**: Create your dating profile
2. **Swipe Screen**: Swipe through other users, rate them 1-10
3. **Matches Screen**: See people who liked you back
4. **Leaderboard**: See Elo rankings of all users
5. **Profile Screen**: View your stats and Elo rating

## Troubleshooting

### If Flask API won't start:
```bash
cd c:\Users\kenwu.KEN\EloVe
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### If React Native won't start:
```bash
cd c:\Users\kenwu.KEN\EloVe\elove-mobile
npm install
npm start
```

### If DynamoDB won't start:
- Make sure Java is installed
- Run: `java -version` to verify

## Quick Status Check Commands

```bash
# Check if API is running
curl http://localhost:5000/api/health

# Check if DynamoDB is running
curl http://localhost:8000

# Check if React Native is running
curl http://localhost:8081
```

## Default Test Data

The app will automatically create database tables when you first run it. You can create multiple profiles to test the rating and matching system.

## Important Notes

- Keep all 3 terminals/command prompts open while using the app
- The API runs on port 5000, React Native on port 8081, DynamoDB on port 8000
- Make sure your phone/emulator is on the same WiFi network as your computer
- If using a physical device, update the IP address in `elove-mobile/src/services/api.js`

## Enjoy Your Dating App! 💕

Your EloVe app is now ready to use. Create profiles, start rating, and watch the Elo system work in real-time!
