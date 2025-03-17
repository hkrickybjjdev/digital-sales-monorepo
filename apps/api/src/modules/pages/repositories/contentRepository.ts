import { D1Database } from '@cloudflare/workers-types';

import { generateUUID } from '../../../utils/utils';
import { PageContent, CreatePageContentRequest } from '../models/schemas';
import { IContentRepository } from '../services/interfaces';

export class ContentRepository implements IContentRepository {
  constructor(private readonly db: D1Database) {}

  async createPageContent(
    pageId: string,
    userId: string,
    request: CreatePageContentRequest
  ): Promise<PageContent | null> {
    // First check if page exists and belongs to user
    const pageExists = await this.checkPageOwnership(pageId, userId);
    if (!pageExists) {
      return null;
    }

    const id = generateUUID();

    const content: PageContent = {
      id,
      pageId,
      contentType: request.contentType,
      productId: request.productId,
      title: request.title,
      description: request.description,
      priceInCents: request.priceInCents,
      currency: request.currency,
      metadata: request.metadata || {},
    };

    await this.db
      .prepare(
        `
      INSERT INTO PageContent (
        id, pageId, contentType, productId, title, 
        description, priceInCents, currency, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        content.id,
        content.pageId,
        content.contentType,
        content.productId || null,
        content.title,
        content.description,
        content.priceInCents,
        content.currency,
        JSON.stringify(content.metadata)
      )
      .run();

    return content;
  }

  async getPageContentById(id: string): Promise<PageContent | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM PageContent WHERE id = ?
    `
      )
      .bind(id)
      .first();

    if (!result) return null;

    return this.parseContentResult(result);
  }

  async getPageContents(pageId: string): Promise<PageContent[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM PageContent WHERE pageId = ?
    `
      )
      .bind(pageId)
      .all();

    if (!result.results) return [];

    return result.results.map(row => this.parseContentResult(row));
  }

  async updatePageContent(
    id: string,
    pageId: string,
    userId: string,
    updates: Partial<CreatePageContentRequest>
  ): Promise<PageContent | null> {
    // First check if page exists and belongs to user
    const pageExists = await this.checkPageOwnership(pageId, userId);
    if (!pageExists) {
      return null;
    }

    // Check if content exists and belongs to the page
    const existingContent = await this.getPageContentById(id);
    if (!existingContent || existingContent.pageId !== pageId) {
      return null;
    }

    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.contentType !== undefined) {
      updateFields.push('contentType = ?');
      values.push(updates.contentType);
    }

    if (updates.productId !== undefined) {
      updateFields.push('productId = ?');
      values.push(updates.productId);
    }

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      values.push(updates.title);
    }

    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description);
    }

    if (updates.priceInCents !== undefined) {
      updateFields.push('priceInCents = ?');
      values.push(updates.priceInCents);
    }

    if (updates.currency !== undefined) {
      updateFields.push('currency = ?');
      values.push(updates.currency);
    }

    if (updates.metadata !== undefined) {
      updateFields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    if (updateFields.length === 0) {
      return existingContent; // Nothing to update
    }

    // Add id to values array
    values.push(id);
    values.push(pageId);

    await this.db
      .prepare(
        `
      UPDATE PageContent SET ${updateFields.join(', ')} 
      WHERE id = ? AND pageId = ?
    `
      )
      .bind(...values)
      .run();

    // Get updated content
    return await this.getPageContentById(id);
  }

  async deletePageContent(id: string, pageId: string, userId: string): Promise<boolean> {
    // First check if page exists and belongs to user
    const pageExists = await this.checkPageOwnership(pageId, userId);
    if (!pageExists) {
      return false;
    }

    const result = await this.db
      .prepare(
        `
      DELETE FROM PageContent WHERE id = ? AND pageId = ?
    `
      )
      .bind(id, pageId)
      .run();

    return result.success;
  }

  private async checkPageOwnership(pageId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
      SELECT id FROM Page WHERE id = ? AND userId = ?
    `
      )
      .bind(pageId, userId)
      .first();

    return !!result;
  }

  private parseContentResult(result: any): PageContent {
    return {
      id: result.id,
      pageId: result.pageId,
      contentType: result.contentType,
      productId: result.productId || undefined,
      title: result.title,
      description: result.description,
      priceInCents: Number(result.priceInCents),
      currency: result.currency,
      metadata: JSON.parse(result.metadata || '{}'),
    };
  }
}
