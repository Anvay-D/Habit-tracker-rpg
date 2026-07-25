import { query } from '../database/connection.js';

export class NutritionRepository {
  async logEntry(userId, data) {
    const { water = 0, calories = 0, protein = 0 } = data;
    const date = new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO nutrition_entries (id, user_id, entry_date, water, calories, protein)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      ON CONFLICT (user_id, entry_date)
      DO UPDATE SET water = $3, calories = $4, protein = $5
      RETURNING *
    `;

    const result = await query(sql, [userId, date, water, calories, protein]);
    return result.rows[0];
  }

  async getTodayStats(userId) {
    const date = new Date().toISOString().split('T')[0];
    const sql = 'SELECT * FROM nutrition_entries WHERE user_id = $1 AND entry_date = $2';
    const result = await query(sql, [userId, date]);
    return result.rows[0] || { water: 0, calories: 0, protein: 0 };
  }

  async getStats(userId, days = 7) {
    const sql = `
      SELECT
        AVG(water) as avg_water,
        AVG(calories) as avg_calories,
        AVG(protein) as avg_protein,
        COUNT(DISTINCT entry_date) as entry_count
      FROM nutrition_entries
      WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }
}