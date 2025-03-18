import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { getAuthContainer } from '../di/container';
import { loginSchema, registerSchema } from '../models/schemas';

// Export a single handler function
export const login = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();

    // Validate the input manually
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;

    // Use the DI container
    const container = getAuthContainer(c.env);
    const result = await container.authService.login(data);

    if (result.error) {
      if (result.error === 'Invalid email or password') {
        return formatError(c, result.error, 'Unauthorized', 401);
      } else if (result.error.includes('Account is locked')) {
        return formatError(c, result.error, 'AccountLocked', 403);
      }
      return formatError(c, result.error, 'AuthError', 400);
    }

    return formatResponse(c, result);
  } catch (error) {
    console.error('Login error:', error);
    return format500Error(error as Error);
  }
};

export const logout = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get session ID from JWT payload
    const sessionId = c.get('jwtPayload').sid;
    if (!sessionId) {
      return formatError(c, 'Invalid session', 'InvalidSession', 400);
    }

    // Use the DI container
    const container = getAuthContainer(c.env);
    await container.userRepository.deleteSession(sessionId);

    return formatResponse(c, { success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return format500Error(error as Error);
  }
};

export const register = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();

    // Validate the input manually
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const data = parseResult.data;

    // Use the DI container
    const container = getAuthContainer(c.env);
    const result = await container.authService.register(data);

    if (result.error) {
      if (result.error === 'User with this email already exists') {
        return formatError(c, result.error, 'ConflictError', 409);
      }
      return formatError(c, result.error, 'RegistrationError', 400);
    }

    return formatResponse(c, result, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return format500Error(error as Error);
  }
};

export const getCurrentUser = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get user ID from JWT token (set by the JWT middleware)
    const userId = c.get('jwtPayload').sub;
    if (!userId) {
      return formatError(c, 'User not found', 'ResourceNotFound', 404);
    }

    // Use the DI container
    const container = getAuthContainer(c.env);
    const user = await container.authService.getUserById(userId);

    if (!user) {
      return formatError(c, 'User not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { user });
  } catch (error) {
    console.error('Get current user error:', error);
    return format500Error(error as Error);
  }
};
