import { Hono } from 'hono';
import { Env } from '../../types';
import { loginHandler } from './controllers/loginController';
import { registerHandler } from './controllers/registerController';
import { getCurrentUserHandler } from './controllers/userController';
import { logoutHandler } from './controllers/logoutController';
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
authModule.post('/register', registerHandler);
authModule.post('/login', loginHandler);

// Protected routes that require JWT authentication
authModule.use('/me', validateJWT);
authModule.get('/me', getCurrentUserHandler);

authModule.use('/logout', validateJWT);
authModule.post('/logout', logoutHandler);

export { authModule };