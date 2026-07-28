import { User } from '../models/User.js';
import { Habit } from '../models/Habit.js';
import { Achievement } from '../models/Achievement.js';
import { TitleSystem } from '../models/Title.js';
import { Item, ITEM_TEMPLATES } from '../models/Item.js';

export class GameService {
  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.achievements = this.initializeAchievements();
    this.inventory = new Map(); // userId -> items[]
    this.nutrition = new Map(); // userId -> {date: {water, calories, protein}}
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

  createHabit(userId, name, description, xpReward, xpPenalty, frequency, targetValue = 100) {
    const habit = new Habit(userId, name, description, xpReward, xpPenalty, frequency, targetValue);
    this.habits.set(habit.id, habit);
    return habit;
  }

  getUserHabits(userId) {
    return Array.from(this.habits.values()).filter(h => h.userId === userId && h.isActive);
  }

  completeHabit(habitId, percentage = 100) {
    const habit = this.habits.get(habitId);
    if (!habit) return null;

    const xpGained = habit.complete(percentage);
    const user = this.users.get(habit.userId);
    let itemsEarned = [];
    let bonusXP = 0;

    if (user) {
      // Handle item rewards for overachievement
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

    // Get title/rank info
    const titleInfo = TitleSystem.getTitle(user.totalXP);
    const titleProgress = TitleSystem.getProgressToNext(user.totalXP);

    // Get inventory
    const userInventory = this.inventory.get(userId) || [];

    // Get nutrition data for today
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

  getNutritionStats(userId) {
    const nutritionData = this.nutrition.get(userId) || {};
    const entries = Object.values(nutritionData);

    if (entries.length === 0) {
      return { avgWater: 0, avgCalories: 0, avgProtein: 0, streak: 0 };
    }

    const avgWater = Math.floor(entries.reduce((sum, e) => sum + e.water, 0) / entries.length);
    const avgCalories = Math.floor(entries.reduce((sum, e) => sum + e.calories, 0) / entries.length);
    const avgProtein = Math.floor(entries.reduce((sum, e) => sum + e.protein, 0) / entries.length);

    // Calculate nutrition streak
    let nutritionStreak = 0;
    const sortedDates = Object.keys(nutritionData).sort().reverse();
    const today = new Date();

    for (let i = 0; i < sortedDates.length; i++) {
      const entryDate = new Date(sortedDates[i]);
      const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === i && (nutritionData[sortedDates[i]].water >= 2000 || nutritionData[sortedDates[i]].calories >= 1500)) {
        nutritionStreak++;
      } else {
        break;
      }
    }

    return { avgWater, avgCalories, avgProtein, streak: nutritionStreak };
  }

  logNutrition(userId, { water = 0, calories = 0, protein = 0 }) {
    const user = this.users.get(userId);
    if (!user) return null;

    const today = new Date().toDateString();
    const nutritionData = this.nutrition.get(userId) || {};

    if (!nutritionData[today]) {
      nutritionData[today] = { water: 0, calories: 0, protein: 0 };
    }

    nutritionData[today].water += water;
    nutritionData[today].calories += calories;
    nutritionData[today].protein += protein;

    this.nutrition.set(userId, nutritionData);

    // Check for nutrition achievements
    const todayData = nutritionData[today];
    let achievements = [];

    if (todayData.water >= 3000) {
      achievements.push("Hydration Master");
    }
    if (todayData.calories >= 2000 && todayData.protein >= 150) {
      achievements.push("Nutrition Adept");
    }

    return { todayData, achievements };
  }
}