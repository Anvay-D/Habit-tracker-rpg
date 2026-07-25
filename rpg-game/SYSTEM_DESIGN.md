# Solo Leveling RPG - System Design Document

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (SPA)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Status    │ │    Tasks    │ │ Achievements│ │   Journal   │ │
│  │    Tab      │ │    Tab      │ │    Tab      │ │    Tab      │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                      app.js + style.css                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (Fetch)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Server (Node.js)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Route Handlers                        │   │
│  │  POST /api/users    GET /api/users/:id                  │   │
│  │  POST /api/habits   GET /api/habits                     │   │
│  │  POST /api/complete POST /api/fail                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GameService                           │   │
│  │  • User Management    • Habit Operations                 │   │
│  │  • XP Calculations    • Achievement Checks               │   │
│  │  • Streak Tracking    • Stats Aggregation               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    In-Memory Storage                     │   │
│  │         Map<UserId, User>  Map<HabitId, Habit>          │   │
│  │              Achievement[]  Journal[]                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Data Models

#### User Model
```
User
├── id: UUID
├── name: String
├── level: Number (default: 1)
├── xp: Number (current level XP)
├── xpToNextLevel: Number (required XP)
├── totalXP: Number (lifetime XP)
├── streak: Number (consecutive days)
├── lastActiveDate: Date
└── createdAt: Date
```

#### Habit Model
```
Habit
├── id: UUID
├── userId: UUID (foreign key)
├── name: String
├── description: String
├── xpReward: Number (positive XP on completion)
├── xpPenalty: Number (negative XP on failure)
├── frequency: String (daily/weekly/custom)
├── isActive: Boolean
├── completions: Date[]
├── failures: Date[]
├── currentStreak: Number
├── bestStreak: Number
├── totalCompletions: Number
└── createdAt: Date
```

#### Achievement Model
```
Achievement
├── id: UUID
├── name: String
├── description: String
├── xpReward: Number (bonus XP on unlock)
├── requirements: Object
│   ├── type: String (level/total_xp/streak/habit_completions/habit_streak/habits_count)
│   ├── value: Number (threshold)
│   └── habitId: UUID (optional, for habit-specific achievements)
├── unlockedBy: Set<UserId>
└── unlockedAt: Map<UserId, Date>
```

### 2. Core Algorithms

#### XP and Leveling System
```
function addXP(amount):
    xp += amount
    totalXP += amount
    while xp >= xpToNextLevel:
        levelUp()
    return leveledUp

function levelUp():
    level += 1
    xp -= xpToNextLevel
    xpToNextLevel = floor(xpToNextLevel × 1.5)
    return level
```

#### Streak Calculation
```
function updateStreak(currentDate):
    if no lastActiveDate:
        streak = 1
    else:
        daysDiff = (currentDate - lastActiveDate) / 86400000
        if daysDiff == 1:
            streak += 1
        else if daysDiff > 1:
            streak = 1
    lastActiveDate = currentDate
```

#### Achievement Unlock Check
```
function checkUnlock(userId, userStats, habitStats):
    if already unlocked:
        return false

    switch requirements.type:
        case "level":
            return userStats.level >= requirements.value
        case "total_xp":
            return userStats.totalXP >= requirements.value
        case "streak":
            return userStats.streak >= requirements.value
        case "habit_completions":
            return habitStats[requirements.habitId].totalCompletions >= requirements.value
        case "habit_streak":
            return max(habitStats[requirements.habitId].currentStreak,
                      habitStats[requirements.habitId].bestStreak) >= requirements.value
        case "habits_count":
            return count(habitStats) >= requirements.value
```

### 3. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users | Create new user |
| GET | /api/users/:userId | Get complete user stats |
| POST | /api/users/:userId/habits | Create new habit/skill |
| GET | /api/users/:userId/habits | List user's active habits |
| POST | /api/habits/:habitId/complete | Complete habit (+XP, supports partial completion via percentage) |
| POST | /api/habits/:habitId/fail | Fail habit (-XP) |
| POST | /api/users/:userId/nutrition | Log nutrition data (water, calories, protein) |
| GET | /api/food/search | Search food database using Open Food Facts API |

