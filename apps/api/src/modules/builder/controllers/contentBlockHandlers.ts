import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { getContainer } from '../di/container';
import { predefinedContentBlockSchema } from '../models/schemas';

/**
 * Get all predefined content blocks
 * GET /api/v1/builder/content-blocks
 */
export const getAllContentBlocks = async (c: Context<{ Bindings: Env }>) => {
  try {
    const container = getContainer();
    container.initialize(c.env);

    const service = container.get('predefinedContentBlockService');
    const blocks = await service.getAll();

    return formatResponse(c, { blocks });
  } catch (error) {
    console.error('Get all content blocks error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Get a content block by type
 * GET /api/v1/builder/content-blocks/:type
 */
export const getContentBlockByType = async (c: Context<{ Bindings: Env }>) => {
  try {
    const type = c.req.param('type');

    const container = getContainer();
    container.initialize(c.env);

    const service = container.get('predefinedContentBlockService');
    const block = await service.getByType(type);

    if (!block) {
      return formatError(c, 'Content block not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { block });
  } catch (error) {
    console.error('Get content block error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Create a new content block
 * POST /api/v1/builder/content-blocks
 */
export const createContentBlock = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();

    // Validate the input
    const parseResult = predefinedContentBlockSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const blockData = parseResult.data;

    const container = getContainer();
    container.initialize(c.env);

    const service = container.get('predefinedContentBlockService');

    try {
      await service.createBlock(blockData);
      return formatResponse(c, { success: true, block: blockData }, 201);
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('already exists')) {
        return formatError(c, (serviceError as Error).message, 'ResourceAlreadyExists', 409);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Create content block error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Update an existing content block
 * PUT /api/v1/builder/content-blocks/:type
 */
export const updateContentBlock = async (c: Context<{ Bindings: Env }>) => {
  try {
    const type = c.req.param('type');
    const body = await c.req.json();

    // Validate the input
    const parseResult = predefinedContentBlockSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const blockData = parseResult.data;

    // Ensure type in URL matches the type in the body
    if (blockData.type !== type) {
      return formatError(
        c,
        'Type in URL does not match type in request body',
        'ValidationError',
        400
      );
    }

    const container = getContainer();
    container.initialize(c.env);

    const service = container.get('predefinedContentBlockService');

    try {
      await service.updateBlock(type, blockData);
      return formatResponse(c, { success: true, block: blockData });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('not found')) {
        return formatError(c, (serviceError as Error).message, 'ResourceNotFound', 404);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Update content block error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Delete a content block
 * DELETE /api/v1/builder/content-blocks/:type
 */
export const deleteContentBlock = async (c: Context<{ Bindings: Env }>) => {
  try {
    const type = c.req.param('type');

    const container = getContainer();
    container.initialize(c.env);

    const service = container.get('predefinedContentBlockService');

    try {
      await service.deleteBlock(type);
      return formatResponse(c, { success: true, message: 'Content block deleted successfully' });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('not found')) {
        return formatError(c, (serviceError as Error).message, 'ResourceNotFound', 404);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Delete content block error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Get content blocks by category
 * GET /api/v1/builder/content-blocks/category/:category
 */
export const getContentBlocksByCategory = async (c: Context<{ Bindings: Env }>) => {
  try {
    const category = c.req.param('category');

    const container = getContainer();
    container.initialize(c.env);

    const service = container.get('predefinedContentBlockService');
    const blocks = await service.getByCategory(category);

    return formatResponse(c, { blocks });
  } catch (error) {
    console.error('Get content blocks by category error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Get public content blocks
 * GET /api/v1/builder/content-blocks/public
 */
export const getPublicContentBlocks = async (c: Context<{ Bindings: Env }>) => {
  try {
    const container = getContainer();
    container.initialize(c.env);

    const service = container.get('predefinedContentBlockService');
    const blocks = await service.getPublicBlocks();

    return formatResponse(c, { blocks });
  } catch (error) {
    console.error('Get public content blocks error:', error);
    return format500Error(error as Error);
  }
};
