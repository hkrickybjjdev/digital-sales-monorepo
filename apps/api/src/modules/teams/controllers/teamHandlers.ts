import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';
import { getTeamsContainer } from '../di/container';
import { createTeamSchema, updateTeamSchema } from '../models/schemas';

// Get all teams for the current user
export const getUserTeams = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;

    const container = getTeamsContainer(c.env);
    const teams = await container.teamService.getUserTeams(userId);

    return formatResponse(c, { teams });
  } catch (error) {
    console.error('Get user teams error:', error);
    return format500Error(error as Error);
  }
};

// Get a single team by ID
export const getTeam = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');

    const container = getTeamsContainer(c.env);

    // Check if the user has access to this team
    const hasAccess = await container.teamService.checkTeamPermission(teamId, userId, [
      'owner',
      'admin',
      'member',
      'viewer',
    ]);
    if (!hasAccess) {
      return formatError(c, 'You do not have access to this team', 'Forbidden', 403);
    }

    const team = await container.teamService.getTeamById(teamId);
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

    const container = getTeamsContainer(c.env);

    try {
      const team = await container.teamService.createTeam(userId, data);
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

    const container = getTeamsContainer(c.env);

    try {
      const team = await container.teamService.updateTeam(teamId, userId, data);
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

    const container = getTeamsContainer(c.env);

    try {
      const result = await container.teamService.deleteTeam(teamId, userId);
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

    const container = getTeamsContainer(c.env);

    try {
      const members = await container.teamService.getTeamMembersWithUserInfo(teamId, userId);
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
