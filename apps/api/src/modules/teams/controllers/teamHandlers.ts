import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { getService } from '../di/container';
import { createTeamSchema, updateTeamSchema } from '../models/schemas';

// Get all teams for the current user
export const getTeams = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamService = getService(c.env, 'teamService');
    
    const teams = await teamService.getUserTeams(userId);
    return formatResponse(c, { teams });
  } catch (error) {
    console.error('Error getting teams:', error);
    return formatError(c, 'Failed to get teams', 'InternalServerError', 500);
  }
}

// Get a single team by ID
export const getTeam = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');

    const teamService = getService(c.env, 'teamService');

    // Check if the user has access to this team
    const hasAccess = await teamService.checkTeamPermission(teamId, userId, [
      'owner',
      'admin',
      'member',
      'viewer',
    ]);
    if (!hasAccess) {
      return formatError(c, 'You do not have access to this team', 'Forbidden', 403);
    }

    const team = await teamService.getTeamById(teamId);
    if (!team) {
      return formatError(c, 'Team not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { team });
  } catch (error) {
    console.error('Get team error:', error);
    return format500Error(error as Error);
  }
};

// Create a new team
export const createTeam = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const body = await c.req.json();

    // Validate the input
    const parseResult = createTeamSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;

    const teamService = getService(c.env, 'teamService');

    try {
      const team = await teamService.createTeam(userId, data);
      return formatResponse(c, { team }, 201);
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('maximum')) {
        return formatError(c, (serviceError as Error).message, 'LimitExceeded', 403);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Create team error:', error);
    return format500Error(error as Error);
  }
};

// Update a team
export const updateTeam = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');
    const body = await c.req.json();

    // Validate the input
    const parseResult = updateTeamSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;

    const teamService = getService(c.env, 'teamService');

    try {
      const team = await teamService.updateTeam(teamId, userId, data);
      if (!team) {
        return formatError(c, 'Team not found', 'ResourceNotFound', 404);
      }

      return formatResponse(c, { team });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('permission')) {
        return formatError(c, (serviceError as Error).message, 'Forbidden', 403);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Update team error:', error);
    return format500Error(error as Error);
  }
};

// Delete a team
export const deleteTeam = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');

    const teamService = getService(c.env, 'teamService');

    try {
      const result = await teamService.deleteTeam(teamId, userId);
      if (!result) {
        return formatError(c, 'Team not found', 'ResourceNotFound', 404);
      }

      return formatResponse(c, { success: true, message: 'Team deleted successfully' });
    } catch (serviceError) {
      if (
        (serviceError as Error).message.includes('permission') ||
        (serviceError as Error).message.includes('owner')
      ) {
        return formatError(c, (serviceError as Error).message, 'Forbidden', 403);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Delete team error:', error);
    return format500Error(error as Error);
  }
};

// Get team members
export const getTeamMembers = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');

    const teamService = getService(c.env, 'teamService');

    try {
      const members = await teamService.getTeamMembersWithUserInfo(teamId, userId);
      return formatResponse(c, { members });
    } catch (serviceError) {
      if ((serviceError as Error).message.includes('permission')) {
        return formatError(c, (serviceError as Error).message, 'Forbidden', 403);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Get team members error:', error);
    return format500Error(error as Error);
  }
};
