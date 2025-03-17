import { D1Database } from '@cloudflare/workers-types';

import { generateUUID, generateShortID } from '../../../utils/utils';
import { Page, CreatePageRequest, UpdatePageRequest, PageType } from '../models/schemas';
import { IPageRepository } from '../services/interfaces';

const SHORT_ID_LENGTH = 8;

export class PageRepository implements IPageRepository {
  constructor(private readonly db: D1Database) {}

  async createPage(userId: string, request: CreatePageRequest): Promise<Page> {
    const id = generateUUID();
    const shortId = generateShortID(SHORT_ID_LENGTH);
    const now = Date.now();

    const page: Page = {
      id,
      shortId,
      userId,
      type: request.type,
      createdAt: now,
      expiresAt: request.expiresAt || null,
      launchAt: request.launchAt || null,
      isActive: request.isActive !== undefined ? request.isActive : true,
      customization: request.customization || {},
      settings: request.settings,
    };

    await this.db
      .prepare(
        `
      INSERT INTO Page (
        id, shortId, userId, type, createdAt, expiresAt, 
        launchAt, isActive, customization, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        page.id,
        page.shortId,
        page.userId,
        page.type,
        page.createdAt,
        page.expiresAt,
        page.launchAt,
        page.isActive,
        JSON.stringify(page.customization),
        JSON.stringify(page.settings)
      )
      .run();

    return page;
  }

  async getPageById(id: string): Promise<Page | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM Page WHERE id = ?
    `
      )
      .bind(id)
      .first();

    if (!result) return null;

    return this.parsePageResult(result);
  }

  async getPageByShortId(shortId: string): Promise<Page | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM Page WHERE shortId = ?
    `
      )
      .bind(shortId)
      .first();

    if (!result) return null;

    return this.parsePageResult(result);
  }

  async updatePage(id: string, userId: string, request: UpdatePageRequest): Promise<Page | null> {
    // First check if page exists and belongs to user
    const existingPage = await this.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      return null;
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (request.expiresAt !== undefined) {
      updates.push('expiresAt = ?');
      values.push(request.expiresAt);
    }

    if (request.launchAt !== undefined) {
      updates.push('launchAt = ?');
      values.push(request.launchAt);
    }

    if (request.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(request.isActive);
    }

    if (request.customization) {
      updates.push('customization = ?');
      values.push(JSON.stringify(request.customization));
    }

    if (request.settings) {
      updates.push('settings = ?');
      values.push(JSON.stringify(request.settings));
    }

    if (updates.length === 0) {
      return existingPage; // Nothing to update
    }

    // Add id and userId to values array
    values.push(id);
    values.push(userId);

    await this.db
      .prepare(
        `
      UPDATE Page SET ${updates.join(', ')} 
      WHERE id = ? AND userId = ?
    `
      )
      .bind(...values)
      .run();

    // Get updated page
    return await this.getPageById(id);
  }

  async deletePage(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
      DELETE FROM Page WHERE id = ? AND userId = ?
    `
      )
      .bind(id, userId)
      .run();

    return result.success;
  }

  async listUserPages(userId: string, limit = 20, offset = 0, type?: PageType): Promise<Page[]> {
    let query = `SELECT * FROM Page WHERE userId = ?`;
    const params: any[] = [userId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all();

    if (!result.results) return [];

    return result.results.map(row => this.parsePageResult(row));
  }

  async getUserPagesCount(userId: string, type?: PageType): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM Page WHERE userId = ?`;
    const params: any[] = [userId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .first();
    return result ? Number(result.count) : 0;
  }

  private parsePageResult(result: any): Page {
    return {
      id: result.id,
      shortId: result.shortId,
      userId: result.userId,
      type: result.type as PageType,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
      launchAt: result.launchAt,
      isActive: Boolean(result.isActive),
      customization: JSON.parse(result.customization || '{}'),
      settings: JSON.parse(result.settings || '{}'),
    };
  }
}
