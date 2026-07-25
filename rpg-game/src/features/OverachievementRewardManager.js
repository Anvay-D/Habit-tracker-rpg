export class OverachievementRewardManager {
  constructor(gameService) {
    this.gameService = gameService;
    this.overachievementMultiplier = 0.5; // 50% bonus XP for overachievement
    this.maxOverachievementPercent = 200; // Max 200% completion for rewards
    this.rewards = [
      { id: 'shadow_sword', name: 'Shadow Sword', rarity: 'common', minOverachievement: 110 },
      { id: 'shadow_shield', name: 'Shadow Shield', rarity: 'common', minOverachievement: 120 },
      { id: 'shadow_armor', name: 'Shadow Armor', rarity: 'uncommon', minOverachievement: 150 },
      { id: 'shadow_crown', name: 'Shadow Crown', rarity: 'rare', minOverachievement: 180 },
      { id: 'monarch_blessing', name: "Monarch's Blessing", rarity: 'epic', minOverachievement: 200 }
    ];
  }

  // Calculate overachievement rewards
  calculateOverachievement(habitId, completionPercentage) {
    const habit = this.gameService.habits.get(habitId);
    if (!habit) return null;

    if (completionPercentage <= 100) {
      return {
        bonusXP: 0,
        items: [],
        overachievementPercent: completionPercentage
      };
    }

    const cappedPercentage = Math.min(completionPercentage, this.maxOverachievementPercent);
    const overachievementPercent = cappedPercentage - 100;

    // Calculate bonus XP (proportional to overachievement)
    const bonusXP = Math.floor(
      (habit.xpReward * overachievementPercent / 100) * this.overachievementMultiplier
    );

    // Determine items based on overachievement level
    const items = this.determineRewardItems(overachievementPercent);

    return {
      bonusXP,
      items,
      overachievementPercent: cappedPercentage,
      baseXP: habit.xpReward
    };
  }

  // Determine which items to award based on overachievement
  determineRewardItems(overachievementPercent) {
    const eligibleRewards = this.rewards.filter(
      reward => overachievementPercent >= reward.minOverachievement
    );

    if (eligibleRewards.length === 0) return [];

    // Award one random eligible item
    const randomIndex = Math.floor(Math.random() * eligibleRewards.length);
    return [eligibleRewards[randomIndex]];
  }

  // Process overachievement completion
  processOverachievement(habitId, completionPercentage) {
    const habit = this.gameService.habits.get(habitId);
    if (!habit) return null;

    const overachievement = this.calculateOverachievement(habitId, completionPercentage);
    if (!overachievement || overachievement.bonusXP === 0) return null;

    // Award bonus XP
    const user = this.gameService.users.get(habit.userId);
    let leveledUp = false;
    if (user) {
      leveledUp = user.addXP(overachievement.bonusXP);
    }

    // Award items to habit
    overachievement.items.forEach(item => {
      habit.addItem(item);
    });

    return {
      ...overachievement,
      leveledUp,
      message: this.generateOverachievementMessage(overachievement)
    };
  }

  generateOverachievementMessage(overachievement) {
    const { overachievementPercent, bonusXP, items } = overachievement;

    let message = `Overachieved by ${overachievementPercent}%! +${bonusXP} bonus XP`;

    if (items.length > 0) {
      const itemNames = items.map(i => i.name).join(', ');
      message += ` | Earned: ${itemNames}`;
    }

    return message;
  }

  // Check for abuse prevention
  validateOverachievement(habitId, completionPercentage, userId) {
    const habit = this.gameService.habits.get(habitId);
    if (!habit) return { valid: false, reason: 'Habit not found' };

    if (completionPercentage > this.maxOverachievementPercent) {
      return {
        valid: false,
        reason: `Maximum overachievement is ${this.maxOverachievementPercent}%`
      };
    }

    // Check if user has completed this habit today already
    const today = new Date().toDateString();
    const todayCompletions = habit.partialCompletions.filter(
      p => new Date(p.date).toDateString() === today
    );

    if (todayCompletions.length >= 3) {
      return {
        valid: false,
        reason: 'Maximum 3 completions per day to prevent abuse'
      };
    }

    return { valid: true };
  }
}