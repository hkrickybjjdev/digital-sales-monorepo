import { Context } from 'hono';

import { Env } from '../../../types';
import { formatError, formatResponse } from '../../../utils/api-response';
import { getAuthContainer } from '../di/container';
import { forgotPasswordSchema, resetPasswordSchema } from '../models/schemas';

/**
 * Handler for the forgot password endpoint
 * Allows users to request a password reset link via email
 */
export async function forgotPassword(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();

    // Validate request
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return formatError(c, 'Invalid email format', 'ValidationError', 400);
    }

    // Get auth service from container
    const { authService } = getAuthContainer(c.env);

    // Process the forgot password request
    const response = await authService.forgotPassword({ email: body.email });

    // Always return 200 here to prevent email enumeration
    return formatResponse(c, {
      success: response.success,
      message: response.message,
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return formatError(c, 'An error occurred while processing your request', 'ServerError', 500);
  }
}

/**
 * Handler for the reset password endpoint
 * Allows users to set a new password using a valid reset token
 */
export async function resetPassword(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();

    // Validate request
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return formatError(
        c,
        'Invalid reset password data. Please ensure your password is at least 8 characters.',
        'ValidationError',
        400
      );
    }

    // Get auth service from container
    const { authService } = getAuthContainer(c.env);

    // Process the reset password request
    const response = await authService.resetPassword({
      token: body.token,
      password: body.password,
    });

    if (response.success) {
      return formatResponse(c, {
        success: true,
        message: response.message,
      });
    } else {
      return formatError(c, response.message, 'ValidationError', 400);
    }
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return formatError(c, 'An error occurred while processing your request', 'ServerError', 500);
  }
}
