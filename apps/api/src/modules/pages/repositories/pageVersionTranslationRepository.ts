import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService, RequestContext } from '../../../database/databaseService';
import { Env } from '../../../types';
import { PageVersionTranslation } from '../models/schemas';

import { IPageVersionTranslationRepository } from './interfaces';

export class PageVersionTranslationRepository implements IPageVersionTranslationRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createPageVersionTranslation(
    translation: Omit<PageVersionTranslation, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<PageVersionTranslation> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const result = await this.dbService.executeWithAudit(
      {
        sql: `
          INSERT INTO PageVersionTranslation (
            versionId, 
            languageCode, 
            socialShareTitle, 
            socialShareDescription, 
            metaDescription, 
            metaKeywords, 
            createdAt, 
            updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id
        `,
        params: [
          translation.versionId,
          translation.languageCode,
          translation.socialShareTitle,
          translation.socialShareDescription,
          translation.metaDescription,
          translation.metaKeywords,
          now,
          now,
        ],
      },
      {
        eventType: 'page_version_translation_created',
        resourceType: 'PageVersionTranslation',
        details: JSON.stringify({
          versionId: translation.versionId,
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
      versionId: translation.versionId,
      languageCode: translation.languageCode,
      socialShareTitle: translation.socialShareTitle,
      socialShareDescription: translation.socialShareDescription,
      metaDescription: translation.metaDescription,
      metaKeywords: translation.metaKeywords,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getPageVersionTranslationById(id: number): Promise<PageVersionTranslation | null> {
    const result = await this.dbService.queryOne<PageVersionTranslation>({
      sql: `SELECT * FROM PageVersionTranslation WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async getPageVersionTranslationsByVersionId(
    versionId: number
  ): Promise<Record<string, PageVersionTranslation>> {
    const results = await this.dbService.queryMany<PageVersionTranslation>({
      sql: `SELECT * FROM PageVersionTranslation WHERE versionId = ?`,
      params: [versionId],
    });

    const translationsByLanguage: Record<string, PageVersionTranslation> = {};

    for (const translation of results) {
      translationsByLanguage[translation.languageCode] = translation;
    }

    return translationsByLanguage;
  }

  async getPageVersionTranslation(
    versionId: number,
    languageCode: string
  ): Promise<PageVersionTranslation | null> {
    const result = await this.dbService.queryOne<PageVersionTranslation>({
      sql: `
        SELECT * FROM PageVersionTranslation 
        WHERE versionId = ? AND languageCode = ?
      `,
      params: [versionId, languageCode],
    });

    return result || null;
  }

  async updatePageVersionTranslation(
    id: number,
    translation: Partial<PageVersionTranslation>,
    context?: RequestContext
  ): Promise<PageVersionTranslation | null> {
    const existingTranslation = await this.getPageVersionTranslationById(id);
    if (!existingTranslation) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (translation.socialShareTitle !== undefined) {
      updates.push('socialShareTitle = ?');
      values.push(translation.socialShareTitle);
    }

    if (translation.socialShareDescription !== undefined) {
      updates.push('socialShareDescription = ?');
      values.push(translation.socialShareDescription);
    }

    if (translation.metaDescription !== undefined) {
      updates.push('metaDescription = ?');
      values.push(translation.metaDescription);
    }

    if (translation.metaKeywords !== undefined) {
      updates.push('metaKeywords = ?');
      values.push(translation.metaKeywords);
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
          UPDATE PageVersionTranslation 
          SET ${updates.join(', ')}
          WHERE id = ?
        `,
        params: values,
      },
      {
        eventType: 'page_version_translation_updated',
        resourceType: 'PageVersionTranslation',
        resourceId: id.toString(),
        details: JSON.stringify(translation),
        outcome: 'success',
      },
      context
    );

    return this.getPageVersionTranslationById(id);
  }

  async deletePageVersionTranslationsByVersionId(
    versionId: number,
    context?: RequestContext
  ): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM PageVersionTranslation WHERE versionId = ?`,
        params: [versionId],
      },
      {
        eventType: 'page_version_translations_deleted',
        resourceType: 'PageVersionTranslation',
        details: JSON.stringify({ versionId }),
        outcome: 'success',
      },
      context
    );

    return true;
  }
}
