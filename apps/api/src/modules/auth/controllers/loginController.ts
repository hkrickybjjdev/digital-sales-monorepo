import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AuthService } from '../services/authService';
import { loginSchema } from '../models/types';
import { Env } from '../../../types';

export const loginHandler = [
  // Validate request body
  zValidator('json', loginSchema),
  
  // Handle login request
  async (c: Context<{ Bindings: Env }>) => {
    try {
      const authService = new AuthService(c.env);
      const data = c.req.valid('json');
      
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
];