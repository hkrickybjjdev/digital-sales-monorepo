import { Context } from 'hono';
import { Env } from '../../../../types';
import { formatResponse, formatError, format500Error } from '../../../../utils/api-response';

/**
 * V2 Logout handler with enhanced features:
 * - Device-specific logout
 * - Logout from all devices option
 * - Token revocation
 */
export async function logoutHandler(c: Context<{ Bindings: Env }>) {
  try {
    const { logoutAll, deviceId } = await c.req.json();
    
    // Get the current user from context (set by auth middleware)
    const user = c.get('user');
    
    if (!user) {
      return formatError(c, 'User not found', 'ResourceNotFound', 404);
    }
     // Get the authorization token
     const authHeader = c.req.header('Authorization');
     const token = authHeader ? authHeader.split(' ')[1] : null;
     
     // This is just a sample - in a real implementation, you would:
     // 1. Invalidate the JWT token in a token blacklist
     // 2. Remove the session from the database
     // 3. If logoutAll is true, invalidate all tokens for this user
     // 4. If deviceId is provided, only remove that device's session
     
    // Sample implementation for demonstration purposes
    if (logoutAll) {
      // Simulate logging out from all devices
      console.log(`Logging out user ${user.id} from all devices`);
      
      return formatResponse(c, {
        status: 'success',
        message: 'Successfully logged out from all devices',
        loggedOutDevices: user.devices.length
      }, 200);
    } else if (deviceId) {
      // Simulate logging out from a specific device
      console.log(`Logging out user ${user.id} from device ${deviceId}`);
      
      return formatResponse(c, {
        status: 'success',
        message: 'Successfully logged out from the specified device',
        deviceId: deviceId
      }, 200);
    } else {
      // Simulate logging out from the current session
      console.log(`Logging out user ${user.id} from current session`);
      
      return formatResponse(c, {
        status: 'success',
        message: 'Successfully logged out'
      }, 200);
    }
    
  } catch (error) {
    console.error('Logout error:', error);
    return format500Error(error as Error);
  }
}