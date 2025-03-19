import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { getService } from '../di/container';
import { createPageSchema, savePageDraftSchema, publishPageSchema } from '../models/schemas';

// Create a new page
export const createPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();

    // Validate the input
    const parseResult = createPageSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;
    
    try {
      const pageService = getService(c.env, 'pageService');
      const page = await pageService.createPage(data);
      return formatResponse(c, { page }, 201);
    } catch (serviceError) {
      return formatError(c, (serviceError as Error).message, 'ServiceError', 400);
    }
  } catch (error) {
    console.error('Create page error:', error);
    return format500Error(error as Error);
  }
};

// Get a page by ID
export const getPageById = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return formatError(c, 'Invalid page ID', 'ValidationError', 400);
    }

    const pageService = getService(c.env, 'pageService');
    const page = await pageService.getPageById(id);

    if (!page) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { page });
  } catch (error) {
    console.error('Get page by ID error:', error);
    return format500Error(error as Error);
  }
};

// Get a page by slug
export const getPageBySlug = async (c: Context<{ Bindings: Env }>) => {
  try {
    const slug = c.req.param('slug');
    const pageService = getService(c.env, 'pageService');
    const page = await pageService.getPageBySlug(slug);

    if (!page) {
      return formatError(c, 'Page not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { page });
  } catch (error) {
    console.error('Get page by slug error:', error);
    return format500Error(error as Error);
  }
};

// Get page with version details by ID
export const getPageWithVersionById = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return formatError(c, 'Invalid page ID', 'ValidationError', 400);
    }

    const languageCode = c.req.query('languageCode') || 'en';
    const pageService = getService(c.env, 'pageService');
    const pageWithVersion = await pageService.getPageWithVersionDetails(id, languageCode);

    if (!pageWithVersion) {
      return formatError(
        c,
        'Page not found or no published version exists',
        'ResourceNotFound',
        404
      );
    }

    return formatResponse(c, { page: pageWithVersion });
  } catch (error) {
    console.error('Get page with version by ID error:', error);
    return format500Error(error as Error);
  }
};

// Get page with version details by slug
export const getPageWithVersionBySlug = async (c: Context<{ Bindings: Env }>) => {
  try {
    const slug = c.req.param('slug');
    const languageCode = c.req.query('languageCode') || 'en';
    const pageService = getService(c.env, 'pageService');
    const pageWithVersion = await pageService.getPageBySlugWithVersionDetails(
      slug,
      languageCode
    );

    if (!pageWithVersion) {
      return formatError(
        c,
        'Page not found or no published version exists',
        'ResourceNotFound',
        404
      );
    }

    return formatResponse(c, { page: pageWithVersion });
  } catch (error) {
    console.error('Get page with version by slug error:', error);
    return format500Error(error as Error);
  }
};

// Save page draft
export const savePageDraft = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();

    // Validate the input
    const parseResult = savePageDraftSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;
    
    try {
      const pageService = getService(c.env, 'pageService');
      const pageVersion = await pageService.savePageDraft(data);
      return formatResponse(c, { pageVersion });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('not found')) {
        return formatError(c, (serviceError as Error).message, 'ResourceNotFound', 404);
      }
      return formatError(c, (serviceError as Error).message, 'ServiceError', 400);
    }
  } catch (error) {
    console.error('Save page draft error:', error);
    return format500Error(error as Error);
  }
};

// Publish page
export const publishPage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();

    // Validate the input
    const parseResult = publishPageSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;
    
    try {
      const pageService = getService(c.env, 'pageService');
      const pageVersion = await pageService.publishPage(data);
      return formatResponse(c, { pageVersion });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('not found')) {
        return formatError(c, (serviceError as Error).message, 'ResourceNotFound', 404);
      }
      return formatError(c, (serviceError as Error).message, 'ServiceError', 400);
    }
  } catch (error) {
    console.error('Publish page error:', error);
    return format500Error(error as Error);
  }
};

// Delete page
export const deletePage = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return formatError(c, 'Invalid page ID', 'ValidationError', 400);
    }

    try {
      const pageService = getService(c.env, 'pageService');
      const success = await pageService.deletePage(id);
      if (!success) {
        return formatError(c, 'Failed to delete page', 'ServiceError', 500);
      }
      return formatResponse(c, { success: true, message: 'Page deleted successfully' });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('not found')) {
        return formatError(c, (serviceError as Error).message, 'ResourceNotFound', 404);
      }
      return formatError(c, (serviceError as Error).message, 'ServiceError', 400);
    }
  } catch (error) {
    console.error('Delete page error:', error);
    return format500Error(error as Error);
  }
};
