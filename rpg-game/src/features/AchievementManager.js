export class AchievementManager {
  constructor(gameService) {
    this.gameService = gameService;
    this.defaultAchievements = [
      { id: 'first_steps', name: 'First Steps', description: 'Complete your first habit', xpReward: 25, type: 'habit_completions', value: 1 },
      { id: 'getting_started', name: 'Getting Started', description: 'Reach level 2', xpReward: 50, type: 'level', value: 2 },
      { id: 'consistent', name: 'Consistent', description: 'Maintain a 3-day streak', xpReward: 75, type: 'streak', value: 3 },
      { id: 'progress', name: 'Progress', description: 'Earn 100 total XP', xpReward: 100, type: 'total_xp', value: 100 },
      { id: 'dedicated', name: 'Dedicated', description: 'Maintain a 7-day streak', xpReward: 150, type: 'streak', value: 7 },
      { id: 'skilled', name: 'Skilled', description: 'Create 5 habits', xpReward: 125, type: 'habits_count', value: 5 },
      { id: 'novice_hunter', name: 'Novice Hunter', description: 'Reach level 5', xpReward: 200, type: 'level', value: 5 },
      { id: 'xp_accumulator', name: 'XP Accumulator', description: 'Earn 500 total XP', xpReward: 250, type: 'total_xp', value: 500 },
      { id: 'habit_master', name: 'Habit Master', description: 'Complete 50 habits', xpReward: 300, type: 'habit_completions', value: 50 },
      { id: 'elite', name: 'Elite', description: 'Reach level 10', xpReward: 500, type: 'level', value: 10 },
      { id: 'hydration_hero', name: 'Hydration Hero', description: 'Drink 3000ml water in a day', xpReward: 150, type: 'hydration', value: 3000 },
      { id: 'nutrition_expert', name: 'Nutrition Expert', description: 'Log 2000 calories with 150g protein in a day', xpReward: 200, type: 'nutrition', value: { calories: 2000, protein: 150 } }
    ];
  }

  getDefaultAchievements() {
    return this.defaultAchievements;
  }

  getAvailableAchievements() {
    return this.defaultAchievements;
  }

  getUserEarnedAchievements(userId) {
    const unlockedIds = Array.from(this.gameService.achievements.get(userId) || []);
    return this.defaultAchievements.filter(a => unlockedIds.includes(a.id));
  }

  checkUserAchievements(userId) {
    const user = this.gameService.users.get(userId);
    if (!user) return [];

    const userStats = this.gameService.getUserStats(userId);
    if (!userStats) return [];

    const newlyUnlocked = [];

    this.defaultAchievements.forEach(achievement => {
      if (this.hasUserUnlocked(userId, achievement.id)) return;

      if (this.checkRequirement(achievement, userStats, user)) {
        this.unlockAchievement(userId, achievement.id);
        newlyUnlocked.push(achievement);
      }
    });

    return newlyUnlocked;
  }

  checkRequirement(achievement, userStats, user) {
    switch (achievement.type) {
      case 'level':
        return user.level >= achievement.value;

      case 'total_xp':
        return user.totalXP >= achievement.value;

      case 'streak':
        return user.streak >= achievement.value;

      case 'habit_completions':
        const totalCompletions = userStats.habits.reduce((sum, h) => sum + h.stats.totalCompletions, 0);
        return totalCompletions >= achievement.value;

      case 'habits_count':
        return userStats.habits.length >= achievement.value;

      case 'hydration':
        return userStats.nutrition && userStats.nutrition.today.water >= achievement.value;

      case 'nutrition':
        return userStats.nutrition &&
               userStats.nutrition.today.calories >= achievement.value.calories &&
               userStats.nutrition.today.protein >= achievement.value.protein;

      default:
        return false;
    }
  }

  unlockAchievement(userId, achievementId) {
    if (!this.gameService.achievements.has(userId)) {
      this.gameService.achievements.set(userId, new Set());
    }
    this.gameService.achievements.get(userId).add(achievementId);
  }

  hasUserUnlocked(userId, achievementId) {
    const userAchievements = this.gameService.achievements.get(userId);
    return userAchievements && userAchievements.has(achievementId);
  }

  getUserAchievements(userId) {
    const unlockedIds = Array.from(this.gameService.achievements.get(userId) || []);
    const unlocked = this.defaultAchievements.filter(a => unlockedIds.includes(a.id));
    const locked = this.defaultAchievements.filter(a => !unlockedIds.includes(a.id));

    return {
      unlocked: unlocked.map(a => ({
        ...a,
        unlockedAt: new Date() // Simplified - would need to track actual unlock dates
      })),
      locked: locked
    };
  }

  getAchievementProgress(userId, achievement) {
    const user = this.gameService.users.get(userId);
    const userStats = this.gameService.getUserStats(userId);

    if (!user || !userStats) return 0;

    switch (achievement.type) {
      case 'level':
        return Math.min(100, (user.level / achievement.value) * 100);

      case 'total_xp':
        return Math.min(100, (user.totalXP / achievement.value) * 100);

      case 'streak':
        return Math.min(100, (user.streak / achievement.value) * 100);

      case 'habit_completions':
        const totalCompletions = userStats.habits.reduce((sum, h) => sum + h.stats.totalCompletions, 0);
        return Math.min(100, (totalCompletions / achievement.value) * 100);

      case 'habits_count':
        return Math.min(100, (userStats.habits.length / achievement.value) * 100);

      default:
        return this.hasUserUnlocked(userId, achievement.id) ? 100 : 0;
    }
  }
}