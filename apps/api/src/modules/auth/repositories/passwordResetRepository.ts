import { Env } from '../../../types';
import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService } from '../../../database/databaseService';
import { generateUUID } from '../../../utils/utils';
import { PasswordReset } from '../models/schemas';

export class PasswordResetRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createPasswordReset(
    userId: string,
    token: string,
    expiryTimeInMinutes: number = 30
  ): Promise<PasswordReset> {
    const now = Date.now();
    const expiresAt = now + expiryTimeInMinutes * 60 * 1000;

    const passwordReset: PasswordReset = {
      id: generateUUID(),
      userId,
      token,
      expiresAt,
      used: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.dbService.executeWithAudit({
      sql: `INSERT INTO "PasswordReset" (id, userId, token, expiresAt, used, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [
        passwordReset.id,
        passwordReset.userId,
        passwordReset.token,
        passwordReset.expiresAt,
        passwordReset.used,
        passwordReset.createdAt,
        passwordReset.updatedAt
      ]
    }, {
      action: 'CREATE',
      userId,
      resourceType: 'PasswordReset',
      resourceId: passwordReset.id,
      details: JSON.stringify({ token_expiry: expiryTimeInMinutes })
    });

    return passwordReset;
  }

  async getPasswordResetByToken(token: string): Promise<PasswordReset | null> {
    return this.dbService.queryOne<PasswordReset>({
      sql: `SELECT * FROM "PasswordReset" WHERE token = ? LIMIT 1`,
      params: [token]
    });
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const now = Date.now();
    
    // First get the reset record to identify the user
    const reset = await this.getPasswordResetByToken(token);
    if (!reset) return false;
    
    await this.dbService.executeWithAudit({
      sql: `UPDATE "PasswordReset" SET used = 1, updatedAt = ? WHERE token = ?`,
      params: [now, token]
    }, {
      action: 'MARK_USED',
      userId: reset.userId,
      resourceType: 'PasswordReset',
      resourceId: reset.id
    });

    return true;
  }

  async invalidateUserTokens(userId: string): Promise<boolean> {
    const now = Date.now();
    
    await this.dbService.executeWithAudit({
      sql: `UPDATE "PasswordReset" SET used = 1, updatedAt = ? WHERE userId = ? AND used = 0`,
      params: [now, userId]
    }, {
      action: 'INVALIDATE_ALL',
      userId,
      resourceType: 'PasswordReset',
      details: 'All user tokens invalidated'
    });

    return true;
  }
}
