import { Context } from 'hono';
import { Env } from '../../../types';
import { ContentService } from '../services/ContentService';
import { 
  CreatePageContentRequestSchema,
  PageContent
} from '../models/schemas';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';

// Helper function to serialize PageContent to JSON-safe object
function serializeContent(content: PageContent) {
  return {
    ...content,
    priceInCents: Number(content.priceInCents),
    metadata: content.metadata || {}
  };
}

export const createPageContent = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const body = await c.req.json();

    // Validate request with Zod
    const result = CreatePageContentRequestSchema.safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid page content data', 'ValidationError', 400);
    }

    const contentService = new ContentService(c.env.DB);
    const content = await contentService.createPageContent(pageId, userId, result.data);

    if (!content) {
      return formatError(c, 'Page not found or you do not have permission to update it', 'ResourceNotFound', 404);
    }

    return formatResponse(c, serializeContent(content), 201);
  } catch (error) {
    console.error('Error creating page content:', error);
    return format500Error(error as Error);
  }
}

export const getPageContent = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const contentId = c.req.param('contentId');
    
    const contentService = new ContentService(c.env.DB);
    const content = await contentService.getPageContentById(contentId);
    
    if (!content) {
      return formatError(c, 'Content not found', 'ResourceNotFound', 404);
    }
    
    // Check if content belongs to the specified page
    if (content.pageId !== pageId) {
      return formatError(c, 'Content not found for this page', 'ResourceNotFound', 404);
    }
    
    return formatResponse(c, serializeContent(content));
  } catch (error) {
    console.error('Error getting page content:', error);
    return format500Error(error as Error);
  }
}

export const listPageContents = async (c: Context<{ Bindings: Env }>) => {
  try {
    const pageId = c.req.param('pageId');
    
    const contentService = new ContentService(c.env.DB);
    const contents = await contentService.getPageContents(pageId);
    
    return formatResponse(c, contents.map(content => serializeContent(content)));
  } catch (error) {
    console.error('Error listing page contents:', error);
    return format500Error(error as Error);
  }
}

export const updatePageContent = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const contentId = c.req.param('contentId');
    const body = await c.req.json();
    
    // Validate request with Zod
    const result = CreatePageContentRequestSchema.partial().safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid page content data', 'ValidationError', 400);
    }
    
    const contentService = new ContentService(c.env.DB);
    const content = await contentService.updatePageContent(contentId, pageId, userId, result.data);
    
    if (!content) {
      return formatError(c, 'Content not found or you do not have permission to update it', 'ResourceNotFound', 404);
    }
    
    return formatResponse(c, serializeContent(content));
  } catch (error) {
    console.error('Error updating page content:', error);
    return format500Error(error as Error);
  }
}

export const deletePageContent = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const contentId = c.req.param('contentId');
    
    const contentService = new ContentService(c.env.DB);
    const deleted = await contentService.deletePageContent(contentId, pageId, userId);
    
    if (!deleted) {
      return formatError(c, 'Content not found or you do not have permission to delete it', 'ResourceNotFound', 404);
    }
    
    return formatResponse(c, { success: true });
  } catch (error) {
    console.error('Error deleting page content:', error);
    return format500Error(error as Error);
  }
} 