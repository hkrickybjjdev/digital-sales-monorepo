import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { getService } from '../di/container';
import { addTeamMemberSchema, updateTeamMemberSchema } from '../models/schemas';

// Add a member to a team
export const addTeamMember = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');
    const body = await c.req.json();

    // Validate the input
    const parseResult = addTeamMemberSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;
    const teamMemberService = getService(c.env, 'teamMemberService');

    try {
      const member = await teamMemberService.addTeamMember(teamId, userId, data);
      return formatResponse(c, { member }, 201);
    } catch (serviceError) {
      const errorMessage = (serviceError as Error).message;

      if (errorMessage.includes('permission')) {
        return formatError(c, errorMessage, 'Forbidden', 403);
      } else if (errorMessage.includes('maximum')) {
        return formatError(c, errorMessage, 'LimitExceeded', 403);
      } else if (errorMessage.includes('already a member')) {
        return formatError(c, errorMessage, 'ConflictError', 409);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Add team member error:', error);
    return format500Error(error as Error);
  }
};

// Update a team member's role
export const updateTeamMember = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');
    const memberId = c.req.param('memberId');
    const body = await c.req.json();

    // Validate the input
    const parseResult = updateTeamMemberSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;
    const teamMemberService = getService(c.env, 'teamMemberService');

    try {
      const member = await teamMemberService.updateTeamMember(
        teamId,
        memberId,
        userId,
        data
      );
      if (!member) {
        return formatError(c, 'Team member not found', 'ResourceNotFound', 404);
      }

      return formatResponse(c, { member });
    } catch (serviceError) {
      const errorMessage = (serviceError as Error).message;

      if (errorMessage.includes('not found')) {
        return formatError(c, 'Team member not found', 'ResourceNotFound', 404);
      } else if (
        errorMessage.includes('permission') ||
        errorMessage.includes('cannot modify') ||
        errorMessage.includes('last owner')
      ) {
        return formatError(c, errorMessage, 'Forbidden', 403);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Update team member error:', error);
    return format500Error(error as Error);
  }
};

// Remove a team member
export const removeTeamMember = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');
    const memberId = c.req.param('memberId');

    const teamMemberService = getService(c.env, 'teamMemberService');

    try {
      const result = await teamMemberService.removeTeamMember(teamId, memberId, userId);
      if (!result) {
        return formatError(c, 'Team member not found', 'ResourceNotFound', 404);
      }

      return formatResponse(c, { success: true, message: 'Team member removed successfully' });
    } catch (serviceError) {
      const errorMessage = (serviceError as Error).message;

      if (errorMessage.includes('not found')) {
        return formatError(c, 'Team member not found', 'ResourceNotFound', 404);
      } else if (
        errorMessage.includes('permission') ||
        errorMessage.includes('cannot remove') ||
        errorMessage.includes('last owner')
      ) {
        return formatError(c, errorMessage, 'Forbidden', 403);
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Remove team member error:', error);
    return format500Error(error as Error);
  }
};
