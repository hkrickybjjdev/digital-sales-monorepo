import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { createExpirationService } from '../factory';
import { expirationSettingSchema } from '../models/schemas';

// Create a new expiration setting
export const createExpirationSetting = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();

    // Validate the input
    const parseResult = expirationSettingSchema
      .omit({ id: true, createdAt: true, updatedAt: true })
      .safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;
    const expirationService = createExpirationService(c.env);

    try {
      const expirationSetting = await expirationService.createExpirationSetting(
        data.expirationType,
        data.expiresAtDatetime,
        data.durationSeconds,
        data.expirationAction,
        data.redirectUrl
      );
      return formatResponse(c, { expirationSetting }, 201);
    } catch (serviceError) {
      return formatError(c, (serviceError as Error).message, 'ServiceError', 400);
    }
  } catch (error) {
    console.error('Create expiration setting error:', error);
    return format500Error(error as Error);
  }
};

// Get an expiration setting by ID
export const getExpirationSettingById = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return formatError(c, 'Invalid expiration setting ID', 'ValidationError', 400);
    }

    const expirationService = createExpirationService(c.env);
    const expirationSetting = await expirationService.getExpirationSettingById(id);

    if (!expirationSetting) {
      return formatError(c, 'Expiration setting not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { expirationSetting });
  } catch (error) {
    console.error('Get expiration setting by ID error:', error);
    return format500Error(error as Error);
  }
};

// Update an expiration setting
export const updateExpirationSetting = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return formatError(c, 'Invalid expiration setting ID', 'ValidationError', 400);
    }

    const body = await c.req.json();

    // Validate the updates
    const updateSchema = expirationSettingSchema
      .partial()
      .omit({ id: true, createdAt: true, updatedAt: true });
    const parseResult = updateSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const updates = parseResult.data;
    const expirationService = createExpirationService(c.env);

    try {
      const expirationSetting = await expirationService.updateExpirationSetting(id, updates);

      if (!expirationSetting) {
        return formatError(c, 'Expiration setting not found', 'ResourceNotFound', 404);
      }

      return formatResponse(c, { expirationSetting });
    } catch (serviceError) {
      return formatError(c, (serviceError as Error).message, 'ServiceError', 400);
    }
  } catch (error) {
    console.error('Update expiration setting error:', error);
    return format500Error(error as Error);
  }
};

// Delete an expiration setting
export const deleteExpirationSetting = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return formatError(c, 'Invalid expiration setting ID', 'ValidationError', 400);
    }

    const expirationService = createExpirationService(c.env);

    try {
      const success = await expirationService.deleteExpirationSetting(id);
      if (!success) {
        return formatError(c, 'Failed to delete expiration setting', 'ServiceError', 500);
      }
      return formatResponse(c, {
        success: true,
        message: 'Expiration setting deleted successfully',
      });
    } catch (serviceError) {
      return formatError(c, (serviceError as Error).message, 'ServiceError', 400);
    }
  } catch (error) {
    console.error('Delete expiration setting error:', error);
    return format500Error(error as Error);
  }
};

// Manually process expirations - should be called from a scheduled task in a real app
export const processExpirations = async (c: Context<{ Bindings: Env }>) => {
  try {
    const expirationService = createExpirationService(c.env);
    await expirationService.processExpirations();
    return formatResponse(c, { success: true, message: 'Expirations processed successfully' });
  } catch (error) {
    console.error('Process expirations error:', error);
    return format500Error(error as Error);
  }
};
