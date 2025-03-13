import { Context } from 'hono';
import { RoleService } from '../services/roleService';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';
import { Env } from '../../../types';
import { assignUserRoleSchema } from '../models/schemas';


export const listRoles = async (c: Context<{ Bindings: Env }>) => {
  try {
    const roleService = new RoleService(c.env.DB);
    const roles = await roleService.listRoles();
    return formatResponse(c, { roles });
  } catch (error) {
    console.error('Error listing roles:', error);
    return format500Error(error as Error);
  }
}

export const getRoleById = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const roleService = new RoleService(c.env.DB);
    const role = await roleService.getRoleById(id);

    if (!role) {
      return formatError(c, 'Role not found', 'NotFound', 404);
    }

    return formatResponse(c, { role });
  } catch (error) {
    console.error('Error getting role:', error);
    return format500Error(error as Error);
  }
}

export const getUserRoles = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');

    if (!userId) {
      return formatError(c, 'User ID is required', 'BadRequest', 400);
    }

    const roleService = new RoleService(c.env.DB);
    const roles = await roleService.getUserRoles(userId);
    return formatResponse(c, { roles });
  } catch (error) {
    console.error('Error getting user roles:', error);
    return format500Error(error as Error);
  }
}

export const assignRoleToUser = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();
    
    // Validate the request body using Zod schema
    const result = assignUserRoleSchema.safeParse(body);
    
    if (!result.success) {
      return formatError(c, 'Invalid role assignment data: ' + result.error.message, 'ValidationError', 400);
    }

    const roleService = new RoleService(c.env.DB);
    const assigned = await roleService.assignRoleToUser(result.data.userId, result.data.roleId);

    if (!assigned) {
      return formatError(c, 'Failed to assign role to user', 'BadRequest', 400);
    }

    return formatResponse(c, { message: 'Role assigned to user successfully' });
  } catch (error) {
    console.error('Error assigning role to user:', error);
    return format500Error(error as Error);
  }
}

export const removeRoleFromUser = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');
    const roleId = c.req.param('roleId');

    if (!userId || !roleId) {
      return formatError(c, 'User ID and Role ID are required', 'BadRequest', 400);
    }

    const roleService = new RoleService(c.env.DB);
    const removed = await roleService.removeRoleFromUser(userId, roleId);

    if (!removed) {
      return formatError(c, 'Failed to remove role from user', 'BadRequest', 400);
    }

    return formatResponse(c, { message: 'Role removed from user successfully' });
  } catch (error) {
    console.error('Error removing role from user:', error);
    return format500Error(error as Error);
  }
}

export const getUserPermissions = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');

    if (!userId) {
      return formatError(c, 'User ID is required', 'BadRequest', 400);
    }

    const roleService = new RoleService(c.env.DB);
    const permissions = await roleService.getUserPermissions(userId);
    return formatResponse(c, { permissions });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return format500Error(error as Error);
  }
}

export const getUsersByRole = async (c: Context<{ Bindings: Env }>) => {
  try {
    const roleId = c.req.param('roleId');

    if (!roleId) {
      return formatError(c, 'Role ID is required', 'BadRequest', 400);
    }

    const roleService = new RoleService(c.env.DB);
    const userIds = await roleService.getUsersByRole(roleId);
    return formatResponse(c, { userIds });
  } catch (error) {
    console.error('Error getting users by role:', error);
    return format500Error(error as Error);
  }
}
