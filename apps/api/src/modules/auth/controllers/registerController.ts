import { Context } from 'hono';
import { AuthService } from '../services/authService';
import { registerSchema } from '../models/types';
import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';

// Export a single handler function
export const registerHandler = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();
    
    // Validate the input manually
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }
    
    const data = parseResult.data;
    const authService = new AuthService(c.env);
    
    const result = await authService.register(data);
    return formatResponse(c, result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'User with this email already exists') {
      return formatError(c, error.message, 'ConflictError', 409);
    }
    
    console.error('Registration error:', error);
    return format500Error(error as Error);
  }
};