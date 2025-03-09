import { Context } from 'hono';
import { UserRepository } from '../models/userRepository';
import { Env } from '../../../types';

export const logoutHandler = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get session ID from JWT payload
    const sessionId = c.get('jwtPayload').sid;
    if (!sessionId) {
      return c.json({ error: 'Invalid session' }, 400);
    }
    
    // Delete the session from database
    const userRepository = new UserRepository(c.env);
    await userRepository.deleteSession(sessionId);
    
    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Failed to log out' }, 500);
  }
};