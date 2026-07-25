# Software Design Patterns Documentation

## Design Patterns Implemented

### 1. **Service Layer Pattern** (GameService)
- **Location**: `src/services/GameService.js`
- **Purpose**: Encapsulates business logic and orchestrates domain operations
- **Benefits**:
  - Centralizes complex operations
  - Provides clean API for controllers
  - Enables easier testing and maintenance

### 2. **Repository Pattern** (In-Memory Implementation)
- **Location**: `GameService` constructor (lines 9-13)
- **Purpose**: Abstracts data access layer using Maps as repositories
- **Implementation**:
  - `users` Map: User repository
  - `habits` Map: Habit repository
  - `achievements` Array: Achievement repository
  - `inventory` Map: Inventory repository
  - `nutrition` Map: Nutrition repository

### 3. **Factory Method Pattern** (Item Generation)
- **Location**: `src/models/Item.js`
- **Purpose**: Creates items based on overachievement percentage
- **Method**: `Item.generateForOverachievement()`

### 4. **Strategy Pattern** (Title System)
- **Location**: `src/models/Title.js`
- **Purpose**: Different title/rank strategies based on XP thresholds
- **Implementation**: `TitleSystem.getTitle()` selects appropriate title

### 5. **Observer Pattern** (Achievement System)
- **Purpose**: Automatically checks and unlocks achievements on actions
- **Implementation**: `checkAchievements()` called after habit completion

### 6. **Value Object Pattern** (Stats Responses)
- **Purpose**: Immutable data transfer objects for API responses
- **Example**: Return objects from `getUserStats()`, `completeHabit()`

## Key Architectural Decisions

### Separation of Concerns
- **Models**: Pure data structures and basic operations
- **Services**: Business logic and coordination
- **Routes**: HTTP handling and validation
- **Frontend**: UI rendering and user interactions

### State Management
- Server maintains authoritative state
- Client uses localStorage only for non-critical data (journal)
- All game state retrieved fresh from server on load

### XP and Reward Calculation Flow
1. Habit completion triggers percentage calculation
2. Partial XP based on completion percentage
3. Overachievement (>100%) generates bonus items
4. Achievement checks run automatically
5. All rewards aggregated and returned

## Open Source Libraries Used

### Chart.js (v4.5.1)
- **Purpose**: Nutrition visualization
- **Usage**: Line charts for water/calorie tracking
- **Benefits**: Reduces custom charting code significantly

### UUID (v9.0.0)
- **Purpose**: Unique ID generation
- **Usage**: All entity IDs (users, habits, achievements)

## Patterns to Consider for Future

1. **Command Pattern**: For undoable actions (habit completion/failure)
2. **Decorator Pattern**: For stacking achievements/buffs
3. **State Pattern**: For different game modes or user states
4. **Singleton Pattern**: If global game configuration is needed
5. **Builder Pattern**: For complex habit creation with many options

## Code Organization Principles

1. Each file represents one domain concept
2. Dependencies flow downward (routes → service → models)
3. Business logic stays in service layer
4. Models remain lightweight with minimal logic
5. Frontend separates concerns (app.js logic, style.css presentation)