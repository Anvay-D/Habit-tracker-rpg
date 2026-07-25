// Partial Progress Management Module
const PartialProgress = {
  // Show progress input for a habit
  showProgressInput(habitId, habitName, currentXP) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Record Progress: ${habitName}</h3>
        <div class="progress-input">
          <label>Completion Percentage: <span id="progress-value">100</span>%</label>
          <input type="range" id="progress-slider" min="0" max="200" value="100" step="5">
          <div class="progress-labels">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
            <span>150%</span>
            <span>200%</span>
          </div>
        </div>
        <div class="xp-preview">
          <p>XP to earn: <span id="xp-preview">${currentXP}</span> XP</p>
          <p id="overachievement-notice" style="display:none; color: #ffd700;">Bonus XP available for overachievement!</p>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn-complete" onclick="PartialProgress.submitProgress('${habitId}', this)">Submit</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup slider handler
    const slider = modal.querySelector('#progress-slider');
    const valueDisplay = modal.querySelector('#progress-value');
    const xpPreview = modal.querySelector('#xp-preview');
    const notice = modal.querySelector('#overachievement-notice');

    slider.oninput = () => {
      const percentage = parseInt(slider.value);
      valueDisplay.textContent = percentage;
      const xp = Math.floor((currentXP * percentage) / 100);
      xpPreview.textContent = xp;

      if (percentage > 100) {
        notice.style.display = 'block';
      } else {
        notice.style.display = 'none';
      }
    };
  },

  // Submit progress to server
  async submitProgress(habitId, button) {
    const modal = button.closest('.modal');
    const percentage = parseInt(modal.querySelector('#progress-slider').value);

    try {
      const response = await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
      });

      if (response.ok) {
        const result = await response.json();
        modal.remove();

        // Show notification with bonus info
        let message = `+${result.xpGained}XP`;
        if (result.itemsEarned && result.itemsEarned.length > 0) {
          message += ` | Earned: ${result.itemsEarned.map(i => i.name).join(', ')}`;
        }
        if (result.leveledUp) {
          message += ' - LEVEL UP!';
        }
        window.showNotification(message);

        // Reload data
        await window.loadUserData();
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      window.showNotification('Failed to submit progress', true);
    }
  }
};

// Make it globally available
window.PartialProgress = PartialProgress;