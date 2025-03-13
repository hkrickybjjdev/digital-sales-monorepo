import { Context } from 'hono';
import { OrganizationService } from '../services/organizationService';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';
import { Env } from '../../../types';
import { 
  createOrganizationSchema, 
  updateOrganizationSchema 
} from '../models/schemas';


export const createOrganization = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();
    
    // Validate the request body using Zod schema
    const result = createOrganizationSchema.safeParse(body);
    
    if (!result.success) {
      return formatError(c, 'Invalid organization data: ' + result.error.message, 'ValidationError', 400);
    }
    
    const organizationService = new OrganizationService(c.env.DB);
    const organization = await organizationService.createOrganization(result.data);
    return formatResponse(c, { organization }, 201);
  } catch (error) {
    console.error('Error creating organization:', error);
    return format500Error(error as Error);
  }
}

export const getOrganization = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const organizationService = new OrganizationService(c.env.DB);
    const organization = await organizationService.getOrganizationById(id);

    if (!organization) {
      return formatError(c, 'Organization not found', 'NotFound', 404);
    }

    return formatResponse(c, { organization });
  } catch (error) {
    console.error('Error getting organization:', error);
    return format500Error(error as Error);
  }
}

export const getOrganizationWithGroups = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const organizationService = new OrganizationService(c.env.DB);
    const organization = await organizationService.getOrganizationWithGroups(id);

    if (!organization) {
      return formatError(c, 'Organization not found', 'NotFound', 404);
    }

    return formatResponse(c, { organization });
  } catch (error) {
    console.error('Error getting organization with groups:', error);
    return format500Error(error as Error);
  }
}

export const updateOrganization = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate the request body using Zod schema
    const result = updateOrganizationSchema.safeParse(body);
    
    if (!result.success) {
      return formatError(c, 'Invalid organization data: ' + result.error.message, 'ValidationError', 400);
    }
    
    if (Object.keys(result.data).length === 0) {
      return formatError(c, 'No update data provided', 'BadRequest', 400);
    }
    
    const organizationService = new OrganizationService(c.env.DB);
    const organization = await organizationService.updateOrganization(id, result.data);
    
    if (!organization) {
      return formatError(c, 'Organization not found', 'NotFound', 404);
    }
    
    return formatResponse(c, { organization });
  } catch (error) {
    console.error('Error updating organization:', error);
    return format500Error(error as Error);
  }
}

export const deleteOrganization = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const organizationService = new OrganizationService(c.env.DB);
    const deleted = await organizationService.deleteOrganization(id);

    if (!deleted) {
      return formatError(c, 'Organization not found or could not be deleted', 'NotFound', 404);
    }

    return formatResponse(c, { message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return format500Error(error as Error);
  }
}

export const listOrganizations = async (c: Context<{ Bindings: Env }>) => {
  try {
    const organizationService = new OrganizationService(c.env.DB);
    const organizations = await organizationService.listOrganizations();
    return formatResponse(c, { organizations });
  } catch (error) {
    console.error('Error listing organizations:', error);
    return format500Error(error as Error);
  }
}