### 3.1 Dynamic Title System
Titles progress from E-Rank Hunter to King of the Dead based on total XP:
- 0-99 XP: E-Rank Hunter
- 100-299 XP: D-Rank Hunter
- 300-699 XP: C-Rank Hunter
- 700-1499 XP: B-Rank Hunter
- 1500-2999 XP: A-Rank Hunter
- 3000-5999 XP: S-Rank Hunter
- 6000-9999 XP: Shadow Monarch
- 10000+ XP: King of the Dead

### 3.2 Partial Task Completion
- Tasks support percentage-based completion (0-100+)
- XP rewards are proportional to completion percentage
- Overachievement (>100%) generates bonus items

### 3.3 Nutrition Tracking
- Water, calories, and protein tracking
- Achievements for hydration (3000ml) and nutrition (2000cal + 150g protein)
- Food database integration via Open Food Facts API

### 4. Frontend Architecture

```
app.js
├── State Management
│   ├── currentUserId
│   ├── journalEntries
│   └── localStorage persistence
├── Navigation System
│   ├── initNavigation()
│   └── Tab switching logic
├── Data Loading
│   ├── init()
│   ├── loadUserData()
│   └── render*() functions
├── API Interactions
│   ├── createHabit()
│   ├── completeHabit()
│   ├── failHabit()
│   └── addJournalEntry()
└── UI Enhancements
    ├── showNotification()
    ├── Level up animations
    └── Achievement unlock effects
```

### 5. UI Components

#### Tab Structure
1. **Status Tab**
   - Status Window (character info)
   - Statistics Grid (4 summary cards)
   - XP Progress Bar with percentage

2. **Tasks Tab**
   - Skill acquisition form
   - Active skills/quests list
   - Complete/Fail action buttons

3. **Achievements Tab**
   - Unlocked achievements (highlighted)
   - Locked achievements (requirements shown)
   - XP rewards display

4. **Journal Tab**
   - Entry creation form
   - Chronological entries list
   - Local storage persistence

### 6. Gameplay Flow

```
1. User Registration
   └── Create character with name

2. Daily Loop
   ├── View Status (level, XP, streak)
   ├── Complete Skills (+XP, progress tracking)
   ├── Fail Skills (-XP, streak reset)
   └── Log Progress (journal entries)

3. Progression System
   ├── XP Accumulation → Level Ups
   ├── Consistent Performance → Streak Building
   └── Milestone Achievement → Bonus XP

4. Achievement Unlocks
   ├── Automatic checking on actions
   ├── Visual notifications
   └── Permanent unlocks with dates
```

### 7. Data Persistence Strategy

#### Current Implementation
- **Server**: In-memory Maps (resets on restart)
- **Client**: localStorage for journal entries

#### Recommended Production Enhancements
```
Server-Side:
├── Database (PostgreSQL/MongoDB)
│   ├── Users table/collection
│   ├── Habits table/collection
│   ├── Achievements table/collection
│   └── Journal entries table/collection
├── Session management
├── Rate limiting
└── Input validation

Client-Side:
├── Service Workers (offline support)
├── IndexedDB for larger datasets
└── State management (Redux/Vuex)
```

### 8. Key Design Decisions

1. **In-Memory Storage**: Chosen for simplicity and rapid prototyping
2. **RESTful API**: Standard HTTP methods for CRUD operations
3. **Client-Side Journal**: Keeps game state lightweight
4. **Automatic Achievement Checks**: Real-time feedback on progress
5. **Solo Leveling Theme**: Status window, skill system, progression

### 9. Scalability Considerations

- Separate concerns with service layer
- Stateless server design
- API versioning support
- Caching layer for frequently accessed data
- WebSocket support for real-time updates

### 10. Security Measures (Production)

- User authentication (JWT/oauth)
- Input sanitization
- Rate limiting per user
- SQL injection prevention
- CORS configuration
- HTTPS enforcement