import { Env } from '../../../types';
import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService, RequestContext } from '../../../database/databaseService';
import { generateUUID, generateShortID } from '../../../utils/utils';
import { Page, CreatePageRequest, UpdatePageRequest, PageType } from '../models/schemas';
import { IPageRepository } from '../services/interfaces';
import { AuditHelpers } from '../../../utils/auditHelpers';

const SHORT_ID_LENGTH = 8;

export class PageRepository implements IPageRepository {
  private dbService: DatabaseService;
  private auditHelpers: AuditHelpers;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
    this.auditHelpers = new AuditHelpers(this.dbService);
  }

  async createPage(userId: string, request: CreatePageRequest, context?: RequestContext): Promise<Page> {
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

    await this.dbService.executeWithAudit({
      sql: `
        INSERT INTO Page (
          id, shortId, userId, type, createdAt, expiresAt, 
          launchAt, isActive, customization, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
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
      ]
    }, {
      eventType: 'page_created',
      userId: context?.userId || userId,
      resourceType: 'Page',
      resourceId: page.id,
      details: JSON.stringify({
        type: page.type,
        shortId: page.shortId
      }),
      outcome: 'success'
    }, context);

    // Log additional details using AuditHelpers
    await this.auditHelpers.logDataChange(
      'created',
      'Page',
      page.id,
      context?.userId || userId,
      undefined,
      { 
        id: page.id,
        shortId: page.shortId,
        type: page.type,
        isActive: page.isActive
      },
      context
    );

    return page;
  }

  async getPageById(id: string): Promise<Page | null> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT * FROM Page WHERE id = ?`,
      params: [id]
    });

    if (!result) return null;

    return this.parsePageResult(result);
  }

  async getPageByShortId(shortId: string): Promise<Page | null> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT * FROM Page WHERE shortId = ?`,
      params: [shortId]
    });

    if (!result) return null;

    return this.parsePageResult(result);
  }

  async updatePage(id: string, userId: string, request: UpdatePageRequest, context?: RequestContext): Promise<Page | null> {
    // Check if the page exists and belongs to the user
    const existingPage = await this.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      // Log access denied with AuditHelpers
      await this.auditHelpers.logAccessControl(
        false,
        'Page',
        id,
        context?.userId || userId,
        { 
          reason: existingPage ? 'unauthorized' : 'not_found',
          requestedUpdate: request 
        },
        context
      );
      
      return null;
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    if (request.expiresAt !== undefined) {
      updateFields.push('expiresAt = ?');
      values.push(request.expiresAt);
    }

    if (request.launchAt !== undefined) {
      updateFields.push('launchAt = ?');
      values.push(request.launchAt);
    }

    if (request.isActive !== undefined) {
      updateFields.push('isActive = ?');
      values.push(request.isActive);
    }

    if (request.customization !== undefined) {
      updateFields.push('customization = ?');
      values.push(JSON.stringify(request.customization));
    }

    if (request.settings !== undefined) {
      updateFields.push('settings = ?');
      values.push(JSON.stringify(request.settings));
    }

    if (updateFields.length === 0) {
      return existingPage;
    }

    values.push(id);
    values.push(userId);

    await this.dbService.executeWithAudit({
      sql: `
        UPDATE Page 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND userId = ?
      `,
      params: values
    }, {
      eventType: 'page_updated',
      userId: context?.userId || userId,
      resourceType: 'Page',
      resourceId: id,
      details: JSON.stringify(request),
      outcome: 'success'
    }, context);

    const updatedPage = await this.getPageById(id);

    // Log data change with AuditHelpers
    if (updatedPage) {
      await this.auditHelpers.logDataChange(
        'updated',
        'Page',
        id,
        context?.userId || userId,
        this.extractChangedFields(existingPage, request),
        updatedPage,
        context
      );
    }

    return updatedPage;
  }

  async deletePage(id: string, userId: string, context?: RequestContext): Promise<boolean> {
    // Get existing page for audit purposes
    const existingPage = await this.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      // Log access denied
      await this.auditHelpers.logAccessControl(
        false,
        'Page',
        id,
        context?.userId || userId,
        { reason: existingPage ? 'unauthorized' : 'not_found' },
        context
      );
      
      return false;
    }
    
    await this.dbService.executeWithAudit({
      sql: `DELETE FROM Page WHERE id = ? AND userId = ?`,
      params: [id, userId]
    }, {
      eventType: 'page_deleted',
      userId: context?.userId || userId,
      resourceType: 'Page',
      resourceId: id,
      details: JSON.stringify({
        shortId: existingPage.shortId,
        type: existingPage.type 
      }),
      outcome: 'success'
    }, context);

    // Log data deletion with AuditHelpers
    await this.auditHelpers.logDataChange(
      'deleted',
      'Page',
      id,
      context?.userId || userId,
      existingPage,
      undefined,
      context
    );

    return true;
  }

  async listUserPages(userId: string, limit = 20, offset = 0, type?: PageType): Promise<Page[]> {
    let sql = `SELECT * FROM Page WHERE userId = ?`;
    const params: any[] = [userId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit);
    params.push(offset);

    const results = await this.dbService.queryMany<any>({
      sql,
      params
    });

    return results.map(this.parsePageResult);
  }

  async getUserPagesCount(userId: string, type?: PageType): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM Page WHERE userId = ?`;
    const params: any[] = [userId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    const result = await this.dbService.queryOne<{ count: number }>({
      sql,
      params
    });

    return result ? Number(result.count) : 0;
  }

  /**
   * Toggle a page's active status with audit logging
   */
  async togglePageActive(id: string, userId: string, context?: RequestContext): Promise<Page | null> {
    // Get existing page for audit purposes
    const existingPage = await this.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      // Log access denied
      await this.auditHelpers.logAccessControl(
        false,
        'Page',
        id,
        context?.userId || userId,
        { reason: existingPage ? 'unauthorized' : 'not_found' },
        context
      );
      
      return null;
    }
    
    const newStatus = !existingPage.isActive;
    
    await this.dbService.executeWithAudit({
      sql: `UPDATE Page SET isActive = ? WHERE id = ? AND userId = ?`,
      params: [newStatus, id, userId]
    }, {
      eventType: newStatus ? 'page_activated' : 'page_deactivated',
      userId: context?.userId || userId,
      resourceType: 'Page',
      resourceId: id,
      details: JSON.stringify({
        shortId: existingPage.shortId,
        previousStatus: existingPage.isActive
      }),
      outcome: 'success'
    }, context);

    return this.getPageById(id);
  }

  private parsePageResult(result: any): Page {
    return {
      id: result.id,
      shortId: result.shortId,
      userId: result.userId,
      type: result.type,
      createdAt: Number(result.createdAt),
      expiresAt: result.expiresAt ? Number(result.expiresAt) : null,
      launchAt: result.launchAt ? Number(result.launchAt) : null,
      isActive: Boolean(result.isActive),
      customization: result.customization ? JSON.parse(result.customization) : {},
      settings: JSON.parse(result.settings),
    };
  }
  
  /**
   * Extract the changed fields for better audit logs
   */
  private extractChangedFields(existingPage: Page, updateData: UpdatePageRequest): Partial<Page> {
    const result: Partial<Page> = {};
    
    if (updateData.expiresAt !== undefined) {
      result.expiresAt = existingPage.expiresAt;
    }
    
    if (updateData.launchAt !== undefined) {
      result.launchAt = existingPage.launchAt;
    }
    
    if (updateData.isActive !== undefined) {
      result.isActive = existingPage.isActive;
    }
    
    if (updateData.customization !== undefined) {
      result.customization = existingPage.customization;
    }
    
    if (updateData.settings !== undefined) {
      result.settings = existingPage.settings;
    }
    
    return result;
  }
}
