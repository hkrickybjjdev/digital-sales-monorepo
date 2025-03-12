import { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';
import { v7 as uuidv7 } from 'uuid';
import { 
  Page, 
  PageContent, 
  Registration, 
  CreatePageRequest, 
  UpdatePageRequest,
  CreatePageContentRequest,
  CreateRegistrationRequest,
  PageType
} from '../types';

const SHORT_ID_LENGTH = 8;

export class PageDatabaseService {
  constructor(private readonly db: D1Database) {}

  // Page CRUD operations
  async createPage(userId: string, request: CreatePageRequest): Promise<Page> {
    const id = uuidv7();
    const shortId = nanoid(SHORT_ID_LENGTH);
    const now = new Date().toISOString();
    
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
      settings: request.settings
    };

    await this.db.prepare(`
      INSERT INTO Page (
        id, shortId, userId, type, createdAt, expiresAt, 
        launchAt, isActive, customization, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      page.id,
      page.shortId,
      page.userId,
      page.type,
      page.createdAt,
      page.expiresAt,
      page.launchAt,
      page.isActive ? 1 : 0,
      JSON.stringify(page.customization),
      JSON.stringify(page.settings)
    ).run();

    return page;
  }

  async getPageById(id: string): Promise<Page | null> {
    const result = await this.db.prepare(`
      SELECT id, shortId, userId, type, createdAt, expiresAt, 
        launchAt, isActive, customization, settings
      FROM Page WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    return {
      ...result,
      isActive: Boolean(result.isActive),
      customization: JSON.parse(result.customization as string),
      settings: JSON.parse(result.settings as string)
    } as Page;
  }

  async getPageByShortId(shortId: string): Promise<Page | null> {
    const result = await this.db.prepare(`
      SELECT id, shortId, userId, type, createdAt, expiresAt, 
        launchAt, isActive, customization, settings
      FROM Page WHERE shortId = ?
    `).bind(shortId).first();

    if (!result) return null;

    return {
      ...result,
      isActive: Boolean(result.isActive),
      customization: JSON.parse(result.customization as string),
      settings: JSON.parse(result.settings as string)
    } as Page;
  }

  async updatePage(id: string, userId: string, request: UpdatePageRequest): Promise<Page | null> {
    const page = await this.getPageById(id);
    if (!page || page.userId !== userId) return null;

    const updates = {
      expiresAt: request.expiresAt !== undefined ? request.expiresAt : page.expiresAt,
      launchAt: request.launchAt !== undefined ? request.launchAt : page.launchAt,
      isActive: request.isActive !== undefined ? request.isActive : page.isActive,
      customization: request.customization ? {...page.customization, ...request.customization} : page.customization,
      settings: request.settings ? {...page.settings, ...request.settings} : page.settings
    };

    await this.db.prepare(`
      UPDATE Page 
      SET expiresAt = ?, launchAt = ?, isActive = ?,
          customization = ?, settings = ?
      WHERE id = ? AND userId = ?
    `).bind(
      updates.expiresAt,
      updates.launchAt,
      updates.isActive ? 1 : 0,
      JSON.stringify(updates.customization),
      JSON.stringify(updates.settings),
      id,
      userId
    ).run();

    return {
      ...page,
      ...updates
    };
  }

  async deletePage(id: string, userId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM Page 
      WHERE id = ? AND userId = ?
    `).bind(id, userId).run();

    return result.success;
  }

  async listUserPages(userId: string, limit = 20, offset = 0, type?: PageType): Promise<Page[]> {
    let query = `
      SELECT id, shortId, userId, type, createdAt, expiresAt, 
        launchAt, isActive, customization, settings
      FROM Page 
      WHERE userId = ?
    `;
    
    const params: Array<string | number> = [userId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit.toString(), offset.toString());
    
    const result = await this.db.prepare(query).bind(...params).all();
    
    return (result.results as any[]).map(row => ({
      ...row,
      isActive: Boolean(row.isActive),
      customization: JSON.parse(row.customization),
      settings: JSON.parse(row.settings)
    })) as Page[];
  }

  // Page Content operations
  async createPageContent(pageId: string, userId: string, request: CreatePageContentRequest): Promise<PageContent | null> {
    // Verify page belongs to user
    const page = await this.getPageById(pageId);
    if (!page || page.userId !== userId) return null;
    
    const id = uuidv7();
    
    const content: PageContent = {
      id,
      pageId,
      contentType: request.contentType,
      productId: request.productId,
      title: request.title,
      description: request.description,
      priceInCents: request.priceInCents,
      currency: request.currency,
      metadata: request.metadata || {}
    };

    await this.db.prepare(`
      INSERT INTO PageContent (
        id, pageId, contentType, productId, title, 
        description, priceInCents, currency, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      content.id,
      content.pageId,
      content.contentType,
      content.productId || null,
      content.title,
      content.description,
      content.priceInCents,
      content.currency,
      JSON.stringify(content.metadata)
    ).run();

    return content;
  }

  async getPageContentById(id: string): Promise<PageContent | null> {
    const result = await this.db.prepare(`
      SELECT id, pageId, contentType, productId, title, 
        description, priceInCents, currency, metadata
      FROM PageContent WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    return {
      ...result,
      metadata: JSON.parse(result.metadata as string)
    } as PageContent;
  }

  async getPageContents(pageId: string): Promise<PageContent[]> {
    const result = await this.db.prepare(`
      SELECT id, pageId, contentType, productId, title, 
        description, priceInCents, currency, metadata
      FROM PageContent WHERE pageId = ?
    `).bind(pageId).all();

    return (result.results as any[]).map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata)
    })) as PageContent[];
  }

  async updatePageContent(id: string, pageId: string, userId: string, updates: Partial<CreatePageContentRequest>): Promise<PageContent | null> {
    // Verify page belongs to user
    const page = await this.getPageById(pageId);
    if (!page || page.userId !== userId) return null;
    
    const content = await this.getPageContentById(id);
    if (!content || content.pageId !== pageId) return null;

    const updateFields = [];
    const params = [];

    // Build dynamic update query
    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      params.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      params.push(updates.description);
    }
    if (updates.priceInCents !== undefined) {
      updateFields.push('priceInCents = ?');
      params.push(updates.priceInCents);
    }
    if (updates.currency !== undefined) {
      updateFields.push('currency = ?');
      params.push(updates.currency);
    }
    if (updates.metadata !== undefined) {
      updateFields.push('metadata = ?');
      params.push(JSON.stringify({...content.metadata, ...updates.metadata}));
    }
    
    if (updateFields.length === 0) return content;

    const query = `
      UPDATE PageContent 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND pageId = ?
    `;
    params.push(id, pageId);

    await this.db.prepare(query).bind(...params).run();

    return this.getPageContentById(id);
  }

  async deletePageContent(id: string, pageId: string, userId: string): Promise<boolean> {
    // Verify page belongs to user
    const page = await this.getPageById(pageId);
    if (!page || page.userId !== userId) return false;

    const result = await this.db.prepare(`
      DELETE FROM PageContent 
      WHERE id = ? AND pageId = ?
    `).bind(id, pageId).run();

    return result.success;
  }

  // Registration operations
  async createRegistration(pageId: string, request: CreateRegistrationRequest): Promise<Registration> {
    const id = uuidv7();
    const now = new Date().toISOString();
    
    const registration: Registration = {
      id,
      pageId,
      email: request.email,
      name: request.name,
      phone: request.phone,  // Phone is already optional in the type
      registeredAt: now,
      customFields: request.customFields || {}
    };

    await this.db.prepare(`
      INSERT INTO Registration (
        id, pageId, email, name, phone,
        registeredAt, customFields
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      registration.id,
      registration.pageId,
      registration.email,
      registration.name,
      registration.phone,
      registration.registeredAt,
      JSON.stringify(registration.customFields)
    ).run();

    return registration;
  }

  async getRegistrations(pageId: string, userId: string, limit = 100, offset = 0): Promise<Registration[]> {
    // Verify page belongs to user
    const page = await this.getPageById(pageId);
    if (!page || page.userId !== userId) return [];
    
    const result = await this.db.prepare(`
      SELECT id, pageId, email, name, phone, registeredAt, customFields
      FROM Registration 
      WHERE pageId = ? 
      ORDER BY registeredAt DESC
      LIMIT ? OFFSET ?
    `).bind(pageId, limit, offset).all();

    return (result.results as any[]).map(row => ({
      ...row,
      customFields: JSON.parse(row.customFields)
    })) as Registration[];
  }

  async getRegistrationCount(pageId: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM Registration 
      WHERE pageId = ?
    `).bind(pageId).first();

    return (result?.count as number) || 0;
  }

  async getUserPagesCount(userId: string, type?: PageType): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM Page 
      WHERE userId = ?
    `;
    
    const params: Array<string> = [userId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    const result = await this.db.prepare(query).bind(...params).first();
    return (result?.count as number) || 0;
  }
}