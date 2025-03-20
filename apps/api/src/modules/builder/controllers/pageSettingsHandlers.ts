import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import {createPageSettingsDefinitionService} from "../factory";
import { pageSettingsDefinitionSchema } from '../models/schemas';

/**
 * Get all page settings definitions
 * GET /api/v1/builder/page-settings
 */
export const getAllPageSettings = async (c: Context<{ Bindings: Env }>) => {
  try {
    const service = createPageSettingsDefinitionService(c.env);
    const settings = await service.getAll();

    return formatResponse(c, { settings });
  } catch (error) {
    console.error('Get all page settings error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Get a page settings definition by name
 * GET /api/v1/builder/page-settings/:name
 */
export const getPageSettingByName = async (c: Context<{ Bindings: Env }>) => {
  try {
    const name = c.req.param('name');

    const service = createPageSettingsDefinitionService(c.env);
    const setting = await service.getByName(name);

    if (!setting) {
      return formatError(c, 'Page setting not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { setting });
  } catch (error) {
    console.error('Get page setting error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Create a new page settings definition
 * POST /api/v1/builder/page-settings
 */
export const createPageSetting = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();

    // Validate the input
    const parseResult = pageSettingsDefinitionSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const settingData = parseResult.data;

    const service = createPageSettingsDefinitionService(c.env);

    try {
      await service.createDefinition(settingData);
      return formatResponse(c, { success: true, setting: settingData }, 201);
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('already exists')) {
        return formatError(c, (serviceError as Error).message, 'ResourceAlreadyExists', 409);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Create page setting error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Update an existing page settings definition
 * PUT /api/v1/builder/page-settings/:name
 */
export const updatePageSetting = async (c: Context<{ Bindings: Env }>) => {
  try {
    const name = c.req.param('name');
    const body = await c.req.json();

    // Validate the input
    const parseResult = pageSettingsDefinitionSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const settingData = parseResult.data;

    // Ensure name in URL matches the settingName in the body
    if (settingData.settingName !== name) {
      return formatError(
        c,
        'Setting name in URL does not match settingName in request body',
        'ValidationError',
        400
      );
    }

    const service = createPageSettingsDefinitionService(c.env);

    try {
      await service.updateDefinition(name, settingData);
      return formatResponse(c, { success: true, setting: settingData });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('not found')) {
        return formatError(c, (serviceError as Error).message, 'ResourceNotFound', 404);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Update page setting error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Delete a page settings definition
 * DELETE /api/v1/builder/page-settings/:name
 */
export const deletePageSetting = async (c: Context<{ Bindings: Env }>) => {
  try {
    const name = c.req.param('name');

    const service = createPageSettingsDefinitionService(c.env);

    try {
      await service.deleteDefinition(name);
      return formatResponse(c, { success: true, message: 'Page setting deleted successfully' });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('not found')) {
        return formatError(c, (serviceError as Error).message, 'ResourceNotFound', 404);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Delete page setting error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Get page settings definitions by category
 * GET /api/v1/builder/page-settings/category/:category
 */
export const getPageSettingsByCategory = async (c: Context<{ Bindings: Env }>) => {
  try {
    const category = c.req.param('category');

    const service = createPageSettingsDefinitionService(c.env);
    const settings = await service.getByCategory(category);

    return formatResponse(c, { settings });
  } catch (error) {
    console.error('Get page settings by category error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Get page settings definitions by group
 * GET /api/v1/builder/page-settings/group/:group
 */
export const getPageSettingsByGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const group = c.req.param('group');

    const service = createPageSettingsDefinitionService(c.env);
    const settings = await service.getByGroup(group);

    return formatResponse(c, { settings });
  } catch (error) {
    console.error('Get page settings by group error:', error);
    return format500Error(error as Error);
  }
};
