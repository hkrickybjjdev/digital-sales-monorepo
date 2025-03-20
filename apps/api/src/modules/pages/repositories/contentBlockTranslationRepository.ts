import { SQLDatabase, RequestContext } from '../../../database/sqlDatabase';
import { generateUUID } from '../../../utils/utils';
import { ContentBlockTranslation } from '../models/schemas';

import { IContentBlockTranslationRepository } from './interfaces';

export class ContentBlockTranslationRepository implements IContentBlockTranslationRepository {
  constructor(private readonly dbService: SQLDatabase) {}

  async createContentBlockTranslation(
    translation: Omit<ContentBlockTranslation, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ContentBlockTranslation> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const id = generateUUID();

    await this.dbService.executeWithAudit(
      {
        sql: `
          INSERT INTO ContentBlockTranslation (
            id,
            contentBlockId, 
            languageCode, 
            content, 
            settings, 
            createdAt, 
            updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          id,
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

  async getContentBlockTranslationById(id: string): Promise<ContentBlockTranslation | null> {
    const result = await this.dbService.queryOne<ContentBlockTranslation>({
      sql: `SELECT * FROM ContentBlockTranslation WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async getContentBlockTranslationsByContentBlockIds(
    contentBlockIds: string[]
  ): Promise<Record<string, Record<string, ContentBlockTranslation>>> {
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
      string,
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
    contentBlockId: string,
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
    id: string,
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
        resourceId: id,
        details: JSON.stringify(translation),
        outcome: 'success',
      },
      context
    );

    return this.getContentBlockTranslationById(id);
  }

  async deleteContentBlockTranslationsByContentBlockId(
    contentBlockId: string,
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
