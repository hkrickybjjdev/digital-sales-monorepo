import { Context } from 'hono';
import { Env } from '../../../types';
import { 
  CreateRegistrationRequestSchema,
  Registration
} from '../models/schemas';
import { formatResponse, formatError, formatPaginatedResponse, format500Error } from '../../../utils/api-response';
import { getPagesContainer } from '../di/container';

// Helper function to serialize Registration to JSON-safe object
function serializeRegistration(registration: Registration) {
  return {
    ...registration,
    customFields: registration.customFields || {}
  };
}

export const createRegistration = async (c: Context<{ Bindings: Env }>) => {
  try {
    const shortId = c.req.param('shortId');
    const body = await c.req.json();

    // Validate request with Zod
    const result = CreateRegistrationRequestSchema.safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid registration data', 'ValidationError', 400);
    }

    const container = getPagesContainer(c.env);
    const { registration, error } = await container.registrationService.createRegistration(shortId, result.data);
    
    if (!registration) {
      // Handle specific error cases
      if (error === 'Page not found') {
        return formatError(c, 'Page not found', 'ResourceNotFound', 404);
      } else if (error === 'Page is not active') {
        return formatError(c, 'Page is not active', 'PageInactive', 400);
      } else if (error === 'Page has expired') {
        return formatError(c, 'Page has expired', 'PageExpired', 400);
      } else if (error === 'Page is not yet launched') {
        return formatError(c, 'Page is not yet available', 'PageNotLaunched', 400);
      } else if (error?.includes('maximum capacity')) {
        return formatError(c, 'Registration limit reached', 'RegistrationLimitReached', 400);
      } else {
        return formatError(c, error || 'Failed to create registration', 'InternalServerError', 500);
      }
    }

    // Track conversion without waiting for the result
    container.pageCacheService.incrementConversions(registration.pageId, shortId)
      .catch(error => console.error('Error tracking conversion:', error));

    return formatResponse(c, serializeRegistration(registration), 201);
  } catch (error) {
    console.error('Registration creation error:', error);
    return format500Error(error as Error);
  }
};

export const listRegistrations = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    
    // Get pagination params from query
    const limit = Number(c.req.query('limit') || 100);
    const page = Number(c.req.query('page') || 1);
    const offset = (page - 1) * limit;
    
    const container = getPagesContainer(c.env);
    
    // First verify page ownership
    const pageExists = await container.pageService.getPageById(pageId);
    if (!pageExists || pageExists.userId !== userId) {
      return formatError(c, 'Page not found or access denied', 'ResourceNotFound', 404);
    }
    
    const { registrations, total } = await container.registrationService.getRegistrations(
      pageId, 
      userId,
      limit,
      offset
    );
    
    // Generate pagination URL
    const url = new URL(c.req.url);
    
    return formatPaginatedResponse(
      c,
      registrations.map(reg => serializeRegistration(reg)),
      total,
      page,
      limit,
      url
    );
  } catch (error) {
    console.error('Error listing registrations:', error);
    return format500Error(error as Error);
  }
};

export const exportRegistrations = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    
    const container = getPagesContainer(c.env);
    
    // First verify page ownership
    const pageExists = await container.pageService.getPageById(pageId);
    if (!pageExists || pageExists.userId !== userId) {
      return formatError(c, 'Page not found or access denied', 'ResourceNotFound', 404);
    }
    
    const csvContent = await container.registrationService.exportRegistrationsAsCsv(pageId, userId);
    
    // Set headers for CSV download
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="registrations-${pageId}.csv"`);
    
    return c.text(csvContent);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    return format500Error(error as Error);
  }
};