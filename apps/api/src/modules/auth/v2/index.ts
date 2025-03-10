import { Hono } from 'hono';
import { Env } from '../../../types';
import { loginHandler } from './controllers/loginController';
import { registerHandler } from './controllers/registerController';
import { getCurrentUserHandler } from './controllers/userController';
import { logoutHandler } from './controllers/logoutController';
import { validateJWT } from './middleware/authMiddleware';
import { mfaVerifyHandler } from './controllers/mfaController';

// Create the auth module router for v2
const authModuleV2 = new Hono<{ Bindings: Env }>();

// Documentation route
authModuleV2.get('/', (c) => {
  return c.json({
    module: 'Auth v2',
    version: '2.0.0',
    endpoints: [
      { path: '/register', method: 'POST', description: 'Register a new user with enhanced validation' },
      { path: '/login', method: 'POST', description: 'Login with email and password, supports MFA' },
      { path: '/mfa/verify', method: 'POST', description: 'Verify MFA code during login' },
      { path: '/me', method: 'GET', description: 'Get current user profile with extended information' },
      { path: '/logout', method: 'POST', description: 'Log out current user from all devices' }
    ],
    changes: [
      'Added multi-factor authentication support',
      'Enhanced user profile with additional fields',
      'Improved security with device tracking',
      'Added support for social login providers'
    ]
  });
});

// Public routes
authModuleV2.post('/register', registerHandler);
authModuleV2.post('/login', loginHandler);
authModuleV2.post('/mfa/verify', mfaVerifyHandler);

// Protected routes that require JWT authentication
authModuleV2.use('/me', validateJWT);
authModuleV2.get('/me', getCurrentUserHandler);

authModuleV2.use('/logout', validateJWT);
authModuleV2.post('/logout', logoutHandler);

export { authModuleV2 }; 