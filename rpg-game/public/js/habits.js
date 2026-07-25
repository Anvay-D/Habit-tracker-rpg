// Habit management functions
import { currentUserId } from './state.js';
import { showNotification } from './notifications.js';
import { createHabit, completeHabit, failHabit, getUserStats } from './api.js';

export async function createHabitHandler() {
    const name = document.getElementById('habit-name').value;
    const description = document.getElementById('habit-desc').value;
    const xpReward = parseInt(document.getElementById('habit-xp').value) || 10;
    const xpPenalty = parseInt(document.getElementById('habit-penalty').value) || 5;
    const targetValue = parseInt(document.getElementById('habit-target').value) || 100;

    if (!name) {
        alert('Please enter a skill name');
        return;
    }

    try {
        await createHabit(currentUserId, { name, description, xpReward, xpPenalty, frequency: 'daily', targetValue });

        // Clear form
        document.getElementById('habit-name').value = '';
        document.getElementById('habit-desc').value = '';
        document.getElementById('habit-xp').value = '10';
        document.getElementById('habit-penalty').value = '5';
        document.getElementById('habit-target').value = '100';

        await loadUserData();
        showNotification('Skill acquired!');
    } catch (error) {
        console.error('Error creating habit:', error);
        showNotification('Failed to create habit', true);
    }
}

export async function completeHabitHandler(habitId, percentage = 100) {
    try {
        const result = await completeHabit(habitId, percentage);
        const isLevelUp = result.leveledUp;
        await loadUserData();

        let message = `+${result.xpGained}XP`;
        if (result.leveledUp) {
            message += ' - LEVEL UP!';
            document.getElementById('player-level').classList.add('level-up');
            setTimeout(() => {
                document.getElementById('player-level').classList.remove('level-up');
            }, 1000);
        }
        if (result.newAchievements && result.newAchievements.length > 0) {
            message += ` | Unlocked: ${result.newAchievements.map(a => a.name).join(', ')}`;
            const achievementsContainer = document.getElementById('achievements-list');
            if (achievementsContainer) {
                achievementsContainer.classList.add('achievement-unlock');
                setTimeout(() => {
                    achievementsContainer.classList.remove('achievement-unlock');
                }, 500);
            }
        }
        if (result.itemsEarned && result.itemsEarned.length > 0) {
            message += ` | Items: ${result.itemsEarned.map(i => i.name).join(', ')}`;
        }
        showNotification(message);
    } catch (error) {
        console.error('Error completing habit:', error);
    }
}

export async function failHabitHandler(habitId) {
    try {
        const result = await failHabit(habitId);
        await loadUserData();
        showNotification(`-${result.xpLost}XP`, true);
    } catch (error) {
        console.error('Error failing habit:', error);
    }
}