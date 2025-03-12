import { Hono } from 'hono';
import { Env } from '../../types';
import * as authHandlers from './controllers/authHandlers';
import { validateJWT } from './middleware/authMiddleware';

// Create the auth module router
const authModule = new Hono<{ Bindings: Env }>();

// Documentation route
authModule.get('/', (c) => {
  return c.json({
    module: 'Auth',
    endpoints: [
      { path: '/register', method: 'POST', description: 'Register a new user' },
      { path: '/login', method: 'POST', description: 'Login with email and password' },
      { path: '/me', method: 'GET', description: 'Get current user profile' },
      { path: '/logout', method: 'POST', description: 'Log out current user' }
    ]
  });
});

// Public routes
authModule.post('/register', authHandlers.register);
authModule.post('/login', authHandlers.login);

// Protected routes that require JWT authentication
authModule.use('/me', validateJWT);
authModule.get('/me', authHandlers.getCurrentUser);

authModule.use('/logout', validateJWT);
authModule.post('/logout', authHandlers.logout);

export { authModule };