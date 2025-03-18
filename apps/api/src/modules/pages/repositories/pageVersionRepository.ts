import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService, RequestContext } from '../../../database/databaseService';
import { Env } from '../../../types';
import { generateUUID } from '../../../utils/utils';
import { PageVersion } from '../models/schemas';

import { IPageVersionRepository } from './interfaces';

export class PageVersionRepository implements IPageVersionRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createPageVersion(
    pageVersion: Omit<PageVersion, 'id' | 'createdAt'>,
    context?: RequestContext
  ): Promise<PageVersion> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const id = generateUUID();

    await this.dbService.executeWithAudit(
      {
        sql: `
          INSERT INTO PageVersion (
            id,
            pageId, 
            versionNumber, 
            isPublished, 
            createdAt, 
            publishedAt, 
            publishFrom, 
            expirationId
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          id,
          pageVersion.pageId,
          pageVersion.versionNumber,
          pageVersion.isPublished,
          now,
          pageVersion.publishedAt,
          pageVersion.publishFrom,
          pageVersion.expirationId,
        ],
      },
      {
        eventType: 'page_version_created',
        resourceType: 'PageVersion',
        details: JSON.stringify({
          pageId: pageVersion.pageId,
          versionNumber: pageVersion.versionNumber,
          isPublished: pageVersion.isPublished,
        }),
        outcome: 'success',
      },
      context
    );

    return {
      id,
      pageId: pageVersion.pageId,
      versionNumber: pageVersion.versionNumber,
      isPublished: pageVersion.isPublished,
      createdAt: now,
      publishedAt: pageVersion.publishedAt,
      publishFrom: pageVersion.publishFrom,
      expirationId: pageVersion.expirationId,
    };
  }

  async getPageVersionById(id: string): Promise<PageVersion | null> {
    const result = await this.dbService.queryOne<PageVersion>({
      sql: `SELECT * FROM PageVersion WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async getLatestPageVersion(pageId: string): Promise<PageVersion | null> {
    const result = await this.dbService.queryOne<PageVersion>({
      sql: `
        SELECT * FROM PageVersion 
        WHERE pageId = ? 
        ORDER BY versionNumber DESC 
        LIMIT 1
      `,
      params: [pageId],
    });

    return result || null;
  }

  async getPublishedPageVersion(pageId: string): Promise<PageVersion | null> {
    const result = await this.dbService.queryOne<PageVersion>({
      sql: `
        SELECT * FROM PageVersion 
        WHERE pageId = ? AND isPublished = true
        LIMIT 1
      `,
      params: [pageId],
    });

    return result || null;
  }

  async getPublishedVersionsWithExpirations(): Promise<PageVersion[]> {
    const results = await this.dbService.queryMany<PageVersion>({
      sql: `
        SELECT * FROM PageVersion 
        WHERE isPublished = true AND expirationId IS NOT NULL
      `,
      params: [],
    });

    return results;
  }

  async updatePageVersion(
    id: string,
    pageVersion: Partial<PageVersion>,
    context?: RequestContext
  ): Promise<PageVersion | null> {
    const existingVersion = await this.getPageVersionById(id);
    if (!existingVersion) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (pageVersion.isPublished !== undefined) {
      updates.push('isPublished = ?');
      values.push(pageVersion.isPublished);
    }

    if (pageVersion.publishedAt !== undefined) {
      updates.push('publishedAt = ?');
      values.push(pageVersion.publishedAt);
    }

    if (pageVersion.publishFrom !== undefined) {
      updates.push('publishFrom = ?');
      values.push(pageVersion.publishFrom);
    }

    if (pageVersion.expirationId !== undefined) {
      updates.push('expirationId = ?');
      values.push(pageVersion.expirationId);
    }

    if (updates.length === 0) {
      return existingVersion;
    }

    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
          UPDATE PageVersion 
          SET ${updates.join(', ')}
          WHERE id = ?
        `,
        params: values,
      },
      {
        eventType: 'page_version_updated',
        resourceType: 'PageVersion',
        resourceId: id,
        details: JSON.stringify(pageVersion),
        outcome: 'success',
      },
      context
    );

    return this.getPageVersionById(id);
  }

  async unpublishAllVersionsExcept(
    pageId: string,
    versionId: string,
    context?: RequestContext
  ): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `
          UPDATE PageVersion 
          SET isPublished = false
          WHERE pageId = ? AND id != ?
        `,
        params: [pageId, versionId],
      },
      {
        eventType: 'page_versions_unpublished',
        resourceType: 'PageVersion',
        details: JSON.stringify({ pageId, exceptVersionId: versionId }),
        outcome: 'success',
      },
      context
    );

    return true;
  }

  async deletePageVersionsByPageId(pageId: string, context?: RequestContext): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM PageVersion WHERE pageId = ?`,
        params: [pageId],
      },
      {
        eventType: 'page_versions_deleted',
        resourceType: 'PageVersion',
        details: JSON.stringify({ pageId }),
        outcome: 'success',
      },
      context
    );

    return true;
  }
}
