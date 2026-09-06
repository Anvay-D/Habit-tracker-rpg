# Technical Reference

## Backend Files

### server.js
**Express server entry point and API route definitions**

#### API Routes
| Method | Endpoint | Purpose | Input | Output | Dependencies |
|--------|----------|---------|-------|--------|--------------|
| POST | `/api/users` | Create new user | `{ name }` | `{ userId, name }` | GameService.createUser() |
| GET | `/api/users/:userId` | Get complete user stats | `userId` (path) | User stats object | GameService.getUserStats() |
| POST | `/api/users/:userId/habits` | Create new habit | `{ name, description, xpReward, xpPenalty, frequency }` | Habit object | GameService.createHabit() |
| GET | `/api/users/:userId/habits` | List user's active habits | `userId` (path) | Habit[] | GameService.getUserHabits() |
| POST | `/api/habits/:habitId/complete` | Complete habit (supports partial) | `{ percentage? }` | `{ xpGained, leveledUp, newAchievements, itemsEarned }` | GameService.completeHabit() |
| POST | `/api/habits/:habitId/fail` | Fail habit | - | `{ xpLost }` | GameService.failHabit() |
| POST | `/api/users/:userId/nutrition` | Log nutrition data | `{ water, calories, protein }` | `{ todayData, achievements }` | GameService.logNutrition() |
| GET | `/api/users/:userId/inventory` | Get user's items | `userId` (path) | Item[] | inventory Map |
| GET | `/api/food/search` | Search Open Food Facts | `?query=` | Food[] | External API |

---

## Backend Models

### src/models/User.js
**User entity with XP, leveling, and streak management**

| Method | Purpose | Input | Output | Dependencies |
|--------|---------|-------|--------|--------------|
| `constructor(name)` | Initialize new user | `name: string` | User instance | uuid |
| `addXP(amount)` | Add XP and handle leveling | `amount: number` | `boolean` (leveledUp) | levelUp() |
| `subtractXP(amount)` | Remove XP (min 0) | `amount: number` | `number` (new XP) | - |
| `levelUp()` | Increment level and update thresholds | - | `number` (new level) | - |
| `updateStreak()` | Update daily streak | - | `number` (streak) | - |
| `getProgress()` | Get XP progress info | - | `{ current, required, percentage }` | - |

**Properties:** `id, name, level, xp, xpToNextLevel, totalXP, streak, lastActiveDate, createdAt`

---

### src/models/Habit.js
**Habit/skill entity with completion tracking**

| Method | Purpose | Input | Output | Dependencies |
|--------|---------|-------|--------|--------------|
| `constructor(userId, name, description, xpReward, xpPenalty, frequency, targetValue)` | Initialize habit | 7 params | Habit instance | uuid |
| `complete(percentage, date)` | Record completion (supports partial) | `percentage: number, date: Date` | `number` (XP earned) | updateStreak() |
| `fail(date)` | Record failure | `date: Date` | `xpPenalty` | - |
| `addItem(item)` | Add reward item | `item: object` | - | - |
| `updateStreak(completionDate)` | Update habit streak | `completionDate: Date` | - | - |
| `getCompletionRate(days)` | Calculate success rate | `days: number` | `number` (percentage) | - |
| `getStats()` | Get habit statistics | - | Stats object | getCompletionRate() |

**Properties:** `id, userId, name, description, xpReward, xpPenalty, frequency, targetValue, isActive, completions[], failures[], currentStreak, bestStreak, totalCompletions, partialCompletions[], items[], createdAt, lastCompletedDate`

---

### src/models/Achievement.js
**Achievement definition with unlock logic**

| Method | Purpose | Input | Output | Dependencies |
|--------|---------|-------|--------|--------------|
| `constructor(name, description, xpReward, requirements)` | Initialize achievement | 4 params | Achievement instance | uuid |
| `checkUnlock(userId, userStats, habitStats)` | Check if unlock conditions met | `userId, userStats, habitStats` | `boolean` (unlocked) | requirements |
| `isUnlocked(userId)` | Check unlock status | `userId` | `boolean` | unlockedBy Set |
| `getUnlockDate(userId)` | Get unlock timestamp | `userId` | `Date \| null` | unlockedAt Map |

**Requirement Types:** `level, total_xp, streak, habit_completions, habit_streak, habits_count`

---

### src/models/Item.js
**Item generation for overachievement rewards**

| Method | Purpose | Input | Output | Dependencies |
|--------|---------|-------|--------|--------------|
| `constructor(template, multiplier)` | Create item from template | `template, multiplier` | Item instance | uuid |
| `generateForOverachievement(overAmount, baseXP)` | Generate random item | `overAmount, baseXP` | `Item \| null` | ITEM_TEMPLATES |

**ITEM_TEMPLATES:** 14 predefined items across rarity levels (common to legendary)

---

### src/models/Title.js
**Title/rank system based on XP thresholds**

