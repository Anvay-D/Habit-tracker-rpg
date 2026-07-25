import express from 'express';
import { GameService } from './src/services/GameService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const gameService = new GameService();

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User routes
app.post('/api/users', (req, res) => {
  const { name } = req.body;
  const user = gameService.createUser(name);
  res.status(201).json({ userId: user.id, name: user.name });
});

app.get('/api/users/:userId', (req, res) => {
  const stats = gameService.getUserStats(req.params.userId);
  if (!stats) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(stats);
});

// Habit routes
app.post('/api/users/:userId/habits', (req, res) => {
  const { name, description, xpReward, xpPenalty, frequency } = req.body;
  const habit = gameService.createHabit(
    req.params.userId,
    name,
    description,
    xpReward || 10,
    xpPenalty || 5,
    frequency || 'daily'
  );
  res.status(201).json(habit);
});

app.get('/api/users/:userId/habits', (req, res) => {
  const habits = gameService.getUserHabits(req.params.userId);
  res.json(habits);
});

// Habit actions
app.post('/api/habits/:habitId/complete', (req, res) => {
  const { percentage } = req.body;
  const result = gameService.completeHabit(req.params.habitId, percentage || 100);
  if (!result) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  res.json(result);
});

app.post('/api/habits/:habitId/fail', (req, res) => {
  const result = gameService.failHabit(req.params.habitId);
  if (!result) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  res.json(result);
});

// Nutrition tracking
app.post('/api/users/:userId/nutrition', (req, res) => {
  const result = gameService.logNutrition(req.params.userId, req.body);
  if (!result) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(result);
});

app.get('/api/users/:userId/inventory', (req, res) => {
  const inventory = gameService.inventory.get(req.params.userId) || [];
  res.json(inventory);
});

// Food search API using Open Food Facts
app.get('/api/food/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    // Using Open Food Facts API (open source, no API key required)
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`
    );

    if (!response.ok) {
      throw new Error('Food search failed');
    }

    const data = await response.json();
    const foods = data.products.map(product => ({
      name: product.product_name || 'Unknown',
      brand: product.brands || '',
      calories: product.nutriments?.energy_100g || 0,
      protein: product.nutriments?.proteins_100g || 0,
      serving: product.serving_size || '100g'
    })).filter(food => food.calories > 0); // Only return items with nutrition data

    res.json(foods);
  } catch (error) {
    console.error('Food search error:', error);
    res.status(500).json({ error: 'Failed to search foods' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Solo Leveling RPG Server running on port ${PORT}`);
});