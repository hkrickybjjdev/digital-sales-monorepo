import { DatabaseFactory } from '../../../database/databaseFactory';
import { SQLDatabase, RequestContext } from '../../../database/sqlDatabase';
import { Env } from '../../../types';
import { generateUUID } from '../../../utils/utils';
import { ExpirationSetting } from '../models/schemas';

import { IExpirationSettingRepository } from './interfaces';

export class ExpirationSettingRepository implements IExpirationSettingRepository {
  private dbService: SQLDatabase;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createExpirationSetting(
    setting: Omit<ExpirationSetting, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ExpirationSetting> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const id = generateUUID();

    await this.dbService.executeWithAudit(
      {
        sql: `
          INSERT INTO ExpirationSetting (
            id,
            expirationType, 
            expiresAtDatetime, 
            durationSeconds, 
            expirationAction, 
            redirectUrl, 
            createdAt, 
            updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          id,
          setting.expirationType,
          setting.expiresAtDatetime,
          setting.durationSeconds,
          setting.expirationAction,
          setting.redirectUrl,
          now,
          now,
        ],
      },
      {
        eventType: 'expiration_setting_created',
        resourceType: 'ExpirationSetting',
        details: JSON.stringify({
          expirationType: setting.expirationType,
          expirationAction: setting.expirationAction,
        }),
        outcome: 'success',
      },
      context
    );

    return {
      id,
      expirationType: setting.expirationType,
      expiresAtDatetime: setting.expiresAtDatetime,
      durationSeconds: setting.durationSeconds,
      expirationAction: setting.expirationAction,
      redirectUrl: setting.redirectUrl,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getExpirationSettingById(id: string): Promise<ExpirationSetting | null> {
    const result = await this.dbService.queryOne<ExpirationSetting>({
      sql: `SELECT * FROM ExpirationSetting WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async updateExpirationSetting(
    id: string,
    setting: Partial<ExpirationSetting>,
    context?: RequestContext
  ): Promise<ExpirationSetting | null> {
    const existingSetting = await this.getExpirationSettingById(id);
    if (!existingSetting) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (setting.expirationType !== undefined) {
      updates.push('expirationType = ?');
      values.push(setting.expirationType);
    }

    if (setting.expiresAtDatetime !== undefined) {
      updates.push('expiresAtDatetime = ?');
      values.push(setting.expiresAtDatetime);
    }

    if (setting.durationSeconds !== undefined) {
      updates.push('durationSeconds = ?');
      values.push(setting.durationSeconds);
    }

    if (setting.expirationAction !== undefined) {
      updates.push('expirationAction = ?');
      values.push(setting.expirationAction);
    }

    if (setting.redirectUrl !== undefined) {
      updates.push('redirectUrl = ?');
      values.push(setting.redirectUrl);
    }

    if (updates.length === 0) {
      return existingSetting;
    }

    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
          UPDATE ExpirationSetting 
          SET ${updates.join(', ')}
          WHERE id = ?
        `,
        params: values,
      },
      {
        eventType: 'expiration_setting_updated',
        resourceType: 'ExpirationSetting',
        resourceId: id,
        details: JSON.stringify(setting),
        outcome: 'success',
      },
      context
    );

    return this.getExpirationSettingById(id);
  }

  async deleteExpirationSetting(id: string, context?: RequestContext): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM ExpirationSetting WHERE id = ?`,
        params: [id],
      },
      {
        eventType: 'expiration_setting_deleted',
        resourceType: 'ExpirationSetting',
        resourceId: id,
        outcome: 'success',
      },
      context
    );

    return true;
  }
}
