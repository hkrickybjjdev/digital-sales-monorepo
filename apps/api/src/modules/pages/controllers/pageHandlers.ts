import { Context } from 'hono';
import { Env } from '../../../types';
import { PageService } from '../services/PageService';
import { 
  CreatePageRequestSchema,
  UpdatePageRequestSchema,
  Page
} from '../models/schemas';
import { formatResponse, formatError, formatPaginatedResponse, format500Error } from '../../../utils/api-response';

// Helper function to serialize Page to JSON-safe object
function serializePage(page: Page) {
  return {
    ...page,
    settings: page.settings || {},
    customization: page.customization || {},
    createdAt: page.createdAt.toString(),
    expiresAt: page.expiresAt?.toString() || null,
    launchAt: page.launchAt?.toString() || null
  };
}

export const getPublicPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const shortId = c.req.param('shortId');
    const pageService = new PageService(c.env.DB, c.env.PAGES_METADATA);
    
    const page = await pageService.getPageByShortId(shortId);
    
    if (!page) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }
    
    // For public pages, only return if active
    if (!page.isActive) {
      return formatError(c, 'This page is not active', 'PageInactive', 404);
    }
    
    // Check if page has expired
    if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
      return formatError(c, 'This page has expired', 'PageExpired', 404);
    }
    
    // Check if page has launched
    if (page.launchAt && new Date(page.launchAt) > new Date()) {
      return formatError(c, 'This page has not launched yet', 'PageNotLaunched', 404);
    }
    
    return formatResponse(c, serializePage(page));
  } catch (error) {
    console.error('Error getting public page:', error);
    return format500Error(error as Error);
  }
}

export const createPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const body = await c.req.json();
    
    // Validate request with Zod
    const result = CreatePageRequestSchema.safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid page data', 'ValidationError', 400);
    }
    
    const pageService = new PageService(c.env.DB, c.env.PAGES_METADATA);
    const page = await pageService.createPage(userId, result.data);
    
    return formatResponse(c, serializePage(page), 201);
  } catch (error) {
    console.error('Error creating page:', error);
    return format500Error(error as Error);
  }
}

export const updatePage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate request with Zod
    const result = UpdatePageRequestSchema.safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid page data', 'ValidationError', 400);
    }
    
    const pageService = new PageService(c.env.DB, c.env.PAGES_METADATA);
    const page = await pageService.updatePage(id, userId, result.data);
    
    if (!page) {
      return formatError(c, 'Page not found or you do not have permission to update it', 'ResourceNotFound', 404);
    }
    
    return formatResponse(c, serializePage(page));
  } catch (error) {
    console.error('Error updating page:', error);
    return format500Error(error as Error);
  }
}

export const getPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const id = c.req.param('id');
    
    const pageService = new PageService(c.env.DB, c.env.PAGES_METADATA);
    const page = await pageService.getPageById(id);
    
    if (!page) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }
    
    // Check if user owns the page
    if (page.userId !== userId) {
      return formatError(c, 'You do not have permission to access this page', 'Unauthorized', 403);
    }
    
    return formatResponse(c, serializePage(page));
  } catch (error) {
    console.error('Error getting page:', error);
    return format500Error(error as Error);
  }
}

export const listPages = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const limit = Number(c.req.query('limit') || '20');
    const offset = Number(c.req.query('offset') || '0');
    const type = c.req.query('type') as any;
    
    const pageService = new PageService(c.env.DB, c.env.PAGES_METADATA);
    const { pages, total, hasMore } = await pageService.listUserPages(userId, limit, offset, type);
    
    // Create a URL object for pagination
    const url = new URL(c.req.url);
    const page = Math.floor(offset / limit) + 1;
    
    return formatPaginatedResponse(
      c,
      pages.map(page => serializePage(page)),
      total,
      page,
      limit,
      url
    );
  } catch (error) {
    console.error('Error listing pages:', error);
    return format500Error(error as Error);
  }
}

export const deletePage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const id = c.req.param('id');
    
    const pageService = new PageService(c.env.DB, c.env.PAGES_METADATA);
    const deleted = await pageService.deletePage(id, userId);
    
    if (!deleted) {
      return formatError(c, 'Page not found or you do not have permission to delete it', 'ResourceNotFound', 404);
    }
    
    return formatResponse(c, { success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return format500Error(error as Error);
  }
} 