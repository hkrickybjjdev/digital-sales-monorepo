import { Context } from 'hono';
import { Env } from '../../../types';
import { PageDatabaseService } from '../services/db';
import { ValidationService } from '../services/validation';
import { CreatePageContentRequest } from '../types';

export class ContentController {
  private dbService: PageDatabaseService;
  private validationService: ValidationService;

  constructor(env: Env) {
    this.dbService = new PageDatabaseService(env.DB);
    this.validationService = new ValidationService();
  }

  async createPageContent(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');
      const body = await c.req.json() as CreatePageContentRequest;

      // Validate request
      const validationErrors = this.validationService.validatePageContentRequest(body);
      if (validationErrors.length > 0) {
        return c.json({ errors: validationErrors }, 400);
      }

      // Create page content
      const content = await this.dbService.createPageContent(pageId, userId, body);

      if (!content) {
        return c.json({ error: 'Page not found or you do not have permission to update it' }, 404);
      }

      return c.json(content, 201);
    } catch (error) {
      console.error('Error creating page content:', error);
      return c.json({ error: 'Error creating page content' }, 500);
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
        return c.json({ error: 'Page not found or you do not have permission to access it' }, 404);
      }

      const content = await this.dbService.getPageContentById(contentId);

      if (!content || content.pageId !== pageId) {
        return c.json({ error: 'Content not found' }, 404);
      }

      return c.json(content);
    } catch (error) {
      console.error('Error fetching page content:', error);
      return c.json({ error: 'Error fetching page content' }, 500);
    }
  }

  async listPageContents(c: Context<{ Bindings: Env }>) {
    try {
      const userId = c.get('jwtPayload').sub;
      const pageId = c.req.param('pageId');

      // Verify page belongs to user
      const page = await this.dbService.getPageById(pageId);
      if (!page || page.userId !== userId) {
        return c.json({ error: 'Page not found or you do not have permission to access it' }, 404);
      }

      const contents = await this.dbService.getPageContents(pageId);

      return c.json({ contents });
    } catch (error) {
      console.error('Error listing page contents:', error);
      return c.json({ error: 'Error listing page contents' }, 500);
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
        return c.json({ error: 'Content not found or you do not have permission to update it' }, 404);
      }

      return c.json(updatedContent);
    } catch (error) {
      console.error('Error updating page content:', error);
      return c.json({ error: 'Error updating page content' }, 500);
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
        return c.json({ error: 'Content not found or you do not have permission to delete it' }, 404);
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting page content:', error);
      return c.json({ error: 'Error deleting page content' }, 500);
    }
  }
}