import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService, RequestContext } from '../../../database/databaseService';
import { Env } from '../../../types';
import { ContentBlockTranslation } from '../models/schemas';

import { IContentBlockTranslationRepository } from './interfaces';

export class ContentBlockTranslationRepository implements IContentBlockTranslationRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createContentBlockTranslation(
    translation: Omit<ContentBlockTranslation, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ContentBlockTranslation> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const result = await this.dbService.executeWithAudit(
      {
        sql: `
          INSERT INTO ContentBlockTranslation (
            contentBlockId, 
            languageCode, 
            content, 
            settings, 
            createdAt, 
            updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING id
        `,
        params: [
          translation.contentBlockId,
          translation.languageCode,
          translation.content,
          translation.settings,
          now,
          now,
        ],
      },
      {
        eventType: 'content_block_translation_created',
        resourceType: 'ContentBlockTranslation',
        details: JSON.stringify({
          contentBlockId: translation.contentBlockId,
          languageCode: translation.languageCode,
        }),
        outcome: 'success',
      },
      context
    );

    // Safe type assertion as we know this query returns an object with an id
    const id = (result as any).id;

    return {
      id,
      contentBlockId: translation.contentBlockId,
      languageCode: translation.languageCode,
      content: translation.content,
      settings: translation.settings,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getContentBlockTranslationById(id: number): Promise<ContentBlockTranslation | null> {
    const result = await this.dbService.queryOne<ContentBlockTranslation>({
      sql: `SELECT * FROM ContentBlockTranslation WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async getContentBlockTranslationsByContentBlockIds(
    contentBlockIds: number[]
  ): Promise<Record<number, Record<string, ContentBlockTranslation>>> {
    if (contentBlockIds.length === 0) {
      return {};
    }

    const placeholders = contentBlockIds.map(() => '?').join(',');

    const results = await this.dbService.queryMany<ContentBlockTranslation>({
      sql: `
        SELECT * FROM ContentBlockTranslation 
        WHERE contentBlockId IN (${placeholders})
      `,
      params: contentBlockIds,
    });

    const translationsByBlockIdAndLanguage: Record<
      number,
      Record<string, ContentBlockTranslation>
    > = {};

    for (const translation of results) {
      if (!translationsByBlockIdAndLanguage[translation.contentBlockId]) {
        translationsByBlockIdAndLanguage[translation.contentBlockId] = {};
      }

      translationsByBlockIdAndLanguage[translation.contentBlockId][translation.languageCode] =
        translation;
    }

    return translationsByBlockIdAndLanguage;
  }

  async getContentBlockTranslation(
    contentBlockId: number,
    languageCode: string
  ): Promise<ContentBlockTranslation | null> {
    const result = await this.dbService.queryOne<ContentBlockTranslation>({
      sql: `
        SELECT * FROM ContentBlockTranslation 
        WHERE contentBlockId = ? AND languageCode = ?
      `,
      params: [contentBlockId, languageCode],
    });

    return result || null;
  }

  async updateContentBlockTranslation(
    id: number,
    translation: Partial<ContentBlockTranslation>,
    context?: RequestContext
  ): Promise<ContentBlockTranslation | null> {
    const existingTranslation = await this.getContentBlockTranslationById(id);
    if (!existingTranslation) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (translation.content !== undefined) {
      updates.push('content = ?');
      values.push(translation.content);
    }

    if (translation.settings !== undefined) {
      updates.push('settings = ?');
      values.push(translation.settings);
    }

    if (updates.length === 0) {
      return existingTranslation;
    }

    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
          UPDATE ContentBlockTranslation 
          SET ${updates.join(', ')}
          WHERE id = ?
        `,
        params: values,
      },
      {
        eventType: 'content_block_translation_updated',
        resourceType: 'ContentBlockTranslation',
        resourceId: id.toString(),
        details: JSON.stringify(translation),
        outcome: 'success',
      },
      context
    );

    return this.getContentBlockTranslationById(id);
  }

  async deleteContentBlockTranslationsByContentBlockId(
    contentBlockId: number,
    context?: RequestContext
  ): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM ContentBlockTranslation WHERE contentBlockId = ?`,
        params: [contentBlockId],
      },
      {
        eventType: 'content_block_translations_deleted',
        resourceType: 'ContentBlockTranslation',
        details: JSON.stringify({ contentBlockId }),
        outcome: 'success',
      },
      context
    );

    return true;
  }
}
