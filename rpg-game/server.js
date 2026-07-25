import express from 'express';
import { GameService } from './src/services/GameService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const gameService = new GameService();

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
  const result = gameService.completeHabit(req.params.habitId);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Solo Leveling RPG Server running on port ${PORT}`);
});