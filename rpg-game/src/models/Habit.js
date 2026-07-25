import { v4 as uuidv4 } from 'uuid';

export class Habit {
  constructor(userId, name, description, xpReward, xpPenalty, frequency = 'daily') {
    this.id = uuidv4();
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.xpReward = xpReward;
    this.xpPenalty = xpPenalty;
    this.frequency = frequency; // daily, weekly, custom
    this.isActive = true;
    this.completions = [];
    this.failures = [];
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.totalCompletions = 0;
    this.createdAt = new Date();
    this.lastCompletedDate = null;
  }

  complete(date = new Date()) {
    const completionDate = new Date(date);
    this.completions.push(completionDate);
    this.totalCompletions += 1;
    this.lastCompletedDate = completionDate;
    this.updateStreak(completionDate);
    return this.xpReward;
  }

  fail(date = new Date()) {
    this.failures.push(new Date(date));
    this.currentStreak = 0;
    return this.xpPenalty;
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
    return {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      totalCompletions: this.totalCompletions,
      completionRate: this.getCompletionRate(),
      xpEarned: this.totalCompletions * this.xpReward,
      xpLost: this.failures.length * this.xpPenalty
    };
  }
}