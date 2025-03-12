import { Context } from 'hono';
import { Env } from '../../../types';
import { PageDatabaseService } from '../services/db';
import { ValidationService } from '../services/validation';
import { CreatePageContentRequest, PageContent } from '../types';
import { formatResponse, formatError } from '../../../utils/api-response';

export class ContentController {
  private dbService: PageDatabaseService;
  private validationService: ValidationService;

  constructor(env: Env) {
    this.dbService = new PageDatabaseService(env.DB);
    this.validationService = new ValidationService();
  }

  // Helper method to serialize PageContent to JSON-safe object
  private serializeContent(content: PageContent) {
    return {
      ...content,
      priceInCents: Number(content.priceInCents),
      metadata: content.metadata || {}
    };
  }

  async createPageContent(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      const body = await c.req.json() as CreatePageContentRequest;

      // Validate request
      const validationErrors = this.validationService.validatePageContentRequest(body);
      if (validationErrors.length > 0) {
        return formatError(c, 'Invalid page content data', 'ValidationError', 400);
      }

      // Create page content
      const content = await this.dbService.createPageContent(pageId, userId, body);

      if (!content) {
        return formatError(c, 'Page not found or you do not have permission to update it', 'ResourceNotFound', 404);
      }

      return formatResponse(c, this.serializeContent(content), 201);
    } catch (error) {
      console.error('Error creating page content:', error);
      return formatError(c, 'Error creating page content', 'InternalServerError', 500);
    }
  }

  async getPageContent(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      const contentId = c.req.param('contentId');

      // Verify page belongs to user
      const page = await this.dbService.getPageById(pageId);
      if (!page || page.userId !== userId) {
        return formatError(c, 'Page not found or you do not have permission to access it', 'ResourceNotFound', 404);
      }

      const content = await this.dbService.getPageContentById(contentId);

      if (!content || content.pageId !== pageId) {
        return formatError(c, 'Content not found', 'ResourceNotFound', 404);
      }

      return formatResponse(c, this.serializeContent(content), 200);
    } catch (error) {
      console.error('Error fetching page content:', error);
      return formatError(c, 'Error fetching page content', 'InternalServerError', 500);
    }
  }

  async listPageContents(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');

      // Verify page belongs to user
      const page = await this.dbService.getPageById(pageId);
      if (!page || page.userId !== userId) {
        return formatError(c, 'Page not found or you do not have permission to access it', 'ResourceNotFound', 404);
      }

      const contents = await this.dbService.getPageContents(pageId);
      
      return formatResponse(c, { 
        contents: contents.map(content => this.serializeContent(content)) 
      }, 200);
    } catch (error) {
      console.error('Error listing page contents:', error);
      return formatError(c, 'Error listing page contents', 'InternalServerError', 500);
    }
  }

  async updatePageContent(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      const contentId = c.req.param('contentId');
      const body = await c.req.json() as Partial<CreatePageContentRequest>;

      // Update the content
      const updatedContent = await this.dbService.updatePageContent(contentId, pageId, userId, body);

      if (!updatedContent) {
        return formatError(c, 'Content not found or you do not have permission to update it', 'ResourceNotFound', 404);
      }

      return formatResponse(c, this.serializeContent(updatedContent), 200);
    } catch (error) {
      console.error('Error updating page content:', error);
      return formatError(c, 'Error updating page content', 'InternalServerError', 500);
    }
  }

  async deletePageContent(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      const contentId = c.req.param('contentId');

      // Delete the content
      const success = await this.dbService.deletePageContent(contentId, pageId, userId);

      if (!success) {
        return formatError(c, 'Content not found or you do not have permission to delete it', 'ResourceNotFound', 404);
      }

      return formatResponse(c, { success: true }, 200);
    } catch (error) {
      console.error('Error deleting page content:', error);
      return formatError(c, 'Error deleting page content', 'InternalServerError', 500);
    }
  }
}