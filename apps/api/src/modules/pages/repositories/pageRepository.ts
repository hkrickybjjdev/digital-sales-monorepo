import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService, RequestContext } from '../../../database/databaseService';
import { Env } from '../../../types';
import { generateUUID } from '../../../utils/utils';
import { Page } from '../models/schemas';

import { IPageRepository } from './interfaces';

export class PageRepository implements IPageRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createPage(
    page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<Page> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const id = generateUUID();

    await this.dbService.executeWithAudit(
      {
        sql: `
          INSERT INTO Page (id, teamId, slug, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        params: [id, page.teamId, page.slug, page.status, now, now],
      },
      {
        eventType: 'page_created',
        resourceType: 'Page',
        details: JSON.stringify({ teamId: page.teamId, slug: page.slug }),
        outcome: 'success',
      },
      context
    );

    return {
      id,
      teamId: page.teamId,
      slug: page.slug,
      status: page.status || 'draft',
      createdAt: now,
      updatedAt: now,
    };
  }

  async getPageById(id: string): Promise<Page | null> {
    const result = await this.dbService.queryOne<Page>({
      sql: `SELECT * FROM Page WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async getPageBySlug(slug: string): Promise<Page | null> {
    const result = await this.dbService.queryOne<Page>({
      sql: `SELECT * FROM Page WHERE slug = ?`,
      params: [slug],
    });

    return result || null;
  }

  async updatePage(
    id: string,
    page: Partial<Page>,
    context?: RequestContext
  ): Promise<Page | null> {
    const existingPage = await this.getPageById(id);
    if (!existingPage) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (page.slug !== undefined) {
      updates.push('slug = ?');
      values.push(page.slug);
    }

    if (page.status !== undefined) {
      updates.push('status = ?');
      values.push(page.status);
    }

    if (updates.length === 0) {
      return existingPage;
    }

    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
          UPDATE Page 
          SET ${updates.join(', ')}
          WHERE id = ?
        `,
        params: values,
      },
      {
        eventType: 'page_updated',
        resourceType: 'Page',
        resourceId: id,
        details: JSON.stringify(page),
        outcome: 'success',
      },
      context
    );

    return this.getPageById(id);
  }

  async deletePage(id: string, context?: RequestContext): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM Page WHERE id = ?`,
        params: [id],
      },
      {
        eventType: 'page_deleted',
        resourceType: 'Page',
        resourceId: id,
        outcome: 'success',
      },
      context
    );

    return true;
  }
}
