import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AuthService } from '../services/authService';
import { registerSchema } from '../models/types';
import { Env } from '../../../types';

export const registerHandler = [
  // Validate request body
  zValidator('json', registerSchema),
  
  // Handle registration request
  async (c: Context<{ Bindings: Env }>) => {
    try {
      const authService = new AuthService(c.env);
      const data = c.req.valid('json');
      
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
];