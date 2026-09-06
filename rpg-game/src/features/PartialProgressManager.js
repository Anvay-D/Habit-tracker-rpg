export class PartialProgressManager {
  constructor(gameService) {
    this.gameService = gameService;
  }

  // Record partial progress on a habit
  recordPartialProgress(habitId, percentage, date = new Date()) {
    const habit = this.gameService.habits.get(habitId);
    if (!habit) return null;

    const actualPercentage = Math.max(0, Math.min(100, percentage));
    const xpEarned = Math.floor((habit.xpReward * actualPercentage) / 100);

    // Record the partial completion
    habit.partialCompletions.push({
      date: new Date(date),
      percentage: actualPercentage,
      xpEarned,
      completed: actualPercentage >= 100
    });

    // Update streak if this is a new day
    habit.updateStreak(new Date(date));

    // Award XP to user
    const user = this.gameService.users.get(habit.userId);
    if (user) {
      const leveledUp = user.addXP(xpEarned);
      this.gameService.checkAchievements(habit.userId);
      return { xpEarned, leveledUp, percentage: actualPercentage };
    }

    return { xpEarned, percentage: actualPercentage };
  }

  // Get progress for a habit
  getHabitProgress(habitId) {
    const habit = this.gameService.habits.get(habitId);
    if (!habit) return null;

    const partialXP = habit.partialCompletions.reduce((sum, p) => sum + p.xpEarned, 0);
    const totalTargetXP = habit.xpReward * habit.partialCompletions.length;
    const averageProgress = habit.partialCompletions.length > 0
      ? habit.partialCompletions.reduce((sum, p) => sum + p.percentage, 0) / habit.partialCompletions.length
      : 0;

    return {
      currentProgress: averageProgress,
      totalPartialXP: partialXP,
      totalCompletions: habit.totalCompletions,
      partialCompletions: habit.partialCompletions,
      isFullyCompleted: habit.partialCompletions.some(p => p.completed)
    };
  }

  // Complete remaining progress for a partially completed habit
  completeRemainingProgress(habitId) {
    const habit = this.gameService.habits.get(habitId);
    if (!habit || habit.partialCompletions.length === 0) return null;

    // Find the most recent incomplete progress
    const incompleteProgress = habit.partialCompletions.find(p => !p.completed && p.percentage < 100);
    if (!incompleteProgress) return null;

    const remainingPercentage = 100 - incompleteProgress.percentage;
    const additionalXP = Math.floor((habit.xpReward * remainingPercentage) / 100);

    // Update the progress entry
    incompleteProgress.percentage = 100;
    incompleteProgress.xpEarned = habit.xpReward;
    incompleteProgress.completed = true;

    // Award remaining XP
    const user = this.gameService.users.get(habit.userId);
    if (user) {
      const leveledUp = user.addXP(additionalXP);
      habit.totalCompletions++;
      return { xpEarned: additionalXP, leveledUp, totalProgress: 100 };
    }

    return { xpEarned: additionalXP, totalProgress: 100 };
  }
}