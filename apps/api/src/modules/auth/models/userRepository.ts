import { nanoid } from 'nanoid';
import { User, Session } from './types';
import { Env } from '../../../types';
import { v7 as uuidv7 } from 'uuid';

export class UserRepository {
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
    const id = uuidv7();

    const stmt = this.db.prepare(`
      INSERT INTO User (id, email, name, passwordHash, createdAt, updatedAt, stripeAccount) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.email.toLowerCase(),
      user.name,
      user.passwordHash,
      now,
      now,
      user.stripeAccount || null
    );

    await stmt.run();
    
    return {
      id,
      email: user.email.toLowerCase(),
      name: user.name,
      passwordHash: user.passwordHash,
      createdAt: now,
      updatedAt: now,
      stripeAccount: user.stripeAccount || null
    };
  }

  async createSession(userId: string, expiresInSeconds: number = 60 * 60 * 24 * 7): Promise<Session> {
    const id = uuidv7();
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