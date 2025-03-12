import { Context } from 'hono';
import { Env } from '../../../types';
import { RegistrationService } from '../services/RegistrationService';
import { 
  CreateRegistrationRequestSchema,
  Registration
} from '../models/schemas';
import { formatResponse, formatError, formatPaginatedResponse, format500Error } from '../../../utils/api-response';

// Helper function to serialize Registration to JSON-safe object
function serializeRegistration(registration: Registration) {
  return {
    ...registration,
    registeredAt: registration.registeredAt.toString(),
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

    const registrationService = new RegistrationService(c.env.DB);
    const { registration, error } = await registrationService.createRegistration(shortId, result.data);
    
    if (error) {
      return formatError(c, error, 'RegistrationError', 400);
    }
    
    if (!registration) {
      return formatError(c, 'Failed to create registration', 'InternalServerError', 500);
    }

    return formatResponse(c, serializeRegistration(registration), 201);
  } catch (error) {
    console.error('Error creating registration:', error);
    return format500Error(error as Error);
  }
}

export const listRegistrations = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    const limit = Number(c.req.query('limit') || '100');
    const offset = Number(c.req.query('offset') || '0');
    
    const registrationService = new RegistrationService(c.env.DB);
    const { registrations, total, hasMore } = await registrationService.getRegistrations(pageId, userId, limit, offset);
    
    // Create a URL object for pagination
    const url = new URL(c.req.url);
    const page = Math.floor(offset / limit) + 1;
    
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
}

export const exportRegistrations = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const pageId = c.req.param('pageId');
    
    const registrationService = new RegistrationService(c.env.DB);
    const csvContent = await registrationService.exportRegistrationsAsCsv(pageId, userId);
    
    // Set headers for CSV download
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="registrations-${pageId}.csv"`);
    
    return c.text(csvContent);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    return format500Error(error as Error);
  }
} 