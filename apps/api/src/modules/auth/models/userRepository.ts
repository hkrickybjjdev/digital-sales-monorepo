import { nanoid } from 'nanoid';
import { User, Session } from './types';
import { Env } from '../../../types';

export class UserRepository {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase());

    const result = await stmt.first();
    return result as User | null;
  }

  async getUserById(id: string): Promise<User | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id);

    const result = await stmt.first();
    return result as User | null;
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const now = Date.now();
    const id = nanoid();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at, updated_at, stripe_account) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.email.toLowerCase(),
      user.name,
      user.password_hash,
      now,
      now,
      user.stripe_account || null
    );

    await stmt.run();
    
    return {
      id,
      email: user.email.toLowerCase(),
      name: user.name,
      password_hash: user.password_hash,
      created_at: now,
      updated_at: now,
      stripe_account: user.stripe_account || null
    };
  }

  async createSession(userId: string, expiresInSeconds: number = 60 * 60 * 24 * 7): Promise<Session> {
    const id = nanoid();
    const now = Date.now();
    const expiresAt = now + (expiresInSeconds * 1000);

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
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
      user_id: userId,
      expires_at: expiresAt,
      created_at: now
    };
  }

  async getSessionById(id: string): Promise<Session | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM sessions WHERE id = ?'
    ).bind(id);

    const result = await stmt.first();
    return result as Session | null;
  }

  async deleteSession(id: string): Promise<void> {
    const stmt = this.db.prepare(
      'DELETE FROM sessions WHERE id = ?'
    ).bind(id);

    await stmt.run();
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = Date.now();
    const stmt = this.db.prepare(
      'DELETE FROM sessions WHERE expires_at < ?'
    ).bind(now);

    await stmt.run();
  }
}