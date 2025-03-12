import { Context } from 'hono';
import { AuthService } from '../services/authService';
import { loginSchema } from '../models/types';
import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';

// Export a single handler function
export const loginHandler = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();
    
    // Validate the input manually
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }
    
    const data = parseResult.data;
    const authService = new AuthService(c.env);
    
    const result = await authService.login(data);
    return formatResponse(c, result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid email or password') {
      return formatError(c, error.message, 'Unauthorized', 401);
    }
    
    console.error('Login error:', error);
    return format500Error(error as Error);
  }
};