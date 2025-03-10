import { Context } from 'hono';
import { AuthService } from '../services/authService';
import { loginSchema } from '../models/types';
import { Env } from '../../../types';

// Export a single handler function
export const loginHandler = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();
    
    // Validate the input manually
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: 'Invalid input', details: parseResult.error.format() }, 400);
    }
    
    const data = parseResult.data;
    const authService = new AuthService(c.env);
    
    const result = await authService.login(data);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid email or password') {
      return c.json({ error: error.message }, 401);
    }
    
    console.error('Login error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
}