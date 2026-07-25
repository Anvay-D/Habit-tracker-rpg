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

```bash
npm install
npm start
```