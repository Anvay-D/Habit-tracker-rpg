let currentUserId = null;
let journalEntries = [];

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons and tabs
            navBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

            // Add active to clicked button and corresponding tab
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

async function init() {
    initNavigation();

    // Create default user if none exists
    const userData = localStorage.getItem('userId');
    if (!userData) {
        await createNewUser();
    } else {
        currentUserId = JSON.parse(userData);
        // Load journal entries from localStorage
        const savedJournal = localStorage.getItem('journal');
        if (savedJournal) {
            journalEntries = JSON.parse(savedJournal);
        }
        await loadUserData();
    }
}

async function createNewUser() {
    const name = prompt('Enter your name:', 'Hunter');
    if (!name) return;

    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });

    const data = await response.json();
    currentUserId = data.userId;
    localStorage.setItem('userId', JSON.stringify(currentUserId));
    await loadUserData();
}

async function loadUserData() {
    if (!currentUserId) return;

    try {
        const response = await fetch(`/api/users/${currentUserId}`);
        const data = await response.json();

        // Update player info
        document.getElementById('player-name').textContent = data.user.name;
        document.getElementById('player-level').textContent = data.user.level;
        document.getElementById('player-streak').textContent = `${data.user.streak} days`;

        // Update XP bar
        const progress = data.user.progress;
        document.getElementById('xp-bar').style.width = `${progress.percentage}%`;
        document.getElementById('xp-text').textContent = `${data.user.xp}/${data.user.xpToNextLevel}`;

        // Update summary stats
        document.getElementById('total-xp').textContent = data.user.totalXP;
        document.getElementById('habits-count').textContent = data.habits.length;
        document.getElementById('achievements-count').textContent = data.achievements.unlocked.length;

        // Calculate average completion rate
        const rates = data.habits.map(h => h.stats.completionRate);
        const avgRate = rates.length > 0 ? Math.floor(rates.reduce((a, b) => a + b) / rates.length) : 0;
        document.getElementById('completion-rate').textContent = `${avgRate}%`;

        // Load habits
        renderHabits(data.habits);

        // Load achievements
        renderAchievements(data.achievements);

    } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('userId');
        location.reload();
    }
}

function renderHabits(habits) {
    const container = document.getElementById('habits-list');
    container.innerHTML = '';

    if (habits.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No skills acquired yet. Start building your arsenal!</p>';
        return;
    }

    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.innerHTML = `
            <div class="habit-info">
                <h3>${habit.name}</h3>
                <p>${habit.description}</p>
                <div class="unlock-date">Quest Rate: ${habit.stats.completionRate}%</div>
            </div>
            <div class="habit-stats">
                <span class="xp-badge">+${habit.xpReward}XP / -${habit.xpPenalty}XP</span>
                <span class="streak-badge">🔥 ${habit.stats.currentStreak} streak</span>
            </div>
            <div class="habit-actions">
                <button class="btn-complete" onclick="completeHabit('${habit.id}')">COMPLETE</button>
                <button class="btn-fail" onclick="failHabit('${habit.id}')">FAIL</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderAchievements(achievements) {
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';

    // Show unlocked achievements first
    achievements.unlocked.forEach(achievement => {
        const card = createAchievementCard(achievement, true);
        container.appendChild(card);
    });

    // Show locked achievements
    achievements.locked.forEach(achievement => {
        const card = createAchievementCard(achievement, false);
        container.appendChild(card);
    });
}

function createAchievementCard(achievement, unlocked) {
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? 'unlocked' : ''}`;

    let content = `
        <div class="achievement-info">
            <h3>${unlocked ? '★' : '☆'} ${achievement.name}</h3>
            <p>${achievement.description}</p>
    `;

    if (unlocked && achievement.unlockedAt) {
        content += `<div class="unlock-date">Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}</div>`;
    }

    if (!unlocked && achievement.requirements) {
        const req = achievement.requirements;
        let reqText = '';
        switch(req.type) {
            case 'level': reqText = `Reach level ${req.value}`; break;
            case 'total_xp': reqText = `Earn ${req.value} total XP`; break;
            case 'streak': reqText = `Maintain ${req.value}-day streak`; break;
            case 'habit_completions': reqText = `Complete habit ${req.value} times`; break;
            case 'habit_streak': reqText = `Achieve ${req.value}-streak on habit`; break;
            case 'habits_count': reqText = `Create ${req.value} habits`; break;
        }
        content += `<div class="unlock-date">Requirement: ${reqText}</div>`;
    }

    content += `</div>`;

    if (unlocked) {
        content += `<span class="achievement-xp">+${achievement.xpReward}XP</span>`;
    }

    card.innerHTML = content;
    return card;
}

