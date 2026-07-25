# Technical Reference
## Database Layer (New)

### Storage Modes
- **Memory Mode** (`STORAGE_MODE=memory`): Uses JavaScript Maps for storage (default)
- **Database Mode** (`STORAGE_MODE=database`): Uses PostgreSQL via Repository pattern

### Database Connection
**File:** `src/database/connection.js`
- PostgreSQL connection pool using `pg` module
- Configured via environment variables
- Auto-reconnection and error handling

### Repository Pattern
**UserRepository** (`src/repositories/UserRepository.js`)
- `create(name)` → Creates new user in DB
- `findById(id)` → Retrieves user by UUID
- `update(user)` → Persists user changes
- `getStats(userId)` → Returns user with title calculation

**HabitRepository** (`src/repositories/HabitRepository.js`)
- `create(userId, ...)` → Creates habit with relations
- `findById(id)` → Single habit lookup
- `findByUserId(userId)` → Active habits for user
- `recordCompletion(habitId, percentage, xp, date)` → Upsert completion
- `recordFailure(habitId, xpLost, date)` → Log failure

**NutritionRepository** (`src/repositories/NutritionRepository.js`)
- `logEntry(userId, data)` → Upsert daily nutrition
- `getTodayStats(userId)` → Current day data
- `getStats(userId, days)` → Aggregated averages

### Database Schema
Tables created by `scripts/init.sql`:
- `users` - Core user entity with XP/level
- `habits` - Habit definitions with streaks
- `habit_completions` - Daily completion records
- `habit_failures` - Failure tracking
- `achievements` - Achievement definitions
- `user_achievements` - Unlock tracking
- `inventory` - User items
- `nutrition_entries` - Daily nutrition logs

### Docker Configuration
**docker-compose.yml:**
- PostgreSQL 15 Alpine with health checks
- Persistent volume `postgres_data`
- Init script auto-execution
- App service with DB dependency

**Dockerfile:**
- Node 18 Alpine base
- Production dependencies only
- Exposes port 3000

### Environment Variables
```
STORAGE_MODE=memory|database
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
PORT, NODE_ENV
```

### GameService Updates
**Dual-mode constructor:**
```javascript
constructor(storageMode = 'memory')
```
Routes all operations through appropriate storage:
- Memory: Direct Map operations
- Database: Async repository calls

All public methods now async when in database mode.

---
## Existing Content Below
*(Original technical reference content follows)*