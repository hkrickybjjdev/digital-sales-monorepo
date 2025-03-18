import { Env } from '../../../types';
import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService } from '../../../database/databaseService';
import { generateUUID } from '../../../utils/utils';
import { PageContent, CreatePageContentRequest } from '../models/schemas';
import { IContentRepository } from '../services/interfaces';

export class ContentRepository implements IContentRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

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

    await this.dbService.executeWithAudit({
      sql: `
        INSERT INTO PageContent (
          id, pageId, contentType, productId, title, 
          description, priceInCents, currency, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        content.id,
        content.pageId,
        content.contentType,
        content.productId || null,
        content.title,
        content.description,
        content.priceInCents,
        content.currency,
        JSON.stringify(content.metadata)
      ]
    }, {
      action: 'CREATE',
      userId,
      resourceType: 'PageContent',
      resourceId: content.id,
      details: JSON.stringify({
        pageId: content.pageId,
        contentType: content.contentType
      })
    });

    return content;
  }

  async getPageContentById(id: string): Promise<PageContent | null> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT * FROM PageContent WHERE id = ?`,
      params: [id]
    });

    if (!result) return null;

    return this.parseContentResult(result);
  }

  async getPageContents(pageId: string): Promise<PageContent[]> {
    const results = await this.dbService.queryMany<any>({
      sql: `SELECT * FROM PageContent WHERE pageId = ?`,
      params: [pageId]
    });

    return results.map(row => this.parseContentResult(row));
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

    // Check if content exists
    const existingContent = await this.getPageContentById(id);
    if (!existingContent || existingContent.pageId !== pageId) {
      return null;
    }

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
      return existingContent;
    }

    values.push(id);
    values.push(pageId);

    await this.dbService.executeWithAudit({
      sql: `
        UPDATE PageContent 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND pageId = ?
      `,
      params: values
    }, {
      action: 'UPDATE',
      userId,
      resourceType: 'PageContent',
      resourceId: id,
      details: JSON.stringify(updates)
    });

    return this.getPageContentById(id);
  }

  async deletePageContent(id: string, pageId: string, userId: string): Promise<boolean> {
    // First check if page exists and belongs to user
    const pageExists = await this.checkPageOwnership(pageId, userId);
    if (!pageExists) {
      return false;
    }

    await this.dbService.executeWithAudit({
      sql: `DELETE FROM PageContent WHERE id = ? AND pageId = ?`,
      params: [id, pageId]
    }, {
      action: 'DELETE',
      userId,
      resourceType: 'PageContent',
      resourceId: id,
      details: JSON.stringify({ pageId })
    });

    return true;
  }

  private async checkPageOwnership(pageId: string, userId: string): Promise<boolean> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT 1 FROM Page WHERE id = ? AND userId = ?`,
      params: [pageId, userId]
    });

    return result !== null;
  }

  private parseContentResult(result: any): PageContent {
    return {
      id: result.id,
      pageId: result.pageId,
      contentType: result.contentType,
      productId: result.productId,
      title: result.title,
      description: result.description,
      priceInCents: Number(result.priceInCents),
      currency: result.currency,
      metadata: result.metadata ? JSON.parse(result.metadata) : {},
    };
  }
}
