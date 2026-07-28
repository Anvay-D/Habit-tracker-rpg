// API Client
const API_BASE = '/api';

export async function createUser(name) {
    const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
}

export async function getUserStats(userId) {
    const response = await fetch(`${API_BASE}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to get user stats');
    return response.json();
}

export async function createHabit(userId, habitData) {
    const response = await fetch(`${API_BASE}/users/${userId}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData)
    });
    if (!response.ok) throw new Error('Failed to create habit');
    return response.json();
}

export async function getUserHabits(userId) {
    const response = await fetch(`${API_BASE}/users/${userId}/habits`);
    if (!response.ok) throw new Error('Failed to get habits');
    return response.json();
}

export async function completeHabit(habitId, percentage = 100) {
    const response = await fetch(`${API_BASE}/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
    });
    if (!response.ok) throw new Error('Failed to complete habit');
    return response.json();
}

export async function failHabit(habitId) {
    const response = await fetch(`${API_BASE}/habits/${habitId}/fail`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to fail habit');
    return response.json();
}

export async function searchFood(query) {
    const response = await fetch(`${API_BASE}/food/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Food search failed');
    return response.json();
}

export async function logNutrition(userId, nutritionData) {
    const response = await fetch(`${API_BASE}/users/${userId}/nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutritionData)
    });
    if (!response.ok) throw new Error('Failed to log nutrition');
    return response.json();
}

export async function getInventory(userId) {
    const response = await fetch(`${API_BASE}/users/${userId}/inventory`);
    if (!response.ok) throw new Error('Failed to get inventory');
    return response.json();
}