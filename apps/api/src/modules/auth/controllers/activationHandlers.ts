import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { createAuthService } from '../factory';
import { resendActivationSchema } from '../models/schemas';

/**
 * Handle user account activation via token
 */
export const activateAccount = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get activation token from URL parameter
    const token = c.req.param('token');

    if (!token) {
      return formatError(c, 'Activation token is required', 'ValidationError', 400);
    }

    // Use the getService helper
    const authService = createAuthService(c.env);
    const result = await authService.activateUser(token);

    if (!result.success) {
      return formatError(c, result.message, 'ActivationError', 400);
    }

    return formatResponse(c, result);
  } catch (error) {
    console.error('Activation error:', error);
    return format500Error(error as Error);
  }
};

/**
 * Resend activation email
 */
export const resendActivation = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get request body
    const body = await c.req.json();

    // Validate the input
    const parseResult = resendActivationSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;

    // Use the getService helper
    const authService = createAuthService(c.env);
    const result = await authService.resendActivationEmail(data);

    // Always return a success response to avoid email enumeration
    return formatResponse(c, result);
  } catch (error) {
    console.error('Resend activation error:', error);
    return format500Error(error as Error);
  }
};