async function createHabit() {
    const name = document.getElementById('habit-name').value;
    const description = document.getElementById('habit-desc').value;
    const xpReward = parseInt(document.getElementById('habit-xp').value) || 10;
    const xpPenalty = parseInt(document.getElementById('habit-penalty').value) || 5;

    if (!name) {
        alert('Please enter a skill name');
        return;
    }

    try {
        const response = await fetch(`/api/users/${currentUserId}/habits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, xpReward, xpPenalty })
        });

        if (response.ok) {
            // Clear form
            document.getElementById('habit-name').value = '';
            document.getElementById('habit-desc').value = '';
            document.getElementById('habit-xp').value = '10';
            document.getElementById('habit-penalty').value = '5';

            // Reload data
            await loadUserData();
            showNotification('Skill acquired!');
        }
    } catch (error) {
        console.error('Error creating habit:', error);
    }
}

async function completeHabit(habitId) {
    try {
        const response = await fetch(`/api/habits/${habitId}/complete`, {
            method: 'POST'
        });
        const result = await response.json();

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
            result.newAchievements.forEach(() => {
                const achievementsContainer = document.getElementById('achievements-list');
                if (achievementsContainer) {
                    achievementsContainer.classList.add('achievement-unlock');
                    setTimeout(() => {
                        achievementsContainer.classList.remove('achievement-unlock');
                    }, 500);
                }
            });
        }
        showNotification(message);
    } catch (error) {
        console.error('Error completing habit:', error);
    }
}

async function failHabit(habitId) {
    try {
        const response = await fetch(`/api/habits/${habitId}/fail`, {
            method: 'POST'
        });
        const result = await response.json();

        await loadUserData();
        showNotification(`-${result.xpLost}XP`, true);
    } catch (error) {
        console.error('Error failing habit:', error);
    }
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.borderColor = isError ? '#dc3545' : '#ffd700';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function addJournalEntry() {
    const title = document.getElementById('journal-title').value;
    const content = document.getElementById('journal-content').value;

    if (!title || !content) {
        showNotification('Please enter both title and content', true);
        return;
    }

    const entry = {
        id: Date.now(),
        title: title,
        content: content,
        date: new Date().toISOString()
    };

    journalEntries.unshift(entry);
    localStorage.setItem('journal', JSON.stringify(journalEntries));

    // Clear form
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-content').value = '';

    // Refresh journal display
    renderJournalEntries();
    showNotification('Journal entry logged');
}

function renderJournalEntries() {
    const container = document.getElementById('journal-entries');
    if (!container) return;

    container.innerHTML = '';

    if (journalEntries.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No journal entries yet. Start logging your progress!</p>';
        return;
    }

    journalEntries.forEach(entry => {
        const entryEl = document.createElement('div');
        entryEl.className = 'journal-entry';
        entryEl.innerHTML = `
            <h3>${entry.title}</h3>
            <p>${entry.content}</p>
            <div class="entry-date">${new Date(entry.date).toLocaleDateString()} ${new Date(entry.date).toLocaleTimeString()}</div>
        `;
        container.appendChild(entryEl);
    });
}

// Override loadUserData to also render journal
const originalLoadUserData = window.loadUserData || function() {};
window.loadUserData = async function() {
    await originalLoadUserData.call(this);
    // Render journal entries when data loads
    setTimeout(renderJournalEntries, 100);
};

// Initialize on page load
window.onload = init;