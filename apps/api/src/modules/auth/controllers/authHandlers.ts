import { Context } from 'hono';
import { loginSchema, registerSchema } from '../models/schemas';
import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';
import { getAuthContainer } from '../di/container';

// Export a single handler function
export const login = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();
    
    // Validate the input manually
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }
    
    const data = parseResult.data;
    
    // Use the DI container
    const container = getAuthContainer(c.env);
    const result = await container.authService.login(data);
    
    return formatResponse(c, result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid email or password') {
      return formatError(c, error.message, 'Unauthorized', 401);
    }
    
    console.error('Login error:', error);
    return format500Error(error as Error);
  }
};

export const logout = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get session ID from JWT payload
    const sessionId = c.get('jwtPayload').sid;
    if (!sessionId) {
      return c.json({ error: 'Invalid session' }, 400);
    }
    
    // Use the DI container
    const container = getAuthContainer(c.env);
    await container.userRepository.deleteSession(sessionId);
    
    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Failed to log out' }, 500);
  }
};

export const register = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the request body
    const body = await c.req.json();
    
    // Validate the input manually
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }
    
    const data = parseResult.data;
    
    // Use the DI container
    const container = getAuthContainer(c.env);
    const result = await container.authService.register(data);
    
    // Call the accounts module to set up the user
    try {
      // Construct the base URL from the request
      const url = new URL(c.req.url);
      // Reset the path to create the proper base URL
      url.pathname = '/api/v1/accounts/integrations/user-registration';
      
      // Internal API call to accounts integration
      const registrationResponse = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + result.token
        },
        body: JSON.stringify({
          userId: result.user.id,
          isEnterprise: false // default to false, can be configured based on registration data if needed
        })
      });
      
      if (!registrationResponse.ok) {
        console.error('Failed to complete user onboarding', await registrationResponse.text());
        // We don't want to fail the registration if this fails
        // Just log the error and continue
      } else {
        console.log('User onboarding completed successfully');
      }
    } catch (integrationError) {
      console.error('Error calling user registration integration:', integrationError);
      // We don't fail the registration if the integration call fails
    }
    
    return formatResponse(c, result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'User with this email already exists') {
      return formatError(c, error.message, 'ConflictError', 409);
    }
    
    console.error('Registration error:', error);
    return format500Error(error as Error);
  }
};

export const getCurrentUser = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get user ID from JWT token (set by the JWT middleware)
    const userId = c.get('jwtPayload').sub;
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Use the DI container
    const container = getAuthContainer(c.env);
    const user = await container.authService.getUserById(userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({ error: 'Failed to retrieve user information' }, 500);
  }
};