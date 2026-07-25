import { v4 as uuidv4 } from 'uuid';

export class User {
  constructor(name) {
    this.id = uuidv4();
    this.name = name;
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;
    this.totalXP = 0;
    this.streak = 0;
    this.lastActiveDate = null;
    this.createdAt = new Date();
  }

  addXP(amount) {
    this.xp += amount;
    this.totalXP += amount;

    let leveledUp = false;
    while (this.xp >= this.xpToNextLevel) {
      this.levelUp();
      leveledUp = true;
    }

    return leveledUp;
  }

  subtractXP(amount) {
    this.xp = Math.max(0, this.xp - amount);
    return this.xp;
  }

  levelUp() {
    this.level += 1;
    this.xp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    return this.level;
  }

  updateStreak() {
    const today = new Date().toDateString();

    if (!this.lastActiveDate) {
      this.streak = 1;
    } else {
      const lastActive = new Date(this.lastActiveDate).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (lastActive === yesterday) {
        this.streak += 1;
      } else if (lastActive !== today) {
        this.streak = 1;
      }
    }

    this.lastActiveDate = new Date();
    return this.streak;
  }

  getProgress() {
    return {
      current: this.xp,
      required: this.xpToNextLevel,
      percentage: Math.floor((this.xp / this.xpToNextLevel) * 100)
    };
  }
}