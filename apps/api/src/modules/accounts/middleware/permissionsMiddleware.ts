import { Context, Next } from 'hono';
import { RoleService } from '../services/roleService';
import { OrganizationService } from '../services/organizationService';
import { formatError } from '../../../utils/api-response';
import { Env } from '../../../types';

// Middleware to check if the user has admin permissions
export const requireAdminPermission = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    // Get the user ID from the authenticated session
    const userId = c.get('user')?.id;
    
    if (!userId) {
      return formatError(c, 'Authentication required', 'Unauthorized', 401);
    }
    
    const roleService = new RoleService(c.env.DB);
    const permissions = await roleService.getUserPermissions(userId);
    
    if (!permissions.canManageOrganization) {
      return formatError(c, 'Admin permission required', 'Forbidden', 403);
    }
    
    await next();
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return formatError(c, 'Server error', 'InternalServerError', 500);
  }
};

// Middleware to check if the user has user management permissions
export const requireUserManagementPermission = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    const userId = c.get('user')?.id;
    
    if (!userId) {
      return formatError(c, 'Authentication required', 'Unauthorized', 401);
    }
    
    const roleService = new RoleService(c.env.DB);
    const permissions = await roleService.getUserPermissions(userId);
    
    if (!permissions.canManageUsers) {
      return formatError(c, 'User management permission required', 'Forbidden', 403);
    }
    
    await next();
  } catch (error) {
    console.error('Error checking user management permissions:', error);
    return formatError(c, 'Server error', 'InternalServerError', 500);
  }
};

// Middleware to check if the user has subscription management permissions
export const requireSubscriptionManagementPermission = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    const userId = c.get('user')?.id;
    
    if (!userId) {
      return formatError(c, 'Authentication required', 'Unauthorized', 401);
    }
    
    const roleService = new RoleService(c.env.DB);
    const permissions = await roleService.getUserPermissions(userId);
    
    if (!permissions.canManageSubscriptions) {
      return formatError(c, 'Subscription management permission required', 'Forbidden', 403);
    }
    
    await next();
  } catch (error) {
    console.error('Error checking subscription management permissions:', error);
    return formatError(c, 'Server error', 'InternalServerError', 500);
  }
};

// Middleware to check if the user belongs to the specified organization
export const requireOrganizationMembership = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    const userId = c.get('user')?.id;
    const organizationId = c.req.param('organizationId') || c.req.query('organizationId');
    
    if (!userId) {
      return formatError(c, 'Authentication required', 'Unauthorized', 401);
    }
    
    if (!organizationId) {
      return formatError(c, 'Organization ID is required', 'BadRequest', 400);
    }
    
    // Use OrganizationService to check if the user belongs to the organization
    const organizationService = new OrganizationService(c.env.DB);
    const isMember = await organizationService.isUserInOrganization(userId, organizationId);
    
    if (!isMember) {
      return formatError(c, 'You do not have access to this organization', 'Forbidden', 403);
    }
    
    await next();
  } catch (error) {
    console.error('Error checking organization membership:', error);
    return formatError(c, 'Server error', 'InternalServerError', 500);
  }
};