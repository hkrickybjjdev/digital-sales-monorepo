import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { Env } from '../../../types';

export async function validateJWT(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    // Extract JWT from Authorization header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Invalid token format' }, 401);
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify JWT
    const payload = await verify(token, c.env.JWT_SECRET);
    
    // Add payload to context for use in subsequent handlers
    c.set('jwtPayload', payload);
    
    // Continue to next handler
    await next();
  } catch (error) {
    console.error('JWT validation error:', error);
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }
}