import { Context } from 'hono';
import { GroupService } from '../services/groupService';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';
import { Env } from '../../../types';
import { 
  createGroupSchema, 
  updateGroupSchema 
} from '../models/schemas';


export const createGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();
    
    // Validate the request body using Zod schema
    const result = createGroupSchema.safeParse(body);
    
    if (!result.success) {
      return formatError(c, 'Invalid group data: ' + result.error.message, 'ValidationError', 400);
    }
    
    const groupService = new GroupService(c.env.DB);
    const group = await groupService.createGroup(result.data);
    return formatResponse(c, { group }, 201);
  } catch (error) {
    console.error('Error creating group:', error);
    return format500Error(error as Error);
  }
}

export const getGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const groupService = new GroupService(c.env.DB);
    const group = await groupService.getGroupById(id);

    if (!group) {
      return formatError(c, 'Group not found', 'NotFound', 404);
    }

    return formatResponse(c, { group });
  } catch (error) {
    console.error('Error getting group:', error);
    return format500Error(error as Error);
  }
}

export const updateGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate the request body using Zod schema
    const result = updateGroupSchema.safeParse(body);
    
    if (!result.success) {
      return formatError(c, 'Invalid group data: ' + result.error.message, 'ValidationError', 400);
    }
    
    if (Object.keys(result.data).length === 0) {
      return formatError(c, 'No update data provided', 'BadRequest', 400);
    }
    
    const groupService = new GroupService(c.env.DB);
    const group = await groupService.updateGroup(id, result.data);
    
    if (!group) {
      return formatError(c, 'Group not found', 'NotFound', 404);
    }
    
    return formatResponse(c, { group });
  } catch (error) {
    console.error('Error updating group:', error);
    return format500Error(error as Error);
  }
}

export const deleteGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const groupService = new GroupService(c.env.DB);
    const deleted = await groupService.deleteGroup(id);

    if (!deleted) {
      return formatError(c, 'Group not found or could not be deleted', 'NotFound', 404);
    }

    return formatResponse(c, { message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return format500Error(error as Error);
  }
}

export const listGroupsByOrganization = async (c: Context<{ Bindings: Env }>) => {
  try {
    const organizationId = c.req.param('organizationId');
    const groupService = new GroupService(c.env.DB);
    const groups = await groupService.listGroupsByOrganization(organizationId);
    return formatResponse(c, { groups });
  } catch (error) {
    console.error('Error listing groups by organization:', error);
    return format500Error(error as Error);
  }
}

export const getUsersInGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const groupId = c.req.param('id');
    const groupService = new GroupService(c.env.DB);
    const users = await groupService.getUsersInGroup(groupId);
    return formatResponse(c, { users });
  } catch (error) {
    console.error('Error getting users in group:', error);
    return format500Error(error as Error);
  }
}

export const assignUserToGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const groupId = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.userId) {
      return formatError(c, 'User ID is required', 'BadRequest', 400);
    }
    
    const groupService = new GroupService(c.env.DB);
    const success = await groupService.assignUserToGroup(body.userId, groupId);
    
    if (!success) {
      return formatError(c, 'Failed to assign user to group', 'BadRequest', 400);
    }
    
    return formatResponse(c, { message: 'User assigned to group successfully' });
  } catch (error) {
    console.error('Error assigning user to group:', error);
    return format500Error(error as Error);
  }
}

export const removeUserFromGroup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');
    const groupService = new GroupService(c.env.DB);
    const success = await groupService.removeUserFromGroup(userId);
    
    if (!success) {
      return formatError(c, 'Failed to remove user from group', 'BadRequest', 400);
    }
    
    return formatResponse(c, { message: 'User removed from group successfully' });
  } catch (error) {
    console.error('Error removing user from group:', error);
    return format500Error(error as Error);
  }
}
