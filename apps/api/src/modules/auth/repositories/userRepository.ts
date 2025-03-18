import { Env } from '../../../types';
import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService } from '../../../database/databaseService';
import { generateUUID } from '../../../utils/utils';
import { User, Session } from '../models/schemas';
import { IUserRepository } from '../services/interfaces';

export class UserRepository implements IUserRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.dbService.queryOne<User>({
      sql: 'SELECT * FROM User WHERE email = ?',
      params: [email.toLowerCase()]
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.dbService.queryOne<User>({
      sql: 'SELECT * FROM User WHERE id = ?',
      params: [id]
    });
  }

  async getUserByActivationToken(token: string): Promise<User | null> {
    return this.dbService.queryOne<User>({
      sql: 'SELECT * FROM User WHERE activationToken = ? AND activationTokenExpiresAt > ?',
      params: [token, Date.now()]
    });
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = Date.now();
    const id = generateUUID();

    await this.dbService.executeWithAudit({
      sql: `
        INSERT INTO User (id, email, name, passwordHash, createdAt, updatedAt, lockedAt, emailVerified, failedAttempts, activationToken, activationTokenExpiresAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
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
      ]
    }, {
      action: 'CREATE',
      resourceType: 'User',
      resourceId: id,
      details: JSON.stringify({ email: user.email.toLowerCase(), name: user.name })
    });

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
      activationTokenExpiresAt: user.activationTokenExpiresAt || null,
    };
  }

  async lockAccount(userId: string): Promise<void> {
    const now = Date.now();
    
    await this.dbService.executeWithAudit({
      sql: `
        UPDATE User 
        SET lockedAt = ?
        WHERE id = ? AND lockedAt IS NULL
      `,
      params: [now, userId]
    }, {
      action: 'LOCK',
      userId,
      resourceType: 'User',
      resourceId: userId
    });
  }

  async unlockAccount(userId: string): Promise<void> {
    await this.dbService.executeWithAudit({
      sql: `
        UPDATE User 
        SET lockedAt = NULL
        WHERE id = ?
      `,
      params: [userId]
    }, {
      action: 'UNLOCK',
      userId,
      resourceType: 'User',
      resourceId: userId
    });
  }

  async incrementFailedAttempts(userId: string): Promise<number> {
    const result = await this.dbService.queryOne<{ failedAttempts: number }>({
      sql: `
        UPDATE User 
        SET failedAttempts = failedAttempts + 1
        WHERE id = ?
        RETURNING failedAttempts
      `,
      params: [userId]
    });

    await this.dbService.execute({
      sql: `
        INSERT INTO AuditLog (action, userId, resourceType, resourceId, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      params: [
        'INCREMENT_FAILED_ATTEMPTS', 
        userId, 
        'User', 
        userId, 
        JSON.stringify({ failedAttempts: result?.failedAttempts }),
        Date.now()
      ]
    });

    return result ? Number(result.failedAttempts) : 0;
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.dbService.executeWithAudit({
      sql: `
        UPDATE User 
        SET failedAttempts = 0
        WHERE id = ?
      `,
      params: [userId]
    }, {
      action: 'RESET_FAILED_ATTEMPTS',
      userId,
      resourceType: 'User',
      resourceId: userId
    });
  }

  async activateUser(userId: string): Promise<void> {
    const now = Date.now();
    
    await this.dbService.executeWithAudit({
      sql: `
        UPDATE User 
        SET emailVerified = 1, 
            activationToken = NULL, 
            activationTokenExpiresAt = NULL,
            updatedAt = ?
        WHERE id = ?
      `,
      params: [now, userId]
    }, {
      action: 'ACTIVATE',
      userId,
      resourceType: 'User',
      resourceId: userId
    });
  }

  async setActivationToken(userId: string, token: string, expiresAt: number): Promise<void> {
    const now = Date.now();
    
    await this.dbService.executeWithAudit({
      sql: `
        UPDATE User 
        SET activationToken = ?, 
            activationTokenExpiresAt = ?,
            updatedAt = ?
        WHERE id = ?
      `,
      params: [token, expiresAt, now, userId]
    }, {
      action: 'SET_ACTIVATION_TOKEN',
      userId,
      resourceType: 'User',
      resourceId: userId
    });
  }

  async createSession(
    userId: string,
    expiresInSeconds: number = 60 * 60 * 24 * 7
  ): Promise<Session> {
    const now = Date.now();
    const id = generateUUID();
    const expiresAt = now + expiresInSeconds * 1000;

    await this.dbService.executeWithAudit({
      sql: `
        INSERT INTO Session (id, userId, expiresAt, createdAt) 
        VALUES (?, ?, ?, ?)
      `,
      params: [id, userId, expiresAt, now]
    }, {
      action: 'CREATE',
      userId,
      resourceType: 'Session',
      resourceId: id
    });

    return {
      id,
      userId,
      expiresAt,
      createdAt: now,
    };
  }

  async getSessionById(id: string): Promise<Session | null> {
    return this.dbService.queryOne<Session>({
      sql: 'SELECT * FROM Session WHERE id = ?',
      params: [id]
    });
  }

  async deleteSession(id: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (!session) return;

    await this.dbService.executeWithAudit({
      sql: 'DELETE FROM Session WHERE id = ?',
      params: [id]
    }, {
      action: 'DELETE',
      userId: session.userId,
      resourceType: 'Session',
      resourceId: id
    });
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = Date.now();
    
    await this.dbService.execute({
      sql: 'DELETE FROM Session WHERE expiresAt < ?',
      params: [now]
    });
  }

  async updateUser(userId: string, data: { name?: string; email?: string }): Promise<User | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email.toLowerCase());
    }

    if (updates.length === 0) {
      return user;
    }

    updates.push('updatedAt = ?');
    const now = Date.now();
    params.push(now);
    params.push(userId);

    await this.dbService.executeWithAudit({
      sql: `
        UPDATE User 
        SET ${updates.join(', ')}
        WHERE id = ?
      `,
      params
    }, {
      action: 'UPDATE',
      userId,
      resourceType: 'User',
      resourceId: userId,
      details: JSON.stringify(data)
    });

    // Get the updated user
    return this.getUserById(userId);
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const now = Date.now();
    
    await this.dbService.executeWithAudit({
      sql: `
        UPDATE User 
        SET passwordHash = ?, updatedAt = ?
        WHERE id = ?
      `,
      params: [passwordHash, now, userId]
    }, {
      action: 'UPDATE_PASSWORD',
      userId,
      resourceType: 'User',
      resourceId: userId
    });

    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    await this.dbService.executeWithAudit({
      sql: 'DELETE FROM User WHERE id = ?',
      params: [userId]
    }, {
      action: 'DELETE',
      userId,
      resourceType: 'User',
      resourceId: userId
    });

    return true;
  }
}
