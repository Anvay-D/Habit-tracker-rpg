// Nutrition tracking functions
import { currentUserId } from './state.js';
import { showNotification } from './notifications.js';
import { searchFood, logNutrition as apiLogNutrition, getUserStats } from './api.js';

export async function searchFoodHandler() {
    const query = document.getElementById('food-search').value.trim();
    if (!query) return;

    const resultsContainer = document.getElementById('food-results');
    resultsContainer.innerHTML = '<div>Searching...</div>';

    try {
        const foods = await searchFood(query);
        resultsContainer.innerHTML = '';

        if (foods.length === 0) {
            resultsContainer.innerHTML = '<div>No results found</div>';
            return;
        }

        foods.forEach(food => {
            const foodEl = document.createElement('div');
            foodEl.className = 'food-result';
            foodEl.innerHTML = `
                <div class="food-info">
                    <strong>${food.name}</strong> ${food.brand ? `(${food.brand})` : ''}
                    <span class="food-serving">${food.serving}</span>
                </div>
                <div class="food-nutrition">
                    ${food.calories} cal, ${food.protein}g protein
                </div>
                <button onclick="addFoodToLog(${food.calories}, ${food.protein})">Add</button>
            `;
            resultsContainer.appendChild(foodEl);
        });
    } catch (error) {
        console.error('Food search error:', error);
        resultsContainer.innerHTML = '<div>Search failed. Please try again.</div>';
    }
}

export function addFoodToLog(calories, protein) {
    const calInput = document.getElementById('calories-input');
    const protInput = document.getElementById('protein-input');

    calInput.value = (parseInt(calInput.value) || 0) + calories;
    protInput.value = (parseInt(protInput.value) || 0) + protein;

    document.getElementById('food-results').innerHTML = '';
    document.getElementById('food-search').value = '';

    logNutritionHandler();
}

export function quickAddWater(amount) {
    const waterInput = document.getElementById('water-input');
    waterInput.value = (parseInt(waterInput.value) || 0) + amount;
}

export async function logWaterOnly() {
    if (!currentUserId) return;

    const water = parseInt(document.getElementById('water-input').value) || 0;

    if (water === 0) {
        alert('Please enter water amount');
        return;
    }

    try {
        const result = await apiLogNutrition(currentUserId, { water, calories: 0, protein: 0 });
        alert(`Water logged! ${result.achievements.length > 0 ? 'Achievements: ' + result.achievements.join(', ') : ''}`);
        document.getElementById('water-input').value = '0';
        await loadUserData();
    } catch (error) {
        console.error('Error logging water:', error);
        showNotification('Failed to log water', true);
    }
}

export async function logNutritionHandler() {
    if (!currentUserId) return;

    const water = parseInt(document.getElementById('water-input').value) || 0;
    const calories = parseInt(document.getElementById('calories-input').value) || 0;
    const protein = parseInt(document.getElementById('protein-input').value) || 0;

    if (water === 0 && calories === 0 && protein === 0) {
        alert('Please enter at least one nutrition value');
        return;
    }

    try {
        const result = await apiLogNutrition(currentUserId, { water, calories, protein });
        alert(`Nutrition logged! ${result.achievements.length > 0 ? 'Achievements: ' + result.achievements.join(', ') : ''}`);

        // Reset inputs
        document.getElementById('water-input').value = '0';
        document.getElementById('calories-input').value = '0';
        document.getElementById('protein-input').value = '0';

        await loadUserData();
    } catch (error) {
        console.error('Error logging nutrition:', error);
        showNotification('Failed to log nutrition', true);
    }
}

export function updateNutritionDisplay(nutrition) {
    if (!nutrition) return;

    document.getElementById('today-water').textContent = `${nutrition.today.water}ml`;
    document.getElementById('today-calories').textContent = nutrition.today.calories;
    document.getElementById('today-protein').textContent = `${nutrition.today.protein}g`;
    document.getElementById('nutrition-streak').textContent = `${nutrition.stats.streak} days`;

    updateNutritionChart(nutrition);
}

let nutritionChart = null;

function updateNutritionChart(nutrition) {
    const canvas = document.getElementById('nutrition-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (nutritionChart) {
        nutritionChart.destroy();
    }

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const waterData = [2400, 2800, 2100, 3200, 2600, 3000, nutrition.today.water];
    const caloriesData = [1800, 2100, 1500, 2000, 1900, 2200, nutrition.today.calories];

    nutritionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Water (ml)',
                data: waterData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'Calories',
                data: caloriesData,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}