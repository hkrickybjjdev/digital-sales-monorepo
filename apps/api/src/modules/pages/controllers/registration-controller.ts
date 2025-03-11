import { Context } from 'hono';
import { Env } from '../../../types';
import { PageDatabaseService } from '../services/db';
import { PageCacheService } from '../services/cache';
import { ValidationService } from '../services/validation';
import { CreateRegistrationRequest } from '../types';

export class RegistrationController {
  private dbService: PageDatabaseService;
  private cacheService: PageCacheService;
  private validationService: ValidationService;
  
  constructor(env: Env) {
    this.dbService = new PageDatabaseService(env.DB);
    this.cacheService = new PageCacheService(env.PAGES_METADATA);
    this.validationService = new ValidationService();
  }

  async createRegistration(c: Context<{ Bindings: Env }>) {
    try {
      const shortId = c.req.param('shortId');
      const body = await c.req.json() as CreateRegistrationRequest;

      // Validate request
      const validationErrors = this.validationService.validateRegistrationRequest(body);
      if (validationErrors.length > 0) {
        return c.json({ errors: validationErrors }, 400);
      }

      // Get page
      const page = await this.dbService.getPageByShortId(shortId);
      
      if (!page) {
        return c.json({ error: 'Page not found' }, 404);
      }
      
      // Check if page is active
      if (!page.isActive) {
        return c.json({ error: 'This page is no longer active' }, 400);
      }
      
      // Check if page is expired
      if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
        return c.json({ error: 'This page has expired' }, 400);
      }
      
      // Check if page is not yet launched
      if (page.launchAt && new Date(page.launchAt) > new Date()) {
        return c.json({ error: 'This page is not yet available' }, 400);
      }
      
      // For event registration pages, check if registration limit is reached
      if (page.type === 'event-registration') {
        const settings = page.settings as any;
        
        if (settings.maxAttendees) {
          const registrationCount = await this.dbService.getRegistrationCount(page.id);
          
          if (registrationCount >= settings.maxAttendees && !settings.waitlistEnabled) {
            return c.json({ error: 'Registration limit has been reached' }, 400);
          }
        }
      }

      // Create registration
      const registration = await this.dbService.createRegistration(page.id, body);
      
      // Update conversion stats
      await this.cacheService.incrementConversions(page.id, page.shortId);
      
      return c.json({
        success: true,
        registration: {
          id: registration.id,
          registeredAt: registration.registeredAt
        }
      }, 201);
    } catch (error) {
      console.error('Error creating registration:', error);
      return c.json({ error: 'Error creating registration' }, 500);
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
      
      return c.json({
        registrations,
        count,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error listing registrations:', error);
      return c.json({ error: 'Error listing registrations' }, 500);
    }
  }

  async exportRegistrations(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      
      // Verify page belongs to user
      const page = await this.dbService.getPageById(pageId);
      if (!page || page.userId !== userId) {
        return c.json({ error: 'Page not found or you do not have permission to access it' }, 404);
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
      return c.json({ error: 'Error exporting registrations' }, 500);
    }
  }
}