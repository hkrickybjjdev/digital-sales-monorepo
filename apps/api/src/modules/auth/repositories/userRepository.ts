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
  
  async getUserByActivationToken(token: string): Promise<User | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM User WHERE activationToken = ? AND activationTokenExpiresAt > ?'
    ).bind(token, Date.now());

    const result = await stmt.first();
    return result as User | null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = Date.now();
    const id = generateUUID();

    const stmt = this.db.prepare(`
      INSERT INTO User (id, email, name, passwordHash, createdAt, updatedAt, lockedAt, emailVerified, failedAttempts, activationToken, activationTokenExpiresAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.email.toLowerCase(),
      user.name,
      user.passwordHash,
      now,
      now,
      null,
      user.emailVerified || 0,
      user.failedAttempts || 0,
      user.activationToken || null,
      user.activationTokenExpiresAt || null
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
      failedAttempts: user.failedAttempts || 0,
      activationToken: user.activationToken || null,
      activationTokenExpiresAt: user.activationTokenExpiresAt || null
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
  
  async activateUser(userId: string): Promise<void> {
    const now = Date.now();
    await this.db.prepare(`
      UPDATE User 
      SET emailVerified = 1, 
          activationToken = NULL, 
          activationTokenExpiresAt = NULL,
          updatedAt = ?
      WHERE id = ?
    `).bind(now, userId).run();
  }
  
  async setActivationToken(userId: string, token: string, expiresAt: number): Promise<void> {
    const now = Date.now();
    await this.db.prepare(`
      UPDATE User 
      SET activationToken = ?, 
          activationTokenExpiresAt = ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(token, expiresAt, now, userId).run();
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

  async updateUser(userId: string, data: { name?: string; email?: string }): Promise<User | null> {
    // First, check if the user exists
    const user = await this.getUserById(userId);
    if (!user) {
      return null;
    }

    // Build the update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      values.push(data.name);
    }

    if (data.email !== undefined) {
      updateFields.push('email = ?');
      values.push(data.email.toLowerCase());
    }

    // Add updatedAt to the fields to update
    updateFields.push('updatedAt = ?');
    values.push(Date.now());

    // Add userId as the last value for the WHERE clause
    values.push(userId);

    // If no fields to update, return the existing user
    if (updateFields.length === 0) {
      return user;
    }

    // Execute the update query
    const stmt = this.db.prepare(`
      UPDATE User
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...values);

    await stmt.run();

    // Return the updated user
    return this.getUserById(userId);
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.db.prepare(
      `UPDATE "User" SET passwordHash = ?, updatedAt = ? WHERE id = ?`
    )
    .bind(passwordHash, now, userId)
    .run();
    
    return result.success;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // First, check if the user exists
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }

    // Delete all sessions for the user
    const deleteSessionsStmt = this.db.prepare(`
      DELETE FROM Session
      WHERE userId = ?
    `).bind(userId);

    await deleteSessionsStmt.run();

    // Delete the user
    const deleteUserStmt = this.db.prepare(`
      DELETE FROM User
      WHERE id = ?
    `).bind(userId);

    const result = await deleteUserStmt.run();
    
    // Return true if at least one row was affected
    return result.meta.changes > 0;
  }
}