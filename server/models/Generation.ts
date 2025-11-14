import { db } from '../database/schema.js';

export interface Generation {
  id: number;
  user_id: number;
  image_path: string;
  video_path?: string;
  keywords?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  kling_task_id?: string;
  error_message?: string;
  credits_spent: number;
  created_at: string;
  completed_at?: string;
}

export interface CreateGenerationData {
  user_id: number;
  image_path: string;
  keywords?: string;
  credits_spent: number;
}

export class GenerationModel {
  static create(data: CreateGenerationData): Generation {
    const stmt = db.prepare(`
      INSERT INTO generations (user_id, image_path, keywords, credits_spent, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      data.user_id,
      data.image_path,
      data.keywords || null,
      data.credits_spent
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): Generation | undefined {
    const stmt = db.prepare('SELECT * FROM generations WHERE id = ?');
    return stmt.get(id) as Generation | undefined;
  }

  static findByUserId(userId: number, limit: number = 50) {
    const stmt = db.prepare(`
      SELECT * FROM generations
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit) as Generation[];
  }

  static updateStatus(
    id: number,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    data?: {
      video_path?: string;
      kling_task_id?: string;
      error_message?: string;
    }
  ): void {
    let query = 'UPDATE generations SET status = ?';
    const params: any[] = [status];

    if (data?.video_path) {
      query += ', video_path = ?';
      params.push(data.video_path);
    }

    if (data?.kling_task_id) {
      query += ', kling_task_id = ?';
      params.push(data.kling_task_id);
    }

    if (data?.error_message) {
      query += ', error_message = ?';
      params.push(data.error_message);
    }

    if (status === 'completed' || status === 'failed') {
      query += ', completed_at = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = ?';
    params.push(id);

    const stmt = db.prepare(query);
    stmt.run(...params);
  }

  static getPendingGenerations() {
    const stmt = db.prepare(`
      SELECT * FROM generations
      WHERE status IN ('pending', 'processing')
      ORDER BY created_at ASC
    `);
    return stmt.all() as Generation[];
  }

  static getStats(userId: number) {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM generations
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }
}
