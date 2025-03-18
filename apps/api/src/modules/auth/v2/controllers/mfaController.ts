import { Context } from 'hono';

import { Env } from '../../../../types';
import { formatResponse, formatError, format500Error } from '../../../../utils/apiResponse';

/**
 * MFA verification handler for v2 API
 * Verifies the MFA code provided by the user during login
 */
export async function mfaVerifyHandler(c: Context<{ Bindings: Env }>) {
  try {
    const { tempToken, code, method: _, deviceId } = await c.req.json();

    // Validate input
    if (!tempToken || !code) {
      return formatError(
        c,
        'Temporary token and verification code are required',
        'ValidationError',
        400
      );
    }

    // This is just a sample - in a real implementation, you would:
    // 1. Verify the temporary token is valid and not expired
    // 2. Verify the MFA code is correct for the given user
    // 3. Generate a JWT token if verification is successful

    // Sample implementation for demonstration purposes
    const isCodeValid = code === '123456' || code.length === 6;

    if (!isCodeValid) {
      return formatError(c, 'Invalid verification code', 'InvalidCode', 400);
    }

    // If verification is successful, generate a JWT token
    // In a real implementation, you would sign a proper JWT

    const token = 'jwt_' + Math.random().toString(36).substring(2, 15);

    // Record the successful verification
    // Update the device information if provided

    // Return the authentication token
    return formatResponse(
      c,
      {
        status: 'success',
        message: 'MFA verification successful',
        token: token,
        user: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Sample User',
          mfaEnabled: true,
          mfaVerified: true,
        },
        // Include device information if this is a new device
        deviceInfo: deviceId
          ? {
              id: deviceId,
              name: 'Unknown Device',
              lastLogin: Date.now(),
              trusted: false,
            }
          : null,
      },
      200
    );
  } catch (error) {
    console.error('MFA verification error:', error);
    return format500Error(error as Error);
  }
}
