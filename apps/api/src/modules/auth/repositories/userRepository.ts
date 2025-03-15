import { User, Session } from '../models/schemas';
import { Env } from '../../../types';
import { generateUUID } from '../../../utils/utils';
import { IUserRepository } from '../services/interfaces';

export class UserRepository implements IUserRepository {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM User WHERE email = ?'
    ).bind(email.toLowerCase());

    const result = await stmt.first();
    return result as User | null;
  }

  async getUserById(id: string): Promise<User | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM User WHERE id = ?'
    ).bind(id);

    const result = await stmt.first();
    return result as User | null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = Date.now();
    const id = generateUUID();

    const stmt = this.db.prepare(`
      INSERT INTO User (id, email, name, passwordHash, createdAt, updatedAt, lockedAt, emailVerified, failedAttempts) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.email.toLowerCase(),
      user.name,
      user.passwordHash,
      now,
      now,
      null,
      user.emailVerified || 0,
      user.failedAttempts || 0
    );

    await stmt.run();
    
    return {
      id,
      email: user.email.toLowerCase(),
      name: user.name,
      passwordHash: user.passwordHash,
      createdAt: now,
      updatedAt: now,
      lockedAt: null,
      emailVerified: user.emailVerified || 0,
      failedAttempts: user.failedAttempts || 0
    };
  }

  async lockAccount(userId: string): Promise<void> {
    const now = Date.now();
    await this.db.prepare(`
      UPDATE User 
      SET lockedAt = ?
      WHERE id = ? AND lockedAt IS NULL
    `).bind(now, userId).run();
  }

  async unlockAccount(userId: string): Promise<void> {
    await this.db.prepare(`
      UPDATE User 
      SET lockedAt = NULL
      WHERE id = ?
    `).bind(userId).run();
  }

  async incrementFailedAttempts(userId: string): Promise<number> {
    const result = await this.db.prepare(`
      UPDATE User 
      SET failedAttempts = failedAttempts + 1
      WHERE id = ?
      RETURNING failedAttempts
    `).bind(userId).first();

    return result ? Number(result.failedAttempts) : 0;
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.db.prepare(`
      UPDATE User 
      SET failedAttempts = 0
      WHERE id = ?
    `).bind(userId).run();
  }

  async createSession(userId: string, expiresInSeconds: number = 60 * 60 * 24 * 7): Promise<Session> {
    const id = generateUUID();
    const now = Date.now();
    const expiresAt = now + (expiresInSeconds * 1000);

    const stmt = this.db.prepare(`
      INSERT INTO Session (id, userId, expiresAt, createdAt)
      VALUES (?, ?, ?, ?)
    `).bind(
      id,
      userId,
      expiresAt,
      now
    );

    await stmt.run();

    return {
      id,
      userId: userId,
      expiresAt: expiresAt,
      createdAt: now
    };
  }

  async getSessionById(id: string): Promise<Session | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM Session WHERE id = ?'
    ).bind(id);

    const result = await stmt.first();
    return result as Session | null;
  }

  async deleteSession(id: string): Promise<void> {
    const stmt = this.db.prepare(
      'DELETE FROM Session WHERE id = ?'
    ).bind(id);

    await stmt.run();
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = Date.now();
    const stmt = this.db.prepare(
      'DELETE FROM Session WHERE expiresAt < ?'
    ).bind(now);
    
    await stmt.run();
  }
}