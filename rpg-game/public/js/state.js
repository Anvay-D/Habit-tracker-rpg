// State Management
let currentUserId = null;
let journalEntries = [];
let nutritionChart = null;

export { currentUserId, journalEntries, nutritionChart };

export function setCurrentUserId(id) {
    currentUserId = id;
}

export function setJournalEntries(entries) {
    journalEntries = entries;
}

export function setNutritionChart(chart) {
    nutritionChart = chart;
}