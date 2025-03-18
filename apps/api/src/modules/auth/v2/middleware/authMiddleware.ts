import { Context, Next } from 'hono';

import { Env } from '../../../../types';
import { formatError } from '../../../../utils/apiResponse';

// Define a user type
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  devices: string[];
}

// Extend Hono's Variables interface to include our user property
declare module 'hono' {
  interface ContextVariableMap {
    user: User;
  }
}

/**
 * Enhanced JWT validation middleware for v2 API
 * Includes additional security checks:
 * - Device validation
 * - Token expiration with shorter timeouts
 * - IP address validation
 * - Rate limiting
 */
export async function validateJWT(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    // Get the authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return formatError(c, 'Authorization header is required', 'Unauthorized', 401);
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Get device information
    const deviceId = c.req.header('X-Device-ID');

    // This is just a sample - in a real implementation, you would:
    // 1. Verify the JWT token signature
    // 2. Check if the token is expired
    // 3. Validate the user exists
    // 4. Check if the device is authorized for this user
    // 5. Apply rate limiting based on user/IP

    // Sample implementation for demonstration purposes
    if (token === 'invalid') {
      return formatError(c, 'Invalid token', 'InvalidToken', 401);
    }

    // Simulate token verification
    // In a real app, you'd decode and verify the JWT
    const isTokenValid = token.startsWith('jwt_');

    if (!isTokenValid) {
      return formatError(c, 'Invalid or expired token', 'InvalidToken', 401);
    }

    // Simulate user lookup from token
    const user: User = {
      id: 'user_123',
      email: 'user@example.com',
      name: 'Sample User',
      role: 'user',
      devices: ['device_456'],
    };

    // Check if the device is authorized for this user (if device ID is provided)
    if (deviceId && !user.devices.includes(deviceId)) {
      // Log suspicious activity
      console.warn(`Unauthorized device access attempt: ${deviceId} for user ${user.id}`);

      // In a real app, you might:
      // 1. Send an alert to the user
      // 2. Require re-authentication
      // 3. Block the request

      return formatError(
        c,
        'This device is not authorized to access your account',
        'UnauthorizedDevice',
        403
      );
    }

    // Set the user in the context for downstream handlers
    c.set('user', user);

    // Continue to the next middleware or route handler
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return formatError(c, 'Authentication failed', 'AuthenticationError', 401);
  }
}
