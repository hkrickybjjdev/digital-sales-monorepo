import { AuditHelpers } from '@/utils/auditHelpers';

import { SQLDatabase, RequestContext } from '../../../database/sqlDatabase';
import { Env } from '../../../types';
import { generateUUID } from '../../../utils/utils';
import { User, Session } from '../models/schemas';
import { IUserRepository } from '../services/interfaces';

export class UserRepository implements IUserRepository {
  private auditHelpers: AuditHelpers;

  constructor(private readonly dbService: SQLDatabase) {
    this.auditHelpers = new AuditHelpers(this.dbService);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.dbService.queryOne<User>({
      sql: 'SELECT * FROM User WHERE email = ?',
      params: [email.toLowerCase()],
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.dbService.queryOne<User>({
      sql: 'SELECT * FROM User WHERE id = ?',
      params: [id],
    });
  }

  async getUserByActivationToken(token: string): Promise<User | null> {
    return this.dbService.queryOne<User>({
      sql: 'SELECT * FROM User WHERE activationToken = ? AND activationTokenExpiresAt > ?',
      params: [token, Date.now()],
    });
  }

  async createUser(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<User> {
    const now = Date.now();
    const id = generateUUID();

    await this.dbService.executeWithAudit(
      {
        sql: `
        INSERT INTO User (id, email, name, passwordHash, createdAt, updatedAt, lockedAt, emailVerified, failedAttempts, activationToken, activationTokenExpiresAt, timezone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          user.activationTokenExpiresAt || null,
          user.timezone || null,
        ],
      },
      {
        eventType: 'user_created',
        userId: context?.userId,
        resourceType: 'User',
        resourceId: id,
        details: JSON.stringify({ email: user.email.toLowerCase(), name: user.name }),
        outcome: 'success',
      },
      context
    );

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
      timezone: user.timezone || null,
    };
  }

  async lockAccount(userId: string, context?: RequestContext): Promise<void> {
    const now = Date.now();

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE User 
        SET lockedAt = ?
        WHERE id = ? AND lockedAt IS NULL
      `,
        params: [now, userId],
      },
      {
        eventType: 'user_account_locked',
        userId,
        resourceType: 'User',
        resourceId: userId,
        outcome: 'success',
      },
      context
    );
  }

  async unlockAccount(userId: string, context?: RequestContext): Promise<void> {
    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE User 
        SET lockedAt = NULL
        WHERE id = ?
      `,
        params: [userId],
      },
      {
        eventType: 'user_account_unlocked',
        userId,
        resourceType: 'User',
        resourceId: userId,
        outcome: 'success',
      },
      context
    );
  }

  async incrementFailedAttempts(userId: string, context?: RequestContext): Promise<number> {
    const result = await this.dbService.queryOne<{ failedAttempts: number }>({
      sql: `
        UPDATE User 
        SET failedAttempts = failedAttempts + 1
        WHERE id = ?
        RETURNING failedAttempts
      `,
      params: [userId],
    });

    await this.auditHelpers.logFailure(
      'user_failed_attempt_incremented',
      'User',
      userId,
      userId,
      { failedAttempts: result?.failedAttempts },
      context
    );

    return result ? Number(result.failedAttempts) : 0;
  }

  async resetFailedAttempts(userId: string, context?: RequestContext): Promise<void> {
    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE User 
        SET failedAttempts = 0
        WHERE id = ?
      `,
        params: [userId],
      },
      {
        eventType: 'user_failed_attempts_reset',
        userId,
        resourceType: 'User',
        resourceId: userId,
        outcome: 'success',
      },
      context
    );
  }

  async activateUser(userId: string, context?: RequestContext): Promise<void> {
    const now = Date.now();

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE User 
        SET emailVerified = 1, 
            activationToken = NULL, 
            activationTokenExpiresAt = NULL,
            updatedAt = ?
        WHERE id = ?
      `,
        params: [now, userId],
      },
      {
        eventType: 'user_activated',
        userId,
        resourceType: 'User',
        resourceId: userId,
        outcome: 'success',
      },
      context
    );
  }

  async setActivationToken(
    userId: string,
    token: string,
    expiresAt: number,
    context?: RequestContext
  ): Promise<void> {
    const now = Date.now();

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE User 
        SET activationToken = ?, 
            activationTokenExpiresAt = ?,
            updatedAt = ?
        WHERE id = ?
      `,
        params: [token, expiresAt, now, userId],
      },
      {
        eventType: 'user_activation_token_set',
        userId,
        resourceType: 'User',
        resourceId: userId,
        outcome: 'success',
      },
      context
    );
  }

  async createSession(
    userId: string,
    expiresInSeconds: number = 60 * 60 * 24 * 7,
    context?: RequestContext
  ): Promise<Session> {
    const now = Date.now();
    const id = generateUUID();
    const expiresAt = now + expiresInSeconds * 1000;

    await this.dbService.executeWithAudit(
      {
        sql: `
        INSERT INTO Session (id, userId, expiresAt, createdAt) 
        VALUES (?, ?, ?, ?)
      `,
        params: [id, userId, expiresAt, now],
      },
      {
        eventType: 'session_created',
        userId,
        resourceType: 'Session',
        resourceId: id,
        outcome: 'success',
      },
      context
    );

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
      params: [id],
    });
  }

  async deleteSession(id: string, context?: RequestContext): Promise<void> {
    const session = await this.getSessionById(id);
    if (!session) return;

    await this.dbService.executeWithAudit(
      {
        sql: 'DELETE FROM Session WHERE id = ?',
        params: [id],
      },
      {
        eventType: 'session_deleted',
        userId: session.userId,
        resourceType: 'Session',
        resourceId: id,
        outcome: 'success',
      },
      context
    );
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = Date.now();

    await this.dbService.execute({
      sql: 'DELETE FROM Session WHERE expiresAt < ?',
      params: [now],
    });
  }

  async updateUser(
    userId: string,
    data: { name?: string; email?: string; timezone?: string },
    context?: RequestContext
  ): Promise<User | null> {
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

    if (data.timezone !== undefined) {
      updates.push('timezone = ?');
      params.push(data.timezone);
    }

    if (updates.length === 0) {
      return user;
    }

    updates.push('updatedAt = ?');
    const now = Date.now();
    params.push(now);
    params.push(userId);

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE User 
        SET ${updates.join(', ')}
        WHERE id = ?
      `,
        params,
      },
      {
        eventType: 'user_updated',
        userId,
        resourceType: 'User',
        resourceId: userId,
        details: JSON.stringify(data),
        outcome: 'success',
      },
      context
    );

    // Get the updated user
    return this.getUserById(userId);
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
    context?: RequestContext
  ): Promise<boolean> {
    const now = Date.now();

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE User 
        SET passwordHash = ?, updatedAt = ?
        WHERE id = ?
      `,
        params: [passwordHash, now, userId],
      },
      {
        eventType: 'user_password_updated',
        userId,
        resourceType: 'User',
        resourceId: userId,
        outcome: 'success',
      },
      context
    );

    return true;
  }

  async deleteUser(userId: string, context?: RequestContext): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: 'DELETE FROM User WHERE id = ?',
        params: [userId],
      },
      {
        eventType: 'user_deleted',
        userId,
        resourceType: 'User',
        resourceId: userId,
        outcome: 'success',
      },
      context
    );

    return true;
  }
}
