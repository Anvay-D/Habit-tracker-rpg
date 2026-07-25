# Solo Leveling RPG

A habit tracking RPG system inspired by Solo Leveling with XP-based progression, achievements, and configurable habits.

## Features

- **User System**: Create users with leveling mechanics
- **Habit Management**: Create configurable habits with XP rewards/penalties
- **XP System**: Gain XP for completions, lose XP for failures
- **Achievement System**: Unlock achievements based on various criteria
- **Streak Tracking**: Daily/weekly streak counters

## API Endpoints

### Users
- `POST /api/users` - Create new user
- `GET /api/users/:userId` - Get user stats

### Habits
- `POST /api/users/:userId/habits` - Create habit
- `GET /api/users/:userId/habits` - List user habits
- `POST /api/habits/:habitId/complete` - Complete habit (+XP)
- `POST /api/habits/:habitId/fail` - Fail habit (-XP)

## Data Models

### User
- Level, XP, total XP tracking
- Streak counter
- Progress percentage

### Habit
- Configurable XP reward/penalty
- Frequency (daily/weekly)
- Completion/failure tracking
- Streak statistics

### Achievement
- Level-based unlocks
- Streak milestones
- Completion goals
- XP bonuses

## Running

### Memory Mode (Default - No Database Required)
```bash
npm install
npm start
```
Runs with in-memory storage (data lost on restart).

### Database Mode (PostgreSQL Required)
```bash
npm install
STORAGE_MODE=database npm start
```
Requires PostgreSQL running locally with matching `.env` settings.

### Docker (Recommended for Database)
```bash
docker compose up
```
Starts PostgreSQL database + application in one command. Data persists in Docker volume.

### Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```
Edit `.env` with your database credentials if using database mode.

## Request Flow Verification

All requests follow this verified chain:
1. UI elements trigger JavaScript event handlers
2. Handlers access `currentUserId` state
3. `fetch()` calls are made to backend endpoints
4. Express routes delegate to `GameService`
5. Business logic modifies storage (memory Maps or PostgreSQL based on STORAGE_MODE)

To verify requests are sent, check browser Network tab or server console logs.

## Architecture

### Frontend Structure
```
public/
├── index.html          # Main HTML structure
├── style.css           # Core styles
├── css/
│   └── nutrition.css   # Nutrition tracker styles
├── app.js              # Main application entry point
└── js/
    ├── state.js        # State management
    ├── api.js          # API client
    ├── navigation.js   # Tab navigation
    ├── habits.js       # Habit management
    ├── nutrition.js    # Nutrition tracking
    └── notifications.js # Notification system
```

### Key Features
- **Modular Architecture**: Frontend code split into feature-based modules
- **Nutrition Tracking**: Water, calories, protein with Open Food Facts integration
- **Dynamic Titles**: E-Rank to King of the Dead based on XP
- **Item Rewards**: Overachievement generates bonus items
- **Partial Completion**: Percentage-based habit completion

### Water Tracking Fix
- Water can now be logged independently using quick-add buttons
- Dedicated `logWaterOnly()` function handles water-only submissions
- UI provides consistent button layout with responsive grid