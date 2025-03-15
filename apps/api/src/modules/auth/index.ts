import { Hono } from 'hono';
import { Env } from '../../types';
import * as authHandlers from './controllers/authHandlers';
import { validateJWT } from './middleware/authMiddleware';
import { formatResponse } from '../../utils/api-response';

// Create the auth module router
const authModule = new Hono<{ Bindings: Env }>();

// Public routes
authModule.post('/register', authHandlers.register);
authModule.post('/login', authHandlers.login);

// Protected routes that require JWT authentication
authModule.use('/me', validateJWT);
authModule.get('/me', authHandlers.getCurrentUser);

authModule.use('/logout', validateJWT);
authModule.post('/logout', authHandlers.logout);

export { authModule };