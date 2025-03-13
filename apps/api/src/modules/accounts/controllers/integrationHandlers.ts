import { Context } from 'hono';
import { AuthIntegration } from '../integrations/authIntegration';
import { formatResponse, format500Error, formatError } from '../../../utils/api-response';
import { Env } from '../../../types';


export const handleUserRegistration = async (c: Context<{ Bindings: Env }>) => {
  try {
    const { userId, isEnterprise = false } = await c.req.json();

    if (!userId) {
      return formatError(c, 'User ID is required', 'BadRequest', 400);
    }

    const authIntegration = new AuthIntegration(c.env.DB);
    const result = await authIntegration.onUserRegistration(userId, isEnterprise);

    return formatResponse(c, {
      message: 'User onboarding completed successfully',
      ...result
    }, 201);
  } catch (error) {
    console.error('Error handling user registration:', error);
    return format500Error(error as Error);
  }
}

export const handleUserUpdate = async (c: Context<{ Bindings: Env }>) => {
  try {
    const { userId, userData } = await c.req.json();

    if (!userId || !userData) {
      return formatError(c, 'User ID and user data are required', 'BadRequest', 400);
    }

    const authIntegration = new AuthIntegration(c.env.DB);
    const success = await authIntegration.onUserUpdate(userId, userData);

    if (!success) {
      return formatError(c, 'Failed to update user', 'BadRequest', 400);
    }

    return formatResponse(c, { message: 'User updated successfully' });
  } catch (error) {
    console.error('Error handling user update:', error);
    return format500Error(error as Error);
  }
}

export const handleUserDeletion = async (c: Context<{ Bindings: Env }>) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return formatError(c, 'User ID is required', 'BadRequest', 400);
    }

    const authIntegration = new AuthIntegration(c.env.DB);
    const success = await authIntegration.onUserDeletion(userId);

    if (!success) {
      return formatError(c, 'Failed to process user deletion', 'BadRequest', 400);
    }

    return formatResponse(c, { message: 'User deletion processed successfully' });
  } catch (error) {
    console.error('Error handling user deletion:', error);
    return format500Error(error as Error);
  }
}
