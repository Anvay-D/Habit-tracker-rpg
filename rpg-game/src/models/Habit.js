import { v4 as uuidv4 } from 'uuid';

export class Habit {
  constructor(userId, name, description, xpReward, xpPenalty, frequency = 'daily', targetValue = 100) {
    this.id = uuidv4();
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.xpReward = xpReward;
    this.xpPenalty = xpPenalty;
    this.frequency = frequency; // daily, weekly, custom
    this.targetValue = targetValue; // Target value for partial completion (e.g., 100%)
    this.isActive = true;
    this.completions = [];
    this.failures = [];
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.totalCompletions = 0;
    this.partialCompletions = []; // Track partial progress {date, percentage, xpEarned}
    this.items = []; // Rewards earned
    this.createdAt = new Date();
    this.lastCompletedDate = null;
  }

  complete(percentage = 100, date = new Date()) {
    const completionDate = new Date(date);
    const actualPercentage = Math.max(0, Math.min(100, percentage));

    if (actualPercentage === 100) {
      this.completions.push(completionDate);
      this.totalCompletions += 1;
      this.lastCompletedDate = completionDate;
      this.updateStreak(completionDate);
      return this.xpReward;
    } else {
      // Partial completion
      const xpEarned = Math.floor((this.xpReward * actualPercentage) / 100);
      this.partialCompletions.push({
        date: completionDate,
        percentage: actualPercentage,
        xpEarned
      });
      this.lastCompletedDate = completionDate;
      this.updateStreak(completionDate);
      return xpEarned;
    }
  }

  fail(date = new Date()) {
    this.failures.push(new Date(date));
    this.currentStreak = 0;
    return this.xpPenalty;
  }

  addItem(item) {
    this.items.push({
      ...item,
      dateEarned: new Date()
    });
  }

  updateStreak(completionDate) {
    if (!this.lastCompletedDate) {
      this.currentStreak = 1;
    } else {
      const lastDate = new Date(this.lastCompletedDate);
      const daysDiff = Math.floor((completionDate - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        this.currentStreak += 1;
      } else if (daysDiff > 1) {
        this.currentStreak = 1;
      }
    }

    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }
  }

  getCompletionRate(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentCompletions = this.completions.filter(c => new Date(c) >= cutoffDate);
    const recentFailures = this.failures.filter(f => new Date(f) >= cutoffDate);

    const total = recentCompletions.length + recentFailures.length;
    return total > 0 ? Math.floor((recentCompletions.length / total) * 100) : 0;
  }

  getStats() {
    const partialXP = this.partialCompletions.reduce((sum, p) => sum + p.xpEarned, 0);
    return {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      totalCompletions: this.totalCompletions,
      partialCompletions: this.partialCompletions.length,
      completionRate: this.getCompletionRate(),
      xpEarned: (this.totalCompletions * this.xpReward) + partialXP,
      xpLost: this.failures.length * this.xpPenalty,
      itemsEarned: this.items.length
    };
  }
}