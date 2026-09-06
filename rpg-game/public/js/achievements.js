// Achievement model (domain logic)
import { Achievement as AchievementModel } from './models/Achievement.js';

// Achievements Module
const Achievements = {
  // Render achievements with progress indicators
  renderAchievements(achievements, containerId = 'achievements-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    // Show unlocked achievements first
    if (achievements.unlocked && achievements.unlocked.length > 0) {
      const unlockedHeader = document.createElement('h3');
      unlockedHeader.textContent = 'Unlocked Achievements';
      unlockedHeader.className = 'section-header';
      container.appendChild(unlockedHeader);

      achievements.unlocked.forEach(achievement => {
        const card = this.createAchievementCard(achievement, true);
        container.appendChild(card);
      });
    }

    // Show locked achievements with progress
    if (achievements.locked && achievements.locked.length > 0) {
      const lockedHeader = document.createElement('h3');
      lockedHeader.textContent = 'Locked Achievements';
      lockedHeader.className = 'section-header';
      container.appendChild(lockedHeader);

      achievements.locked.forEach(achievement => {
        const card = this.createAchievementCard(achievement, false);
        container.appendChild(card);
      });
    }
  },

  // Create achievement card with progress
  createAchievementCard(achievement, unlocked) {
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;

    let html = `
      <div class="achievement-info">
        <h3>${unlocked ? '★' : '☆'} ${achievement.name}</h3>
        <p>${achievement.description}</p>
    `;

    if (unlocked && achievement.unlockedAt) {
      html += `<div class="unlock-date">Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}</div>`;
    }

    // Show requirements and progress for locked achievements
    if (!unlocked && achievement.requirements) {
      const req = achievement.requirements;
      let reqText = this.getRequirementText(req);
      html += `<div class="unlock-date">Requirement: ${reqText}</div>`;

      // Add progress bar if we have current value
      if (achievement.currentValue !== undefined) {
        const progress = Math.min(100, (achievement.currentValue / req.value) * 100);
        html += `
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${achievement.currentValue}/${req.value}</span>
          </div>
        `;
      }
    }

    html += `</div>`;

    if (unlocked) {
      html += `<span class="achievement-xp">+${achievement.xpReward}XP</span>`;
    }

    card.innerHTML = html;
    return card;
  },

  // Get human-readable requirement text
  getRequirementText(req) {
    switch(req.type) {
      case 'level': return `Reach level ${req.value}`;
      case 'total_xp': return `Earn ${req.value} total XP`;
      case 'streak': return `Maintain ${req.value}-day streak`;
      case 'habit_completions': return `Complete ${req.value} habits`;
      case 'habit_streak': return `Achieve ${req.value}-streak on habit`;
      case 'habits_count': return `Create ${req.value} habits`;
      case 'hydration': return `Drink ${req.value}ml water in a day`;
      case 'nutrition': return `Log ${req.value.calories} cal and ${req.value.protein}g protein`;
      default: return 'Complete the requirement';
    }
  },

  // Load and update achievements with current progress
  async loadAchievements(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      // Update achievements with current values for progress display
      if (data.achievements.locked) {
        data.achievements.locked = data.achievements.locked.map(achievement => {
          const currentValue = this.getCurrentValue(achievement.requirements, data);
          return { ...achievement, currentValue };
        });
      }

      return data.achievements;
    } catch (error) {
      console.error('Error loading achievements:', error);
      return { unlocked: [], locked: [] };
    }
  },

  // Get current value for achievement progress
  getCurrentValue(requirements, userData) {
    if (!requirements) return 0;

    // Use Achievement model for unified requirement validation
    const model = new AchievementModel(requirements.name, requirements.description, requirements.xpReward, requirements);
    return model.getCurrentValue(requirements, userData);
  }
};

// Make globally available
window.Achievements = Achievements;