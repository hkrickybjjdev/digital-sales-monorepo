import { Context } from 'hono';
import { Env } from '../../../types';
import { PageDatabaseService } from '../services/db';
import { PageCacheService } from '../services/cache';
import { ValidationService } from '../services/validation';
import { formatResponse, formatError, formatPaginatedResponse, format500Error } from '../../../utils/api-response';
import { 
  CreatePageRequest,
  UpdatePageRequest,
  PageType,
  Page
} from '../types';

export class PageController {
  private dbService: PageDatabaseService;
  private cacheService: PageCacheService;
  private validationService: ValidationService;
  
  constructor(env: Env) {
    this.dbService = new PageDatabaseService(env.DB);
    this.cacheService = new PageCacheService(env.PAGES_METADATA);
    this.validationService = new ValidationService();
  }

  // Helper method to serialize Page to JSON-safe object
  private serializePage(page: Page) {
    return {
      ...page,
      settings: page.settings || {},
      customization: page.customization || {},
      createdAt: page.createdAt.toString(),
      expiresAt: page.expiresAt?.toString() || null,
      launchAt: page.launchAt?.toString() || null
    };
  }

  async getPublicPage(c: Context<{ Bindings: Env }>) {
    const shortId = c.req.param('shortId');
    
    try {
      // Try cache first for active pages
      let page = await this.cacheService.getPageFromCache(shortId);
      
      if (!page) {
        // If not in cache, get from DB
        page = await this.dbService.getPageByShortId(shortId);
        
        if (!page) {
          return formatError(c, 'Page not found', 'ResourceNotFound', 404);
        }
        
        // Cache page if active
        if (page.isActive) {
          await this.cacheService.cachePage(page);
        }
      }
      
      // Check if page is expired
      if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
        return formatError(c, 'This page has expired', 'PageExpired', 404);
      }
      
      // Check if page is not yet launched
      if (page.launchAt && new Date(page.launchAt) > new Date()) {
        return formatError(c, 'This page is not yet available', 'PageNotLaunched', 404);
      }
      
      // Increment page view stats
      await this.cacheService.incrementPageViews(page.id, page.shortId);
      
      // Get page content
      const pageContents = await this.dbService.getPageContents(page.id);
      
      return formatResponse(c,{ 
        page: this.serializePage({
          id: page.id,
          shortId: page.shortId,
          type: page.type,
          customization: page.customization,
          settings: page.settings,
        } as Page),
        contents: pageContents.map(content => ({
          ...content,
          metadata: content.metadata || {}
        }))
      }, 200);
    } catch (error) {
      console.error('Error fetching page:', error);
      return format500Error(error as Error);
    }
  }

  async createPage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const body = await c.req.json() as CreatePageRequest;
      
      // Validate request
      const validationErrors = this.validationService.validatePageRequest(body);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid page data', 'ValidationError', 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, body);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return formatResponse(c, this.serializePage(page), 201);
    } catch (error) {
      console.error('Error creating page:', error);
      return format500Error(error as Error);
    }
  }

  async updatePage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const id = c.req.param('id');
      const body = await c.req.json() as UpdatePageRequest;
      
      // Validate request
      const validationErrors = this.validationService.validatePageUpdateRequest(body);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid update data', 'ValidationError', 400);
      }
      
      // Update page
      const page = await this.dbService.updatePage(id, userId, body);
      
      if (!page) {
        return formatError(c, 'Page not found or you do not have permission to update it', 'ResourceNotFound', 404);
      }
      
      // Update cache or invalidate based on active status
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      } else {
        await this.cacheService.invalidatePageCache(page.shortId);
      }
      
      return formatResponse(c, this.serializePage(page), 200);
    } catch (error) {
      console.error('Error updating page:', error);
      return format500Error(error as Error);
    }
  }

  async getPage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const id = c.req.param('id');
      
      const page = await this.dbService.getPageById(id);
      
      if (!page) {
        return formatError(c, 'Page not found', 'ResourceNotFound', 404);
      }
      
      if (page.userId !== userId) {
        return formatError(c, 'You do not have permission to access this page', 'Forbidden', 403);
      }
      
      // Get page content
      const pageContents = await this.dbService.getPageContents(page.id);
      
      // Get page stats
      const stats = await this.cacheService.getPageStats(page.id);
      
      return formatResponse(c, { 
        page: this.serializePage(page),
        contents: pageContents.map(content => ({
          ...content,
          metadata: content.metadata || {}
        })),
        stats: stats || { views: 0, conversions: 0, conversionRate: 0 }
      }, 200);
    } catch (error) {
      console.error('Error fetching page:', error);
      return format500Error(error as Error);
    }
  }

  async listPages(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const queryParams = c.req.query();
      
      const limit = parseInt(queryParams.limit || '20', 10);
      const offset = parseInt(queryParams.offset || '0', 10);
      const type = queryParams.type as PageType || undefined;
      
      const pages = await this.dbService.listUserPages(userId, limit, offset, type);
      const totalCount = await this.dbService.getUserPagesCount(userId, type);
      
      return formatPaginatedResponse(
        c,
        pages.map(page => this.serializePage(page)),
        totalCount,
        Math.floor(offset / limit) + 1,
        limit,
        new URL(c.req.url),
        200        
      );
    } catch (error) {
      console.error('Error listing pages:', error);
      return format500Error(error as Error);
    }
  }

  async createCountdownPage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const body = await c.req.json();
      
      const pageRequest: CreatePageRequest = {
        type: 'countdown',
        ...body,
        settings: {
          countdownTarget: body.countdownTarget,
          postCountdownAction: body.postCountdownAction || 'show-message',
          redirectUrl: body.redirectUrl,
          messageTitle: body.messageTitle,
          messageContent: body.messageContent
        }
      };
      
      // Validate request
      const validationErrors = this.validationService.validatePageRequest(pageRequest);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid page data', 'ValidationError', 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return formatResponse(c, this.serializePage(page), 201);
    } catch (error) {
      console.error('Error creating countdown page:', error);
      return format500Error(error as Error);
    }
  }

  async createFlashSalePage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const body = await c.req.json();
      
      const pageRequest: CreatePageRequest = {
        type: 'flash-sale',
        ...body,
        settings: {
          saleEndTime: body.saleEndTime,
          discountPercentage: body.discountPercentage,
          originalPriceDisplay: body.originalPriceDisplay,
          inventoryLimit: body.inventoryLimit,
          soldOutAction: body.soldOutAction || 'show-message',
          postSaleRedirectUrl: body.postSaleRedirectUrl
        }
      };
      
      // Validate request
      const validationErrors = this.validationService.validatePageRequest(pageRequest);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid page data', 'ValidationError', 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return formatResponse(c, this.serializePage(page), 201);
    } catch (error) {
      console.error('Error creating flash sale page:', error);
      return format500Error(error as Error);
    }
  }

  async createEventRegistrationPage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const body = await c.req.json();
      
      const pageRequest: CreatePageRequest = {
        type: 'event-registration',
        ...body,
        settings: {
          eventStartTime: body.eventStartTime,
          eventEndTime: body.eventEndTime,
          eventLocation: body.eventLocation,
          physicalAddress: body.physicalAddress,
          virtualPlatform: body.virtualPlatform,
          platformLink: body.platformLink,
          maxAttendees: body.maxAttendees,
          waitlistEnabled: body.waitlistEnabled
        }
      };
      
      // Validate request
      const validationErrors = this.validationService.validatePageRequest(pageRequest);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid page data', 'ValidationError', 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return formatResponse(c, this.serializePage(page), 201);
    } catch (error) {
      console.error('Error creating event registration page:', error);
      return format500Error(error as Error);
    }
  }

  async createLimitedOfferPage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const body = await c.req.json();
      
      const pageRequest: CreatePageRequest = {
        type: 'limited-offer',
        ...body,
        settings: {
          offerEndTime: body.offerEndTime,
          discountCode: body.discountCode,
          bonusDescription: body.bonusDescription,
          limitedQuantity: body.limitedQuantity,
          postOfferAction: body.postOfferAction || 'show-alternate'
        }
      };
      
      // Validate request
      const validationErrors = this.validationService.validatePageRequest(pageRequest);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid page data', 'ValidationError', 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return formatResponse(c, this.serializePage(page), 201);
    } catch (error) {
      console.error('Error creating limited offer page:', error);
      return format500Error(error as Error);
    }
  }

  async deletePage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const id = c.req.param('id');
      
      // Get page short ID before deletion
      const page = await this.dbService.getPageById(id);
      if (!page) {
        return formatError(c, 'Page not found', 'ResourceNotFound', 404);
      }
      
      if (page.userId !== userId) {
        return formatError(c, 'You do not have permission to delete this page', 'Forbidden', 403);
      }
      
      const shortId = page.shortId;
      
      // Delete page
      const success = await this.dbService.deletePage(id, userId);
      
      if (!success) {
        return formatError(c, 'Failed to delete page', 'InternalServerError', 500);
      }
      
      // Invalidate cache
      await this.cacheService.invalidatePageCache(shortId);
      
      return formatResponse(c, { success: true }, 200);
    } catch (error) {
      console.error('Error deleting page:', error);
      return format500Error(error as Error);
    }
  }
}