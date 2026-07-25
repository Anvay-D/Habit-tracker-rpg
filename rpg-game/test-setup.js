import { GameService } from './src/services/GameService.js';

const game = new GameService();

// Create user
const user = game.createUser('Shadow Monarch');
console.log('Created user:', user.name, 'ID:', user.id);

// Create habits
const habits = [
  game.createHabit(user.id, 'Morning Run', 'Complete 5km run', 25, 10, 'daily'),
  game.createHabit(user.id, 'Read 30 mins', 'Read programming book', 15, 5, 'daily'),
  game.createHabit(user.id, 'Code Practice', 'Practice algorithms', 20, 8, 'daily'),
  game.createHabit(user.id, 'Gym Session', 'Weight training', 30, 12, 'daily'),
  game.createHabit(user.id, 'Meditation', '10 mins mindfulness', 10, 3, 'daily')
];

console.log('\nCreated habits:');
habits.forEach(h => console.log(`- ${h.name}: +${h.xpReward}XP / -${h.xpPenalty}XP`));

// Simulate some completions
console.log('\n--- Simulating activity ---');

// Complete some habits
habits.slice(0, 3).forEach(h => {
  const result = game.completeHabit(h.id);
  console.log(`Completed ${h.name}: +${result.xpGained}XP${result.leveledUp ? ' (LEVEL UP!)' : ''}`);
  if (result.newAchievements.length > 0) {
    console.log(`  Unlocked: ${result.newAchievements.map(a => a.name).join(', ')}`);
  }
});

// Fail one habit
const failResult = game.failHabit(habits[4].id);
console.log(`Failed ${habits[4].name}: -${failResult.xpLost}XP`);

// Get final stats
console.log('\n--- Final Stats ---');
const stats = game.getUserStats(user.id);
console.log('Level:', stats.user.level);
console.log('XP:', stats.user.xp, '/', stats.user.xpToNextLevel);
console.log('Total XP:', stats.user.totalXP);
console.log('Streak:', stats.user.streak);

console.log('\nHabits:');
stats.habits.forEach(h => {
  console.log(`- ${h.name}: Streak ${h.stats.currentStreak}, Rate ${h.stats.completionRate}%`);
});

console.log('\nUnlocked Achievements:');
stats.achievements.unlocked.forEach(a => {
  console.log(`- ${a.name}: +${a.xpReward}XP`);
});

console.log('\nLocked Achievements:', stats.achievements.locked.length);