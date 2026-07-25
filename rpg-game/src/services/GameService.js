import { User } from '../models/User.js';
import { Habit } from '../models/Habit.js';
import { Achievement } from '../models/Achievement.js';
import { TitleSystem } from '../models/Title.js';
import { Item, ITEM_TEMPLATES } from '../models/Item.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { HabitRepository } from '../repositories/HabitRepository.js';
import { NutritionRepository } from '../repositories/NutritionRepository.js';

export class GameService {
  constructor(storageMode = 'memory') {
    this.storageMode = storageMode;
    this.isDatabaseMode = storageMode === 'database';

    if (this.isDatabaseMode) {
      this.userRepo = new UserRepository();
      this.habitRepo = new HabitRepository();
      this.nutritionRepo = new NutritionRepository();
    } else {
      this.users = new Map();
      this.habits = new Map();
      this.inventory = new Map();
      this.nutrition = new Map();
    }

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

  // User methods
  async createUser(name) {
    if (this.isDatabaseMode) {
      return await this.userRepo.create(name);
    } else {
      const user = new User(name);
      this.users.set(user.id, user);
      return user;
    }
  }

  async getUser(userId) {
    if (this.isDatabaseMode) {
      return await this.userRepo.findById(userId);
    } else {
      return this.users.get(userId);
    }
  }

  // Habit methods
  async createHabit(userId, name, description, xpReward, xpPenalty, frequency, targetValue = 100) {
    if (this.isDatabaseMode) {
      return await this.habitRepo.create(userId, name, description, xpReward, xpPenalty, frequency, targetValue);
    } else {
      const habit = new Habit(userId, name, description, xpReward, xpPenalty, frequency, targetValue);
      this.habits.set(habit.id, habit);
      return habit;
    }
  }

  async getUserHabits(userId) {
    if (this.isDatabaseMode) {
      return await this.habitRepo.findByUserId(userId);
    } else {
      return Array.from(this.habits.values()).filter(h => h.userId === userId && h.isActive);
    }
  }

  // Action methods
  async completeHabit(habitId, percentage = 100) {
    if (this.isDatabaseMode) {
      return await this.completeHabitDb(habitId, percentage);
    } else {
      return this.completeHabitMemory(habitId, percentage);
    }
  }

  async failHabit(habitId) {
    if (this.isDatabaseMode) {
      return await this.failHabitDb(habitId);
    } else {
      return this.failHabitMemory(habitId);
    }
  }

  // Memory mode implementations
  completeHabitMemory(habitId, percentage = 100) {
    const habit = this.habits.get(habitId);
    if (!habit) return null;

    const xpGained = habit.complete(percentage);
    const user = this.users.get(habit.userId);
    let itemsEarned = [];
    let bonusXP = 0;

    if (user) {
      if (percentage > 100) {
        const overAmount = percentage - 100;
        const item = Item.generateForOverachievement(overAmount, habit.xpReward);
        if (item) {
          itemsEarned.push(item);
          if (!this.inventory.has(user.id)) {
            this.inventory.set(user.id, []);
          }
          this.inventory.get(user.id).push(item);
          habit.addItem(item);
          bonusXP = Math.floor(item.xpRequired / 10);
        }
      }

      const leveledUp = user.addXP(xpGained + bonusXP);
      user.updateStreak();
      const newAchievements = this.checkAchievements(user, habit);
      return {
        xpGained: xpGained + bonusXP,
        leveledUp,
        newAchievements,
        itemsEarned,
        percentage: Math.max(100, percentage)
      };
    }

    return {
      xpGained,
      leveledUp: false,
      newAchievements: [],
      itemsEarned: [],
      percentage
    };
  }

  failHabitMemory(habitId) {
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

  // Database mode implementations
  async completeHabitDb(habitId, percentage = 100) {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit) return null;

    const xpGained = habit.complete(percentage);
    const user = await this.userRepo.findById(habit.userId);
    let itemsEarned = [];
    let bonusXP = 0;

    if (user) {
      if (percentage > 100) {
        const overAmount = percentage - 100;
        const item = Item.generateForOverachievement(overAmount, habit.xpReward);
        if (item) {
          itemsEarned.push(item);
          bonusXP = Math.floor(item.xpRequired / 10);
        }
      }

      user.addXP(xpGained + bonusXP);
      user.updateStreak();
      await this.userRepo.update(user);
      await this.habitRepo.update(habit);
      await this.habitRepo.recordCompletion(habitId, percentage, xpGained, new Date().toISOString().split('T')[0]);
    }

    return {
      xpGained: xpGained + bonusXP,
      leveledUp: user ? true : false,
      newAchievements: [],
      itemsEarned,
      percentage: Math.max(100, percentage)
    };
  }

  async failHabitDb(habitId) {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit) return null;

    const xpLost = habit.fail();
    const user = await this.userRepo.findById(habit.userId);

    if (user) {
      user.subtractXP(xpLost);
      await this.userRepo.update(user);
      await this.habitRepo.update(habit);
      await this.habitRepo.recordFailure(habitId, xpLost, new Date().toISOString().split('T')[0]);
    }

    return { xpLost };
  }