| Method | Purpose | Input | Output | Dependencies |
|--------|---------|-------|--------|--------------|
| `getTitle(totalXP)` | Get current title | `totalXP: number` | Title object | TITLES |
| `getNextTitle(currentXP)` | Get next achievable title | `currentXP: number` | Title \| null | getTitle() |
| `getProgressToNext(currentXP)` | Calculate progress to next title | `currentXP: number` | `{ percentage, xpNeeded }` | getTitle(), getNextTitle() |

**TITLES:** E’D’C’B’A’S’Shadow Monarch’King of the Dead (8 ranks)

---

## Backend Services

### src/services/GameService.js
**Core game logic and state management**

| Method | Purpose | Input | Output | Dependencies |
|--------|---------|-------|--------|--------------|
| `constructor()` | Initialize service with empty Maps | - | GameService instance | All models |
| `initializeAchievements()` | Load 9 default achievements | - | Achievement[] | Achievement class |
| `createUser(name)` | Create and store new user | `name: string` | User | User class |
| `getUser(userId)` | Retrieve user by ID | `userId: string` | User \| undefined | users Map |
| `createHabit(userId, ...)` | Create and store habit | 7 params | Habit | Habit class |
| `getUserHabits(userId)` | Get active user habits | `userId: string` | Habit[] | habits Map |
| `completeHabit(habitId, percentage)` | Process completion | `habitId, percentage` | Completion result | User.addXP(), checkAchievements() |
| `failHabit(habitId)` | Process failure | `habitId: string` | `{ xpLost }` | User.subtractXP() |
| `checkAchievements(user, habit)` | Check and unlock achievements | User, Habit | Achievement[] | Achievement.checkUnlock() |
| `getUserStats(userId)` | Get complete user state | `userId: string` | Stats object | All Maps, TitleSystem |
| `getNutritionStats(userId)` | Calculate nutrition averages | `userId: string` | `{ avgWater, avgCalories, avgProtein, streak }` | nutrition Map |
| `logNutrition(userId, data)` | Record nutrition entry | `userId, { water, calories, protein }` | `{ todayData, achievements }` | nutrition Map |

**Storage Maps:** `users, habits, achievements, inventory, nutrition`

---

## Frontend Files

### public/app.js
**Main application entry point and state management**

| Function | Purpose | Input | Output | Dependencies |
|----------|---------|-------|--------|--------------|
| `showAuthScreen()` | Display auth UI | - | - | DOM manipulation |
| `showGameScreen()` | Display main game UI | - | - | loadUserData() |
| `createUser()` | Create new user via API | - | - | fetch, localStorage |
| `loadUserData()` | Fetch and render user state | - | - | fetch, render functions |
| `createHabit()` | Create new habit via API | - | - | fetch, showNotification() |
| `completeHabit(habitId)` | Complete habit via API | `habitId: string` | - | fetch, showNotification() |
| `failHabit(habitId)` | Fail habit via API | `habitId: string` | - | fetch, showNotification() |
| `showNotification(message, type)` | Display notification | `message, type` | - | DOM manipulation |
| `showLevelUpAnimation(level)` | Animate level up | `level: number` | - | CSS animations |
| `addJournalEntry()` | Add journal entry | - | - | localStorage |
| `init()` | Initialize application | - | - | Event listeners |

---

### public/js/habits.js
**Habit UI management**

| Function | Purpose |
|----------|---------|
| `completeHabit(habitId)` | Handle habit completion UI |
| `failHabit(habitId)` | Handle habit failure UI |
| `renderHabits(habits)` | Render habit list |

---

### public/js/nutrition.js
**Nutrition tracking UI**

| Function | Purpose |
|----------|---------|
| `logNutrition()` | Log nutrition data |
| `searchFood()` | Search food database |
| `renderNutrition(data)` | Display nutrition stats |

---

### public/js/achievements.js
**Achievement display UI**

| Function | Purpose |
|----------|---------|
| `renderAchievements(data)` | Display unlocked/locked achievements |
| `updateProgress(achievements)` | Update progress bars |

---

### public/js/state.js
**Client-side state management**

| Variable | Purpose |
|----------|---------|
| `currentUserId` | Active user identifier |
| `journalEntries` | Local journal storage |
| `localStorage` | Persistence layer |

---

### public/js/api.js
**API communication layer**

| Function | Purpose |
|----------|---------|
| All fetch wrappers | HTTP request handling |

---

### public/js/navigation.js
**Tab navigation system**

| Function | Purpose |
|----------|---------|
| `initNavigation()` | Initialize tab switching |
| Tab click handlers | Switch between Status/Tasks/Achievements/Journal |

---

### public/js/notifications.js
**Notification system**

| Function | Purpose |
|----------|---------|
| `showNotification()` | Display toast notifications |

---

### public/js/partial-progress.js
**Partial completion UI**

| Function | Purpose |
|----------|---------|
| Progress slider handlers | Handle 0-200% completion |

---

## Feature Modules

### src/features/PartialProgressManager.js
**Partial progress handling logic**

### src/features/OverachievementRewardManager.js
**Overachievement reward distribution**

### src/features/AchievementManager.js
**Achievement management utilities**