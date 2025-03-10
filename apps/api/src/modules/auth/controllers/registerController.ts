import { Context } from 'hono';
import { AuthService } from '../services/authService';
import { registerSchema } from '../models/types';
import { Env } from '../../../types';

// Export a single handler function
export const registerHandler = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();
    
    // Validate the input manually
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: 'Invalid input', details: parseResult.error.format() }, 400);
    }
    
    const data = parseResult.data;
    const authService = new AuthService(c.env);
    
    const result = await authService.register(data);
    return c.json(result, 201); // 201 Created status
  } catch (error) {
    if (error instanceof Error && error.message === 'User with this email already exists') {
      return c.json({ error: error.message }, 409); // 409 Conflict status
    }
    
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
}