  // Stats method
  async getUserStats(userId) {
    if (this.isDatabaseMode) {
      return await this.getUserStatsDb(userId);
    } else {
      return this.getUserStatsMemory(userId);
    }
  }

  getUserStatsMemory(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    const habits = this.getUserHabits(userId);
    const habitStats = {};
    habits.forEach(h => {
      habitStats[h.id] = h.getStats();
    });

    const unlockedAchievements = this.achievements.filter(a => a.isUnlocked(userId));
    const lockedAchievements = this.achievements.filter(a => !a.isUnlocked(userId));

    const titleInfo = TitleSystem.getTitle(user.totalXP);
    const titleProgress = TitleSystem.getProgressToNext(user.totalXP);
    const userInventory = this.inventory.get(userId) || [];

    const today = new Date().toDateString();
    const nutritionData = this.nutrition.get(userId) || {};
    const todayNutrition = nutritionData[today] || { water: 0, calories: 0, protein: 0 };

    return {
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        xp: user.xp,
        totalXP: user.totalXP,
        xpToNextLevel: user.xpToNextLevel,
        progress: user.getProgress(),
        streak: user.streak,
        title: titleInfo.title,
        rank: titleInfo.rank,
        titleProgress
      },
      habits: habits.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        xpReward: h.xpReward,
        xpPenalty: h.xpPenalty,
        frequency: h.frequency,
        targetValue: h.targetValue,
        stats: h.getStats(),
        items: h.items
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
      },
      inventory: userInventory,
      nutrition: {
        today: todayNutrition,
        stats: this.getNutritionStats(userId)
      }
    };
  }

  async getUserStatsDb(userId) {
    const stats = await this.userRepo.getStats(userId);
    if (!stats) return null;

    const user = stats.user;
    const habits = await this.getUserHabits(userId);

    const todayNutrition = await this.nutritionRepo.getTodayStats(userId);

    return {
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        xp: user.xp,
        totalXP: user.totalXP,
        xpToNextLevel: user.xpToNextLevel,
        progress: user.getProgress(),
        streak: user.streak,
        title: stats.title,
        rank: 1,
        titleProgress: { percentage: 0, xpNeeded: 0 }
      },
      habits: habits.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        xpReward: h.xpReward,
        xpPenalty: h.xpPenalty,
        frequency: h.frequency,
        targetValue: h.targetValue,
        stats: h.getStats(),
        items: []
      })),
      achievements: {
        unlocked: [],
        locked: this.achievements.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          xpReward: a.xpReward,
          requirements: a.requirements
        }))
      },
      inventory: [],
      nutrition: {
        today: todayNutrition,
        stats: await this.nutritionRepo.getStats(userId)
      }
    };
  }

  getNutritionStats(userId) {
    if (this.isDatabaseMode) {
      return this.nutritionRepo.getStats(userId);
    }

    const nutritionData = this.nutrition.get(userId) || {};
    const entries = Object.values(nutritionData);

    if (entries.length === 0) {
      return { avgWater: 0, avgCalories: 0, avgProtein: 0, streak: 0 };
    }

    const avgWater = Math.floor(entries.reduce((sum, e) => sum + e.water, 0) / entries.length);
    const avgCalories = Math.floor(entries.reduce((sum, e) => sum + e.calories, 0) / entries.length);
    const avgProtein = Math.floor(entries.reduce((sum, e) => sum + e.protein, 0) / entries.length);

    return { avgWater, avgCalories, avgProtein, streak: 0 };
  }

  async logNutrition(userId, data) {
    if (this.isDatabaseMode) {
      const entry = await this.nutritionRepo.logEntry(userId, data);
      return { todayData: entry, achievements: [] };
    } else {
      const user = this.users.get(userId);
      if (!user) return null;

      const today = new Date().toDateString();
      const nutritionData = this.nutrition.get(userId) || {};

      if (!nutritionData[today]) {
        nutritionData[today] = { water: 0, calories: 0, protein: 0 };
      }

      nutritionData[today].water += data.water || 0;
      nutritionData[today].calories += data.calories || 0;
      nutritionData[today].protein += data.protein || 0;

      this.nutrition.set(userId, nutritionData);

      const todayData = nutritionData[today];
      let achievements = [];

      if (todayData.water >= 3000) achievements.push("Hydration Master");
      if (todayData.calories >= 2000 && todayData.protein >= 150) achievements.push("Nutrition Adept");

      return { todayData, achievements };
    }
  }
}