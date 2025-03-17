import { Context } from 'hono';

import { Env } from '../../../../types';
import { formatResponse, formatError, format500Error } from '../../../../utils/api-response';

/**
 * V2 Get current user handler with enhanced features:
 * - Extended user profile information
 * - MFA status
 * - Connected devices
 * - Account security information
 */
export async function getCurrentUserHandler(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');

    if (!user) {
      return formatError(c, 'User not found', 'ResourceNotFound', 404);
    }

    // This is just a sample - in a real implementation, you would:
    // 1. Fetch the user's complete profile from the database
    // 2. Fetch the user's MFA settings
    // 3. Fetch the user's connected devices
    // 4. Fetch the user's security settings

    // Sample implementation for demonstration purposes

    // Get device information if available
    const deviceId = c.req.header('X-Device-ID');

    // Simulate fetching user's devices
    const devices = [
      {
        id: 'device_456',
        name: 'iPhone 13',
        lastLogin: '2023-03-14T10:23:45Z',
        trusted: true,
        current: deviceId === 'device_456',
      },
      {
        id: 'device_789',
        name: 'MacBook Pro',
        lastLogin: '2023-03-15T08:12:33Z',
        trusted: true,
        current: deviceId === 'device_789',
      },
    ];

    // Return enhanced user profile
    return formatResponse(
      c,
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: {
          avatar: 'https://example.com/avatars/default.png',
          createdAt: '2023-01-15T08:30:00Z',
          lastLogin: '2023-03-15T09:45:22Z',
        },
        security: {
          mfaEnabled: true,
          mfaMethods: ['totp', 'sms'],
          passwordLastChanged: '2023-02-10T14:22:10Z',
          loginAttempts: 0,
        },
        devices: devices,
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: false,
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Get user error:', error);
    return format500Error(error as Error);
  }
}
