import { Context } from 'hono';
import { AuthService } from '../services/authService';
import { Env } from '../../../types';

export const getCurrentUserHandler = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get user ID from JWT token (set by the JWT middleware)
    const userId = c.get('jwtPayload').sub;
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const authService = new AuthService(c.env);
    const user = await authService.getUserById(userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({ error: 'Failed to retrieve user information' }, 500);
  }
};