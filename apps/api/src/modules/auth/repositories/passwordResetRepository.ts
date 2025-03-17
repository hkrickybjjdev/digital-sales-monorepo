import { D1Database } from '@cloudflare/workers-types';

import { generateUUID } from '../../../utils/utils';
import { PasswordReset } from '../models/schemas';

export class PasswordResetRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async createPasswordReset(
    userId: string,
    token: string,
    expiryTimeInMinutes: number = 30
  ): Promise<PasswordReset> {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + expiryTimeInMinutes * 60;

    const passwordReset: PasswordReset = {
      id: generateUUID(),
      userId,
      token,
      expiresAt,
      used: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.db
      .prepare(
        `INSERT INTO "PasswordReset" (id, userId, token, expiresAt, used, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        passwordReset.id,
        passwordReset.userId,
        passwordReset.token,
        passwordReset.expiresAt,
        passwordReset.used,
        passwordReset.createdAt,
        passwordReset.updatedAt
      )
      .run();

    return passwordReset;
  }

  async getPasswordResetByToken(token: string): Promise<PasswordReset | null> {
    const stmt = await this.db
      .prepare(`SELECT * FROM "PasswordReset" WHERE token = ? LIMIT 1`)
      .bind(token)
      .first();

    return stmt as PasswordReset | null;
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.db
      .prepare(`UPDATE "PasswordReset" SET used = 1, updatedAt = ? WHERE token = ?`)
      .bind(now, token)
      .run();

    return result.success;
  }

  async invalidateUserTokens(userId: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.db
      .prepare(`UPDATE "PasswordReset" SET used = 1, updatedAt = ? WHERE userId = ? AND used = 0`)
      .bind(now, userId)
      .run();

    return result.success;
  }
}
