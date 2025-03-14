import { Context } from 'hono';
import { Env } from '../../../types';
import { 
  CreatePageContentRequestSchema,
  PageContent
} from '../models/schemas';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';
import { getPagesContainer } from '../di/container';

// Helper function to serialize PageContent to JSON-safe object
function serializeContent(content: PageContent) {
  return {
    ...content,
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

    const container = getPagesContainer(c.env);
    const content = await container.contentService.createPageContent(pageId, userId, result.data);
    
    if (!content) {
      return formatError(c, 'Page not found or access denied', 'ResourceNotFound', 404);
    }

    return formatResponse(c, serializeContent(content), 201);
  } catch (error) {
    console.error('Content creation error:', error);
    return format500Error(error as Error);
  }
};

export const getPageContent = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const contentId = c.req.param('contentId');

    const container = getPagesContainer(c.env);
    
    // First verify page ownership
    const page = await container.pageService.getPageById(pageId);
    if (!page || page.userId !== userId) {
      return formatError(c, 'Page not found or access denied', 'ResourceNotFound', 404);
    }
    
    const content = await container.contentService.getPageContentById(contentId);
    
    if (!content || content.pageId !== pageId) {
      return formatError(c, 'Content not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, serializeContent(content));
  } catch (error) {
    console.error('Content retrieval error:', error);
    return format500Error(error as Error);
  }
};

export const listPageContents = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');

    const container = getPagesContainer(c.env);
    
    // First verify page ownership
    const page = await container.pageService.getPageById(pageId);
    if (!page || page.userId !== userId) {
      return formatError(c, 'Page not found or access denied', 'ResourceNotFound', 404);
    }
    
    const contents = await container.contentService.getPageContents(pageId);
    
    return formatResponse(c, contents.map(serializeContent));
  } catch (error) {
    console.error('Content listing error:', error);
    return format500Error(error as Error);
  }
};

export const updatePageContent = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const contentId = c.req.param('contentId');
    const body = await c.req.json();

    // Validate request with Zod (partial schema for updates)
    const result = CreatePageContentRequestSchema.partial().safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid page content data', 'ValidationError', 400);
    }

    const container = getPagesContainer(c.env);
    const updatedContent = await container.contentService.updatePageContent(
      contentId,
      pageId,
      userId,
      result.data
    );
    
    if (!updatedContent) {
      return formatError(c, 'Content not found or access denied', 'ResourceNotFound', 404);
    }

    return formatResponse(c, serializeContent(updatedContent));
  } catch (error) {
    console.error('Content update error:', error);
    return format500Error(error as Error);
  }
};

export const deletePageContent = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const contentId = c.req.param('contentId');

    const container = getPagesContainer(c.env);
    const deleted = await container.contentService.deletePageContent(contentId, pageId, userId);
    
    if (!deleted) {
      return formatError(c, 'Content not found or access denied', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { success: true });
  } catch (error) {
    console.error('Content deletion error:', error);
    return format500Error(error as Error);
  }
};