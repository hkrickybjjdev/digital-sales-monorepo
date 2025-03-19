import { Context } from 'hono';

import { RequestContext } from '../database/sqlDatabase';

/**
 * Extract RequestContext information from Hono Context
 * This extracts user context information for audit logging
 */
export function getRequestContext(c: Context): RequestContext {
  let userId: string | undefined = undefined;

  // Extract userId from JWT token if it exists
  try {
    const jwtPayload = c.get('jwtPayload');
    if (jwtPayload && jwtPayload.sub) {
      userId = jwtPayload.sub;
    }
  } catch (error) {
    // If there's an error extracting userId, continue without it
    console.error('Error extracting userId from JWT', error);
  }

  // Get the IP address
  const ipAddress =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For') ||
    c.req.header('X-Real-IP') ||
    'unknown';

  // Get the User-Agent
  const userAgent = c.req.header('User-Agent') || 'unknown';

  // Get or create sessionId
  const sessionId = c.req.header('X-Session-ID');
  if (!sessionId) {
    // You could generate a session ID here if needed
    // For now we'll leave it undefined
  }

  return {
    userId,
    ipAddress,
    userAgent,
    sessionId,
  };
}

/**
 * Example of using RequestContext in a controller
 */
export async function exampleController(c: Context) {
  const requestContext = getRequestContext(c);

  // Use the request context when calling repository methods
  // Example:
  // const userRepository = new UserRepository(c.env);
  // await userRepository.createUser(userData, requestContext);

  return c.json({ success: true });
}
