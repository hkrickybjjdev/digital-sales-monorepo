import { Context } from 'hono';

import { Env } from '../../../types';
import {
  formatResponse,
  formatError,
  formatPaginatedResponse,
  format500Error,
} from '../../../utils/api-response';
import { getPagesContainer } from '../di/container';
import { CreatePageRequestSchema, UpdatePageRequestSchema, Page } from '../models/schemas';

// Helper function to serialize Page to JSON-safe object
function serializePage(page: Page) {
  return {
    ...page,
    settings: page.settings || {},
    customization: page.customization || {},
    createdAt: page.createdAt.toString(),
    expiresAt: page.expiresAt?.toString() || null,
    launchAt: page.launchAt?.toString() || null,
  };
}

export const getPublicPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const shortId = c.req.param('shortId');
    const container = getPagesContainer(c.env);

    const page = await container.pageService.getPageByShortId(shortId);

    if (!page) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }

    // For public pages, only return if active
    if (!page.isActive) {
      return formatError(c, 'Page is not active', 'PageInactive', 404);
    }

    // Check if page has expired
    if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
      return formatError(c, 'Page has expired', 'PageExpired', 404);
    }

    // Check if page is launched yet
    if (page.launchAt && new Date(page.launchAt) > new Date()) {
      return formatError(c, 'Page is not yet available', 'PageNotLaunched', 404);
    }

    return formatResponse(c, serializePage(page));
  } catch (error) {
    console.error('Page retrieval error:', error);
    return format500Error(error as Error);
  }
};

export const createPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const body = await c.req.json();

    // Validate request with Zod
    const result = CreatePageRequestSchema.safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid page data', 'ValidationError', 400);
    }

    const container = getPagesContainer(c.env);
    const page = await container.pageService.createPage(userId, result.data);

    return formatResponse(c, serializePage(page), 201);
  } catch (error) {
    console.error('Page creation error:', error);
    return format500Error(error as Error);
  }
};

export const getPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const id = c.req.param('id');

    const container = getPagesContainer(c.env);
    const page = await container.pageService.getPageById(id);

    if (!page) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }

    // Check ownership
    if (page.userId !== userId) {
      return formatError(c, 'Access denied', 'Forbidden', 403);
    }

    return formatResponse(c, serializePage(page));
  } catch (error) {
    console.error('Page retrieval error:', error);
    return format500Error(error as Error);
  }
};

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

    const container = getPagesContainer(c.env);
    const updatedPage = await container.pageService.updatePage(id, userId, result.data);

    if (!updatedPage) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, serializePage(updatedPage));
  } catch (error) {
    console.error('Page update error:', error);
    return format500Error(error as Error);
  }
};

export const deletePage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const id = c.req.param('id');

    const container = getPagesContainer(c.env);
    const deleted = await container.pageService.deletePage(id, userId);

    if (!deleted) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return format500Error(error as Error);
  }
};

export const listPages = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;

    // Get pagination params from query
    const limit = Number(c.req.query('limit') || 20);
    const page = Number(c.req.query('page') || 1);
    const type = c.req.query('type');
    const offset = (page - 1) * limit;

    const container = getPagesContainer(c.env);
    const result = await container.pageService.listUserPages(
      userId,
      limit,
      offset,
      type as any // Cast to PageType
    );

    // Generate pagination URL
    const url = new URL(c.req.url);

    return formatPaginatedResponse(
      c,
      result.pages.map(page => serializePage(page)),
      result.total,
      page,
      limit,
      url
    );
  } catch (error) {
    console.error('Page listing error:', error);
    return format500Error(error as Error);
  }
};
