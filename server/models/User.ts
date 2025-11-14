import { db } from '../database/schema.js';

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export class UserModel {
  static findByTelegramId(telegramId: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    return stmt.get(telegramId) as User | undefined;
  }

  static findById(id: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static create(data: CreateUserData): User {
    const freeCredits = parseInt(process.env.FREE_CREDITS_NEW_USER || '1');

    const stmt = db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name, credits)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.telegram_id,
      data.username || null,
      data.first_name || null,
      data.last_name || null,
      freeCredits
    );

    // Log the free credits bonus
    if (freeCredits > 0) {
      const creditStmt = db.prepare(`
        INSERT INTO credit_transactions (user_id, amount, type, description)
        VALUES (?, ?, 'bonus', 'Welcome bonus')
      `);
      creditStmt.run(result.lastInsertRowid, freeCredits);
    }

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findOrCreate(data: CreateUserData): User {
    let user = this.findByTelegramId(data.telegram_id);

    if (!user) {
      user = this.create(data);
    } else {
      // Update user info if changed
      const stmt = db.prepare(`
        UPDATE users
        SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE telegram_id = ?
      `);
      stmt.run(
        data.username || null,
        data.first_name || null,
        data.last_name || null,
        data.telegram_id
      );
      user = this.findByTelegramId(data.telegram_id)!;
    }

    return user;
  }

  static addCredits(userId: number, amount: number, type: 'purchase' | 'bonus' | 'refund', description?: string): void {
    const updateStmt = db.prepare('UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(amount, userId);

    const logStmt = db.prepare(`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES (?, ?, ?, ?)
    `);
    logStmt.run(userId, amount, type, description || null);
  }

  static deductCredits(userId: number, amount: number, description?: string): boolean {
    const user = this.findById(userId);
    if (!user || user.credits < amount) {
      return false;
    }

    const updateStmt = db.prepare('UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(amount, userId);

    const logStmt = db.prepare(`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES (?, ?, 'generation', ?)
    `);
    logStmt.run(userId, -amount, description || null);

    return true;
  }

  static getCredits(userId: number): number {
    const user = this.findById(userId);
    return user?.credits || 0;
  }

  static getCreditHistory(userId: number, limit: number = 50) {
    const stmt = db.prepare(`
      SELECT * FROM credit_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }
}
