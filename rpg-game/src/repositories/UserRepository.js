import { query } from '../database/connection.js';
import { User } from '../models/User.js';

export class UserRepository {
  async create(name) {
    const user = new User(name);
    const sql = `
      INSERT INTO users (id, name, level, xp, xp_to_next_level, total_xp, streak, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      user.id, user.name, user.level, user.xp,
      user.xpToNextLevel, user.totalXP, user.streak, user.createdAt
    ];
    const result = await query(sql, values);
    return this.mapToModel(result.rows[0]);
  }

  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToModel(result.rows[0]) : null;
  }

  async update(user) {
    const sql = `
      UPDATE users
      SET level = $2, xp = $3, xp_to_next_level = $4, total_xp = $5,
          streak = $6, last_active_date = $7
      WHERE id = $1
    `;
    await query(sql, [
      user.id, user.level, user.xp, user.xpToNextLevel,
      user.totalXP, user.streak, user.lastActiveDate
    ]);
    return user;
  }

  async getStats(userId) {
    const user = await this.findById(userId);
    if (!user) return null;

    const titleQuery = `SELECT get_title($1) as title`;
    // Fallback title calculation since function may not exist
    const title = this.calculateTitle(user.totalXP);

    const itemCount = await query(
      'SELECT COUNT(*) as count FROM inventory WHERE user_id = $1',
      [userId]
    );

    return {
      user,
      title,
      itemCount: parseInt(itemCount.rows[0].count),
      achievements: []
    };
  }

  calculateTitle(totalXP) {
    const titles = [
      { name: 'E-Rank Hunter', min: 0 },
      { name: 'D-Rank Hunter', min: 500 },
      { name: 'C-Rank Hunter', min: 1500 },
      { name: 'B-Rank Hunter', min: 3500 },
      { name: 'A-Rank Hunter', min: 6000 },
      { name: 'S-Rank Hunter', min: 10000 },
      { name: 'Shadow Monarch', min: 20000 },
      { name: 'King of the Dead', min: 35000 }
    ];

    for (let i = titles.length - 1; i >= 0; i--) {
      if (totalXP >= titles[i].min) return titles[i].name;
    }
    return titles[0].name;
  }

  mapToModel(row) {
    const user = new User(row.name);
    user.id = row.id;
    user.level = row.level;
    user.xp = row.xp;
    user.xpToNextLevel = row.xp_to_next_level;
    user.totalXP = row.total_xp;
    user.streak = row.streak;
    user.lastActiveDate = row.last_active_date;
    user.createdAt = row.created_at;
    return user;
  }
}