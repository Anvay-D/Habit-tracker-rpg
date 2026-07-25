import { User } from '../models/User.js';
import { Habit } from '../models/Habit.js';
import { Achievement } from '../models/Achievement.js';

export class GameService {
  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.achievements = this.initializeAchievements();
  }

  initializeAchievements() {
    return [
      new Achievement('First Steps', 'Complete your first habit', 50, { type: 'habit_completions', value: 1 }),
      new Achievement('Level 5 Warrior', 'Reach level 5', 100, { type: 'level', value: 5 }),
      new Achievement('Level 10 Hero', 'Reach level 10', 200, { type: 'level', value: 10 }),
      new Achievement('XP Collector', 'Earn 1000 total XP', 150, { type: 'total_xp', value: 1000 }),
      new Achievement('Week Warrior', 'Maintain a 7-day streak', 100, { type: 'streak', value: 7 }),
      new Achievement('Month Master', 'Maintain a 30-day streak', 300, { type: 'streak', value: 30 }),
      new Achievement('Habit Creator', 'Create 5 habits', 75, { type: 'habits_count', value: 5 }),
      new Achievement('Dedicated', 'Complete a habit 50 times', 200, { type: 'habit_completions', value: 50 }),
      new Achievement('Unstoppable', 'Achieve a 50-streak on any habit', 500, { type: 'habit_streak', value: 50 })
    ];
  }

  createUser(name) {
    const user = new User(name);
    this.users.set(user.id, user);
    return user;
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  createHabit(userId, name, description, xpReward, xpPenalty, frequency) {
    const habit = new Habit(userId, name, description, xpReward, xpPenalty, frequency);
    this.habits.set(habit.id, habit);
    return habit;
  }

  getUserHabits(userId) {
    return Array.from(this.habits.values()).filter(h => h.userId === userId && h.isActive);
  }

  completeHabit(habitId) {
    const habit = this.habits.get(habitId);
    if (!habit) return null;

    const xpGained = habit.complete();
    const user = this.users.get(habit.userId);

    if (user) {
      const leveledUp = user.addXP(xpGained);
      user.updateStreak();
      const newAchievements = this.checkAchievements(user, habit);
      return { xpGained, leveledUp, newAchievements };
    }

    return { xpGained, leveledUp: false, newAchievements: [] };
  }

  failHabit(habitId) {
    const habit = this.habits.get(habitId);
    if (!habit) return null;

    const xpLost = habit.fail();
    const user = this.users.get(habit.userId);

    if (user) {
      user.subtractXP(xpLost);
      return { xpLost };
    }

    return { xpLost };
  }

  checkAchievements(user, completedHabit = null) {
    const unlockedAchievements = [];
    const habitStats = {};

    this.getUserHabits(user.id).forEach(h => {
      habitStats[h.id] = h.getStats();
    });

    for (const achievement of this.achievements) {
      const requirements = achievement.requirements;
      if (requirements.habitId && requirements.habitId !== completedHabit?.id) {
        continue;
      }

      if (achievement.checkUnlock(user.id, user, habitStats)) {
        user.addXP(achievement.xpReward);
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  getUserStats(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    const habits = this.getUserHabits(userId);
    const habitStats = {};
    habits.forEach(h => {
      habitStats[h.id] = h.getStats();
    });

    const unlockedAchievements = this.achievements.filter(a => a.isUnlocked(userId));
    const lockedAchievements = this.achievements.filter(a => !a.isUnlocked(userId));

    return {
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        xp: user.xp,
        totalXP: user.totalXP,
        xpToNextLevel: user.xpToNextLevel,
        progress: user.getProgress(),
        streak: user.streak
      },
      habits: habits.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        xpReward: h.xpReward,
        xpPenalty: h.xpPenalty,
        frequency: h.frequency,
        stats: h.getStats()
      })),
      achievements: {
        unlocked: unlockedAchievements.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          xpReward: a.xpReward,
          unlockedAt: a.getUnlockDate(userId)
        })),
        locked: lockedAchievements.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          xpReward: a.xpReward,
          requirements: a.requirements
        }))
      }
    };
  }
}