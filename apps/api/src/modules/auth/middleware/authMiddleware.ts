import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

import { Env } from '../../../types';
import { formatError } from '../../../utils/api-response';
import { getAuthContainer } from '../di/container';

/*
TODO:
currently other modules directly depend on the auth module's validateJWT middleware, which would make it difficult to extract modules into separate workers later. Let's fix this by:

Creating a JWT validation service that can be accessed via API endpoints
Modifying the auth middleware to use HTTP calls instead of direct module dependencies
Setting up proper interfaces for authentication that can work across workers
*/

export async function validateJWT(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    // Extract JWT from Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return formatError(c, 'Invalid token format', 'Unauthorized', 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify JWT
    const payload = await verify(token, c.env.JWT_SECRET);

    // Check if session exists and is valid using DI container
    const container = getAuthContainer(c.env);
    const session = await container.userRepository.getSessionById(payload.sid);

    if (!session) {
      return formatError(c, 'Session not found', 'Unauthorized', 401);
    }

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      await container.userRepository.deleteSession(session.id);
      return formatError(c, 'Session expired', 'Unauthorized', 401);
    }

    // Add payload to context for use in subsequent handlers
    c.set('jwtPayload', payload);

    // Continue to next handler
    await next();
  } catch (error) {
    console.error('JWT validation error:', error);
    return formatError(c, 'Invalid or expired token', 'Unauthorized', 401);
  }
}
