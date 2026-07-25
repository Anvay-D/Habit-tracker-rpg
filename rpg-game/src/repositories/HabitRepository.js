import { query } from '../database/connection.js';
import { Habit } from '../models/Habit.js';
import { randomUUID } from 'crypto';

export class HabitRepository {
  async create(userId, name, description, xpReward, xpPenalty, frequency, targetValue = 100) {
    const habit = new Habit(userId, name, description, xpReward, xpPenalty, frequency, targetValue);
    const sql = `
      INSERT INTO habits (id, user_id, name, description, xp_reward, xp_penalty,
                          frequency, target_value, current_streak, best_streak,
                          total_completions, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      habit.id, habit.userId, habit.name, habit.description,
      habit.xpReward, habit.xpPenalty, habit.frequency, habit.targetValue,
      habit.currentStreak, habit.bestStreak, habit.totalCompletions, habit.createdAt
    ];
    const result = await query(sql, values);
    return this.mapToModel(result.rows[0]);
  }

  async findById(id) {
    const sql = 'SELECT * FROM habits WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] ? this.mapToModel(result.rows[0]) : null;
  }

  async findByUserId(userId) {
    const sql = 'SELECT * FROM habits WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC';
    const result = await query(sql, [userId]);
    return result.rows.map(row => this.mapToModel(row));
  }

  async update(habit) {
    const sql = `
      UPDATE habits
      SET current_streak = $2, best_streak = $3, total_completions = $4,
          last_completed_date = $5, is_active = $6
      WHERE id = $1
    `;
    await query(sql, [
      habit.id, habit.currentStreak, habit.bestStreak,
      habit.totalCompletions, habit.lastCompletedDate, habit.isActive
    ]);
    return habit;
  }

  async recordCompletion(habitId, percentage, xpEarned, date) {
    const completionId = crypto.randomUUID();
    const sql = `
      INSERT INTO habit_completions (id, habit_id, completion_date, percentage, xp_earned)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (habit_id, completion_date)
      DO UPDATE SET percentage = $4, xp_earned = $5
    `;
    await query(sql, [completionId, habitId, date, percentage, xpEarned]);
  }

  async recordFailure(habitId, xpLost, date) {
    const failureId = crypto.randomUUID();
    await query(
      'INSERT INTO habit_failures (id, habit_id, failure_date, xp_lost) VALUES ($1, $2, $3, $4)',
      [failureId, habitId, date, xpLost]
    );
  }

  async getCompletions(habitId, days = 30) {
    const sql = `
      SELECT * FROM habit_completions
      WHERE habit_id = $1 AND completion_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY completion_date DESC
    `;
    const result = await query(sql, [habitId]);
    return result.rows;
  }

  mapToModel(row) {
    const habit = new Habit(
      row.user_id, row.name, row.description, row.xp_reward,
      row.xp_penalty, row.frequency, row.target_value
    );
    habit.id = row.id;
    habit.isActive = row.is_active;
    habit.currentStreak = row.current_streak;
    habit.bestStreak = row.best_streak;
    habit.totalCompletions = row.total_completions;
    habit.lastCompletedDate = row.last_completed_date;
    habit.createdAt = row.created_at;
    return habit;
  }
}