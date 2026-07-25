import { v4 as uuidv4 } from 'uuid';

export class Achievement {
  constructor(name, description, xpReward, requirements) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
    this.xpReward = xpReward;
    this.requirements = requirements; // { type, value, habitId? }
    this.unlockedBy = new Set();
    this.unlockedAt = {};
  }

  checkUnlock(userId, userStats, habitStats = {}) {
    if (this.unlockedBy.has(userId)) {
      return false;
    }

    let unlocked = false;

    switch (this.requirements.type) {
      case 'level':
        unlocked = userStats.level >= this.requirements.value;
        break;
      case 'total_xp':
        unlocked = userStats.totalXP >= this.requirements.value;
        break;
      case 'streak':
        unlocked = userStats.streak >= this.requirements.value;
        break;
      case 'habit_completions':
        const habitStat = habitStats[this.requirements.habitId];
        if (habitStat) {
          unlocked = habitStat.totalCompletions >= this.requirements.value;
        }
        break;
      case 'habit_streak':
        const habitStreak = habitStats[this.requirements.habitId];
        if (habitStreak) {
          unlocked = Math.max(habitStreak.currentStreak, habitStreak.bestStreak) >= this.requirements.value;
        }
        break;
      case 'habits_count':
        unlocked = Object.keys(habitStats).length >= this.requirements.value;
        break;
    }

    if (unlocked) {
      this.unlockedBy.add(userId);
      this.unlockedAt[userId] = new Date();
      return true;
    }

    return false;
  }

  isUnlocked(userId) {
    return this.unlockedBy.has(userId);
  }

  getUnlockDate(userId) {
    return this.unlockedAt[userId] || null;
  }
}