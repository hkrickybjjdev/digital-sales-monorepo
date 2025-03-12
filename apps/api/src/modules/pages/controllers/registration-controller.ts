import { Context } from 'hono';
import { Env } from '../../../types';
import { PageDatabaseService } from '../services/db';
import { PageCacheService } from '../services/cache';
import { ValidationService } from '../services/validation';
import { CreateRegistrationRequest, Registration } from '../types';
import { formatResponse, formatPaginatedResponse, formatError, format500Error } from '../../../utils/api-response';

export class RegistrationController {
  private dbService: PageDatabaseService;
  private cacheService: PageCacheService;
  private validationService: ValidationService;

  constructor(env: Env) {
    this.dbService = new PageDatabaseService(env.DB);
    this.cacheService = new PageCacheService(env.PAGES_METADATA);
    this.validationService = new ValidationService();
  }

  // Helper method to serialize Registration to JSON-safe object
  private serializeRegistration(registration: Registration) {
    return {
      ...registration,
      registeredAt: registration.registeredAt.toString(),
      customFields: registration.customFields || {}
    };
  }

  async createRegistration(c: Context<{ Bindings: Env }>) {
    try {
      const shortId = c.req.param('shortId');
      const body = await c.req.json() as CreateRegistrationRequest;

      // Validate request
      const validationErrors = this.validationService.validateRegistrationRequest(body);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid registration data', 'ValidationError', 400);
      }

      // Get page
      const page = await this.dbService.getPageByShortId(shortId);
      
      if (!page) {
        return formatError(c, 'Page not found', 'ResourceNotFound', 404);
      }
      
      // Check if page is active
      if (!page.isActive) {
        return formatError(c, 'This page is no longer active', 'PageInactive', 400);
      }
      
      // Check if page is expired
      if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
        return formatError(c, 'This page has expired', 'PageExpired', 400);
      }
      
      // Check if page is not yet launched
      if (page.launchAt && new Date(page.launchAt) > new Date()) {
        return formatError(c, 'This page is not yet available', 'PageNotLaunched', 400);
      }
      
      // For event registration pages, check if registration limit is reached
      if (page.type === 'event-registration') {
        const settings = page.settings as any;
        
        if (settings.maxAttendees) {
          const registrationCount = await this.dbService.getRegistrationCount(page.id);
          
          if (registrationCount >= settings.maxAttendees && !settings.waitlistEnabled) {
            return formatError(c, 'Registration limit has been reached', 'RegistrationLimitReached', 400);
          }
        }
      }

      // Create registration
      const registration = await this.dbService.createRegistration(page.id, body);
      
      // Update conversion stats
      await this.cacheService.incrementConversions(page.id, page.shortId);
      
      return formatResponse(
        c,
        {
          success: true,
          registration: this.serializeRegistration({
            id: registration.id,
            registeredAt: registration.registeredAt
          } as Registration)
        }, 
        201
      );
    } catch (error) {
      console.error('Error creating registration:', error);
      return format500Error(error as Error);
    }
  }

  async listRegistrations(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      const queryParams = c.req.query();
      
      const limit = parseInt(queryParams.limit || '100', 10);
      const offset = parseInt(queryParams.offset || '0', 10);
      
      // Get registrations
      const registrations = await this.dbService.getRegistrations(pageId, userId, limit, offset);
      
      // Get registration count
      const count = await this.dbService.getRegistrationCount(pageId);
      
      return formatPaginatedResponse(
        c,
        registrations.map(reg => this.serializeRegistration(reg)),
        count,
        Math.floor(offset / limit) + 1,
        limit,
        new URL(c.req.url),
        200        
      );
    } catch (error) {
      console.error('Error listing registrations:', error);
      return format500Error(error as Error);
    }
  }

  async exportRegistrations(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      
      // Verify page belongs to user
      const page = await this.dbService.getPageById(pageId);
      if (!page || page.userId !== userId) {
        return formatError(c, 'Page not found or you do not have permission to access it', 'ResourceNotFound', 404);
      }
      
      // Get all registrations for the page
      const registrations = await this.dbService.getRegistrations(pageId, userId, 1000, 0);
      
      // Convert to CSV format
      let csv = 'Email,Name,Phone,Registration Date\n';
      
      registrations.forEach(reg => {
        const phone = reg.phone || '';
        const date = new Date(reg.registeredAt).toLocaleDateString();
        csv += `"${reg.email}","${reg.name}","${phone}","${date}"\n`;
      });
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="registrations-${pageId}.csv"`          
        }
      });
    } catch (error) {
      console.error('Error exporting registrations:', error);
      return format500Error(error as Error);
    }
  }
}