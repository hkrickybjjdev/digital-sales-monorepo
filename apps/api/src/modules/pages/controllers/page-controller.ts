import { Context } from 'hono';
import { Env } from '../../../types';
import { PageDatabaseService } from '../services/db';
import { PageCacheService } from '../services/cache';
import { ValidationService } from '../services/validation';
import { 
  CreatePageRequest,
  UpdatePageRequest,
  PageType
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

  async getPublicPage(c: Context<{ Bindings: Env }>) {
    const shortId = c.req.param('shortId');
    
    try {
      // Try cache first for active pages
      let page = await this.cacheService.getPageFromCache(shortId);
      
      if (!page) {
        // If not in cache, get from DB
        page = await this.dbService.getPageByShortId(shortId);
        
        if (!page) {
          return c.json({ error: 'Page not found' }, 404);
        }
        
        // Cache page if active
        if (page.isActive) {
          await this.cacheService.cachePage(page);
        }
      }
      
      // Check if page is expired
      if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
        return c.json({ error: 'This page has expired', pageId: page.id }, 404);
      }
      
      // Check if page is not yet launched
      if (page.launchAt && new Date(page.launchAt) > new Date()) {
        return c.json({ error: 'This page is not yet available', pageId: page.id }, 404);
      }
      
      // Increment page view stats
      await this.cacheService.incrementPageViews(page.id, page.shortId);
      
      // Get page content
      const pageContents = await this.dbService.getPageContents(page.id);
      
      return c.json({ 
        page: {
          id: page.id,
          shortId: page.shortId,
          type: page.type,
          customization: page.customization,
          settings: page.settings,
        },
        contents: pageContents
      });
    } catch (error) {
      console.error('Error fetching page:', error);
      return c.json({ error: 'Error fetching page' }, 500);
    }
  }

  async createPage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const body = await c.req.json() as CreatePageRequest;
      
      // Validate request
      const validationErrors = this.validationService.validatePageRequest(body);
      if (validationErrors.length > 0) {
        return c.json({ errors: validationErrors }, 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, body);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return c.json(page, 201);
    } catch (error) {
      console.error('Error creating page:', error);
      return c.json({ error: 'Error creating page' }, 500);
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
        return c.json({ errors: validationErrors }, 400);
      }
      
      // Update page
      const page = await this.dbService.updatePage(id, userId, body);
      
      if (!page) {
        return c.json({ error: 'Page not found or you do not have permission to update it' }, 404);
      }
      
      // Update cache or invalidate based on active status
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      } else {
        await this.cacheService.invalidatePageCache(page.shortId);
      }
      
      return c.json(page);
    } catch (error) {
      console.error('Error updating page:', error);
      return c.json({ error: 'Error updating page' }, 500);
    }
  }

  async deletePage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const id = c.req.param('id');
      
      // Get page short ID before deletion
      const page = await this.dbService.getPageById(id);
      if (!page) {
        return c.json({ error: 'Page not found' }, 404);
      }
      
      if (page.userId !== userId) {
        return c.json({ error: 'You do not have permission to delete this page' }, 403);
      }
      
      const shortId = page.shortId;
      
      // Delete page
      const success = await this.dbService.deletePage(id, userId);
      
      if (!success) {
        return c.json({ error: 'Failed to delete page' }, 500);
      }
      
      // Invalidate cache
      await this.cacheService.invalidatePageCache(shortId);
      
      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting page:', error);
      return c.json({ error: 'Error deleting page' }, 500);
    }
  }

  async getPage(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const id = c.req.param('id');
      
      const page = await this.dbService.getPageById(id);
      
      if (!page) {
        return c.json({ error: 'Page not found' }, 404);
      }
      
      if (page.userId !== userId) {
        return c.json({ error: 'You do not have permission to access this page' }, 403);
      }
      
      // Get page content
      const pageContents = await this.dbService.getPageContents(page.id);
      
      // Get page stats
      const stats = await this.cacheService.getPageStats(page.id);
      
      return c.json({ 
        page,
        contents: pageContents,
        stats
      });
    } catch (error) {
      console.error('Error fetching page:', error);
      return c.json({ error: 'Error fetching page' }, 500);
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
      
      return c.json({ pages });
    } catch (error) {
      console.error('Error listing pages:', error);
      return c.json({ error: 'Error listing pages' }, 500);
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
        return c.json({ errors: validationErrors }, 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return c.json(page, 201);
    } catch (error) {
      console.error('Error creating countdown page:', error);
      return c.json({ error: 'Error creating countdown page' }, 500);
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
        return c.json({ errors: validationErrors }, 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return c.json(page, 201);
    } catch (error) {
      console.error('Error creating flash sale page:', error);
      return c.json({ error: 'Error creating flash sale page' }, 500);
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
        return c.json({ errors: validationErrors }, 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return c.json(page, 201);
    } catch (error) {
      console.error('Error creating event registration page:', error);
      return c.json({ error: 'Error creating event registration page' }, 500);
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
        return c.json({ errors: validationErrors }, 400);
      }
      
      // Create page
      const page = await this.dbService.createPage(userId, pageRequest);
      
      // Cache page if active
      if (page.isActive) {
        await this.cacheService.cachePage(page);
      }
      
      return c.json(page, 201);
    } catch (error) {
      console.error('Error creating limited offer page:', error);
      return c.json({ error: 'Error creating limited offer page' }, 500);
    }
  }
}