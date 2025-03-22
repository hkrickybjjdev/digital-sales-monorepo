import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { createAuthService, createUserRepository } from '../factory';
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

    // Create the auth service directly in the handler
    const authService = createAuthService(c.env);
    const result = await authService.login(data);

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

    // Create user repository directly in the handler
    const userRepository = createUserRepository(c.env);
    await userRepository.deleteSession(sessionId);

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

    // Create the auth service directly in the handler
    const authService = createAuthService(c.env);
    const result = await authService.register(data);

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

    // Create the auth service directly in the handler
    const authService = createAuthService(c.env);
    const user = await authService.getUserById(userId);

    if (!user) {
      return formatError(c, 'User not found', 'ResourceNotFound', 404);
    }

    return formatResponse(c, { user });
  } catch (error) {
    console.error('Get current user error:', error);
    return format500Error(error as Error);
  }
};

export const validateToken = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Extract JWT from Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return formatError(c, 'Invalid token format', 'Unauthorized', 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Create the auth service
    const authService = createAuthService(c.env);
    
    // Validate the token without side effects
    const result = await authService.validateToken(token);

    if (!result.valid) {
      return formatError(c, result.error || 'Invalid token', 'Unauthorized', 401);
    }

    // Return success with minimal information
    return formatResponse(c, { 
      valid: true,
      user: result.payload?.sub ? { id: result.payload.sub } : undefined
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return format500Error(error as Error);
  }
};
