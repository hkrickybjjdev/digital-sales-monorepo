import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError } from '../../../utils/apiResponse';
import { getService } from '../di/container';
import { forgotPasswordSchema, resetPasswordSchema } from '../models/schemas';

/**
 * Handle forgot password requests
 */
export async function forgotPassword(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return formatError(c, 'Invalid request data', 'ValidationError', 400);
    }

    const { email } = result.data;

    // Get the authService using getService
    const authService = getService(c.env, 'authService');

    const resetResult = await authService.forgotPassword({ email });

    if (!resetResult.success) {
      return formatError(c, resetResult.message, 'RequestError', 400);
    }

    return formatResponse(c, { message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return formatError(c, 'An error occurred processing your request', 'InternalServerError', 500);
  }
}

/**
 * Handle password reset with token
 */
export async function resetPassword(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return formatError(c, 'Invalid request data', 'ValidationError', 400);
    }

    const { token, password } = result.data;

    // Get the authService using getService
    const authService = getService(c.env, 'authService');

    const resetResult = await authService.resetPassword({ token, password });

    if (!resetResult.success) {
      return formatError(c, resetResult.message, 'ResetError', 400);
    }

    return formatResponse(c, { message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    return formatError(c, 'An error occurred processing your request', 'InternalServerError', 500);
  }
}
